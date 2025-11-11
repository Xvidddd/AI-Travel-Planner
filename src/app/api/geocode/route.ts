import { NextResponse } from "next/server";

const AMAP_GEOCODE_URL = "https://restapi.amap.com/v3/geocode/geo";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    query?: string;
    queries?: string[];
  } | null;

  if (!body) {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const key = process.env.AMAP_WEB_SERVICE_KEY;
  if (!key) {
    return NextResponse.json({ error: "缺少 AMAP_WEB_SERVICE_KEY" }, { status: 400 });
  }

  const inputQueries = body.queries ?? (body.query ? [body.query] : []);
  const queries = Array.from(new Set(inputQueries.map((q) => q?.trim()).filter(Boolean))).slice(0, 10);

  if (!queries.length) {
    return NextResponse.json({ error: "缺少地理编码地址" }, { status: 400 });
  }

  const coordinates: Record<string, [number, number]> = {};

  for (const query of queries) {
    const url = `${AMAP_GEOCODE_URL}?key=${encodeURIComponent(key)}&address=${encodeURIComponent(query)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        continue;
      }
      const data = (await res.json()) as {
        status?: string;
        geocodes?: Array<{ location?: string }>;
      };
      if (data.status === "1" && data.geocodes?.length) {
        const location = data.geocodes[0].location;
        if (location) {
          const [lng, lat] = location.split(",").map((value) => Number(value));
          if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
            coordinates[query] = [lng, lat];
          }
        }
      }
    } catch (error) {
      console.error("Amap geocode error", error);
    }
  }

  return NextResponse.json({ coordinates });
}
