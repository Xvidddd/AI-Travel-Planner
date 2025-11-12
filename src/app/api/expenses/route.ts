import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/providers/supabase";
import { ExpenseEntry } from "@/types/expense";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    category?: string;
    amount?: number;
    note?: string;
    userId?: string;
  } | null;

  if (!body || typeof body.amount !== "number" || !body.category) {
    return NextResponse.json({ error: "缺少金额或分类" }, { status: 400 });
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
