const assert = require('node:assert/strict');
const test = require('node:test');
const Gamification = require('../models/gamification');

function createRow(overrides = {}) {
    return {
        user_id: 1,
        xp: 0,
        total_xp_earned: 0,
        daily_xp: 0,
        daily_xp_date: new Date().toISOString().slice(0, 10),
        streak: 0,
        last_active_date: null,
        badges: [],
        stats: {
            testsCompleted: 0,
            flashcardsFlipped: 0,
            vocabReviewed: 0,
            kanjiReviewed: 0,
            srsSessions: 0,
        },
        ...overrides,
    };
}

test('Gamification.applyEvent awards daily login xp only once per day', () => {
    const row = createRow();

    const first = Gamification.applyEvent(row, 'daily_login');
    const second = Gamification.applyEvent(row, 'daily_login');

    assert.equal(first.awardedXp, 10);
    assert.equal(second.awardedXp, 0);
    assert.equal(row.xp, 10);
    assert.equal(row.daily_xp, 10);
    assert.equal(row.streak, 1);
});

test('Gamification.applyEvent does not advance streak twice for Date objects on the same day', () => {
    const now = new Date();
    const todayAsDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const row = createRow({
        xp: 10,
        total_xp_earned: 10,
        daily_xp: 10,
        daily_xp_date: todayAsDate,
        streak: 5,
        last_active_date: todayAsDate,
    });

    const result = Gamification.applyEvent(row, 'daily_login');

    assert.equal(result.awardedXp, 0);
    assert.equal(row.xp, 10);
    assert.equal(row.daily_xp, 10);
    assert.equal(row.streak, 5);
});

test('Gamification.applyEvent respects the daily xp cap', () => {
    const row = createRow({ xp: 149, total_xp_earned: 149, daily_xp: 149 });

    const result = Gamification.applyEvent(row, 'test_complete', { score: 100 });

    assert.equal(result.awardedXp, 1);
    assert.equal(result.capped, true);
    assert.equal(row.xp, 150);
    assert.equal(row.daily_xp, Gamification.DAILY_XP_CAP);
    assert.equal(row.stats.testsCompleted, 1);
});
