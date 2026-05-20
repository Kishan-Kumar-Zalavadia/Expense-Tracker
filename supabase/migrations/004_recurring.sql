-- ════════════════════════════════════════════════════════════════
-- Ledger — Recurring Items  (Migration 004)
-- Run in Supabase SQL Editor AFTER 001, 002, and 003
-- ════════════════════════════════════════════════════════════════

create table if not exists recurring_items (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,

  -- Income or Expense
  type              text not null check (type in ('income', 'expense')),
  description       text,
  amount            numeric(12,2) not null check (amount > 0),

  -- Account receiving/paying
  payment_mode_id   uuid references payment_modes(id) on delete set null,

  -- For expenses only
  category_id       uuid references categories(id) on delete set null,
  expense_type      text check (expense_type in ('Need', 'Want', 'Saving')),

  -- Frequency: 'monthly' | 'weekly' | 'biweekly'
  frequency         text not null check (frequency in ('monthly', 'weekly', 'biweekly')),

  -- For monthly: which day of the month (1–28)
  day_of_month      int check (day_of_month >= 1 and day_of_month <= 28),

  -- For weekly / biweekly: day of week (0=Mon … 6=Sun)
  day_of_week       int check (day_of_week >= 0 and day_of_week <= 6),

  active            boolean not null default true,
  notes             text,

  -- Tracks when entries were last generated
  last_generated_date date,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists recurring_items_user_id_idx on recurring_items (user_id);

alter table recurring_items enable row level security;

drop policy if exists "recurring_items: users see own rows"    on recurring_items;
drop policy if exists "recurring_items: users insert own rows" on recurring_items;
drop policy if exists "recurring_items: users update own rows" on recurring_items;
drop policy if exists "recurring_items: users delete own rows" on recurring_items;

create policy "recurring_items: users see own rows"
  on recurring_items for select using (auth.uid() = user_id);
create policy "recurring_items: users insert own rows"
  on recurring_items for insert with check (auth.uid() = user_id);
create policy "recurring_items: users update own rows"
  on recurring_items for update using (auth.uid() = user_id);
create policy "recurring_items: users delete own rows"
  on recurring_items for delete using (auth.uid() = user_id);
