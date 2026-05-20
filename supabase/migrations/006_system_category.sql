-- ════════════════════════════════════════════════════════════════
-- Ledger — System Category Flag  (Migration 006)
-- Run in Supabase SQL Editor AFTER 001–005
-- ════════════════════════════════════════════════════════════════

-- Mark a category as system-reserved (non-editable, non-deletable)
alter table categories
  add column if not exists is_system boolean not null default false;
