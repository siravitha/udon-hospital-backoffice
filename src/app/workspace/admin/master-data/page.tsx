"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface MissionGroup {
  groupCode: string;
  groupNameTh: string;
  groupNameEn: string;
  displayOrder: number;
  isActive: boolean;
}

interface HospitalDepartment {
  departmentCode: string;
  groupCode: string;
  departmentNameTh: string;
  departmentNameEn: string;
  costCenterCode: string;
  headName: string;
  telephone: string;
  locationBuilding: string;
  floorNumber: string;
  isProcurementAuthorized: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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

interface HospitalPersonnel {
  id: string;
  staffCode: string;
  citizenId: string;
  citizenIdMasked?: string;
  mophProviderId: string;
  titleTh: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  personnelType:
    | "PHYSICIAN"
    | "NURSE"
    | "PHARMACIST"
    | "TECH_MED"
    | "PROCUREMENT_OFFICER"
    | "FINANCE_OFFICER"
    | "LEGAL_OFFICER"
    | "EXECUTIVE"
    | "ENGINEER"
    | "STAFF";
  positionTitle: string;
  departmentCode: string;
  departmentName?: string;
  licenseNumber?: string;
  email?: string;
  telephone?: string;
  isCommitteeEligible: boolean;
  padesSignatureActive: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const PERSONNEL_TYPE_LABELS: Record<string, { label: string; badge: string; color: string }> = {
  PHYSICIAN: { label: "แพทย์เฉพาะทาง", badge: "Doctor", color: "bg-blue-100 text-blue-800" },
  NURSE: { label: "พยาบาลวิชาชีพ", badge: "RN/APN", color: "bg-emerald-100 text-emerald-800" },
  PHARMACIST: { label: "เภสัชกร", badge: "Pharm", color: "bg-amber-100 text-amber-800" },
  TECH_MED: { label: "นักเทคนิคการแพทย์", badge: "Lab Tech", color: "bg-purple-100 text-purple-800" },
  PROCUREMENT_OFFICER: { label: "เจ้าหน้าที่พัสดุ", badge: "Procurement", color: "bg-indigo-100 text-indigo-800" },
  FINANCE_OFFICER: { label: "เจ้าหน้าที่การเงิน", badge: "Finance", color: "bg-teal-100 text-teal-800" },
  LEGAL_OFFICER: { label: "นิติกร", badge: "Legal", color: "bg-slate-100 text-slate-800" },
  EXECUTIVE: { label: "ผู้บริหารระดับสูง", badge: "Executive", color: "bg-rose-100 text-rose-800" },
  ENGINEER: { label: "วิศวกรชีวการแพทย์", badge: "Engineer", color: "bg-cyan-100 text-cyan-800" },
  STAFF: { label: "เจ้าหน้าที่ทั่วไป", badge: "Staff", color: "bg-gray-100 text-gray-800" },
};

export default function MasterDataHubPage() {
  const [activeTab, setActiveTab] = useState<"personnel" | "runningNumbers" | "departments" | "equipmentCatalog" | "assetCoding">("personnel");
  const [groups, setGroups] = useState<MissionGroup[]>([]);
  const [departments, setDepartments] = useState<HospitalDepartment[]>([]);
  const [runningNumbers, setRunningNumbers] = useState<RunningNumberConfig[]>([]);
  const [personnelList, setPersonnelList] = useState<HospitalPersonnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Equipment Standards & Asset Coding state
  const [equipmentCatalog, setEquipmentCatalog] = useState<any[]>([]);
  const [equipmentCategories, setEquipmentCategories] = useState<Record<string, any>>({});
  const [codingRules, setCodingRules] = useState<any[]>([]);
  const [activeAssets, setActiveAssets] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [eqSearchQuery, setEqSearchQuery] = useState("");

  // Asset Code Generator State
  const [genClass, setGenClass] = useState("6515");
  const [genGroup, setGenGroup] = useState("001");
  const [genItem, setGenItem] = useState("0001");
  const [genFiscalYear, setGenFiscalYear] = useState(2569);
  const [genUnits, setGenUnits] = useState(2);
  const [genDepartment, setGenDepartment] = useState("DEP-SURG-OR");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([
    "6515-001-0001-2569/0001",
    "6515-001-0001-2569/0002",
  ]);
  const [activeTagIndex, setActiveTagIndex] = useState(0);

  // Depreciation Calculator State
  const [deprecCost, setDeprecCost] = useState(850000);
  const [deprecLife, setDeprecLife] = useState(8);
  const [deprecYearsInService, setDeprecYearsInService] = useState(3);

  // Filters
  const [filterDep, setFilterDep] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Personnel Modal state
  const [personnelModalOpen, setPersonnelModalOpen] = useState(false);
  const [personnelEditing, setPersonnelEditing] = useState<HospitalPersonnel | null>(null);
  const [personnelForm, setPersonnelForm] = useState({
    staffCode: "",
    citizenId: "",
    mophProviderId: "",
    titleTh: "นพ.",
    firstNameTh: "",
    lastNameTh: "",
    firstNameEn: "",
    lastNameEn: "",
    personnelType: "PHYSICIAN" as HospitalPersonnel["personnelType"],
    positionTitle: "",
    departmentCode: "DEP-MED-OPD",
    licenseNumber: "",
    email: "",
    telephone: "",
    isCommitteeEligible: true,
    padesSignatureActive: true,
  });

  // Department Modal state
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [depEditing, setDepEditing] = useState<HospitalDepartment | null>(null);
  const [depForm, setDepForm] = useState({
    departmentCode: "",
    groupCode: "MED",
    departmentNameTh: "",
    departmentNameEn: "",
    costCenterCode: "",
    headName: "",
    telephone: "",
    locationBuilding: "อาคารเฉลิมพระเกียรติ",
    floorNumber: "ชั้น 1",
    isProcurementAuthorized: true,
  });

  // Running Number Modal state
  const [ruleModalOpen, setRuleModalOpenOpen] = useState(false);
  const [ruleEditing, setRuleEditing] = useState<RunningNumberConfig | null>(null);
  const [ruleForm, setRuleForm] = useState({
    docTypeCode: "",
    docTypeName: "",
    prefix: "",
    formatPattern: "{PREFIX}-{YEAR}-{NUM}",
    yearType: "BE_4" as "BE_4" | "BE_2" | "AD_4" | "AD_2",
    paddingDigits: 5,
    currentNumber: 0,
    resetPolicy: "YEARLY" as "YEARLY" | "MONTHLY" | "NEVER",
    description: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [depRes, runRes, staffRes, eqRes] = await Promise.all([
        fetch("/api/admin/departments"),
        fetch("/api/admin/running-numbers"),
        fetch("/api/admin/personnel"),
        fetch("/api/admin/equipment-standards").catch(() => null),
      ]);
      const depData = await depRes.json();
      const runData = await runRes.json();
      const staffData = await staffRes.json();

      if (depData.ok) {
        setGroups(depData.groups || []);
        setDepartments(depData.departments || []);
      }
      if (runData.ok) {
        setRunningNumbers(runData.runningNumbers || []);
      }
      if (staffData.ok) {
        setPersonnelList(staffData.personnel || []);
      }
      if (eqRes && eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipmentCatalog(eqData.catalog || []);
        setEquipmentCategories(eqData.categories || {});
        setCodingRules(eqData.codingRules || []);
        setActiveAssets(eqData.activeAssets || []);
      }
    } catch (e: any) {
      setBanner({ type: "err", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล: " + e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Save Personnel (Add / Edit)
  async function handleSavePersonnel(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    try {
      const isEdit = !!personnelEditing;
      const res = await fetch("/api/admin/personnel", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personnelForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "บันทึกข้อมูลบุคลากรไม่สำเร็จ");

      setBanner({
        type: "ok",
        text: isEdit
          ? `แก้ไขข้อมูลบุคลากร ${data.personnel.staffCode} (${data.personnel.titleTh}${data.personnel.firstNameTh} ${data.personnel.lastNameTh}) สำเร็จ!`
          : `เพิ่มบุคลากรใหม่ ${data.personnel.staffCode} (${data.personnel.titleTh}${data.personnel.firstNameTh} ${data.personnel.lastNameTh}) เข้าสู่ระบบสำเร็จแล้ว`,
      });
      setPersonnelModalOpen(false);
      setPersonnelEditing(null);
      fetchData();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Handle Delete Personnel
  async function handleDeletePersonnel(code: string, fullName: string) {
    if (!confirm(`ยืนยันการลบบุคลากร "${code} - ${fullName}" ออกจากระบบ?`)) return;
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/personnel?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ลบไม่สำเร็จ");

      setBanner({ type: "ok", text: `ลบบุคลากร ${code} ออกจากระบบเรียบร้อยแล้ว` });
      fetchData();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Auto-generate Staff Code in modal
  function handleAutoGenerateStaffCode() {
    const empRule = runningNumbers.find((r) => r.docTypeCode === "EMP");
    const nextNum = (empRule?.currentNumber || 15) + 1;
    const formatted = `EMP-10671-${String(nextNum).padStart(4, "0")}`;
    setPersonnelForm((prev) => ({
      ...prev,
      staffCode: formatted,
      mophProviderId: `MOPH-10671-${formatted.slice(-4)}`,
    }));
  }

  // Handle Save Department (Create or Edit)
  async function handleSaveDepartment(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    try {
      const isEdit = !!depEditing;
      const res = await fetch("/api/admin/departments", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");

      setBanner({
        type: "ok",
        text: isEdit
          ? `แก้ไขข้อมูลกลุ่มงาน/แผนก ${data.department.departmentCode} สำเร็จ!`
          : `เพิ่มแผนก ${data.department.departmentCode} (${data.department.departmentNameTh}) เรียบร้อยแล้ว`,
      });
      setDepModalOpen(false);
      setDepEditing(null);
      fetchData();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Handle Delete Department
  async function handleDeleteDepartment(code: string, nameTh: string) {
    if (!confirm(`ยืนยันการลบกลุ่มงาน/แผนก "${code} - ${nameTh}" ออกจากระบบ?`)) return;
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/departments?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ลบไม่สำเร็จ");

      setBanner({ type: "ok", text: `ลบแผนก ${code} สำเร็จเรียบร้อยแล้ว` });
      fetchData();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Handle Save Running Number Rule (Create or Edit)
  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    try {
      const isEdit = !!ruleEditing;
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
          ? `แก้ไขรูปแบบเลขรันเอกสาร ${data.rule.docTypeCode} สำเร็จ! (ตัวอย่าง: ${data.rule.samplePreview})`
          : `สร้างรูปแบบเลขรันเอกสาร ${data.rule.docTypeCode} สำเร็จ! (ตัวอย่าง: ${data.rule.samplePreview})`,
      });
      setRuleModalOpenOpen(false);
      setRuleEditing(null);
      fetchData();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Handle Delete Running Number Rule
  async function handleDeleteRule(code: string, nameTh: string) {
    if (!confirm(`ยืนยันการลบรูปแบบเลขรันเอกสาร "${code} - ${nameTh}" หรือไม่?`)) return;
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/running-numbers?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ลบไม่สำเร็จ");

      setBanner({ type: "ok", text: `ลบการตั้งค่าเลขรัน ${code} สำเร็จ` });
      fetchData();
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
          actorUsername: "ทดสอบออกเลขรัน (MOPH Admin)",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ออกเลขรันไม่สำเร็จ");

      setBanner({
        type: "ok",
        text: `⚡ ออกเลขรันเอกสารใหม่สำเร็จ! เลขที่ได้รับ: [ ${data.allocatedNumber} ] (ลำดับที่: ${data.sequenceValue}) บันทึกลง Audit Chain เรียบร้อย`,
      });
      fetchData();
    } catch (err: any) {
      setBanner({ type: "err", text: err.message });
    }
  }

  // Filtered personnel
  const filteredPersonnel = personnelList.filter((p) => {
    const matchDep = filterDep === "ALL" || p.departmentCode === filterDep;
    const matchType = filterType === "ALL" || p.personnelType === filterType;
    const matchQuery =
      p.firstNameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastNameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.staffCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.positionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.licenseNumber && p.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchDep && matchType && matchQuery;
  });

  // Filtered departments
  const filteredDepartments = departments.filter((d) => {
    const matchQuery =
      d.departmentNameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.departmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.costCenterCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <header className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white rounded-2xl p-6 shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <span>🏛️ HOS-BACKOFFICE ENTERPRISE</span>
              <span>•</span>
              <span>MASTER DATA, PERSONNEL & RUNNING NUMBERS HUB</span>
            </div>
            <h1 className="text-2xl font-black mt-1 tracking-tight">
              ฐานข้อมูลบุคลากร กลุ่มงาน/แผนก และระบบกำหนดเลขรันเอกสาร (Hospital Master Hub)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-4xl">
              จัดการทำเนียบบุคลากรทางการแพทย์ สิทธิคณะกรรมการตรวจรับพัสดุ พ.ร.บ. 2560 ลายมือชื่ออิเล็กทรอนิกส์ PAdES พร้อมตั้งค่าเลขรันเอกสารทุกประเภท (PR, PO, REQ, BP, GRN, PV, CPO, EMP)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
            >
              {loading ? "🔄 กำลังซิงค์..." : "🔄 รีเฟรชฐานข้อมูล"}
            </button>
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
            >
              📊 Executive Dashboard
            </Link>
          </div>
        </header>

        {/* Banner Alert */}
        {banner && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs ${
              banner.type === "ok"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                : "bg-red-50 text-red-900 border border-red-300"
            }`}
          >
            <span>{banner.text}</span>
            <button
              onClick={() => setBanner(null)}
              className="text-xs px-2 py-1 rounded bg-black/10 hover:bg-black/20"
            >
              ✕ ปิด
            </button>
          </div>
        )}

        {/* 5 Master & Compliance Tabs */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveTab("personnel")}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "personnel"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>👨‍⚕️ ทำเนียบบุคลากร & กรรมการ</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold">
              {personnelList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("departments")}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "departments"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>🏢 โครงสร้างกลุ่มงาน & แผนก</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-extrabold">
              {departments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("equipmentCatalog")}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "equipmentCatalog"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📋 บัญชีราคามาตรฐานครุภัณฑ์ (สำนักงบประมาณ)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold">
              {equipmentCatalog.length || 10} รายการ
            </span>
          </button>

          <button
            onClick={() => setActiveTab("assetCoding")}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "assetCoding"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>🏷️ การกำหนดรหัสครุภัณฑ์ & Asset Tag (กรมบัญชีกลาง)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
              CGD Standard
            </span>
          </button>

          <button
            onClick={() => setActiveTab("runningNumbers")}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "runningNumbers"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>🔢 รูปแบบเลขรันเอกสาร</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              {runningNumbers.length}
            </span>
          </button>
        </div>

        {/* TAB 1: PERSONNEL DIRECTORY */}
        {activeTab === "personnel" && (
          <div className="space-y-6">
            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase">บุคลากรทั้งหมด</div>
                <div className="text-2xl font-black text-[#1E3A8A] mt-1">{personnelList.length} ท่าน</div>
                <div className="text-xs text-emerald-700 font-semibold mt-1">● ครบทุกสายวิชาชีพ</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase">แพทย์ & เภสัชกร & พยาบาล</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {personnelList.filter((p) => ["PHYSICIAN", "PHARMACIST", "NURSE"].includes(p.personnelType)).length} ท่าน
                </div>
                <div className="text-xs text-slate-500 mt-1">บุคลากรสายการแพทย์หลัก</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase">ผู้มีสิทธิเป็นกรรมการตรวจรับ</div>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {personnelList.filter((p) => p.isCommitteeEligible).length} ท่าน
                </div>
                <div className="text-xs text-amber-700 font-semibold mt-1">✓ ตามเกณฑ์ พ.ร.บ. จัดซื้อจัดจ้างฯ</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase">ลายมือชื่ออิเล็กทรอนิกส์ PAdES</div>
                <div className="text-2xl font-black text-teal-700 mt-1">
                  {personnelList.filter((p) => p.padesSignatureActive).length} บัญชี
                </div>
                <div className="text-xs text-teal-700 font-semibold mt-1">🔐 2FA MOPH Provider ID</div>
              </div>
            </div>

            {/* Filter and Add Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="🔍 ค้นหาชื่อ, นามสกุล, รหัสบุคลากร, ใบอนุญาต..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">ทุกสายวิชาชีพ</option>
                  <option value="PHYSICIAN">แพทย์เฉพาะทาง</option>
                  <option value="NURSE">พยาบาลวิชาชีพ</option>
                  <option value="PHARMACIST">เภสัชกร</option>
                  <option value="TECH_MED">นักเทคนิคการแพทย์</option>
                  <option value="PROCUREMENT_OFFICER">เจ้าหน้าที่พัสดุ</option>
                  <option value="FINANCE_OFFICER">เจ้าหน้าที่การเงิน</option>
                  <option value="LEGAL_OFFICER">นิติกร</option>
                  <option value="EXECUTIVE">ผู้บริหาร</option>
                  <option value="ENGINEER">วิศวกร</option>
                </select>
                <select
                  value={filterDep}
                  onChange={(e) => setFilterDep(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">ทุกกลุ่มงาน/แผนก</option>
                  {departments.map((d) => (
                    <option key={d.departmentCode} value={d.departmentCode}>
                      {d.departmentNameTh}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setPersonnelEditing(null);
                  const empRule = runningNumbers.find((r) => r.docTypeCode === "EMP");
                  const nextNum = (empRule?.currentNumber || 15) + 1;
                  const formatted = `EMP-10671-${String(nextNum).padStart(4, "0")}`;
                  setPersonnelForm({
                    staffCode: formatted,
                    citizenId: "1100200345686",
                    mophProviderId: `MOPH-10671-${formatted.slice(-4)}`,
                    titleTh: "นพ.",
                    firstNameTh: "",
                    lastNameTh: "",
                    firstNameEn: "",
                    lastNameEn: "",
                    personnelType: "PHYSICIAN",
                    positionTitle: "นายแพทย์ชำนาญการ",
                    departmentCode: "DEP-MED-OPD",
                    licenseNumber: "ว. 51000",
                    email: "",
                    telephone: "02-590-1011",
                    isCommitteeEligible: true,
                    padesSignatureActive: true,
                  });
                  setPersonnelModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <span>➕ เพิ่มบุคลากรใหม่ (Add Personnel)</span>
              </button>
            </div>

            {/* Personnel Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">รหัสบุคลากร</th>
                      <th className="p-3.5">ชื่อ - นามสกุล</th>
                      <th className="p-3.5">ตำแหน่ง & แผนกสังกัด</th>
                      <th className="p-3.5">สายวิชาชีพ</th>
                      <th className="p-3.5">ใบประกอบวิชาชีพ</th>
                      <th className="p-3.5">MOPH Provider ID</th>
                      <th className="p-3.5 text-center">สิทธิกรรมการตรวจรับ</th>
                      <th className="p-3.5 text-center">PAdES 2FA</th>
                      <th className="p-3.5 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPersonnel.map((p) => {
                      const typeMeta = PERSONNEL_TYPE_LABELS[p.personnelType] || {
                        label: p.personnelType,
                        color: "bg-slate-100 text-slate-800",
                      };
                      return (
                        <tr key={p.staffCode} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-bold font-mono text-[#1E3A8A]">
                            {p.staffCode}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">
                              {p.titleTh}{p.firstNameTh} {p.lastNameTh}
                            </div>
                            {p.firstNameEn && (
                              <div className="text-[11px] text-slate-400">
                                {p.firstNameEn} {p.lastNameEn}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              PDPA: {p.citizenIdMasked || "1-1002-XXXXX-XX-X"}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-800">{p.positionTitle}</div>
                            <div className="text-[11px] text-blue-700">{p.departmentName || p.departmentCode}</div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${typeMeta.color}`}>
                              {typeMeta.label}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {p.licenseNumber || "-"}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-700">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {p.mophProviderId}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {p.isCommitteeEligible ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                ✓ มีคุณสมบัติ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px]">
                                ✕ เจ้าหน้าที่จัดซื้อ
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {p.padesSignatureActive ? (
                              <span className="text-teal-700 font-bold">🔐 Active</span>
                            ) : (
                              <span className="text-slate-400">Inactive</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setPersonnelEditing(p);
                                  setPersonnelForm({
                                    staffCode: p.staffCode,
                                    citizenId: p.citizenId,
                                    mophProviderId: p.mophProviderId,
                                    titleTh: p.titleTh,
                                    firstNameTh: p.firstNameTh,
                                    lastNameTh: p.lastNameTh,
                                    firstNameEn: p.firstNameEn || "",
                                    lastNameEn: p.lastNameEn || "",
                                    personnelType: p.personnelType,
                                    positionTitle: p.positionTitle,
                                    departmentCode: p.departmentCode,
                                    licenseNumber: p.licenseNumber || "",
                                    email: p.email || "",
                                    telephone: p.telephone || "",
                                    isCommitteeEligible: p.isCommitteeEligible,
                                    padesSignatureActive: p.padesSignatureActive,
                                  });
                                  setPersonnelModalOpen(true);
                                }}
                                className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px]"
                              >
                                แก้ไข
                              </button>
                              <button
                                onClick={() => handleDeletePersonnel(p.staffCode, `${p.titleTh}${p.firstNameTh} ${p.lastNameTh}`)}
                                className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[11px]"
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RUNNING NUMBERS CONFIGURATION (CRUD) */}
        {activeTab === "runningNumbers" && (
          <div className="space-y-6">
            {/* Relocation Notification Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-blue-100 rounded-lg">⚙️</span>
                <div>
                  <h4 className="text-xs font-bold text-blue-900">
                    ระบบจัดการเลขรันเอกสารเชื่อมโยงกับเมนูหลัก &quot;การตั้งค่า&quot; แล้ว
                  </h4>
                  <p className="text-[11px] text-blue-700">
                    คุณสามารถเข้าถึงหน้าจอจัดการเลขรันเอกสารแบบเฉพาะทางได้ที่เมนูหลัก <strong>การตั้งค่า &gt; ระบบจัดการเลขรันเอกสาร</strong>
                  </p>
                </div>
              </div>
              <Link
                href="/workspace/settings/running-numbers"
                className="px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                <span>เปิดหน้าการตั้งค่าเฉพาะ ↗</span>
              </Link>
            </div>

            {/* Header action strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  ระบบกำหนดและจัดสรรเลขรันเอกสารราชการ (Document Numbering Engine)
                </h2>
                <p className="text-xs text-slate-500">
                  รองรับการสร้างเลขรันแบบอัตโนมัติพร้อมระบบล็อกแถว (Row-level Locking) ป้องกันเลขซ้ำหรือกระโดด
                </p>
              </div>
              <button
                onClick={() => {
                  setRuleEditing(null);
                  setRuleForm({
                    docTypeCode: "",
                    docTypeName: "",
                    prefix: "",
                    formatPattern: "{PREFIX}-{YEAR}-{NUM}",
                    yearType: "BE_4",
                    paddingDigits: 5,
                    currentNumber: 0,
                    resetPolicy: "YEARLY",
                    description: "",
                  });
                  setRuleModalOpenOpen(true);
                }}
                className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <span>➕ เพิ่มรูปแบบเลขรันเอกสารใหม่</span>
              </button>
            </div>

            {/* Running Number Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {runningNumbers.map((rule) => (
                <div
                  key={rule.docTypeCode}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-[#1E3A8A] text-white text-xs font-black tracking-wider">
                          {rule.docTypeCode}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          รีเซ็ต {rule.resetPolicy === "YEARLY" ? "รายปี" : rule.resetPolicy === "MONTHLY" ? "รายเดือน" : "ไม่รีเซ็ต"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setRuleEditing(rule);
                            setRuleForm({
                              docTypeCode: rule.docTypeCode,
                              docTypeName: rule.docTypeName,
                              prefix: rule.prefix,
                              formatPattern: rule.formatPattern,
                              yearType: rule.yearType,
                              paddingDigits: rule.paddingDigits,
                              currentNumber: rule.currentNumber,
                              resetPolicy: rule.resetPolicy,
                              description: rule.description,
                            });
                            setRuleModalOpenOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="แก้ไข"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.docTypeCode, rule.docTypeName)}
                          className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="ลบ"
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
                        <span>Format: <code>{rule.formatPattern}</code></span>
                        <span>เลขล่าสุด: <strong className="text-slate-800">{rule.currentNumber}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
          </div>
        )}

        {/* TAB 3: DEPARTMENTS & COST CENTERS */}
        {activeTab === "departments" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="🔍 ค้นหารหัส, ชื่อแผนก, ศูนย์ต้นทุน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  setDepEditing(null);
                  setDepForm({
                    departmentCode: "",
                    groupCode: "MED",
                    departmentNameTh: "",
                    departmentNameEn: "",
                    costCenterCode: "",
                    headName: "",
                    telephone: "",
                    locationBuilding: "อาคารเฉลิมพระเกียรติ",
                    floorNumber: "ชั้น 1",
                    isProcurementAuthorized: true,
                  });
                  setDepModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <span>➕ เพิ่มกลุ่มงาน/แผนกใหม่</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">รหัสแผนก</th>
                      <th className="p-3.5">ชื่อกลุ่มงาน/แผนก</th>
                      <th className="p-3.5">ศูนย์ต้นทุน (สธ.)</th>
                      <th className="p-3.5">หัวหน้าแผนก / เบอร์โทร</th>
                      <th className="p-3.5">สถานที่ตั้ง</th>
                      <th className="p-3.5 text-center">สิทธิออก PR</th>
                      <th className="p-3.5 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDepartments.map((d) => (
                      <tr key={d.departmentCode} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold font-mono text-[#1E3A8A]">
                          {d.departmentCode}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{d.departmentNameTh}</div>
                          {d.departmentNameEn && (
                            <div className="text-[11px] text-slate-500">{d.departmentNameEn}</div>
                          )}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-emerald-800">
                          {d.costCenterCode}
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-800 font-medium">{d.headName}</div>
                          <div className="text-[11px] text-slate-500">{d.telephone}</div>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {d.locationBuilding} {d.floorNumber}
                        </td>
                        <td className="p-3.5 text-center">
                          {d.isProcurementAuthorized ? (
                            <span className="text-emerald-700 font-bold">✓ อนุญาต</span>
                          ) : (
                            <span className="text-slate-400">✕ ไม่อนุญาต</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setDepEditing(d);
                                setDepForm({
                                  departmentCode: d.departmentCode,
                                  groupCode: d.groupCode,
                                  departmentNameTh: d.departmentNameTh,
                                  departmentNameEn: d.departmentNameEn || "",
                                  costCenterCode: d.costCenterCode,
                                  headName: d.headName || "",
                                  telephone: d.telephone || "",
                                  locationBuilding: d.locationBuilding || "",
                                  floorNumber: d.floorNumber || "",
                                  isProcurementAuthorized: d.isProcurementAuthorized,
                                });
                                setDepModalOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px]"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(d.departmentCode, d.departmentNameTh)}
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
        )}

        {/* TAB 4: STANDARD EQUIPMENT CATALOG (BUREAU OF THE BUDGET) */}
        {activeTab === "equipmentCatalog" && (
          <div className="space-y-6">
            {/* Header Compliance Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-2xl shrink-0">
                    📋
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white tracking-wide">
                        บัญชีราคามาตรฐานครุภัณฑ์ (สำนักงบประมาณ) & เกณฑ์ราคากลาง CCTV และคอมพิวเตอร์ (MDES)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                        สำนักงบประมาณ นร 0719.1/ว 53 (ปีงบประมาณ 2569)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                        เกณฑ์ CCTV กระทรวงดีอี (Onvif / NTP)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/40">
                        เกณฑ์ IT กระทรวงดีอี (ประกาศ 1 ธ.ค. 2568)
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200/80 mt-1">
                      ราคากลางอ้างอิงและเกณฑ์คุณลักษณะเฉพาะขั้นต่ำสำหรับครุภัณฑ์การแพทย์ วิทยาศาสตร์ ระบบกล้องโทรทัศน์วงจรปิด (CCTV) และระบบคอมพิวเตอร์ภาครัฐ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-right">
                    <div className="text-[10px] text-slate-400">รายการในระบบ</div>
                    <div className="text-sm font-black text-purple-300 font-mono">
                      {equipmentCatalog.length} รายการ
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Official Verification Status Ribbon */}
            <div className="bg-emerald-950/90 text-emerald-100 p-4 rounded-xl border border-emerald-500/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-lg shrink-0">
                  ✅
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>สถานะข้อมูล: ข้อมูลฉบับล่าสุดและเป็นปัจจุบัน 100% ตามหนังสือเวียนราชการที่มีผลบังคับใช้</span>
                    <span className="bg-emerald-400 text-emerald-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Verified & Current
                    </span>
                  </div>
                  <div className="text-emerald-300/90 text-[11px] mt-0.5 space-x-2">
                    <span>• สำนักงบประมาณ: <b>นร 0719.1/ว 53 (ธ.ค. 2568 - สำหรับปีงบประมาณ 2569)</b></span>
                    <span>• กระทรวงดีอี (IT): <b>ประกาศ ณ 1 ธันวาคม 2568</b></span>
                    <span>• กระทรวงดีอี (CCTV): <b>เกณฑ์ Onvif Profile S & NTP time1.nimt.or.th</b></span>
                    <span>• กรมบัญชีกลาง: <b>กค 0405.2/ว 106 & ว 119</b></span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-emerald-400 bg-emerald-900/60 border border-emerald-700/60 px-2.5 py-1 rounded-md font-mono">
                  อัปเดตระบบ: ฐานข้อมูล พ.ย. 2569 / ธ.ค. 2568
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="🔍 ค้นหารหัส, ชื่อครุภัณฑ์, คุณลักษณะเฉพาะ..."
                  value={eqSearchQuery}
                  onChange={(e) => setEqSearchQuery(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                >
                  <option value="ALL">ทุกหมวดหมู่และมาตรฐาน ({equipmentCatalog.length})</option>
                  <option value="6515">6515 - ครุภัณฑ์การแพทย์ (สำนักงบประมาณ)</option>
                  <option value="6525">6525 - ครุภัณฑ์วิทยาศาสตร์ & รังสี (สำนักงบประมาณ)</option>
                  <option value="7020">7020 - ระบบกล้องโทรทัศน์วงจรปิด CCTV (เกณฑ์กระทรวงดีอี MDES)</option>
                  <option value="7010">7010 - ครุภัณฑ์คอมพิวเตอร์ & IT (เกณฑ์กระทรวงดีอี MDES)</option>
                  <option value="2310">2310 - ครุภัณฑ์ยานพาหนะ รถพยาบาล ALS (สำนักงบประมาณ)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("assetCoding")}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🏷️</span>
                  <span>ไปที่เครื่องมือสร้างรหัสครุภัณฑ์ ➔</span>
                </button>
              </div>
            </div>

            {/* Catalog Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">รหัสมาตรฐาน / หน่วยงานกำกับ</th>
                      <th className="p-3.5">ชื่อครุภัณฑ์ (ภาษาไทย / อังกฤษ)</th>
                      <th className="p-3.5">คุณลักษณะเฉพาะขั้นต่ำ (Specifications)</th>
                      <th className="p-3.5 text-right">ราคามาตรฐาน / ราคากลาง</th>
                      <th className="p-3.5 text-center">อายุใช้งาน</th>
                      <th className="p-3.5 text-center">ค่าเสื่อม/ปี</th>
                      <th className="p-3.5 text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {equipmentCatalog
                      .filter((it) => {
                        const matchClass = filterClass === "ALL" || it.classCode === filterClass;
                        const matchQ =
                          !eqSearchQuery ||
                          it.nameTh.toLowerCase().includes(eqSearchQuery.toLowerCase()) ||
                          it.nameEn.toLowerCase().includes(eqSearchQuery.toLowerCase()) ||
                          it.assetCodePrefix.includes(eqSearchQuery) ||
                          it.specifications.toLowerCase().includes(eqSearchQuery.toLowerCase());
                        return matchClass && matchQ;
                      })
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-purple-50/30 transition">
                          <td className="p-3.5 font-mono font-bold text-purple-900 whitespace-nowrap">
                            <span className="bg-purple-100 px-2 py-0.5 rounded text-[11px] border border-purple-200">
                              {item.assetCodePrefix}
                            </span>
                            <div className="mt-1 flex items-center gap-1 font-sans flex-wrap">
                              {item.standardAuthority === "MDES_CCTV" ? (
                                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                  เกณฑ์ CCTV (กระทรวงดีอี)
                                </span>
                              ) : item.standardAuthority === "MDES_IT" ? (
                                <span className="bg-blue-100 text-blue-800 border border-blue-300 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                  เกณฑ์ IT (กระทรวงดีอี)
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                  สำนักงบประมาณ
                                </span>
                              )}
                              {item.officialCircularRef && (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold" title="หนังสือเวียนราชการที่มีผลบังคับใช้">
                                  📜 {item.officialCircularRef}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <div className="font-bold text-slate-900">{item.nameTh}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.nameEn}</div>
                          </td>
                          <td className="p-3.5 max-w-sm text-slate-600 text-[11px] leading-relaxed">
                            {item.specifications}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            ฿{Number(item.standardPrice).toLocaleString()}
                            <div className="text-[10px] text-emerald-700 font-sans font-semibold">
                              รวม VAT 7%
                            </div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="font-bold text-slate-800">{item.usefulLifeYears} ปี</span>
                            <div className="text-[10px] text-slate-400">เกณฑ์ กค.</div>
                          </td>
                          <td className="p-3.5 text-center font-mono font-semibold text-purple-800 whitespace-nowrap">
                            {item.depreciationRatePct}%
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setGenClass(item.classCode);
                                setGenGroup(item.groupCode);
                                setGenItem(item.itemCode);
                                setDeprecCost(item.standardPrice);
                                setDeprecLife(item.usefulLifeYears);
                                setActiveTab("assetCoding");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 font-bold text-[11px] transition flex items-center gap-1 mx-auto"
                            >
                              <span>🏷️</span>
                              <span>สร้างรหัส & ป้าย</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ASSET CODING STRUCTURE & TAG GENERATOR (CGD STANDARD) */}
        {activeTab === "assetCoding" && (
          <div className="space-y-6">
            {/* Header Compliance Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 text-white p-5 rounded-2xl border border-amber-500/30 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
                    🏷️
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white tracking-wide">
                        การกำหนดรหัสครุภัณฑ์ภาครัฐ ตามมาตรฐานกรมบัญชีกลาง (CGD Fixed Asset Classification)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                        หนังสือเวียน กค 0405.2/ว 106 & ว 119
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/80 mt-1">
                      โครงสร้างรหัสจำแนกตามประเภทพัสดุและปีงบประมาณที่ได้มา พร้อมระบบคำนวณค่าเสื่อมราคาสะสม (Straight-line) และออกป้ายทรัพย์สินราชการ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-lg bg-amber-900/60 border border-amber-500/40 text-amber-200 font-mono font-bold">
                    รูปแบบ: [หมวด 4]-[ชนิด 3]-[รายการ 4]-[ปีงบ 4]/[ลำดับ 4]
                  </span>
                </div>
              </div>
            </div>

            {/* 5 Segment Explanation Formula */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">1. หมวดครุภัณฑ์ (Class)</div>
                <div className="text-lg font-black text-[#1E3A8A] font-mono mt-1">6515</div>
                <div className="text-[11px] text-slate-600 mt-1">4 หลัก (ครุภัณฑ์การแพทย์)</div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">2. ชนิดครุภัณฑ์ (Group)</div>
                <div className="text-lg font-black text-indigo-700 font-mono mt-1">001</div>
                <div className="text-[11px] text-slate-600 mt-1">3 หลัก (เครื่องช่วยและพยุงชีพ)</div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">3. รายการเฉพาะ (Item)</div>
                <div className="text-lg font-black text-purple-700 font-mono mt-1">0001</div>
                <div className="text-[11px] text-slate-600 mt-1">4 หลัก (เครื่องช่วยหายใจ ICU)</div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">4. ปีงบประมาณ (FY)</div>
                <div className="text-lg font-black text-amber-700 font-mono mt-1">2569</div>
                <div className="text-[11px] text-slate-600 mt-1">4 หลัก (ปีที่ตรวจรับเข้าบัญชี)</div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">5. ลำดับเครื่อง (Serial)</div>
                <div className="text-lg font-black text-emerald-700 font-mono mt-1">0001</div>
                <div className="text-[11px] text-slate-600 mt-1">4 หลัก (ลำดับที่ได้มาในปีงบ)</div>
              </div>
            </div>

            {/* 2-Column Split: Asset Generator & Label Tag Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Generator & Depreciation Calculator (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Auto Asset Code Generator Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>⚙️</span>
                      <span>เครื่องมือสร้างรหัสครุภัณฑ์อัตโนมัติ (Asset Code Generator)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">มาตรฐาน ว.106</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700">หมวดครุภัณฑ์ (Class)</label>
                      <select
                        value={genClass}
                        onChange={(e) => setGenClass(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-lg bg-white font-mono font-bold text-[#1E3A8A]"
                      >
                        <option value="6515">6515 - ครุภัณฑ์การแพทย์</option>
                        <option value="6525">6525 - ครุภัณฑ์วิทยาศาสตร์</option>
                        <option value="7020">7020 - ระบบกล้องโทรทัศน์วงจรปิด CCTV (เกณฑ์ MDES)</option>
                        <option value="7010">7010 - ครุภัณฑ์คอมพิวเตอร์ (เกณฑ์ MDES)</option>
                        <option value="2310">2310 - ครุภัณฑ์ยานพาหนะ</option>
                        <option value="7110">7110 - ครุภัณฑ์สำนักงาน</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">ชนิด (Group: 3 หลัก)</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={genGroup}
                        onChange={(e) => setGenGroup(e.target.value.padStart(3, "0").slice(-3))}
                        className="w-full mt-1 p-2 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">รายการ (Item: 4 หลัก)</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={genItem}
                        onChange={(e) => setGenItem(e.target.value.padStart(4, "0").slice(-4))}
                        className="w-full mt-1 p-2 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">ปีงบประมาณที่ได้มา</label>
                      <input
                        type="number"
                        value={genFiscalYear}
                        onChange={(e) => setGenFiscalYear(Number(e.target.value))}
                        className="w-full mt-1 p-2 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">จำนวนเครื่องที่จัดหา</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={genUnits}
                        onChange={(e) => setGenUnits(Math.max(1, Number(e.target.value)))}
                        className="w-full mt-1 p-2 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">แผนกผู้ครอบครอง</label>
                      <select
                        value={genDepartment}
                        onChange={(e) => setGenDepartment(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-lg bg-white"
                      >
                        <option value="DEP-SURG-OR">กลุ่มงานห้องผ่าตัด (OR)</option>
                        <option value="DEP-ICU-CRIT">หอผู้ป่วยวิกฤต (ICU)</option>
                        <option value="DEP-MED-OPD">อายุรกรรมผู้ป่วยนอก</option>
                        <option value="DEP-RAD-IMG">กลุ่มงานรังสีวิทยา</option>
                        <option value="DEP-EMERG-ER">อุบัติเหตุและฉุกเฉิน (ER)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const codes: string[] = [];
                        for (let seq = 1; seq <= genUnits; seq++) {
                          const s = String(seq).padStart(4, "0");
                          codes.push(`${genClass}-${genGroup}-${genItem}-${genFiscalYear}/${s}`);
                        }
                        setGeneratedCodes(codes);
                        setActiveTagIndex(0);
                        setBanner({
                          type: "ok",
                          text: `สร้างรหัสครุภัณฑ์สำเร็จ ${codes.length} เครื่อง ตามมาตรฐานกรมบัญชีกลาง`,
                        });
                      }}
                      className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <span>⚡ สร้างรหัสครุภัณฑ์มาตรฐานกรมบัญชีกลาง ({genUnits} เครื่อง)</span>
                    </button>
                  </div>

                  {/* List of Generated Codes */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>รหัสครุภัณฑ์ที่พร้อมบันทึกเข้าบัญชีทรัพย์สิน:</span>
                      <span className="text-blue-700 font-mono">{generatedCodes.length} รายการ</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                      {generatedCodes.map((code, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveTagIndex(idx)}
                          className={`p-2 rounded-lg border text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition ${
                            activeTagIndex === idx
                              ? "bg-amber-100/70 border-amber-400 text-amber-900 shadow-xs"
                              : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <span>{code}</span>
                          <span className="text-[10px] text-slate-500 font-sans">เครื่อง #{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Straight-line Depreciation Calculator Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>⚖️</span>
                      <span>คำนวณค่าเสื่อมราคาทรัพย์สินภาครัฐ (Straight-line Depreciation)</span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      ราคาซาก ฿1.00 ตามระเบียบ กค.
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700">ราคาทุนจัดหา (บาท)</label>
                      <input
                        type="number"
                        value={deprecCost}
                        onChange={(e) => setDeprecCost(Number(e.target.value))}
                        className="w-full mt-1 p-2 border rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">อายุการใช้งาน (ปี)</label>
                      <input
                        type="number"
                        value={deprecLife}
                        onChange={(e) => setDeprecLife(Math.max(1, Number(e.target.value)))}
                        className="w-full mt-1 p-2 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">จำนวนปีที่ใช้งานแล้ว</label>
                      <input
                        type="number"
                        value={deprecYearsInService}
                        onChange={(e) => setDeprecYearsInService(Math.max(0, Number(e.target.value)))}
                        className="w-full mt-1 p-2 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Depreciation Results */}
                  {(() => {
                    const salvage = 1;
                    const depreciable = Math.max(0, deprecCost - salvage);
                    const annual = depreciable / deprecLife;
                    const accumulated = Math.min(depreciable, annual * deprecYearsInService);
                    const netBook = Math.max(salvage, deprecCost - accumulated);

                    return (
                      <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500">ค่าเสื่อมราคา/ปี (Annual)</div>
                          <div className="text-sm font-black text-[#1E3A8A] font-mono mt-0.5">
                            ฿{annual.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">{(100 / deprecLife).toFixed(1)}% ต่อปี</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500">ค่าเสื่อมสะสม ({deprecYearsInService} ปี)</div>
                          <div className="text-sm font-black text-rose-700 font-mono mt-0.5">
                            ฿{accumulated.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">ตัดจ่ายรายงวด</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500">มูลค่าสุทธิทางบัญชี (Net Book)</div>
                          <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                            ฿{netBook.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">บันทึกงบทดลอง GL</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column: Physical Asset Tag Label Simulator (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>🏷️</span>
                      <span>ตัวอย่างป้ายทรัพย์สินราชการ (Asset Tag Simulator)</span>
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-bold">พร้อมพิมพ์</span>
                  </div>

                  {/* Metal-Plate Asset Tag Mockup */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-900 text-white border-2 border-amber-400/80 shadow-xl space-y-3 relative overflow-hidden">
                    <div className="flex items-start justify-between border-b border-slate-700 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-base">
                          🏥
                        </div>
                        <div>
                          <div className="text-[11px] font-black tracking-wider text-amber-300">
                            ทรัพย์สินโรงพยาบาลอุดรธานี (HCODE: 10671)
                          </div>
                          <div className="text-[9px] text-slate-400">
                            สำนักงานปลัดกระทรวงสาธารณสุข
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded border border-blue-400/30">
                        ครุภัณฑ์ราชการ
                      </span>
                    </div>

                    <div>
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                        หมายเลขรหัสครุภัณฑ์ (Asset Classification Code)
                      </div>
                      <div className="text-base sm:text-lg font-black font-mono text-amber-300 tracking-wider mt-0.5">
                        {generatedCodes[activeTagIndex] || "6515-001-0001-2569/0001"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-400">แผนกผู้ครอบครอง:</span>
                        <div className="font-bold text-slate-200 mt-0.5">{genDepartment}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">วันที่ตรวจรับ:</span>
                        <div className="font-bold text-slate-200 mt-0.5">
                          {new Date().toISOString().slice(0, 10)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">ราคาจัดหา:</span>
                        <div className="font-mono font-bold text-emerald-400 mt-0.5">
                          ฿{deprecCost.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">อายุการใช้งาน:</span>
                        <div className="font-bold text-slate-200 mt-0.5">{deprecLife} ปี (เกณฑ์ กค.)</div>
                      </div>
                    </div>

                    {/* Barcode & QR Payload Simulation */}
                    <div className="bg-white p-3 rounded-lg flex items-center justify-between text-slate-900">
                      <div className="flex-1">
                        <div className="font-mono font-black text-center text-xs tracking-widest border-b border-dashed border-slate-300 pb-1 mb-1">
                          ||||| | |||| ||| |||||| | |||||||| |||| |
                        </div>
                        <div className="text-center font-mono text-[9px] text-slate-500">
                          {generatedCodes[activeTagIndex] || "6515-001-0001-2569/0001"}
                        </div>
                      </div>
                      <div className="w-12 h-12 ml-3 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center text-[8px] font-mono text-slate-600 font-bold">
                        <span>[ QR ]</span>
                        <span className="text-[7px]">SCAN</span>
                      </div>
                    </div>

                    <div className="text-center text-[9px] text-amber-200/70 border-t border-slate-800 pt-2">
                      ⚠️ ทรัพย์สินของทางราชการ ห้ามทำลาย หรือเคลื่อนย้ายโดยไม่ได้รับอนุญาต
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🖨️</span>
                      <span>พิมพ์ป้ายครุภัณฑ์ (Asset Tag)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const csvContent =
                          "data:text/csv;charset=utf-8," +
                          ["AssetCode,Class,FiscalYear,Department,Cost,LifeYears"]
                            .concat(
                              generatedCodes.map(
                                (c) => `${c},${genClass},${genFiscalYear},${genDepartment},${deprecCost},${deprecLife}`
                              )
                            )
                            .join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `Asset_Codes_${genClass}_${genFiscalYear}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>📥</span>
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Active Fixed Asset Register Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mt-6">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>📚</span>
                    <span>ทะเบียนสินทรัพย์ครุภัณฑ์จริงที่ครอบครองในโรงพยาบาล (Hospital Active Fixed Asset Register)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    สินทรัพย์ที่ผ่านการตรวจรับ บันทึกเข้าบัญชีทรัพย์สินภาครัฐ และคำนวณค่าเสื่อมราคาสะสมตามมาตรฐานกรมบัญชีกลาง ว.106
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    ครอบครอง {activeAssets.length} รายการ
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">รหัสครุภัณฑ์ (Asset Code)</th>
                      <th className="p-3.5">ชื่อครุภัณฑ์ / ซีเรียลเครื่อง</th>
                      <th className="p-3.5">แผนกผู้ครอบครอง / สถานที่ตั้ง</th>
                      <th className="p-3.5">ผู้รับผิดชอบ</th>
                      <th className="p-3.5 text-right">ราคาทุนจัดหา</th>
                      <th className="p-3.5 text-right">มูลค่าสุทธิ (Net Book)</th>
                      <th className="p-3.5 text-center">สถานะ</th>
                      <th className="p-3.5 text-center">ป้ายพัสดุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeAssets.map((asset) => {
                      const salvage = 1;
                      const depreciable = Math.max(0, asset.costPrice - salvage);
                      const annual = depreciable / asset.usefulLifeYears;
                      const accumulated = Math.min(depreciable, annual * asset.yearsInService);
                      const netBook = Math.max(salvage, asset.costPrice - accumulated);

                      return (
                        <tr key={asset.assetCode} className="hover:bg-amber-50/30 transition">
                          <td className="p-3.5 font-mono font-bold text-amber-900 whitespace-nowrap">
                            <span className="bg-amber-100 px-2 py-0.5 rounded text-[11px] border border-amber-300">
                              {asset.assetCode}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 font-sans">
                              ปีงบ {asset.fiscalYear} • ตรวจรับ {asset.acquisitionDate}
                            </div>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <div className="font-bold text-slate-900">{asset.nameTh}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              S/N: {asset.serialNumber}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-700">
                            <div className="font-semibold text-slate-800">{asset.departmentNameTh}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{asset.locationRoom}</div>
                          </td>
                          <td className="p-3.5 text-slate-700 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{asset.custodianName}</div>
                            <div className="text-[10px] text-emerald-700">ประกันถึง {asset.warrantyExpireDate}</div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            ฿{asset.costPrice.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            ฿{Math.round(netBook).toLocaleString()}
                            <div className="text-[10px] text-slate-400 font-sans">
                              (ใช้งาน {asset.yearsInService} ปี)
                            </div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ● พร้อมใช้งาน
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setGeneratedCodes([asset.assetCode]);
                                setActiveTagIndex(0);
                                setGenDepartment(asset.departmentCode);
                                setDeprecCost(asset.costPrice);
                                setDeprecLife(asset.usefulLifeYears);
                                window.scrollTo({ top: 400, behavior: "smooth" });
                              }}
                              className="px-2 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 font-bold text-[11px] transition cursor-pointer"
                            >
                              🏷️ ดูป้าย Tag
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {personnelModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {personnelEditing ? `✏️ แก้ไขข้อมูลบุคลากร: ${personnelEditing.staffCode}` : "➕ เพิ่มบุคลากรทางการแพทย์ / เจ้าหน้าที่ใหม่"}
                </h3>
                <button onClick={() => setPersonnelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePersonnel} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700">รหัสบุคลากร (Staff Code) *</label>
                      {!personnelEditing && (
                        <button
                          type="button"
                          onClick={handleAutoGenerateStaffCode}
                          className="text-[11px] text-blue-600 hover:underline font-bold"
                        >
                          ⚡ รันรหัสอัตโนมัติ
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      disabled={!!personnelEditing}
                      value={personnelForm.staffCode}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, staffCode: e.target.value })}
                      placeholder="เช่น EMP-10671-0016"
                      className="w-full mt-1 p-2 border rounded-lg uppercase disabled:bg-slate-100 font-mono font-bold text-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">MOPH Provider ID (2FA/Digital Sign) *</label>
                    <input
                      type="text"
                      required
                      value={personnelForm.mophProviderId}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, mophProviderId: e.target.value })}
                      placeholder="เช่น MOPH-10671-DR02"
                      className="w-full mt-1 p-2 border rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">คำนำหน้า *</label>
                    <select
                      value={personnelForm.titleTh}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, titleTh: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-lg bg-white"
                    >
                      <option value="นพ.">นพ.</option>
                      <option value="พญ.">พญ.</option>
                      <option value="ภก.">ภก.</option>
                      <option value="ภญ.">ภญ.</option>
                      <option value="พว.">พว.</option>
                      <option value="ทนพ.">ทนพ.</option>
                      <option value="ทนพญ.">ทนพญ.</option>
                      <option value="วศ.">วศ.</option>
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="น.ส.">น.ส.</option>
                      <option value="ดร.">ดร.</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">ชื่อ (ภาษาไทย) *</label>
                    <input
                      type="text"
                      required
                      value={personnelForm.firstNameTh}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, firstNameTh: e.target.value })}
                      placeholder="ชื่อจริง"
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">นามสกุล (ภาษาไทย) *</label>
                    <input
                      type="text"
                      required
                      value={personnelForm.lastNameTh}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, lastNameTh: e.target.value })}
                      placeholder="นามสกุล"
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700">สายวิชาชีพ (Personnel Type) *</label>
                    <select
                      value={personnelForm.personnelType}
                      onChange={(e: any) => setPersonnelForm({ ...personnelForm, personnelType: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-lg bg-white"
                    >
                      <option value="PHYSICIAN">แพทย์เฉพาะทาง</option>
                      <option value="NURSE">พยาบาลวิชาชีพ</option>
                      <option value="PHARMACIST">เภสัชกร</option>
                      <option value="TECH_MED">นักเทคนิคการแพทย์</option>
                      <option value="PROCUREMENT_OFFICER">เจ้าหน้าที่พัสดุ</option>
                      <option value="FINANCE_OFFICER">เจ้าหน้าที่การเงินและบัญชี</option>
                      <option value="LEGAL_OFFICER">นิติกร</option>
                      <option value="EXECUTIVE">ผู้บริหาร</option>
                      <option value="ENGINEER">วิศวกรการแพทย์</option>
                      <option value="STAFF">เจ้าหน้าที่ทั่วไป</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">สังกัดกลุ่มงาน/แผนก *</label>
                    <select
                      value={personnelForm.departmentCode}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, departmentCode: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-lg bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d.departmentCode} value={d.departmentCode}>
                          {d.departmentNameTh}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700">ตำแหน่งทางราชการ *</label>
                    <input
                      type="text"
                      required
                      value={personnelForm.positionTitle}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, positionTitle: e.target.value })}
                      placeholder="เช่น นายแพทย์ชำนาญการพิเศษ"
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">เลขที่ใบประกอบวิชาชีพ (ถ้ามี)</label>
                    <input
                      type="text"
                      value={personnelForm.licenseNumber}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, licenseNumber: e.target.value })}
                      placeholder="เช่น ว. 45678 หรือ ภ. 19283"
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700">เลขประจำตัวประชาชน 13 หลัก (PDPA Protected)</label>
                    <input
                      type="text"
                      value={personnelForm.citizenId}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, citizenId: e.target.value })}
                      placeholder="1100200345686"
                      className="w-full mt-1 p-2 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      value={personnelForm.telephone}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, telephone: e.target.value })}
                      placeholder="02-590-XXXX"
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="commEligible"
                      checked={personnelForm.isCommitteeEligible}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, isCommitteeEligible: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <label htmlFor="commEligible" className="font-semibold text-slate-800">
                      มีคุณสมบัติได้รับการแต่งตั้งเป็นคณะกรรมการจัดซื้อจัดจ้าง/ตรวจรับพัสดุ (พ.ร.บ. 2560)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="padesActive"
                      checked={personnelForm.padesSignatureActive}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, padesSignatureActive: e.target.checked })}
                      className="rounded text-teal-600"
                    />
                    <label htmlFor="padesActive" className="font-semibold text-slate-800">
                      เปิดใช้งานใบรับรองลายมือชื่ออิเล็กทรอนิกส์ PAdES-LTV สำหรับตรวจรับพัสดุ
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setPersonnelModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold"
                  >
                    💾 บันทึกข้อมูลบุคลากร
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT RUNNING NUMBER RULE */}
        {ruleModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {ruleEditing
                    ? `✏️ แก้ไขรูปแบบเลขรัน: ${ruleEditing.docTypeCode}`
                    : "➕ เพิ่มรูปแบบเลขรันเอกสารใหม่"}
                </h3>
                <button onClick={() => setRuleModalOpenOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700">รหัสประเภทเอกสาร *</label>
                    <input
                      type="text"
                      required
                      disabled={!!ruleEditing}
                      value={ruleForm.docTypeCode}
                      onChange={(e) => setRuleForm({ ...ruleForm, docTypeCode: e.target.value })}
                      placeholder="เช่น PR, PO, REQ, EMP"
                      className="w-full mt-1 p-2 border rounded-lg uppercase disabled:bg-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">คำขึ้นต้น (Prefix) *</label>
                    <input
                      type="text"
                      required
                      value={ruleForm.prefix}
                      onChange={(e) => setRuleForm({ ...ruleForm, prefix: e.target.value })}
                      placeholder="เช่น PR, PO, EMP"
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
                    placeholder="{PREFIX}-{YEAR}-{DEP}-{NUM}"
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
                    <label className="font-semibold text-slate-700">เลขล่าสุด (Current)</label>
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
                    onClick={() => setRuleModalOpenOpen(false)}
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

        {/* MODAL: ADD / EDIT DEPARTMENT */}
        {depModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {depEditing ? `✏️ แก้ไขข้อมูลกลุ่มงาน/แผนก: ${depEditing.departmentCode}` : "➕ เพิ่มกลุ่มงาน/แผนกใหม่"}
                </h3>
                <button onClick={() => setDepModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700">รหัสแผนก (Code) *</label>
                    <input
                      type="text"
                      required
                      disabled={!!depEditing}
                      value={depForm.departmentCode}
                      onChange={(e) => setDepForm({ ...depForm, departmentCode: e.target.value })}
                      placeholder="เช่น DEP-ICU-SURG"
                      className="w-full mt-1 p-2 border rounded-lg uppercase disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">กลุ่มภารกิจหลัก *</label>
                    <select
                      value={depForm.groupCode}
                      onChange={(e) => setDepForm({ ...depForm, groupCode: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-lg bg-white"
                    >
                      {groups.map((g) => (
                        <option key={g.groupCode} value={g.groupCode}>
                          {g.groupNameTh}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">ชื่อกลุ่มงาน/แผนก (ภาษาไทย) *</label>
                  <input
                    type="text"
                    required
                    value={depForm.departmentNameTh}
                    onChange={(e) => setDepForm({ ...depForm, departmentNameTh: e.target.value })}
                    placeholder="เช่น หออภิบาลผู้ป่วยหนักศัลยกรรม (Surgical ICU)"
                    className="w-full mt-1 p-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700">รหัสศูนย์ต้นทุน (Cost Center สป.สธ.) *</label>
                    <input
                      type="text"
                      required
                      value={depForm.costCenterCode}
                      onChange={(e) => setDepForm({ ...depForm, costCenterCode: e.target.value })}
                      placeholder="เช่น CC-10671-205"
                      className="w-full mt-1 p-2 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">หัวหน้ากลุ่มงาน/แผนก</label>
                    <input
                      type="text"
                      value={depForm.headName}
                      onChange={(e) => setDepForm({ ...depForm, headName: e.target.value })}
                      placeholder="เช่น พญ. ศศิธร สุขสมบูรณ์"
                      className="w-full mt-1 p-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setDepModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold"
                  >
                    💾 บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
