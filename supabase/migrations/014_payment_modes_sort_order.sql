-- Add sort_order to payment_modes for user-defined ordering
ALTER TABLE payment_modes ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Initialise sort_order from creation order within each user's modes
UPDATE payment_modes pm
SET sort_order = ranked.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
  FROM payment_modes
) ranked
WHERE pm.id = ranked.id;
