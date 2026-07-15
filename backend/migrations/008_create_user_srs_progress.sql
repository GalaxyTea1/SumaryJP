CREATE TABLE IF NOT EXISTS user_srs_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    item_id INTEGER NOT NULL,
    repetitions INTEGER NOT NULL DEFAULT 0,
    "interval" INTEGER NOT NULL DEFAULT 0,
    ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
    next_review TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_review TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, item_type, item_id),
    CHECK (item_type IN ('vocab', 'kanji', 'grammar'))
);

CREATE INDEX IF NOT EXISTS idx_user_srs_progress_user_due
    ON user_srs_progress(user_id, next_review);

CREATE INDEX IF NOT EXISTS idx_user_srs_progress_item
    ON user_srs_progress(item_type, item_id);
