import { NextRequest, NextResponse } from "next/server";
import {
  loadStore,
  createDisbursementVoucher,
  FundBudgetRow,
  computeThreeWayMatch,
  VendorCategory,
} from "@/server/lib/store";
import { runSharedFixtureCheck } from "@/server/engines/three-way-match-tax.engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = loadStore();
  const sharedFixture = runSharedFixtureCheck();
  return NextResponse.json({
    ok: true,
    sharedFixture,
    vouchers: state.vouchers,
    funds: state.funds,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoiceInclVat = Number(body.invoiceInclVat ?? 1_070_000);
    const penaltyAmount = Number(body.penaltyAmount ?? 50_000);
    const vendorCategory = (body.vendorCategory || "PRIVATE_CORP") as VendorCategory;

    if (body.previewOnly) {
      const calc = computeThreeWayMatch({
        poAmountInclVat: invoiceInclVat,
        inspectionAcceptedInclVat: invoiceInclVat,
        invoiceAmountInclVat: invoiceInclVat,
        vendorCategory,
        penaltyAmount,
        hasCommitteeObjection: Boolean(body.hasCommitteeObjection ?? false),
      });
      return NextResponse.json({ ok: true, preview: calc });
    }

    const voucher = createDisbursementVoucher({
      poNumber: String(body.poNumber || "PO-69-4012"),
      vendorName: String(body.vendorName || "บริษัท สยามเมดิคอล ซัพพลาย จำกัด (มหาชน)"),
      vendorCategory,
      fundCode: (body.fundCode || "GOV_BUDGET") as FundBudgetRow["fundCode"],
      invoiceInclVat,
      penaltyAmount,
      actorUsername: String(body.actorUsername || "finance.somchai (หัวหน้าฝ่ายการเงิน)"),
    });
    const state = loadStore();
    return NextResponse.json({
      ok: true,
      voucher,
      vouchers: state.vouchers,
      funds: state.funds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "THREE_WAY_MATCH_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
