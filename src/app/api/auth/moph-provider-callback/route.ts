// GET /api/auth/moph-provider-callback — OIDC code exchange + id_token verify
// Asserts: issuer, hcode (5 หลัก) === HOSPITAL_HCODE, council_code, nonce, exp
import { NextRequest, NextResponse } from "next/server";
import {
  MophAuthError,
  verifyMophIdToken,
  completeTwoFactorSession,
  newCodeVerifier,
} from "@/server/auth/moph-provider-id.service";

export const runtime = "nodejs";

const TOKEN_ENDPOINT = process.env.MOPH_TOKEN_URL ?? "https://id.moph.go.th/oauth/token";
const CLIENT_ID = process.env.MOPH_CLIENT_ID ?? "hos-backoffice";
const REDIRECT_URI =
  process.env.MOPH_REDIRECT_URI ?? "http://localhost:3000/api/auth/moph-provider-callback";

// NOTE: In production, state/nonce are stored server-side (Redis) on authorize
// request. This handler reads them from the query for the minimal viable flow.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const nonce = url.searchParams.get("nonce");

  if (!code || !state || !nonce) {
    return NextResponse.redirect(new URL("/login?error=callback_incomplete", req.url));
  }

  try {
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        // code_verifier resolved from server-side state store in production
        code_verifier: state /* placeholder; real verifier from Redis */,
      }),
    });
    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/login?error=token_exchange", req.url));
    }
    const tok = (await tokenRes.json()) as { id_token: string };

    const verified = await verifyMophIdToken(tok.id_token, nonce);
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // Resolve userId from step1Token in production state store; simplified here.
    const userId = "00000000-0000-0000-0000-000000000000";

    await completeTwoFactorSession({
      step1Token: state,
      userId,
      mophProviderId: verified.mophProviderId,
      hcode: verified.hcode,
      councilCode: verified.councilCode,
      ip,
    });

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (e) {
    const msg = e instanceof MophAuthError ? e.code : "INTERNAL";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url));
  }
}
