import { NextResponse } from "next/server";
import { PlannerPayload, generateItinerary } from "@/lib/providers/llm";

export async function POST(request: Request) {
  const body = (await request.json()) as PlannerPayload;
  const plan = await generateItinerary(body);
  return NextResponse.json(plan);
}
