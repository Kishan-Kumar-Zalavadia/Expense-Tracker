-- Allow users to mark a category/subcategory/payment-mode as their default selection in forms

ALTER TABLE categories     ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
ALTER TABLE subcategories  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
ALTER TABLE payment_modes  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Mark the first (lowest sort_order) active item as default for each user
UPDATE categories c
SET is_default = true
WHERE NOT c.archived AND NOT c.is_system
  AND c.sort_order = (
    SELECT MIN(sort_order) FROM categories
    WHERE user_id = c.user_id AND NOT archived AND NOT is_system
  );

UPDATE subcategories s
SET is_default = true
WHERE NOT s.archived
  AND s.sort_order = (
    SELECT MIN(sort_order) FROM subcategories
    WHERE user_id = s.user_id AND NOT archived
  );

UPDATE payment_modes p
SET is_default = true
WHERE NOT p.archived
  AND p.sort_order = (
    SELECT MIN(sort_order) FROM payment_modes
    WHERE user_id = p.user_id AND NOT archived
  );
