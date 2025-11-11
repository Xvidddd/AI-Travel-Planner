# Supabase 配置指南

## 1. 创建项目
1. 访问 [https://supabase.com](https://supabase.com) 创建组织与 Project，Region 建议选择与主要用户接近的亚太地区。
2. 记录 Project URL（`https://xxxx.supabase.co`）与 `anon`、`service_role` Key，后续配置到 `.env`。

## 2. 环境变量
在 `.env` 中填写：
```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```
- `NEXT_PUBLIC_*` 变量用于前端（匿名访问受 RLS 保护的数据）。
- `SUPABASE_SERVICE_ROLE_KEY` 仅在服务器端使用，例如 Server Actions / Edge Functions 进行受信操作，切勿暴露到浏览器。

## 3. 数据库 Schema
根据 `docs/需求规格说明.md` 建议，创建以下表（可使用 Supabase SQL editor）：
```sql
create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,
  destination text not null,
  start_date date,
  end_date date,
  budget numeric,
  currency text default 'CNY',
  preferences jsonb,
  status text default 'draft',
  inserted_at timestamptz default now()
);

create table public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid references public.itineraries on delete cascade,
  day_index int not null,
  focus text,
  summary text,
  ai_version text,
  inserted_at timestamptz default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references public.itinerary_days on delete cascade,
  type text,
  title text,
  detail text,
  start_time text,
  end_time text,
  location jsonb,
  cost_estimate numeric
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid references public.itineraries on delete cascade,
  category text,
  amount numeric,
  currency text default 'CNY',
  method text,
  voice_trace_id uuid,
  inserted_at timestamptz default now()
);
```

## 4. RLS 策略
开启上述表的 Row Level Security，并添加策略：
```sql
alter table public.itineraries enable row level security;
create policy "Owners read/write itineraries" on public.itineraries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
针对 `itinerary_days`, `activities`, `expenses` 也创建类似策略（通过子查询确认父级 `itinerary` 属于当前用户）。

## 5. Auth 配置
- 启用 Email 登录（魔法链接或密码），并在 `Authentication -> URL Configuration` 中配置本地与生产回调域名。
- 在前端使用 `@supabase/ssr`（`src/lib/providers/supabase.ts`）创建 client，支持 Server Components + 客户端操作。

## 6. 辅助服务
- **Edge Functions**：可在 `supabase/functions` 创建，例如 `budget-snapshot`，通过 `supabase functions deploy` 部署，用于预算重算或 LLM 回调。
- **Storage**：创建 `voice-traces` bucket，配置 RLS 仅允许拥有者访问语音文件。

## 7. 本地开发
1. 安装 Supabase CLI：`npm install -g supabase`。
2. 运行 `supabase login` 并粘贴 Access Token。
3. 使用 `supabase start` 启动本地 Postgres + Auth。
4. 将 `.env` 指向本地 URL/Key，或通过 `supabase link` 同步远端 schema。

按照以上步骤配置后，即可在 Next.js 应用内通过 `/api/*` 或 Server Actions 读写 Supabase 数据，实现行程、预算与协作等功能。
