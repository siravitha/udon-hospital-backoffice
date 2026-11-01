"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface RunningNumberConfig {
  id: string;
  docTypeCode: string;
  docTypeName: string;
  prefix: string;
  formatPattern: string;
  yearType: "BE_4" | "BE_2" | "AD_4" | "AD_2";
  paddingDigits: number;
  currentNumber: number;
  resetPolicy: "YEARLY" | "MONTHLY" | "NEVER";
  lastResetFiscalYear: number;
  samplePreview: string;
  description: string;
  isActive: boolean;
  updatedAt?: string;
}

export default function RunningNumbersSettingsPage() {
  const [rules, setRules] = useState<RunningNumberConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPolicy, setFilterPolicy] = useState<string>("ALL");
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RunningNumberConfig | null>(null);
  const [ruleForm, setRuleForm] = useState({
    docTypeCode: "",
    docTypeName: "",
    prefix: "",
    formatPattern: "{PREFIX}-{YEAR}-{NUM}",
    yearType: "BE_4" as "BE_4" | "BE_2" | "AD_4" | "AD_2",
    paddingDigits: 4,
    currentNumber: 0,
    resetPolicy: "YEARLY" as "YEARLY" | "MONTHLY" | "NEVER",
    description: "",
  });

  // Fetch Rules
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/running-numbers");
      const data = await res.json();
      if (data.ok && Array.isArray(data.rules)) {
        setRules(data.rules);
      }
    } catch (err: any) {
      setBanner({ type: "err", text: "ไม่สามารถดึงข้อมูลเลขรันเอกสารได้: " + err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Handle Save (Create or Edit)
  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    try {
      const isEdit = !!editingRule;
      const res = await fetch("/api/admin/running-numbers", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");

      setBanner({
        type: "ok",
        text: isEdit
          ? `แก้ไขรูปแบบเลขรันเอกสาร [${data.rule.docTypeCode}] สำเร็จ! (ตัวอย่าง: ${data.rule.samplePreview})`
          : `สร้างรูปแบบเลขรันเอกสาร [${data.rule.docTypeCode}] สำเร็จ! (ตัวอย่าง: ${data.rule.samplePreview})`,
      });
      setModalOpen(false);
      setEditingRule(null);
      fetchRules();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Handle Delete
  async function handleDeleteRule(code: string, nameTh: string) {
    if (!confirm(`ยืนยันการลบรูปแบบเลขรันเอกสาร "${code} - ${nameTh}" ออกจากระบบ?`)) return;
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/running-numbers?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ลบไม่สำเร็จ");

      setBanner({ type: "ok", text: `ลบการตั้งค่าเลขรัน ${code} เรียบร้อยแล้ว` });
      fetchRules();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Handle Test Generate Next Number
  async function handleGenerateNext(code: string) {
    setBanner(null);
    try {
      const res = await fetch("/api/admin/running-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_NEXT",
          docTypeCode: code,
          departmentCode: "MED",
          actorUsername: "ผู้ดูแลระบบการตั้งค่า (Admin Settings)",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ออกเลขรันไม่สำเร็จ");

      setBanner({
        type: "ok",
        text: `⚡ ออกเลขรันเอกสารใหม่สำเร็จ! หมวด ${code}: [ ${data.allocatedNumber} ] (ลำดับ: ${data.sequenceValue}) บันทึกลง Audit Chain เรียบร้อย`,
      });
      fetchRules();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Filtered Rules
  const filteredRules = rules.filter((r) => {
    const matchSearch =
      r.docTypeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.docTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.prefix.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPolicy = filterPolicy === "ALL" || r.resetPolicy === filterPolicy;
    return matchSearch && matchPolicy;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F766E] text-white py-8 px-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
            <Link href="/dashboard" className="hover:text-white transition">หน้าหลัก</Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">การตั้งค่า</span>
            <span>/</span>
            <span className="text-white font-bold">ระบบจัดการเลขรันเอกสาร</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl">🔢</span>
                <span>ระบบจัดการเลขรันเอกสาร (Running Number Configuration Engine)</span>
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                กำหนดโครงสร้าง Prefix, รูปแบบปีงบประมาณ, จำนวนหลัก (Padding Digits) และนโยบายรีเซ็ตเลขรันสำหรับเอกสารจัดซื้อจัดจ้างและบริหารโรงพยาบาล
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/workspace/admin/master-data"
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition flex items-center gap-1.5"
              >
                <span>🏢 ไปที่ทำเนียบบุคลากร & แผนก</span>
              </Link>
              <button
                onClick={() => {
                  setEditingRule(null);
                  setRuleForm({
                    docTypeCode: "",
                    docTypeName: "",
                    prefix: "",
                    formatPattern: "{PREFIX}-{YEAR}-{NUM}",
                    yearType: "BE_4",
                    paddingDigits: 4,
                    currentNumber: 0,
                    resetPolicy: "YEARLY",
                    description: "",
                  });
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <span>➕ สร้างรูปแบบเลขรันใหม่</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">หมวดเอกสารทั้งหมด</div>
              <div className="text-2xl font-extrabold text-white mt-0.5">{rules.length} หมวด</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">รีเซ็ตรายปีงบประมาณ</div>
              <div className="text-2xl font-extrabold text-emerald-300 mt-0.5">
                {rules.filter((r) => r.resetPolicy === "YEARLY").length} หมวด
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">รันต่อเนื่องตลอดไป (NEVER)</div>
              <div className="text-2xl font-extrabold text-cyan-300 mt-0.5">
                {rules.filter((r) => r.resetPolicy === "NEVER").length} หมวด
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">สถานะ Engine</div>
              <div className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>PostgreSQL Row-Locked Sequence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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

        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="🔍 ค้นหารหัส, ชื่อเอกสาร, Prefix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">นโยบายรีเซ็ต:</span>
              <select
                value={filterPolicy}
                onChange={(e) => setFilterPolicy(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">ทั้งหมด (All Policies)</option>
                <option value="YEARLY">รายปีงบประมาณ (YEARLY)</option>
                <option value="MONTHLY">รายเดือน (MONTHLY)</option>
                <option value="NEVER">รันต่อเนื่อง (NEVER)</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            แสดง <strong>{filteredRules.length}</strong> จาก {rules.length} รายการ
          </div>
        </div>

        {/* Rules Grid */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            กำลังโหลดข้อมูลการตั้งค่าเลขรันเอกสาร...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
            ไม่พบรูปแบบเลขรันเอกสารที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRules.map((rule) => (
              <div
                key={rule.id || rule.docTypeCode}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-1 bg-blue-100 text-[#1E3A8A] font-extrabold text-xs rounded-md font-mono">
                      {rule.docTypeCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rule.resetPolicy === "YEARLY"
                            ? "bg-amber-100 text-amber-800"
                            : rule.resetPolicy === "MONTHLY"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {rule.resetPolicy}
                      </span>
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setRuleForm({
                            docTypeCode: rule.docTypeCode,
                            docTypeName: rule.docTypeName,
                            prefix: rule.prefix,
                            formatPattern: rule.formatPattern,
                            yearType: rule.yearType,
                            paddingDigits: rule.paddingDigits,
                            currentNumber: rule.currentNumber,
                            resetPolicy: rule.resetPolicy,
                            description: rule.description || "",
                          });
                          setModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title="แก้ไขรูปแบบ"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.docTypeCode, rule.docTypeName)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100"
                        title="ลบรูปแบบ"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                    {rule.docTypeName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {rule.description || "เอกสารในระบบจัดซื้อจัดจ้างและบริหารโรงพยาบาล"}
                  </p>

                  {/* Preview Box */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 flex justify-between">
                      <span>ตัวอย่างเลขถัดไป (Preview Next):</span>
                      <span className="text-slate-400">หลัก: {rule.paddingDigits}</span>
                    </div>
                    <div className="text-base font-extrabold text-[#1E3A8A] tracking-wide mt-1 font-mono">
                      {rule.samplePreview}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                      <span>Pattern: <code>{rule.formatPattern}</code></span>
                      <span>ลำดับล่าสุด: <strong className="text-slate-800">{rule.currentNumber}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleGenerateNext(rule.docTypeCode)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>⚡ ทดสอบออกเลขถัดไป</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT RULE */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🔢</span>
                <span>{editingRule ? "แก้ไขรูปแบบเลขรันเอกสาร" : "สร้างรูปแบบเลขรันเอกสารใหม่"}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">รหัสหมวดเอกสาร (Code) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRule}
                    value={ruleForm.docTypeCode}
                    onChange={(e) => setRuleForm({ ...ruleForm, docTypeCode: e.target.value.toUpperCase() })}
                    placeholder="เช่น PR, PO, REQ"
                    className="w-full mt-1 p-2 border rounded-lg uppercase font-mono bg-white disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">คำนำหน้า (Prefix) *</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.prefix}
                    onChange={(e) => setRuleForm({ ...ruleForm, prefix: e.target.value })}
                    placeholder="เช่น PR-10671"
                    className="w-full mt-1 p-2 border rounded-lg uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">ชื่อประเภทเอกสาร (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={ruleForm.docTypeName}
                  onChange={(e) => setRuleForm({ ...ruleForm, docTypeName: e.target.value })}
                  placeholder="เช่น ใบขอซื้อ/ขอจ้างยาและเวชภัณฑ์"
                  className="w-full mt-1 p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">รูปแบบฟอร์แมตเลขรัน (Pattern) *</label>
                <input
                  type="text"
                  required
                  value={ruleForm.formatPattern}
                  onChange={(e) => setRuleForm({ ...ruleForm, formatPattern: e.target.value })}
                  placeholder="{PREFIX}-{YEAR}-{NUM}"
                  className="w-full mt-1 p-2 border rounded-lg font-mono text-[#1E3A8A] font-bold"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  ตัวแปร: <code>{`{PREFIX}`}</code>, <code>{`{YEAR}`}</code>, <code>{`{DEP}`}</code>, <code>{`{NUM}`}</code>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">รูปแบบปี *</label>
                  <select
                    value={ruleForm.yearType}
                    onChange={(e: any) => setRuleForm({ ...ruleForm, yearType: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-white"
                  >
                    <option value="BE_4">พ.ศ. 4 หลัก (2569)</option>
                    <option value="BE_2">พ.ศ. 2 หลัก (69)</option>
                    <option value="AD_4">ค.ศ. 4 หลัก (2026)</option>
                    <option value="AD_2">ค.ศ. 2 หลัก (26)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">จำนวนหลักตัวเลข *</label>
                  <input
                    type="number"
                    required
                    min={3}
                    max={8}
                    value={ruleForm.paddingDigits}
                    onChange={(e) => setRuleForm({ ...ruleForm, paddingDigits: Number(e.target.value) })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">ลำดับล่าสุด (Current)</label>
                  <input
                    type="number"
                    min={0}
                    value={ruleForm.currentNumber}
                    onChange={(e) => setRuleForm({ ...ruleForm, currentNumber: Number(e.target.value) })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">นโยบายการรีเซ็ตเลขรัน *</label>
                <select
                  value={ruleForm.resetPolicy}
                  onChange={(e: any) => setRuleForm({ ...ruleForm, resetPolicy: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg bg-white"
                >
                  <option value="YEARLY">รีเซ็ตทุกขึ้นปีงบประมาณใหม่ (1 ต.ค.)</option>
                  <option value="MONTHLY">รีเซ็ตทุกสิ้นเดือน</option>
                  <option value="NEVER">รันต่อเนื่องตลอดไป ไม่รีเซ็ต</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">คำอธิบายการใช้งาน</label>
                <textarea
                  rows={2}
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold"
                >
                  💾 บันทึกรูปแบบเลขรัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

