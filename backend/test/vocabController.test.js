const assert = require('node:assert/strict');
const test = require('node:test');
const { assertStatus, clearModule, createRes, mockModule } = require('./testUtils');

const vocabularyPath = require.resolve('../models/vocabulary');
const historyPath = require.resolve('../models/history');
const userPath = require.resolve('../models/userModel');
const controllerPath = require.resolve('../controllers/vocabController');

function loadController({ Vocabulary, History, User }) {
    clearModule(controllerPath);
    mockModule(vocabularyPath, Vocabulary);
    mockModule(historyPath, History);
    mockModule(userPath, User);
    return require('../controllers/vocabController');
}

test.afterEach(() => {
    clearModule(controllerPath);
    clearModule(vocabularyPath);
    clearModule(historyPath);
    clearModule(userPath);
});

test('vocabController.update blocks vocabulary content edits for non-admin users', async () => {
    let updateBaseCalled = false;
    const controller = loadController({
        Vocabulary: {
            getById: async () => ({
                id: 12,
                lesson: '1',
                level: 'N5',
                japanese: 'old',
                hiragana: 'old',
                meaning: 'old',
                type: 'noun',
                status: 'not-learned'
            }),
            updateBase: async () => {
                updateBaseCalled = true;
            }
        },
        History: { logAction: async () => null },
        User: { findById: async () => ({ id: 2, role: 'user' }) }
    });
    const res = createRes();

    await controller.update({
        params: { id: 12 },
        user: { id: 2 },
        body: { japanese: 'new' }
    }, res);

    assertStatus(res, 403);
    assert.equal(updateBaseCalled, false);
});

test('vocabController.update writes progress to the authenticated user only', async () => {
    let upsertArgs;
    let historyArgs;
    const controller = loadController({
        Vocabulary: {
            getById: async () => ({
                id: 12,
                lesson: '1',
                level: 'N5',
                japanese: 'word',
                hiragana: 'word',
                meaning: 'meaning',
                type: 'noun',
                status: 'learning',
                review_count: 1
            }),
            upsertProgress: async (...args) => {
                upsertArgs = args;
                return { id: 12, status: 'mastered' };
            }
        },
        History: {
            logAction: async (...args) => {
                historyArgs = args;
            }
        },
        User: { findById: async () => ({ id: 5, role: 'user' }) }
    });
    const res = createRes();

    await controller.update({
        params: { id: 12 },
        user: { id: 5 },
        body: { status: 'mastered', review_count: 2 }
    }, res);

    assert.deepEqual(upsertArgs.slice(0, 2), [5, 12]);
    assert.equal(upsertArgs[2].status, 'mastered');
    assert.deepEqual(historyArgs, [12, 'status_changed', 'learning', 'mastered', 5]);
    assert.deepEqual(res.body, { id: 12, status: 'mastered' });
});

test('vocabController.update rejects progress payloads with invalid scheduling values', async () => {
    const controller = loadController({
        Vocabulary: {
            getById: async () => ({
                id: 12,
                lesson: '1',
                level: 'N5',
                japanese: 'word',
                hiragana: 'word',
                meaning: 'meaning',
                type: 'noun',
                status: 'learning'
            })
        },
        History: { logAction: async () => null },
        User: { findById: async () => ({ id: 5, role: 'user' }) }
    });
    const res = createRes();

    await controller.update({
        params: { id: 12 },
        user: { id: 5 },
        body: { interval: -1 }
    }, res);

    assertStatus(res, 400);
    assert.match(res.body.error, /interval/);
});
