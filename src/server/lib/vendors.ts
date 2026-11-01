import { loadStore, saveStore, appendAuditLog } from "./store";

export type HospitalVendorType = "GPO" | "GOV_AGENCY" | "PRIVATE_CORP" | "INDIVIDUAL";

export interface HospitalVendor {
  id: string;
  vendorCode: string;
  vendorTaxId: string;
  vendorNameTh: string;
  vendorNameEn?: string;
  vendorType: HospitalVendorType;
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
  blacklistedDate?: string;
  isActive: boolean;
  creditTermDays: number;
  createdAt: string;
  updatedAt?: string;
}

export function buildDefaultVendors(): HospitalVendor[] {
  return [
    {
      id: "VEND-001",
      vendorCode: "GPO-0001",
      vendorTaxId: "0994000164010",
      vendorNameTh: "องค์การเภสัชกรรม (Government Pharmaceutical Organization)",
      vendorNameEn: "The Government Pharmaceutical Organization (GPO)",
      vendorType: "GPO",
      isWhtExempt: true,
      whtExemptReason: "หน่วยงานของรัฐตาม พ.ร.บ. จัดตั้งองค์การเภสัชกรรม ได้รับยกเว้นภาษีหัก ณ ที่จ่ายตามประมวลรัษฎากร",
      contactPerson: "ฝ่ายขายและบริการหน่วยงานรัฐ",
      telephone: "02-203-8000",
      email: "order@gpo.or.th",
      address: "75/1 ถนนพระรามที่ 6 แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพมหานคร 10400",
      bankName: "ธนาคารกรุงไทย จำกัด (มหาชน)",
      bankAccountNo: "000-1-23456-7",
      bankBranch: "สาขากระทรวงสาธารณสุข",
      gfmisVendorCode: "GF-GPO-10001",
      egpSupplierId: "EGP-GPO-9940",
      isBlacklisted: false,
      isActive: true,
      creditTermDays: 60,
      createdAt: "2026-10-01T08:00:00Z",
    },
    {
      id: "VEND-002",
      vendorCode: "RED-0002",
      vendorTaxId: "0994000164109",
      vendorNameTh: "ศูนย์บริการโลหิตแห่งชาติ สภากาชาดไทย",
      vendorNameEn: "National Blood Centre, Thai Red Cross Society",
      vendorType: "GOV_AGENCY",
      isWhtExempt: true,
      whtExemptReason: "หน่วยงานสาธารณกุศลและองค์กรกาชาด ได้รับยกเว้นภาษีหัก ณ ที่จ่าย",
      contactPerson: "ฝ่ายจัดส่งโลหิตและผลิตภัณฑ์ชีววัตถุ",
      telephone: "02-256-4300",
      email: "blood@redcross.or.th",
      address: "1871 ถนนอังรีดูนังต์ แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330",
      bankName: "ธนาคารกรุงไทย จำกัด (มหาชน)",
      bankAccountNo: "045-6-78901-2",
      bankBranch: "สาขาสยามสแควร์",
      gfmisVendorCode: "GF-TRC-10002",
      egpSupplierId: "EGP-TRC-9941",
      isBlacklisted: false,
      isActive: true,
      creditTermDays: 30,
      createdAt: "2026-10-01T08:00:00Z",
    },
    {
      id: "VEND-003",
      vendorCode: "BIO-0003",
      vendorTaxId: "0105552098761",
      vendorNameTh: "บริษัท สยามไบโอไซเอนซ์ จำกัด",
      vendorNameEn: "Siam Bioscience Co., Ltd.",
      vendorType: "PRIVATE_CORP",
      isWhtExempt: false,
      contactPerson: "นายเกรียงไกร มั่นคง (ผู้จัดการฝ่ายจัดจำหน่าย)",
      telephone: "02-583-9999",
      email: "hospital_sales@siambioscience.com",
      address: "88 หมู่ 2 ถนนติวานนท์ ตำบลบางกระดี อำเภอเมืองปทุมธานี จังหวัดปทุมธานี 12000",
      bankName: "ธนาคารไทยพาณิชย์ จำกัด (มหาชน)",
      bankAccountNo: "111-2-33344-5",
      bankBranch: "สาขาถนนติวานนท์",
      gfmisVendorCode: "GF-PVT-20003",
      egpSupplierId: "EGP-BIO-5520",
      isBlacklisted: false,
      isActive: true,
      creditTermDays: 45,
      createdAt: "2026-10-01T08:00:00Z",
    },
    {
      id: "VEND-004",
      vendorCode: "BKK-0004",
      vendorTaxId: "0105531023456",
      vendorNameTh: "บริษัท กรุงเทพดรั๊ก แอนด์ เมดิคอล ซัพพลาย จำกัด",
      vendorNameEn: "Bangkok Drug & Medical Supply Co., Ltd.",
      vendorType: "PRIVATE_CORP",
      isWhtExempt: false,
      contactPerson: "นางสาวพิมลวรรณ สุขุมวิท",
      telephone: "02-390-1122",
      email: "order@bangkokdrug.co.th",
      address: "1023/1 ถนนสุขุมวิท 71 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110",
      bankName: "ธนาคารกสิกรไทย จำกัด (มหาชน)",
      bankAccountNo: "789-2-01234-5",
      bankBranch: "สาขาคลองตัน",
      gfmisVendorCode: "GF-PVT-20004",
      egpSupplierId: "EGP-BKK-3102",
      isBlacklisted: false,
      isActive: true,
      creditTermDays: 30,
      createdAt: "2026-10-01T08:00:00Z",
    },
    {
      id: "VEND-005",
      vendorCode: "MED-0005",
      vendorTaxId: "0105548076543",
      vendorNameTh: "บริษัท เมดิคอล อีควิปเมนท์ แอนด์ เซอร์วิส จำกัด",
      vendorNameEn: "Medical Equipment & Service Co., Ltd.",
      vendorType: "PRIVATE_CORP",
      isWhtExempt: false,
      contactPerson: "วิศวกรบริการ สมเกียรติ ยิ่งเจริญ",
      telephone: "02-888-7766",
      email: "service@medicequip.co.th",
      address: "456 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ 10400",
      bankName: "ธนาคารกรุงเทพ จำกัด (มหาชน)",
      bankAccountNo: "222-3-44455-6",
      bankBranch: "สาขาประตูน้ำ",
      gfmisVendorCode: "GF-PVT-20005",
      egpSupplierId: "EGP-MED-4807",
      isBlacklisted: false,
      isActive: true,
      creditTermDays: 60,
      createdAt: "2026-10-01T08:00:00Z",
    },
  ];
}

export function getVendors(): HospitalVendor[] {
  const state = loadStore() as any;
  if (!state.vendors || state.vendors.length === 0) {
    state.vendors = buildDefaultVendors();
    saveStore(state);
  }
  return state.vendors;
}

export function createVendor(input: Partial<HospitalVendor> & { actorUsername?: string }): { vendor: HospitalVendor; all: HospitalVendor[] } {
  const state = loadStore() as any;
  if (!state.vendors) state.vendors = buildDefaultVendors();

  if (!input.vendorTaxId || !input.vendorNameTh) {
    throw new Error("กรุณาระบุเลขประจำตัวผู้เสียภาษี 13 หลัก และชื่อบริษัท/นิติบุคคลคู่ค้า");
  }

  const taxId = input.vendorTaxId.replace(/[^0-9]/g, "");
  const exists = state.vendors.some((v: HospitalVendor) => v.vendorTaxId === taxId);
  if (exists) {
    throw new Error(`คู่ค้าเลขประจำตัวผู้เสียภาษี '${taxId}' มีอยู่ในระบบแล้ว`);
  }

  const nextCodeNum = state.vendors.length + 1;
  const vendorCode = `VEND-${String(nextCodeNum).padStart(4, "0")}`;

  const isExempt = input.vendorType === "GPO" || input.vendorType === "GOV_AGENCY";

  const newVendor: HospitalVendor = {
    id: `VEND-${Date.now().toString().slice(-4)}`,
    vendorCode,
    vendorTaxId: taxId,
    vendorNameTh: input.vendorNameTh.trim(),
    vendorNameEn: input.vendorNameEn ? input.vendorNameEn.trim() : "",
    vendorType: input.vendorType || "PRIVATE_CORP",
    isWhtExempt: isExempt,
    whtExemptReason: isExempt ? "หน่วยงานของรัฐ/องค์กรสาธารณกุศล ได้รับยกเว้นภาษีหัก ณ ที่จ่าย" : undefined,
    contactPerson: input.contactPerson ? input.contactPerson.trim() : "",
    telephone: input.telephone ? input.telephone.trim() : "",
    email: input.email ? input.email.trim() : "",
    address: input.address ? input.address.trim() : "",
    bankName: input.bankName || "ธนาคารกรุงไทย จำกัด (มหาชน)",
    bankAccountNo: input.bankAccountNo ? input.bankAccountNo.trim() : "",
    bankBranch: input.bankBranch ? input.bankBranch.trim() : "",
    gfmisVendorCode: input.gfmisVendorCode || `GF-${taxId.slice(-6)}`,
    egpSupplierId: input.egpSupplierId || `EGP-${taxId.slice(-4)}`,
    isBlacklisted: false,
    isActive: true,
    creditTermDays: Number(input.creditTermDays) || 30,
    createdAt: new Date().toISOString(),
  };

  state.vendors.unshift(newVendor);
  appendAuditLog(state, {
    actorUsername: input.actorUsername || "ADMIN",
    actorRole: "PROCUREMENT_ADMIN",
    actionType: "VENDOR_CREATED",
    entityType: "HOSPITAL_VENDOR",
    entityId: newVendor.vendorCode,
    payloadSummary: `Created Vendor: ${newVendor.vendorCode} - ${newVendor.vendorNameTh} (${newVendor.vendorTaxId})`,
  });

  saveStore(state);
  return { vendor: newVendor, all: state.vendors };
}

export function updateVendor(vendorCode: string, input: Partial<HospitalVendor> & { actorUsername?: string }) {
  const state = loadStore() as any;
  if (!state.vendors) state.vendors = buildDefaultVendors();

  const v = state.vendors.find((item: HospitalVendor) => item.vendorCode === vendorCode);
  if (!v) throw new Error(`ไม่พบคู่ค้ารหัส '${vendorCode}'`);

  if (input.vendorNameTh) v.vendorNameTh = input.vendorNameTh.trim();
  if (input.vendorNameEn !== undefined) v.vendorNameEn = input.vendorNameEn.trim();
  if (input.vendorType) {
    v.vendorType = input.vendorType;
    v.isWhtExempt = input.vendorType === "GPO" || input.vendorType === "GOV_AGENCY";
  }
  if (input.contactPerson !== undefined) v.contactPerson = input.contactPerson.trim();
  if (input.telephone !== undefined) v.telephone = input.telephone.trim();
  if (input.email !== undefined) v.email = input.email.trim();
  if (input.address !== undefined) v.address = input.address.trim();
  if (input.bankName !== undefined) v.bankName = input.bankName.trim();
  if (input.bankAccountNo !== undefined) v.bankAccountNo = input.bankAccountNo.trim();
  if (input.bankBranch !== undefined) v.bankBranch = input.bankBranch.trim();
  if (input.creditTermDays !== undefined) v.creditTermDays = Number(input.creditTermDays);
  if (input.isBlacklisted !== undefined) {
    v.isBlacklisted = input.isBlacklisted;
    v.blacklistedReason = input.blacklistedReason;
    v.blacklistedDate = input.isBlacklisted ? new Date().toISOString() : undefined;
  }
  if (input.isActive !== undefined) v.isActive = input.isActive;
  v.updatedAt = new Date().toISOString();

  appendAuditLog(state, {
    actorUsername: input.actorUsername || "ADMIN",
    actorRole: "PROCUREMENT_ADMIN",
    actionType: "VENDOR_UPDATED",
    entityType: "HOSPITAL_VENDOR",
    entityId: vendorCode,
    payloadSummary: `Updated Vendor: ${vendorCode} - ${v.vendorNameTh}`,
  });

  saveStore(state);
  return { vendor: v, all: state.vendors };
}

export function deleteVendor(vendorCode: string, actorUsername = "ADMIN") {
  const state = loadStore() as any;
  if (!state.vendors) state.vendors = buildDefaultVendors();

  const idx = state.vendors.findIndex((v: HospitalVendor) => v.vendorCode === vendorCode);
  if (idx === -1) throw new Error(`ไม่พบคู่ค้ารหัส '${vendorCode}'`);

  const [removed] = state.vendors.splice(idx, 1);
  appendAuditLog(state, {
    actorUsername,
    actorRole: "PROCUREMENT_ADMIN",
    actionType: "VENDOR_DELETED",
    entityType: "HOSPITAL_VENDOR",
    entityId: vendorCode,
    payloadSummary: `Deleted Vendor: ${vendorCode} - ${removed.vendorNameTh}`,
  });

  saveStore(state);
  return { success: true, removed, all: state.vendors };
}
