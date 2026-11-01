import { NextResponse } from "next/server";
import { getChartOfAccounts, createChartOfAccount } from "@/server/lib/accounting";

export async function GET() {
  try {
    const accounts = getChartOfAccounts();
    return NextResponse.json({ ok: true, accounts, count: accounts.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = createChartOfAccount(body);
    return NextResponse.json({ ok: true, account: result.account, accounts: result.all }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
