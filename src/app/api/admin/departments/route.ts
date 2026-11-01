import { NextResponse } from "next/server";
import {
  getMissionGroups,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/server/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const groupCode = url.searchParams.get("group") || undefined;

  const groups = getMissionGroups();
  const departments = getDepartments(groupCode);

  return NextResponse.json({
    ok: true,
    groups,
    departments,
    total: departments.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.departmentCode || !body.groupCode || !body.departmentNameTh || !body.costCenterCode) {
      return NextResponse.json(
        { ok: false, error: "กรุณาระบุข้อมูลจำเป็น: รหัสแผนก, กลุ่มภารกิจ, ชื่อแผนก (ไทย), และรหัสศูนย์ต้นทุน" },
        { status: 400 }
      );
    }

    const result = createDepartment({
      departmentCode: body.departmentCode,
      groupCode: body.groupCode,
      departmentNameTh: body.departmentNameTh,
      departmentNameEn: body.departmentNameEn,
      costCenterCode: body.costCenterCode,
      headName: body.headName,
      telephone: body.telephone,
      locationBuilding: body.locationBuilding,
      floorNumber: body.floorNumber,
      isProcurementAuthorized: body.isProcurementAuthorized,
      actorUsername: body.actorUsername || "ผอ. โรงพยาบาลศูนย์ (MOPH ID Verified)",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.departmentCode) {
      return NextResponse.json({ ok: false, error: "กรุณาระบุรหัสแผนกที่ต้องการแก้ไข" }, { status: 400 });
    }

    const result = updateDepartment(body.departmentCode, {
      departmentNameTh: body.departmentNameTh,
      departmentNameEn: body.departmentNameEn,
      groupCode: body.groupCode,
      costCenterCode: body.costCenterCode,
      headName: body.headName,
      telephone: body.telephone,
      locationBuilding: body.locationBuilding,
      floorNumber: body.floorNumber,
      isProcurementAuthorized: body.isProcurementAuthorized,
      isActive: body.isActive,
      actorUsername: body.actorUsername || "แอดมินระบบโรงพยาบาล",
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
      return NextResponse.json({ ok: false, error: "กรุณาระบุรหัสแผนกที่ต้องการลบ (?code=...)" }, { status: 400 });
    }

    const result = deleteDepartment(code, "แอดมินระบบโรงพยาบาล");
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
