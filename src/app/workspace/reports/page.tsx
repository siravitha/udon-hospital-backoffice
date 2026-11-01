"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ReportData {
  skr1: any[];
  apAging: any[];
  whtList: any[];
  nearExpiry: any[];
  anomalies: any[];
}

export default function ReportsHubPage() {
  const [activePillar, setActivePillar] = useState<"skr1" | "aging" | "fefo" | "audit">("skr1");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState("2569");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export to CSV/Excel
  function handleExportCsv() {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM for Thai Excel

    if (activePillar === "skr1") {
      csvContent += "ลำดับ,เลขที่โครงการ,ชื่อโครงการ,งบประมาณ (บาท),ราคากลาง (บาท),วิธีจัดหา,ผู้ชนะ,ราคาที่ตกลงซื้อ,เหตุผลที่คัดเลือก\n";
      data.skr1.forEach((r) => {
        csvContent += `"${r.seq}","${r.projectNo}","${r.projectName}","${r.budgetAmount}","${r.medianPrice}","${r.procurementMethod}","${r.awardedWinner}","${r.awardedPrice}","${r.selectionReason}"\n`;
      });
    } else if (activePillar === "aging") {
      csvContent += "รหัสผู้ขาย,ชื่อคู่ค้า,เลขผู้เสียภาษี,ยอดหนี้รวม (บาท),0-30 วัน,31-60 วัน,61-90 วัน,เกิน 90 วัน,เครดิตเทอม (วัน),สถานะ\n";
      data.apAging.forEach((r) => {
        csvContent += `"${r.vendorCode}","${r.vendorName}","${r.taxId}","${r.totalPayable}","${r.current0to30}","${r.past31to60}","${r.past61to90}","${r.over90Days}","${r.creditTermDays}","${r.status}"\n`;
      });
    } else if (activePillar === "fefo") {
      csvContent += "รหัสเวชภัณฑ์,ชื่อยา/เวชภัณฑ์,ชื่อสามัญ,Lot No,วันหมดอายุ,วันคงเหลือ,จำนวนคงเหลือ,หน่วย,มูลค่ารวม (บาท),สถานที่เก็บ,สถานะเสี่ยง\n";
      data.nearExpiry.forEach((r) => {
        csvContent += `"${r.itemCode}","${r.itemName}","${r.genericName}","${r.lotNo}","${r.expiryDate}","${r.daysRemaining}","${r.remainingQty}","${r.unit}","${r.totalValue}","${r.location}","${r.riskStatus}"\n`;
      });
    } else {
      csvContent += "รหัสแจ้งเตือน,ระดับความเสี่ยง,หมวดหมู่,หัวข้อข้อสังเกต,รายละเอียด,หน่วยงาน/คู่สัญญาที่เกี่ยวข้อง,วงเงิน (บาท),ข้อเสนอแนะ\n";
      data.anomalies.forEach((r) => {
        csvContent += `"${r.alertId}","${r.severity}","${r.category}","${r.title}","${r.description}","${r.involvedEntity}","${r.amount}","${r.recommendedAction}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hospital_report_${activePillar}_FY${fiscalYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Print PDF
  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#15803D] text-white py-8 px-6 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
            <Link href="/dashboard" className="hover:text-white transition">หน้าหลัก</Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">ศูนย์ข้อมูลกลาง</span>
            <span>/</span>
            <span className="text-white font-bold">ศูนย์รายงานและสารสนเทศโรงพยาบาล</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl">📊</span>
                <span>ศูนย์รายงานและสารสนเทศโรงพยาบาล (Hospital Intelligence & Regulatory Reporting Center)</span>
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                4 เสาหลักรายงานมาตรฐานราชการ: แบบ สขร. 1 • หนี้การค้า Aging • ยาใกล้หมดอายุ FEFO • รายงานตรวจสอบ สตง./ป.ป.ช.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <span>📥 ส่งออกข้อมูล Excel (.xlsx/CSV)</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold backdrop-blur-xs transition flex items-center gap-1.5"
              >
                <span>🖨️ พิมพ์รายงานทางการ (PDF)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">รายงาน สขร. 1 ประจำงวด</div>
              <div className="text-2xl font-extrabold text-white mt-0.5">3 โครงการ</div>
              <div className="text-[10px] text-emerald-300 mt-1">ประหยัดงบได้ ฿55,000</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">หนี้การค้ารอเบิกจ่าย</div>
              <div className="text-2xl font-extrabold text-amber-300 mt-0.5 font-mono">฿18.9M</div>
              <div className="text-[10px] text-slate-300 mt-1">เจ้าหนี้ 4 รายหลัก</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">ยาต้องเฝ้าระวังหมดอายุ (3 เดือน)</div>
              <div className="text-2xl font-extrabold text-rose-300 mt-0.5">1 รายการ</div>
              <div className="text-[10px] text-rose-200 mt-1">Meropenem (44 วัน)</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">ข้อสังเกตตรวจจับทุจริต/ผิดปกติ</div>
              <div className="text-2xl font-extrabold text-cyan-300 mt-0.5">3 ข้อสังเกต</div>
              <div className="text-[10px] text-cyan-200 mt-1">ระบบป้องกันอัตโนมัติ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Print Header */}
        <div className="hidden print:block text-center border-b pb-4 mb-6">
          <h2 className="text-lg font-black text-slate-900">
            โรงพยาบาลอุดรธานี (โรงพยาบาลศูนย์ตติยภูมิ 1,000+ เตียง • HCODE: 10671)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            รายงานราชการประจำปีงบประมาณ พ.ศ. {fiscalYear} • ออกรายงานเมื่อ: {new Date().toLocaleDateString("th-TH")}
          </p>
        </div>

        {/* Toolbar & Pillar Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs mb-6 overflow-x-auto print:hidden">
          <button
            onClick={() => setActivePillar("skr1")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activePillar === "skr1"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📑 เสา 1: สรุปจัดซื้อจัดจ้าง (สขร. 1)</span>
          </button>
          <button
            onClick={() => setActivePillar("aging")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activePillar === "aging"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>💰 เสา 2: หนี้การค้า & ภาษี ภ.ง.ด. 53</span>
          </button>
          <button
            onClick={() => setActivePillar("fefo")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activePillar === "fefo"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>💊 เสา 3: คลังยา FEFO & ยาใกล้หมดอายุ</span>
          </button>
          <button
            onClick={() => setActivePillar("audit")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activePillar === "audit"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>🛡️ เสา 4: ธรรมาภิบาล สตง./ป.ป.ช.</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            กำลังประมวลผลและดึงข้อมูลรายงานโรงพยาบาล...
          </div>
        ) : !data ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
            ไม่พบข้อมูลรายงาน
          </div>
        ) : (
          <div className="space-y-6">
            {/* PILLAR 1: สขร. 1 */}
            {activePillar === "skr1" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      แบบสรุปผลการดำเนินการจัดซื้อจัดจ้างในรอบเดือน (แบบ สขร. 1)
                    </h3>
                    <p className="text-xs text-slate-500">
                      ตามประกาศคณะกรรมการข้อมูลข่าวสารของราชการ • ประจำปีงบประมาณ พ.ศ. {fiscalYear}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    เผยแพร่สาธารณะ (Gov Transparency)
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-center">ลำดับ</th>
                          <th className="p-3">งานที่จัดซื้อ/จัดจ้าง</th>
                          <th className="p-3 text-right">วงเงินงบประมาณ</th>
                          <th className="p-3 text-right">ราคากลาง</th>
                          <th className="p-3">วิธีจัดซื้อ/จัดจ้าง</th>
                          <th className="p-3">ผู้ได้รับการคัดเลือก</th>
                          <th className="p-3 text-right">ราคาที่ตกลงซื้อ</th>
                          <th className="p-3">เหตุผลที่คัดเลือก</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.skr1.map((r) => (
                          <tr key={r.seq} className="hover:bg-slate-50 transition">
                            <td className="p-3 text-center font-bold text-slate-500">{r.seq}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{r.projectName}</div>
                              <div className="text-[11px] font-mono text-[#1E3A8A]">{r.projectNo}</div>
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-slate-800">
                              {r.budgetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600">
                              {r.medianPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-slate-700">{r.procurementMethod}</td>
                            <td className="p-3 font-semibold text-emerald-800">{r.awardedWinner}</td>
                            <td className="p-3 text-right font-mono font-black text-emerald-900">
                              {r.awardedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-slate-600 text-[11px] max-w-xs">{r.selectionReason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PILLAR 2: AP AGING & WHT */}
            {activePillar === "aging" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    1. รายงานอายุหนี้เจ้าหนี้การค้าโรงพยาบาล (Accounts Payable Aging Report)
                  </h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">รหัส/ชื่อคู่ค้า</th>
                          <th className="p-3 text-right">ยอดหนี้รวม (฿)</th>
                          <th className="p-3 text-right">0-30 วัน</th>
                          <th className="p-3 text-right">31-60 วัน</th>
                          <th className="p-3 text-right">61-90 วัน</th>
                          <th className="p-3 text-right">เกิน 90 วัน</th>
                          <th className="p-3 text-center">เครดิตเทอม</th>
                          <th className="p-3 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.apAging.map((v) => (
                          <tr key={v.vendorCode} className="hover:bg-slate-50 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{v.vendorName}</div>
                              <div className="text-[11px] font-mono text-slate-500">{v.vendorCode} • Tax: {v.taxId}</div>
                            </td>
                            <td className="p-3 text-right font-mono font-black text-[#1E3A8A]">
                              {v.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-700">
                              {v.current0to30 > 0 ? v.current0to30.toLocaleString() : "-"}
                            </td>
                            <td className="p-3 text-right font-mono text-blue-700">
                              {v.past31to60 > 0 ? v.past31to60.toLocaleString() : "-"}
                            </td>
                            <td className="p-3 text-right font-mono text-amber-700">
                              {v.past61to90 > 0 ? v.past61to90.toLocaleString() : "-"}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-rose-700">
                              {v.over90Days > 0 ? v.over90Days.toLocaleString() : "-"}
                            </td>
                            <td className="p-3 text-center font-semibold text-slate-600">{v.creditTermDays} วัน</td>
                            <td className="p-3 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  v.status === "NORMAL"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : v.status === "OVERDUE"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {v.status === "NORMAL" ? "ปกติ" : v.status === "OVERDUE" ? "เกินกำหนด" : "วิกฤต"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    2. สรุปรายการภาษีหัก ณ ที่จ่าย 1% (ภ.ง.ด. 53 ประจำงวด)
                  </h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-center">ลำดับ</th>
                          <th className="p-3">วันที่จ่าย/เลขที่ใบสำคัญ</th>
                          <th className="p-3">ผู้มีเงินได้ (คู่ค้า)</th>
                          <th className="p-3">ประเภทเงินได้</th>
                          <th className="p-3 text-right">ฐาน Ex-VAT (฿)</th>
                          <th className="p-3 text-center">อัตราภาษี</th>
                          <th className="p-3 text-right">ภาษีที่หัก (฿)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.whtList.map((w) => (
                          <tr key={w.seq} className="hover:bg-slate-50 transition">
                            <td className="p-3 text-center font-bold text-slate-500">{w.seq}</td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900">{w.voucherNo}</div>
                              <div className="text-[11px] text-slate-500">{w.paymentDate}</div>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {w.vendorName}
                              {w.isGpoExempt && (
                                <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                  ยกเว้นภาษี (GPO)
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600">{w.incomeDescription}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {w.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center font-bold">{w.whtRatePct}%</td>
                            <td className="p-3 text-right font-mono font-black text-purple-900">
                              {w.whtDeducted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PILLAR 3: FEFO */}
            {activePillar === "fefo" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      รายงานยาและเวชภัณฑ์ใกล้หมดอายุ (Near-Expiry FEFO Inventory Risk)
                    </h3>
                    <p className="text-xs text-slate-500">
                      แจ้งเตือนยาล่วงหน้า 3 เดือน, 6 เดือน และ 12 เดือน เพื่อเร่งระบายยาและส่งเปลี่ยนคืนตามเงื่อนไขสัญญา
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-rose-100 text-rose-800">
                      วิกฤต &lt; 90 วัน
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800">
                      เตือน &lt; 180 วัน
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">รหัส/ชื่อยา</th>
                        <th className="p-3">หมวดหมู่</th>
                        <th className="p-3">Lot No.</th>
                        <th className="p-3">วันหมดอายุ</th>
                        <th className="p-3 text-center">คงเหลือ (วัน)</th>
                        <th className="p-3 text-right">จำนวนคงคลัง</th>
                        <th className="p-3 text-right">มูลค่ารวม (฿)</th>
                        <th className="p-3">สถานที่เก็บ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.nearExpiry.map((item) => (
                        <tr key={item.itemCode} className="hover:bg-slate-50 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.itemName}</div>
                            <div className="text-[11px] text-slate-500">{item.itemCode} • {item.genericName}</div>
                          </td>
                          <td className="p-3 text-slate-600">{item.category}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{item.lotNo}</td>
                          <td className="p-3 font-mono text-slate-800">{item.expiryDate}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                item.riskStatus === "CRITICAL_3M"
                                  ? "bg-rose-100 text-rose-800 animate-pulse"
                                  : item.riskStatus === "WARNING_6M"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {item.daysRemaining} วัน
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {item.remainingQty.toLocaleString()} {item.unit}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ฿{item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-slate-600 text-[11px]">{item.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PILLAR 4: AUDIT & ANOMALIES */}
            {activePillar === "audit" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      รายงานตรวจจับความผิดปกติและข้อสังเกตการจัดซื้อ (Fraud & Anomaly Compliance)
                    </h3>
                    <p className="text-xs text-slate-500">
                      ตรวจจับตามเกณฑ์ของสำนักงานการตรวจเงินแผ่นดิน (สตง.) และคณะกรรมการ ป.ป.ช.
                    </p>
                  </div>
                  <Link
                    href="/auditor"
                    className="px-3.5 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition flex items-center gap-1.5"
                  >
                    <span>🛡️ เปิด Auditor WORM Console</span>
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.anomalies.map((anm) => (
                    <div
                      key={anm.alertId}
                      className={`p-4 rounded-xl border shadow-xs ${
                        anm.severity === "CRITICAL"
                          ? "bg-red-50/50 border-red-200"
                          : anm.severity === "HIGH"
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-blue-50/50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              anm.severity === "CRITICAL"
                                ? "bg-red-600 text-white"
                                : anm.severity === "HIGH"
                                ? "bg-amber-600 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            {anm.severity}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700">{anm.alertId}</span>
                          <h4 className="text-sm font-bold text-slate-900">{anm.title}</h4>
                        </div>
                        <span className="text-xs font-mono font-black text-slate-900">
                          ฿{anm.amount.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 mt-2">{anm.description}</p>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                        <div className="text-slate-500">
                          หน่วยงานที่เกี่ยวข้อง: <strong>{anm.involvedEntity}</strong>
                        </div>
                        <div className="text-indigo-900 font-semibold">
                          💡 ข้อเสนอแนะ: {anm.recommendedAction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

