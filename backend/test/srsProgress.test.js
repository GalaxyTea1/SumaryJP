const assert = require('node:assert/strict');
const test = require('node:test');
const SrsProgress = require('../models/srsProgress');

test('SrsProgress.calculateReviewState resets forgotten cards to one minute', () => {
    const now = new Date('2026-06-07T00:00:00.000Z');
    const next = SrsProgress.calculateReviewState({
        repetitions: 3,
        interval: 7,
        ease_factor: 2.5,
    }, 1, now);

    assert.equal(next.repetitions, 0);
    assert.equal(next.interval, 0);
    assert.equal(next.nextReview.toISOString(), '2026-06-07T00:01:00.000Z');
});

test('SrsProgress.calculateReviewState schedules successful reviews with SM-2 intervals', () => {
    const now = new Date('2026-06-07T00:00:00.000Z');
    const first = SrsProgress.calculateReviewState({ repetitions: 0, interval: 0, ease_factor: 2.5 }, 3, now);
    const second = SrsProgress.calculateReviewState({ repetitions: 1, interval: 1, ease_factor: 2.5 }, 3, now);

    assert.equal(first.repetitions, 1);
    assert.equal(first.interval, 1);
    assert.equal(second.repetitions, 2);
    assert.equal(second.interval, 3);
});
