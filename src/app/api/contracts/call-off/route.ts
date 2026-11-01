import { NextRequest, NextResponse } from "next/server";
import { loadStore, issueBlanketCallOff } from "@/server/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = loadStore();
  return NextResponse.json({
    ok: true,
    contracts: state.blanketContracts,
    callOffOrders: state.callOffOrders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = issueBlanketCallOff({
      contractId: String(body.contractId || "PA-2569-01"),
      amount: Number(body.amount || 0),
      createdBy: String(body.createdBy || "เจ้าหน้าที่พัสดุ ชำนาญการ"),
      expectedVersion: body.expectedVersion !== undefined ? Number(body.expectedVersion) : undefined,
    });
    const state = loadStore();
    return NextResponse.json({
      ok: true,
      order: result.order,
      contract: result.contract,
      contracts: state.blanketContracts,
      callOffOrders: state.callOffOrders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "CALL_OFF_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
