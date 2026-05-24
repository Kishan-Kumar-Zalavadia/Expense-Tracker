-- Migration 011: Income category + Category show_in_cards flag
-- Adds optional category association to income entries
-- Adds show_in_cards toggle to categories for spend card display

-- Add category_id to incomes (nullable — income category is optional)
ALTER TABLE incomes
  ADD COLUMN IF NOT EXISTS category_id uuid
    REFERENCES categories(id) ON DELETE SET NULL;

-- Add show_in_cards to categories (default true = visible in spend cards)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS show_in_cards boolean NOT NULL DEFAULT true;

-- Index for faster category-grouped income queries
CREATE INDEX IF NOT EXISTS incomes_category_id_idx
  ON incomes (user_id, category_id)
  WHERE category_id IS NOT NULL;
