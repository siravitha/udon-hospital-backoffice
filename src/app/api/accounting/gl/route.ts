import { NextResponse } from "next/server";
import { getJournalEntries, createJournalEntry } from "@/server/lib/accounting";

export async function GET() {
  try {
    const entries = getJournalEntries();
    return NextResponse.json({ ok: true, entries, count: entries.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = createJournalEntry(body);
    return NextResponse.json({ ok: true, entry: result.entry, entries: result.all }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
