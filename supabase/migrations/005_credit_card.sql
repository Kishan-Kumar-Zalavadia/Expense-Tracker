-- ════════════════════════════════════════════════════════════════
-- Ledger — Credit Card Support  (Migration 005)
-- Run in Supabase SQL Editor AFTER 001–004
-- ════════════════════════════════════════════════════════════════

-- 1. Mark payment modes as credit cards
alter table payment_modes
  add column if not exists is_credit_card boolean not null default false;

-- 2. Allow null category_id for system-generated expenses
--    (e.g. "CC Payment – Amex" entries created automatically)
alter table expenses
  alter column category_id drop not null;
