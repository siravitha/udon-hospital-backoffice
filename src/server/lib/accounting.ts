import { loadStore, saveStore, appendAuditLog, LiveStoreState } from "./store";

export type AccountCategory = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface ChartOfAccount {
  accountCode: string;
  accountNameTh: string;
  accountNameEn: string;
  category: AccountCategory;
  categoryNameTh: string;
  normalBalance: "DEBIT" | "CREDIT";
  openingBalance: number;
  description: string;
  isActive: boolean;
}

export interface JournalLine {
  accountCode: string;
  accountNameTh: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  journalNo: string;
  entryDate: string;
  docReference: string;
  fundCode: string;
  description: string;
  sourceModule: "DISBURSEMENT_3WAY" | "INVENTORY_RECEIVING" | "MANUAL_ADJUSTMENT" | "BUDGET_RECOGNITION";
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  postedBy: string;
  postedAt: string;
}

export function buildDefaultChartOfAccounts(): ChartOfAccount[] {
  return [
    // 1. สินทรัพย์ (Assets)
    {
      accountCode: "110101",
      accountNameTh: "เงินสดและเงินทดรองราชการ",
      accountNameEn: "Cash & Petty Cash",
      category: "ASSET",
      categoryNameTh: "สินทรัพย์หมุนเวียน",
      normalBalance: "DEBIT",
      openingBalance: 500000.0,
      description: "เงินสดและเงินสดย่อยสำรองจ่ายฉุกเฉินในโรงพยาบาล",
      isActive: true,
    },
    {
      accountCode: "110201",
      accountNameTh: "เงินฝากธนาคาร - เงินบำรุงโรงพยาบาล",
      accountNameEn: "Cash at Bank - Maintenance Fund",
      category: "ASSET",
      categoryNameTh: "สินทรัพย์หมุนเวียน",
      normalBalance: "DEBIT",
      openingBalance: 45000000.0,
      description: "บัญชีกระแสรายวันเงินบำรุงโรงพยาบาลที่เบิกจ่ายคู่ค้า",
      isActive: true,
    },
    {
      accountCode: "110401",
      accountNameTh: "เวชภัณฑ์ยาและเคมีภัณฑ์คงคลัง",
      accountNameEn: "Drug & Pharmaceutical Inventory",
      category: "ASSET",
      categoryNameTh: "สินทรัพย์หมุนเวียน",
      normalBalance: "DEBIT",
      openingBalance: 24500000.0,
      description: "สต็อกยาและเวชภัณฑ์ในคลังยากลาง (ประเมินด้วยวิธี FIFO/FEFO)",
      isActive: true,
    },
    {
      accountCode: "110402",
      accountNameTh: "วัสดุการแพทย์และวิทยาศาสตร์คงคลัง",
      accountNameEn: "Medical & Lab Supplies Inventory",
      category: "ASSET",
      categoryNameTh: "สินทรัพย์หมุนเวียน",
      normalBalance: "DEBIT",
      openingBalance: 12800000.0,
      description: "สต็อกน้ำยาตรวจวิเคราะห์และอุปกรณ์การแพทย์คงคลัง",
      isActive: true,
    },
    {
      accountCode: "120101",
      accountNameTh: "ลูกหนี้ค่ารักษาพยาบาล - สปสช. (UC)",
      accountNameEn: "AR - National Health Security Office (UC)",
      category: "ASSET",
      categoryNameTh: "สินทรัพย์หมุนเวียน",
      normalBalance: "DEBIT",
      openingBalance: 38200000.0,
      description: "ลูกหนี้เรียกเก็บค่ารักษาพยาบาลสิทธิหลักประกันสุขภาพถ้วนหน้า",
      isActive: true,
    },
    {
      accountCode: "140101",
      accountNameTh: "ครุภัณฑ์การแพทย์และวิทยาศาสตร์",
      accountNameEn: "Medical Equipment",
      category: "ASSET",
      categoryNameTh: "สินทรัพย์ไม่หมุนเวียน",
      normalBalance: "DEBIT",
      openingBalance: 185000000.0,
      description: "เครื่องมือแพทย์ เครื่องช่วยหายใจ CT Scan MRI ในโรงพยาบาล",
      isActive: true,
    },
    {
      accountCode: "140102",
      accountNameTh: "ค่าเสื่อมราคาสะสม - ครุภัณฑ์การแพทย์",
      accountNameEn: "Accumulated Depreciation - Medical Equipment",
      category: "ASSET",
      categoryNameTh: "สินทรัพย์ไม่หมุนเวียน (หักลบ)",
      normalBalance: "CREDIT",
      openingBalance: 42500000.0,
      description: "ค่าเสื่อมราคาสะสมคิดตามวิธีเส้นตรงอายุ 5-10 ปี",
      isActive: true,
    },

    // 2. หนี้สิน (Liabilities)
    {
      accountCode: "210101",
      accountNameTh: "เจ้าหนี้การค้า - เวชภัณฑ์และยา",
      accountNameEn: "Accounts Payable - Pharma & Medical",
      category: "LIABILITY",
      categoryNameTh: "หนี้สินหมุนเวียน",
      normalBalance: "CREDIT",
      openingBalance: 18900000.0,
      description: "ภาระหนี้ค้างจ่ายองค์การเภสัชกรรม (GPO) และบริษัทยาเอกชน",
      isActive: true,
    },
    {
      accountCode: "210201",
      accountNameTh: "ภาษีเงินได้หัก ณ ที่จ่ายค้างจ่าย (ภ.ง.ด. 53)",
      accountNameEn: "Withholding Tax Payable (1%)",
      category: "LIABILITY",
      categoryNameTh: "หนี้สินหมุนเวียน",
      normalBalance: "CREDIT",
      openingBalance: 145000.0,
      description: "ภาษีหัก 1% จากฐาน Ex-VAT รอนำส่งกรมสรรพากรภายในวันที่ 7 ของเดือนถัดไป",
      isActive: true,
    },
    {
      accountCode: "210301",
      accountNameTh: "เงินประกันสัญญาค้างจ่าย (Performance Bond Deposit)",
      accountNameEn: "Retention & Contract Guarantee Deposit",
      category: "LIABILITY",
      categoryNameTh: "หนี้สินหมุนเวียน",
      normalBalance: "CREDIT",
      openingBalance: 4200000.0,
      description: "เงินสดหรือหลักประกัน e-LG 5% ของคู่สัญญา รอคืนเมื่อครบกำหนดประกัน",
      isActive: true,
    },

    // 3. ส่วนของทุน / เงินทุนสะสม (Equity / Fund Balance)
    {
      accountCode: "310101",
      accountNameTh: "เงินทุนสะสมโรงพยาบาล (Hospital Retained Earnings)",
      accountNameEn: "Hospital Accumulated Reserve Fund",
      category: "EQUITY",
      categoryNameTh: "ทุนและกองทุนสะสม",
      normalBalance: "CREDIT",
      openingBalance: 240755000.0,
      description: "ส่วนเกินรายได้สะสมของเงินบำรุงโรงพยาบาล",
      isActive: true,
    },

    // 4. รายได้ (Revenue)
    {
      accountCode: "410101",
      accountNameTh: "รายได้ค่ารักษาพยาบาล - เงินงบประมาณ สปสช. (UC)",
      accountNameEn: "Medical Revenue - NHSO Fund",
      category: "REVENUE",
      categoryNameTh: "รายได้จากการดำเนินงาน",
      normalBalance: "CREDIT",
      openingBalance: 0.0,
      description: "รายได้เงินจัดสรรเหมาจ่ายรายหัวและค่าบริการผู้ป่วยใน IPD/OPD",
      isActive: true,
    },
    {
      accountCode: "430101",
      accountNameTh: "รายได้ค่าปรับผู้ขายผิดสัญญาจัดซื้อจัดจ้าง",
      accountNameEn: "Penalty & Liquidated Damages Revenue",
      category: "REVENUE",
      categoryNameTh: "รายได้อื่น",
      normalBalance: "CREDIT",
      openingBalance: 0.0,
      description: "ค่าปรับส่งมอบพัสดุล่าช้าที่หักจากใบสำคัญเบิกจ่ายเข้าเงินบำรุง",
      isActive: true,
    },

    // 5. ค่าใช้จ่าย (Expenses)
    {
      accountCode: "510101",
      accountNameTh: "ค่าใช้จ่ายยาและเวชภัณฑ์รักษาพยาบาล",
      accountNameEn: "Pharmaceutical & Clinical Consumption Expense",
      category: "EXPENSE",
      categoryNameTh: "ต้นทุนบริการทางการแพทย์",
      normalBalance: "DEBIT",
      openingBalance: 0.0,
      description: "ต้นทุนยาและเวชภัณฑ์ที่จ่ายตัดใช้ออกจากคลังให้ผู้ป่วย",
      isActive: true,
    },
    {
      accountCode: "510201",
      accountNameTh: "ค่าเสื่อมราคา - ครุภัณฑ์การแพทย์และวิทยาศาสตร์",
      accountNameEn: "Depreciation Expense - Medical Equipment",
      category: "EXPENSE",
      categoryNameTh: "ค่าใช้จ่ายดำเนินงาน",
      normalBalance: "DEBIT",
      openingBalance: 0.0,
      description: "ค่าเสื่อมราคารายเดือนตัดจ่ายตามมาตรฐานการบัญชีภาครัฐ",
      isActive: true,
    },
  ];
}

export function buildDefaultJournalEntries(): JournalEntry[] {
  return [
    {
      id: "GL-2569-0001",
      journalNo: "JV-2569-0001",
      entryDate: "2026-10-15",
      docReference: "PV-10671-2569-0001",
      fundCode: "HOSPITAL_MAINTENANCE",
      description: "บันทึกจ่ายชำระหนี้ค่ายา Meropenem Injection ให้ บจก. สยามไบโอไซเอนซ์ (3-Way Match & หักค่าปรับล่าช้า)",
      sourceModule: "DISBURSEMENT_3WAY",
      lines: [
        {
          accountCode: "210101",
          accountNameTh: "เจ้าหนี้การค้า - เวชภัณฑ์และยา",
          debit: 1070000.0,
          credit: 0,
        },
        {
          accountCode: "110201",
          accountNameTh: "เงินฝากธนาคาร - เงินบำรุงโรงพยาบาล",
          debit: 0,
          credit: 1010000.0,
        },
        {
          accountCode: "210201",
          accountNameTh: "ภาษีเงินได้หัก ณ ที่จ่ายค้างจ่าย (ภ.ง.ด. 53)",
          debit: 0,
          credit: 10000.0,
        },
        {
          accountCode: "430101",
          accountNameTh: "รายได้ค่าปรับผู้ขายผิดสัญญาจัดซื้อจัดจ้าง",
          debit: 0,
          credit: 50000.0,
        },
      ],
      totalDebit: 1070000.0,
      totalCredit: 1070000.0,
      isPosted: true,
      postedBy: "นางสาวศิริพร บุญมั่น (นักวิชาการเงินและบัญชี)",
      postedAt: "2026-10-15T14:30:00Z",
    },
    {
      id: "GL-2569-0002",
      journalNo: "JV-2569-0002",
      entryDate: "2026-10-20",
      docReference: "GRN-10671-2569-0002",
      fundCode: "GOV_BUDGET",
      description: "ตรวจรับยา Paracetamol Syrup 60ml จำนวน 2,000 ขวด จากองค์การเภสัชกรรม (GPO) เข้าคลังยากลาง",
      sourceModule: "INVENTORY_RECEIVING",
      lines: [
        {
          accountCode: "110401",
          accountNameTh: "เวชภัณฑ์ยาและเคมีภัณฑ์คงคลัง",
          debit: 120000.0,
          credit: 0,
        },
        {
          accountCode: "210101",
          accountNameTh: "เจ้าหนี้การค้า - เวชภัณฑ์และยา",
          debit: 0,
          credit: 120000.0,
        },
      ],
      totalDebit: 120000.0,
      totalCredit: 120000.0,
      isPosted: true,
      postedBy: "นายอนันต์ เกียรติดำรง (หัวหน้างานการบัญชี)",
      postedAt: "2026-10-20T11:15:00Z",
    },
    {
      id: "GL-2569-0003",
      journalNo: "JV-2569-0003",
      entryDate: "2026-10-28",
      docReference: "PV-10671-2569-0003",
      fundCode: "GOV_BUDGET",
      description: "เบิกจ่ายค่าเวชภัณฑ์ผ่าตัดห้อง OR ประจำงวด ให้องค์การเภสัชกรรม (GPO ยกเว้น WHT 1% ตามกฎหมาย)",
      sourceModule: "DISBURSEMENT_3WAY",
      lines: [
        {
          accountCode: "210101",
          accountNameTh: "เจ้าหนี้การค้า - เวชภัณฑ์และยา",
          debit: 120000.0,
          credit: 0,
        },
        {
          accountCode: "110201",
          accountNameTh: "เงินฝากธนาคาร - เงินบำรุงโรงพยาบาล",
          debit: 0,
          credit: 120000.0,
        },
      ],
      totalDebit: 120000.0,
      totalCredit: 120000.0,
      isPosted: true,
      postedBy: "นางสาวศิริพร บุญมั่น (นักวิชาการเงินและบัญชี)",
      postedAt: "2026-10-28T16:00:00Z",
    },
  ];
}

// Ensure in store
export function getChartOfAccounts(): ChartOfAccount[] {
  const state = loadStore() as any;
  if (!state.chartOfAccounts || state.chartOfAccounts.length === 0) {
    state.chartOfAccounts = buildDefaultChartOfAccounts();
    saveStore(state);
  }
  return state.chartOfAccounts;
}

export function createChartOfAccount(input: ChartOfAccount & { actorUsername?: string }): { account: ChartOfAccount; all: ChartOfAccount[] } {
  const state = loadStore() as any;
  if (!state.chartOfAccounts) state.chartOfAccounts = buildDefaultChartOfAccounts();

  const exists = state.chartOfAccounts.some((a: ChartOfAccount) => a.accountCode === input.accountCode.trim());
  if (exists) {
    throw new Error(`รหัสบัญชี '${input.accountCode}' มีอยู่ในระบบแล้ว`);
  }

  const newAccount: ChartOfAccount = {
    accountCode: input.accountCode.trim(),
    accountNameTh: input.accountNameTh.trim(),
    accountNameEn: input.accountNameEn ? input.accountNameEn.trim() : "",
    category: input.category,
    categoryNameTh:
      input.category === "ASSET"
        ? "สินทรัพย์"
        : input.category === "LIABILITY"
        ? "หนี้สิน"
        : input.category === "EQUITY"
        ? "ส่วนของทุน"
        : input.category === "REVENUE"
        ? "รายได้"
        : "ค่าใช้จ่าย",
    normalBalance: input.normalBalance,
    openingBalance: Number(input.openingBalance) || 0,
    description: input.description ? input.description.trim() : "",
    isActive: true,
  };

  state.chartOfAccounts.push(newAccount);
  saveStore(state);
  return { account: newAccount, all: state.chartOfAccounts };
}

export function getJournalEntries(): JournalEntry[] {
  const state = loadStore() as any;
  if (!state.journalEntries || state.journalEntries.length === 0) {
    state.journalEntries = buildDefaultJournalEntries();
    saveStore(state);
  }
  return state.journalEntries;
}

export function createJournalEntry(input: {
  entryDate: string;
  docReference: string;
  fundCode: string;
  description: string;
  lines: JournalLine[];
  actorUsername?: string;
}): { entry: JournalEntry; all: JournalEntry[] } {
  const state = loadStore() as any;
  if (!state.journalEntries) state.journalEntries = buildDefaultJournalEntries();

  const totalDebit = input.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = input.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`ยอดเดบิต (${totalDebit.toLocaleString()} บาท) ไม่เท่ากับเครดิต (${totalCredit.toLocaleString()} บาท) ตามหลักการบัญชีคู่`);
  }

  const nextId = state.journalEntries.length + 1;
  const journalNo = `JV-2569-${String(nextId).padStart(4, "0")}`;

  const newEntry: JournalEntry = {
    id: `GL-2569-${String(nextId).padStart(4, "0")}`,
    journalNo,
    entryDate: input.entryDate || new Date().toISOString().slice(0, 10),
    docReference: input.docReference,
    fundCode: input.fundCode || "HOSPITAL_MAINTENANCE",
    description: input.description,
    sourceModule: "MANUAL_ADJUSTMENT",
    lines: input.lines,
    totalDebit,
    totalCredit,
    isPosted: true,
    postedBy: input.actorUsername || "เจ้าหน้าที่การเงินและบัญชี",
    postedAt: new Date().toISOString(),
  };

  state.journalEntries.unshift(newEntry);
  saveStore(state);
  return { entry: newEntry, all: state.journalEntries };
}

export interface TrialBalanceRow {
  accountCode: string;
  accountNameTh: string;
  category: AccountCategory;
  categoryNameTh: string;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export function getTrialBalance(): {
  rows: TrialBalanceRow[];
  totalMovementDebit: number;
  totalMovementCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
} {
  const coa = getChartOfAccounts();
  const entries = getJournalEntries().filter((e) => e.isPosted);

  // Accumulate movements
  const movements: Record<string, { debit: number; credit: number }> = {};
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!movements[line.accountCode]) {
        movements[line.accountCode] = { debit: 0, credit: 0 };
      }
      movements[line.accountCode].debit += line.debit || 0;
      movements[line.accountCode].credit += line.credit || 0;
    }
  }

  let totalMovementDebit = 0;
  let totalMovementCredit = 0;
  let totalClosingDebit = 0;
  let totalClosingCredit = 0;

  const rows: TrialBalanceRow[] = coa.map((ac) => {
    const mov = movements[ac.accountCode] || { debit: 0, credit: 0 };
    totalMovementDebit += mov.debit;
    totalMovementCredit += mov.credit;

    const openingDebit = ac.normalBalance === "DEBIT" ? ac.openingBalance : 0;
    const openingCredit = ac.normalBalance === "CREDIT" ? ac.openingBalance : 0;

    let closingDebit = 0;
    let closingCredit = 0;

    if (ac.normalBalance === "DEBIT") {
      const net = openingDebit + mov.debit - mov.credit;
      if (net >= 0) closingDebit = net;
      else closingCredit = -net;
    } else {
      const net = openingCredit + mov.credit - mov.debit;
      if (net >= 0) closingCredit = net;
      else closingDebit = -net;
    }

    totalClosingDebit += closingDebit;
    totalClosingCredit += closingCredit;

    return {
      accountCode: ac.accountCode,
      accountNameTh: ac.accountNameTh,
      category: ac.category,
      categoryNameTh: ac.categoryNameTh,
      openingDebit,
      openingCredit,
      movementDebit: mov.debit,
      movementCredit: mov.credit,
      closingDebit,
      closingCredit,
    };
  });

  return {
    rows,
    totalMovementDebit: Number(totalMovementDebit.toFixed(2)),
    totalMovementCredit: Number(totalMovementCredit.toFixed(2)),
    totalClosingDebit: Number(totalClosingDebit.toFixed(2)),
    totalClosingCredit: Number(totalClosingCredit.toFixed(2)),
    isBalanced: Math.abs(totalClosingDebit - totalClosingCredit) < 1.0,
  };
}

