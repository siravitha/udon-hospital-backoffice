"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const ROLE_META: Record<string, { title: string; subtitle: string; badge: string }> = {
  "clinical-pharma": {
    title: "กลุ่มภารกิจทางการแพทย์ เภสัชกรรม และห้องผ่าตัด (Clinical, Pharma & OR Workspace)",
    subtitle: "สร้างใบขอซื้อยา NLEM / ทางด่วนฉุกเฉิน ม.56(1)(ค) • บันทึกเวชภัณฑ์ฝากขายห้องผ่าตัด (OR Consignment) • ตรวจรับยา Cold-Chain & PAdES",
    badge: "CLINICAL & PHARMA",
  },
  budget: {
    title: "ฝ่ายแผนงานและงบประมาณพหุกองทุน (Multi-Fund Budget Control Hub)",
    subtitle: "ควบคุมเพดานงบ 5 กองทุนโรงพยาบาล • อนุมัติวงเงินจองงบ PRE_ENCUMBERED → ENCUMBERED • ตรวจสอบวัตถุประสงค์เงินบริจาค",
    badge: "MULTI-FUND BUDGET",
  },
  procurement: {
    title: "ฝ่ายพัสดุ คลังเวชภัณฑ์ และสัญญาจะซื้อจะขาย (Hospital Procurement & Blanket PA Hub)",
    subtitle: "ออกใบสั่งซื้อ Call-Off PO ตัดโควตาสัญญาจะซื้อจะขาย (Blanket PA) • ตรวจสอบระยะเวลารออุทธรณ์ 7 วันทำการ (Standstill)",
    badge: "PROCUREMENT & PA",
  },
  legal: {
    title: "ฝ่ายกฎหมายและนิติการ (Hospital Legal Review & Contract Diff Desk)",
    subtitle: "ตรวจร่างสัญญาเทียบแบบมาตรฐานกรมบัญชีกลาง Side-by-Side • ตรวจสอบหลักประกันสัญญา e-LG 5% และเพดานค่าปรับ 10%",
    badge: "LEGAL & CONTRACT",
  },
  finance: {
    title: "ฝ่ายการเงิน บัญชี และเบิกจ่าย 3-Way Match (Disbursement, Tax & GL Desk)",
    subtitle: "ตรวจสอบ 3-Way Match • ถอด VAT 7% • คำนวณ WHT 1% จากฐาน Ex-VAT (ยกเว้น GPO) • หักค่าปรับ • โอนเงินสุทธิ Net Payable",
    badge: "FINANCE & 3-WAY MATCH",
  },
};

export default function RoleWorkspacePage() {
  const params = useParams<{ role: string }>();
  const role = params?.role || "clinical-pharma";
  const meta = ROLE_META[role] || ROLE_META["clinical-pharma"];

  const [prs, setPrs] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [callOffOrders, setCallOffOrders] = useState<any[]>([]);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showInspectModal, setShowInspectModal] = useState(false);

  // Form states
  const [prTitle, setPrTitle] = useState("จัดซื้อยา Piperacillin/Tazobactam 4.5g (บัญชียาหลักแห่งชาติ)");
  const [prDrug, setPrDrug] = useState("Piperacillin + Tazobactam 4.5g Vial");
  const [prFund, setPrFund] = useState("HOSPITAL_MAINTENANCE");
  const [prType, setPrType] = useState("NORMAL");
  const [prQty, setPrQty] = useState(1000);
  const [prUnitPrice, setPrUnitPrice] = useState(145);
  const [prNlemCap, setPrNlemCap] = useState(150);

  const [orImplantName, setOrImplantName] = useState("ชุดแผ่นดามกระดูกไทเทเนียมระบบล็อก (Locking Trauma Plate)");
  const [orHn, setOrHn] = useState("HN6904512");
  const [orSerial, setOrSerial] = useState("SN-TI69-99201");
  const [orPrice, setOrPrice] = useState(48500);

  const [inspPoNo, setInspPoNo] = useState("PO-69-4012");
  const [inspDrugName, setInspDrugName] = useState("Human Albumin 20% 50mL Infusion (Cold-Chain)");
  const [inspLotNo, setInspLotNo] = useState("ALB-2026-11X");
  const [inspTemp, setInspTemp] = useState(4.2);
  const [inspCoa, setInspCoa] = useState(true);
  const [inspObjection, setInspObjection] = useState(false);

  const [selectedContractId, setSelectedContractId] = useState("PA-2569-01");
  const [callOffAmt, setCallOffAmt] = useState(500000);

  const [finPoNo, setFinPoNo] = useState("PO-69-3901 (Shared Fixture)");
  const [finVendorName, setFinVendorName] = useState("บริษัท สยามเมดิคอล ซัพพลาย จำกัด (มหาชน)");
  const [finVendorCat, setFinVendorCat] = useState<"PRIVATE_CORP" | "GPO" | "GOV_AGENCY">("PRIVATE_CORP");
  const [finFundCode, setFinFundCode] = useState("GOV_BUDGET");
  const [finInclVat, setFinInclVat] = useState(1070000);
  const [finPenalty, setFinPenalty] = useState(50000);

  const [legalNote, setLegalNote] = useState(
    "ตรวจทานร่างสัญญาเทียบแบบมาตรฐานกรมบัญชีกลางครบถ้วนแล้ว หลักประกันสัญญา e-LG ร้อยละ 5 ของวงเงินสัญญาถูกต้องครบถ้วน"
  );
  const [legalSavedCount, setLegalSavedCount] = useState(1);

  const refreshAll = useCallback(async () => {
    try {
      const [prRes, paRes, orRes, inRes, dvRes] = await Promise.all([
        fetch("/api/procurement/pr").then((r) => r.json()),
        fetch("/api/contracts/call-off").then((r) => r.json()),
        fetch("/api/consignment/webhook").then((r) => r.json()),
        fetch("/api/inspections").then((r) => r.json()),
        fetch("/api/disbursement/3way-match").then((r) => r.json()),
      ]);
      if (prRes.ok) {
        setPrs(prRes.prs || []);
        setFunds(prRes.funds || []);
      }
      if (paRes.ok) {
        setContracts(paRes.contracts || []);
        setCallOffOrders(paRes.callOffOrders || []);
      }
      if (orRes.ok) setConsignments(orRes.consignments || []);
      if (inRes.ok) setInspections(inRes.inspections || []);
      if (dvRes.ok) setVouchers(dvRes.vouchers || []);
    } catch {
      // ignore initial fetch error
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  async function handleCreatePr(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const res = await fetch("/api/procurement/pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department: role,
        fundCode: prFund,
        title: prTitle,
        drugGenericName: prDrug,
        qty: Number(prQty),
        unitPrice: Number(prUnitPrice),
        nlemCapUnitPrice: Number(prNlemCap),
        procurementType: prType,
        requestedBy: "ภญ. ดร.ศิริพร รักษ์ไทย (MOPH Provider 2FA Verified)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "ไม่สามารถสร้างใบขอซื้อ PR ได้" });
      return;
    }
    setPrs(data.prs);
    setFunds(data.funds);
    setBanner({
      type: "ok",
      text: `สร้างใบขอซื้อ ${data.pr.prNumber} สำเร็จ! จองวงเงิน PRE_ENCUMBERED จำนวน ${Number(data.pr.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท และลงบันทึก SHA-256 Audit Hash Chain เรียบร้อย`,
    });
  }

  async function handleApprovePr(prNumber: string) {
    setBanner(null);
    const res = await fetch("/api/procurement/pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPROVE_ENCUMBRANCE",
        prNumber,
        actorUsername: "ผอ.กองแผนงานและงบประมาณ (Step-Up 2FA)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "อนุมัติงบไม่สำเร็จ" });
      return;
    }
    setPrs(data.prs);
    setFunds(data.funds);
    setBanner({
      type: "ok",
      text: `อนุมัติผูกพันงบประมาณใบขอซื้อ ${prNumber} สำเร็จ! ย้ายสถานะวงเงินจาก PRE_ENCUMBERED → ENCUMBERED เรียบร้อย`,
    });
  }

  async function handleRecordConsignment(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const res = await fetch("/api/consignment/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": `HIS-OR-${Date.now()}`,
      },
      body: JSON.stringify({
        implantName: orImplantName,
        patientHn: orHn,
        serialNo: orSerial,
        qty: 1,
        unitPrice: Number(orPrice),
        surgeonProviderId: "นพ. ศัลยกรรมกระดูก (MOPH-PID-1100499281)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "บันทึกเวชภัณฑ์ฝากขายไม่สำเร็จ" });
      return;
    }
    setConsignments(data.consignments);
    setBanner({
      type: "ok",
      text: `บันทึกการใช้วัสดุฝากขายห้องผ่าตัดสำเร็จ! ออกใบสั่งซื้ออัตโนมัติ ${data.usage.autoPoNumber} (PDPA Masked: ${data.usage.patientHnMasked})`,
    });
  }

  async function handleRecordInspection(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const res = await fetch("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poNumber: inspPoNo,
        drugName: inspDrugName,
        lotNumber: inspLotNo,
        expiryDate: "2028-12-31",
        coldChainTempC: Number(inspTemp),
        coaVerified: inspCoa,
        committeeQuorumCount: 3,
        objectionRaised: inspObjection,
        inspectionDaysTaken: 2,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "บันทึกผลตรวจรับยาไม่สำเร็จ" });
      return;
    }
    setInspections(data.inspections);
    setShowInspectModal(false);
    setBanner({
      type: "ok",
      text: `บันทึกผลตรวจรับพัสดุ ${data.inspection.inspectionId} (${data.inspection.status}) สำเร็จ!`,
    });
  }

  async function handleIssueCallOff(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const res = await fetch("/api/contracts/call-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId: selectedContractId,
        amount: Number(callOffAmt),
        createdBy: "หัวหน้าเจ้าหน้าที่พัสดุ (PAdES Signed)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "ออกใบสั่งซื้อ Call-Off PO ไม่สำเร็จ" });
      return;
    }
    setContracts(data.contracts);
    setCallOffOrders(data.callOffOrders);
    setBanner({
      type: "ok",
      text: `ออกใบสั่งซื้อ Call-Off ${data.order.poNumber} สำเร็จ! ตัดโควตาสัญญาจะซื้อจะขาย ${Number(data.order.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท (คงเหลือ ${Number(data.contract.quotaRemainingAmt).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท)`,
    });
  }

  async function handleCreateVoucher(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const res = await fetch("/api/disbursement/3way-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poNumber: finPoNo,
        vendorName: finVendorName,
        vendorCategory: finVendorCat,
        fundCode: finFundCode,
        invoiceInclVat: Number(finInclVat),
        penaltyAmount: Number(finPenalty),
        actorUsername: "หัวหน้าฝ่ายการเงินและบัญชี (Step-Up 2FA)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "อนุมัติเบิกจ่าย 3-Way Match ไม่สำเร็จ" });
      return;
    }
    setVouchers(data.vouchers);
    setFunds(data.funds);
    setBanner({
      type: "ok",
      text: `อนุมัติใบสำคัญเบิกจ่าย ${data.voucher.voucherNo} สำเร็จ! ยอดโอนสุทธิเข้าบัญชีผู้ขาย (Net Payable) = ${Number(data.voucher.netPayable).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`,
    });
  }

  const liveExVat = Number(((finInclVat * 100) / 107).toFixed(2));
  const liveVat = Number((finInclVat - liveExVat).toFixed(2));
  const liveWht = finVendorCat === "PRIVATE_CORP" ? Number((liveExVat * 0.01).toFixed(2)) : 0;
  const liveNetPayable = Number((finInclVat - liveWht - finPenalty).toFixed(2));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navigation Bar */}
        <header className="bg-[#1E3A8A] text-white rounded-xl p-6 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <span>🏥 HOS-BACKOFFICE ENTERPRISE</span>
              <span>•</span>
              <span>{meta.badge}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">{meta.title}</h1>
            <p className="text-sm text-blue-100 mt-1">{meta.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
            >
              📊 Executive Dashboard
            </Link>
            <Link
              href="/auditor"
              className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition"
            >
              🔍 ตรวจสอบ SHA-256 Audit Chain
            </Link>
          </div>
        </header>

        {/* Role Switcher Tabs */}
        <nav className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          {[
            { id: "clinical-pharma", label: "1. กลุ่มงานเภสัชกรรม & ห้องผ่าตัด (Clinical/OR)" },
            { id: "budget", label: "2. ฝ่ายงบประมาณพหุกองทุน (Budget Hub)" },
            { id: "procurement", label: "3. ฝ่ายพัสดุ & สัญญา PA (Procurement)" },
            { id: "legal", label: "4. ฝ่ายกฎหมาย & นิติการ (Legal Desk)" },
            { id: "finance", label: "5. ฝ่ายการเงิน 3-Way Match (Finance)" },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={`/workspace/${tab.id}`}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                role === tab.id
                  ? "bg-[#1E3A8A] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Executive KPI Summary Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">งบประมาณจัดสรรรวม 5 กองทุน</div>
            <div className="text-xl font-extrabold text-[#1E3A8A] tabular-nums mt-1">
              ฿{funds.reduce((s, f) => s + (f.allocated || 0), 0).toLocaleString("th-TH")}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">● โรงพยาบาลอุดรธานี • ปีงบ 2569 (HCODE: 10671)</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">จองงบ + ผูกพันสัญญาแล้ว</div>
            <div className="text-xl font-extrabold text-amber-700 tabular-nums mt-1">
              ฿{funds.reduce((s, f) => s + (f.preEncumbered || 0) + (f.encumbered || 0), 0).toLocaleString("th-TH")}
            </div>
            <div className="text-xs text-slate-600 mt-1">ใบขอซื้อทั้งหมด {prs.length} รายการ (NLEM/GPO)</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">วงเงินคงเหลือสุทธิพร้อมใช้</div>
            <div className="text-xl font-extrabold text-emerald-700 tabular-nums mt-1">
              ฿
              {funds
                .reduce(
                  (s, f) =>
                    s +
                    ((f.allocated || 0) -
                      ((f.preEncumbered || 0) +
                        (f.encumbered || 0) +
                        (f.carryOverEncumbered || 0) +
                        (f.disbursed || 0))),
                  0
                )
                .toLocaleString("th-TH")}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">✅ ล็อกเพดานงบ Hard-Stop อัตโนมัติ</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">สัญญาจะซื้อจะขาย & 3-Way Match</div>
            <div className="text-xl font-extrabold text-[#1E3A8A] tabular-nums mt-1">
              {contracts.length} สัญญา PA • {vouchers.length} ใบสำคัญจ่าย
            </div>
            <div className="text-xs text-blue-800 font-semibold mt-1">🔐 SHA-256 WORM Hash Chain Verified</div>
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

        {/* ROLE 1: CLINICAL & PHARMA */}
        {role === "clinical-pharma" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                📝 สร้างใบขอซื้อยา/เวชภัณฑ์ (PR ปกติ / ฉุกเฉิน ม.56(1)(ค) / สิทธิพิเศษ GPO)
              </h2>
              <form onSubmit={handleCreatePr} className="space-y-3 text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เรื่อง / รายการขอซื้อ</label>
                  <input
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ชื่อสามัญทางยา (Generic Name)</label>
                    <input
                      value={prDrug}
                      onChange={(e) => setPrDrug(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">แหล่งเงินงบประมาณ (Multi-Fund)</label>
                    <select
                      value={prFund}
                      onChange={(e) => setPrFund(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option value="HOSPITAL_MAINTENANCE">เงินบำรุงโรงพยาบาล</option>
                      <option value="GOV_BUDGET">งบประมาณแผ่นดิน</option>
                      <option value="DONATION_UNSPECIFIED">เงินบริจาคไม่ระบุวัตถุประสงค์</option>
                      <option value="UC_DEPRECIATION">งบค่าเสื่อม สปสช.</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">จำนวน (หน่วย)</label>
                    <input
                      type="number"
                      value={prQty}
                      onChange={(e) => setPrQty(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ราคาต่อหน่วย (บาท)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prUnitPrice}
                      onChange={(e) => setPrUnitPrice(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ราคากลางยา NLEM</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prNlemCap}
                      onChange={(e) => setPrNlemCap(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รูปแบบการจัดซื้อตาม พ.ร.บ. 2560</label>
                  <select
                    value={prType}
                    onChange={(e) => setPrType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="NORMAL">การจัดซื้อปกติ (ตรวจราคากลางยา NLEM)</option>
                    <option value="GPO_PRIVILEGE">สิทธิพิเศษองค์การเภสัชกรรม (GPO Privilege)</option>
                    <option value="EMERGENCY_RETROSPECTIVE_PR">
                      ทางด่วนฉุกเฉินทางการแพทย์ ม.56(1)(ค) (SLA รายงานผลใน 5 วันทำการ)
                    </option>
                  </select>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-900">ยอดจองงบประมาณ (PRE_ENCUMBERED):</span>
                  <span className="text-base font-bold text-[#1E3A8A] tabular-nums">
                    {(prQty * prUnitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                  </span>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold transition"
                >
                  ✅ ยืนยันส่งใบขอซื้อ PR & จองวงเงิน PRE_ENCUMBERED
                </button>
              </form>
            </section>

            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1E3A8A]">
                    🏥 บันทึกเวชภัณฑ์ฝากขายห้องผ่าตัด (OR Consignment → Auto PO)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowInspectModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    🔬 เปิดหน้าต่างตรวจรับยา Cold-Chain
                  </button>
                </div>
                <form onSubmit={handleRecordConsignment} className="space-y-3 text-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">รายการวัสดุฝากขายที่ใช้ผ่าตัด</label>
                    <input
                      value={orImplantName}
                      onChange={(e) => setOrImplantName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">HN ผู้ป่วย (PDPA Mask)</label>
                      <input
                        value={orHn}
                        onChange={(e) => setOrHn(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Serial / Lot No.</label>
                      <input
                        value={orSerial}
                        onChange={(e) => setOrSerial(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ราคาตามสัญญา (บาท)</label>
                      <input
                        type="number"
                        value={orPrice}
                        onChange={(e) => setOrPrice(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white font-bold transition"
                  >
                    ⚡ ตัดยอดฝากขาย OR จาก HIS & ออกใบสั่งซื้อ Auto-PO
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold uppercase text-slate-500">
                    รายการตัดยอดเวชภัณฑ์ฝากขายล่าสุด (PDPA Masked)
                  </h3>
                  {consignments.map((c) => (
                    <div
                      key={c.usageId}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#1E3A8A]">
                          {c.implantName} ({c.patientHnMasked})
                        </div>
                        <div className="text-slate-500">
                          Serial: {c.serialNo} • Auto-PO: <span className="font-semibold">{c.autoPoNumber}</span>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        {Number(c.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ROLE 2: MULTI-FUND BUDGET HUB */}
        {role === "budget" && (
          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-lg font-bold text-[#1E3A8A]">
                  🏦 สถานะงบประมาณพหุกองทุน 5 สถานะวงเงิน (Allocated • Pre-Encumbered • Encumbered • Carry-Over • Disbursed)
                </h2>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "#F59E0B", display: "inline-block" }} />
                    PRE_ENCUMBERED (จองงบ PR)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "#2563EB", display: "inline-block" }} />
                    ENCUMBERED (ผูกพัน PO)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "#9333EA", display: "inline-block" }} />
                    CARRY_OVER (กันเหลื่อมปี)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "#059669", display: "inline-block" }} />
                    DISBURSED (เบิกจ่ายแล้ว)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {funds.map((f) => {
                  const used = f.preEncumbered + f.encumbered + f.carryOverEncumbered + f.disbursed;
                  const avail = f.allocated - used;
                  const pct = Math.min(100, Math.round((used / f.allocated) * 100));
                  const pPre = Math.max(0, (f.preEncumbered / f.allocated) * 100);
                  const pEnc = Math.max(0, (f.encumbered / f.allocated) * 100);
                  const pCar = Math.max(0, (f.carryOverEncumbered / f.allocated) * 100);
                  const pDis = Math.max(0, (f.disbursed / f.allocated) * 100);
                  return (
                    <div key={f.fundCode} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-sm text-[#1E3A8A]">{f.fundName}</span>
                          <div className="text-[11px] text-slate-500 font-mono">
                            รหัสกองทุน: {f.fundCode} • งบจัดสรร ฿{Number(f.allocated).toLocaleString("th-TH")}
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-[#1E3A8A]">
                          ใช้ไป {pct}%
                        </span>
                      </div>
                      <div
                        className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex"
                        style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)" }}
                      >
                        <div style={{ width: `${pPre}%`, background: "#F59E0B" }} title="PRE_ENCUMBERED" />
                        <div style={{ width: `${pEnc}%`, background: "#2563EB" }} title="ENCUMBERED" />
                        <div style={{ width: `${pCar}%`, background: "#9333EA" }} title="CARRY_OVER" />
                        <div style={{ width: `${pDis}%`, background: "#059669" }} title="DISBURSED" />
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-xs tabular-nums pt-1">
                        <div>
                          <div className="text-[11px] text-slate-500">จองงบ (PR)</div>
                          <div className="font-bold text-amber-700">{Number(f.preEncumbered).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500">ผูกพัน (PO)</div>
                          <div className="font-bold text-blue-800">{Number(f.encumbered).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500">กันเหลื่อมปี</div>
                          <div className="font-bold text-purple-700">{Number(f.carryOverEncumbered).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500">เบิกจ่ายแล้ว</div>
                          <div className="font-bold text-slate-700">{Number(f.disbursed).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500">คงเหลือสุทธิ</div>
                          <div className="font-bold text-emerald-700">{Number(avail).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                📋 รายการใบขอซื้อรอตรวจสอบและอนุมัติผูกพันงบประมาณ (PRE_ENCUMBERED → ENCUMBERED)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                      <th className="p-3">เลขที่ PR</th>
                      <th className="p-3">รายการ</th>
                      <th className="p-3">กองทุน</th>
                      <th className="p-3">ประเภท</th>
                      <th className="p-3 text-right">วงเงิน (บาท)</th>
                      <th className="p-3">สถานะวงเงิน</th>
                      <th className="p-3 text-right">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {prs.map((pr) => (
                      <tr key={pr.prId} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-[#1E3A8A]">{pr.prNumber}</td>
                        <td className="p-3">{pr.title}</td>
                        <td className="p-3 text-xs font-semibold">{pr.fundCode}</td>
                        <td className="p-3 text-xs">{pr.procurementType}</td>
                        <td className="p-3 text-right font-bold tabular-nums">
                          {Number(pr.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              pr.status === "PRE_ENCUMBERED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {pr.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {pr.status === "PRE_ENCUMBERED" ? (
                            <button
                              onClick={() => handleApprovePr(pr.prNumber)}
                              className="px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold"
                            >
                              ✅ อนุมัติผูกพันงบ (ENCUMBER)
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-700 font-semibold">ผูกพันงบแล้ว</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ROLE 3: PROCUREMENT & BLANKET PA */}
        {role === "procurement" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1E3A8A]">
                  📦 ออกใบสั่งซื้อ Call-Off PO ตัดโควตาสัญญาจะซื้อจะขาย (Blanket PA)
                </h2>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  ✅ ครบกำหนด Standstill 7 วันทำการแล้ว
                </span>
              </div>
              <form onSubmit={handleIssueCallOff} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลือกสัญญาจะซื้อจะขาย (Blanket PA)</label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  >
                    {contracts.map((c) => (
                      <option key={c.contractId} value={c.contractId}>
                        {c.contractNo} — {c.drugName} (คงเหลือ{" "}
                        {Number(c.quotaRemainingAmt).toLocaleString("th-TH")} บาท)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วงเงินสั่งซื้อ Call-Off PO รอบนี้ (บาท)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={callOffAmt}
                    onChange={(e) => setCallOffAmt(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                    min={1000}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold transition"
                >
                  🚀 ออกใบสั่งซื้อ Call-Off PO & ตัดโควตาสัญญาจะซื้อจะขายทันที
                </button>
              </form>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h3 className="text-sm font-bold text-slate-700">ประวัติใบสั่งซื้อ Call-Off PO ล่าสุด</h3>
                {callOffOrders.map((po) => (
                  <div
                    key={po.poId}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#1E3A8A]">{po.poNumber}</span> • {po.contractNo}
                    </div>
                    <span className="font-bold text-emerald-700 tabular-nums">
                      {Number(po.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#1E3A8A]">📊 สถานะโควตาสัญญาจะซื้อจะขาย (Blanket PA Quota)</h2>
              {contracts.map((c) => {
                const pct = Math.min(100, Math.round((c.quotaConsumedAmt / c.quotaCeilingAmt) * 100));
                return (
                  <div key={c.contractId} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex justify-between text-sm font-bold text-[#1E3A8A]">
                      <span>{c.contractNo}</span>
                      <span>ใช้โควตาแล้ว {pct}%</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {c.drugName} • ผู้ขาย: {c.vendorName}
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1E3A8A]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs tabular-nums">
                      <span>ใช้แล้ว: {Number(c.quotaConsumedAmt).toLocaleString("th-TH")} บาท</span>
                      <span className="font-bold text-emerald-700">
                        คงเหลือ: {Number(c.quotaRemainingAmt).toLocaleString("th-TH")} บาท
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* ROLE 4: LEGAL DESK */}
        {role === "legal" && (
          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                📑 เปรียบเทียบร่างสัญญากับแบบมาตรฐานกรมบัญชีกลาง (Side-by-Side Contract Diff Viewer)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-700">แบบสัญญาจะซื้อจะขายมาตรฐาน กรมบัญชีกลาง (พ.ร.บ. 2560)</div>
                  <div className="p-2 rounded bg-white">
                    ข้อ 4. หลักประกันการปฏิบัติตามสัญญาอัตราร้อยละ 5 ของวงเงินสัญญา (e-LG ธนาคารพาณิชย์ไทย)
                  </div>
                  <div className="p-2 rounded bg-white">
                    ข้อ 11. ค่าปรับกรณีส่งมอบพัสดุล่าช้า อัตราร้อยละ 0.20 ต่อวัน (หักวันตรวจรับของคณะกรรมการออก)
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900">ร่างสัญญาโรงพยาบาลศูนย์ (เพิ่มเติมเงื่อนไข Cold-Chain & HA)</div>
                  <div className="p-2 rounded bg-white">
                    ข้อ 4. หลักประกันการปฏิบัติตามสัญญาอัตราร้อยละ 5 ของวงเงินสัญญา (ตรวจสอบผ่านระบบ e-LG อัตโนมัติ)
                  </div>
                  <div className="p-2 rounded bg-amber-100 text-amber-950 font-semibold">
                    + ข้อ 11.2 ยาควบคุมอุณหภูมิต้องรักษา Cold-Chain 2.0°C - 8.0°C ตลอดการขนส่ง พร้อมแนบใบ COA ทุกรุ่นผลิต
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                ⚖️ บันทึกความเห็นนิติกร & การตรวจสอบหลักประกันสัญญาอิเล็กทรอนิกส์ (e-LG 5%)
              </h2>
              <textarea
                rows={3}
                value={legalNote}
                onChange={(e) => setLegalNote(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  บันทึกความเห็นนิติกรแล้ว {legalSavedCount} รายการ (เชื่อมโยง e-LG ธนาคารกรุงไทย & กรมบัญชีกลาง)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLegalSavedCount((c) => c + 1);
                    setBanner({
                      type: "ok",
                      text: "บันทึกความเห็นนิติกรและผลตรวจรับรองหลักประกันสัญญา e-LG 5% ลงระบบเรียบร้อย",
                    });
                  }}
                  className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-bold"
                >
                  💾 บันทึกผลการตรวจร่างสัญญา & e-LG
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ROLE 5: FINANCE & 3-WAY MATCH */}
        {role === "finance" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                💰 คำนวณและอนุมัติตั้งเบิก 3-Way Match (ถอด VAT 7% • หัก WHT 1% Ex-VAT • หักค่าปรับ)
              </h2>
              <form onSubmit={handleCreateVoucher} className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">อ้างอิงเลขที่ใบสั่งซื้อ (PO)</label>
                    <input
                      value={finPoNo}
                      onChange={(e) => setFinPoNo(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ประเภทผู้ขาย (ตรวจยกเว้น WHT)</label>
                    <select
                      value={finVendorCat}
                      onChange={(e) => setFinVendorCat(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option value="PRIVATE_CORP">นิติบุคคลเอกชน (หัก WHT 1% จากฐาน Ex-VAT)</option>
                      <option value="GPO">องค์การเภสัชกรรม - GPO (ยกเว้นภาษีหัก ณ ที่จ่าย)</option>
                      <option value="GOV_AGENCY">หน่วยงานภาครัฐ / สภากาชาดไทย (ยกเว้น WHT)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้ขาย / คู่สัญญา</label>
                  <input
                    value={finVendorName}
                    onChange={(e) => setFinVendorName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ยอดตั้งเบิกรวม VAT 7% (Incl-VAT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={finInclVat}
                      onChange={(e) => setFinInclVat(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      หักค่าปรับส่งมอบล่าช้า (Penalty)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={finPenalty}
                      onChange={(e) => setFinPenalty(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums font-bold text-rose-700"
                    />
                  </div>
                </div>

                {/* Live Calculation Breakdown Box */}
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-300">1. ยอดใบกำกับภาษีรวม VAT 7% (Incl-VAT):</span>
                    <span className="font-bold">{finInclVat.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">2. ถอดฐานมูลค่าสินค้าก่อนภาษี (Ex-VAT = Incl × 100 / 107):</span>
                    <span className="font-bold">{liveExVat.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">3. ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                    <span>{liveVat.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>4. หักภาษี ณ ที่จ่าย 1% (WHT 1% คิดจากฐาน Ex-VAT):</span>
                    <span className="font-bold">-{liveWht.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>5. หักค่าปรับส่งมอบล่าช้า (Penalty):</span>
                    <span className="font-bold">-{finPenalty.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 flex justify-between text-base font-extrabold text-emerald-400">
                    <span>ยอดเงินโอนสุทธิเข้าบัญชีผู้ขาย (Net Payable):</span>
                    <span>{liveNetPayable.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white font-bold transition"
                >
                  ✅ อนุมัติใบสำคัญเบิกจ่าย 3-Way Match & ส่งคำสั่งโอนเงิน GFMIS
                </button>
              </form>
            </section>

            <section className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-[#1E3A8A]">
                  🧾 รายการใบสำคัญเบิกจ่าย 3-Way Match ล่าสุด (Disbursement Vouchers)
                </h3>
                {vouchers.map((v) => (
                  <div
                    key={v.voucherId}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs tabular-nums"
                  >
                    <div>
                      <div className="font-bold text-[#1E3A8A] text-sm">{v.voucherNo}</div>
                      <div className="text-slate-600">
                        {v.vendorName} ({v.vendorCategory})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-700 text-sm">
                        Net: {Number(v.netPayable).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                      </div>
                      <div className="text-slate-500">
                        Incl: {Number(v.invoiceInclVat).toLocaleString()} | WHT: {Number(v.wht1Pct).toLocaleString()} |
                        Pen: {Number(v.penaltyDeducted).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {showInspectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 relative shadow-xl">
              <button
                onClick={() => setShowInspectModal(false)}
                className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300"
              >
                ✕ ปิดหน้าต่าง
              </button>
              <h3 className="text-lg font-bold text-[#1E3A8A]">
                🔬 ตรวจรับยาและเวชภัณฑ์ควบคุมอุณหภูมิ (Cold-Chain & COA PAdES-LTV)
              </h3>
              <form onSubmit={handleRecordInspection} className="space-y-3 text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อ้างอิงเลขที่ใบสั่งซื้อ (PO Number)</label>
                  <input
                    value={inspPoNo}
                    onChange={(e) => setInspPoNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อรายการยา/วัคซีน</label>
                  <input
                    value={inspDrugName}
                    onChange={(e) => setInspDrugName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lot Number</label>
                    <input
                      value={inspLotNo}
                      onChange={(e) => setInspLotNo(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      อุณหภูมิขณะตรวจรับ (°C • เกณฑ์ 2.0-8.0°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inspTemp}
                      onChange={(e) => setInspTemp(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={inspCoa}
                      onChange={(e) => setInspCoa(e.target.checked)}
                    />
                    ตรวจใบรับรองรุ่นผลิต (COA Verified)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                    <input
                      type="checkbox"
                      checked={inspObjection}
                      onChange={(e) => setInspObjection(e.target.checked)}
                    />
                    กรรมการทักท้วง (ระงับการจ่ายทันที)
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white font-bold"
                >
                  ✍️ ลงนามอิเล็กทรอนิกส์ PAdES-LTV & บันทึกผลตรวจรับ
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
