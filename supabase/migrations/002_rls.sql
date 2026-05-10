-- ════════════════════════════════════════════════════════════════
-- Ledger — RLS Policies Migration 002
-- Run after 001_schema.sql
-- ════════════════════════════════════════════════════════════════

-- ─── categories ───────────────────────────────────────────────────
alter table categories enable row level security;

create policy "categories: users see own rows"
  on categories for select
  using (auth.uid() = user_id);

create policy "categories: users insert own rows"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "categories: users update own rows"
  on categories for update
  using (auth.uid() = user_id);

create policy "categories: users delete own rows"
  on categories for delete
  using (auth.uid() = user_id);

-- ─── payment_modes ────────────────────────────────────────────────
alter table payment_modes enable row level security;

create policy "payment_modes: users see own rows"
  on payment_modes for select
  using (auth.uid() = user_id);

create policy "payment_modes: users insert own rows"
  on payment_modes for insert
  with check (auth.uid() = user_id);

create policy "payment_modes: users update own rows"
  on payment_modes for update
  using (auth.uid() = user_id);

create policy "payment_modes: users delete own rows"
  on payment_modes for delete
  using (auth.uid() = user_id);

-- ─── expenses ─────────────────────────────────────────────────────
alter table expenses enable row level security;

create policy "expenses: users see own rows"
  on expenses for select
  using (auth.uid() = user_id);

create policy "expenses: users insert own rows"
  on expenses for insert
  with check (auth.uid() = user_id);

create policy "expenses: users update own rows"
  on expenses for update
  using (auth.uid() = user_id);

create policy "expenses: users delete own rows"
  on expenses for delete
  using (auth.uid() = user_id);

-- ─── salary_config ────────────────────────────────────────────────
alter table salary_config enable row level security;

create policy "salary_config: users see own rows"
  on salary_config for select
  using (auth.uid() = user_id);

create policy "salary_config: users insert own rows"
  on salary_config for insert
  with check (auth.uid() = user_id);

create policy "salary_config: users update own rows"
  on salary_config for update
  using (auth.uid() = user_id);

create policy "salary_config: users delete own rows"
  on salary_config for delete
  using (auth.uid() = user_id);

-- ─── user_settings ────────────────────────────────────────────────
alter table user_settings enable row level security;

create policy "user_settings: users see own row"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings: users insert own row"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings: users update own row"
  on user_settings for update
  using (auth.uid() = user_id);

create policy "user_settings: users delete own row"
  on user_settings for delete
  using (auth.uid() = user_id);
