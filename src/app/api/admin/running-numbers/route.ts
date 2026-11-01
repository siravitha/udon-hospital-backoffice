import { NextResponse } from "next/server";
import {
  getRunningNumbers,
  createRunningNumber,
  updateRunningNumber,
  deleteRunningNumber,
  generateNextNumber,
} from "@/server/lib/store";

export async function GET() {
  const rules = getRunningNumbers();
  return NextResponse.json({
    ok: true,
    runningNumbers: rules,
    total: rules.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a test/generate request
    if (body.action === "GENERATE_NEXT") {
      if (!body.docTypeCode) {
        return NextResponse.json({ ok: false, error: "กรุณาระบุรหัสประเภทเอกสาร (docTypeCode)" }, { status: 400 });
      }

      const result = generateNextNumber({
        docTypeCode: body.docTypeCode,
        departmentCode: body.departmentCode || "MED",
        actorUsername: body.actorUsername || "เจ้าหน้าที่พัสดุ (MOPH ID Verified)",
      });

      return NextResponse.json({ ok: true, ...result });
    }

    // Otherwise, create new Running Number rule
    if (!body.docTypeCode || !body.docTypeName || !body.prefix || !body.formatPattern) {
      return NextResponse.json(
        { ok: false, error: "กรุณาระบุข้อมูลจำเป็น: รหัสประเภทเอกสาร, ชื่อเอกสาร, คำขึ้นต้น (Prefix), และรูปแบบเลขรัน (Format)" },
        { status: 400 }
      );
    }

    const result = createRunningNumber({
      docTypeCode: body.docTypeCode,
      docTypeName: body.docTypeName,
      prefix: body.prefix,
      formatPattern: body.formatPattern,
      yearType: body.yearType || "BE_4",
      paddingDigits: Number(body.paddingDigits) || 5,
      currentNumber: Number(body.currentNumber) || 0,
      resetPolicy: body.resetPolicy || "YEARLY",
      description: body.description,
      actorUsername: body.actorUsername || "แอดมินระบบโรงพยาบาล",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.docTypeCode) {
      return NextResponse.json({ ok: false, error: "กรุณาระบุรหัสประเภทเอกสารที่ต้องการแก้ไข" }, { status: 400 });
    }

    const result = updateRunningNumber(body.docTypeCode, {
      docTypeName: body.docTypeName,
      prefix: body.prefix,
      formatPattern: body.formatPattern,
      yearType: body.yearType,
      paddingDigits: body.paddingDigits,
      currentNumber: body.currentNumber,
      resetPolicy: body.resetPolicy,
      description: body.description,
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
      return NextResponse.json({ ok: false, error: "กรุณาระบุรหัสประเภทเอกสารที่ต้องการลบ (?code=...)" }, { status: 400 });
    }

    const result = deleteRunningNumber(code, "แอดมินระบบโรงพยาบาล");
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
