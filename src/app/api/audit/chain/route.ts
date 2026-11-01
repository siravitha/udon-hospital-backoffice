import { NextResponse } from "next/server";
import { loadStore, verifyAuditHashChain } from "@/server/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = loadStore();
  const verification = verifyAuditHashChain(state.auditLogs);
  return NextResponse.json({
    ok: true,
    verification,
    logs: [...state.auditLogs].reverse(),
  });
}
