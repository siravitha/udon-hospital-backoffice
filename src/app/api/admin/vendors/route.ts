import { NextResponse } from "next/server";
import { getVendors, createVendor, updateVendor, deleteVendor } from "@/server/lib/vendors";

export async function GET() {
  try {
    const vendors = getVendors();
    return NextResponse.json({ ok: true, vendors, count: vendors.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = createVendor(body);
    return NextResponse.json({ ok: true, vendor: result.vendor, vendors: result.all }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.vendorCode) {
      return NextResponse.json({ ok: false, error: "Missing vendorCode" }, { status: 400 });
    }
    const result = updateVendor(body.vendorCode, body);
    return NextResponse.json({ ok: true, vendor: result.vendor, vendors: result.all });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ ok: false, error: "Missing vendorCode parameter" }, { status: 400 });
    }
    const result = deleteVendor(code);
    return NextResponse.json({ ok: true, removed: result.removed, vendors: result.all });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
