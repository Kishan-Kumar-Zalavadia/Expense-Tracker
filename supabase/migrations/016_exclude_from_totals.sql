-- Migration 016: Exclude category from totals
-- Adds a flag to categories that, when true, causes transactions in that
-- category to be recorded as normal but excluded from expense/income totals
-- and budget calculations on the dashboard.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS exclude_from_totals boolean NOT NULL DEFAULT false;
