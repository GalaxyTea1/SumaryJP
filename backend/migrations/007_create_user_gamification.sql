CREATE TABLE IF NOT EXISTS user_gamification (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    total_xp_earned INTEGER NOT NULL DEFAULT 0,
    daily_xp INTEGER NOT NULL DEFAULT 0,
    daily_xp_date DATE NOT NULL DEFAULT CURRENT_DATE,
    streak INTEGER NOT NULL DEFAULT 0,
    last_active_date DATE,
    badges JSONB NOT NULL DEFAULT '[]'::jsonb,
    stats JSONB NOT NULL DEFAULT '{"testsCompleted":0,"flashcardsFlipped":0,"vocabReviewed":0,"kanjiReviewed":0,"srsSessions":0}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
