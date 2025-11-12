import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/providers/supabase";
import { ExpenseEntry } from "@/types/expense";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    category?: string;
    amount?: number;
    note?: string;
    userId?: string;
    itineraryId?: string;
  } | null;

  if (!body || typeof body.amount !== "number" || !body.category || !body.itineraryId) {
    return NextResponse.json({ error: "缺少金额、分类或行程信息" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json({ error: "缺少用户身份，需登录后才能记账" }, { status: 401 });
  }

  const entry: ExpenseEntry = {
    id: crypto.randomUUID(),
    category: body.category as ExpenseEntry["category"],
    amount: body.amount,
    note: body.note,
    createdAt: new Date().toISOString(),
  };

  if (!supabase) {
    return NextResponse.json({ expense: entry, warning: "Supabase 未配置，返回本地结果" });
  }

  try {
    const { error } = await supabase.from("expenses").insert({
      id: entry.id,
      user_id: userId,
      itinerary_id: body.itineraryId,
      category: entry.category,
      amount: entry.amount,
      note: entry.note,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ expense: entry });
  } catch (error) {
    return NextResponse.json({ expense: entry, warning: (error as Error).message }, { status: 200 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const itineraryId = searchParams.get("itineraryId");
  if (!userId) {
    return NextResponse.json({ error: "缺少用户身份" }, { status: 401 });
  }
  if (!itineraryId) {
    return NextResponse.json({ error: "缺少行程信息" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ expenses: [], warning: "Supabase 未配置" });
  }

  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("id, category, amount, note, inserted_at")
      .eq("user_id", userId)
      .eq("itinerary_id", itineraryId)
      .order("inserted_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    const expenses: ExpenseEntry[] = (data ?? []).map((row) => ({
      id: row.id,
      category: row.category,
      amount: row.amount,
      note: row.note ?? undefined,
      createdAt: row.inserted_at,
    }));

    return NextResponse.json({ expenses });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 未配置" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    userId?: string;
    itineraryId?: string;
  } | null;
  if (!body?.id || !body.userId || !body.itineraryId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", body.id)
      .eq("user_id", body.userId)
      .eq("itinerary_id", body.itineraryId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
