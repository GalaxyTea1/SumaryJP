const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');

test('core table migration creates backend database prerequisites', () => {
    const migration = fs.readFileSync(path.join(backendRoot, 'migrations', '000_create_core_tables.sql'), 'utf8');

    for (const table of ['users', 'learning_history', 'test_results']) {
        assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
    }
});

test('fresh init schema does not create legacy vocabulary progress columns', () => {
    const initSql = fs.readFileSync(path.join(backendRoot, 'init.sql'), 'utf8');
    const createVocabulary = initSql.match(/CREATE TABLE vocabulary \(([\s\S]*?)\);/)[1];

    for (const column of ['status', 'last_reviewed', 'review_count', 'ease_factor', 'next_review', 'is_difficult']) {
        assert.doesNotMatch(createVocabulary, new RegExp(`\\b${column}\\b`));
    }
    assert.doesNotMatch(createVocabulary, /"interval"/);
});

test('legacy cleanup migration drops vocabulary progress columns', () => {
    const migration = fs.readFileSync(path.join(backendRoot, 'migrations', '006_drop_legacy_vocabulary_progress_columns.sql'), 'utf8');

    for (const column of ['status', 'last_reviewed', 'review_count', 'ease_factor', 'next_review', 'is_difficult']) {
        assert.match(migration, new RegExp(`DROP COLUMN IF EXISTS ${column}`));
    }
    assert.match(migration, /DROP COLUMN IF EXISTS "interval"/);
});

test('gamification migration stores per-user xp and badge state', () => {
    const migration = fs.readFileSync(path.join(backendRoot, 'migrations', '007_create_user_gamification.sql'), 'utf8');

    assert.match(migration, /CREATE TABLE IF NOT EXISTS user_gamification/);
    assert.match(migration, /user_id INTEGER PRIMARY KEY REFERENCES users\(id\) ON DELETE CASCADE/);
    assert.match(migration, /daily_xp INTEGER NOT NULL DEFAULT 0/);
    assert.match(migration, /badges JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
    assert.match(migration, /stats JSONB NOT NULL/);
});

test('srs migration stores per-user progress for supported item types', () => {
    const migration = fs.readFileSync(path.join(backendRoot, 'migrations', '008_create_user_srs_progress.sql'), 'utf8');

    assert.match(migration, /CREATE TABLE IF NOT EXISTS user_srs_progress/);
    assert.match(migration, /user_id INTEGER NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/);
    assert.match(migration, /item_type VARCHAR\(20\) NOT NULL/);
    assert.match(migration, /UNIQUE \(user_id, item_type, item_id\)/);
    assert.match(migration, /CHECK \(item_type IN \('vocab', 'kanji', 'grammar'\)\)/);
});

test('learning settings migration stores weekly goal target per user', () => {
    const migration = fs.readFileSync(path.join(backendRoot, 'migrations', '009_create_user_learning_settings.sql'), 'utf8');

    assert.match(migration, /CREATE TABLE IF NOT EXISTS user_learning_settings/);
    assert.match(migration, /user_id INTEGER PRIMARY KEY REFERENCES users\(id\) ON DELETE CASCADE/);
    assert.match(migration, /weekly_goal_target INTEGER NOT NULL DEFAULT 20/);
    assert.match(migration, /CHECK \(weekly_goal_target BETWEEN 1 AND 500\)/);
});

test('kana progress migration stores per-user kana learning state', () => {
    const migration = fs.readFileSync(path.join(backendRoot, 'migrations', '010_create_user_kana_progress.sql'), 'utf8');

    assert.match(migration, /CREATE TABLE IF NOT EXISTS user_kana_progress/);
    assert.match(migration, /user_id INTEGER NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/);
    assert.match(migration, /kana_type VARCHAR\(20\) NOT NULL/);
    assert.match(migration, /UNIQUE \(user_id, kana_type, character\)/);
    assert.match(migration, /CHECK \(kana_type IN \('hiragana', 'katakana'\)\)/);
    assert.match(migration, /CHECK \(status IN \('learning', 'mastered'\)\)/);
});
