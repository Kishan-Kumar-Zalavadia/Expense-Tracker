-- ════════════════════════════════════════════════════════════════
-- Ledger — Update default categories on signup (Migration 008)
-- Replaces the seeding function with the new 5-category model.
-- ════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ── Default categories ─────────────────────────────────────────
  insert into public.categories (user_id, name, type, color, sort_order) values
    (new.id, 'Life Infrastructure',          'Need',   '#5856D6', 1),
    (new.id, 'Performance and Growth',       'Need',   '#5856D6', 2),
    (new.id, 'Relationships and Generosity', 'Want',   '#FF3B30', 3),
    (new.id, 'Lifestyle and Enjoyment',      'Want',   '#FF3B30', 4),
    (new.id, 'Future Me',                    'Saving', '#34C759', 5);

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
