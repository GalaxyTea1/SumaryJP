const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');

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
