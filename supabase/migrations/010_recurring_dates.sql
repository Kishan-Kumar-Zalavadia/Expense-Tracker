-- ════════════════════════════════════════════════════════════════
-- Ledger — Recurring Items: start/end dates + source tracking
-- Migration 010
-- ════════════════════════════════════════════════════════════════

-- Add start and end date to recurring items
alter table public.recurring_items
  add column if not exists start_date date,
  add column if not exists end_date   date;  -- null = never ends

-- Track which recurring item generated each expense/income row
-- No FK so "keep history" delete works cleanly
alter table public.expenses
  add column if not exists recurring_item_id uuid;

alter table public.incomes
  add column if not exists recurring_item_id uuid;

-- Indexes for fast "delete all by recurring_item_id" queries
create index if not exists expenses_recurring_item_id_idx on public.expenses (recurring_item_id);
create index if not exists incomes_recurring_item_id_idx  on public.incomes  (recurring_item_id);
