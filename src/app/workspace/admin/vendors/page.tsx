"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface HospitalVendor {
  id: string;
  vendorCode: string;
  vendorTaxId: string;
  vendorNameTh: string;
  vendorNameEn?: string;
  vendorType: "GPO" | "GOV_AGENCY" | "PRIVATE_CORP" | "INDIVIDUAL";
  isWhtExempt: boolean;
  whtExemptReason?: string;
  contactPerson: string;
  telephone: string;
  email: string;
  address: string;
  bankName: string;
  bankAccountNo: string;
  bankBranch: string;
  gfmisVendorCode?: string;
  egpSupplierId?: string;
  isBlacklisted: boolean;
  blacklistedReason?: string;
  isActive: boolean;
  creditTermDays: number;
}

export default function VendorsMasterPage() {
  const [vendors, setVendors] = useState<HospitalVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<HospitalVendor | null>(null);
  const [form, setForm] = useState({
    vendorTaxId: "",
    vendorNameTh: "",
    vendorNameEn: "",
    vendorType: "PRIVATE_CORP" as any,
    contactPerson: "",
    telephone: "",
    email: "",
    address: "",
    bankName: "ธนาคารกรุงไทย จำกัด (มหาชน)",
    bankAccountNo: "",
    bankBranch: "",
    creditTermDays: 30,
    isBlacklisted: false,
    blacklistedReason: "",
  });

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vendors");
      const json = await res.json();
      if (json.ok) setVendors(json.vendors);
    } catch (err: any) {
      setBanner({ type: "err", text: "ไม่สามารถดึงข้อมูลคู่ค้าได้: " + err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Handle Save
  async function handleSaveVendor(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    try {
      const isEdit = !!editingVendor;
      const res = await fetch("/api/admin/vendors", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vendorCode: editingVendor ? editingVendor.vendorCode : undefined,
          actorUsername: "เจ้าหน้าที่ทะเบียนพัสดุ (Procurement Admin)",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");

      setBanner({
        type: "ok",
        text: isEdit
          ? `แก้ไขข้อมูลคู่ค้า [${data.vendor.vendorCode}] ${data.vendor.vendorNameTh} สำเร็จ`
          : `ลงทะเบียนคู่ค้าใหม่ [${data.vendor.vendorCode}] ${data.vendor.vendorNameTh} สำเร็จ`,
      });
      setModalOpen(false);
      fetchVendors();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Handle Delete
  async function handleDelete(code: string, nameTh: string) {
    if (!confirm(`ยืนยันการลบคู่ค้า "${code} - ${nameTh}" ออกจากระบบ?`)) return;
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/vendors?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ลบไม่สำเร็จ");

      setBanner({ type: "ok", text: `ลบคู่ค้า ${code} เรียบร้อยแล้ว` });
      fetchVendors();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  const filtered = vendors.filter((v) => {
    const matchSearch =
      v.vendorNameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vendorTaxId.includes(searchQuery) ||
      v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "ALL" || v.vendorType === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#2563EB] text-white py-8 px-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
            <Link href="/dashboard" className="hover:text-white transition">หน้าหลัก</Link>
            <span>/</span>
            <span className="text-blue-400 font-semibold">ฝ่ายพัสดุและจัดหา</span>
            <span>/</span>
            <span className="text-white font-bold">ทะเบียนคู่ค้า & ผู้ประกอบการ</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl">🏢</span>
                <span>ทะเบียนคู่ค้าและผู้ประกอบการ (Hospital Vendor Master Hub)</span>
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                ฐานข้อมูลนิติบุคคลคู่ค้า 13 หลัก • สิทธิยกเว้นภาษีหัก ณ ที่จ่าย GPO/รัฐ • เลขบัญชีธนาคารโอนเงิน GFMIS • ตรวจสอบรายชื่อทิ้งงาน ม.109
              </p>
            </div>

            <button
              onClick={() => {
                setEditingVendor(null);
                setForm({
                  vendorTaxId: "",
                  vendorNameTh: "",
                  vendorNameEn: "",
                  vendorType: "PRIVATE_CORP",
                  contactPerson: "",
                  telephone: "",
                  email: "",
                  address: "",
                  bankName: "ธนาคารกรุงไทย จำกัด (มหาชน)",
                  bankAccountNo: "",
                  bankBranch: "",
                  creditTermDays: 30,
                  isBlacklisted: false,
                  blacklistedReason: "",
                });
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <span>➕ ลงทะเบียนคู่ค้าใหม่</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">คู่ค้าที่ลงทะเบียน</div>
              <div className="text-2xl font-extrabold text-white mt-0.5">{vendors.length} ราย</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">สิทธิพิเศษรัฐ/GPO (ยกเว้น WHT)</div>
              <div className="text-2xl font-extrabold text-emerald-300 mt-0.5">
                {vendors.filter((v) => v.isWhtExempt).length} องค์กร
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">นิติบุคคลเอกชน (WHT 1%)</div>
              <div className="text-2xl font-extrabold text-cyan-300 mt-0.5">
                {vendors.filter((v) => !v.isWhtExempt).length} ราย
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
              <div className="text-[11px] text-slate-300">ผู้ทิ้งงาน (Blacklist ม.109)</div>
              <div className="text-2xl font-extrabold text-rose-300 mt-0.5">
                {vendors.filter((v) => v.isBlacklisted).length} ราย
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
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

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อคู่ค้า, เลขประจำตัวผู้เสียภาษี 13 หลัก, รหัส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ทุกประเภทคู่ค้า (All Types)</option>
              <option value="GPO">องค์การเภสัชกรรม (GPO)</option>
              <option value="GOV_AGENCY">หน่วยงานของรัฐ/สภากาชาด</option>
              <option value="PRIVATE_CORP">นิติบุคคลเอกชน</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            แสดง <strong>{filtered.length}</strong> จาก {vendors.length} รายการ
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">รหัสคู่ค้า</th>
                  <th className="p-3.5">ชื่อบริษัท/นิติบุคคลคู่ค้า</th>
                  <th className="p-3.5">ประเภท & ภาษี WHT</th>
                  <th className="p-3.5">ผู้ประสานงาน / เบอร์โทร</th>
                  <th className="p-3.5">บัญชีรับเงินโอน (GFMIS)</th>
                  <th className="p-3.5 text-center">เครดิตเทอม</th>
                  <th className="p-3.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.vendorCode} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-[#1E3A8A]">{v.vendorCode}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{v.vendorNameTh}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        เลข 13 หลัก: <strong className="text-slate-700">{v.vendorTaxId}</strong>
                        {v.vendorNameEn && ` • ${v.vendorNameEn}`}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {v.isWhtExempt ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          ✓ ยกเว้นภาษี (GPO/รัฐ)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          หัก WHT 1% (เอกชน)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-800 font-medium">{v.contactPerson || "-"}</div>
                      <div className="text-[11px] text-slate-500">{v.telephone || v.email}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-800 font-mono font-semibold">{v.bankAccountNo}</div>
                      <div className="text-[11px] text-slate-500">{v.bankName} ({v.bankBranch})</div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">{v.creditTermDays} วัน</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingVendor(v);
                            setForm({
                              vendorTaxId: v.vendorTaxId,
                              vendorNameTh: v.vendorNameTh,
                              vendorNameEn: v.vendorNameEn || "",
                              vendorType: v.vendorType,
                              contactPerson: v.contactPerson || "",
                              telephone: v.telephone || "",
                              email: v.email || "",
                              address: v.address || "",
                              bankName: v.bankName || "ธนาคารกรุงไทย จำกัด (มหาชน)",
                              bankAccountNo: v.bankAccountNo || "",
                              bankBranch: v.bankBranch || "",
                              creditTermDays: v.creditTermDays || 30,
                              isBlacklisted: v.isBlacklisted || false,
                              blacklistedReason: v.blacklistedReason || "",
                            });
                            setModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px]"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(v.vendorCode, v.vendorNameTh)}
                          className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[11px]"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT VENDOR */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏢</span>
                <span>{editingVendor ? "แก้ไขข้อมูลคู่ค้า" : "ลงทะเบียนคู่ค้าใหม่"}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">เลขประจำตัวผู้เสียภาษี 13 หลัก *</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    placeholder="เช่น 0105552098761"
                    value={form.vendorTaxId}
                    onChange={(e) => setForm({ ...form, vendorTaxId: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">ประเภทคู่ค้า *</label>
                  <select
                    value={form.vendorType}
                    onChange={(e: any) => setForm({ ...form, vendorType: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-white"
                  >
                    <option value="PRIVATE_CORP">นิติบุคคลเอกชนทั่วไป (หัก WHT 1%)</option>
                    <option value="GPO">องค์การเภสัชกรรม (ยกเว้น WHT)</option>
                    <option value="GOV_AGENCY">หน่วยงานของรัฐ / กาชาด (ยกเว้น WHT)</option>
                    <option value="INDIVIDUAL">บุคคลธรรมดา</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">ชื่อบริษัท / นิติบุคคล (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บริษัท สยามไบโอไซเอนซ์ จำกัด"
                  value={form.vendorNameTh}
                  onChange={(e) => setForm({ ...form, vendorNameTh: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">ชื่อภาษาอังกฤษ</label>
                <input
                  type="text"
                  placeholder="e.g. Siam Bioscience Co., Ltd."
                  value={form.vendorNameEn}
                  onChange={(e) => setForm({ ...form, vendorNameEn: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">ผู้ประสานงาน</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Bank details for GFMIS transfer */}
              <div className="border rounded-xl p-3 bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-800">ข้อมูลบัญชีธนาคารสำหรับโอนเงินเบิกจ่าย (GFMIS)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">ธนาคาร *</label>
                    <input
                      type="text"
                      required
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">เลขที่บัญชี *</label>
                    <input
                      type="text"
                      required
                      value={form.bankAccountNo}
                      onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-lg font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">สาขา</label>
                    <input
                      type="text"
                      value={form.bankBranch}
                      onChange={(e) => setForm({ ...form, bankBranch: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">ที่อยู่จดทะเบียนตาม ภ.พ.20</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                  💾 บันทึกข้อมูลคู่ค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
