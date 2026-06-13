CREATE TABLE IF NOT EXISTS user_kana_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kana_type VARCHAR(20) NOT NULL,
    character VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'learning',
    review_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, kana_type, character),
    CHECK (kana_type IN ('hiragana', 'katakana')),
    CHECK (status IN ('learning', 'mastered'))
);
