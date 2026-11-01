"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AnnualBudgetProposal {
  proposalId: string;
  proposalNo: string;
  fiscalYear: number;
  departmentCode: string;
  departmentName: string;
  expenseCategory: "OPERATING" | "INVESTMENT_EQUIPMENT" | "BUILDING_CONSTRUCTION" | "DEPRECIATION_REPLACE";
  projectName: string;
  requestedAmount: number;
  previousYearActualAmount: number;
  justification: string;
  urgency: "NORMAL" | "HIGH" | "CRITICAL";
  status: "SUBMITTED" | "REVIEWING" | "APPROVED" | "REDUCED" | "REJECTED";
  approvedAmount?: number;
  submittedBy: string;
  reviewedBy?: string;
  reviewNotes?: string;
  submittedAt: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  OPERATING: "1. งบดำเนินงาน (ยา/เวชภัณฑ์/บริการ)",
  INVESTMENT_EQUIPMENT: "2. งบลงทุน - ครุภัณฑ์การแพทย์",
  BUILDING_CONSTRUCTION: "3. งบลงทุน - ที่ดินและสิ่งก่อสร้าง",
  DEPRECIATION_REPLACE: "4. งบค่าเสื่อมราคา สปสช. (ทดแทน)",
};

const DEPARTMENTS = [
  { code: "MED", name: "กลุ่มภารกิจด้านการแพทย์ (อายุรกรรม/ศัลยกรรม)" },
  { code: "NURSE", name: "กลุ่มภารกิจด้านการพยาบาล (ICU/วอร์ด)" },
  { code: "PHARMA", name: "กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค" },
  { code: "XRAY", name: "กลุ่มงานรังสีวิทยาและการแพทย์ขั้นสูง" },
  { code: "PRIMARY", name: "กลุ่มภารกิจด้านบริการปฐมภูมิและเวชกรรมสังคม" },
  { code: "MEMS", name: "กลุ่มงานวิศวกรรมการแพทย์และซ่อมบำรุง" },
  { code: "ADMIN", name: "กลุ่มภารกิจด้านอำนวยการและยุทธศาสตร์" },
];

export default function AnnualBudgetProposalsPage() {
  const [fiscalYear, setFiscalYear] = useState(2570);
  const [proposals, setProposals] = useState<AnnualBudgetProposal[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form states
  const [deptCode, setDeptCode] = useState("MED");
  const [category, setCategory] = useState<any>("INVESTMENT_EQUIPMENT");
  const [projectName, setProjectName] = useState("โครงการจัดซื้อเครื่องสลายนิ่วในไตด้วยคลื่นกระแทก (ESWL Machine)");
  const [reqAmount, setReqAmount] = useState(18500000);
  const [prevAmount, setPrevAmount] = useState(0);
  const [urgency, setUrgency] = useState<any>("HIGH");
  const [justification, setJustification] = useState(
    "เพื่อรองรับผู้ป่วยโรคนิ่วในระบบทางเดินปัสสาวะในเขตสุขภาพ ลดระยะเวลารอคอยการผ่าตัดจาก 6 เดือนเหลือไม่เกิน 2 สัปดาห์"
  );

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budget/proposals?fy=${fiscalYear}`);
      const data = await res.json();
      if (data.ok) {
        setProposals(data.proposals || []);
        setSummary(data.summary || {});
      }
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const deptObj = DEPARTMENTS.find((d) => d.code === deptCode);
    const res = await fetch("/api/budget/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fiscalYear,
        departmentCode: deptCode,
        departmentName: deptObj?.name || deptCode,
        expenseCategory: category,
        projectName,
        requestedAmount: Number(reqAmount),
        previousYearActualAmount: Number(prevAmount),
        justification,
        urgency,
        submittedBy: "หัวหน้ากลุ่มงาน (MOPH Provider 2FA Verified)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "ไม่สามารถยื่นคำของบประมาณได้" });
      return;
    }
    setProposals(data.proposals || []);
    setBanner({
      type: "ok",
      text: `ยื่นคำของบประมาณ ${data.proposal.proposalNo} ประจำปีงบประมาณ ${fiscalYear} สำเร็จ! วงเงิน ${Number(data.proposal.requestedAmount).toLocaleString()} บาท บันทึกเข้าสู่กระบวนการกลั่นกรองเรียบร้อย`,
    });
    // Reset form
    setProjectName("");
    setReqAmount(0);
  }

  async function handleReviewProposal(proposalId: string, action: "APPROVE" | "REDUCE" | "REJECT") {
    setBanner(null);
    const res = await fetch("/api/budget/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REVIEW",
        proposalId,
        reviewAction: action,
        reviewedBy: "คณะกรรมการกลั่นกรองงบประมาณ (Step-Up 2FA)",
        reviewNotes: action === "APPROVE"
          ? "ผ่านการพิจารณาเห็นชอบวงเงินตามความจำเป็นเร่งด่วน"
          : action === "REDUCE"
          ? "ปรับลดวงเงินร้อยละ 15 เพื่อให้อยู่ในกรอบวินัยการเงินการคลัง"
          : "ไม่อนุมัติเนื่องจากซ้ำซ้อนกับโครงการปีงบประมาณก่อนหน้า",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "ดำเนินการพิจารณาไม่สำเร็จ" });
      return;
    }
    setProposals(data.proposals || []);
    setBanner({
      type: "ok",
      text: `บันทึกผลการพิจารณาคำของบประมาณ ${data.proposal.proposalNo} (${data.proposal.status}) สำเร็จ! วงเงินอนุมัติ: ${Number(data.proposal.approvedAmount || 0).toLocaleString()} บาท`,
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-[#1E3A8A] text-white rounded-xl p-6 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <span>🏛️ HOS-BACKOFFICE ENTERPRISE</span>
              <span>•</span>
              <span>ANNUAL BUDGETING PROPOSAL HUB</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">
              ระบบจัดทำและยื่นคำของบประมาณรายจ่ายประจำปี (ปีงบประมาณ พ.ศ. {fiscalYear})
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              รวบรวมคำของบประมาณ 6 กลุ่มภารกิจ • จัดหมวดหมู่งบดำเนินงาน/งบลงทุน • กลั่นกรองวงเงินก่อนเสนอกระทรวงและสำนักงบประมาณ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="bg-white/15 text-white border border-white/30 rounded-lg px-3 py-2 text-sm font-bold"
            >
              <option value={2570} className="text-slate-900">ปีงบประมาณ พ.ศ. 2570</option>
              <option value={2569} className="text-slate-900">ปีงบประมาณ พ.ศ. 2569</option>
              <option value={2571} className="text-slate-900">ปีงบประมาณ พ.ศ. 2571</option>
            </select>
            <Link
              href="/workspace/budget"
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
            >
              💰 กลับหน้าควบคุม 5 กองทุน
            </Link>
          </div>
        </header>

        {/* KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">ยอดรวมคำของบประมาณปี {fiscalYear}</div>
            <div className="text-xl font-extrabold text-[#1E3A8A] tabular-nums mt-1">
              ฿{Number(summary.totalRequested || 0).toLocaleString("th-TH")}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              ทั้งหมด {summary.count || 0} โครงการ/รายการ
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">วงเงินผ่านการกลั่นกรองแล้ว</div>
            <div className="text-xl font-extrabold text-emerald-700 tabular-nums mt-1">
              ฿{Number(summary.totalApproved || 0).toLocaleString("th-TH")}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">
              ✅ อนุมัติแล้ว {summary.approvedCount || 0} รายการ
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">รอคณะกรรมการกลั่นกรอง</div>
            <div className="text-xl font-extrabold text-amber-700 tabular-nums mt-1">
              {summary.pendingCount || 0} รายการ
            </div>
            <div className="text-xs text-blue-800 font-semibold mt-1">
              ⏳ กำลังอยู่ระหว่างการพิจารณา
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">เปรียบเทียบงบจริงปีที่ผ่านมา</div>
            <div className="text-xl font-extrabold text-slate-800 tabular-nums mt-1">
              ฿{Number(summary.totalPrevYear || 0).toLocaleString("th-TH")}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {summary.totalPrevYear > 0 ? (
                <span className="text-emerald-700 font-bold">
                  +
                  {(
                    ((summary.totalRequested - summary.totalPrevYear) / summary.totalPrevYear) *
                    100
                  ).toFixed(1)}
                  % อัตราการเติบโต
                </span>
              ) : (
                "● ข้อมูลฐานปีงบก่อนหน้า"
              )}
            </div>
          </div>
        </section>

        {banner && (
          <div
            className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between ${
              banner.type === "ok"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            <span>{banner.text}</span>
            <button onClick={() => setBanner(null)} className="text-xs underline ml-4">
              ปิด
            </button>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submit Proposal Form */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#1E3A8A]">
              📝 แบบฟอร์มยื่นคำของบประมาณรายจ่าย (พ.ศ. {fiscalYear})
            </h2>
            <p className="text-xs text-slate-500">
              สำหรับหัวหน้ากลุ่มภารกิจและหัวหน้ากลุ่มงานโรงพยาบาลศูนย์ 1,000+ เตียง
            </p>

            <form onSubmit={handleCreateProposal} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">กลุ่มภารกิจ / หน่วยงานที่ยื่นขอ</label>
                <select
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมวดประเภทงบประมาณ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                >
                  <option value="INVESTMENT_EQUIPMENT">{CATEGORY_NAMES.INVESTMENT_EQUIPMENT}</option>
                  <option value="BUILDING_CONSTRUCTION">{CATEGORY_NAMES.BUILDING_CONSTRUCTION}</option>
                  <option value="OPERATING">{CATEGORY_NAMES.OPERATING}</option>
                  <option value="DEPRECIATION_REPLACE">{CATEGORY_NAMES.DEPRECIATION_REPLACE}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อโครงการ / รายการที่ยื่นขอ</label>
                <textarea
                  rows={2}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="เช่น โครงการจัดซื้อเครื่องมือแพทย์ หรือปรับปรุงอาคาร"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วงเงินที่ยื่นขอ (บาท)</label>
                  <input
                    type="number"
                    step="1000"
                    value={reqAmount}
                    onChange={(e) => setReqAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums font-bold text-[#1E3A8A]"
                    min={10000}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">งบที่เคยได้ปีที่แล้ว (บาท)</label>
                  <input
                    type="number"
                    step="1000"
                    value={prevAmount}
                    onChange={(e) => setPrevAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ระดับความเร่งด่วน</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                >
                  <option value="NORMAL">🟢 ปกติ (ตามแผนพัฒนาประจำปี)</option>
                  <option value="HIGH">🟡 สูง (จำเป็นเพื่อมาตรฐานการรักษา)</option>
                  <option value="CRITICAL">🔴 วิกฤตฉุกเฉิน (เครื่องเดิมเสียกระทบชีวิตผู้ป่วย)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เหตุผลความจำเป็นและความคุ้มค่า</label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  placeholder="ระบุสถิติผู้ป่วย ปริมาณงาน และความจำเป็นทางคลินิก"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold transition shadow-xs mt-2"
              >
                🚀 ยืนยันส่งคำขอเสนองบประมาณประจำปี {fiscalYear}
              </button>
            </form>
          </section>

          {/* Proposals List & Review Console */}
          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1E3A8A]">
                  📋 รายการคำของบประมาณรายจ่ายและผลการกลั่นกรอง (ปี พ.ศ. {fiscalYear})
                </h2>
                <p className="text-xs text-slate-500">
                  พิจารณากลั่นกรองวงเงินตามกรอบระเบียบกระทรวงการคลังและเพดานเงินบำรุง
                </p>
              </div>
              <button
                onClick={fetchProposals}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
              >
                🔄 รีเฟรชรายการ
              </button>
            </div>

            <div className="space-y-4">
              {proposals.map((prop) => {
                const isApproved = prop.status === "APPROVED" || prop.status === "REDUCED";
                const isPending = prop.status === "SUBMITTED" || prop.status === "REVIEWING";
                return (
                  <div
                    key={prop.proposalId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#1E3A8A] bg-blue-100 px-2 py-0.5 rounded">
                            {prop.proposalNo}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {CATEGORY_NAMES[prop.expenseCategory] || prop.expenseCategory}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              prop.urgency === "CRITICAL"
                                ? "bg-rose-100 text-rose-800"
                                : prop.urgency === "HIGH"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {prop.urgency === "CRITICAL" ? "🔴 วิกฤต" : prop.urgency === "HIGH" ? "🟡 สูง" : "🟢 ปกติ"}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mt-1">{prop.projectName}</h3>
                        <div className="text-xs text-slate-500 mt-0.5">
                          หน่วยงาน: <span className="font-semibold">{prop.departmentName}</span> • ผู้เสนอ: {prop.submittedBy}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">วงเงินที่ยื่นขอ</div>
                        <div className="text-base font-extrabold text-[#1E3A8A] tabular-nums">
                          ฿{prop.requestedAmount.toLocaleString("th-TH")}
                        </div>
                        {isApproved && (
                          <div className="text-xs font-bold text-emerald-700 tabular-nums">
                            อนุมัติ: ฿{(prop.approvedAmount || 0).toLocaleString("th-TH")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">เหตุผลความจำเป็น:</span> {prop.justification}
                      {prop.reviewNotes && (
                        <div className="mt-1 pt-1 border-t border-slate-100 text-emerald-900 font-medium">
                          <span className="font-bold">มติคณะกรรมการ:</span> {prop.reviewNotes} ({prop.reviewedBy})
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          prop.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : prop.status === "REDUCED"
                            ? "bg-blue-100 text-blue-800"
                            : prop.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        สถานะ: {prop.status}
                      </span>

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleReviewProposal(prop.proposalId, "APPROVE")}
                            className="px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            ✅ อนุมัติเต็มวงเงิน
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewProposal(prop.proposalId, "REDUCE")}
                            className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold"
                          >
                            ✂️ ปรับลดวงเงิน 15%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewProposal(prop.proposalId, "REJECT")}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                          >
                            ❌ ไม่อนุมัติ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
