import { NextResponse } from "next/server";
import { askHospitalAiCopilot } from "@/server/lib/ai-assistant";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.question || typeof body.question !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'question' parameter" }, { status: 400 });
    }

    const result = await askHospitalAiCopilot({
      question: body.question,
      model: body.model,
      history: body.history,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
