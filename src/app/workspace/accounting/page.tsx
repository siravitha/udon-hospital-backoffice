"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ChartOfAccount {
  accountCode: string;
  accountNameTh: string;
  accountNameEn: string;
  category: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  categoryNameTh: string;
  normalBalance: "DEBIT" | "CREDIT";
  openingBalance: number;
  description: string;
  isActive: boolean;
}

interface JournalLine {
  accountCode: string;
  accountNameTh: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  journalNo: string;
  entryDate: string;
  docReference: string;
  fundCode: string;
  description: string;
  sourceModule: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  postedBy: string;
  postedAt: string;
}

interface TrialBalanceRow {
  accountCode: string;
  accountNameTh: string;
  category: string;
  categoryNameTh: string;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export default function AccountingHubPage() {
  const [activeTab, setActiveTab] = useState<"journal" | "trialBalance" | "coa" | "financials">("journal");
  const [coa, setCoa] = useState<ChartOfAccount[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [tbData, setTbData] = useState<{
    rows: TrialBalanceRow[];
    totalMovementDebit: number;
    totalMovementCredit: number;
    totalClosingDebit: number;
    totalClosingCredit: number;
    isBalanced: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Journal Entry Modal
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({
    entryDate: new Date().toISOString().slice(0, 10),
    docReference: "",
    fundCode: "HOSPITAL_MAINTENANCE",
    description: "",
    lines: [
      { accountCode: "110401", accountNameTh: "เวชภัณฑ์ยาและเคมีภัณฑ์คงคลัง", debit: 0, credit: 0 },
      { accountCode: "210101", accountNameTh: "เจ้าหนี้การค้า - เวชภัณฑ์และยา", debit: 0, credit: 0 },
    ],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coaRes, glRes, tbRes] = await Promise.all([
        fetch("/api/accounting/chart-of-accounts"),
        fetch("/api/accounting/gl"),
        fetch("/api/accounting/trial-balance"),
      ]);

      const coaJson = await coaRes.json();
      const glJson = await glRes.json();
      const tbJson = await tbRes.json();

      if (coaJson.ok) setCoa(coaJson.accounts);
      if (glJson.ok) setEntries(glJson.entries);
      if (tbJson.ok) setTbData(tbJson);
    } catch (err: any) {
      setBanner({ type: "err", text: "ไม่สามารถดึงข้อมูลบัญชีได้: " + err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Save Journal Entry
  async function handleSaveJournal(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    try {
      const res = await fetch("/api/accounting/gl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...journalForm,
          actorUsername: "นักวิชาการเงินและบัญชี (MOPH Accounting)",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "บันทึกบัญชีไม่สำเร็จ");

      setBanner({
        type: "ok",
        text: `บันทึกสมุดรายวันทั่วไปสำเร็จ! เลขที่ใบสำคัญ: [ ${data.entry.journalNo} ] ยอดรวม ${data.entry.totalDebit.toLocaleString()} บาท (เดบิต = เครดิต สมดุล)`,
      });
      setJournalModalOpen(false);
      fetchData();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Add line to journal form
  function addJournalLine() {
    setJournalForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { accountCode: "110101", accountNameTh: "เงินสดและเงินทดรองราชการ", debit: 0, credit: 0 }],
    }));
  }

  // Update line
  function updateJournalLine(idx: number, field: string, val: any) {
    const updated = [...journalForm.lines];
    if (field === "accountCode") {
      const selectedCoa = coa.find((c) => c.accountCode === val);
      updated[idx].accountCode = val;
      updated[idx].accountNameTh = selectedCoa ? selectedCoa.accountNameTh : "";
    } else {
      (updated[idx] as any)[field] = Number(val) || 0;
    }
    setJournalForm({ ...journalForm, lines: updated });
  }

  // Remove line
  function removeJournalLine(idx: number) {
    if (journalForm.lines.length <= 2) {
      alert("รายการบัญชีคู่ต้องมีอย่างน้อย 2 บรรทัด (เดบิต และ เครดิต)");
      return;
    }
    const updated = journalForm.lines.filter((_, i) => i !== idx);
    setJournalForm({ ...journalForm, lines: updated });
  }

  const currentDebitTotal = journalForm.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const currentCreditTotal = journalForm.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isFormBalanced = Math.abs(currentDebitTotal - currentCreditTotal) < 0.01 && currentDebitTotal > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#172554] via-[#1E3A8A] to-[#047857] text-white py-8 px-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
            <Link href="/dashboard" className="hover:text-white transition">หน้าหลัก</Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">กลุ่มงานการเงินและบัญชี</span>
            <span>/</span>
            <span className="text-white font-bold">ฝ่ายบัญชี & งบการเงิน</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl">📒</span>
                <span>ฝ่ายบัญชีและงบการเงินโรงพยาบาล (Hospital General Ledger & Financial Hub)</span>
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                ระบบบัญชีคู่ตามมาตรฐานการบัญชีภาครัฐ (กรมบัญชีกลาง & สธ.) • Auto GL Posting จากการตรวจรับ/เบิกจ่าย 3-Way Match • งบทดลองแบบ Real-time
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/workspace/finance"
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition flex items-center gap-1.5"
              >
                <span>🧾 ไปที่ฝ่ายการเงิน (3-Way Match)</span>
              </Link>
              <button
                onClick={() => setJournalModalOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <span>➕ บันทึกสมุดรายวันทั่วไป (JV)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">ผังบัญชีทั้งหมด (COA)</div>
              <div className="text-2xl font-extrabold text-white mt-0.5">{coa.length} บัญชี</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">รายการในสมุดรายวัน</div>
              <div className="text-2xl font-extrabold text-cyan-300 mt-0.5">{entries.length} รายการ</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">สถานะงบทดลอง (Trial Balance)</div>
              <div className="text-sm font-black text-emerald-300 mt-1.5 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>เดบิต = เครดิต สมดุล 100%</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">ยอดเคลื่อนไหวสะสม</div>
              <div className="text-xl font-extrabold text-amber-300 mt-0.5 font-mono">
                ฿{(tbData?.totalMovementDebit || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Banner Alert */}
        {banner && (
          <div
            className={`p-4 rounded-xl border mb-6 text-sm flex items-start justify-between shadow-xs ${
              banner.type === "ok"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <span>{banner.type === "ok" ? "✅" : "⚠️"}</span>
              <span>{banner.text}</span>
            </div>
            <button
              onClick={() => setBanner(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-4"
            >
              ✕ ปิด
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("journal")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "journal"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📝 สมุดรายวันทั่วไป (General Journal)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold">
              {entries.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("trialBalance")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "trialBalance"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>⚖️ งบทดลองประจำงวด (Trial Balance)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              Balanced
            </span>
          </button>
          <button
            onClick={() => setActiveTab("coa")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "coa"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📖 ผังบัญชีโรงพยาบาล (Chart of Accounts)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-extrabold">
              {coa.length} หมวด
            </span>
          </button>
          <button
            onClick={() => setActiveTab("financials")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "financials"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>🏛️ งบการเงินโรงพยาบาล (Financial Statements)</span>
          </button>
        </div>

        {/* TAB 1: GENERAL JOURNAL */}
        {activeTab === "journal" && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="🔍 ค้นหาเลขที่ใบสำคัญ, เอกสารอ้างอิง, คำอธิบาย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-slate-500">
                ระบบ Auto GL Posting ทำการบันทึกบัญชีคู่อัตโนมัติทุกครั้งเมื่อมีการตรวจรับหรือจ่ายเงิน 3-Way Match
              </div>
            </div>

            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-[#1E3A8A] text-white font-mono font-bold text-xs rounded-md">
                        {entry.journalNo}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        วันที่: {entry.entryDate}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                        อ้างอิง: {entry.docReference}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        {entry.fundCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      ผู้ลงบัญชี: {entry.postedBy}
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold text-slate-800 mb-3">
                      {entry.description}
                    </p>

                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold text-left">
                          <th className="pb-2 w-28">รหัสบัญชี</th>
                          <th className="pb-2">ชื่อบัญชี (Account Title)</th>
                          <th className="pb-2 text-right w-36">เดบิต (Debit ฿)</th>
                          <th className="pb-2 text-right w-36">เครดิต (Credit ฿)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entry.lines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 font-mono font-bold text-slate-700">{line.accountCode}</td>
                            <td className="py-2 text-slate-800">
                              <span className={line.credit > 0 ? "pl-6 text-slate-600" : "font-semibold"}>
                                {line.accountNameTh}
                              </span>
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-slate-900">
                              {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-slate-900">
                              {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                          <td colSpan={2} className="py-2.5 text-right text-slate-700">
                            ยอดรวมทั้งสิ้น (Total Balanced):
                          </td>
                          <td className="py-2.5 text-right font-mono text-emerald-800">
                            {entry.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 text-right font-mono text-emerald-800">
                            {entry.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: TRIAL BALANCE */}
        {activeTab === "trialBalance" && tbData && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  งบทดลองก่อนปรับปรุงประจำงวด (Pre-Closing Trial Balance)
                </h3>
                <p className="text-xs text-slate-500">
                  ปีงบประมาณ พ.ศ. 2569 • คำนวณยอดยกมาบวกยอดเคลื่อนไหวสมุดรายวันทั่วไปแบบ Real-time
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                <span>✓ ยอดรวมเดบิตเท่ากับเครดิต</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3" rowSpan={2}>รหัสบัญชี</th>
                      <th className="p-3" rowSpan={2}>ชื่อบัญชี</th>
                      <th className="p-3" rowSpan={2}>หมวด</th>
                      <th className="p-3 text-center border-l" colSpan={2}>ยอดยกมา (Opening)</th>
                      <th className="p-3 text-center border-l" colSpan={2}>รายการเคลื่อนไหว (Movements)</th>
                      <th className="p-3 text-center border-l" colSpan={2}>ยอดยกไป (Closing Balance)</th>
                    </tr>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <th className="p-2 text-right border-l">เดบิต</th>
                      <th className="p-2 text-right">เครดิต</th>
                      <th className="p-2 text-right border-l">เดบิต</th>
                      <th className="p-2 text-right">เครดิต</th>
                      <th className="p-2 text-right border-l">เดบิต</th>
                      <th className="p-2 text-right">เครดิต</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tbData.rows.map((row) => (
                      <tr key={row.accountCode} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-[#1E3A8A]">{row.accountCode}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.accountNameTh}</td>
                        <td className="p-3 text-slate-500">{row.categoryNameTh}</td>
                        <td className="p-3 text-right font-mono border-l">
                          {row.openingDebit > 0 ? row.openingDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {row.openingCredit > 0 ? row.openingCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="p-3 text-right font-mono border-l text-blue-700 font-semibold">
                          {row.movementDebit > 0 ? row.movementDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-purple-700 font-semibold">
                          {row.movementCredit > 0 ? row.movementCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="p-3 text-right font-mono border-l font-bold text-slate-900">
                          {row.closingDebit > 0 ? row.closingDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {row.closingCredit > 0 ? row.closingCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={5} className="p-3 text-right">ยอดรวมสุทธิ (Grand Total):</td>
                      <td className="p-3 text-right font-mono text-blue-900 border-l">
                        {tbData.totalMovementDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-purple-900">
                        {tbData.totalMovementCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-900 border-l">
                        {tbData.totalClosingDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-900">
                        {tbData.totalClosingCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHART OF ACCOUNTS */}
        {activeTab === "coa" && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">ผังบัญชีมาตรฐานโรงพยาบาลภาครัฐ (Hospital Chart of Accounts)</h3>
                <p className="text-xs text-slate-500">อิงตามมาตรฐานรหัสบัญชีของกระทรวงการคลัง และระบบบัญชีสถานพยาบาล สธ.</p>
              </div>
              <div className="text-xs font-semibold text-slate-600">
                5 หมวดบัญชีสากล (สินทรัพย์, หนี้สิน, ทุน, รายได้, ค่าใช้จ่าย)
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">รหัสบัญชี</th>
                    <th className="p-3.5">ชื่อบัญชี (ภาษาไทย / English)</th>
                    <th className="p-3.5">หมวดบัญชี</th>
                    <th className="p-3.5 text-center">ดุลปกติ</th>
                    <th className="p-3.5 text-right">ยอดยกมา (฿)</th>
                    <th className="p-3.5">คำอธิบาย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coa.map((account) => (
                    <tr key={account.accountCode} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-[#1E3A8A]">{account.accountCode}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{account.accountNameTh}</div>
                        <div className="text-[11px] text-slate-500">{account.accountNameEn}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            account.category === "ASSET"
                              ? "bg-blue-100 text-blue-800"
                              : account.category === "LIABILITY"
                              ? "bg-amber-100 text-amber-800"
                              : account.category === "EQUITY"
                              ? "bg-purple-100 text-purple-800"
                              : account.category === "REVENUE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {account.categoryNameTh}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        <span className={account.normalBalance === "DEBIT" ? "text-blue-700" : "text-purple-700"}>
                          {account.normalBalance}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                        {account.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">{account.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FINANCIAL STATEMENTS */}
        {activeTab === "financials" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Sheet Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="border-b pb-4 mb-4">
                <span className="text-xs font-bold text-blue-700 uppercase">รายงานทางการเงิน</span>
                <h3 className="text-base font-black text-slate-900 mt-1">งบแสดงฐานะการเงิน (Balance Sheet)</h3>
                <p className="text-xs text-slate-500">โรงพยาบาลศูนย์ขนาด 1,000+ เตียง • ณ วันที่ 31 ตุลาคม 2569</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 border-b pb-1">สินทรัพย์ (Assets)</h4>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>สินทรัพย์หมุนเวียน (เงินฝาก, ยาคงคลัง, ลูกหนี้ สปสช.):</span>
                    <span className="font-mono font-bold text-slate-900">฿121,000,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>ครุภัณฑ์การแพทย์สุทธิ (หักค่าเสื่อมราคาสะสม):</span>
                    <span className="font-mono font-bold text-slate-900">฿142,500,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-black text-emerald-800 bg-emerald-50 px-2 rounded">
                    <span>รวมสินทรัพย์ทั้งสิ้น (Total Assets):</span>
                    <span className="font-mono">฿263,500,000.00</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 border-b pb-1">หนี้สินและเงินทุนสะสม (Liabilities & Fund Equity)</h4>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>หนี้สินหมุนเวียน (เจ้าหนี้การค้ายา, ภาษีค้างจ่าย, เงินประกัน):</span>
                    <span className="font-mono font-bold text-slate-900">฿22,745,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>เงินทุนสะสมโรงพยาบาล (Hospital Retained Reserve):</span>
                    <span className="font-mono font-bold text-slate-900">฿240,755,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-black text-blue-900 bg-blue-50 px-2 rounded">
                    <span>รวมหนี้สินและทุนสะสม (Total Liab & Equity):</span>
                    <span className="font-mono">฿263,500,000.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Statement Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="border-b pb-4 mb-4">
                <span className="text-xs font-bold text-emerald-700 uppercase">รายงานทางการเงิน</span>
                <h3 className="text-base font-black text-slate-900 mt-1">งบแสดงผลการดำเนินงานทางการเงิน (Income Statement)</h3>
                <p className="text-xs text-slate-500">สำหรับไตรมาสแรก ปีงบประมาณ 2570</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 border-b pb-1">รายได้จากการดำเนินงาน (Operating Revenues)</h4>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>รายได้ค่ารักษาพยาบาล สปสช. (UC):</span>
                    <span className="font-mono font-bold text-slate-900">฿58,400,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>รายได้ค่าปรับผู้ขายส่งมอบล่าช้า:</span>
                    <span className="font-mono font-bold text-slate-900">฿50,000.00</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t font-bold text-emerald-800">
                    <span>รวมรายได้ทั้งสิ้น:</span>
                    <span className="font-mono">฿58,450,000.00</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 border-b pb-1">ค่าใช้จ่ายในการดำเนินงาน (Operating Expenses)</h4>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>ต้นทุนยาและเวชภัณฑ์ที่ใช้ไป:</span>
                    <span className="font-mono font-bold text-slate-900">฿32,150,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>ค่าเสื่อมราคาครุภัณฑ์การแพทย์:</span>
                    <span className="font-mono font-bold text-slate-900">฿1,850,000.00</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t font-bold text-rose-800">
                    <span>รวมค่าใช้จ่ายทั้งสิ้น:</span>
                    <span className="font-mono">฿34,000,000.00</span>
                  </div>
                </div>

                <div className="pt-2 border-t-2 border-slate-300">
                  <div className="flex justify-between p-3 rounded-lg bg-emerald-100 text-emerald-950 font-black text-sm">
                    <span>รายได้สูงกว่าค่าใช้จ่ายสุทธิ (Net Operating Surplus):</span>
                    <span className="font-mono">+฿24,450,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: NEW JOURNAL ENTRY */}
      {journalModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📝</span>
                <span>บันทึกสมุดรายวันทั่วไป (Manual Journal Entry - JV)</span>
              </h2>
              <button
                onClick={() => setJournalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">วันที่ลงบัญชี *</label>
                  <input
                    type="date"
                    required
                    value={journalForm.entryDate}
                    onChange={(e) => setJournalForm({ ...journalForm, entryDate: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">เลขที่เอกสารอ้างอิง *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น PV-10671-2569-0005"
                    value={journalForm.docReference}
                    onChange={(e) => setJournalForm({ ...journalForm, docReference: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">แหล่งเงิน / กองทุน *</label>
                  <select
                    value={journalForm.fundCode}
                    onChange={(e) => setJournalForm({ ...journalForm, fundCode: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-white"
                  >
                    <option value="HOSPITAL_MAINTENANCE">เงินบำรุงโรงพยาบาล</option>
                    <option value="GOV_BUDGET">งบประมาณแผ่นดิน</option>
                    <option value="UC_DEPRECIATION">งบค่าเสื่อม สปสช.</option>
                    <option value="DONATION_SPECIFIED">เงินบริจาคระบุวัตถุประสงค์</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">คำอธิบายรายการบัญชี *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="ระบุเหตุผลการลงบัญชีหรือปรับปรุงยอด..."
                  value={journalForm.description}
                  onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg"
                />
              </div>

              {/* Dynamic Lines */}
              <div className="border rounded-xl p-3 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800">รายการเดบิตและเครดิต (Journal Lines)</h4>
                  <button
                    type="button"
                    onClick={addJournalLine}
                    className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded text-[11px]"
                  >
                    ➕ เพิ่มบรรทัด
                  </button>
                </div>

                <div className="space-y-2">
                  {journalForm.lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border">
                      <div className="col-span-5">
                        <select
                          value={line.accountCode}
                          onChange={(e) => updateJournalLine(idx, "accountCode", e.target.value)}
                          className="w-full p-1.5 border rounded text-xs bg-white"
                        >
                          {coa.map((c) => (
                            <option key={c.accountCode} value={c.accountCode}>
                              {c.accountCode} - {c.accountNameTh}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="เดบิต (฿)"
                          value={line.debit || ""}
                          onChange={(e) => updateJournalLine(idx, "debit", e.target.value)}
                          className="w-full p-1.5 border rounded text-xs font-mono text-right"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="เครดิต (฿)"
                          value={line.credit || ""}
                          onChange={(e) => updateJournalLine(idx, "credit", e.target.value)}
                          className="w-full p-1.5 border rounded text-xs font-mono text-right"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeJournalLine(idx)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Balance validation */}
                <div className="flex justify-between items-center pt-2 border-t font-mono text-xs">
                  <div>
                    ยอดรวมเดบิต: <strong className="text-blue-800">฿{currentDebitTotal.toLocaleString()}</strong>
                  </div>
                  <div>
                    ยอดรวมเครดิต: <strong className="text-purple-800">฿{currentCreditTotal.toLocaleString()}</strong>
                  </div>
                  <div>
                    {isFormBalanced ? (
                      <span className="text-emerald-700 font-bold">✓ สมดุล (Balanced)</span>
                    ) : (
                      <span className="text-red-600 font-bold">
                        ⚠️ ไม่สมดุล (ต่างกัน ฿{Math.abs(currentDebitTotal - currentCreditTotal).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setJournalModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!isFormBalanced}
                  className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold disabled:opacity-50"
                >
                  💾 บันทึกใบสำคัญรายวันทั่วไป
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

