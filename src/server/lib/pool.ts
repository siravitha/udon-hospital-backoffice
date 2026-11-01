// Shared PostgreSQL pool (single instance per process for Next.js route handlers)
import { Pool } from "pg";

const globalForDb = globalThis as unknown as { __hosPool?: Pool };

export const pool: Pool =
  globalForDb.__hosPool ??
  new Pool({
    host: process.env.PG_HOST ?? "127.0.0.1",
    port: Number(process.env.PG_PORT ?? 5432),
    database: process.env.PG_DATABASE ?? "hos_backoffice",
    user: process.env.PG_USER ?? "hos_admin",
    password: process.env.PG_PASSWORD ?? "",
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__hosPool = pool;

export const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
export const HOSPITAL_HCODE = process.env.HOSPITAL_HCODE ?? "00000"; // 5 หลัก — ต้องตรงกับ hcode ของ IdP
export const PENALTY_DAILY_RATE = 0.005;   // 0.5%/day ของ contract value
export const PENALTY_CAP = 0.10;           // ceiling 10% → PENALTY_CAPPED
export const STANDSTILL_WORKING_DAYS = 7;
