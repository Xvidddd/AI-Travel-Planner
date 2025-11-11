import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/providers/supabase";
import { ItineraryPlan } from "@/types/itinerary";

export async function POST(request: Request) {
  const payload = (await request.json()) as ItineraryPlan;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 未配置" }, { status: 400 });
  }

  const userId = payload.userId ?? process.env.SUPABASE_DEMO_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "缺少 userId，用于写入 Supabase" }, { status: 400 });
  }

  try {
    const { data: itineraryRecord, error: itineraryError } = await supabase
      .from("itineraries")
      .insert({
        user_id: userId,
        title: payload.title ?? `${payload.destination} AI 行程`,
        destination: payload.destination,
        budget: payload.budget,
        currency: payload.currency ?? "CNY",
        preferences: payload.preferences,
        status: "draft",
      })
      .select("id")
      .single();

    if (itineraryError || !itineraryRecord) {
      throw itineraryError ?? new Error("行程写入失败");
    }

    const daysPayload = payload.itinerary.map((day) => ({
      itinerary_id: itineraryRecord.id,
      day_index: day.day,
      focus: day.summary,
      summary: day.summary,
      ai_version: "aurora-beta",
    }));

    const { data: dayRecords, error: dayError } = await supabase
      .from("itinerary_days")
      .insert(daysPayload)
      .select("id, day_index");

    if (dayError) {
      throw dayError;
    }

    const dayIdMap = new Map(dayRecords?.map((record) => [record.day_index, record.id]));

    const activitiesPayload = payload.itinerary.flatMap((day) => {
      const dayId = dayIdMap.get(day.day);
      if (!dayId) return [];
      return day.activities.map((activity) => {
        const hasCoord = typeof activity.lat === "number" && typeof activity.lng === "number";
        const hasPlaceMeta = Boolean(activity.poi || activity.address);
        return {
          day_id: dayId,
          type: hasPlaceMeta ? "poi" : "custom",
          title: activity.title,
          detail: activity.detail,
          start_time: activity.time,
          cost_estimate: activity.costEstimate ?? null,
          location: hasCoord
            ? {
                lat: activity.lat,
                lng: activity.lng,
                poi: activity.poi,
                address: activity.address,
              }
            : hasPlaceMeta
              ? {
                  poi: activity.poi,
                  address: activity.address,
                }
              : null,
        };
      });
    });

    if (activitiesPayload.length > 0) {
      const { error: activitiesError } = await supabase.from("activities").insert(activitiesPayload);
      if (activitiesError) {
        throw activitiesError;
      }
    }

    return NextResponse.json({ itineraryId: itineraryRecord.id });
  } catch (error) {
    console.error("Supabase itinerary insert failed", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
