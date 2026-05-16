const assert = require('node:assert/strict');
const test = require('node:test');
const { assertStatus, clearModule, createRes, mockModule } = require('./testUtils');

const modelPath = require.resolve('../models/testResult');
const controllerPath = require.resolve('../controllers/testController');

function loadController(TestResult) {
    clearModule(controllerPath);
    mockModule(modelPath, TestResult);
    return require('../controllers/testController');
}

test.afterEach(() => {
    clearModule(controllerPath);
    clearModule(modelPath);
});

test('testController.submit validates scores and question counts before saving', async () => {
    let saveCalled = false;
    const controller = loadController({
        save: async () => {
            saveCalled = true;
        }
    });
    const res = createRes();

    await controller.submit({
        user: { id: 3 },
        body: {
            test_type: 'vocab',
            total_questions: 5,
            correct_answers: 6,
            score: 120
        }
    }, res);

    assertStatus(res, 400);
    assert.equal(saveCalled, false);
});

test('testController.submit saves a normalized result for the authenticated user', async () => {
    let savedPayload;
    const controller = loadController({
        save: async (payload) => {
            savedPayload = payload;
            return { id: 9, ...payload };
        }
    });
    const res = createRes();

    await controller.submit({
        user: { id: 3 },
        body: {
            test_type: 'vocab',
            level: 'N5',
            lesson: '1',
            total_questions: '10',
            correct_answers: '8',
            score: '80',
            time_taken: '90',
            mode: 'exam',
            details: [{ question: 1 }]
        }
    }, res);

    assertStatus(res, 201);
    assert.equal(savedPayload.user_id, 3);
    assert.equal(savedPayload.total_questions, 10);
    assert.equal(savedPayload.correct_answers, 8);
    assert.equal(savedPayload.score, 80);
    assert.equal(savedPayload.time_taken, 90);
    assert.equal(res.body.id, 9);
});

test('testController.getHistory clamps history limit to 100', async () => {
    let receivedLimit;
    const controller = loadController({
        getByUserId: async (_userId, limit) => {
            receivedLimit = limit;
            return [];
        }
    });
    const res = createRes();

    await controller.getHistory({
        user: { id: 4 },
        query: { limit: '500' }
    }, res);

    assert.equal(receivedLimit, 100);
    assert.deepEqual(res.body, []);
});

test('testController.getById forbids reading another user test result', async () => {
    const controller = loadController({
        getById: async () => ({ id: 15, user_id: 99 })
    });
    const res = createRes();

    await controller.getById({
        user: { id: 4 },
        params: { id: 15 }
    }, res);

    assertStatus(res, 403);
});
