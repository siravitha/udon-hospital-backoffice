import { loadStore } from "./store";
import { getChartOfAccounts, getJournalEntries, getTrialBalance } from "./accounting";
import { getVendors } from "./vendors";

export interface Skr1Row {
  seq: number;
  projectNo: string;
  projectName: string;
  budgetAmount: number;
  medianPrice: number;
  procurementMethod: string;
  bidders: { name: string; price: number }[];
  awardedWinner: string;
  awardedPrice: number;
  savings: number;
  selectionReason: string;
  contractDate: string;
}

export interface ApAgingRow {
  vendorCode: string;
  vendorName: string;
  taxId: string;
  totalPayable: number;
  current0to30: number;
  past31to60: number;
  past61to90: number;
  over90Days: number;
  creditTermDays: number;
  status: "NORMAL" | "OVERDUE" | "CRITICAL";
}

export interface WhtPnd53Row {
  seq: number;
  paymentDate: string;
  voucherNo: string;
  vendorName: string;
  vendorTaxId: string;
  incomeDescription: string;
  grossAmount: number;
  whtRatePct: number;
  whtDeducted: number;
  isGpoExempt: boolean;
}

export interface FefoNearExpiryRow {
  itemCode: string;
  itemName: string;
  genericName: string;
  category: string;
  lotNo: string;
  expiryDate: string;
  daysRemaining: number;
  remainingQty: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  location: string;
  riskStatus: "CRITICAL_3M" | "WARNING_6M" | "NORMAL_12M";
}

export interface AnomalyReportRow {
  alertId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  category: "SPLIT_PROCUREMENT" | "NLEM_OVERPRICE" | "COI_COMMITTEE" | "BUDGET_OVERRUN";
  title: string;
  description: string;
  involvedEntity: string;
  amount: number;
  detectedAt: string;
  recommendedAction: string;
}

export function getHospitalReports() {
  const state = loadStore() as any;
  const vendors = getVendors();

  // 1. สขร. 1
  const skr1: Skr1Row[] = [
    {
      seq: 1,
      projectNo: "PR-10671-2569-0001",
      projectName: "ซื้อยาปฏิชีวนะ Meropenem 1g Injection จำนวน 5,000 ไวอัล",
      budgetAmount: 1200000.0,
      medianPrice: 1100000.0,
      procurementMethod: "เฉพาะเจาะจง (ม.56(2)(ข))",
      bidders: [
        { name: "บริษัท สยามไบโอไซเอนซ์ จำกัด", price: 1070000.0 },
        { name: "บริษัท กรุงเทพดรั๊ก จำกัด", price: 1150000.0 },
      ],
      awardedWinner: "บริษัท สยามไบโอไซเอนซ์ จำกัด",
      awardedPrice: 1070000.0,
      savings: 30000.0,
      selectionReason: "มีคุณสมบัติถูกต้องครบถ้วนและเสนอราคาต่ำสุดตามเกณฑ์ราคากลาง NLEM",
      contractDate: "2026-10-10",
    },
    {
      seq: 2,
      projectNo: "PR-10671-2569-0002",
      projectName: "ซื้อยาน้ำเชื่อม Paracetamol Syrup 60ml จำนวน 2,000 ขวด",
      budgetAmount: 150000.0,
      medianPrice: 130000.0,
      procurementMethod: "สิทธิพิเศษองค์การเภสัชกรรม (GPO)",
      bidders: [
        { name: "องค์การเภสัชกรรม (GPO)", price: 120000.0 },
      ],
      awardedWinner: "องค์การเภสัชกรรม (GPO)",
      awardedPrice: 120000.0,
      savings: 10000.0,
      selectionReason: "จัดซื้อตามสิทธิพิเศษหน่วยงานของรัฐ กฎกระทรวงกำหนดพัสดุที่รัฐส่งเสริมฯ",
      contractDate: "2026-10-18",
    },
    {
      seq: 3,
      projectNo: "PR-10671-2569-0003",
      projectName: "ซื้อชุดตรวจวิเคราะห์ทางห้องปฏิบัติการ (Reagent Analyzer Service)",
      budgetAmount: 480000.0,
      medianPrice: 475000.0,
      procurementMethod: "เฉพาะเจาะจง (วงเงินไม่เกิน 5 แสนบาท)",
      bidders: [
        { name: "บริษัท เมดิคอล อีควิปเมนท์ แอนด์ เซอร์วิส จำกัด", price: 460000.0 },
      ],
      awardedWinner: "บริษัท เมดิคอล อีควิปเมนท์ แอนด์ เซอร์วิส จำกัด",
      awardedPrice: 460000.0,
      savings: 15000.0,
      selectionReason: "มีความพร้อมในการส่งมอบและมีมาตรฐานการสอบเทียบเครื่องมือแพทย์ตามเกณฑ์ HA",
      contractDate: "2026-10-25",
    },
  ];

  // 2. AP Aging
  const apAging: ApAgingRow[] = [
    {
      vendorCode: "GPO-0001",
      vendorName: "องค์การเภสัชกรรม (GPO)",
      taxId: "0994000164010",
      totalPayable: 8450000.0,
      current0to30: 5200000.0,
      past31to60: 2450000.0,
      past61to90: 800000.0,
      over90Days: 0.0,
      creditTermDays: 60,
      status: "NORMAL",
    },
    {
      vendorCode: "BIO-0003",
      vendorName: "บริษัท สยามไบโอไซเอนซ์ จำกัด",
      taxId: "0105552098761",
      totalPayable: 4200000.0,
      current0to30: 3100000.0,
      past31to60: 1100000.0,
      past61to90: 0.0,
      over90Days: 0.0,
      creditTermDays: 45,
      status: "NORMAL",
    },
    {
      vendorCode: "BKK-0004",
      vendorName: "บริษัท กรุงเทพดรั๊ก แอนด์ เมดิคอล ซัพพลาย จำกัด",
      taxId: "0105531023456",
      totalPayable: 2150000.0,
      current0to30: 850000.0,
      past31to60: 750000.0,
      past61to90: 550000.0,
      over90Days: 0.0,
      creditTermDays: 30,
      status: "OVERDUE",
    },
    {
      vendorCode: "MED-0005",
      vendorName: "บริษัท เมดิคอล อีควิปเมนท์ แอนด์ เซอร์วิส จำกัด",
      taxId: "0105548076543",
      totalPayable: 4100000.0,
      current0to30: 1200000.0,
      past31to60: 1500000.0,
      past61to90: 900000.0,
      over90Days: 500000.0,
      creditTermDays: 60,
      status: "CRITICAL",
    },
  ];

  // 3. WHT PND 53
  const whtList: WhtPnd53Row[] = [
    {
      seq: 1,
      paymentDate: "2026-10-15",
      voucherNo: "PV-10671-2569-0001",
      vendorName: "บริษัท สยามไบโอไซเอนซ์ จำกัด",
      vendorTaxId: "0105552098761",
      incomeDescription: "ค่าจัดซื้อยาปฏิชีวนะ Meropenem 1g Injection",
      grossAmount: 1000000.0,
      whtRatePct: 1,
      whtDeducted: 10000.0,
      isGpoExempt: false,
    },
    {
      seq: 2,
      paymentDate: "2026-10-28",
      voucherNo: "PV-10671-2569-0003",
      vendorName: "องค์การเภสัชกรรม (GPO)",
      vendorTaxId: "0994000164010",
      incomeDescription: "ค่าเวชภัณฑ์ผ่าตัดห้อง OR ประจำงวด",
      grossAmount: 120000.0,
      whtRatePct: 0,
      whtDeducted: 0.0,
      isGpoExempt: true,
    },
    {
      seq: 3,
      paymentDate: "2026-10-30",
      voucherNo: "PV-10671-2569-0004",
      vendorName: "บริษัท กรุงเทพดรั๊ก แอนด์ เมดิคอล ซัพพลาย จำกัด",
      vendorTaxId: "0105531023456",
      incomeDescription: "ค่าน้ำเกลือ Normal Saline 0.9% 1,000ml",
      grossAmount: 250000.0,
      whtRatePct: 1,
      whtDeducted: 2500.0,
      isGpoExempt: false,
    },
  ];

  // 4. FEFO Near Expiry
  const nearExpiry: FefoNearExpiryRow[] = [
    {
      itemCode: "MED-MER-001",
      itemName: "Meropenem 1g Powder for Injection",
      genericName: "Meropenem Trihydrate",
      category: "ยาปฏิชีวนะควบคุมพิเศษ",
      lotNo: "LOT-M2601",
      expiryDate: "2026-12-15",
      daysRemaining: 44,
      remainingQty: 320,
      unit: "Vial",
      unitCost: 214.0,
      totalValue: 68480.0,
      location: "คลังยากลาง (ชั้น 2 อาคารเภสัชกรรม)",
      riskStatus: "CRITICAL_3M",
    },
    {
      itemCode: "MED-VAC-002",
      itemName: "Influenza Vaccine (Quadrivalent)",
      genericName: "Inactivated Influenza Vaccine",
      category: "วัคซีนควบคุมความเย็น 2-8°C",
      lotNo: "LOT-V2608",
      expiryDate: "2027-02-28",
      daysRemaining: 119,
      remainingQty: 550,
      unit: "Dose",
      unitCost: 180.0,
      totalValue: 99000.0,
      location: "ตู้เย็นควบคุมความเย็นตู้ที่ 3 (Cold-Chain Room)",
      riskStatus: "WARNING_6M",
    },
    {
      itemCode: "MED-CEF-003",
      itemName: "Ceftriaxone 1g Injection",
      genericName: "Ceftriaxone Sodium",
      category: "ยาปฏิชีวนะกลุ่ม Cephalosporin",
      lotNo: "LOT-C2605",
      expiryDate: "2027-03-31",
      daysRemaining: 150,
      remainingQty: 1200,
      unit: "Vial",
      unitCost: 45.0,
      totalValue: 54000.0,
      location: "คลังยากลาง (ห้องยาควบคุม)",
      riskStatus: "WARNING_6M",
    },
    {
      itemCode: "MED-PAR-004",
      itemName: "Paracetamol 500mg Tablets",
      genericName: "Acetaminophen",
      category: "ยาสามัญประจำบ้าน",
      lotNo: "LOT-P2610",
      expiryDate: "2027-09-30",
      daysRemaining: 333,
      remainingQty: 50000,
      unit: "Tablet",
      unitCost: 0.35,
      totalValue: 17500.0,
      location: "คลังยาแห้ง (Shelf A-12)",
      riskStatus: "NORMAL_12M",
    },
  ];

  // 5. Anomaly Audit
  const anomalies: AnomalyReportRow[] = [
    {
      alertId: "ANM-2569-01",
      severity: "CRITICAL",
      category: "SPLIT_PROCUREMENT",
      title: "ตรวจพบธุรกรรมเข้าข่ายแบ่งซื้อแบ่งจ้าง (< 500,000 บาทซ้ำใน 30 วัน)",
      description: "แผนกศัลยกรรมเปิด PR จัดซื้อวัสดุเย็บแผล 485,000 บาท และ 492,000 บาท ห่างกันเพียง 12 วัน",
      involvedEntity: "แผนกศัลยกรรม (SURG) / บจก. เมดิคอล ซัพพลาย",
      amount: 977000.0,
      detectedAt: "2026-10-29T09:45:00Z",
      recommendedAction: "ส่งเรื่องให้คณะกรรมการตรวจสอบภายใน (Internal Audit) สอบสวนข้อเท็จจริงตามระเบียบฯ",
    },
    {
      alertId: "ANM-2569-02",
      severity: "HIGH",
      category: "NLEM_OVERPRICE",
      title: "ตรวจพบการขอซื้อยาสูงกว่าราคากลางยาแห่งชาติ (NLEM Cap)",
      description: "PR ขอซื้อยาปฏิชีวนะชนิดฉีดเสนอราคา 230.00 บาท/ไวอัล (ราคากลางประกาศ 214.00 บาท)",
      involvedEntity: "กลุ่มงานเภสัชกรรม (PHA)",
      amount: 230000.0,
      detectedAt: "2026-10-24T14:20:00Z",
      recommendedAction: "ระบบ Hard-Stop ระงับการอนุมัติ PR อัตโนมัติ บังคับให้ทำหนังสือชี้แจงเหตุผลความจำเป็น",
    },
    {
      alertId: "ANM-2569-03",
      severity: "MEDIUM",
      category: "COI_COMMITTEE",
      title: "แจ้งเตือนการแต่งตั้งกรรมการจัดหาและกรรมการตรวจรับบุคคลเดียวกัน",
      description: "นพ.วิชัย ได้รับการเสนอชื่อเป็นทั้งกรรมการพิจารณาผลและกรรมการตรวจรับพัสดุในโครงการเดียวกัน",
      involvedEntity: "โครงการซื้อเครื่องช่วยหายใจ ICU (PR-10671-2569-0008)",
      amount: 4500000.0,
      detectedAt: "2026-10-22T10:10:00Z",
      recommendedAction: "แจ้งเตือนเจ้าหน้าที่พัสดุให้เปลี่ยนรายชื่อกรรมการตาม พ.ร.บ. 2560 ม.100",
    },
  ];

  return {
    skr1,
    apAging,
    whtList,
    nearExpiry,
    anomalies,
  };
}

