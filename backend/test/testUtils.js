const assert = require('node:assert/strict');

function clearModule(modulePath) {
    delete require.cache[require.resolve(modulePath)];
}

function mockModule(modulePath, exports) {
    require.cache[require.resolve(modulePath)] = {
        id: modulePath,
        filename: modulePath,
        loaded: true,
        exports
    };
}

function createRes() {
    return {
        statusCode: 200,
        body: undefined,
        sent: false,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        send(payload) {
            this.sent = true;
            this.body = payload;
            return this;
        }
    };
}

function createNext() {
    const next = () => {
        next.called = true;
    };
    next.called = false;
    return next;
}

function assertStatus(res, statusCode) {
    assert.equal(res.statusCode, statusCode);
}

module.exports = {
    assertStatus,
    clearModule,
    createNext,
    createRes,
    mockModule
};
