const assert = require('node:assert/strict');
const test = require('node:test');
const { assertStatus, clearModule, createNext, createRes, mockModule } = require('./testUtils');

const userModelPath = require.resolve('../models/userModel');
const middlewarePath = require.resolve('../middlewares/adminMiddleware');

function loadAdminMiddleware(userModel) {
    clearModule(middlewarePath);
    mockModule(userModelPath, userModel);
    return require('../middlewares/adminMiddleware');
}

test.afterEach(() => {
    clearModule(middlewarePath);
    clearModule(userModelPath);
});

test('adminMiddleware rejects requests without req.user', async () => {
    const adminMiddleware = loadAdminMiddleware({ findById: async () => null });
    const res = createRes();
    const next = createNext();

    await adminMiddleware({}, res, next);

    assertStatus(res, 403);
    assert.equal(next.called, false);
});

test('adminMiddleware rejects non-admin users', async () => {
    const adminMiddleware = loadAdminMiddleware({
        findById: async () => ({ id: 7, role: 'user' })
    });
    const res = createRes();
    const next = createNext();

    await adminMiddleware({ user: { id: 7 } }, res, next);

    assertStatus(res, 403);
    assert.equal(next.called, false);
});

test('adminMiddleware allows admin users', async () => {
    const adminMiddleware = loadAdminMiddleware({
        findById: async () => ({ id: 1, role: 'admin' })
    });
    const res = createRes();
    const next = createNext();

    await adminMiddleware({ user: { id: 1 } }, res, next);

    assert.equal(next.called, true);
    assertStatus(res, 200);
});
