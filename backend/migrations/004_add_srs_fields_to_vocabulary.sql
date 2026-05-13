-- Persist spaced repetition scheduling on vocabulary rows.

ALTER TABLE vocabulary
    ADD COLUMN IF NOT EXISTS "interval" INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ease_factor NUMERIC(4, 2) DEFAULT 2.50,
    ADD COLUMN IF NOT EXISTS next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE vocabulary
SET
    "interval" = COALESCE("interval", 0),
    ease_factor = COALESCE(ease_factor, 2.50),
    next_review = COALESCE(next_review, CURRENT_TIMESTAMP);
