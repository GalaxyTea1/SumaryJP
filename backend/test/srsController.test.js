const assert = require('node:assert/strict');
const test = require('node:test');
const { assertStatus, clearModule, createRes, mockModule } = require('./testUtils');

const modelPath = require.resolve('../models/srsProgress');
const vocabularyPath = require.resolve('../models/vocabulary');
const kanjiPath = require.resolve('../models/kanji');
const grammarPath = require.resolve('../models/grammar');
const controllerPath = require.resolve('../controllers/srsController');

function loadController(SrsProgress) {
    clearModule(controllerPath);
    mockModule(modelPath, SrsProgress);
    mockModule(vocabularyPath, { getById: async () => ({ id: 1 }) });
    mockModule(kanjiPath, { getById: async () => ({ id: 1 }) });
    mockModule(grammarPath, { getById: async () => ({ id: 1 }) });
    return require('../controllers/srsController');
}

test.afterEach(() => {
    clearModule(controllerPath);
    clearModule(modelPath);
    clearModule(vocabularyPath);
    clearModule(kanjiPath);
    clearModule(grammarPath);
});

test('srsController.getProgress returns authenticated user progress', async () => {
    const controller = loadController({
        VALID_ITEM_TYPES: ['vocab', 'kanji', 'grammar'],
        getByUserId: async (userId) => [{ userId, itemType: 'vocab', itemId: 1 }]
    });
    const res = createRes();

    await controller.getProgress({ user: { id: 5 } }, res);

    assertStatus(res, 200);
    assert.deepEqual(res.body, [{ userId: 5, itemType: 'vocab', itemId: 1 }]);
});

test('srsController.review validates item type and quality', async () => {
    let called = false;
    const controller = loadController({
        VALID_ITEM_TYPES: ['vocab', 'kanji', 'grammar'],
        review: async () => {
            called = true;
        }
    });
    const res = createRes();

    await controller.review({
        user: { id: 5 },
        body: { item_type: 'unknown', item_id: 1, quality: 9 }
    }, res);

    assertStatus(res, 400);
    assert.equal(called, false);
});

test('srsController.review saves a valid review', async () => {
    let payload;
    const controller = loadController({
        VALID_ITEM_TYPES: ['vocab', 'kanji', 'grammar'],
        review: async (userId, itemType, itemId, quality) => {
            payload = { userId, itemType, itemId, quality };
            return { itemType, itemId, repetitions: 1 };
        }
    });
    const res = createRes();

    await controller.review({
        user: { id: 5 },
        body: { item_type: 'kanji', item_id: '10', quality: '3' }
    }, res);

    assertStatus(res, 200);
    assert.deepEqual(payload, { userId: 5, itemType: 'kanji', itemId: 10, quality: 3 });
    assert.deepEqual(res.body, { itemType: 'kanji', itemId: 10, repetitions: 1 });
});

test('srsController.review rejects missing items', async () => {
    let reviewCalled = false;
    clearModule(controllerPath);
    mockModule(modelPath, {
        VALID_ITEM_TYPES: ['vocab', 'kanji', 'grammar'],
        review: async () => {
            reviewCalled = true;
        }
    });
    mockModule(vocabularyPath, { getById: async () => null });
    mockModule(kanjiPath, { getById: async () => ({ id: 1 }) });
    mockModule(grammarPath, { getById: async () => ({ id: 1 }) });
    const controller = require('../controllers/srsController');
    const res = createRes();

    await controller.review({
        user: { id: 5 },
        body: { item_type: 'vocab', item_id: 999, quality: 3 }
    }, res);

    assertStatus(res, 404);
    assert.equal(reviewCalled, false);
});
