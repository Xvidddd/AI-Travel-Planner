import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    service: "AuroraVoyage",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
