import fs from "fs";
import path from "path";
import { createHash } from "crypto";

export type VendorCategory = "PRIVATE_CORP" | "GPO" | "GOV_AGENCY";

export function computeThreeWayMatch(input: {
  poAmountInclVat: number;
  inspectionAcceptedInclVat: number;
  invoiceAmountInclVat: number;
  vendorCategory: VendorCategory;
  penaltyAmount: number;
  hasCommitteeObjection?: boolean;
}) {
  const inclVat = Number(input.invoiceAmountInclVat.toFixed(2));
  const exVatBase = Number(((inclVat * 100) / 107).toFixed(2));
  const vat7Pct = Number((inclVat - exVatBase).toFixed(2));
  const isExempt = input.vendorCategory === "GPO" || input.vendorCategory === "GOV_AGENCY";
  const wht1Pct = isExempt ? 0 : Number((exVatBase * 0.01).toFixed(2));
  const penaltyDeducted = Number((input.penaltyAmount || 0).toFixed(2));
  const netPayable = Number((inclVat - wht1Pct - penaltyDeducted).toFixed(2));
  return {
    matched:
      input.poAmountInclVat === input.inspectionAcceptedInclVat &&
      input.inspectionAcceptedInclVat === input.invoiceAmountInclVat &&
      !input.hasCommitteeObjection,
    inclVat,
    exVatBase,
    vat7Pct,
    wht1Pct,
    whtExemptReason: isExempt ? `EXEMPT_${input.vendorCategory}` : null,
    penaltyDeducted,
    netPayable,
  };
}

export function evaluateStandstill(awardPublishedDate: string, currentDate: string, holidays: string[] = []) {
  const start = new Date(awardPublishedDate);
  const end = new Date(start.getTime() + 10 * 86400_000);
  const standstillEndsOn = end.toISOString().slice(0, 10);
  return {
    canSignContract: currentDate >= standstillEndsOn,
    standstillEndsOn,
    holidaysCounted: holidays.length,
  };
}

export interface FundBudgetRow {
  fundCode: "GOV_BUDGET" | "HOSPITAL_MAINTENANCE" | "DONATION_SPECIFIED" | "DONATION_UNSPECIFIED" | "UC_DEPRECIATION";
  fundName: string;
  fiscalYear: number;
  allocated: number;
  preEncumbered: number;
  encumbered: number;
  carryOverEncumbered: number;
  disbursed: number;
  donorObjective?: string;
}

export interface PurchaseRequisitionRow {
  prId: string;
  prNumber: string;
  department: string;
  fundCode: FundBudgetRow["fundCode"];
  title: string;
  drugGenericName?: string;
  qty: number;
  unitPrice: number;
  nlemCapUnitPrice: number;
  totalAmount: number;
  procurementType: "NORMAL" | "EMERGENCY_RETROSPECTIVE_PR" | "GPO_PRIVILEGE" | "BLANKET_CALL_OFF";
  status: "DRAFT" | "PRE_ENCUMBERED" | "APPROVED_ENCUMBERED" | "REJECTED";
  requestedBy: string;
  createdAt: string;
  emergencySlaDeadline?: string;
}

export interface BlanketContractRow {
  contractId: string;
  contractNo: string;
  vendorName: string;
  vendorCategory: VendorCategory;
  drugName: string;
  quotaCeilingAmt: number;
  quotaConsumedAmt: number;
  quotaRemainingAmt: number;
  awardPublishedDate: string;
  standstillReleased: boolean;
  standstillEndsOn: string;
  version: number;
}

export interface CallOffOrderRow {
  poId: string;
  poNumber: string;
  contractId: string;
  contractNo: string;
  amount: number;
  createdBy: string;
  createdAt: string;
}

export interface ConsignmentUsageRow {
  usageId: string;
  idempotencyKey: string;
  hisCaseRef: string;
  patientHnMasked: string;
  patientAnMasked: string;
  implantCode: string;
  implantName: string;
  serialNo: string;
  lotNo: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  autoPoNumber: string;
  surgeonProviderId: string;
  usedAt: string;
}

export interface InspectionRow {
  inspectionId: string;
  poNumber: string;
  drugName: string;
  lotNumber: string;
  expiryDate: string;
  coldChainTempC: number;
  coaVerified: boolean;
  fdaRegNo: string;
  committeeQuorumCount: number;
  objectionRaised: boolean;
  objectionReason?: string;
  inspectionDaysTaken: number;
  status: "ACCEPTED_PADES_SIGNED" | "SUSPENDED_BY_OBJECTION";
  createdAt: string;
}

export interface DisbursementVoucherRow {
  voucherId: string;
  voucherNo: string;
  poNumber: string;
  vendorName: string;
  vendorCategory: VendorCategory;
  fundCode: FundBudgetRow["fundCode"];
  invoiceInclVat: number;
  exVatBase: number;
  vat7Pct: number;
  wht1Pct: number;
  whtExemptReason: string | null;
  penaltyDeducted: number;
  netPayable: number;
  status: "PAID" | "HELD_BY_OBJECTION";
  createdAt: string;
}

export interface AuditLogRow {
  seq: number;
  logId: string;
  partitionYear: number;
  eventTime: string;
  actorUsername: string;
  actorRole: string;
  actionType: string;
  entityType: string;
  entityId: string;
  payloadSummary: string;
  prevHash: string;
  rowHash: string;
}

export interface InventoryLot {
  lotNo: string;
  expiryDate: string;
  qty: number;
  unitCost: number;
  location: string;
}

export interface CentralInventoryItem {
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

export interface WardStockItem {
  itemCode: string;
  drugName: string;
  uom: string;
  currentQty: number;
  parLevel: number;
  minLevel: number;
}

export interface WardSubStock {
  wardId: string;
  wardName: string;
  department: string;
  stock: WardStockItem[];
}

export interface WardRequisitionRow {
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

export interface AnnualBudgetProposal {
  proposalId: string;
  proposalNo: string;
  fiscalYear: number;
  departmentCode: string;
  departmentName: string;
  expenseCategory: "OPERATING" | "INVESTMENT_EQUIPMENT" | "BUILDING_CONSTRUCTION" | "DEPRECIATION_REPLACE";
  projectName: string;
  requestedAmount: number;
  previousYearActualAmount: number;
  justification: string;
  urgency: "NORMAL" | "HIGH" | "CRITICAL";
  status: "SUBMITTED" | "REVIEWING" | "APPROVED" | "REDUCED" | "REJECTED";
  approvedAmount?: number;
  submittedBy: string;
  reviewedBy?: string;
  reviewNotes?: string;
  submittedAt: string;
}

export interface MissionGroup {
  groupCode: string;
  groupNameTh: string;
  groupNameEn: string;
  displayOrder: number;
  isActive: boolean;
}

export interface HospitalDepartment {
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

export interface RunningNumberConfig {
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

export type PersonnelType =
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

export interface HospitalPersonnel {
  id: string;
  staffCode: string;
  citizenId: string;
  mophProviderId: string;
  titleTh: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  personnelType: PersonnelType;
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

export interface LiveStoreState {
  funds: FundBudgetRow[];
  prs: PurchaseRequisitionRow[];
  blanketContracts: BlanketContractRow[];
  callOffOrders: CallOffOrderRow[];
  consignments: ConsignmentUsageRow[];
  inspections: InspectionRow[];
  vouchers: DisbursementVoucherRow[];
  auditLogs: AuditLogRow[];
  holidays: string[];
  inventory?: CentralInventoryItem[];
  wardStocks?: WardSubStock[];
  requisitions?: WardRequisitionRow[];
  budgetProposals?: AnnualBudgetProposal[];
  missionGroups?: MissionGroup[];
  departments?: HospitalDepartment[];
  runningNumbers?: RunningNumberConfig[];
  personnel?: HospitalPersonnel[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "live-store.json");

export function computeAuditRowHash(
  prevHash: string,
  seq: number,
  eventTime: string,
  actorUsername: string,
  actionType: string,
  entityId: string,
  payloadSummary: string
): string {
  const canonical = `${prevHash}|${seq}|${eventTime}|${actorUsername}|${actionType}|${entityId}|${payloadSummary}`;
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function computeDailyMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return createHash("sha256").update("EMPTY_MERKLE_TREE").digest("hex");
  }
  let layer = [...hashes];
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : left;
      next.push(createHash("sha256").update(`${left}:${right}`).digest("hex"));
    }
    layer = next;
  }
  return layer[0];
}

export function maskPatientIdentifier(id: string, prefix = "HN"): string {
  const clean = id.replace(/[^0-9A-Za-z]/g, "");
  const tail = clean.slice(-2).padStart(2, "0");
  return `${prefix}-****-${tail}`;
}

function buildInitialSeedState(): LiveStoreState {
  const holidays = [
    "2026-01-01",
    "2026-03-03",
    "2026-04-06",
    "2026-04-13",
    "2026-04-14",
    "2026-04-15",
    "2026-05-04",
    "2026-06-03",
    "2026-07-28",
    "2026-08-12",
    "2026-10-13",
    "2026-10-23",
    "2026-12-07",
    "2026-12-10",
    "2026-12-31",
  ];

  const funds: FundBudgetRow[] = [
    {
      fundCode: "GOV_BUDGET",
      fundName: "1. งบประมาณแผ่นดิน (หมวดครุภัณฑ์การแพทย์และยาหลัก)",
      fiscalYear: 2569,
      allocated: 450_000_000,
      preEncumbered: 38_500_000,
      encumbered: 142_000_000,
      carryOverEncumbered: 24_000_000,
      disbursed: 195_500_000,
    },
    {
      fundCode: "HOSPITAL_MAINTENANCE",
      fundName: "2. เงินบำรุงโรงพยาบาล (UC / ประกันสังคม / จ่ายตรง)",
      fiscalYear: 2569,
      allocated: 1_200_000_000,
      preEncumbered: 95_000_000,
      encumbered: 380_000_000,
      carryOverEncumbered: 45_000_000,
      disbursed: 520_000_000,
    },
    {
      fundCode: "DONATION_SPECIFIED",
      fundName: "3.1 เงินบริจาคระบุวัตถุประสงค์ (ศูนย์หัวใจและมะเร็ง)",
      fiscalYear: 2569,
      allocated: 85_000_000,
      preEncumbered: 5_000_000,
      encumbered: 22_000_000,
      carryOverEncumbered: 3_000_000,
      disbursed: 31_000_000,
      donorObjective: "CARDIO_ONCOLOGY_ONLY",
    },
    {
      fundCode: "DONATION_UNSPECIFIED",
      fundName: "3.2 เงินบริจาคไม่ระบุวัตถุประสงค์",
      fiscalYear: 2569,
      allocated: 40_000_000,
      preEncumbered: 2_500_000,
      encumbered: 11_000_000,
      carryOverEncumbered: 1_500_000,
      disbursed: 16_000_000,
    },
    {
      fundCode: "UC_DEPRECIATION",
      fundName: "4. งบค่าเสื่อม สปสช. (ทดแทนครุภัณฑ์ทางการแพทย์)",
      fiscalYear: 2569,
      allocated: 65_000_000,
      preEncumbered: 6_200_000,
      encumbered: 19_800_000,
      carryOverEncumbered: 4_000_000,
      disbursed: 25_000_000,
    },
  ];

  const prs: PurchaseRequisitionRow[] = [
    {
      prId: "PR-2569-0001",
      prNumber: "PR-69-1001",
      department: "clinical-pharma",
      fundCode: "HOSPITAL_MAINTENANCE",
      title: "จัดซื้อยา Meropenem 1g Injection (บัญชียาหลักแห่งชาติ ก)",
      drugGenericName: "Meropenem 1g Injection",
      qty: 5000,
      unitPrice: 185.0,
      nlemCapUnitPrice: 190.0,
      totalAmount: 925_000.0,
      procurementType: "NORMAL",
      status: "PRE_ENCUMBERED",
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
      unitPrice: 32000.0,
      nlemCapUnitPrice: 35000.0,
      totalAmount: 480_000.0,
      procurementType: "EMERGENCY_RETROSPECTIVE_PR",
      status: "PRE_ENCUMBERED",
      requestedBy: "นพ. ธีรภัทร หัวใจแกร่ง (ศูนย์โรคหัวใจ)",
      createdAt: "2026-10-30T14:20:00+07:00",
      emergencySlaDeadline: "2026-11-06T16:30:00+07:00",
    },
    {
      prId: "PR-2569-0003",
      prNumber: "PR-69-1003",
      department: "clinical-pharma",
      fundCode: "HOSPITAL_MAINTENANCE",
      title: "จัดซื้อยา Enoxaparin Sodium 40mg/0.4mL (สิทธิพิเศษ GPO)",
      drugGenericName: "Enoxaparin Sodium 40mg",
      qty: 4000,
      unitPrice: 210.0,
      nlemCapUnitPrice: 220.0,
      totalAmount: 840_000.0,
      procurementType: "GPO_PRIVILEGE",
      status: "APPROVED_ENCUMBERED",
      requestedBy: "ภญ. ดร.ศิริพร รักษ์ไทย",
      createdAt: "2026-10-20T10:00:00+07:00",
    },
  ];

  const blanketContracts: BlanketContractRow[] = [
    {
      contractId: "PA-2569-01",
      contractNo: "PA-69/0042 (จะซื้อจะขายยา NLEM)",
      vendorName: "องค์การเภสัชกรรม (GPO)",
      vendorCategory: "GPO",
      drugName: "Ceftriaxone 1g Powder for Injection (NLEM)",
      quotaCeilingAmt: 12_000_000.0,
      quotaConsumedAmt: 4_800_000.0,
      quotaRemainingAmt: 7_200_000.0,
      awardPublishedDate: "2026-10-01",
      standstillReleased: true,
      standstillEndsOn: "2026-10-12",
      version: 3,
    },
    {
      contractId: "PA-2569-02",
      contractNo: "PA-69/0088 (น้ำยาตรวจวิเคราะห์อัตโนมัติ Reagent Rental)",
      vendorName: "บริษัท เมดิคอล ไดแอกโนสติกส์ จำกัด",
      vendorCategory: "PRIVATE_CORP",
      drugName: "High-Sensitivity Troponin-I Reagent Kit (พร้อมเครื่องฝากวาง)",
      quotaCeilingAmt: 8_500_000.0,
      quotaConsumedAmt: 2_125_000.0,
      quotaRemainingAmt: 6_375_000.0,
      awardPublishedDate: "2026-10-05",
      standstillReleased: true,
      standstillEndsOn: "2026-10-15",
      version: 2,
    },
  ];

  const callOffOrders: CallOffOrderRow[] = [
    {
      poId: "PO-CALL-001",
      poNumber: "PO-69-4012",
      contractId: "PA-2569-01",
      contractNo: "PA-69/0042 (จะซื้อจะขายยา NLEM)",
      amount: 1_200_000.0,
      createdBy: "เจ้าหน้าที่พัสดุ ชำนาญการ",
      createdAt: "2026-10-22T11:30:00+07:00",
    },
  ];

  const consignments: ConsignmentUsageRow[] = [
    {
      usageId: "OR-CON-001",
      idempotencyKey: "HIS-OR-20261028-0091",
      hisCaseRef: "OR-CASE-691028-09",
      patientHnMasked: "HN-****-84",
      patientAnMasked: "AN-****-21",
      implantCode: "ORTHO-TI-PLATE-09",
      implantName: "Titanium Locking Proximal Humerus Plate + Screws Set",
      serialNo: "SN-TI69-88412",
      lotNo: "LOT-2026-08A",
      qty: 1,
      unitPrice: 48_500.0,
      totalAmount: 48_500.0,
      autoPoNumber: "PO-OR-691028-01",
      surgeonProviderId: "MOPH-PID-1100499281",
      usedAt: "2026-10-28T16:45:00+07:00",
    },
  ];

  const inspections: InspectionRow[] = [
    {
      inspectionId: "INSP-2569-001",
      poNumber: "PO-69-3901 (Shared Fixture)",
      drugName: "Human Albumin 20% 50mL Infusion (Cold-Chain Controlled)",
      lotNumber: "ALB-2609-TH",
      expiryDate: "2028-09-30",
      coldChainTempC: 4.2,
      coaVerified: true,
      fdaRegNo: "1C 45/2564 (NC)",
      committeeQuorumCount: 3,
      objectionRaised: false,
      inspectionDaysTaken: 3,
      status: "ACCEPTED_PADES_SIGNED",
      createdAt: "2026-10-29T13:10:00+07:00",
    },
  ];

  // Shared Fixture: Incl-VAT 1,070,000.00 -> Ex-VAT 1,000,000.00 -> WHT 1% 10,000.00 -> Penalty 50,000.00 -> Net Payable 1,010,000.00
  const vouchers: DisbursementVoucherRow[] = [
    {
      voucherId: "DV-2569-0001",
      voucherNo: "DV-69-10001 (Shared Fixture)",
      poNumber: "PO-69-3901 (Shared Fixture)",
      vendorName: "บริษัท สยามเมดิคอล ซัพพลาย จำกัด (มหาชน)",
      vendorCategory: "PRIVATE_CORP",
      fundCode: "GOV_BUDGET",
      invoiceInclVat: 1_070_000.0,
      exVatBase: 1_000_000.0,
      vat7Pct: 70_000.0,
      wht1Pct: 10_000.0,
      whtExemptReason: null,
      penaltyDeducted: 50_000.0,
      netPayable: 1_010_000.0,
      status: "PAID",
      createdAt: "2026-10-30T15:00:00+07:00",
    },
  ];

  const rawLogs = [
    {
      eventTime: "2026-10-25T09:15:00+07:00",
      actorUsername: "pharma.siriporn",
      actorRole: "CLINICAL_PHARMA",
      actionType: "CREATE_PR_PRE_ENCUMBER",
      entityType: "PURCHASE_REQUISITION",
      entityId: "PR-69-1001",
      payloadSummary: "Created PR-69-1001 Meropenem 1g (925,000.00 THB) -> PRE_ENCUMBERED on HOSPITAL_MAINTENANCE",
    },
    {
      eventTime: "2026-10-28T16:45:00+07:00",
      actorUsername: "his.webhook.or",
      actorRole: "SYSTEM_HIS_BRIDGE",
      actionType: "OR_CONSIGNMENT_CONSUMED",
      entityType: "OR_CONSIGNMENT",
      entityId: "OR-CON-001",
      payloadSummary: "OR Consignment Titanium Plate used (HN-****-84) -> Auto PO-OR-691028-01 (48,500.00 THB)",
    },
    {
      eventTime: "2026-10-29T13:10:00+07:00",
      actorUsername: "insp.committee.quorum",
      actorRole: "INSPECTION_COMMITTEE",
      actionType: "PADES_LTV_INSPECTION_SIGN",
      entityType: "RECEIVING_INSPECTION",
      entityId: "INSP-2569-001",
      payloadSummary: "Signed PAdES-LTV quorum (3/3) Lot ALB-2609-TH ColdChain 4.2C COA Verified",
    },
    {
      eventTime: "2026-10-30T15:00:00+07:00",
      actorUsername: "finance.somchai",
      actorRole: "FINANCE_DISBURSEMENT",
      actionType: "THREE_WAY_MATCH_DISBURSE",
      entityType: "DISBURSEMENT_VOUCHER",
      entityId: "DV-2569-0001",
      payloadSummary: "Shared Fixture Paid: InclVAT=1070000.00 ExVAT=1000000.00 WHT=10000.00 Penalty=50000.00 NetPayable=1010000.00",
    },
  ];

  const auditLogs: AuditLogRow[] = [];
  let prevHash = "0".repeat(64);
  rawLogs.forEach((entry, idx) => {
    const seq = idx + 1;
    const rowHash = computeAuditRowHash(
      prevHash,
      seq,
      entry.eventTime,
      entry.actorUsername,
      entry.actionType,
      entry.entityId,
      entry.payloadSummary
    );
    auditLogs.push({
      seq,
      logId: `AUD-2026-${String(seq).padStart(4, "0")}`,
      partitionYear: 2026,
      ...entry,
      prevHash,
      rowHash,
    });
    prevHash = rowHash;
  });

  return {
    funds,
    prs,
    blanketContracts,
    callOffOrders,
    consignments,
    inspections,
    vouchers,
    auditLogs,
    holidays,
    inventory: buildDefaultInventory(),
    wardStocks: buildDefaultWardStocks(),
    requisitions: buildDefaultRequisitions(),
  };
}

export function buildDefaultInventory(): CentralInventoryItem[] {
  return [
    {
      itemCode: "DRUG-ALB-20",
      drugName: "Human Albumin 20% 50mL Infusion (Cold-Chain)",
      genericName: "Human Albumin",
      category: "COLD_CHAIN",
      uom: "Vial",
      totalStock: 850,
      minParLevel: 300,
      maxParLevel: 1500,
      reorderPoint: 500,
      coldChain: true,
      currentTempC: 4.2,
      lots: [
        { lotNo: "ALB-25-101", expiryDate: "2027-04-30", qty: 250, unitCost: 1250, location: "COLD-ROOM-A1" },
        { lotNo: "ALB-26-004", expiryDate: "2027-11-15", qty: 600, unitCost: 1250, location: "COLD-ROOM-A2" },
      ],
    },
    {
      itemCode: "DRUG-MERO-1G",
      drugName: "Meropenem 1g Powder for Injection (NLEM ก)",
      genericName: "Meropenem",
      category: "INJECTION",
      uom: "Vial",
      totalStock: 4200,
      minParLevel: 1000,
      maxParLevel: 6000,
      reorderPoint: 2000,
      coldChain: false,
      lots: [
        { lotNo: "MERO-2026-X1", expiryDate: "2027-02-28", qty: 1200, unitCost: 185, location: "STORE-B3-01" },
        { lotNo: "MERO-2026-X2", expiryDate: "2027-08-31", qty: 3000, unitCost: 185, location: "STORE-B3-02" },
      ],
    },
    {
      itemCode: "DRUG-PIPTAZ-45",
      drugName: "Piperacillin + Tazobactam 4.5g Injection",
      genericName: "Piperacillin/Tazobactam",
      category: "INJECTION",
      uom: "Vial",
      totalStock: 350,
      minParLevel: 500,
      maxParLevel: 2500,
      reorderPoint: 600,
      coldChain: false,
      lots: [
        { lotNo: "PT-2026-08", expiryDate: "2026-12-31", qty: 350, unitCost: 145, location: "STORE-B4-10" },
      ],
    },
    {
      itemCode: "IMPL-TI-PLATE",
      drugName: "ชุดแผ่นดามกระดูกไทเทเนียมระบบล็อก (Locking Trauma Plate)",
      genericName: "Titanium Trauma Plate",
      category: "IMPLANT",
      uom: "Piece",
      totalStock: 42,
      minParLevel: 15,
      maxParLevel: 60,
      reorderPoint: 20,
      coldChain: false,
      lots: [
        { lotNo: "TI-2026-99", expiryDate: "2031-12-31", qty: 42, unitCost: 48500, location: "OR-IMPLANT-SEC" },
      ],
    },
  ];
}

export function buildDefaultWardStocks(): WardSubStock[] {
  return [
    {
      wardId: "WARD-ICU",
      wardName: "หออภิบาลผู้ป่วยวิกฤตศัลยกรรม (Surgical ICU)",
      department: "กลุ่มภารกิจด้านการพยาบาล",
      stock: [
        { itemCode: "DRUG-ALB-20", drugName: "Human Albumin 20% 50mL", uom: "Vial", currentQty: 25, parLevel: 30, minLevel: 10 },
        { itemCode: "DRUG-MERO-1G", drugName: "Meropenem 1g Injection", uom: "Vial", currentQty: 45, parLevel: 50, minLevel: 15 },
        { itemCode: "DRUG-PIPTAZ-45", drugName: "Piperacillin/Tazobactam 4.5g", uom: "Vial", currentQty: 8, parLevel: 20, minLevel: 10 },
      ],
    },
    {
      wardId: "WARD-ER",
      wardName: "กลุ่มงานอุบัติเหตุและฉุกเฉิน (Emergency Room - ER)",
      department: "กลุ่มภารกิจด้านบริการปฐมภูมิ",
      stock: [
        { itemCode: "DRUG-ALB-20", drugName: "Human Albumin 20% 50mL", uom: "Vial", currentQty: 10, parLevel: 15, minLevel: 5 },
        { itemCode: "DRUG-MERO-1G", drugName: "Meropenem 1g Injection", uom: "Vial", currentQty: 30, parLevel: 30, minLevel: 10 },
        { itemCode: "DRUG-PIPTAZ-45", drugName: "Piperacillin/Tazobactam 4.5g", uom: "Vial", currentQty: 5, parLevel: 15, minLevel: 5 },
      ],
    },
    {
      wardId: "WARD-OR",
      wardName: "กลุ่มงานห้องผ่าตัดใหญ่ (Operating Room - OR)",
      department: "กลุ่มภารกิจด้านการแพทย์",
      stock: [
        { itemCode: "IMPL-TI-PLATE", drugName: "แผ่นดามกระดูกไทเทเนียม Locking Plate", uom: "Piece", currentQty: 12, parLevel: 15, minLevel: 5 },
        { itemCode: "DRUG-ALB-20", drugName: "Human Albumin 20% 50mL", uom: "Vial", currentQty: 18, parLevel: 20, minLevel: 5 },
      ],
    },
  ];
}

export function buildDefaultRequisitions(): WardRequisitionRow[] {
  return [
    {
      reqId: "REQ-2569-001",
      reqNo: "WR-69-0101",
      wardId: "WARD-ICU",
      wardName: "หออภิบาลผู้ป่วยวิกฤตศัลยกรรม (Surgical ICU)",
      itemCode: "DRUG-PIPTAZ-45",
      drugName: "Piperacillin + Tazobactam 4.5g Injection",
      requestedQty: 12,
      dispensedQty: 12,
      dispensedLots: [{ lotNo: "PT-2026-08", qty: 12 }],
      status: "DISPENSED",
      requestedBy: "พว. สมรักษ์ (พยาบาลหัวหน้าเวร ICU)",
      createdAt: "2026-10-31T14:30:00+07:00",
    },
  ];
}

export function buildDefaultBudgetProposals(): AnnualBudgetProposal[] {
  return [
    {
      proposalId: "PROP-2570-001",
      proposalNo: "BP-70-001",
      fiscalYear: 2570,
      departmentCode: "XRAY",
      departmentName: "กลุ่มงานรังสีวิทยา",
      expenseCategory: "INVESTMENT_EQUIPMENT",
      projectName: "โครงการจัดซื้อเครื่องเอกซเรย์คอมพิวเตอร์ความเร็วสูง CT Scanner 256 Slices ทดแทนเครื่องเดิม",
      requestedAmount: 45000000,
      previousYearActualAmount: 0,
      justification: "เครื่องเดิมอายุการใช้งานเกิน 12 ปี มีอัตราการชำรุดสูง รองรับผู้ป่วยโรคหลอดเลือดสมองเฉียบพลัน (Stroke Fast Track) ไม่ทันท่วงที",
      urgency: "CRITICAL",
      status: "SUBMITTED",
      submittedBy: "นพ. ชัยพร หัวหน้ากลุ่มงานรังสีวิทยา (MOPH-PID-2FA)",
      submittedAt: "2026-10-28T09:30:00+07:00",
    },
    {
      proposalId: "PROP-2570-002",
      proposalNo: "BP-70-002",
      fiscalYear: 2570,
      departmentCode: "SURG",
      departmentName: "กลุ่มภารกิจด้านการแพทย์ (ห้องผ่าตัด)",
      expenseCategory: "BUILDING_CONSTRUCTION",
      projectName: "โครงการปรับปรุงห้องผ่าตัดแรงดันบวกระบบไฮบริด (Hybrid Modular OR) เพื่อการผ่าตัดหลอดเลือดหัวใจขั้นสูง",
      requestedAmount: 28000000,
      previousYearActualAmount: 0,
      justification: "ยกระดับมาตรฐานห้องผ่าตัดสู่ศูนย์ความเป็นเลิศด้านหัวใจและหลอดเลือดระดับตติยภูมิขั้นสูง รองรับเคสผ่าตัดเปิดหัวใจ 800 ราย/ปี",
      urgency: "HIGH",
      status: "REVIEWING",
      submittedBy: "นพ. วิทยา หัวหน้ากลุ่มงานศัลยศาสตร์",
      submittedAt: "2026-10-29T11:00:00+07:00",
    },
    {
      proposalId: "PROP-2570-003",
      proposalNo: "BP-70-003",
      fiscalYear: 2570,
      departmentCode: "PHARMA",
      departmentName: "กลุ่มงานเภสัชกรรม",
      expenseCategory: "OPERATING",
      projectName: "งบดำเนินงานจัดหายาและเวชภัณฑ์สิ้นเปลืองตามบัญชียาหลักแห่งชาติ ประจำปีงบประมาณ 2570",
      requestedAmount: 185000000,
      previousYearActualAmount: 172000000,
      justification: "รองรับจำนวนผู้ป่วยนอกและผู้ป่วยในสิทธิบัตรทองและประกันสังคมที่เพิ่มขึ้นร้อยละ 7.5 ตามสถิติปีงบประมาณ 2569",
      urgency: "NORMAL",
      status: "APPROVED",
      approvedAmount: 180000000,
      submittedBy: "ภญ. ดร.ศิริพร รักษ์ไทย (หัวหน้ากลุ่มงานเภสัชกรรม)",
      reviewedBy: "คณะกรรมการกลั่นกรองงบประมาณโรงพยาบาล",
      reviewNotes: "เห็นควรอนุมัติในวงเงิน 180,000,000 บาท ตามกรอบเงินบำรุงที่คาดว่าจะจัดเก็บได้",
      submittedAt: "2026-10-25T14:00:00+07:00",
    },
    {
      proposalId: "PROP-2570-004",
      proposalNo: "BP-70-004",
      fiscalYear: 2570,
      departmentCode: "HEMODIALYSIS",
      departmentName: "ศูนย์ไตเทียมและไตวายเรื้อรัง",
      expenseCategory: "DEPRECIATION_REPLACE",
      projectName: "โครงการจัดซื้อเครื่องไตเทียมประสิทธิภาพสูง (High-Flux Hemodialysis) 10 เครื่อง",
      requestedAmount: 8500000,
      previousYearActualAmount: 7200000,
      justification: "ทดแทนเครื่องเดิมที่ครบกำหนดปลดระวางตามเกณฑ์งบค่าเสื่อม สปสช. เพื่อความปลอดภัยของผู้ป่วยล้างไตสิทธิ UC",
      urgency: "HIGH",
      status: "SUBMITTED",
      submittedBy: "พว. นงลักษณ์ หัวหน้าศูนย์ไตเทียม",
      submittedAt: "2026-10-30T10:15:00+07:00",
    },
  ];
}

export function formatRunningNumberSample(rule: {
  prefix: string;
  formatPattern: string;
  yearType: string;
  paddingDigits: number;
  currentNumber: number;
}, depCode = "MED"): string {
  const beYear4 = 2569;
  const beYear2 = "69";
  const adYear4 = "2026";
  const adYear2 = "26";
  let yearStr = String(beYear4);
  if (rule.yearType === "BE_2") yearStr = beYear2;
  else if (rule.yearType === "AD_4") yearStr = adYear4;
  else if (rule.yearType === "AD_2") yearStr = adYear2;

  const nextNum = (rule.currentNumber || 0) + 1;
  const numStr = String(nextNum).padStart(rule.paddingDigits || 5, "0");

  let pattern = rule.formatPattern || "{PREFIX}-{YEAR}-{NUM}";
  return pattern
    .replace("{PREFIX}", rule.prefix || "DOC")
    .replace("{YEAR}", yearStr)
    .replace("{DEP}", depCode)
    .replace("{NUM}", numStr);
}

export function buildDefaultMissionGroups(): MissionGroup[] {
  return [
    { groupCode: "MED", groupNameTh: "กลุ่มภารกิจด้านการแพทย์", groupNameEn: "Medical Services Mission", displayOrder: 1, isActive: true },
    { groupCode: "NURSE", groupNameTh: "กลุ่มภารกิจด้านการพยาบาล", groupNameEn: "Nursing Services Mission", displayOrder: 2, isActive: true },
    { groupCode: "PHARMA", groupNameTh: "กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค", groupNameEn: "Pharmacy & Consumer Protection", displayOrder: 3, isActive: true },
    { groupCode: "TECH_MED", groupNameTh: "กลุ่มภารกิจด้านบริการทางการแพทย์ขั้นสูงและรังสี", groupNameEn: "Advanced Medical Tech & Imaging", displayOrder: 4, isActive: true },
    { groupCode: "PRIMARY", groupNameTh: "กลุ่มภารกิจด้านบริการปฐมภูมิและเวชกรรมสังคม", groupNameEn: "Primary Care & Social Medicine", displayOrder: 5, isActive: true },
    { groupCode: "ADMIN", groupNameTh: "กลุ่มภารกิจด้านอำนวยการและยุทธศาสตร์", groupNameEn: "Administrative & Strategy Mission", displayOrder: 6, isActive: true },
    { groupCode: "ENG", groupNameTh: "กลุ่มงานวิศวกรรมการแพทย์และกายภาพ", groupNameEn: "Biomedical & Facilities Engineering", displayOrder: 7, isActive: true },
  ];
}

export function buildDefaultDepartments(): HospitalDepartment[] {
  return [
    {
      departmentCode: "DEP-MED-OPD",
      groupCode: "MED",
      departmentNameTh: "แผนกตรวจโรคผู้ป่วยนอกอายุรกรรม (OPD Med)",
      departmentNameEn: "Outpatient Internal Medicine",
      costCenterCode: "CC-10671-101",
      headName: "นพ. วิศรุต วัฒนเวชากุล",
      telephone: "042-245555 ต่อ 1101",
      locationBuilding: "อาคารผู้ป่วยนอกและอำนวยการ",
      floorNumber: "ชั้น 2",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-SURG-OR",
      groupCode: "MED",
      departmentNameTh: "ศูนย์ห้องผ่าตัดกลาง (Central OR Suite)",
      departmentNameEn: "Central Operating Rooms",
      costCenterCode: "CC-10671-102",
      headName: "พญ. พรพิมล อริยสัจจะ",
      telephone: "042-245555 ต่อ 1201",
      locationBuilding: "อาคารศัลยกรรม 9 ชั้น",
      floorNumber: "ชั้น 4",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-ER-TRAUMA",
      groupCode: "MED",
      departmentNameTh: "ศูนย์อุบัติเหตุและฉุกเฉินระดับ 1 (Level 1 Trauma ER)",
      departmentNameEn: "Emergency & Trauma Center",
      costCenterCode: "CC-10671-103",
      headName: "นพ. กิตติภพ เตชะมนต์",
      telephone: "042-245555 ต่อ 1999",
      locationBuilding: "อาคารเฉลิมพระเกียรติ",
      floorNumber: "ชั้น 1",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-ORTHO",
      groupCode: "MED",
      departmentNameTh: "กลุ่มงานศัลยกรรมออร์โธปิดิกส์ (กระดูกและข้อ)",
      departmentNameEn: "Orthopedics Surgery Division",
      costCenterCode: "CC-10671-104",
      headName: "นพ. ธีรยุทธ ประสิทธิ์เวช",
      telephone: "042-245555 ต่อ 1140",
      locationBuilding: "อาคารศัลยกรรม 9 ชั้น",
      floorNumber: "ชั้น 5",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-PED",
      groupCode: "MED",
      departmentNameTh: "กลุ่มงานกุมารเวชกรรมและทารกแรกเกิด",
      departmentNameEn: "Pediatrics & Neonatology",
      costCenterCode: "CC-10671-105",
      headName: "พญ. วริศรา เมธาคุณ",
      telephone: "042-245555 ต่อ 1150",
      locationBuilding: "อาคารกุมารเวชกรรม",
      floorNumber: "ชั้น 3",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-OBGYN",
      groupCode: "MED",
      departmentNameTh: "กลุ่มงานสูติ-นรีเวชกรรมและวางแผนครอบครัว",
      departmentNameEn: "Obstetrics & Gynecology",
      costCenterCode: "CC-10671-106",
      headName: "นพ. สิทธิพงศ์ นันทิยานนท์",
      telephone: "042-245555 ต่อ 1160",
      locationBuilding: "อาคารเฉลิมพระเกียรติ",
      floorNumber: "ชั้น 2",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-ICU-MED",
      groupCode: "NURSE",
      departmentNameTh: "หออภิบาลผู้ป่วยหนักอายุรกรรม (Medical ICU)",
      departmentNameEn: "Medical Intensive Care Unit",
      costCenterCode: "CC-10671-201",
      headName: "พว. มัลลิกา เจริญกิจ (APN)",
      telephone: "042-245555 ต่อ 2101",
      locationBuilding: "อาคารเฉลิมพระเกียรติ",
      floorNumber: "ชั้น 3",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-ICU-SURG",
      groupCode: "NURSE",
      departmentNameTh: "หออภิบาลผู้ป่วยหนักศัลยกรรม (Surgical ICU)",
      departmentNameEn: "Surgical Intensive Care Unit",
      costCenterCode: "CC-10671-202",
      headName: "พว. จันทิมา บุญประเสริฐ",
      telephone: "042-245555 ต่อ 2201",
      locationBuilding: "อาคารศัลยกรรม 9 ชั้น",
      floorNumber: "ชั้น 3",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-PHARM-CENTRAL",
      groupCode: "PHARMA",
      departmentNameTh: "คลังยากลางและเวชภัณฑ์มิใช่ยา",
      departmentNameEn: "Central Pharmacy Stock & Supply",
      costCenterCode: "CC-10671-301",
      headName: "ภก. ชัยวัฒน์ เกียรติอนันต์",
      telephone: "042-245555 ต่อ 3101",
      locationBuilding: "อาคารคลังพัสดุและเภสัชกรรม",
      floorNumber: "ชั้น 1",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-PHARM-IPD",
      groupCode: "PHARMA",
      departmentNameTh: "ห้องจ่ายยาผู้ป่วยในและตู้ยาประจำวอร์ด",
      departmentNameEn: "Inpatient Dispensing & Ward Stocks",
      costCenterCode: "CC-10671-302",
      headName: "ภญ. รัตนาวลัย ทรัพย์มั่งมี",
      telephone: "042-245555 ต่อ 3201",
      locationBuilding: "อาคารเฉลิมพระเกียรติ",
      floorNumber: "ชั้น 1",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-XRAY-CT",
      groupCode: "TECH_MED",
      departmentNameTh: "กลุ่มงานรังสีวินิจฉัยและเอกซเรย์คอมพิวเตอร์ (CT/MRI)",
      departmentNameEn: "Diagnostic Radiology & CT/MRI",
      costCenterCode: "CC-10671-401",
      headName: "นพ. สุรเชษฐ์ เจษฎาภา",
      telephone: "042-245555 ต่อ 4101",
      locationBuilding: "อาคารรังสีรักษาและเวชศาสตร์นิวเคลียร์",
      floorNumber: "ชั้น 1",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-LAB-PATH",
      groupCode: "TECH_MED",
      departmentNameTh: "กลุ่มงานเทคนิคการแพทย์และพยาธิวิทยาคลินิก (Lab & Blood Bank)",
      departmentNameEn: "Clinical Pathology & Blood Bank",
      costCenterCode: "CC-10671-402",
      headName: "ทนพญ. นงนุช โสภณพนิช",
      telephone: "042-245555 ต่อ 4201",
      locationBuilding: "อาคารศูนย์การแพทย์ตติยภูมิ",
      floorNumber: "ชั้น 2",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-PRIMARY-SOC",
      groupCode: "PRIMARY",
      departmentNameTh: "กลุ่มงานเวชกรรมสังคมและบริการปฐมภูมิ",
      departmentNameEn: "Social Medicine & Primary Care",
      costCenterCode: "CC-10671-501",
      headName: "พญ. อรทัย ปัญญาสิริ",
      telephone: "042-245555 ต่อ 5101",
      locationBuilding: "ศูนย์สุขภาพชุมชนเมืองอุดรธานี",
      floorNumber: "ชั้น 1",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-DENT",
      groupCode: "PRIMARY",
      departmentNameTh: "กลุ่มงานทันตกรรมเฉพาะทาง",
      departmentNameEn: "Dental Specialties Division",
      costCenterCode: "CC-10671-502",
      headName: "ทพ. ภาคิน วราภรณ์",
      telephone: "042-245555 ต่อ 5201",
      locationBuilding: "อาคารทันตกรรม",
      floorNumber: "ชั้น 2",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-SUPPLY-PROC",
      groupCode: "ADMIN",
      departmentNameTh: "กลุ่มงานพัสดุและจัดซื้อจัดจ้างภาครัฐ",
      departmentNameEn: "Procurement & Supply Division",
      costCenterCode: "CC-10671-601",
      headName: "นางสมศรี รัตนเวโรจน์ (นวพ.ชำนาญการ)",
      telephone: "042-245555 ต่อ 6101",
      locationBuilding: "อาคารอำนวยการ",
      floorNumber: "ชั้น 2",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-FIN-DISB",
      groupCode: "ADMIN",
      departmentNameTh: "กลุ่มงานการเงินและเบิกจ่ายคลัง (3-Way Match)",
      departmentNameEn: "Finance & Disbursement Division",
      costCenterCode: "CC-10671-602",
      headName: "น.ส. นิตยา สิริโภคา (นวบ.ชำนาญการพิเศษ)",
      telephone: "042-245555 ต่อ 6201",
      locationBuilding: "อาคารอำนวยการ",
      floorNumber: "ชั้น 2",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-STRAT-PLAN",
      groupCode: "ADMIN",
      departmentNameTh: "กลุ่มงานยุทธศาสตร์และแผนงานพหุกองทุน",
      departmentNameEn: "Strategy & Multi-Fund Planning",
      costCenterCode: "CC-10671-603",
      headName: "ดร. ธนพล มโนรมย์",
      telephone: "042-245555 ต่อ 6301",
      locationBuilding: "อาคารอำนวยการ",
      floorNumber: "ชั้น 3",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-HR",
      groupCode: "ADMIN",
      departmentNameTh: "กลุ่มงานทรัพยากรบุคคลและสวัสดิการ",
      departmentNameEn: "Human Resources & Welfare",
      costCenterCode: "CC-10671-604",
      headName: "นายประวิทย์ สัจจาภิรมย์",
      telephone: "042-245555 ต่อ 6401",
      locationBuilding: "อาคารอำนวยการ",
      floorNumber: "ชั้น 3",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-ENG-BIOMED",
      groupCode: "ENG",
      departmentNameTh: "กลุ่มงานวิศวกรรมการแพทย์และบำรุงรักษาครุภัณฑ์",
      departmentNameEn: "Biomedical Engineering & Maintenance",
      costCenterCode: "CC-10671-701",
      headName: "วศ. เกรียงศักดิ์ วงศ์สวัสดิ์",
      telephone: "042-245555 ต่อ 7101",
      locationBuilding: "อาคารวิศวกรรมการแพทย์",
      floorNumber: "ชั้น 1",
      isProcurementAuthorized: true,
      isActive: true,
    },
    {
      departmentCode: "DEP-ENG-FACIL",
      groupCode: "ENG",
      departmentNameTh: "กลุ่มงานอาคารสถานที่ ยานพาหนะ และระบบสาธารณูปโภค",
      departmentNameEn: "Facilities & Hospital Transport",
      costCenterCode: "CC-10671-702",
      headName: "นายสมพร สถิตมั่นคง",
      telephone: "042-245555 ต่อ 7201",
      locationBuilding: "อาคารสนับสนุน",
      floorNumber: "ชั้น 1",
      isProcurementAuthorized: true,
      isActive: true,
    },
  ];
}

export function buildDefaultRunningNumbers(): RunningNumberConfig[] {
  const configs: Omit<RunningNumberConfig, "id" | "samplePreview">[] = [
    {
      docTypeCode: "PR",
      docTypeName: "ใบขอซื้อ/ขอจ้างยาและเวชภัณฑ์ (Purchase Requisition)",
      prefix: "PR",
      formatPattern: "{PREFIX}-{YEAR}-{DEP}-{NUM}",
      yearType: "BE_4",
      paddingDigits: 5,
      currentNumber: 128,
      resetPolicy: "YEARLY",
      lastResetFiscalYear: 2569,
      description: "ใบขอซื้อพัสดุ/ยาตามระเบียบคลัง แยกหมวดตามหน่วยเบิก เช่น PR-2569-MED-00129",
      isActive: true,
    },
    {
      docTypeCode: "PO",
      docTypeName: "ใบสั่งซื้อ/สั่งจ้างราชการ (Purchase Order)",
      prefix: "PO",
      formatPattern: "{PREFIX}-{YEAR}-{NUM}",
      yearType: "BE_4",
      paddingDigits: 5,
      currentNumber: 84,
      resetPolicy: "YEARLY",
      lastResetFiscalYear: 2569,
      description: "ใบสั่งซื้อพัสดุหรือยาที่ผ่านการอนุมัติวงเงินผูกพันจากผู้บริหาร เช่น PO-2569-00085",
      isActive: true,
    },
    {
      docTypeCode: "REQ",
      docTypeName: "ใบเบิกยาและเวชภัณฑ์คลังย่อยวอร์ด (Ward Requisition FEFO)",
      prefix: "REQ",
      formatPattern: "{PREFIX}-{YEAR}-{NUM}",
      yearType: "BE_4",
      paddingDigits: 5,
      currentNumber: 345,
      resetPolicy: "YEARLY",
      lastResetFiscalYear: 2569,
      description: "ใบเบิกยาจากตู้ยาวอร์ดเข้าคลังยากลางเพื่อตัดจ่ายตามเกณฑ์ FEFO เช่น REQ-2569-00346",
      isActive: true,
    },
    {
      docTypeCode: "BP",
      docTypeName: "คำของบประมาณรายจ่ายประจำปี (Annual Budget Proposal)",
      prefix: "BP",
      formatPattern: "{PREFIX}-{YEAR}-{NUM}",
      yearType: "BE_2",
      paddingDigits: 3,
      currentNumber: 4,
      resetPolicy: "YEARLY",
      lastResetFiscalYear: 2570,
      description: "คำขอตั้งงบประมาณรายจ่ายล่วงหน้าระดับกลุ่มภารกิจ เช่น BP-70-005",
      isActive: true,
    },
    {
      docTypeCode: "GRN",
      docTypeName: "ใบตรวจรับพัสดุและยาควบคุมความเย็น (Goods Receipt Note)",
      prefix: "GRN",
      formatPattern: "{PREFIX}-{YEAR}-{NUM}",
      yearType: "BE_4",
      paddingDigits: 5,
      currentNumber: 62,
      resetPolicy: "YEARLY",
      lastResetFiscalYear: 2569,
      description: "ใบตรวจรับพัสดุพร้อมแนบผลบันทึกอุณหภูมิ Cold-Chain เช่น GRN-2569-00063",
      isActive: true,
    },
    {
      docTypeCode: "PV",
      docTypeName: "ใบสำคัญจ่ายเงินและคำสั่งโอน GFMIS (Payment Voucher)",
      prefix: "PV",
      formatPattern: "{PREFIX}-{YEAR}-{NUM}",
      yearType: "BE_4",
      paddingDigits: 5,
      currentNumber: 51,
      resetPolicy: "YEARLY",
      lastResetFiscalYear: 2569,
      description: "ใบสำคัญจ่ายที่ผ่านการตรวจสอบ 3-Way Match และหักภาษี เช่น PV-2569-00052",
      isActive: true,
    },
    {
      docTypeCode: "CPO",
      docTypeName: "ใบสั่งซื้อเวชภัณฑ์ห้องผ่าตัดฝากขาย Auto-PO (Consignment PO)",
      prefix: "CPO",
      formatPattern: "{PREFIX}-{YEAR}-{NUM}",
      yearType: "BE_4",
      paddingDigits: 4,
      currentNumber: 19,
      resetPolicy: "YEARLY",
      lastResetFiscalYear: 2569,
      description: "ใบสั่งซื้อตัดยอดฝากขายอัตโนมัติสรุปสิ้นงวดของห้องผ่าตัด เช่น CPO-2569-0020",
      isActive: true,
    },
    {
      docTypeCode: "CN",
      docTypeName: "สัญญาจะซื้อจะขายและสัญญาจ้างมาตรฐาน (Contract Agreement)",
      prefix: "CN",
      formatPattern: "{PREFIX}-{YEAR}-{NUM}",
      yearType: "BE_4",
      paddingDigits: 4,
      currentNumber: 12,
      resetPolicy: "YEARLY",
      lastResetFiscalYear: 2569,
      description: "สัญญาจัดซื้อจัดจ้างที่ผ่านการตรวจสอบจากนิติกร เช่น CN-2569-0013",
      isActive: true,
    },
    {
      docTypeCode: "EMP",
      docTypeName: "รหัสประจำตัวบุคลากรโรงพยาบาล (Hospital Staff ID)",
      prefix: "EMP",
      formatPattern: "{PREFIX}-10671-{NUM}",
      yearType: "BE_4",
      paddingDigits: 4,
      currentNumber: 15,
      resetPolicy: "NEVER",
      lastResetFiscalYear: 2569,
      description: "รหัสประจำตัวข้าราชการ/พนักงานโรงพยาบาลอุดรธานี รันต่อเนื่องตลอดไป เช่น EMP-10671-0016",
      isActive: true,
    },
  ];

  return configs.map((c, idx) => ({
    id: `RUN-CFG-${c.docTypeCode}`,
    ...c,
    samplePreview: formatRunningNumberSample(c),
  }));
}

export function buildDefaultPersonnel(): HospitalPersonnel[] {
  return [
    {
      id: "STAFF-001",
      staffCode: "EMP-10671-0001",
      citizenId: "1100200345671",
      mophProviderId: "MOPH-10671-DIR01",
      titleTh: "พญ.",
      firstNameTh: "ศรีสุดา",
      lastNameTh: "ทรงธรรมวัฒน์",
      firstNameEn: "Srisuda",
      lastNameEn: "Songthamwat",
      personnelType: "EXECUTIVE",
      positionTitle: "ผู้อำนวยการโรงพยาบาลอุดรธานี (นายแพทย์ทรงคุณวุฒิ)",
      departmentCode: "DEP-STRAT-PLAN",
      departmentName: "กลุ่มงานยุทธศาสตร์และแผนงานพหุกองทุน",
      licenseNumber: "ว. 28941",
      email: "director@udonhospital.go.th",
      telephone: "042-245555 ต่อ 1001",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-002",
      staffCode: "EMP-10671-0002",
      citizenId: "1100200345672",
      mophProviderId: "MOPH-10671-MED01",
      titleTh: "นพ.",
      firstNameTh: "วิศรุต",
      lastNameTh: "วัฒนเวชากุล",
      firstNameEn: "Wisarut",
      lastNameEn: "Wattanavejakul",
      personnelType: "PHYSICIAN",
      positionTitle: "หัวหน้ากลุ่มภารกิจด้านการแพทย์ (นายแพทย์เชี่ยวชาญ)",
      departmentCode: "DEP-MED-OPD",
      departmentName: "แผนกตรวจโรคผู้ป่วยนอกอายุรกรรม (OPD Med)",
      licenseNumber: "ว. 34512",
      email: "wisarut.w@udonhospital.go.th",
      telephone: "042-245555 ต่อ 1101",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-003",
      staffCode: "EMP-10671-0003",
      citizenId: "1100200345673",
      mophProviderId: "MOPH-10671-SURG01",
      titleTh: "พญ.",
      firstNameTh: "พรพิมล",
      lastNameTh: "อริยสัจจะ",
      firstNameEn: "Pornpimon",
      lastNameEn: "Ariyasajja",
      personnelType: "PHYSICIAN",
      positionTitle: "หัวหน้าศูนย์ห้องผ่าตัดกลาง (ศัลยแพทย์ทรวงอก ชำนาญการพิเศษ)",
      departmentCode: "DEP-SURG-OR",
      departmentName: "ศูนย์ห้องผ่าตัดกลาง (Central OR Suite)",
      licenseNumber: "ว. 41209",
      email: "pornpimon.a@udonhospital.go.th",
      telephone: "042-245555 ต่อ 1201",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-004",
      staffCode: "EMP-10671-0004",
      citizenId: "1100200345674",
      mophProviderId: "MOPH-10671-ER01",
      titleTh: "นพ.",
      firstNameTh: "กิตติภพ",
      lastNameTh: "เตชะมนต์",
      firstNameEn: "Kittiphop",
      lastNameEn: "Techamon",
      personnelType: "PHYSICIAN",
      positionTitle: "หัวหน้าศูนย์อุบัติเหตุและฉุกเฉิน (เวชศาสตร์ฉุกเฉิน ชำนาญการพิเศษ)",
      departmentCode: "DEP-ER-TRAUMA",
      departmentName: "ศูนย์อุบัติเหตุและฉุกเฉินระดับ 1 (Level 1 Trauma ER)",
      licenseNumber: "ว. 45678",
      email: "kittiphop.t@udonhospital.go.th",
      telephone: "042-245555 ต่อ 1999",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-005",
      staffCode: "EMP-10671-0005",
      citizenId: "1100200345675",
      mophProviderId: "MOPH-10671-NUR01",
      titleTh: "พว.",
      firstNameTh: "มัลลิกา",
      lastNameTh: "เจริญกิจ",
      firstNameEn: "Mallika",
      lastNameEn: "Charoenkit",
      personnelType: "NURSE",
      positionTitle: "หัวหน้าหออภิบาลผู้ป่วยหนัก ICU (พยาบาลวิชาชีพชำนาญการพิเศษ/APN)",
      departmentCode: "DEP-ICU-MED",
      departmentName: "หออภิบาลผู้ป่วยหนักอายุรกรรม (Medical ICU)",
      licenseNumber: "พ. 589124",
      email: "mallika.c@udonhospital.go.th",
      telephone: "042-245555 ต่อ 2101",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-006",
      staffCode: "EMP-10671-0006",
      citizenId: "1100200345676",
      mophProviderId: "MOPH-10671-PHA01",
      titleTh: "ภก.",
      firstNameTh: "ชัยวัฒน์",
      lastNameTh: "เกียรติอนันต์",
      firstNameEn: "Chaiwat",
      lastNameEn: "Kiat-anan",
      personnelType: "PHARMACIST",
      positionTitle: "หัวหน้ากลุ่มงานเภสัชกรรม (เภสัชกรเชี่ยวชาญ)",
      departmentCode: "DEP-PHARM-CENTRAL",
      departmentName: "คลังยากลางและเวชภัณฑ์มิใช่ยา",
      licenseNumber: "ภ. 19283",
      email: "chaiwat.k@udonhospital.go.th",
      telephone: "042-245555 ต่อ 3101",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-007",
      staffCode: "EMP-10671-0007",
      citizenId: "1100200345677",
      mophProviderId: "MOPH-10671-PHA02",
      titleTh: "ภญ.",
      firstNameTh: "รัตนาวลัย",
      lastNameTh: "ทรัพย์มั่งมี",
      firstNameEn: "Rattanawalai",
      lastNameEn: "Submangmee",
      personnelType: "PHARMACIST",
      positionTitle: "เภสัชกรประจำห้องจ่ายยาผู้ป่วยใน (เภสัชกรชำนาญการ)",
      departmentCode: "DEP-PHARM-IPD",
      departmentName: "ห้องจ่ายยาผู้ป่วยในและตู้ยาประจำวอร์ด",
      licenseNumber: "ภ. 23410",
      email: "rattanawalai.s@udonhospital.go.th",
      telephone: "042-245555 ต่อ 3201",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-008",
      staffCode: "EMP-10671-0008",
      citizenId: "1100200345678",
      mophProviderId: "MOPH-10671-XRAY01",
      titleTh: "นพ.",
      firstNameTh: "สุรเชษฐ์",
      lastNameTh: "เจษฎาภา",
      firstNameEn: "Surachet",
      lastNameEn: "Jessadapa",
      personnelType: "PHYSICIAN",
      positionTitle: "หัวหน้ากลุ่มงานรังสีวินิจฉัย (รังสีแพทย์ ชำนาญการพิเศษ)",
      departmentCode: "DEP-XRAY-CT",
      departmentName: "กลุ่มงานรังสีวินิจฉัยและเอกซเรย์คอมพิวเตอร์ (CT/MRI)",
      licenseNumber: "ว. 38921",
      email: "surachet.j@udonhospital.go.th",
      telephone: "042-245555 ต่อ 4101",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-009",
      staffCode: "EMP-10671-0009",
      citizenId: "1100200345679",
      mophProviderId: "MOPH-10671-LAB01",
      titleTh: "ทนพญ.",
      firstNameTh: "นงนุช",
      lastNameTh: "โสภณพนิช",
      firstNameEn: "Nongnuch",
      lastNameEn: "Sophonpanich",
      personnelType: "TECH_MED",
      positionTitle: "หัวหน้ากลุ่มงานเทคนิคการแพทย์ (นักเทคนิคการแพทย์เชี่ยวชาญ)",
      departmentCode: "DEP-LAB-PATH",
      departmentName: "กลุ่มงานเทคนิคการแพทย์และพยาธิวิทยาคลินิก",
      licenseNumber: "ทนพ. 7821",
      email: "nongnuch.s@udonhospital.go.th",
      telephone: "042-245555 ต่อ 4201",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-010",
      staffCode: "EMP-10671-0010",
      citizenId: "1100200345680",
      mophProviderId: "MOPH-10671-PROC01",
      titleTh: "นาง",
      firstNameTh: "สมศรี",
      lastNameTh: "รัตนเวโรจน์",
      firstNameEn: "Somsri",
      lastNameEn: "Rattanaweroj",
      personnelType: "PROCUREMENT_OFFICER",
      positionTitle: "หัวหน้ากลุ่มงานพัสดุและจัดซื้อจัดจ้าง (นักวิชาการพัสดุชำนาญการพิเศษ)",
      departmentCode: "DEP-SUPPLY-PROC",
      departmentName: "กลุ่มงานพัสดุและจัดซื้อจัดจ้างภาครัฐ",
      email: "somsri.r@udonhospital.go.th",
      telephone: "042-245555 ต่อ 6101",
      isCommitteeEligible: false,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-011",
      staffCode: "EMP-10671-0011",
      citizenId: "1100200345681",
      mophProviderId: "MOPH-10671-FIN01",
      titleTh: "น.ส.",
      firstNameTh: "นิตยา",
      lastNameTh: "สิริโภคา",
      firstNameEn: "Nittaya",
      lastNameEn: "Siriphoka",
      personnelType: "FINANCE_OFFICER",
      positionTitle: "หัวหน้ากลุ่มงานการเงินและเบิกจ่าย (นักวิชาการเงินและบัญชีชำนาญการพิเศษ)",
      departmentCode: "DEP-FIN-DISB",
      departmentName: "กลุ่มงานการเงินและเบิกจ่ายคลัง (3-Way Match)",
      email: "nittaya.s@udonhospital.go.th",
      telephone: "042-245555 ต่อ 6201",
      isCommitteeEligible: false,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-012",
      staffCode: "EMP-10671-0012",
      citizenId: "1100200345682",
      mophProviderId: "MOPH-10671-LEG01",
      titleTh: "นาย",
      firstNameTh: "ธนิต",
      lastNameTh: "นิติกิตติ",
      firstNameEn: "Thanit",
      lastNameEn: "Nitikitti",
      personnelType: "LEGAL_OFFICER",
      positionTitle: "นิติกรตรวจร่างสัญญาและหลักประกัน e-LG (นิติกรปฏิบัติการ)",
      departmentCode: "DEP-SUPPLY-PROC",
      departmentName: "กลุ่มงานพัสดุและจัดซื้อจัดจ้างภาครัฐ",
      email: "thanit.n@udonhospital.go.th",
      telephone: "02-590-6015",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-013",
      staffCode: "EMP-10671-0013",
      citizenId: "1100200345683",
      mophProviderId: "MOPH-10671-ENG01",
      titleTh: "วศ.",
      firstNameTh: "เกรียงศักดิ์",
      lastNameTh: "วงศ์สวัสดิ์",
      firstNameEn: "Kriangsak",
      lastNameEn: "Wongsawat",
      personnelType: "ENGINEER",
      positionTitle: "หัวหน้ากลุ่มงานวิศวกรรมการแพทย์ (วิศวกรชีวการแพทย์ชำนาญการ)",
      departmentCode: "DEP-ENG-BIOMED",
      departmentName: "กลุ่มงานวิศวกรรมการแพทย์และบำรุงรักษาครุภัณฑ์",
      licenseNumber: "กว. 89124",
      email: "kriangsak.w@udonhospital.go.th",
      telephone: "042-245555 ต่อ 7101",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-014",
      staffCode: "EMP-10671-0014",
      citizenId: "1100200345684",
      mophProviderId: "MOPH-10671-PLAN01",
      titleTh: "ดร.",
      firstNameTh: "ธนพล",
      lastNameTh: "มโนรมย์",
      firstNameEn: "Thanaphon",
      lastNameEn: "Manorom",
      personnelType: "EXECUTIVE",
      positionTitle: "หัวหน้ากลุ่มงานยุทธศาสตร์และแผนงานพหุกองทุน (นักวิเคราะห์นโยบายและแผนเชี่ยวชาญ)",
      departmentCode: "DEP-STRAT-PLAN",
      departmentName: "กลุ่มงานยุทธศาสตร์และแผนงานพหุกองทุน",
      email: "thanaphon.m@udonhospital.go.th",
      telephone: "042-245555 ต่อ 6301",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
    {
      id: "STAFF-015",
      staffCode: "EMP-10671-0015",
      citizenId: "1100200345685",
      mophProviderId: "MOPH-10671-NUR02",
      titleTh: "พว.",
      firstNameTh: "จันทิมา",
      lastNameTh: "บวรศิลป์",
      firstNameEn: "Chanthima",
      lastNameEn: "Bawornsilp",
      personnelType: "NURSE",
      positionTitle: "พยาบาลหัวหน้าเวรห้องผ่าตัด OR (พยาบาลวิชาชีพชำนาญการ)",
      departmentCode: "DEP-SURG-OR",
      departmentName: "ศูนย์ห้องผ่าตัดกลาง (Central OR Suite)",
      licenseNumber: "พ. 612890",
      email: "chanthima.b@udonhospital.go.th",
      telephone: "02-590-1025",
      isCommitteeEligible: true,
      padesSignatureActive: true,
      isActive: true,
      createdAt: "2026-01-01T08:00:00+07:00",
      updatedAt: "2026-10-31T09:00:00+07:00",
    },
  ];
}

export function loadStore(): LiveStoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const seed = buildInitialSeedState();
      fs.writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), "utf8");
      return seed;
    }
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LiveStoreState;
    let modified = false;
    if (!parsed.inventory || parsed.inventory.length === 0) {
      parsed.inventory = buildDefaultInventory();
      modified = true;
    }
    if (!parsed.wardStocks || parsed.wardStocks.length === 0) {
      parsed.wardStocks = buildDefaultWardStocks();
      modified = true;
    }
    if (!parsed.requisitions || parsed.requisitions.length === 0) {
      parsed.requisitions = buildDefaultRequisitions();
      modified = true;
    }
    if (!parsed.budgetProposals || parsed.budgetProposals.length === 0) {
      parsed.budgetProposals = buildDefaultBudgetProposals();
      modified = true;
    }
    if (!parsed.missionGroups || parsed.missionGroups.length === 0) {
      parsed.missionGroups = buildDefaultMissionGroups();
      modified = true;
    }
    if (!parsed.departments || parsed.departments.length === 0) {
      parsed.departments = buildDefaultDepartments();
      modified = true;
    }
    if (!parsed.runningNumbers || parsed.runningNumbers.length === 0) {
      parsed.runningNumbers = buildDefaultRunningNumbers();
      modified = true;
    }
    if (!parsed.personnel || parsed.personnel.length === 0) {
      parsed.personnel = buildDefaultPersonnel();
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), "utf8");
    }
    return parsed;
  } catch {
    return buildInitialSeedState();
  }
}

export function saveStore(state: LiveStoreState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export function appendAuditLog(
  state: LiveStoreState,
  input: {
    actorUsername: string;
    actorRole: string;
    actionType: string;
    entityType: string;
    entityId: string;
    payloadSummary: string;
  }
): AuditLogRow {
  const last = state.auditLogs[state.auditLogs.length - 1];
  const prevHash = last ? last.rowHash : "0".repeat(64);
  const seq = last ? last.seq + 1 : 1;
  const eventTime = new Date().toISOString();
  const rowHash = computeAuditRowHash(
    prevHash,
    seq,
    eventTime,
    input.actorUsername,
    input.actionType,
    input.entityId,
    input.payloadSummary
  );
  const row: AuditLogRow = {
    seq,
    logId: `AUD-2026-${String(seq).padStart(4, "0")}`,
    partitionYear: 2026,
    eventTime,
    ...input,
    prevHash,
    rowHash,
  };
  state.auditLogs.push(row);
  return row;
}

export function verifyAuditHashChain(logs: AuditLogRow[]): {
  valid: boolean;
  checkedCount: number;
  brokenAtSeq: number | null;
  merkleRoot: string;
} {
  let expectedPrev = "0".repeat(64);
  for (const row of logs) {
    if (row.prevHash !== expectedPrev) {
      return {
        valid: false,
        checkedCount: logs.length,
        brokenAtSeq: row.seq,
        merkleRoot: computeDailyMerkleRoot(logs.map((l) => l.rowHash)),
      };
    }
    const recomputed = computeAuditRowHash(
      row.prevHash,
      row.seq,
      row.eventTime,
      row.actorUsername,
      row.actionType,
      row.entityId,
      row.payloadSummary
    );
    if (recomputed !== row.rowHash) {
      return {
        valid: false,
        checkedCount: logs.length,
        brokenAtSeq: row.seq,
        merkleRoot: computeDailyMerkleRoot(logs.map((l) => l.rowHash)),
      };
    }
    expectedPrev = row.rowHash;
  }
  return {
    valid: true,
    checkedCount: logs.length,
    brokenAtSeq: null,
    merkleRoot: computeDailyMerkleRoot(logs.map((l) => l.rowHash)),
  };
}

export function createPurchaseRequisition(input: {
  department: string;
  fundCode: FundBudgetRow["fundCode"];
  title: string;
  drugGenericName?: string;
  qty: number;
  unitPrice: number;
  nlemCapUnitPrice: number;
  procurementType: PurchaseRequisitionRow["procurementType"];
  requestedBy: string;
  donorPurposeTag?: string;
}): PurchaseRequisitionRow {
  const state = loadStore();
  if (input.unitPrice > input.nlemCapUnitPrice) {
    throw new Error(
      `NLEM_PRICE_CAP_EXCEEDED: ราคาต่อหน่วย (${input.unitPrice.toLocaleString()} บาท) เกินเพดานราคากลางยาแห่งชาติ NLEM (${input.nlemCapUnitPrice.toLocaleString()} บาท)`
    );
  }
  const fund = state.funds.find((f) => f.fundCode === input.fundCode);
  if (!fund) {
    throw new Error(`FUND_NOT_FOUND: ไม่พบกองทุน ${input.fundCode}`);
  }
  if (
    fund.fundCode === "DONATION_SPECIFIED" &&
    input.donorPurposeTag &&
    input.donorPurposeTag !== fund.donorObjective
  ) {
    throw new Error(
      `DONOR_OBJECTIVE_MISMATCH: เงินบริจาคระบุวัตถุประสงค์ (${fund.donorObjective}) ห้ามนำไปใช้ผิดวัตถุประสงค์ (${input.donorPurposeTag})`
    );
  }
  const totalAmount = Number((input.qty * input.unitPrice).toFixed(2));
  const available =
    fund.allocated -
    (fund.preEncumbered + fund.encumbered + fund.carryOverEncumbered + fund.disbursed);
  if (totalAmount > available) {
    throw new Error(
      `INSUFFICIENT_FUND_BUDGET: วงเงินคงเหลือในกองทุนไม่เพียงพอ (ต้องการ ${totalAmount.toLocaleString()} บาท, คงเหลือ ${available.toLocaleString()} บาท)`
    );
  }

  fund.preEncumbered = Number((fund.preEncumbered + totalAmount).toFixed(2));

  const nextNo = 1001 + state.prs.length;
  const pr: PurchaseRequisitionRow = {
    prId: `PR-2569-${String(state.prs.length + 1).padStart(4, "0")}`,
    prNumber: `PR-69-${nextNo}`,
    department: input.department,
    fundCode: input.fundCode,
    title: input.title,
    drugGenericName: input.drugGenericName,
    qty: input.qty,
    unitPrice: input.unitPrice,
    nlemCapUnitPrice: input.nlemCapUnitPrice,
    totalAmount,
    procurementType: input.procurementType,
    status: "PRE_ENCUMBERED",
    requestedBy: input.requestedBy,
    createdAt: new Date().toISOString(),
    emergencySlaDeadline:
      input.procurementType === "EMERGENCY_RETROSPECTIVE_PR"
        ? new Date(Date.now() + 5 * 86400_000).toISOString()
        : undefined,
  };

  state.prs.unshift(pr);
  appendAuditLog(state, {
    actorUsername: input.requestedBy,
    actorRole: input.department.toUpperCase(),
    actionType: "CREATE_PR_PRE_ENCUMBER",
    entityType: "PURCHASE_REQUISITION",
    entityId: pr.prNumber,
    payloadSummary: `Created ${pr.prNumber} (${pr.procurementType}) amount=${totalAmount.toFixed(2)} THB on ${pr.fundCode}`,
  });
  saveStore(state);
  return pr;
}

export function approvePrEncumbrance(prNumber: string, actorUsername: string): PurchaseRequisitionRow {
  const state = loadStore();
  const pr = state.prs.find((p) => p.prNumber === prNumber || p.prId === prNumber);
  if (!pr) throw new Error(`ไม่พบใบขอซื้อ ${prNumber}`);
  if (pr.status !== "PRE_ENCUMBERED") {
    return pr;
  }
  const fund = state.funds.find((f) => f.fundCode === pr.fundCode);
  if (fund) {
    fund.preEncumbered = Math.max(0, Number((fund.preEncumbered - pr.totalAmount).toFixed(2)));
    fund.encumbered = Number((fund.encumbered + pr.totalAmount).toFixed(2));
  }
  pr.status = "APPROVED_ENCUMBERED";
  appendAuditLog(state, {
    actorUsername,
    actorRole: "BUDGET_DIRECTOR",
    actionType: "APPROVE_PR_ENCUMBRANCE",
    entityType: "PURCHASE_REQUISITION",
    entityId: pr.prNumber,
    payloadSummary: `Moved ${pr.totalAmount.toFixed(2)} THB from PRE_ENCUMBERED -> ENCUMBERED on ${pr.fundCode}`,
  });
  saveStore(state);
  return pr;
}

export function issueBlanketCallOff(input: {
  contractId: string;
  amount: number;
  createdBy: string;
  expectedVersion?: number;
}): { order: CallOffOrderRow; contract: BlanketContractRow } {
  const state = loadStore();
  const contract = state.blanketContracts.find((c) => c.contractId === input.contractId);
  if (!contract) {
    throw new Error(`CONTRACT_NOT_FOUND: ไม่พบสัญญาจะซื้อจะขาย ${input.contractId}`);
  }
  if (input.expectedVersion !== undefined && contract.version !== input.expectedVersion) {
    throw new Error(`OCC_VERSION_CONFLICT: สัญญาถูกแก้ไขโดยผู้ใช้อื่น กรุณารีเฟรชหน้าจอ`);
  }

  const standstill = evaluateStandstill(
    contract.awardPublishedDate,
    new Date().toISOString().slice(0, 10),
    state.holidays
  );
  if (!standstill.canSignContract && !contract.standstillReleased) {
    throw new Error(
      `STANDSTILL_LOCKED: ยังไม่ครบกำหนดรออุทธรณ์ 7 วันทำการ (ปลดล็อกวันที่ ${standstill.standstillEndsOn})`
    );
  }

  if (input.amount <= 0 || input.amount > contract.quotaRemainingAmt) {
    throw new Error(
      `BLANKET_QUOTA_EXCEEDED: ยอดสั่งซื้อ Call-Off (${input.amount.toLocaleString()} บาท) เกินโควตาคงเหลือของสัญญา (${contract.quotaRemainingAmt.toLocaleString()} บาท)`
    );
  }

  contract.quotaConsumedAmt = Number((contract.quotaConsumedAmt + input.amount).toFixed(2));
  contract.quotaRemainingAmt = Number((contract.quotaCeilingAmt - contract.quotaConsumedAmt).toFixed(2));
  contract.version += 1;

  const order: CallOffOrderRow = {
    poId: `PO-CALL-${String(state.callOffOrders.length + 1).padStart(3, "0")}`,
    poNumber: `PO-69-${4013 + state.callOffOrders.length}`,
    contractId: contract.contractId,
    contractNo: contract.contractNo,
    amount: Number(input.amount.toFixed(2)),
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };

  state.callOffOrders.unshift(order);
  appendAuditLog(state, {
    actorUsername: input.createdBy,
    actorRole: "PROCUREMENT_OFFICER",
    actionType: "BLANKET_PA_CALL_OFF",
    entityType: "CALL_OFF_PO",
    entityId: order.poNumber,
    payloadSummary: `Issued Call-Off ${order.poNumber} on ${contract.contractNo} amount=${order.amount.toFixed(2)} remaining=${contract.quotaRemainingAmt.toFixed(2)}`,
  });
  saveStore(state);
  return { order, contract };
}

export function recordConsignmentUsage(input: {
  idempotencyKey: string;
  hisCaseRef: string;
  patientHn: string;
  patientAn: string;
  implantCode: string;
  implantName: string;
  serialNo: string;
  lotNo: string;
  qty: number;
  unitPrice: number;
  surgeonProviderId: string;
}): { row: ConsignmentUsageRow; deduplicated: boolean } {
  const state = loadStore();
  const existing = state.consignments.find((c) => c.idempotencyKey === input.idempotencyKey);
  if (existing) {
    return { row: existing, deduplicated: true };
  }
  const totalAmount = Number((input.qty * input.unitPrice).toFixed(2));
  const row: ConsignmentUsageRow = {
    usageId: `OR-CON-${String(state.consignments.length + 1).padStart(3, "0")}`,
    idempotencyKey: input.idempotencyKey,
    hisCaseRef: input.hisCaseRef,
    patientHnMasked: maskPatientIdentifier(input.patientHn, "HN"),
    patientAnMasked: maskPatientIdentifier(input.patientAn, "AN"),
    implantCode: input.implantCode,
    implantName: input.implantName,
    serialNo: input.serialNo,
    lotNo: input.lotNo,
    qty: input.qty,
    unitPrice: input.unitPrice,
    totalAmount,
    autoPoNumber: `PO-OR-69-${String(state.consignments.length + 2).padStart(3, "0")}`,
    surgeonProviderId: input.surgeonProviderId,
    usedAt: new Date().toISOString(),
  };

  state.consignments.unshift(row);
  appendAuditLog(state, {
    actorUsername: input.surgeonProviderId,
    actorRole: "OR_SURGEON_HIS",
    actionType: "OR_CONSIGNMENT_CONSUMED",
    entityType: "OR_CONSIGNMENT",
    entityId: row.usageId,
    payloadSummary: `Consignment ${row.implantName} (${row.patientHnMasked}) -> Auto ${row.autoPoNumber} (${totalAmount.toFixed(2)} THB)`,
  });
  saveStore(state);
  return { row, deduplicated: false };
}

export function recordReceivingInspection(input: {
  poNumber: string;
  drugName: string;
  lotNumber: string;
  expiryDate: string;
  coldChainTempC: number;
  coaVerified: boolean;
  fdaRegNo: string;
  committeeQuorumCount: number;
  objectionRaised: boolean;
  objectionReason?: string;
  inspectionDaysTaken: number;
  actorUsername: string;
}): InspectionRow {
  const state = loadStore();
  if (!input.objectionRaised) {
    if (input.coldChainTempC < 2.0 || input.coldChainTempC > 8.0) {
      throw new Error(
        `COLD_CHAIN_BREACH: อุณหภูมิตรวจรับ (${input.coldChainTempC}°C) อยู่นอกเกณฑ์มาตรฐาน Cold-Chain (2.0°C - 8.0°C)`
      );
    }
    if (!input.coaVerified) {
      throw new Error(`COA_MISSING: ต้องตรวจสอบใบรับรองการวิเคราะห์รุ่นผลิต (Certificate of Analysis - COA) ก่อนรับเข้าคลัง`);
    }
    if (input.committeeQuorumCount < 3) {
      throw new Error(`QUORUM_INSUFFICIENT: คณะกรรมการตรวจรับพัสดุต้องลงนาม PAdES-LTV ครบองค์ประชุมอย่างน้อย 3 ท่าน`);
    }
  }

  const row: InspectionRow = {
    inspectionId: `INSP-2569-${String(state.inspections.length + 1).padStart(3, "0")}`,
    poNumber: input.poNumber,
    drugName: input.drugName,
    lotNumber: input.lotNumber,
    expiryDate: input.expiryDate,
    coldChainTempC: input.coldChainTempC,
    coaVerified: input.coaVerified,
    fdaRegNo: input.fdaRegNo,
    committeeQuorumCount: input.committeeQuorumCount,
    objectionRaised: input.objectionRaised,
    objectionReason: input.objectionReason,
    inspectionDaysTaken: input.inspectionDaysTaken,
    status: input.objectionRaised ? "SUSPENDED_BY_OBJECTION" : "ACCEPTED_PADES_SIGNED",
    createdAt: new Date().toISOString(),
  };

  state.inspections.unshift(row);
  appendAuditLog(state, {
    actorUsername: input.actorUsername,
    actorRole: "INSPECTION_COMMITTEE",
    actionType: input.objectionRaised ? "INSPECTION_OBJECTION_HALT" : "PADES_LTV_INSPECTION_SIGN",
    entityType: "RECEIVING_INSPECTION",
    entityId: row.inspectionId,
    payloadSummary: `${row.status} on ${row.poNumber} (${row.drugName}) Lot=${row.lotNumber} Temp=${row.coldChainTempC}C`,
  });
  saveStore(state);
  return row;
}

export function createDisbursementVoucher(input: {
  poNumber: string;
  vendorName: string;
  vendorCategory: VendorCategory;
  fundCode: FundBudgetRow["fundCode"];
  invoiceInclVat: number;
  penaltyAmount: number;
  actorUsername: string;
}): DisbursementVoucherRow {
  const state = loadStore();
  const calc = computeThreeWayMatch({
    poAmountInclVat: input.invoiceInclVat,
    inspectionAcceptedInclVat: input.invoiceInclVat,
    invoiceAmountInclVat: input.invoiceInclVat,
    vendorCategory: input.vendorCategory,
    penaltyAmount: input.penaltyAmount,
    hasCommitteeObjection: false,
  });

  const fund = state.funds.find((f) => f.fundCode === input.fundCode);
  if (fund) {
    fund.encumbered = Math.max(0, Number((fund.encumbered - input.invoiceInclVat).toFixed(2)));
    fund.disbursed = Number((fund.disbursed + calc.netPayable).toFixed(2));
  }

  const voucher: DisbursementVoucherRow = {
    voucherId: `DV-2569-${String(state.vouchers.length + 1).padStart(4, "0")}`,
    voucherNo: `DV-69-${10001 + state.vouchers.length}`,
    poNumber: input.poNumber,
    vendorName: input.vendorName,
    vendorCategory: input.vendorCategory,
    fundCode: input.fundCode,
    invoiceInclVat: calc.inclVat,
    exVatBase: calc.exVatBase,
    vat7Pct: calc.vat7Pct,
    wht1Pct: calc.wht1Pct,
    whtExemptReason: calc.whtExemptReason,
    penaltyDeducted: calc.penaltyDeducted,
    netPayable: calc.netPayable,
    status: "PAID",
    createdAt: new Date().toISOString(),
  };

  state.vouchers.unshift(voucher);
  appendAuditLog(state, {
    actorUsername: input.actorUsername,
    actorRole: "FINANCE_DISBURSEMENT",
    actionType: "THREE_WAY_MATCH_DISBURSE",
    entityType: "DISBURSEMENT_VOUCHER",
    entityId: voucher.voucherNo,
    payloadSummary: `Paid ${voucher.voucherNo} (${voucher.vendorCategory}): InclVAT=${voucher.invoiceInclVat.toFixed(2)} ExVAT=${voucher.exVatBase.toFixed(2)} WHT=${voucher.wht1Pct.toFixed(2)} Penalty=${voucher.penaltyDeducted.toFixed(2)} NetPayable=${voucher.netPayable.toFixed(2)}`,
  });
  saveStore(state);
  return voucher;
}

export function getInventoryData() {
  const state = loadStore();
  return {
    inventory: state.inventory || [],
    wardStocks: state.wardStocks || [],
    requisitions: state.requisitions || [],
  };
}

export function receiveInventoryLot(input: {
  itemCode: string;
  lotNo: string;
  expiryDate: string;
  qty: number;
  unitCost: number;
  location: string;
  actorUsername: string;
}) {
  const state = loadStore();
  const item = (state.inventory || []).find((i) => i.itemCode === input.itemCode);
  if (!item) {
    throw new Error(`ไม่พบรหัสเวชภัณฑ์ ${input.itemCode}`);
  }

  const existingLot = item.lots.find((l) => l.lotNo === input.lotNo);
  if (existingLot) {
    existingLot.qty += input.qty;
    existingLot.unitCost = input.unitCost;
  } else {
    item.lots.push({
      lotNo: input.lotNo,
      expiryDate: input.expiryDate,
      qty: input.qty,
      unitCost: input.unitCost,
      location: input.location,
    });
  }

  item.totalStock = item.lots.reduce((s, l) => s + l.qty, 0);

  appendAuditLog(state, {
    actorUsername: input.actorUsername,
    actorRole: "CENTRAL_PHARMACY_STORE",
    actionType: "RECEIVE_INVENTORY_LOT",
    entityType: "CENTRAL_INVENTORY",
    entityId: input.itemCode,
    payloadSummary: `Received ${input.qty} ${item.uom} of ${item.drugName} Lot ${input.lotNo} (Exp: ${input.expiryDate}) at ${input.location}`,
  });

  saveStore(state);
  return { item, inventory: state.inventory };
}

export function createWardRequisition(input: {
  wardId: string;
  itemCode: string;
  requestedQty: number;
  requestedBy: string;
}) {
  const state = loadStore();
  const ward = (state.wardStocks || []).find((w) => w.wardId === input.wardId);
  const item = (state.inventory || []).find((i) => i.itemCode === input.itemCode);

  if (!ward) throw new Error(`ไม่พบหอผู้ป่วย ${input.wardId}`);
  if (!item) throw new Error(`ไม่พบรหัสเวชภัณฑ์ ${input.itemCode}`);

  const reqId = `REQ-2569-${String((state.requisitions || []).length + 1).padStart(3, "0")}`;
  const reqNo = `WR-69-${String(100 + (state.requisitions || []).length + 1)}`;

  const requisition: WardRequisitionRow = {
    reqId,
    reqNo,
    wardId: ward.wardId,
    wardName: ward.wardName,
    itemCode: item.itemCode,
    drugName: item.drugName,
    requestedQty: input.requestedQty,
    dispensedQty: 0,
    dispensedLots: [],
    status: "REQUESTED",
    requestedBy: input.requestedBy,
    createdAt: new Date().toISOString(),
  };

  if (!state.requisitions) state.requisitions = [];
  state.requisitions.unshift(requisition);

  appendAuditLog(state, {
    actorUsername: input.requestedBy,
    actorRole: "WARD_NURSE_INCHARGE",
    actionType: "WARD_REQUISITION_CREATED",
    entityType: "WARD_REQUISITION",
    entityId: reqNo,
    payloadSummary: `Ward ${ward.wardName} requested ${input.requestedQty} ${item.uom} of ${item.drugName}`,
  });

  saveStore(state);
  return { requisition, requisitions: state.requisitions };
}

export function dispenseRequisitionFEFO(input: {
  reqId: string;
  actorUsername: string;
}) {
  const state = loadStore();
  const req = (state.requisitions || []).find((r) => r.reqId === input.reqId);
  if (!req) throw new Error(`ไม่พบใบเบิกยา ${input.reqId}`);
  if (req.status !== "REQUESTED") {
    throw new Error(`ใบเบิกยา ${req.reqNo} ได้รับการดำเนินการไปแล้ว (${req.status})`);
  }

  const item = (state.inventory || []).find((i) => i.itemCode === req.itemCode);
  if (!item) throw new Error(`ไม่พบรายการยา ${req.itemCode} ในคลังกลาง`);

  if (item.totalStock < req.requestedQty) {
    throw new Error(
      `ยอดคงเหลือในคลังกลางไม่เพียงพอ (ต้องการ ${req.requestedQty} ${item.uom}, มีอยู่ ${item.totalStock} ${item.uom})`
    );
  }

  // Sort lots by expiryDate ascending (FEFO: First Expired, First Out)
  item.lots.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  let remainingToDispense = req.requestedQty;
  const dispensedLots: Array<{ lotNo: string; qty: number }> = [];

  for (const lot of item.lots) {
    if (remainingToDispense <= 0) break;
    if (lot.qty <= 0) continue;

    const take = Math.min(lot.qty, remainingToDispense);
    lot.qty -= take;
    remainingToDispense -= take;
    dispensedLots.push({ lotNo: lot.lotNo, qty: take });
  }

  // Remove empty lots or leave with qty 0
  item.lots = item.lots.filter((l) => l.qty > 0);
  item.totalStock = item.lots.reduce((s, l) => s + l.qty, 0);

  // Add to ward stock
  const ward = (state.wardStocks || []).find((w) => w.wardId === req.wardId);
  if (ward) {
    const wardItem = ward.stock.find((s) => s.itemCode === req.itemCode);
    if (wardItem) {
      wardItem.currentQty += req.requestedQty;
    } else {
      ward.stock.push({
        itemCode: item.itemCode,
        drugName: item.drugName,
        uom: item.uom,
        currentQty: req.requestedQty,
        parLevel: req.requestedQty,
        minLevel: Math.round(req.requestedQty / 3),
      });
    }
  }

  req.status = "DISPENSED";
  req.dispensedQty = req.requestedQty;
  req.dispensedLots = dispensedLots;

  const lotBreakdown = dispensedLots.map((l) => `${l.lotNo}(${l.qty})`).join(", ");

  appendAuditLog(state, {
    actorUsername: input.actorUsername,
    actorRole: "CENTRAL_PHARMACIST",
    actionType: "FEFO_WARD_DISPENSE",
    entityType: "WARD_REQUISITION",
    entityId: req.reqNo,
    payloadSummary: `Dispensed ${req.dispensedQty} ${item.uom} of ${item.drugName} to ${req.wardName} via FEFO [${lotBreakdown}]`,
  });

  saveStore(state);
  return {
    requisition: req,
    inventory: state.inventory,
    wardStocks: state.wardStocks,
    requisitions: state.requisitions,
  };
}

export function getAnnualBudgetProposals(fiscalYear?: number) {
  const state = loadStore();
  const list = state.budgetProposals || [];
  if (fiscalYear) {
    return list.filter((p) => p.fiscalYear === fiscalYear);
  }
  return list;
}

export function createAnnualBudgetProposal(input: {
  fiscalYear: number;
  departmentCode: string;
  departmentName: string;
  expenseCategory: AnnualBudgetProposal["expenseCategory"];
  projectName: string;
  requestedAmount: number;
  previousYearActualAmount?: number;
  justification: string;
  urgency: AnnualBudgetProposal["urgency"];
  submittedBy: string;
}) {
  const state = loadStore();
  if (!state.budgetProposals) state.budgetProposals = [];

  const count = state.budgetProposals.length + 1;
  const shortYear = String(input.fiscalYear).slice(-2);
  const proposalId = `PROP-${input.fiscalYear}-${String(count).padStart(3, "0")}`;
  const proposalNo = `BP-${shortYear}-${String(count).padStart(3, "0")}`;

  const proposal: AnnualBudgetProposal = {
    proposalId,
    proposalNo,
    fiscalYear: input.fiscalYear,
    departmentCode: input.departmentCode,
    departmentName: input.departmentName,
    expenseCategory: input.expenseCategory,
    projectName: input.projectName,
    requestedAmount: Number(input.requestedAmount),
    previousYearActualAmount: Number(input.previousYearActualAmount || 0),
    justification: input.justification,
    urgency: input.urgency,
    status: "SUBMITTED",
    submittedBy: input.submittedBy,
    submittedAt: new Date().toISOString(),
  };

  state.budgetProposals.unshift(proposal);

  appendAuditLog(state, {
    actorUsername: input.submittedBy,
    actorRole: "DEPARTMENT_HEAD",
    actionType: "ANNUAL_BUDGET_PROPOSAL_SUBMITTED",
    entityType: "BUDGET_PROPOSAL",
    entityId: proposalNo,
    payloadSummary: `Submitted ${proposalNo} by ${input.departmentName}: ${input.projectName} (Requested: ${input.requestedAmount.toLocaleString()} THB, FY${input.fiscalYear})`,
  });

  saveStore(state);
  return { proposal, proposals: state.budgetProposals };
}

export function reviewAnnualBudgetProposal(input: {
  proposalId: string;
  action: "APPROVE" | "REDUCE" | "REJECT";
  approvedAmount?: number;
  reviewedBy: string;
  reviewNotes: string;
}) {
  const state = loadStore();
  const proposal = (state.budgetProposals || []).find((p) => p.proposalId === input.proposalId);
  if (!proposal) throw new Error(`ไม่พบคำของบประมาณรหัส ${input.proposalId}`);

  if (input.action === "APPROVE") {
    proposal.status = "APPROVED";
    proposal.approvedAmount = input.approvedAmount || proposal.requestedAmount;
  } else if (input.action === "REDUCE") {
    proposal.status = "REDUCED";
    proposal.approvedAmount = input.approvedAmount || Math.round(proposal.requestedAmount * 0.85);
  } else {
    proposal.status = "REJECTED";
    proposal.approvedAmount = 0;
  }

  proposal.reviewedBy = input.reviewedBy;
  proposal.reviewNotes = input.reviewNotes;

  appendAuditLog(state, {
    actorUsername: input.reviewedBy,
    actorRole: "BUDGET_COMMITTEE",
    actionType: "ANNUAL_BUDGET_PROPOSAL_REVIEWED",
    entityType: "BUDGET_PROPOSAL",
    entityId: proposal.proposalNo,
    payloadSummary: `Reviewed ${proposal.proposalNo} (${input.action}): Approved=${(proposal.approvedAmount || 0).toLocaleString()} THB Notes: ${input.reviewNotes}`,
  });

  saveStore(state);
  return { proposal, proposals: state.budgetProposals };
}

// ============================================================================
// MASTER DATA: MISSION GROUPS & HOSPITAL DEPARTMENTS (CRUD)
// ============================================================================

export function getMissionGroups(): MissionGroup[] {
  const state = loadStore();
  return (state.missionGroups || []).filter((g) => g.isActive);
}

export function getDepartments(groupCode?: string): HospitalDepartment[] {
  const state = loadStore();
  let list = state.departments || [];
  if (groupCode) {
    list = list.filter((d) => d.groupCode === groupCode);
  }
  return list;
}

export function createDepartment(input: {
  departmentCode: string;
  groupCode: string;
  departmentNameTh: string;
  departmentNameEn?: string;
  costCenterCode: string;
  headName?: string;
  telephone?: string;
  locationBuilding?: string;
  floorNumber?: string;
  isProcurementAuthorized?: boolean;
  actorUsername?: string;
}) {
  const state = loadStore();
  if (!state.departments) state.departments = buildDefaultDepartments();

  const code = input.departmentCode.trim().toUpperCase();
  if (state.departments.some((d) => d.departmentCode === code)) {
    throw new Error(`รหัสแผนก '${code}' มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
  }
  if (state.departments.some((d) => d.costCenterCode === input.costCenterCode.trim())) {
    throw new Error(`รหัสศูนย์ต้นทุน '${input.costCenterCode}' ซ้ำกับแผนกอื่น`);
  }

  const newDep: HospitalDepartment = {
    departmentCode: code,
    groupCode: input.groupCode,
    departmentNameTh: input.departmentNameTh.trim(),
    departmentNameEn: input.departmentNameEn?.trim() || "",
    costCenterCode: input.costCenterCode.trim(),
    headName: input.headName?.trim() || "ไม่ระบุ",
    telephone: input.telephone?.trim() || "-",
    locationBuilding: input.locationBuilding?.trim() || "อาคารหลัก",
    floorNumber: input.floorNumber?.trim() || "ชั้น 1",
    isProcurementAuthorized: input.isProcurementAuthorized !== false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.departments.push(newDep);

  appendAuditLog(state, {
    actorUsername: input.actorUsername || "ADMIN",
    actorRole: "HOSPITAL_ADMIN",
    actionType: "DEPARTMENT_CREATED",
    entityType: "HOSPITAL_DEPARTMENT",
    entityId: newDep.departmentCode,
    payloadSummary: `Created Department: ${newDep.departmentCode} - ${newDep.departmentNameTh} (Cost Center: ${newDep.costCenterCode})`,
  });

  saveStore(state);
  return { department: newDep, departments: state.departments };
}

export function updateDepartment(
  departmentCode: string,
  input: Partial<HospitalDepartment> & { actorUsername?: string }
) {
  const state = loadStore();
  if (!state.departments) state.departments = buildDefaultDepartments();

  const dep = state.departments.find((d) => d.departmentCode === departmentCode);
  if (!dep) {
    throw new Error(`ไม่พบกลุ่มงาน/แผนกรหัส '${departmentCode}'`);
  }

  if (input.departmentNameTh) dep.departmentNameTh = input.departmentNameTh.trim();
  if (input.departmentNameEn !== undefined) dep.departmentNameEn = input.departmentNameEn.trim();
  if (input.groupCode) dep.groupCode = input.groupCode;
  if (input.costCenterCode) dep.costCenterCode = input.costCenterCode.trim();
  if (input.headName !== undefined) dep.headName = input.headName.trim();
  if (input.telephone !== undefined) dep.telephone = input.telephone.trim();
  if (input.locationBuilding !== undefined) dep.locationBuilding = input.locationBuilding.trim();
  if (input.floorNumber !== undefined) dep.floorNumber = input.floorNumber.trim();
  if (input.isProcurementAuthorized !== undefined) dep.isProcurementAuthorized = input.isProcurementAuthorized;
  if (input.isActive !== undefined) dep.isActive = input.isActive;
  dep.updatedAt = new Date().toISOString();

  appendAuditLog(state, {
    actorUsername: input.actorUsername || "ADMIN",
    actorRole: "HOSPITAL_ADMIN",
    actionType: "DEPARTMENT_UPDATED",
    entityType: "HOSPITAL_DEPARTMENT",
    entityId: departmentCode,
    payloadSummary: `Updated Department: ${departmentCode} - ${dep.departmentNameTh}`,
  });

  saveStore(state);
  return { department: dep, departments: state.departments };
}

export function deleteDepartment(departmentCode: string, actorUsername = "ADMIN") {
  const state = loadStore();
  if (!state.departments) state.departments = buildDefaultDepartments();

  const idx = state.departments.findIndex((d) => d.departmentCode === departmentCode);
  if (idx === -1) {
    throw new Error(`ไม่พบกลุ่มงาน/แผนกรหัส '${departmentCode}'`);
  }

  const [removed] = state.departments.splice(idx, 1);

  appendAuditLog(state, {
    actorUsername,
    actorRole: "HOSPITAL_ADMIN",
    actionType: "DEPARTMENT_DELETED",
    entityType: "HOSPITAL_DEPARTMENT",
    entityId: departmentCode,
    payloadSummary: `Deleted Department: ${departmentCode} - ${removed.departmentNameTh}`,
  });

  saveStore(state);
  return { success: true, removed, departments: state.departments };
}

// ============================================================================
// DOCUMENT RUNNING NUMBERS ENGINE (CRUD & GENERATOR)
// ============================================================================

export function getRunningNumbers(): RunningNumberConfig[] {
  const state = loadStore();
  return state.runningNumbers || [];
}

export function createRunningNumber(input: {
  docTypeCode: string;
  docTypeName: string;
  prefix: string;
  formatPattern: string;
  yearType: RunningNumberConfig["yearType"];
  paddingDigits: number;
  currentNumber?: number;
  resetPolicy: RunningNumberConfig["resetPolicy"];
  description?: string;
  actorUsername?: string;
}) {
  const state = loadStore();
  if (!state.runningNumbers) state.runningNumbers = buildDefaultRunningNumbers();

  const code = input.docTypeCode.trim().toUpperCase();
  if (state.runningNumbers.some((r) => r.docTypeCode === code)) {
    throw new Error(`รหัสประเภทเอกสาร '${code}' มีการกำหนดเลขรันแล้ว`);
  }

  const samplePreview = formatRunningNumberSample({
    prefix: input.prefix.trim().toUpperCase(),
    formatPattern: input.formatPattern.trim(),
    yearType: input.yearType,
    paddingDigits: Number(input.paddingDigits) || 5,
    currentNumber: Number(input.currentNumber) || 0,
  });

  const newRule: RunningNumberConfig = {
    id: `RUN-CFG-${code}`,
    docTypeCode: code,
    docTypeName: input.docTypeName.trim(),
    prefix: input.prefix.trim().toUpperCase(),
    formatPattern: input.formatPattern.trim(),
    yearType: input.yearType,
    paddingDigits: Number(input.paddingDigits) || 5,
    currentNumber: Number(input.currentNumber) || 0,
    resetPolicy: input.resetPolicy,
    lastResetFiscalYear: 2569,
    samplePreview,
    description: input.description?.trim() || "",
    isActive: true,
    updatedAt: new Date().toISOString(),
  };

  state.runningNumbers.push(newRule);

  appendAuditLog(state, {
    actorUsername: input.actorUsername || "ADMIN",
    actorRole: "HOSPITAL_ADMIN",
    actionType: "RUNNING_NUMBER_CONFIG_CREATED",
    entityType: "DOCUMENT_RUNNING_RULE",
    entityId: code,
    payloadSummary: `Created Running Number Rule: ${code} (${newRule.docTypeName}) -> Format: ${newRule.formatPattern}`,
  });

  saveStore(state);
  return { rule: newRule, runningNumbers: state.runningNumbers };
}

export function updateRunningNumber(
  docTypeCode: string,
  input: Partial<RunningNumberConfig> & { actorUsername?: string }
) {
  const state = loadStore();
  if (!state.runningNumbers) state.runningNumbers = buildDefaultRunningNumbers();

  const rule = state.runningNumbers.find((r) => r.docTypeCode === docTypeCode);
  if (!rule) {
    throw new Error(`ไม่พบการตั้งค่าเลขรันสำหรับรหัสเอกสาร '${docTypeCode}'`);
  }

  if (input.docTypeName) rule.docTypeName = input.docTypeName.trim();
  if (input.prefix) rule.prefix = input.prefix.trim().toUpperCase();
  if (input.formatPattern) rule.formatPattern = input.formatPattern.trim();
  if (input.yearType) rule.yearType = input.yearType;
  if (input.paddingDigits !== undefined) rule.paddingDigits = Number(input.paddingDigits);
  if (input.currentNumber !== undefined) rule.currentNumber = Number(input.currentNumber);
  if (input.resetPolicy) rule.resetPolicy = input.resetPolicy;
  if (input.description !== undefined) rule.description = input.description.trim();
  if (input.isActive !== undefined) rule.isActive = input.isActive;

  rule.samplePreview = formatRunningNumberSample(rule);
  rule.updatedAt = new Date().toISOString();

  appendAuditLog(state, {
    actorUsername: input.actorUsername || "ADMIN",
    actorRole: "HOSPITAL_ADMIN",
    actionType: "RUNNING_NUMBER_CONFIG_UPDATED",
    entityType: "DOCUMENT_RUNNING_RULE",
    entityId: docTypeCode,
    payloadSummary: `Updated Running Number Rule: ${docTypeCode} -> CurrentNo: ${rule.currentNumber}, Format: ${rule.formatPattern}`,
  });

  saveStore(state);
  return { rule, runningNumbers: state.runningNumbers };
}

export function deleteRunningNumber(docTypeCode: string, actorUsername = "ADMIN") {
  const state = loadStore();
  if (!state.runningNumbers) state.runningNumbers = buildDefaultRunningNumbers();

  const idx = state.runningNumbers.findIndex((r) => r.docTypeCode === docTypeCode);
  if (idx === -1) {
    throw new Error(`ไม่พบการตั้งค่าเลขรันสำหรับรหัสเอกสาร '${docTypeCode}'`);
  }

  const [removed] = state.runningNumbers.splice(idx, 1);

  appendAuditLog(state, {
    actorUsername,
    actorRole: "HOSPITAL_ADMIN",
    actionType: "RUNNING_NUMBER_CONFIG_DELETED",
    entityType: "DOCUMENT_RUNNING_RULE",
    entityId: docTypeCode,
    payloadSummary: `Deleted Running Number Rule: ${docTypeCode} (${removed.docTypeName})`,
  });

  saveStore(state);
  return { success: true, removed, runningNumbers: state.runningNumbers };
}

export function generateNextNumber(input: {
  docTypeCode: string;
  departmentCode?: string;
  actorUsername?: string;
}) {
  const state = loadStore();
  if (!state.runningNumbers) state.runningNumbers = buildDefaultRunningNumbers();

  const rule = state.runningNumbers.find((r) => r.docTypeCode === input.docTypeCode && r.isActive);
  if (!rule) {
    throw new Error(`ไม่พบการตั้งค่าเลขรันที่ใช้งานได้สำหรับประเภทเอกสาร '${input.docTypeCode}'`);
  }

  rule.currentNumber = (rule.currentNumber || 0) + 1;
  const allocatedNumber = formatRunningNumberSample(rule, input.departmentCode || "MED");
  rule.samplePreview = formatRunningNumberSample(rule, input.departmentCode || "MED");
  rule.updatedAt = new Date().toISOString();

  appendAuditLog(state, {
    actorUsername: input.actorUsername || "SYSTEM",
    actorRole: "RUNNING_NUMBER_ENGINE",
    actionType: "DOCUMENT_NUMBER_ALLOCATED",
    entityType: "DOCUMENT_NUMBER",
    entityId: allocatedNumber,
    payloadSummary: `Allocated Running Number: ${allocatedNumber} for docType ${input.docTypeCode} (Dep: ${input.departmentCode || "CENTRAL"})`,
  });

  saveStore(state);
  return {
    allocatedNumber,
    docTypeCode: input.docTypeCode,
    sequenceValue: rule.currentNumber,
    rule,
  };
}

// ============================================================================
// MASTER DATA: HOSPITAL PERSONNEL & STAFF DIRECTORY (CRUD)
// ============================================================================

export function getPersonnel(filter?: {
  departmentCode?: string;
  personnelType?: string;
  search?: string;
}): HospitalPersonnel[] {
  const state = loadStore();
  let list = state.personnel || [];

  if (filter?.departmentCode && filter.departmentCode !== "ALL") {
    list = list.filter((p) => p.departmentCode === filter.departmentCode);
  }
  if (filter?.personnelType && filter.personnelType !== "ALL") {
    list = list.filter((p) => p.personnelType === filter.personnelType);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.firstNameTh.toLowerCase().includes(q) ||
        p.lastNameTh.toLowerCase().includes(q) ||
        p.staffCode.toLowerCase().includes(q) ||
        p.mophProviderId.toLowerCase().includes(q) ||
        p.positionTitle.toLowerCase().includes(q) ||
        (p.licenseNumber && p.licenseNumber.toLowerCase().includes(q))
    );
  }
  return list;
}

export function createPersonnel(input: {
  staffCode?: string;
  citizenId: string;
  mophProviderId?: string;
  titleTh: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  personnelType: HospitalPersonnel["personnelType"];
  positionTitle: string;
  departmentCode: string;
  licenseNumber?: string;
  email?: string;
  telephone?: string;
  isCommitteeEligible?: boolean;
  padesSignatureActive?: boolean;
  actorUsername?: string;
}) {
  const state = loadStore();
  if (!state.personnel) state.personnel = buildDefaultPersonnel();

  // If no staffCode given, auto-generate via EMP running number!
  let code = input.staffCode?.trim().toUpperCase();
  if (!code) {
    const nextSeq = generateNextNumber({ docTypeCode: "EMP", actorUsername: input.actorUsername });
    code = nextSeq.allocatedNumber;
  }

  if (state.personnel.some((p) => p.staffCode === code)) {
    throw new Error(`รหัสบุคลากร '${code}' มีอยู่ในระบบแล้ว`);
  }

  // Lookup department name
  const dep = (state.departments || []).find((d) => d.departmentCode === input.departmentCode);
  const depName = dep ? dep.departmentNameTh : input.departmentCode;

  // Auto-generate MOPH Provider ID if not provided
  const mophId =
    input.mophProviderId?.trim() ||
    `MOPH-10671-${code.replace(/[^A-Z0-9]/gi, "").slice(-6)}`;

  const newStaff: HospitalPersonnel = {
    id: `STAFF-${Date.now()}`,
    staffCode: code,
    citizenId: input.citizenId.trim(),
    mophProviderId: mophId,
    titleTh: input.titleTh.trim(),
    firstNameTh: input.firstNameTh.trim(),
    lastNameTh: input.lastNameTh.trim(),
    firstNameEn: input.firstNameEn?.trim() || "",
    lastNameEn: input.lastNameEn?.trim() || "",
    personnelType: input.personnelType,
    positionTitle: input.positionTitle.trim(),
    departmentCode: input.departmentCode,
    departmentName: depName,
    licenseNumber: input.licenseNumber?.trim() || "-",
    email: input.email?.trim() || `${code.toLowerCase()}@udonhospital.go.th`,
    telephone: input.telephone?.trim() || "-",
    isCommitteeEligible: input.isCommitteeEligible !== false,
    padesSignatureActive: input.padesSignatureActive !== false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.personnel.unshift(newStaff);

  appendAuditLog(state, {
    actorUsername: input.actorUsername || "ADMIN",
    actorRole: "HR_ADMIN",
    actionType: "PERSONNEL_CREATED",
    entityType: "HOSPITAL_PERSONNEL",
    entityId: newStaff.staffCode,
    payloadSummary: `Created Personnel: ${newStaff.staffCode} - ${newStaff.titleTh}${newStaff.firstNameTh} ${newStaff.lastNameTh} (${newStaff.positionTitle})`,
  });

  saveStore(state);
  return { personnel: newStaff, allPersonnel: state.personnel };
}

export function updatePersonnel(
  staffCode: string,
  input: Partial<HospitalPersonnel> & { actorUsername?: string }
) {
  const state = loadStore();
  if (!state.personnel) state.personnel = buildDefaultPersonnel();

  const staff = state.personnel.find((p) => p.staffCode === staffCode);
  if (!staff) {
    throw new Error(`ไม่พบบุคลากรรหัส '${staffCode}'`);
  }

  if (input.titleTh) staff.titleTh = input.titleTh.trim();
  if (input.firstNameTh) staff.firstNameTh = input.firstNameTh.trim();
  if (input.lastNameTh) staff.lastNameTh = input.lastNameTh.trim();
  if (input.firstNameEn !== undefined) staff.firstNameEn = input.firstNameEn.trim();
  if (input.lastNameEn !== undefined) staff.lastNameEn = input.lastNameEn.trim();
  if (input.personnelType) staff.personnelType = input.personnelType;
  if (input.positionTitle) staff.positionTitle = input.positionTitle.trim();
  if (input.departmentCode) {
    staff.departmentCode = input.departmentCode;
    const dep = (state.departments || []).find((d) => d.departmentCode === input.departmentCode);
    if (dep) staff.departmentName = dep.departmentNameTh;
  }
  if (input.licenseNumber !== undefined) staff.licenseNumber = input.licenseNumber.trim();
  if (input.mophProviderId) staff.mophProviderId = input.mophProviderId.trim();
  if (input.email !== undefined) staff.email = input.email.trim();
  if (input.telephone !== undefined) staff.telephone = input.telephone.trim();
  if (input.isCommitteeEligible !== undefined) staff.isCommitteeEligible = input.isCommitteeEligible;
  if (input.padesSignatureActive !== undefined) staff.padesSignatureActive = input.padesSignatureActive;
  if (input.isActive !== undefined) staff.isActive = input.isActive;
  staff.updatedAt = new Date().toISOString();

  appendAuditLog(state, {
    actorUsername: input.actorUsername || "ADMIN",
    actorRole: "HR_ADMIN",
    actionType: "PERSONNEL_UPDATED",
    entityType: "HOSPITAL_PERSONNEL",
    entityId: staffCode,
    payloadSummary: `Updated Personnel: ${staffCode} - ${staff.titleTh}${staff.firstNameTh} ${staff.lastNameTh}`,
  });

  saveStore(state);
  return { personnel: staff, allPersonnel: state.personnel };
}

export function deletePersonnel(staffCode: string, actorUsername = "ADMIN") {
  const state = loadStore();
  if (!state.personnel) state.personnel = buildDefaultPersonnel();

  const idx = state.personnel.findIndex((p) => p.staffCode === staffCode);
  if (idx === -1) {
    throw new Error(`ไม่พบบุคลากรรหัส '${staffCode}'`);
  }

  const [removed] = state.personnel.splice(idx, 1);

  appendAuditLog(state, {
    actorUsername,
    actorRole: "HR_ADMIN",
    actionType: "PERSONNEL_DELETED",
    entityType: "HOSPITAL_PERSONNEL",
    entityId: staffCode,
    payloadSummary: `Deleted Personnel: ${staffCode} - ${removed.titleTh}${removed.firstNameTh} ${removed.lastNameTh}`,
  });

  saveStore(state);
  return { success: true, removed, allPersonnel: state.personnel };
}
