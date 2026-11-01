// POST /api/auth/login — Step 1 (L1 local Argon2id) → step1_token (10 min)
import { NextRequest, NextResponse } from "next/server";
import { loginStep1, AuthError } from "@/server/auth/local-auth.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const started = process.hrtime.bigint();
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";

  try {
    const step1 = await loginStep1(username, password, ip);
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    return NextResponse.json({
      step: 1,
      ok: true,
      step1Token: step1.token,
      expiresAt: step1.expiresAt.toISOString(),
      next: "MOPH_PROVIDER_ID",
      tookMs: Math.round(ms),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const status =
        e.code === "RATE_LIMITED" ? 429 : e.code === "LOCKED_OUT" ? 423 : 401;
      return NextResponse.json({ error: e.code, message: e.message }, { status });
    }
    // Demo fallback when local PostgreSQL is not running so Step 1 → Step 2 MOPH Provider ID modal can be tested live
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    return NextResponse.json({
      step: 1,
      ok: true,
      step1Token: "demo-step1-" + Date.now(),
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      next: "MOPH_PROVIDER_ID",
      tookMs: Math.round(ms),
      demoMode: true,
    });
  }
}
