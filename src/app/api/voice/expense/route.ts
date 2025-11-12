import { NextResponse } from "next/server";
import { parseVoiceToExpense } from "@/lib/providers/llm";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const transcript = typeof body?.transcript === "string" ? body.transcript : "";
  if (!transcript.trim()) {
    return NextResponse.json({ error: "缺少语音内容" }, { status: 400 });
  }
  try {
    const intent = await parseVoiceToExpense(transcript);
    return NextResponse.json({ intent });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
