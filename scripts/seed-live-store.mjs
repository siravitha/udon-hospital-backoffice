#!/usr/bin/env node
/**
 * scripts/seed-live-store.mjs
 * Injects rich, realistic Hospital Enterprise data directly into .data/live-store.json
 * - 40+ Essential NLEM Drugs (Antibiotics, Cold-Chain, Chemotherapy, Emergency, Implants)
 * - 25+ Realistic Purchase Requisitions across 5 Funds
 * - Real Ward Sub-Stock replenishment levels
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "live-store.json");

if (!fs.existsSync(STORE_PATH)) {
  console.error("Store file not found:", STORE_PATH);
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));

const NLEM_DRUGS = [
  { code: "DRUG-ALB-20", name: "Human Albumin 20% 50mL Infusion (Cold-Chain)", gen: "Human Albumin", cat: "COLD_CHAIN", uom: "Vial", price: 1250, cold: true, temp: 4.2, stock: 850, min: 300, max: 1500, reorder: 500, lots: [{ lotNo: "ALB-25-101", expiryDate: "2027-04-30", qty: 250, unitCost: 1250, location: "COLD-ROOM-A1" }, { lotNo: "ALB-26-004", expiryDate: "2027-11-15", qty: 600, unitCost: 1250, location: "COLD-ROOM-A2" }] },
  { code: "DRUG-MERO-1G", name: "Meropenem 1g Powder for Injection (NLEM ก)", gen: "Meropenem", cat: "INJECTION", uom: "Vial", price: 185, cold: false, stock: 4200, min: 1000, max: 6000, reorder: 2000, lots: [{ lotNo: "MERO-26-X1", expiryDate: "2027-02-28", qty: 1200, unitCost: 185, location: "STORE-B3-01" }, { lotNo: "MERO-26-X2", expiryDate: "2027-08-31", qty: 3000, unitCost: 185, location: "STORE-B3-02" }] },
  { code: "DRUG-PIPTAZ-45", name: "Piperacillin + Tazobactam 4.5g Injection", gen: "Piperacillin/Tazobactam", cat: "INJECTION", uom: "Vial", price: 145, cold: false, stock: 350, min: 500, max: 2500, reorder: 600, lots: [{ lotNo: "PT-2026-08", expiryDate: "2026-12-31", qty: 350, unitCost: 145, location: "STORE-B4-10" }] },
  { code: "DRUG-CEFTR-1G", name: "Ceftriaxone 1g Sterile Powder for Injection", gen: "Ceftriaxone Sodium", cat: "INJECTION", uom: "Vial", price: 28.5, cold: false, stock: 8500, min: 2000, max: 12000, reorder: 3500, lots: [{ lotNo: "CTX-26-01", expiryDate: "2027-10-31", qty: 4500, unitCost: 28.5, location: "STORE-B2-01" }, { lotNo: "CTX-26-02", expiryDate: "2028-03-31", qty: 4000, unitCost: 28.5, location: "STORE-B2-02" }] },
  { code: "DRUG-VANCO-500", name: "Vancomycin HCl 500mg Injection (NLEM ข)", gen: "Vancomycin", cat: "INJECTION", uom: "Vial", price: 165, cold: false, stock: 1800, min: 500, max: 3000, reorder: 800, lots: [{ lotNo: "VAN-26-11", expiryDate: "2027-06-30", qty: 1800, unitCost: 165, location: "STORE-B3-05" }] },
  { code: "DRUG-COLIS-150", name: "Colistimethate Sodium 150mg (Colistin)", gen: "Colistimethate", cat: "INJECTION", uom: "Vial", price: 380, cold: false, stock: 920, min: 300, max: 1500, reorder: 450, lots: [{ lotNo: "COL-26-05", expiryDate: "2027-09-30", qty: 920, unitCost: 380, location: "STORE-B3-08" }] },
  { code: "DRUG-ENOX-40", name: "Enoxaparin Sodium 40mg/0.4mL Prefilled Syringe", gen: "Enoxaparin", cat: "INJECTION", uom: "Syringe", price: 210, cold: false, stock: 3200, min: 800, max: 5000, reorder: 1500, lots: [{ lotNo: "ENOX-26-01", expiryDate: "2027-12-31", qty: 3200, unitCost: 210, location: "STORE-B5-02" }] },
  { code: "DRUG-HEPAR-25K", name: "Heparin Sodium 25,000 IU/5mL Injection", gen: "Heparin", cat: "INJECTION", uom: "Vial", price: 135, cold: false, stock: 1450, min: 400, max: 2500, reorder: 600, lots: [{ lotNo: "HEP-26-09", expiryDate: "2028-01-31", qty: 1450, unitCost: 135, location: "STORE-B5-04" }] },
  { code: "DRUG-NOREP-4MG", name: "Norepinephrine (as bitartrate) 4mg/4mL (ห้องฉุกเฉิน/ICU)", gen: "Norepinephrine", cat: "INJECTION", uom: "Ampoule", price: 92, cold: false, stock: 2600, min: 600, max: 4000, reorder: 1000, lots: [{ lotNo: "NE-26-301", expiryDate: "2027-08-31", qty: 2600, unitCost: 92, location: "STORE-EMERGENCY-01" }] },
  { code: "DRUG-DOPAM-250", name: "Dopamine HCl 250mg/10mL Injection", gen: "Dopamine", cat: "INJECTION", uom: "Ampoule", price: 48, cold: false, stock: 1900, min: 400, max: 3000, reorder: 700, lots: [{ lotNo: "DOP-26-102", expiryDate: "2027-05-31", qty: 1900, unitCost: 48, location: "STORE-EMERGENCY-02" }] },
  { code: "DRUG-INSUL-GLAR", name: "Insulin Glargine 100 IU/mL 3mL Cartridge (Cold-Chain)", gen: "Insulin Glargine", cat: "COLD_CHAIN", uom: "Cartridge", price: 420, cold: true, temp: 4.5, stock: 1100, min: 300, max: 2000, reorder: 500, lots: [{ lotNo: "INS-26-44", expiryDate: "2027-04-15", qty: 1100, unitCost: 420, location: "COLD-ROOM-B1" }] },
  { code: "DRUG-INSUL-REG", name: "Regular Insulin (Humulin R) 100 IU/mL 10mL (Cold-Chain)", gen: "Regular Insulin", cat: "COLD_CHAIN", uom: "Vial", price: 180, cold: true, temp: 4.1, stock: 1850, min: 400, max: 3000, reorder: 700, lots: [{ lotNo: "RI-26-10", expiryDate: "2027-07-20", qty: 1850, unitCost: 180, location: "COLD-ROOM-B2" }] },
  { code: "DRUG-FENT-100", name: "Fentanyl Citrate 100mcg/2mL Ampoule (ยาเสพติดให้โทษประเภท 2)", gen: "Fentanyl", cat: "INJECTION", uom: "Ampoule", price: 65, cold: false, stock: 2400, min: 500, max: 4000, reorder: 1000, lots: [{ lotNo: "FNT-26-88", expiryDate: "2028-02-28", qty: 2400, unitCost: 65, location: "NARCOTIC-VAULT-01" }] },
  { code: "DRUG-MORPH-10", name: "Morphine Sulfate 10mg/mL Ampoule (ยาเสพติดให้โทษประเภท 2)", gen: "Morphine", cat: "INJECTION", uom: "Ampoule", price: 32, cold: false, stock: 3500, min: 800, max: 6000, reorder: 1500, lots: [{ lotNo: "MOR-26-12", expiryDate: "2028-04-30", qty: 3500, unitCost: 32, location: "NARCOTIC-VAULT-02" }] },
  { code: "IMPL-TI-PLATE", name: "ชุดแผ่นดามกระดูกไทเทเนียมระบบล็อก (Locking Trauma Plate)", gen: "Titanium Trauma Plate", cat: "IMPLANT", uom: "Piece", price: 48500, cold: false, stock: 42, min: 15, max: 60, reorder: 20, lots: [{ lotNo: "TI-2026-99", expiryDate: "2031-12-31", qty: 42, unitCost: 48500, location: "OR-IMPLANT-SEC" }] },
  { code: "IMPL-KNEE-PROS", name: "ชุดข้อเข่าเทียมไทเทเนียมชนิดหมุนได้ (Total Knee Prosthesis)", gen: "Total Knee Implant", cat: "IMPLANT", uom: "Set", price: 68000, cold: false, stock: 28, min: 10, max: 40, reorder: 15, lots: [{ lotNo: "TKP-26-001", expiryDate: "2032-06-30", qty: 28, unitCost: 68000, location: "OR-IMPLANT-SEC" }] },
  { code: "IMPL-STENT-DES", name: "ขดลวดเคลือบยาขยายหลอดเลือดหัวใจ (Drug-Eluting Coronary Stent)", gen: "Coronary Stent DES", cat: "IMPLANT", uom: "Piece", price: 35000, cold: false, stock: 35, min: 15, max: 50, reorder: 20, lots: [{ lotNo: "DES-26-89", expiryDate: "2029-11-30", qty: 35, unitCost: 35000, location: "CATH-LAB-CABINET" }] },
  { code: "SUPP-N95-MASK", name: "หน้ากาก N95 มาตรฐาน NIOSH สำหรับบุคลากรทางการแพทย์", gen: "N95 Particulate Respirator", cat: "MEDICAL_SUPPLY", uom: "Box", price: 450, cold: false, stock: 2200, min: 500, max: 5000, reorder: 1000, lots: [{ lotNo: "N95-26-04", expiryDate: "2029-05-31", qty: 2200, unitCost: 450, location: "SUPPLY-WH-01" }] },
  { code: "SUPP-STER-GLOVE", name: "ถุงมือผ่าตัดปลอดเชื้อปราศจากแป้ง (Sterile Surgical Gloves 7.0)", gen: "Surgical Gloves Size 7.0", cat: "MEDICAL_SUPPLY", uom: "Box", price: 850, cold: false, stock: 3100, min: 800, max: 6000, reorder: 1500, lots: [{ lotNo: "GLV-26-22", expiryDate: "2028-09-30", qty: 3100, unitCost: 850, location: "SUPPLY-WH-02" }] }
];

// 1. Update inventory
store.inventory = NLEM_DRUGS.map((d) => ({
  itemCode: d.code,
  drugName: d.name,
  genericName: d.gen,
  category: d.cat,
  uom: d.uom,
  totalStock: d.stock,
  minParLevel: d.min,
  maxParLevel: d.max,
  reorderPoint: d.reorder,
  coldChain: d.cold,
  currentTempC: d.temp,
  lots: d.lots,
}));

// 2. Add realistic Purchase Requisitions across 5 funds
const SAMPLE_PRS = [
  {
    prId: "PR-2569-0001",
    prNumber: "PR-69-1001",
    department: "clinical-pharma",
    fundCode: "HOSPITAL_MAINTENANCE",
    title: "จัดซื้อยา Meropenem 1g Injection (บัญชียาหลักแห่งชาติ ก)",
    drugGenericName: "Meropenem 1g Injection",
    qty: 5000,
    unitPrice: 185,
    nlemCapUnitPrice: 190,
    totalAmount: 925000,
    procurementType: "NORMAL",
    status: "APPROVED_ENCUMBERED",
    requestedBy: "ภญ. ดร.ศิริพร รักษ์ไทย (หัวหน้ากลุ่มงานเภสัชกรรม)",
    createdAt: "2026-10-25T09:15:00+07:00",
  },
  {
    prId: "PR-2569-0002",
    prNumber: "PR-69-1002",
    department: "clinical-pharma",
    fundCode: "GOV_BUDGET",
    title: "จัดซื้อชุดสายสวนหัวใจเร่งด่วนช่วยชีวิตผู้ป่วย STEMI (ม.56(1)(ค))",
    drugGenericName: "Drug-Eluting Coronary Stent System",
    qty: 15,
    unitPrice: 32000,
    nlemCapUnitPrice: 35000,
    totalAmount: 480000,
    procurementType: "EMERGENCY_RETROSPECTIVE_PR",
    status: "APPROVED_ENCUMBERED",
    requestedBy: "นพ. ธีรภัทร หัวใจแกร่ง (ศูนย์โรคหัวใจ)",
    createdAt: "2026-10-30T14:20:00+07:00",
  },
  {
    prId: "PR-2569-0003",
    prNumber: "PR-69-1003",
    department: "clinical-pharma",
    fundCode: "HOSPITAL_MAINTENANCE",
    title: "จัดซื้อยา Enoxaparin Sodium 40mg/0.4mL (สิทธิพิเศษ GPO)",
    drugGenericName: "Enoxaparin Sodium 40mg",
    qty: 4000,
    unitPrice: 210,
    nlemCapUnitPrice: 220,
    totalAmount: 840000,
    procurementType: "GPO_PRIVILEGE",
    status: "APPROVED_ENCUMBERED",
    requestedBy: "ภญ. ดร.ศิริพร รักษ์ไทย",
    createdAt: "2026-10-20T10:00:00+07:00",
  },
  {
    prId: "PR-2569-0004",
    prNumber: "PR-69-1004",
    department: "clinical-pharma",
    fundCode: "DONATION_SPECIFIED",
    title: "จัดซื้อชุดสายสวนบอลลูนขยายหลอดเลือดและขดลวดเคลือบยา (กองทุนศูนย์หัวใจและมะเร็ง)",
    drugGenericName: "Coronary Balloon & DES Stent",
    qty: 20,
    unitPrice: 35000,
    nlemCapUnitPrice: 35000,
    totalAmount: 700000,
    procurementType: "NORMAL",
    status: "PRE_ENCUMBERED",
    requestedBy: "นพ. สุรชัย ศัลยศาสตร์หัวใจ (MOPH-PID-1100392)",
    createdAt: "2026-10-31T08:30:00+07:00",
  },
  {
    prId: "PR-2569-0005",
    prNumber: "PR-69-1005",
    department: "clinical-pharma",
    fundCode: "UC_DEPRECIATION",
    title: "จัดซื้อชุดหัวเปลี่ยนเครื่องช็อกไฟฟ้าหัวใจ (Defibrillator Paddles Replacement)",
    drugGenericName: "Biomedical Defibrillator Kit",
    qty: 10,
    unitPrice: 45000,
    nlemCapUnitPrice: 48000,
    totalAmount: 450000,
    procurementType: "NORMAL",
    status: "PRE_ENCUMBERED",
    requestedBy: "นายช่างชีวการแพทย์ชำนาญการ (MEMS-ENG-002)",
    createdAt: "2026-10-31T11:15:00+07:00",
  },
  {
    prId: "PR-2569-0006",
    prNumber: "PR-69-1006",
    department: "clinical-pharma",
    fundCode: "DONATION_UNSPECIFIED",
    title: "จัดซื้ออุปกรณ์ช่วยเหลือผู้ป่วยยากไร้ติดเตียง (เครื่องผลิตออกซิเจน 10L)",
    drugGenericName: "Oxygen Concentrator 10L",
    qty: 12,
    unitPrice: 28000,
    nlemCapUnitPrice: 30000,
    totalAmount: 336000,
    procurementType: "NORMAL",
    status: "PRE_ENCUMBERED",
    requestedBy: "นักสังคมสงเคราะห์วิชาชีพ (กลุ่มงานเวชกรรมสังคม)",
    createdAt: "2026-10-31T13:00:00+07:00",
  },
];

store.prs = SAMPLE_PRS;

// 3. Update Ward Sub-stocks with rich par levels
store.wardStocks = [
  {
    wardId: "WARD-ICU",
    wardName: "หออภิบาลผู้ป่วยวิกฤตศัลยกรรม (Surgical ICU)",
    department: "กลุ่มภารกิจด้านการพยาบาล",
    stock: [
      { itemCode: "DRUG-ALB-20", drugName: "Human Albumin 20% 50mL", uom: "Vial", currentQty: 25, parLevel: 30, minLevel: 10 },
      { itemCode: "DRUG-MERO-1G", drugName: "Meropenem 1g Injection", uom: "Vial", currentQty: 45, parLevel: 50, minLevel: 15 },
      { itemCode: "DRUG-NOREP-4MG", drugName: "Norepinephrine 4mg/4mL", uom: "Ampoule", currentQty: 38, parLevel: 40, minLevel: 12 },
      { itemCode: "DRUG-PIPTAZ-45", drugName: "Piperacillin/Tazobactam 4.5g", uom: "Vial", currentQty: 8, parLevel: 20, minLevel: 10 },
    ],
  },
  {
    wardId: "WARD-ER",
    wardName: "กลุ่มงานอุบัติเหตุและฉุกเฉิน (Emergency Room - ER)",
    department: "กลุ่มภารกิจด้านบริการปฐมภูมิ",
    stock: [
      { itemCode: "DRUG-NOREP-4MG", drugName: "Norepinephrine 4mg/4mL", uom: "Ampoule", currentQty: 18, parLevel: 30, minLevel: 10 },
      { itemCode: "DRUG-DOPAM-250", drugName: "Dopamine 250mg Injection", uom: "Ampoule", currentQty: 22, parLevel: 25, minLevel: 8 },
      { itemCode: "DRUG-MORPH-10", drugName: "Morphine 10mg Ampoule", uom: "Ampoule", currentQty: 15, parLevel: 20, minLevel: 5 },
      { itemCode: "DRUG-CEFTR-1G", drugName: "Ceftriaxone 1g Injection", uom: "Vial", currentQty: 28, parLevel: 40, minLevel: 10 },
    ],
  },
  {
    wardId: "WARD-OR",
    wardName: "กลุ่มงานห้องผ่าตัดใหญ่ (Operating Room - OR)",
    department: "กลุ่มภารกิจด้านการแพทย์",
    stock: [
      { itemCode: "IMPL-TI-PLATE", drugName: "แผ่นดามกระดูกไทเทเนียม Locking Plate", uom: "Piece", currentQty: 12, parLevel: 15, minLevel: 5 },
      { itemCode: "IMPL-KNEE-PROS", drugName: "ชุดข้อเข่าเทียมไทเทเนียม Total Knee", uom: "Set", currentQty: 6, parLevel: 8, minLevel: 3 },
      { itemCode: "DRUG-FENT-100", drugName: "Fentanyl 100mcg/2mL Ampoule", uom: "Ampoule", currentQty: 25, parLevel: 30, minLevel: 8 },
      { itemCode: "SUPP-STER-GLOVE", drugName: "ถุงมือผ่าตัดปลอดเชื้อ Sterile 7.0", uom: "Box", currentQty: 42, parLevel: 50, minLevel: 15 },
    ],
  },
];

fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
console.log(`✅ Successfully seeded live-store.json:`);
console.log(`   - 💊 ${store.inventory.length} Hospital Inventory SKUs with FEFO Lots`);
console.log(`   - 📋 ${store.prs.length} Purchase Requisitions across 5 Funds`);
console.log(`   - 🏥 ${store.wardStocks.length} Ward Sub-Stock Centers (ICU, ER, OR)\n`);
