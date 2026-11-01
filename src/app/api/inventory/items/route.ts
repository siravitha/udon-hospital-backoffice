import { NextResponse } from "next/server";
import { getInventoryData, receiveInventoryLot } from "@/server/lib/store";

export async function GET() {
  const data = getInventoryData();
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = receiveInventoryLot({
      itemCode: body.itemCode,
      lotNo: body.lotNo,
      expiryDate: body.expiryDate,
      qty: Number(body.qty),
      unitCost: Number(body.unitCost),
      location: body.location || "CENTRAL-STORE-A1",
      actorUsername: body.actorUsername || "เภสัชกรคลังยากลาง (MOPH-PID-2FA)",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
