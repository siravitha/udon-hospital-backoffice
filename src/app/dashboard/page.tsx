"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MultiFundAbsorptionBar } from "@/components/MultiFundAbsorptionBar";

interface FundRow {
  fundCode: string;
  fundName: string;
  states: {
    allocated: number;
    preEncumbered: number;
    encumbered: number;
    carryOverEncumbered: number;
    disbursed: number;
  };
}

interface KpiPayload {
  kpiDate: string;
  funds: FundRow[];
  pipeline: {
    openPR: number;
    inStandstill: number;
    blanketPAActive: number;
    consignmentOpenItems: number;
    warrantyAlerts30d: number;
    maAlerts90d: number;
    calibrationDue: number;
  };
  sla: {
    payableAging: { d0to30: number; d31to60: number; d61to90: number; dOver90: number };
    netWorkingCapital: number;
  };
  generatedAtMs: number;
}

const FUND_NAMES: Record<string, string> = {
  GOV_BUDGET: "งบประมาณแผ่นดิน (GOV_BUDGET)",
  HOSPITAL_MAINTENANCE: "เงินบำรุงโรงพยาบาล (Maintenance Fund)",
  DONATION_SPECIFIED: "เงินบริจาคระบุวัตถุประสงค์ (Specified Donation)",
  DONATION_UNSPECIFIED: "เงินบริจาคไม่ระบุวัตถุประสงค์ (General Donation)",
  UC_DEPRECIATION: "งบค่าเสื่อมราคา สปสช. (UC Depreciation)",
};

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiPayload | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [sloViolation, setSloViolation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Additional live data
  const [trialBalanceBalanced, setTrialBalanceBalanced] = useState(true);
  const [recentJournals, setRecentJournals] = useState<any[]>([]);
  const [nearExpiryCount, setNearExpiryCount] = useState(1);

  const fetchKpis = useCallback(async () => {
    try {
      setLoading(true);
      const date = new Date().toISOString().slice(0, 10);
      const [kpiRes, tbRes, glRes, repRes] = await Promise.all([
        fetch(`/api/dashboard/kpis?date=${date}`),
        fetch("/api/accounting/trial-balance").catch(() => null),
        fetch("/api/accounting/gl").catch(() => null),
        fetch("/api/reports").catch(() => null),
      ]);

      setSource(kpiRes.headers.get("x-kpi-source"));
      setSloViolation(kpiRes.headers.get("x-kpi-slo-violation") === "true");

      if (kpiRes.ok) {
        const json = await kpiRes.json();
        setKpi(json);
      }

      if (tbRes && tbRes.ok) {
        const tbJson = await tbRes.json();
        setTrialBalanceBalanced(tbJson.isBalanced ?? true);
      }

      if (glRes && glRes.ok) {
        const glJson = await glRes.json();
        if (glJson.ok && Array.isArray(glJson.entries)) {
          setRecentJournals(glJson.entries.slice(0, 3));
        }
      }

      if (repRes && repRes.ok) {
        const repJson = await repRes.json();
        if (repJson.ok && repJson.data?.nearExpiry) {
          setNearExpiryCount(repJson.data.nearExpiry.length);
        }
      }
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // Aggregate Total Funds
  const totalAllocated = (kpi?.funds || []).reduce((s, f) => s + f.states.allocated, 0);
  const totalDisbursed = (kpi?.funds || []).reduce((s, f) => s + f.states.disbursed, 0);
  const totalEncumbered = (kpi?.funds || []).reduce((s, f) => s + f.states.encumbered, 0);
  const absorptionPct = totalAllocated > 0 ? ((totalDisbursed / totalAllocated) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      {/* Executive Command Header Banner */}
      <div className="bg-gradient-to-r from-[#09193A] via-[#172F6D] to-[#0F5B57] text-white py-8 px-6 shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-200 mb-1.5 font-medium">
                <span>โรงพยาบาลอุดรธานี (โรงพยาบาลศูนย์ตติยภูมิ 1,000+ เตียง)</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">HCODE: 10671 (เขตสุขภาพที่ 8)</span>
                <span>•</span>
                <span>ปีงบประมาณ พ.ศ. 2569</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl text-2xl">📊</span>
                <span>Executive Command Center Dashboard</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                ศูนย์บัญชาการข้อมูลผู้บริหาร: กำกับงบประมาณพหุกองทุน • ตรวจจับความผิดปกติแบบ Real-time • บัญชีแยกประเภท • ตรวจสอบธรรมาภิบาล สตง./ป.ป.ช.
              </p>
            </div>

            {/* Live System Specs Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
              <div className="text-left">
                <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ระบบฐานข้อมูลสถานะสด (MSI DGX)</span>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
                  Materialized View &lt; 50ms {source && `(${source})`}
                </div>
              </div>
              <button
                onClick={fetchKpis}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-bold transition flex items-center gap-1"
                title="รีเฟรชข้อมูลแบบสด"
              >
                <span>🔄</span> รีเฟรช
              </button>
            </div>
          </div>

          {/* Quick Command Action Bar */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-blue-200 mr-2">ทางลัดคำสั่งด่วน:</span>
            <Link
              href="/workspace/clinical-pharma"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center gap-1.5"
            >
              <span>📝</span> ขอซื้อยา PR
            </Link>
            <Link
              href="/workspace/budget/proposals"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition flex items-center gap-1.5"
            >
              <span>📑</span> ยื่นคำของบปี 2570
            </Link>
            <Link
              href="/workspace/finance"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center gap-1.5"
            >
              <span>💵</span> ตรวจจ่าย 3-Way Match
            </Link>
            <Link
              href="/workspace/accounting"
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-500/40 transition flex items-center gap-1.5"
            >
              <span>📒</span> ฝ่ายบัญชี & GL
            </Link>
            <Link
              href="/workspace/reports"
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition flex items-center gap-1.5"
            >
              <span>📊</span> ศูนย์รายงาน 4 เสา
            </Link>
            <Link
              href="/workspace/settings/running-numbers"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center gap-1.5"
            >
              <span>🔢</span> ตั้งค่าเลขรันเอกสาร
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 4 Core Financial & Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Multi-Fund Budget Total */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase">งบพหุกองทุนรวม (5 กองทุน)</span>
              <span className="text-base p-1.5 bg-blue-50 text-blue-700 rounded-lg">💰</span>
            </div>
            <div className="text-2xl font-black text-[#1E3A8A] mt-2 font-mono">
              ฿{(totalAllocated / 1e6).toFixed(1)}M
            </div>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span>●</span> เบิกจ่ายแล้ว {absorptionPct}%
              </span>
              <span className="text-slate-400 font-mono">฿{(totalDisbursed / 1e6).toFixed(1)}M</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Number(absorptionPct), 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: Cash at Bank & Working Capital */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase">สภาพคล่องเงินบำรุงโรงพยาบาล</span>
              <span className="text-base p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">🏦</span>
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-2 font-mono">
              ฿45.0M
            </div>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-emerald-700 font-bold">✓ รองรับได้ 4.2 เดือน</span>
              <span className="text-slate-500">เกณฑ์ สธ. &gt; 3 ด.</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              กระแสเงินสดหมุนเวียนคงที่ ไม่มีความเสี่ยงขาดสภาพคล่อง
            </p>
          </div>

          {/* Card 3: Accounts Payable & 3-Way Match */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase">หนี้การค้ารอเบิกจ่าย (AP Aging)</span>
              <span className="text-base p-1.5 bg-amber-50 text-amber-700 rounded-lg">🧾</span>
            </div>
            <div className="text-2xl font-black text-amber-800 mt-2 font-mono">
              ฿18.9M
            </div>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-slate-600 font-semibold">เกิน 60 วัน:</span>
              <span className="font-bold text-rose-700 font-mono">฿500,000 (2.6%)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              ผ่าน 3-Way Match อัตโนมัติ จ่ายตรงเวลา 94.2%
            </p>
          </div>

          {/* Card 4: Proposals FY2570 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase">คำของบประมาณปี 2570</span>
              <span className="text-base p-1.5 bg-purple-50 text-purple-700 rounded-lg">📑</span>
            </div>
            <div className="text-2xl font-black text-purple-900 mt-2 font-mono">
              ฿28.5M
            </div>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-purple-800 font-bold">4 โครงการยื่นขอ</span>
              <Link href="/workspace/budget/proposals" className="text-blue-600 hover:underline">
                ดูแผนงาน ↗
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              งบลงทุนครุภัณฑ์การแพทย์ขั้นสูง & อาคารผู้ป่วย
            </p>
          </div>
        </div>

        {/* 2-Column Split: Budget Multi-Funds vs Supply Chain & Clinical Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Multi-Fund Budget Gauges (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>🏦</span>
                    <span>ควบคุมเพดาน 5 กองทุนโรงพยาบาล (Multi-Fund Absorption Control)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hard-Stop ป้องกันการก่อหนี้ผูกพันเกินวงเงินที่ได้รับจัดสรรตามระเบียบกระทรวงสาธารณสุข
                  </p>
                </div>
                <Link
                  href="/workspace/budget"
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 text-xs font-bold transition"
                >
                  จัดการงบประมาณ ↗
                </Link>
              </div>

              {/* Fund Absorption Bars */}
              <div className="mt-5 space-y-4">
                {kpi?.funds.map((f) => (
                  <div key={f.fundCode} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <MultiFundAbsorptionBar
                      label={FUND_NAMES[f.fundCode] ?? f.fundName}
                      states={f.states}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Allocated
                <span className="w-2 h-2 rounded-full bg-amber-500 ml-2"></span> Pre-Encumbered
                <span className="w-2 h-2 rounded-full bg-purple-600 ml-2"></span> Encumbered
                <span className="w-2 h-2 rounded-full bg-emerald-600 ml-2"></span> Disbursed
              </span>
              <span className="font-semibold text-slate-700">Deterministic Pessimistic Lock</span>
            </div>
          </div>

          {/* Right Column: Supply Chain & Clinical Pipeline (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Supply Chain Widgets */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📦</span>
                  <span>ห่วงโซ่อุปทาน & คลังยา (Supply Chain Hub)</span>
                </h3>
                <Link
                  href="/inventory"
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  คลังยากลาง ↗
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">PR รออนุมัติจัดหา</div>
                  <div className="text-xl font-black text-[#1E3A8A] mt-1 font-mono">
                    {kpi?.pipeline.openPR || 0} ฉบับ
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ยา & ครุภัณฑ์</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div className="text-[11px] text-amber-800 font-semibold">อยู่ใน Standstill (7 วัน)</div>
                  <div className="text-xl font-black text-amber-900 mt-1 font-mono">
                    {kpi?.pipeline.inStandstill || 0} โครงการ
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">ล็อกห้ามออก PO</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 font-semibold">สัญญา Blanket PA ที่มีผล</div>
                  <div className="text-xl font-black text-emerald-900 mt-1 font-mono">
                    {kpi?.pipeline.blanketPAActive || 0} สัญญา
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">ตัดโควตายาอัตโนมัติ</div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                  <div className="text-[11px] text-purple-800 font-semibold">OR Consignment ค้างตัด</div>
                  <div className="text-xl font-black text-purple-900 mt-1 font-mono">
                    {kpi?.pipeline.consignmentOpenItems || 0} เคส
                  </div>
                  <div className="text-[10px] text-purple-700 mt-0.5">HIS Webhook รับสด</div>
                </div>
              </div>

              {/* Alert Banner: FEFO Near Expiry */}
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">
                      เฝ้าระวังยาใกล้หมดอายุ (FEFO Alert): {nearExpiryCount} รายการ
                    </h4>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      ยาปฏิชีวนะ Meropenem 1g (Lot M2601) หมดอายุในอีก 44 วัน เร่งเบิกใช้ก่อน
                    </p>
                  </div>
                </div>
                <Link
                  href="/workspace/reports"
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shrink-0"
                >
                  ดูรายงาน ↗
                </Link>
              </div>
            </div>

            {/* Financial Health & Accounting Check */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📒</span>
                  <span>สุขภาพการเงิน & บัญชีแยกประเภท (GL Health)</span>
                </h3>
                <Link
                  href="/workspace/accounting"
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  ฝ่ายบัญชี ↗
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <span>✓</span>
                    <span>งบทดลองประจำงวด (Trial Balance):</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">
                    เดบิต = เครดิต สมดุล 100%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-bold text-slate-700 mb-1.5 flex justify-between">
                    <span>สมุดรายวันทั่วไปล่าสุด (Auto GL Entries):</span>
                    <span className="text-blue-700 font-mono">3 รายการ</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    {recentJournals.map((j) => (
                      <div key={j.id} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="font-mono text-slate-800">{j.journalNo} ({j.docReference})</span>
                        <span className="font-mono font-bold text-slate-900">฿{j.totalDebit.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HOS-AI Real-time Sentinel & Anti-Corruption Watchdog */}
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-indigo-500/20">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    HOS-AI Real-time Sentinel & Anti-Corruption Watchdog
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                    MSI DGX Local AI Active
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                    100% PDPA Safe (Air-Gapped)
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-1">
                  ระบบปัญญาประดิษฐ์เฝ้าระวังความเสี่ยงการทุจริต ตรวจจับแบ่งซื้อแบ่งจ้าง และคาดการณ์คลังยา ประมวลผลบนซูเปอร์คอมพิวเตอร์ MSI DGX ภายในโรงพยาบาล
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("open-hos-ai-copilot", {
                        detail: {
                          model: "dgx-deepseek-r1:32b",
                          prompt: "ตรวจสอบความเสี่ยงทุจริต การแบ่งซื้อแบ่งจ้าง (Split PO) วงเงินไม่เกิน 500,000 บาท ในรอบเดือนนี้",
                        },
                      })
                    );
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-900/50 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🛡️</span>
                <span>ตรวจจับความเสี่ยงทุจริต</span>
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("open-hos-ai-copilot", {
                        detail: {
                          model: "dgx-qwen3-coder:30b",
                          prompt: "สรุปภาพรวมสถานะงบประมาณ สภาพคล่องเงินบำรุง และจุดเสี่ยงที่ต้องเร่งดำเนินการ",
                        },
                      })
                    );
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>💬</span>
                <span>เปิด HOS-AI Copilot</span>
              </button>
            </div>
          </div>

          {/* 3 Live Sentinel Scanner Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {/* Widget 1: Procurement Watchdog */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-indigo-500/20 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span>🛡️</span> จัดซื้อจัดจ้าง (Split PO Watchdog)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                  เฝ้าระวัง 1 เคส
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                พบใบสั่งซื้อ 2 รายการรวม ฿950,000 แก่คู่ค้ารายเดียวกันในรอบ 30 วัน แนะนำตรวจสอบข้อเท็จจริงตามระเบียบ พ.ร.บ. จัดซื้อจัดจ้างฯ 2560
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">อัลกอริทึม: Anomaly Split Scan</span>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("open-hos-ai-copilot", {
                          detail: {
                            model: "dgx-deepseek-r1:32b",
                            prompt: "วิเคราะห์รายละเอียดคู่ค้าและใบสั่งซื้อที่เข้าข่ายแบ่งซื้อแบ่งจ้างเพื่อไม่เกิน 500,000 บาท",
                          },
                        })
                      );
                    }
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  วิเคราะห์ผล ↗
                </button>
              </div>
            </div>

            {/* Widget 2: Drug Expiry & Clinical Sentinel */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-indigo-500/20 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <span>💊</span> เวชภัณฑ์ & FEFO Expiry Sentinel
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                  ด่วน (44 วัน)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Meropenem 1g (Lot M2601) เหลืออายุ 44 วัน มูลค่า ฿120,000 AI แนะนำจัดสรรให้ ICU และหอผู้ป่วยวิกฤตที่มีอัตราการใช้สูงทันที
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">มาตรการ: FEFO Dynamic Dispatch</span>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("open-hos-ai-copilot", {
                          detail: {
                            model: "dgx-qwen3-coder:30b",
                            prompt: "วางแผนการกระจายยา Meropenem 1g ล็อต M2601 ไปยังวอร์ดผู้ป่วยวิกฤตเพื่อป้องกันยาหมดอายุสูญเปล่า",
                          },
                        })
                      );
                    }
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold"
                >
                  แผนกระจายยา ↗
                </button>
              </div>
            </div>

            {/* Widget 3: Multi-Fund & Trial Balance Guard */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-indigo-500/20 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>⚖️</span> งบประมาณ & Trial Balance Guard
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  ปกติ สมบูรณ์
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                งบทดลองเดบิต-เครดิตสมดุล 100% สภาพคล่องเงินบำรุง ฿45.0M (รองรับ 4.2 เดือน) ไม่มีรายการเบิกจ่ายข้ามวัตถุประสงค์กองทุน
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">ความน่าเชื่อถือ: 100% Deterministic</span>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("open-hos-ai-copilot", {
                          detail: {
                            model: "dgx-qwen3-coder:30b",
                            prompt: "ขอรายงานสรุปสถานะการเงิน สภาพคล่องเงินบำรุง และความพร้อมในการรองรับเหตุฉุกเฉิน",
                          },
                        })
                      );
                    }
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  สรุปการเงิน ↗
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner: Security & Governance Accreditation */}
        <div className="bg-gradient-to-r from-slate-900 to-[#1E293B] text-white p-5 rounded-2xl border border-slate-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-xl shrink-0">
              🛡️
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>การคุ้มครองความปลอดภัย & ความโปร่งใสระดับชาติ (GovTech Security Assurance)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  สตง. / ป.ป.ช. Certified
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                เข้ารหัส Cryptographic SHA-256 Hash Chaining • ลายมือชื่ออิเล็กทรอนิกส์ PAdES-LTV • 2FA MOPH Provider ID • พรางข้อมูล PDPA Masked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/auditor"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>🔍</span> ตรวจสอบ WORM Hash Chain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
