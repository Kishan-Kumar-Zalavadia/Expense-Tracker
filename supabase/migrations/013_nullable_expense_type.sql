-- ════════════════════════════════════════════════════════════════
-- Ledger — Migration 013
-- Makes expenses.type nullable so expenses can be logged without
-- a Need/Want/Saving classification (e.g. CC Payment entries).
-- ════════════════════════════════════════════════════════════════

ALTER TABLE expenses ALTER COLUMN type DROP NOT NULL;
-- The existing CHECK constraint (type IN ('Need','Want','Saving')) already
-- permits NULL in PostgreSQL (NULL IN (...) evaluates to NULL, not FALSE),
-- so no further change to the CHECK constraint is needed.
