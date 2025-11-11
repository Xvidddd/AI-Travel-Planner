-- 启用 RLS
alter table public.itineraries enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.activities enable row level security;
alter table public.expenses enable row level security;

-- itineraries 表策略：仅允许拥有者读写
create policy "itineraries owners select" on public.itineraries
  for select using (auth.uid() = user_id);
create policy "itineraries owners mutate" on public.itineraries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- itinerary_days 策略：通过父行程校验
create policy "days owners select" on public.itinerary_days
  for select using (
    exists (
      select 1 from public.itineraries i
      where i.id = itinerary_days.itinerary_id and i.user_id = auth.uid()
    )
  );
create policy "days owners mutate" on public.itinerary_days
  for all using (
    exists (
      select 1 from public.itineraries i
      where i.id = itinerary_days.itinerary_id and i.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.itineraries i
      where i.id = itinerary_days.itinerary_id and i.user_id = auth.uid()
    )
  );

-- activities 策略：通过 itinerary_days -> itineraries 校验
create policy "activities owners select" on public.activities
  for select using (
    exists (
      select 1 from public.itineraries i
      join public.itinerary_days d on d.itinerary_id = i.id
      where d.id = activities.day_id and i.user_id = auth.uid()
    )
  );
create policy "activities owners mutate" on public.activities
  for all using (
    exists (
      select 1 from public.itineraries i
      join public.itinerary_days d on d.itinerary_id = i.id
      where d.id = activities.day_id and i.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.itineraries i
      join public.itinerary_days d on d.itinerary_id = i.id
      where d.id = activities.day_id and i.user_id = auth.uid()
    )
  );

-- expenses 策略：通过 itineraries 校验
create policy "expenses owners select" on public.expenses
  for select using (
    exists (
      select 1 from public.itineraries i
      where i.id = expenses.itinerary_id and i.user_id = auth.uid()
    )
  );
create policy "expenses owners mutate" on public.expenses
  for all using (
    exists (
      select 1 from public.itineraries i
      where i.id = expenses.itinerary_id and i.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.itineraries i
      where i.id = expenses.itinerary_id and i.user_id = auth.uid()
    )
  );
