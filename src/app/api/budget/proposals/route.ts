import { NextResponse } from "next/server";
import {
  getAnnualBudgetProposals,
  createAnnualBudgetProposal,
  reviewAnnualBudgetProposal,
} from "@/server/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fyParam = url.searchParams.get("fy");
  const fy = fyParam ? Number(fyParam) : 2570;

  const proposals = getAnnualBudgetProposals(fy);

  // Compute summary stats
  const totalRequested = proposals.reduce((s, p) => s + p.requestedAmount, 0);
  const totalApproved = proposals.reduce((s, p) => s + (p.approvedAmount || 0), 0);
  const totalPrevYear = proposals.reduce((s, p) => s + p.previousYearActualAmount, 0);

  return NextResponse.json({
    ok: true,
    fiscalYear: fy,
    proposals,
    summary: {
      totalRequested,
      totalApproved,
      totalPrevYear,
      count: proposals.length,
      approvedCount: proposals.filter((p) => p.status === "APPROVED" || p.status === "REDUCED").length,
      pendingCount: proposals.filter((p) => p.status === "SUBMITTED" || p.status === "REVIEWING").length,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "REVIEW") {
      const result = reviewAnnualBudgetProposal({
        proposalId: body.proposalId,
        action: body.reviewAction || "APPROVE",
        approvedAmount: body.approvedAmount ? Number(body.approvedAmount) : undefined,
        reviewedBy: body.reviewedBy || "คณะกรรมการกลั่นกรองงบประมาณ (MOPH-PID-2FA)",
        reviewNotes: body.reviewNotes || "ผ่านการกลั่นกรองและตัดยอดตามกรอบวินัยการเงินการคลัง",
      });
      return NextResponse.json({ ok: true, ...result });
    }

    const result = createAnnualBudgetProposal({
      fiscalYear: Number(body.fiscalYear || 2570),
      departmentCode: body.departmentCode || "MED",
      departmentName: body.departmentName || "กลุ่มภารกิจด้านการแพทย์",
      expenseCategory: body.expenseCategory || "OPERATING",
      projectName: body.projectName,
      requestedAmount: Number(body.requestedAmount),
      previousYearActualAmount: Number(body.previousYearActualAmount || 0),
      justification: body.justification || "",
      urgency: body.urgency || "NORMAL",
      submittedBy: body.submittedBy || "หัวหน้ากลุ่มงาน (MOPH Provider 2FA Verified)",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
