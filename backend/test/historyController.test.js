const assert = require('node:assert/strict');
const test = require('node:test');
const { assertStatus, clearModule, createRes, mockModule } = require('./testUtils');

const historyPath = require.resolve('../models/history');
const settingsPath = require.resolve('../models/userLearningSettings');
const controllerPath = require.resolve('../controllers/historyController');

function loadController({ History, UserLearningSettings }) {
    clearModule(controllerPath);
    mockModule(historyPath, History);
    mockModule(settingsPath, UserLearningSettings);
    return require('../controllers/historyController');
}

test.afterEach(() => {
    clearModule(controllerPath);
    clearModule(historyPath);
    clearModule(settingsPath);
});

test('historyController.getWeeklyGoal returns backend target for authenticated users', async () => {
    let settingsUserId;
    const controller = loadController({
        History: { getWeeklyGoal: async () => 4 },
        UserLearningSettings: {
            DEFAULT_WEEKLY_GOAL_TARGET: 20,
            getByUserId: async (userId) => {
                settingsUserId = userId;
                return { weeklyGoalTarget: 30 };
            }
        }
    });
    const res = createRes();

    await controller.getWeeklyGoal({ user: { id: 7 } }, res);

    assertStatus(res, 200);
    assert.equal(settingsUserId, 7);
    assert.deepEqual(res.body, { goalCount: 4, goalTarget: 30 });
});

test('historyController.getWeeklyGoal returns default target for guests', async () => {
    const controller = loadController({
        History: { getWeeklyGoal: async () => 0 },
        UserLearningSettings: {
            DEFAULT_WEEKLY_GOAL_TARGET: 20,
            getByUserId: async () => {
                throw new Error('settings should not load for guests');
            }
        }
    });
    const res = createRes();

    await controller.getWeeklyGoal({}, res);

    assertStatus(res, 200);
    assert.deepEqual(res.body, { goalCount: 0, goalTarget: 20 });
});

test('historyController.updateWeeklyGoal rejects invalid targets', async () => {
    let updateCalled = false;
    const controller = loadController({
        History: { getWeeklyGoal: async () => 0 },
        UserLearningSettings: {
            DEFAULT_WEEKLY_GOAL_TARGET: 20,
            updateWeeklyGoalTarget: async () => {
                updateCalled = true;
            }
        }
    });
    const res = createRes();

    await controller.updateWeeklyGoal({ user: { id: 7 }, body: { goalTarget: 0 } }, res);

    assertStatus(res, 400);
    assert.equal(updateCalled, false);
});

test('historyController.updateWeeklyGoal saves a valid target', async () => {
    let updateArgs;
    const controller = loadController({
        History: { getWeeklyGoal: async () => 6 },
        UserLearningSettings: {
            DEFAULT_WEEKLY_GOAL_TARGET: 20,
            updateWeeklyGoalTarget: async (...args) => {
                updateArgs = args;
                return { weeklyGoalTarget: 35 };
            }
        }
    });
    const res = createRes();

    await controller.updateWeeklyGoal({ user: { id: 7 }, body: { goalTarget: '35' } }, res);

    assertStatus(res, 200);
    assert.deepEqual(updateArgs, [7, 35]);
    assert.deepEqual(res.body, { goalCount: 6, goalTarget: 35 });
});
