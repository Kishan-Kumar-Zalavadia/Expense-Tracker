-- Migration 012: Subcategories feature
-- Adds subcategories table, subcategory_id to expenses/incomes,
-- and enable_subcategories toggle to user_settings

-- Feature toggle in user settings (default OFF)
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS enable_subcategories boolean NOT NULL DEFAULT false;

-- Subcategories table (mirrors categories, no type / is_system / show_in_cards)
CREATE TABLE IF NOT EXISTS subcategories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  color       text        NOT NULL DEFAULT '#6685D9',
  sort_order  int         NOT NULL DEFAULT 0,
  archived    boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS subcategories_user_id_idx
  ON subcategories (user_id);

-- Add subcategory_id to expenses (nullable)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS subcategory_id uuid
    REFERENCES subcategories(id) ON DELETE SET NULL;

-- Add subcategory_id to incomes (nullable)
ALTER TABLE incomes
  ADD COLUMN IF NOT EXISTS subcategory_id uuid
    REFERENCES subcategories(id) ON DELETE SET NULL;

-- Indexes for filtered queries
CREATE INDEX IF NOT EXISTS expenses_subcategory_id_idx
  ON expenses (user_id, subcategory_id)
  WHERE subcategory_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS incomes_subcategory_id_idx
  ON incomes (user_id, subcategory_id)
  WHERE subcategory_id IS NOT NULL;

-- Row Level Security
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subcategories: user owns rows"
  ON subcategories FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
