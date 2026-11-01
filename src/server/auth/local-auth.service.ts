// ============================================================================
// L1 Local Auth — Argon2id (m=64MiB, t=3, p=4) + Rate limit 5/min + Lockout 15min
// Redis counters: rl:{ip}:{username}, lockout:{username}
// ============================================================================
import * as argon2 from "argon2";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { pool } from "../lib/pool";

export const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
};

export interface Step1Token {
  token: string;
  userId: string;
  expiresAt: Date; // 10 minutes
}

const RATE_LIMIT_MAX = 5;      // 5 attempts / minute
const RATE_LIMIT_WINDOW_MS = 60_000;
const LOCKOUT_MS = 15 * 60_000;
const FAIL_THRESHOLD = 10;     // 10 fails → lockout 15 min
const STEP1_TTL_MS = 10 * 60_000;

// Minimal Redis client adapter (ioredis-compatible interface) with in-memory fallback
type RedisLike = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: "EX", seconds?: number): Promise<unknown>;
};
const memStore = new Map<string, { val: string; exp?: number }>();
const defaultMemRedis: RedisLike = {
  async incr(key: string) {
    const cur = await this.get(key);
    const next = (cur ? Number(cur) : 0) + 1;
    memStore.set(key, { val: String(next), exp: memStore.get(key)?.exp });
    return next;
  },
  async expire(key: string, seconds: number) {
    const entry = memStore.get(key);
    if (entry) entry.exp = Date.now() + seconds * 1000;
  },
  async get(key: string) {
    const entry = memStore.get(key);
    if (!entry) return null;
    if (entry.exp && Date.now() > entry.exp) {
      memStore.delete(key);
      return null;
    }
    return entry.val;
  },
  async set(key: string, value: string, _mode?: "EX", seconds?: number) {
    memStore.set(key, { val: value, exp: seconds ? Date.now() + seconds * 1000 : undefined });
  },
};
let redisClient: RedisLike | null = defaultMemRedis;
export function bindRedis(client: RedisLike) {
  redisClient = client;
}
const redis = (): RedisLike => {
  return redisClient ?? defaultMemRedis;
};

export class AuthError extends Error {
  constructor(
    public code: "RATE_LIMITED" | "LOCKED_OUT" | "INVALID_CREDENTIALS",
    message: string,
  ) {
    super(message);
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}

async function enforceRateLimit(ip: string, username: string) {
  const rlKey = `rl:${ip}:${username}`;
  const n = await redis().incr(rlKey);
  if (n === 1) await redis().expire(rlKey, RATE_LIMIT_WINDOW_MS / 1000);
  if (n > RATE_LIMIT_MAX) throw new AuthError("RATE_LIMITED", "Too many attempts, retry next minute.");
}

async function enforceLockout(username: string) {
  const until = await redis().get(`lockout:${username}`);
  if (until && Date.now() < Number(until)) {
    throw new AuthError("LOCKED_OUT", `Account locked until ${new Date(Number(until)).toISOString()}`);
  }
}

async function recordFailure(username: string) {
  const n = await redis().incr(`fail:${username}`);
  await redis().expire(`fail:${username}`, 300);
  if (n >= FAIL_THRESHOLD) {
    await redis().set(`lockout:${username}`, String(Date.now() + LOCKOUT_MS), "EX", LOCKOUT_MS / 1000);
  }
}

export async function loginStep1(
  username: string,
  password: string,
  ip: string,
): Promise<Step1Token> {
  await enforceRateLimit(ip, username);
  await enforceLockout(username);

  const { rows } = await pool.query(
    `SELECT user_id, password_hash FROM users_and_moph_providers WHERE username = $1`,
    [username],
  );
  if (rows.length === 0) {
    // Constant-time-ish: still run argon2 against a dummy hash
    await argon2.verify(
      "$argon2id$v=19$m=65536,t=3,p=4$cDCTs2b7YIYmTQZTQZTQZA$ZmFrbnVsdW5keWFpbA",
      password,
    ).catch(() => undefined);
    await recordFailure(username);
    throw new AuthError("INVALID_CREDENTIALS", "Invalid credentials.");
  }

  const ok = await verifyPassword(rows[0].password_hash, password);
  if (!ok) {
    await recordFailure(username);
    throw new AuthError("INVALID_CREDENTIALS", "Invalid credentials.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + STEP1_TTL_MS);
  await pool.query(
    `INSERT INTO auth_sessions_audit (session_id, user_id, auth_layer, ip_address)
     VALUES (gen_random_uuid(), $1, 'L1_LOCAL', $2::inet)`,
    [rows[0].user_id, ip],
  );
  return { token, userId: rows[0].user_id, expiresAt };
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
