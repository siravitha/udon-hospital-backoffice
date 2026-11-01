import { NextResponse } from "next/server";
import { getTrialBalance } from "@/server/lib/accounting";

export async function GET() {
  try {
    const data = getTrialBalance();
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
