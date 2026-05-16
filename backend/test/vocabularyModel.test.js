const assert = require('node:assert/strict');
const test = require('node:test');
const { clearModule, mockModule } = require('./testUtils');

const dbPath = require.resolve('../db');
const modelPath = require.resolve('../models/vocabulary');

function loadVocabulary(pool) {
    clearModule(modelPath);
    mockModule(dbPath, pool);
    return require('../models/vocabulary');
}

test.afterEach(() => {
    clearModule(modelPath);
    clearModule(dbPath);
});

test('Vocabulary.getAll joins user_vocabulary_progress for authenticated users', async () => {
    const queries = [];
    const Vocabulary = loadVocabulary({
        query: async (text, values) => {
            queries.push({ text, values });
            return { rows: [] };
        }
    });

    await Vocabulary.getAll(8);

    assert.match(queries[0].text, /LEFT JOIN user_vocabulary_progress p/);
    assert.deepEqual(queries[0].values, [8]);
});

test('Vocabulary.getAll returns guest progress defaults without reading legacy vocabulary progress columns', async () => {
    const queries = [];
    const Vocabulary = loadVocabulary({
        query: async (text, values) => {
            queries.push({ text, values });
            return { rows: [] };
        }
    });

    await Vocabulary.getAll();

    assert.doesNotMatch(queries[0].text, /v\.status|v\.last_reviewed|v\.review_count|v\.ease_factor|v\.next_review|v\.is_difficult/);
    assert.match(queries[0].text, /'not-learned'::varchar AS status/);
});

test('Vocabulary.upsertProgress persists progress in user_vocabulary_progress by user and vocab', async () => {
    const queries = [];
    const Vocabulary = loadVocabulary({
        query: async (text, values) => {
            queries.push({ text, values });
            if (/RETURNING id/.test(text)) return { rows: [{ id: 20 }] };
            return { rows: [{ id: 20, status: 'mastered' }] };
        }
    });

    await Vocabulary.upsertProgress(4, 20, {
        status: 'mastered',
        review_count: 3,
        interval: 2,
        ease_factor: 2.6,
        is_difficult: true
    });

    assert.match(queries[0].text, /INSERT INTO user_vocabulary_progress/);
    assert.deepEqual(queries[0].values.slice(0, 3), [4, 20, 'mastered']);
    assert.match(queries[0].text, /ON CONFLICT \(user_id, vocab_id\)/);
});
