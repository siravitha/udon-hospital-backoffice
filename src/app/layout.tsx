"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HospitalAiCopilot from "@/components/HospitalAiCopilot";
import "./globals.css";

interface SubItem {
  href: string;
  label: string;
  desc: string;
  badge?: string;
  icon: string;
}

interface MainMenu {
  id: string;
  label: string;
  shortLabel?: string;
  icon: string;
  badge?: string;
  items: SubItem[];
}

const MENU_STRUCTURE: MainMenu[] = [
  {
    id: "executive",
    label: "ผู้บริหาร & ตรวจสอบ",
    shortLabel: "ผู้บริหาร",
    icon: "📊",
    items: [
      {
        href: "/dashboard",
        icon: "📈",
        label: "Executive KPI Dashboard",
        desc: "ดูอัตราการดูดซับงบพหุกองทุน 5 กองทุน & Aging เจ้าหนี้การค้า",
        badge: "Real-time",
      },
      {
        href: "/auditor",
        icon: "🛡️",
        label: "สตง. / ป.ป.ช. Audit Console",
        desc: "ตรวจสอบ Cryptographic SHA-256 Hash Chain & Daily Merkle Root",
        badge: "WORM Chain",
      },
      {
        href: "/workspace/admin/master-data",
        icon: "👨‍⚕️",
        label: "ข้อมูลหลัก & มาตรฐานครุภัณฑ์ (Master Data & Assets)",
        desc: "ทะเบียนบุคลากร • โครงสร้างแผนก • บัญชีราคามาตรฐานครุภัณฑ์สำนักงบประมาณ • การกำหนดรหัสครุภัณฑ์",
        badge: "Standards",
      },
      {
        href: "/login",
        icon: "🔐",
        label: "ยืนยันตัวตน 2FA (MOPH Provider ID)",
        desc: "ระบบล็อกอิน 2 ชั้น Local Argon2id + OTP/PKCE กระทรวงสาธารณสุข",
      },
    ],
  },
  {
    id: "clinical",
    label: "เภสัชกรรม & คลังยา",
    shortLabel: "คลังยา & OR",
    icon: "💊",
    badge: "FEFO",
    items: [
      {
        href: "/inventory",
        icon: "📦",
        label: "คลังยากลาง & ตู้ยาวอร์ด (ERP Supply Chain)",
        desc: "จัดการสต็อกคลังใหญ่ • กฎจ่ายยาหมดอายุก่อน (FEFO) • มอนิเตอร์ตู้ยาวอร์ด Par Level",
        badge: "FEFO Ready",
      },
      {
        href: "/workspace/clinical-pharma",
        icon: "📝",
        label: "สร้างใบขอซื้อยา & เวชภัณฑ์ (PR)",
        desc: "ตรวจเพดานราคากลางยา NLEM • สิทธิพิเศษ GPO • ทางด่วนฉุกเฉิน ม.56(1)(ค)",
      },
      {
        href: "/workspace/clinical-pharma",
        icon: "🏥",
        label: "เวชภัณฑ์ฝากขายห้องผ่าตัด (OR Consignment)",
        desc: "ตัดยอดการใช้วัสดุผ่าตัดจาก HIS อัตโนมัติ พร้อมออก Auto-PO ปิดรอบสิ้นเดือน",
        badge: "PDPA Masked",
      },
      {
        href: "/workspace/clinical-pharma",
        icon: "🔬",
        label: "ตรวจรับยาควบคุมความเย็น (Cold-Chain)",
        desc: "บันทึกอุณหภูมิ 2.0-8.0°C • แนบ COA • ลงนามอิเล็กทรอนิกส์ PAdES-LTV",
      },
    ],
  },
  {
    id: "budget",
    label: "แผนงาน & พหุกองทุน",
    shortLabel: "แผน & กองทุน",
    icon: "💰",
    items: [
      {
        href: "/workspace/budget/proposals",
        icon: "📑",
        label: "ยื่นคำของบประมาณประจำปี (Annual Proposal Hub)",
        desc: "จัดทำคำของบประมาณรายจ่ายล่วงหน้าปี 2570 • จัดหมวดหมู่งบดำเนินงาน/งบลงทุน/ค่าเสื่อม สปสช.",
        badge: "FY2570",
      },
      {
        href: "/workspace/budget",
        icon: "🏦",
        label: "ควบคุมเพดาน 5 กองทุนโรงพยาบาล",
        desc: "งบแผ่นดิน • เงินบำรุงโรงพยาบาล • เงินบริจาคมี/ไม่มีวัตถุประสงค์ • ค่าเสื่อม UC",
      },
      {
        href: "/workspace/budget",
        icon: "📋",
        label: "อนุมัติผูกพันงบประมาณ (PR Approval)",
        desc: "ย้ายสถานะวงเงินจาก PRE_ENCUMBERED → ENCUMBERED (Hard-stop ป้องกันงบเกิน)",
        badge: "Hard-Stop",
      },
    ],
  },
  {
    id: "procurement",
    label: "พัสดุ & สัญญา",
    shortLabel: "พัสดุ & สัญญา",
    icon: "📑",
    items: [
      {
        href: "/workspace/procurement",
        icon: "📦",
        label: "สัญญาจะซื้อจะขาย (Blanket PA)",
        desc: "ออกใบสั่งซื้อ Call-Off PO ทยอยส่งมอบ ตัดโควตาสัญญาจะซื้อจะขาย",
      },
      {
        href: "/workspace/procurement",
        icon: "⏳",
        label: "ตรวจสอบระยะเวลารออุทธรณ์ (Standstill)",
        desc: "นับระยะเวลา Standstill Period 7 วันทำการก่อนลงนามสัญญาตาม พ.ร.บ. 2560",
      },
      {
        href: "/workspace/admin/vendors",
        icon: "🏢",
        label: "ทะเบียนคู่ค้า & ผู้ประกอบการ (Vendor Master Hub)",
        desc: "ฐานข้อมูลคู่ค้า 13 หลัก • สิทธิยกเว้นภาษี GPO/รัฐ • เลขบัญชีโอน GFMIS • ตรวจสอบ Blacklist ม.109",
        badge: "Vendor Hub",
      },
      {
        href: "/workspace/legal",
        icon: "⚖️",
        label: "นิติกรตรวจร่างสัญญา & หลักประกัน e-LG",
        desc: "เปรียบเทียบข้อสัญญามาตรฐาน Side-by-Side • ตรวจ e-LG ธนาคาร 5%",
      },
    ],
  },
  {
    id: "finance",
    label: "การเงิน & เบิกจ่าย",
    shortLabel: "การเงินเบิกจ่าย",
    icon: "🧾",
    items: [
      {
        href: "/workspace/finance",
        icon: "💵",
        label: "ตรวจคู่จ่าย 3 ทาง (3-Way Match)",
        desc: "จับคู่ตรงกันระหว่าง PO (พัสดุ) + ใบตรวจรับ (กรรมการ) + ใบกำกับภาษี (ผู้ขาย)",
      },
      {
        href: "/workspace/finance",
        icon: "🏷️",
        label: "ถอดภาษี VAT 7% & หัก ณ ที่จ่าย 1%",
        desc: "สูตรคำนวณแยกฐาน Ex-VAT ถูกต้อง • ตรวจสิทธิยกเว้นภาษีของ อภ. (GPO)",
      },
      {
        href: "/workspace/finance",
        icon: "🏛️",
        label: "คำสั่งโอนเงิน Net Payable (GFMIS)",
        desc: "หักค่าปรับส่งมอบล่าช้า • ส่งยอดโอนสุทธิเข้าบัญชีผู้ขายตรงตามระเบียบคลัง",
      },
    ],
  },
  {
    id: "accounting",
    label: "ฝ่ายบัญชี & GL",
    shortLabel: "ฝ่ายบัญชี",
    icon: "📒",
    badge: "GL / COA",
    items: [
      {
        href: "/workspace/accounting",
        icon: "📝",
        label: "สมุดรายวันทั่วไป & บันทึกบัญชี (General Journal)",
        desc: "Auto GL Posting เดบิต/เครดิต อัตโนมัติจากตรวจรับและ 3-Way Match • บันทึก JV",
        badge: "Auto-GL",
      },
      {
        href: "/workspace/accounting",
        icon: "⚖️",
        label: "งบทดลองประจำงวด (Trial Balance)",
        desc: "ยอดยกมา • รายการเคลื่อนไหว • ยอดยกไป • ตรวจความสมดุลเดบิต-เครดิต Real-time",
        badge: "Balanced",
      },
      {
        href: "/workspace/accounting",
        icon: "📖",
        label: "ผังบัญชีมาตรฐานโรงพยาบาล (Chart of Accounts)",
        desc: "5 หมวดบัญชีสากล (สินทรัพย์, หนี้สิน, ทุน, รายได้, ค่าใช้จ่าย) ตามเกณฑ์กระทรวงการคลัง",
      },
      {
        href: "/workspace/accounting",
        icon: "🏛️",
        label: "งบการเงินโรงพยาบาล (Financial Statements)",
        desc: "งบแสดงฐานะการเงิน (Balance Sheet) และงบแสดงผลการดำเนินงาน (Income Statement)",
      },
    ],
  },
  {
    id: "reports",
    label: "ศูนย์รายงาน & สถิติ",
    shortLabel: "ศูนย์รายงาน",
    icon: "📊",
    badge: "4 เสาหลัก",
    items: [
      {
        href: "/workspace/reports",
        icon: "📑",
        label: "เสา 1: สรุปผลจัดซื้อจัดจ้าง (แบบ สขร. 1)",
        desc: "รายงานผลการจัดซื้อจัดจ้างรายเดือนตามประกาศคณะกรรมการข้อมูลข่าวสารของราชการ",
        badge: "สขร. 1",
      },
      {
        href: "/workspace/reports",
        icon: "💰",
        label: "เสา 2: หนี้การค้า Aging & ภาษี ภ.ง.ด. 53",
        desc: "อายุหนี้เจ้าหนี้การค้า 30/60/90 วัน • สรุปยอดภาษีหัก ณ ที่จ่าย 1% นำส่งกรมสรรพากร",
      },
      {
        href: "/workspace/reports",
        icon: "💊",
        label: "เสา 3: คลังยา FEFO & ยาใกล้หมดอายุ",
        desc: "เฝ้าระวังยาหมดอายุล่วงหน้า 3, 6, 12 เดือน • สรุปการตัดใช้วัสดุฝากขายห้องผ่าตัด OR",
      },
      {
        href: "/workspace/reports",
        icon: "🛡️",
        label: "เสา 4: ธรรมาภิบาล สตง./ป.ป.ช.",
        desc: "ตรวจจับแบ่งซื้อแบ่งจ้าง (< 500k) • ราคายาเกิน NLEM • ตรวจสอบ Merkle Audit Chain",
        badge: "Audit Ready",
      },
    ],
  },
  {
    id: "settings",
    label: "การตั้งค่าระบบ",
    shortLabel: "การตั้งค่า",
    icon: "⚙️",
    items: [
      {
        href: "/workspace/settings/running-numbers",
        icon: "🔢",
        label: "ระบบจัดการเลขรันเอกสาร (Running Number Configuration Engine)",
        desc: "กำหนดรูปแบบ Prefix, Digit Length และรันเลขเอกสารอัตโนมัติ PR, PO, REQ, BP, GRN, PV, EMP",
        badge: "Auto-Seq",
      },
      {
        href: "/workspace/admin/vendors",
        icon: "🏢",
        label: "ทะเบียนคู่ค้า & ผู้ประกอบการ (Vendor Master Hub)",
        desc: "ฐานข้อมูลคู่ค้า 13 หลัก • สิทธิยกเว้นภาษี GPO/รัฐ • เลขบัญชีโอน GFMIS • ตรวจสอบ Blacklist ม.109",
        badge: "Vendor Hub",
      },
      {
        href: "/workspace/admin/master-data",
        icon: "🏢",
        label: "โครงสร้างกลุ่มงาน & แผนก (Departments & Cost Centers)",
        desc: "แผนผังองค์กรโรงพยาบาล รหัสศูนย์ต้นทุน Cost Center และวงเงินงบประมาณ",
      },
      {
        href: "/workspace/admin/master-data",
        icon: "👨‍⚕️",
        label: "ทะเบียนบุคลากร & กรรมการตรวจรับ (Personnel Directory)",
        desc: "ฐานข้อมูลบุคลากร 15 สายวิชาชีพ ผูกสิทธิ์กรรมการตรวจรับ และ 2FA Provider ID",
      },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Helper to determine if a menu category is active based on current route
  function isCategoryActive(menu: MainMenu): boolean {
    if (!pathname) return false;
    return menu.items.some((item) => {
      if (item.href === "/dashboard" && pathname === "/dashboard") return true;
      if (item.href !== "/dashboard" && pathname.startsWith(item.href)) return true;
      return false;
    });
  }

  return (
    <html lang="th">
      <head>
        <title>HOS-BACKOFFICE — ระบบบริหารจัดการโรงพยาบาลรัฐขนาดใหญ่ (1,000+ เตียง)</title>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" async />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased m-0 p-0 overflow-x-hidden">
        {/* Top Header & Mega Navigation */}
        <header
          ref={navRef}
          className="sticky top-0 z-50 bg-gradient-to-r from-[#09193A] via-[#172F6D] to-[#0F5B57] text-white shadow-lg border-b border-white/10"
        >
          {/* Upper Brand Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-white/10">
            <Link href="/dashboard" className="flex items-center gap-3 text-white no-underline group">
              <img
                src="/logo_moph_stroke.png"
                alt="โลโก้กระทรวงสาธารณสุข"
                className="w-10 h-10 rounded-xl object-contain shadow-md group-hover:scale-105 transition"
              />
              <div>
                <div className="text-base font-black tracking-wide flex items-center gap-2">
                  <span>HOS-BACKOFFICE</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold hidden sm:inline-block">
                    โรงพยาบาลอุดรธานี
                  </span>
                </div>
                <div className="text-[11px] text-blue-200 font-medium">
                  โรงพยาบาลอุดรธานี (โรงพยาบาลศูนย์ตติยภูมิ 1,000+ เตียง • HCODE: 10671)
                </div>
              </div>
            </Link>

            {/* Status & Profile Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Production 24/7 (MSI DGX)</span>
              </span>

              <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                <span>🔐</span> MOPH 2FA Active
              </span>

              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1.5"
              >
                <span>👤</span>
                <span className="hidden sm:inline">ผู้ดูแลระบบ (Admin)</span>
              </Link>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
                aria-label="Toggle Navigation Menu"
              >
                <span className="text-lg">{mobileMenuOpen ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>

          {/* Lower Main Menu Bar (Desktop: Compact & Streamlined) */}
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 hidden xl:flex items-center justify-between gap-1 overflow-visible relative">
            <div className="flex items-center gap-1 flex-1">
              {MENU_STRUCTURE.map((menu, index) => {
                const isOpen = openMenu === menu.id;
                const isActive = isCategoryActive(menu);
                // Smart alignment: align right for the last 3 menus to prevent overflow
                const isRightAligned = index >= MENU_STRUCTURE.length - 3;

                return (
                  <div
                    key={menu.id}
                    className="relative"
                    onMouseEnter={() => setOpenMenu(menu.id)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMenu(isOpen ? null : menu.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                        isOpen || isActive
                          ? "bg-white/25 text-white border-white/40 shadow-xs"
                          : "bg-white/5 text-slate-200 hover:bg-white/15 hover:text-white border-white/10"
                      }`}
                    >
                      <span className="text-sm">{menu.icon}</span>
                      <span>{menu.shortLabel || menu.label}</span>
                      {menu.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded">
                          {menu.badge}
                        </span>
                      )}
                      <span className="text-[8px] opacity-75">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {/* Dropdown Mega Sub-Menu */}
                    {isOpen && (
                      <div
                        className={`absolute top-full mt-1.5 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-fadeIn ${
                          isRightAligned ? "right-0" : "left-0"
                        }`}
                      >
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                          <span>{menu.label}</span>
                          <span className="text-blue-600 font-mono">{menu.items.length} รายการ</span>
                        </div>

                        <div className="space-y-1">
                          {menu.items.map((sub, idx) => {
                            const isCurrent = pathname === sub.href;
                            return (
                              <Link
                                key={idx}
                                href={sub.href}
                                onClick={() => setOpenMenu(null)}
                                className={`p-2 rounded-lg text-left no-underline flex items-start gap-2.5 transition ${
                                  isCurrent
                                    ? "bg-blue-50 text-blue-900 font-bold"
                                    : "hover:bg-slate-50 text-slate-700 hover:text-blue-900"
                                }`}
                              >
                                <span className="text-base mt-0.5">{sub.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold flex items-center gap-1.5">
                                    <span className="truncate">{sub.label}</span>
                                    {sub.badge && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-black shrink-0">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                                    {sub.desc}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Mobile Drawer (When hamburger toggled on tablets/phones) */}
          {mobileMenuOpen && (
            <div className="xl:hidden bg-slate-900 border-t border-white/10 px-4 py-4 max-h-[80vh] overflow-y-auto space-y-4">
              {MENU_STRUCTURE.map((menu) => (
                <div key={menu.id} className="border-b border-slate-800 pb-3">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-2 mb-2">
                    <span>{menu.icon}</span>
                    <span>{menu.label}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4">
                    {menu.items.map((sub, idx) => (
                      <Link
                        key={idx}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs text-slate-300 hover:text-white py-1.5 px-2 rounded hover:bg-white/10 flex items-center gap-2"
                      >
                        <span>{sub.icon}</span>
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>

        {/* Standardized GovTech Footer */}
        <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 print:hidden mt-auto">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <img
                  src="/logo_moph_stroke.png"
                  alt="โลโก้กระทรวงสาธารณสุข"
                  className="w-6 h-6 object-contain"
                />
                <span>HOS-BACKOFFICE • โรงพยาบาลอุดรธานี</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
                ระบบงบประมาณพหุกองทุน บัญชีแยกประเภท และการจัดซื้อจัดจ้างภาครัฐ สำหรับโรงพยาบาลอุดรธานี (โรงพยาบาลศูนย์ตติยภูมิขนาด 1,000+ เตียง รหัสสถานพยาบาล HCODE: 10671)
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs mb-2">มาตรฐานและกฎหมายกำกับดูแล (Compliance - ข้อมูลฉบับล่าสุด 2568-2569)</h4>
              <ul className="text-[11px] space-y-1 text-slate-400">
                <li>• พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560</li>
                <li>• บัญชีราคามาตรฐานครุภัณฑ์ สำนักงบประมาณ (ฉบับล่าสุด ธ.ค. 2568 นร 0719.1/ว 53 ใช้สำหรับปีงบประมาณ 2569)</li>
                <li>• การกำหนดรหัสครุภัณฑ์ มาตรฐานกรมบัญชีกลาง (ว 106 / New GFMIS Thai ราคากลาง & อัตราค่าเสื่อมราคา)</li>
                <li>• เกณฑ์ราคากลางระบบกล้องโทรทัศน์วงจรปิด (CCTV) กระทรวงดิจิทัลฯ (MDES ฉบับปรับปรุง ธ.ค. 2568 Onvif Profile S & NTP)</li>
                <li>• เกณฑ์ราคากลางการจัดหาอุปกรณ์และระบบคอมพิวเตอร์ กระทรวงดิจิทัลฯ (MDES ประกาศ ณ 1 ธ.ค. 2568)</li>
                <li>• พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (PAdES-LTV / RFC 3161)</li>
                <li>• พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA Masking)</li>
                <li>• ระบบยืนยันตัวตน 2 ชั้น MOPH Health ID & Provider ID กระทรวงสาธารณสุข</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs mb-2">สถานะเซิร์ฟเวอร์ & สถาปัตยกรรม (System Info)</h4>
              <div className="text-[11px] space-y-1 text-slate-400">
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>เซิร์ฟเวอร์เป้าหมาย:</span>
                  <strong className="text-emerald-400 font-mono">MSI DGX (192.168.1.224:3080)</strong>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>เทคโนโลยี:</span>
                  <span className="text-slate-300">Next.js 15.5 • PostgreSQL 15</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>สถานะการให้บริการ:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Online 24/7 (systemd)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
            ระบบงานบริหารจัดการสถานพยาบาลภาครัฐ สงวนลิขสิทธิ์ตามกฎหมาย • ข้อมูลปลอดภัยด้วย Cryptographic SHA-256 Hash Chaining
          </div>
        </footer>

        {/* HOS-AI Executive Copilot & Watchdog (On-Premises Local LLM) */}
        <HospitalAiCopilot />
      </body>
    </html>
  );
}
