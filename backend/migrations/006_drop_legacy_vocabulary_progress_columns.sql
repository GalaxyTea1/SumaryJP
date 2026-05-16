ALTER TABLE vocabulary
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS last_reviewed,
    DROP COLUMN IF EXISTS review_count,
    DROP COLUMN IF EXISTS "interval",
    DROP COLUMN IF EXISTS ease_factor,
    DROP COLUMN IF EXISTS next_review,
    DROP COLUMN IF EXISTS is_difficult;
