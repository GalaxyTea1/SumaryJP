CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocab_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not-learned',
    last_reviewed TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    "interval" INTEGER DEFAULT 0,
    ease_factor NUMERIC(4, 2) DEFAULT 2.50,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_difficult BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, vocab_id)
);

CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_user ON user_vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_vocab ON user_vocabulary_progress(vocab_id);

ALTER TABLE learning_history
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_learning_history_user ON learning_history(user_id);
