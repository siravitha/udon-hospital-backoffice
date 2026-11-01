import { NextResponse } from "next/server";
import {
  getPersonnel,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  getDepartments,
} from "@/server/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const departmentCode = url.searchParams.get("department") || undefined;
  const personnelType = url.searchParams.get("type") || undefined;
  const search = url.searchParams.get("q") || undefined;

  const list = getPersonnel({ departmentCode, personnelType, search });
  const departments = getDepartments();

  // Apply PDPA Citizen ID masking: 1100200345671 -> 1-1002-XXXXX-71
  const maskedList = list.map((p) => {
    const raw = p.citizenId || "";
    const masked =
      raw.length === 13
        ? `${raw[0]}-${raw.slice(1, 5)}-XXXXX-${raw.slice(11)}`
        : "XXXXXXXXXXXXX";
    return {
      ...p,
      citizenIdMasked: masked,
    };
  });

  return NextResponse.json({
    ok: true,
    personnel: maskedList,
    departments,
    total: maskedList.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.firstNameTh || !body.lastNameTh || !body.departmentCode || !body.positionTitle || !body.personnelType) {
      return NextResponse.json(
        { ok: false, error: "กรุณาระบุข้อมูลจำเป็น: ชื่อ, นามสกุล, สังกัดแผนก, ตำแหน่ง และประเภทบุคลากร" },
        { status: 400 }
      );
    }

    const result = createPersonnel({
      staffCode: body.staffCode,
      citizenId: body.citizenId || "1100000000000",
      mophProviderId: body.mophProviderId,
      titleTh: body.titleTh || "นาย",
      firstNameTh: body.firstNameTh,
      lastNameTh: body.lastNameTh,
      firstNameEn: body.firstNameEn,
      lastNameEn: body.lastNameEn,
      personnelType: body.personnelType,
      positionTitle: body.positionTitle,
      departmentCode: body.departmentCode,
      licenseNumber: body.licenseNumber,
      email: body.email,
      telephone: body.telephone,
      isCommitteeEligible: body.isCommitteeEligible,
      padesSignatureActive: body.padesSignatureActive,
      actorUsername: body.actorUsername || "เจ้าหน้าที่บริหารงานบุคคล (MOPH Admin)",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.staffCode) {
      return NextResponse.json({ ok: false, error: "กรุณาระบุรหัสบุคลากรที่ต้องการแก้ไข (staffCode)" }, { status: 400 });
    }

    const result = updatePersonnel(body.staffCode, {
      titleTh: body.titleTh,
      firstNameTh: body.firstNameTh,
      lastNameTh: body.lastNameTh,
      firstNameEn: body.firstNameEn,
      lastNameEn: body.lastNameEn,
      personnelType: body.personnelType,
      positionTitle: body.positionTitle,
      departmentCode: body.departmentCode,
      licenseNumber: body.licenseNumber,
      mophProviderId: body.mophProviderId,
      email: body.email,
      telephone: body.telephone,
      isCommitteeEligible: body.isCommitteeEligible,
      padesSignatureActive: body.padesSignatureActive,
      isActive: body.isActive,
      actorUsername: body.actorUsername || "เจ้าหน้าที่บริหารงานบุคคล",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ ok: false, error: "กรุณาระบุรหัสบุคลากรที่ต้องการลบ (?code=...)" }, { status: 400 });
    }

    const result = deletePersonnel(code, "เจ้าหน้าที่บริหารงานบุคคล");
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
