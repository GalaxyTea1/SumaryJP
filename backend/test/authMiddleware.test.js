process.env.JWT_SECRET = 'test-secret';

const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const { assertStatus, createNext, createRes } = require('./testUtils');

const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');

function reqWithAuthorization(value) {
    return {
        header(name) {
            return name === 'Authorization' ? value : undefined;
        }
    };
}

test('authMiddleware rejects requests without a bearer token', () => {
    const req = reqWithAuthorization(undefined);
    const res = createRes();
    const next = createNext();

    authMiddleware(req, res, next);

    assertStatus(res, 401);
    assert.equal(next.called, false);
    assert.match(res.body.error, /Token/);
});

test('authMiddleware accepts a valid bearer token and sets req.user', () => {
    const token = jwt.sign({ id: 42, username: 'alice' }, process.env.JWT_SECRET);
    const req = reqWithAuthorization(`Bearer ${token}`);
    const res = createRes();
    const next = createNext();

    authMiddleware(req, res, next);

    assert.equal(next.called, true);
    assert.equal(req.user.id, 42);
    assert.equal(req.user.username, 'alice');
});

test('optionalAuthMiddleware keeps guest requests unauthenticated', () => {
    const req = reqWithAuthorization(undefined);
    const res = createRes();
    const next = createNext();

    optionalAuthMiddleware(req, res, next);

    assert.equal(next.called, true);
    assert.equal(req.user, undefined);
});

test('optionalAuthMiddleware ignores invalid bearer tokens', () => {
    const req = reqWithAuthorization('Bearer invalid-token');
    const res = createRes();
    const next = createNext();

    optionalAuthMiddleware(req, res, next);

    assert.equal(next.called, true);
    assert.equal(req.user, null);
});
