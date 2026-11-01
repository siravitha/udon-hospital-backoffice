import { NextResponse } from "next/server";
import { getHospitalReports } from "@/server/lib/reports";

export async function GET() {
  try {
    const data = getHospitalReports();
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
