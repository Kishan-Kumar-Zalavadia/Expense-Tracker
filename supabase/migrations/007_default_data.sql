-- ════════════════════════════════════════════════════════════════
-- Ledger — Default categories & payment modes on signup (Migration 007)
-- Creates a trigger that seeds starter data for every new user.
-- ════════════════════════════════════════════════════════════════

-- Function runs as the table owner (security definer) so it can
-- insert into RLS-protected tables on behalf of the new user.
create or replace function public.handle_new_user_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ── Default categories ─────────────────────────────────────────
  insert into public.categories (user_id, name, type, color, sort_order) values
    -- Needs (50%)
    (new.id, 'Groceries',        'Need',   '#5856D6',  1),
    (new.id, 'Food & Dining',    'Need',   '#5856D6',  2),
    (new.id, 'Transport',        'Need',   '#5856D6',  3),
    (new.id, 'Housing & Rent',   'Need',   '#5856D6',  4),
    (new.id, 'Utilities',        'Need',   '#5856D6',  5),
    (new.id, 'Healthcare',       'Need',   '#5856D6',  6),
    (new.id, 'Education',        'Need',   '#5856D6',  7),
    -- Wants (30%)
    (new.id, 'Shopping',         'Want',   '#FF3B30',  8),
    (new.id, 'Entertainment',    'Want',   '#FF3B30',  9),
    (new.id, 'Dining Out',       'Want',   '#FF3B30', 10),
    (new.id, 'Subscriptions',    'Want',   '#FF3B30', 11),
    (new.id, 'Travel',           'Want',   '#FF3B30', 12),
    (new.id, 'Personal Care',    'Want',   '#FF3B30', 13),
    -- Savings (20%)
    (new.id, 'Savings',          'Saving', '#34C759', 14),
    (new.id, 'Investments',      'Saving', '#34C759', 15),
    (new.id, 'Emergency Fund',   'Saving', '#34C759', 16);

  -- ── Default payment modes ──────────────────────────────────────
  insert into public.payment_modes (user_id, name, show_in_balance, is_credit_card) values
    (new.id, 'Cash',         true,  false),
    (new.id, 'Bank Account', true,  false),
    (new.id, 'Credit Card',  false, true),
    (new.id, 'UPI / Online', true,  false);

  -- ── Default user settings ──────────────────────────────────────
  insert into public.user_settings (user_id, weekly_limit, currency, theme)
  values (new.id, 10000, '₹', 'light')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Drop old trigger if it exists, then recreate
drop trigger if exists on_auth_user_created_defaults on auth.users;

create trigger on_auth_user_created_defaults
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user_defaults();
