const assert = require('node:assert/strict');
const test = require('node:test');
const { assertStatus, clearModule, createRes, mockModule } = require('./testUtils');

const modelPath = require.resolve('../models/gamification');
const controllerPath = require.resolve('../controllers/gamificationController');

function loadController(Gamification) {
    clearModule(controllerPath);
    mockModule(modelPath, Gamification);
    return require('../controllers/gamificationController');
}

test.afterEach(() => {
    clearModule(controllerPath);
    clearModule(modelPath);
});

test('gamificationController.getMe returns authenticated user gamification state', async () => {
    const controller = loadController({
        getByUserId: async (userId) => ({ userId, xp: 25 })
    });
    const res = createRes();

    await controller.getMe({ user: { id: 7 } }, res);

    assertStatus(res, 200);
    assert.deepEqual(res.body, { userId: 7, xp: 25 });
});

test('gamificationController.trackEvent rejects invalid events', async () => {
    let called = false;
    const controller = loadController({
        trackEvent: async () => {
            called = true;
        }
    });
    const res = createRes();

    await controller.trackEvent({
        user: { id: 7 },
        body: { event_type: 'unknown_event' }
    }, res);

    assertStatus(res, 400);
    assert.equal(called, false);
});

test('gamificationController.trackEvent passes valid events to the model', async () => {
    let payload;
    const controller = loadController({
        trackEvent: async (userId, eventType, extra) => {
            payload = { userId, eventType, extra };
            return { xp: 45, awardedXp: 15 };
        }
    });
    const res = createRes();

    await controller.trackEvent({
        user: { id: 7 },
        body: { event_type: 'test_complete', extra: { score: 80 } }
    }, res);

    assertStatus(res, 200);
    assert.deepEqual(payload, { userId: 7, eventType: 'test_complete', extra: { score: 80 } });
    assert.deepEqual(res.body, { xp: 45, awardedXp: 15 });
});
