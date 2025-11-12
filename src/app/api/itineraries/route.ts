import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/providers/supabase";
import { ItineraryPlan } from "@/types/itinerary";

export async function POST(request: Request) {
  const payload = (await request.json()) as ItineraryPlan;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 未配置" }, { status: 400 });
  }

  const userId = payload.userId;
  if (!userId) {
    return NextResponse.json({ error: "缺少用户身份，请登录后再保存行程" }, { status: 401 });
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
        budget_detail: payload.budgetDetail ?? null,
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

export async function GET(request: Request) {
  const supabase = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const itineraryId = searchParams.get("itineraryId");

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 未配置" }, { status: 500 });
  }
  if (!userId) {
    return NextResponse.json({ error: "缺少用户身份" }, { status: 401 });
  }

  try {
    if (itineraryId) {
      const { data: itinerary, error } = await supabase
        .from("itineraries")
        .select("id, title, destination, start_date, end_date, budget, preferences, inserted_at, budget_detail")
        .eq("id", itineraryId)
        .eq("user_id", userId)
        .single();
      if (error || !itinerary) throw error ?? new Error("未找到行程");

      const { data: days, error: dayError } = await supabase
        .from("itinerary_days")
        .select("id, day_index, summary")
        .eq("itinerary_id", itineraryId)
        .order("day_index", { ascending: true });
      if (dayError) throw dayError;

      const dayIds = days?.map((day) => day.id) ?? [];
      const { data: activities, error: actError } = await supabase
        .from("activities")
        .select("day_id, title, detail, start_time, end_time, location, cost_estimate")
        .in("day_id", dayIds);
      if (actError) throw actError;

      const dayMap = new Map<string, typeof activities>();
      activities?.forEach((activity) => {
        const list = dayMap.get(activity.day_id) ?? [];
        list.push(activity);
        dayMap.set(activity.day_id, list);
      });

      const itineraryPlan: ItineraryPlan = {
        id: itinerary.id,
        destination: itinerary.destination ?? "",
        days: days?.length ?? 0,
        budget: itinerary.budget ?? 0,
        personas: [],
        preferences: Array.isArray(itinerary.preferences) ? itinerary.preferences : [],
        summary: itinerary.title ?? "",
        title: itinerary.title ?? "",
        budgetDetail: Array.isArray(itinerary.budget_detail)
          ? itinerary.budget_detail.map((item: any) => ({
              category: item.category ?? "其他",
              amount: Number(item.amount) || 0,
            }))
          : undefined,
        itinerary: (days ?? []).map((day) => ({
          day: day.day_index,
          summary: day.summary ?? "",
          activities: (dayMap.get(day.id) ?? []).map((activity) => ({
            title: activity.title ?? "",
            detail: activity.detail ?? "",
            time: activity.start_time ?? "",
            poi: activity.location?.poi,
            address: activity.location?.address,
            lat: activity.location?.lat,
            lng: activity.location?.lng,
            costEstimate: activity.cost_estimate ?? undefined,
          })),
        })),
      };

      return NextResponse.json({ itinerary: itineraryPlan });
    }

    const { data, error } = await supabase
      .from("itineraries")
      .select("id, title, destination, budget, inserted_at")
      .eq("user_id", userId)
      .order("inserted_at", { ascending: false })
      .limit(20);
    if (error) throw error;

    return NextResponse.json({ itineraries: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 未配置" }, { status: 500 });
  }
  const body = (await request.json().catch(() => null)) as { id?: string; userId?: string } | null;
  if (!body?.id || !body.userId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }
  try {
    const { error } = await supabase
      .from("itineraries")
      .delete()
      .eq("id", body.id)
      .eq("user_id", body.userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
