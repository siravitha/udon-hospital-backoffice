import { NextRequest, NextResponse } from "next/server";
import { loadStore, recordConsignmentUsage } from "@/server/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = loadStore();
  return NextResponse.json({
    ok: true,
    consignments: state.consignments,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headerKey = req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key");
    const idempotencyKey = String(headerKey || body.idempotencyKey || `HIS-OR-${Date.now()}`);
    const result = recordConsignmentUsage({
      idempotencyKey,
      hisCaseRef: String(body.hisCaseRef || `OR-CASE-${Date.now().toString().slice(-6)}`),
      patientHn: String(body.patientHn || "HN6900184"),
      patientAn: String(body.patientAn || "AN6900921"),
      implantCode: String(body.implantCode || "ORTHO-TI-PLATE-09"),
      implantName: String(body.implantName || "Titanium Locking Plate System"),
      serialNo: String(body.serialNo || `SN-TI-${Date.now().toString().slice(-5)}`),
      lotNo: String(body.lotNo || "LOT-2026-11A"),
      qty: Number(body.qty || 1),
      unitPrice: Number(body.unitPrice || 48500),
      surgeonProviderId: String(body.surgeonProviderId || "MOPH-PID-1100499281"),
    });
    const state = loadStore();
    return NextResponse.json({
      ok: true,
      deduplicated: result.deduplicated,
      usage: result.row,
      consignments: state.consignments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "CONSIGNMENT_WEBHOOK_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
