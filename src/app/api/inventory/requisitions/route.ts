import { NextResponse } from "next/server";
import {
  getInventoryData,
  createWardRequisition,
  dispenseRequisitionFEFO,
} from "@/server/lib/store";

export async function GET() {
  const data = getInventoryData();
  return NextResponse.json({ ok: true, requisitions: data.requisitions });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "DISPENSE") {
      const result = dispenseRequisitionFEFO({
        reqId: body.reqId,
        actorUsername: body.actorUsername || "ภก. ชัยวัฒน์ คลังยากลาง (FEFO Verified)",
      });
      return NextResponse.json({ ok: true, ...result });
    }

    const result = createWardRequisition({
      wardId: body.wardId,
      itemCode: body.itemCode,
      requestedQty: Number(body.requestedQty),
      requestedBy: body.requestedBy || "พว. พยาบาลหัวหน้าเวร (MOPH-PID-2FA)",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
