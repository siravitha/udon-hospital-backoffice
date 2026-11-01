import { NextRequest, NextResponse } from "next/server";
import {
  loadStore,
  createPurchaseRequisition,
  approvePrEncumbrance,
  FundBudgetRow,
  PurchaseRequisitionRow,
} from "@/server/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = loadStore();
  return NextResponse.json({
    ok: true,
    prs: state.prs,
    funds: state.funds,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "APPROVE_ENCUMBRANCE") {
      const updated = approvePrEncumbrance(
        String(body.prNumber || ""),
        String(body.actorUsername || "budget.director")
      );
      const state = loadStore();
      return NextResponse.json({
        ok: true,
        pr: updated,
        prs: state.prs,
        funds: state.funds,
      });
    }

    const pr = createPurchaseRequisition({
      department: String(body.department || "clinical-pharma"),
      fundCode: (body.fundCode || "HOSPITAL_MAINTENANCE") as FundBudgetRow["fundCode"],
      title: String(body.title || "จัดซื้อยาและเวชภัณฑ์ทางการแพทย์"),
      drugGenericName: body.drugGenericName ? String(body.drugGenericName) : undefined,
      qty: Number(body.qty || 1),
      unitPrice: Number(body.unitPrice || 0),
      nlemCapUnitPrice: Number(body.nlemCapUnitPrice || body.unitPrice || 0),
      procurementType: (body.procurementType || "NORMAL") as PurchaseRequisitionRow["procurementType"],
      requestedBy: String(body.requestedBy || "ภญ. ดร.ศิริพร รักษ์ไทย"),
      donorPurposeTag: body.donorPurposeTag ? String(body.donorPurposeTag) : undefined,
    });
    const state = loadStore();
    return NextResponse.json({
      ok: true,
      pr,
      prs: state.prs,
      funds: state.funds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "CREATE_PR_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
