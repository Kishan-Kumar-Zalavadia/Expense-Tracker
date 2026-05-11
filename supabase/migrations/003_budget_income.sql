-- ════════════════════════════════════════════════════════════════
-- Ledger — Budget Periods & Income Tracking  (Migration 003)
-- Run this in Supabase SQL Editor AFTER 001 and 002
-- ════════════════════════════════════════════════════════════════

-- ─── budget_periods ─────────────────────────────────────────────
-- Replaces salary_config (that table is kept but no longer used).
-- start_month / end_month are 'YYYY-MM' strings.
-- end_month = NULL means the period is ongoing ("present").
-- Overlap validation is enforced in the application layer.

create table if not exists budget_periods (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users on delete cascade,
  start_month             text not null check (start_month ~ '^\d{4}-\d{2}$'),
  end_month               text          check (end_month   ~ '^\d{4}-\d{2}$'),
  monthly_amount          numeric(12,2) not null check (monthly_amount > 0),
  needs_pct               int  not null default 50
                            check (needs_pct   >= 0 and needs_pct   <= 100),
  wants_pct               int  not null default 30
                            check (wants_pct   >= 0 and wants_pct   <= 100),
  savings_pct             int  not null default 20
                            check (savings_pct >= 0 and savings_pct <= 100),
  constraint budget_periods_pct_sum
    check (needs_pct + wants_pct + savings_pct = 100),
  -- Optional income tracking schedule
  track_income            boolean not null default false,
  income_payment_mode_id  uuid references payment_modes(id) on delete set null,
  income_day_1            int check (income_day_1 >= 1 and income_day_1 <= 28),
  income_day_2            int check (income_day_2 >= 1 and income_day_2 <= 28),
  created_at              timestamptz not null default now()
);

create index if not exists budget_periods_user_id_idx on budget_periods (user_id);
create index if not exists budget_periods_user_start_idx on budget_periods (user_id, start_month);

alter table budget_periods enable row level security;

drop policy if exists "budget_periods: users see own rows"    on budget_periods;
drop policy if exists "budget_periods: users insert own rows" on budget_periods;
drop policy if exists "budget_periods: users update own rows" on budget_periods;
drop policy if exists "budget_periods: users delete own rows" on budget_periods;

create policy "budget_periods: users see own rows"
  on budget_periods for select using (auth.uid() = user_id);
create policy "budget_periods: users insert own rows"
  on budget_periods for insert with check (auth.uid() = user_id);
create policy "budget_periods: users update own rows"
  on budget_periods for update using (auth.uid() = user_id);
create policy "budget_periods: users delete own rows"
  on budget_periods for delete using (auth.uid() = user_id);


-- ─── incomes ────────────────────────────────────────────────────
-- Tracks money coming in (salary, freelance, etc.)
-- auto_generated = true means it was created by the budget period
-- income schedule feature (safe to delete/regenerate).

create table if not exists incomes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  date              date not null,
  description       text not null,
  amount            numeric(12,2) not null check (amount > 0),
  payment_mode_id   uuid not null references payment_modes(id) on delete restrict,
  budget_period_id  uuid references budget_periods(id) on delete set null,
  auto_generated    boolean not null default false,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists incomes_user_date_idx         on incomes (user_id, date);
create index if not exists incomes_user_payment_mode_idx on incomes (user_id, payment_mode_id);
create index if not exists incomes_budget_period_idx     on incomes (budget_period_id);

alter table incomes enable row level security;

drop policy if exists "incomes: users see own rows"    on incomes;
drop policy if exists "incomes: users insert own rows" on incomes;
drop policy if exists "incomes: users update own rows" on incomes;
drop policy if exists "incomes: users delete own rows" on incomes;

create policy "incomes: users see own rows"
  on incomes for select using (auth.uid() = user_id);
create policy "incomes: users insert own rows"
  on incomes for insert with check (auth.uid() = user_id);
create policy "incomes: users update own rows"
  on incomes for update using (auth.uid() = user_id);
create policy "incomes: users delete own rows"
  on incomes for delete using (auth.uid() = user_id);


-- ─── payment_modes — add initial_balance ────────────────────────
-- Used to track starting account balance for each payment mode.

alter table payment_modes
  add column if not exists initial_balance numeric(12,2) not null default 0;

-- ─── expenses — make description optional ───────────────────────
alter table expenses alter column description drop not null;

-- ─── incomes — make description optional ────────────────────────
alter table incomes alter column description drop not null;

-- ─── payment_modes — add show_in_balance flag ───────────────────
-- Controls which accounts appear in the Income & Balance cards.
alter table payment_modes
  add column if not exists show_in_balance boolean not null default true;
