import { NextRequest, NextResponse } from "next/server";
import { loadStore, recordReceivingInspection } from "@/server/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = loadStore();
  return NextResponse.json({
    ok: true,
    inspections: state.inspections,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const row = recordReceivingInspection({
      poNumber: String(body.poNumber || "PO-69-4012"),
      drugName: String(body.drugName || "Human Albumin 20% 50mL Infusion"),
      lotNumber: String(body.lotNumber || "LOT-2026-11B"),
      expiryDate: String(body.expiryDate || "2028-12-31"),
      coldChainTempC: Number(body.coldChainTempC ?? 4.5),
      coaVerified: Boolean(body.coaVerified ?? true),
      fdaRegNo: String(body.fdaRegNo || "1C 45/2564 (NC)"),
      committeeQuorumCount: Number(body.committeeQuorumCount ?? 3),
      objectionRaised: Boolean(body.objectionRaised ?? false),
      objectionReason: body.objectionReason ? String(body.objectionReason) : undefined,
      inspectionDaysTaken: Number(body.inspectionDaysTaken ?? 2),
      actorUsername: String(body.actorUsername || "ประธานกรรมการตรวจรับพัสดุ (PAdES-LTV)"),
    });
    const state = loadStore();
    return NextResponse.json({
      ok: true,
      inspection: row,
      inspections: state.inspections,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "INSPECTION_RECORD_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
