const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { clearModule, mockModule } = require('./testUtils');

const dbPath = path.resolve(__dirname, '../db.js');
const modelPath = path.resolve(__dirname, '../models/kanaProgress.js');

test('KanaProgress.upsert persists per-user kana state', async () => {
    const calls = [];
    const pool = {
        query: async (sql, values) => {
            calls.push({ sql, values });
            return {
                rows: [{
                    id: 3,
                    user_id: values[0],
                    kana_type: values[1],
                    character: values[2],
                    status: values[3],
                    review_count: 2,
                    last_reviewed: '2026-06-12T00:00:00.000Z',
                }],
            };
        },
    };

    mockModule(dbPath, pool);
    clearModule(modelPath);
    const KanaProgress = require(modelPath);

    const result = await KanaProgress.upsert(4, 'hiragana', 'あ', 'mastered');

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].values, [4, 'hiragana', 'あ', 'mastered']);
    assert.equal(result.userId, 4);
    assert.equal(result.kanaType, 'hiragana');
    assert.equal(result.character, 'あ');
    assert.equal(result.status, 'mastered');
    assert.equal(result.reviewCount, 2);
});
