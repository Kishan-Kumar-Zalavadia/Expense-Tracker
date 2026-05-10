-- ════════════════════════════════════════════════════════════════
-- Ledger — Seed trigger
-- Run after 001_schema.sql and 002_rls.sql
-- This creates a trigger that seeds default data for every new user.
-- ════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now())::int;
begin
  -- 1. user_settings
  insert into public.user_settings (user_id, weekly_limit, currency, theme)
  values (new.id, 10000, '₹', 'light')
  on conflict (user_id) do nothing;

  -- 2. salary_config
  insert into public.salary_config (user_id, year, salary, needs_pct, wants_pct, savings_pct)
  values (new.id, v_year, 50000, 50, 30, 20)
  on conflict (user_id, year) do nothing;

  -- 3. Default categories (5)
  insert into public.categories (user_id, name, type, color, sort_order) values
    (new.id, 'Life Infrastructure',       'Need',   '#1F6F7F', 1),
    (new.id, 'Future Me',                 'Saving',  '#2D8A6A', 2),
    (new.id, 'Performance & Growth',      'Need',   '#6B3F7F', 3),
    (new.id, 'Relationships & Generosity','Want',   '#B84778', 4),
    (new.id, 'Lifestyle Enjoyment',       'Want',   '#E8553D', 5)
  on conflict do nothing;

  -- 4. Default payment modes (5)
  insert into public.payment_modes (user_id, name) values
    (new.id, 'Credit Card'),
    (new.id, 'Debit Card'),
    (new.id, 'UPI'),
    (new.id, 'Cash'),
    (new.id, 'Bank Transfer')
  on conflict do nothing;

  return new;
end;
$$;

-- Drop existing trigger if re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
