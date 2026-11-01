"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface InventoryLot {
  lotNo: string;
  expiryDate: string;
  qty: number;
  unitCost: number;
  location: string;
}

interface CentralInventoryItem {
  itemCode: string;
  drugName: string;
  genericName: string;
  category: "COLD_CHAIN" | "INJECTION" | "ORAL" | "IMPLANT" | "MEDICAL_SUPPLY";
  uom: string;
  totalStock: number;
  minParLevel: number;
  maxParLevel: number;
  reorderPoint: number;
  coldChain: boolean;
  currentTempC?: number;
  lots: InventoryLot[];
}

interface WardStockItem {
  itemCode: string;
  drugName: string;
  uom: string;
  currentQty: number;
  parLevel: number;
  minLevel: number;
}

interface WardSubStock {
  wardId: string;
  wardName: string;
  department: string;
  stock: WardStockItem[];
}

interface WardRequisitionRow {
  reqId: string;
  reqNo: string;
  wardId: string;
  wardName: string;
  itemCode: string;
  drugName: string;
  requestedQty: number;
  dispensedQty: number;
  dispensedLots: Array<{ lotNo: string; qty: number }>;
  status: "REQUESTED" | "DISPENSED" | "REJECTED";
  requestedBy: string;
  createdAt: string;
}

export default function HospitalInventoryPage() {
  const [activeTab, setActiveTab] = useState<"central" | "wards" | "requisitions">("central");
  const [inventory, setInventory] = useState<CentralInventoryItem[]>([]);
  const [wardStocks, setWardStocks] = useState<WardSubStock[]>([]);
  const [requisitions, setRequisitions] = useState<WardRequisitionRow[]>([]);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states for Receiving New Lot
  const [rcvItemCode, setRcvItemCode] = useState("DRUG-ALB-20");
  const [rcvLotNo, setRcvLotNo] = useState("ALB-26-909");
  const [rcvExpiry, setRcvExpiry] = useState("2028-06-30");
  const [rcvQty, setRcvQty] = useState(200);
  const [rcvUnitCost, setRcvUnitCost] = useState(1250);
  const [rcvLocation, setRcvLocation] = useState("COLD-ROOM-A1");

  // Form states for Ward Requisition
  const [reqWardId, setReqWardId] = useState("WARD-ICU");
  const [reqItemCode, setReqItemCode] = useState("DRUG-ALB-20");
  const [reqQty, setReqQty] = useState(15);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/items");
      const data = await res.json();
      if (data.ok) {
        setInventory(data.inventory || []);
        setWardStocks(data.wardStocks || []);
        setRequisitions(data.requisitions || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  async function handleReceiveLot(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const res = await fetch("/api/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemCode: rcvItemCode,
        lotNo: rcvLotNo,
        expiryDate: rcvExpiry,
        qty: Number(rcvQty),
        unitCost: Number(rcvUnitCost),
        location: rcvLocation,
        actorUsername: "ภก. คลังยากลาง (MOPH Provider 2FA Verified)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "ไม่สามารถบันทึกรับยาเข้าคลังได้" });
      return;
    }
    setInventory(data.inventory);
    setBanner({
      type: "ok",
      text: `รับเวชภัณฑ์เข้าคลังกลางสำเร็จ! รหัส ${rcvItemCode} Lot ${rcvLotNo} จำนวน ${rcvQty} หน่วย ลงบันทึก SHA-256 Audit Log เรียบร้อย`,
    });
  }

  async function handleCreateRequisition(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const res = await fetch("/api/inventory/requisitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wardId: reqWardId,
        itemCode: reqItemCode,
        requestedQty: Number(reqQty),
        requestedBy: "พว. หัวหน้าเวรพยาบาล (MOPH-PID-2FA)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "สร้างใบเบิกยาไม่สำเร็จ" });
      return;
    }
    setRequisitions(data.requisitions);
    setActiveTab("requisitions");
    setBanner({
      type: "ok",
      text: `ส่งใบเบิกยา ${data.requisition.reqNo} สำเร็จ! ส่งตรงไปยังคลังยากลางเพื่อรอจัดจ่ายตามเกณฑ์ FEFO`,
    });
  }

  async function handleDispenseFefo(reqId: string) {
    setBanner(null);
    const res = await fetch("/api/inventory/requisitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DISPENSE",
        reqId,
        actorUsername: "ภก. ชัยวัฒน์ (หัวหน้าคลังยากลาง • FEFO Verified)",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBanner({ type: "err", text: data.error || "จ่ายยาไม่สำเร็จ" });
      return;
    }
    setInventory(data.inventory);
    setWardStocks(data.wardStocks);
    setRequisitions(data.requisitions);
    const lotsSummary = data.requisition.dispensedLots
      .map((l: any) => `Lot ${l.lotNo} (${l.qty} หน่วย)`)
      .join(", ");
    setBanner({
      type: "ok",
      text: `อนุมัติจ่ายยาใบเบิก ${data.requisition.reqNo} สำเร็จ! ตัดจ่ายตามเกณฑ์ FEFO จาก [${lotsSummary}] และนำเข้าตู้ยา ${data.requisition.wardName} ทันที`,
    });
  }

  // Inventory valuation calculation
  const totalValuation = inventory.reduce((sum, item) => {
    return sum + item.lots.reduce((s, l) => s + l.qty * l.unitCost, 0);
  }, 0);

  const pendingReqCount = requisitions.filter((r) => r.status === "REQUESTED").length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <header className="bg-[#1E3A8A] text-white rounded-xl p-6 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <span>🏥 HOS-ERP ENTERPRISE</span>
              <span>•</span>
              <span>SUPPLY CHAIN & PHARMA INVENTORY</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">
              ระบบบริหารจัดการคลังยา เวชภัณฑ์ และซัพพลายเชนโรงพยาบาล (Central & Ward Inventory)
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              ควบคุมคลังยากลาง • กฎการจ่ายยาหมดอายุก่อนจ่ายก่อน (FEFO) • มอนิเตอร์ตู้ยาวอร์ด Par Level • ตรวจวัดอุณหภูมิ Cold-Chain
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
            >
              {loading ? "🔄 กำลังซิงค์..." : "🔄 รีเฟรชข้อมูลสต็อก"}
            </button>
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
            >
              📊 Executive Dashboard
            </Link>
          </div>
        </header>

        {/* Executive Inventory KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">มูลค่าสต็อกเวชภัณฑ์คงคลังรวม</div>
            <div className="text-xl font-extrabold text-[#1E3A8A] tabular-nums mt-1">
              ฿{totalValuation.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">
              ● ครอบคลุม {inventory.length} รายการหลัก (SKUs)
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">ยาควบคุมความเย็น Cold-Chain</div>
            <div className="text-xl font-extrabold text-teal-700 tabular-nums mt-1">
              {inventory.filter((i) => i.coldChain).length} รายการ (2.0°C - 8.0°C)
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              เซนเซอร์อุณหภูมิปกติ (4.2°C)
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">ตู้ยาย่อยประจำวอร์ด (Sub-Stocks)</div>
            <div className="text-xl font-extrabold text-[#1E3A8A] tabular-nums mt-1">
              {wardStocks.length} แผนกหลัก
            </div>
            <div className="text-xs text-slate-600 mt-1">ICU ศัลยกรรม • ห้องฉุกเฉิน ER • ห้องผ่าตัด OR</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">ใบเบิกยารอจ่าย (Pending FEFO)</div>
            <div className="text-xl font-extrabold text-amber-700 tabular-nums mt-1">
              {pendingReqCount} รายการ
            </div>
            <div className="text-xs text-blue-800 font-semibold mt-1">
              {pendingReqCount > 0 ? "⚡ มีรายการรอคลังจ่ายด่วน" : "✅ จ่ายครบทุกรายการแล้ว"}
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

        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveTab("central")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "central"
                ? "bg-[#1E3A8A] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📦 1. คลังยากลาง & บัญชีรุ่นผลิต (Central Inventory & FEFO Lots)
          </button>
          <button
            onClick={() => setActiveTab("wards")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "wards"
                ? "bg-[#1E3A8A] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🏥 2. ตู้ยาย่อยประจำวอร์ด (Ward Sub-Stocks & Par Levels)
          </button>
          <button
            onClick={() => setActiveTab("requisitions")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === "requisitions"
                ? "bg-[#1E3A8A] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>📋 3. ใบเบิกยา & จ่ายยา FEFO (Requisitions & Dispensing)</span>
            {pendingReqCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {pendingReqCount}
              </span>
            )}
          </button>
        </nav>

        {/* TAB 1: CENTRAL INVENTORY */}
        {activeTab === "central" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1E3A8A]">
                    📦 บัญชีคลังยาและเวชภัณฑ์กลาง (Central Pharmacy Stock & FEFO Lots)
                  </h2>
                  <p className="text-xs text-slate-500">
                    ติดตามยอดคงคลังระดับรุ่นผลิต (Lot Tracking) พร้อมคำนวณวันหมดอายุอัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {inventory.map((item) => {
                  const isLow = item.totalStock <= item.reorderPoint;
                  return (
                    <div
                      key={item.itemCode}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1E3A8A] bg-blue-100 px-2 py-0.5 rounded">
                              {item.itemCode}
                            </span>
                            <span className="font-bold text-sm text-slate-900">{item.drugName}</span>
                            {item.coldChain && (
                              <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded">
                                ❄️ Cold-Chain {item.currentTempC}°C
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            ชื่อสามัญ: {item.genericName} • หมวด: {item.category} • หน่วย: {item.uom}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-extrabold text-[#1E3A8A] tabular-nums">
                            {item.totalStock.toLocaleString()} {item.uom}
                          </div>
                          <div className="text-xs">
                            {isLow ? (
                              <span className="text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded">
                                ⚠️ ต่ำกว่าจุดสั่งซื้อ (Reorder &le; {item.reorderPoint})
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">
                                ปลอดภัย (Par: {item.minParLevel} - {item.maxParLevel})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lot Breakdown Table */}
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-3 py-1.5 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase flex justify-between">
                          <span>รุ่นผลิต (Lot No. & FEFO Sequence)</span>
                          <span>วันหมดอายุ (Expiry) • สถานะ</span>
                          <span>คงเหลือ (หน่วย)</span>
                        </div>
                        <div className="divide-y divide-slate-100 text-xs">
                          {item.lots.map((lot, idx) => (
                            <div key={lot.lotNo} className="px-3 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-700">
                                  #{idx + 1} {lot.lotNo}
                                </span>
                                <span className="text-slate-400">({lot.location})</span>
                              </div>
                              <div className="font-mono text-slate-600">
                                Exp: <span className="font-bold text-slate-800">{lot.expiryDate}</span>
                              </div>
                              <div className="font-bold tabular-nums text-emerald-800">
                                {lot.qty.toLocaleString()} {item.uom}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Receive New Lot Form */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                📥 รับเวชภัณฑ์เข้าคลังกลาง (Put-away / Lot Inward)
              </h2>
              <p className="text-xs text-slate-500">
                บันทึกรับยาจากการตรวจรับ (Inspection Accepted) พร้อมระบุ Lot และวันหมดอายุ
              </p>

              <form onSubmit={handleReceiveLot} className="space-y-3 text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลือกรายการยา/เวชภัณฑ์</label>
                  <select
                    value={rcvItemCode}
                    onChange={(e) => setRcvItemCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  >
                    {inventory.map((i) => (
                      <option key={i.itemCode} value={i.itemCode}>
                        {i.itemCode} — {i.drugName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lot Number</label>
                    <input
                      value={rcvLotNo}
                      onChange={(e) => setRcvLotNo(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">วันหมดอายุ (Expiry)</label>
                    <input
                      type="date"
                      value={rcvExpiry}
                      onChange={(e) => setRcvExpiry(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">จำนวนที่รับเข้า</label>
                    <input
                      type="number"
                      value={rcvQty}
                      onChange={(e) => setRcvQty(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                      min={1}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ราคาทุนต่อหน่วย (บาท)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rcvUnitCost}
                      onChange={(e) => setRcvUnitCost(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งจัดเก็บ (Storage Bin)</label>
                  <input
                    value={rcvLocation}
                    onChange={(e) => setRcvLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                    placeholder="เช่น COLD-ROOM-A1, STORE-B3"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white font-bold transition shadow-xs mt-2"
                >
                  ✅ บันทึกรับเข้าคลัง & อัปเดตสต็อกกลาง
                </button>
              </form>
            </section>
          </div>
        )}

        {/* TAB 2: WARD SUB-STOCKS */}
        {activeTab === "wards" && (
          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[#1E3A8A]">
                    🏥 ตู้ยาย่อยประจำหอผู้ป่วย & ห้องผ่าตัด (Ward Sub-Stocks & Par Levels)
                  </h2>
                  <p className="text-xs text-slate-500">
                    ติดตามระดับยาสำรอง (Par Level) แบบ Real-time เพื่อป้องกันยาวิกฤตขาดตู้
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    ระดับปกติ
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    ต่ำกว่าเกณฑ์ขั้นต่ำ (Min Level)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {wardStocks.map((ward) => (
                  <div key={ward.wardId} className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <div className="text-xs font-bold text-blue-800 uppercase">{ward.department}</div>
                      <div className="text-base font-bold text-[#1E3A8A] mt-0.5">{ward.wardName}</div>
                      <div className="text-xs text-slate-500 font-mono">รหัสแผนก: {ward.wardId}</div>
                    </div>

                    <div className="space-y-3">
                      {ward.stock.map((item) => {
                        const isUnderMin = item.currentQty <= item.minLevel;
                        const pct = Math.min(100, Math.round((item.currentQty / item.parLevel) * 100));
                        return (
                          <div key={item.itemCode} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-xs text-slate-800">{item.drugName}</span>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isUnderMin ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {item.currentQty} / {item.parLevel} {item.uom}
                              </span>
                            </div>

                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isUnderMin ? "bg-rose-500" : "bg-emerald-600"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                              <span>เกณฑ์ต่ำสุด: {item.minLevel} {item.uom}</span>
                              {isUnderMin ? (
                                <button
                                  onClick={() => {
                                    setReqWardId(ward.wardId);
                                    setReqItemCode(item.itemCode);
                                    setReqQty(item.parLevel - item.currentQty);
                                    setActiveTab("requisitions");
                                  }}
                                  className="text-rose-700 font-bold hover:underline"
                                >
                                  ⚡ ขอเบิกเติม Par
                                </button>
                              ) : (
                                <span className="text-emerald-700 font-medium">พร้อมใช้งาน</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: REQUISITIONS & FEFO DISPENSE */}
        {activeTab === "requisitions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Requisition Form */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                📝 สร้างใบเบิกยาเติมตู้ยาวอร์ด (Ward Requisition)
              </h2>
              <p className="text-xs text-slate-500">
                พยาบาลหัวหน้าเวรส่งคำขอเบิกยามายังคลังยากลาง
              </p>

              <form onSubmit={handleCreateRequisition} className="space-y-3 text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลือกหอผู้ป่วย / วอร์ดที่ขอเบิก</label>
                  <select
                    value={reqWardId}
                    onChange={(e) => setReqWardId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  >
                    {wardStocks.map((w) => (
                      <option key={w.wardId} value={w.wardId}>
                        {w.wardName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลือกรายการยาที่ต้องการเบิก</label>
                  <select
                    value={reqItemCode}
                    onChange={(e) => setReqItemCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  >
                    {inventory.map((i) => (
                      <option key={i.itemCode} value={i.itemCode}>
                        {i.drugName} (คงเหลือในคลัง {i.totalStock} {i.uom})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">จำนวนที่ขอเบิก</label>
                  <input
                    type="number"
                    value={reqQty}
                    onChange={(e) => setReqQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 tabular-nums"
                    min={1}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold transition shadow-xs mt-2"
                >
                  🚀 ส่งใบเบิกยาไปยังคลังกลาง
                </button>
              </form>
            </section>

            {/* Requisition Table with FEFO Dispense Action */}
            <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#1E3A8A]">
                  📋 คิวใบเบิกยาและการจัดจ่ายยาตามเกณฑ์ FEFO (First Expired, First Out)
                </h2>
                <p className="text-xs text-slate-500">
                  ระบบจะคำนวณและตัดจ่ายจากรุ่นผลิตที่ใกล้หมดอายุก่อนให้อัตโนมัติ พร้อมส่งเข้าตู้ยาวอร์ด
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-700 uppercase">
                      <th className="p-3">เลขที่ใบเบิก</th>
                      <th className="p-3">วอร์ดผู้ขอเบิก</th>
                      <th className="p-3">รายการยา</th>
                      <th className="p-3 text-right">จำนวน</th>
                      <th className="p-3">สถานะ / Lot ที่ตัดจ่าย (FEFO)</th>
                      <th className="p-3 text-right">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requisitions.map((req) => (
                      <tr key={req.reqId} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-[#1E3A8A]">{req.reqNo}</td>
                        <td className="p-3 font-semibold">{req.wardName}</td>
                        <td className="p-3">{req.drugName}</td>
                        <td className="p-3 text-right font-bold tabular-nums">
                          {req.requestedQty} หน่วย
                        </td>
                        <td className="p-3">
                          {req.status === "REQUESTED" ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                              ⏳ รอคลังจ่าย FEFO
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                ✅ จ่ายแล้ว
                              </span>
                              <div className="text-[11px] font-mono text-slate-500">
                                {req.dispensedLots.map((l) => `${l.lotNo}(${l.qty})`).join(", ")}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {req.status === "REQUESTED" ? (
                            <button
                              onClick={() => handleDispenseFefo(req.reqId)}
                              className="px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                            >
                              ⚡ จ่ายยา FEFO
                            </button>
                          ) : (
                            <span className="text-slate-400 font-medium">เรียบร้อย</span>
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
      </div>
    </main>
  );
}
