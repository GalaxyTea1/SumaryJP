process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-secret';

const assert = require('node:assert/strict');
const test = require('node:test');
const app = require('../../server');
const pool = require('../../db');

let server;
let baseUrl;

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    return { response, body };
}

test.before(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    await pool.query('DELETE FROM user_learning_settings');
    await pool.query('DELETE FROM user_srs_progress');
    await pool.query('DELETE FROM user_gamification');
    await pool.query('DELETE FROM test_results');
    await pool.query('DELETE FROM learning_history');
    await pool.query('DELETE FROM user_vocabulary_progress');
    await pool.query('DELETE FROM users');
});

test.after(async () => {
    await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    });
    await pool.end();
});

test('auth, vocabulary progress, and test history work against PostgreSQL', async () => {
    const username = `integration_${Date.now()}`;

    const register = await request('/api/auth/register', {
        method: 'POST',
        body: { username, password: 'password123' }
    });
    assert.equal(register.response.status, 201);
    assert.ok(register.body.token);

    const authHeaders = { Authorization: `Bearer ${register.body.token}` };

    const vocabList = await request('/api/vocab', { headers: authHeaders });
    assert.equal(vocabList.response.status, 200);
    assert.ok(vocabList.body.length > 0);
    assert.equal(vocabList.body[0].status, 'not-learned');

    const vocabId = vocabList.body[0].id;
    const progress = await request(`/api/vocab/${vocabId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: {
            status: 'mastered',
            review_count: 1,
            interval: 1,
            ease_factor: 2.5,
            next_review: new Date().toISOString(),
            is_difficult: true
        }
    });
    assert.equal(progress.response.status, 200, JSON.stringify(progress.body));
    assert.equal(progress.body.status, 'mastered');
    assert.equal(progress.body.review_count, 1);
    assert.equal(progress.body.is_difficult, true);

    const savedProgress = await pool.query(
        'SELECT status, review_count, is_difficult FROM user_vocabulary_progress WHERE user_id = $1 AND vocab_id = $2',
        [register.body.user.id, vocabId]
    );
    assert.equal(savedProgress.rows[0].status, 'mastered');
    assert.equal(savedProgress.rows[0].review_count, 1);
    assert.equal(savedProgress.rows[0].is_difficult, true);

    const submit = await request('/api/test/submit', {
        method: 'POST',
        headers: authHeaders,
        body: {
            test_type: 'vocab',
            level: 'N5',
            lesson: '1',
            total_questions: 10,
            correct_answers: 8,
            score: 80,
            time_taken: 120,
            mode: 'practice',
            details: [{ vocab_id: vocabId, correct: true }]
        }
    });
    assert.equal(submit.response.status, 201, JSON.stringify(submit.body));
    assert.equal(submit.body.user_id, register.body.user.id);

    const history = await request('/api/test/history?limit=5', { headers: authHeaders });
    assert.equal(history.response.status, 200);
    assert.equal(history.body.length, 1);
    assert.equal(history.body[0].score, 80);

    const weeklyGoal = await request('/api/history/weekly-goal', { headers: authHeaders });
    assert.equal(weeklyGoal.response.status, 200, JSON.stringify(weeklyGoal.body));
    assert.equal(weeklyGoal.body.goalTarget, 20);
    assert.equal(typeof weeklyGoal.body.goalCount, 'number');

    const updatedWeeklyGoal = await request('/api/history/weekly-goal', {
        method: 'PUT',
        headers: authHeaders,
        body: { goalTarget: 30 }
    });
    assert.equal(updatedWeeklyGoal.response.status, 200, JSON.stringify(updatedWeeklyGoal.body));
    assert.equal(updatedWeeklyGoal.body.goalTarget, 30);

    const gamification = await request('/api/gamification/me', { headers: authHeaders });
    assert.equal(gamification.response.status, 200, JSON.stringify(gamification.body));
    assert.equal(gamification.body.xp, 0);
    assert.equal(gamification.body.dailyXpCap, 150);

    const event = await request('/api/gamification/events', {
        method: 'POST',
        headers: authHeaders,
        body: {
            event_type: 'test_complete',
            extra: { score: 100 }
        }
    });
    assert.equal(event.response.status, 200, JSON.stringify(event.body));
    assert.equal(event.body.awardedXp, 45);
    assert.equal(event.body.stats.testsCompleted, 1);
    assert.ok(event.body.badges.includes('first_test'));
    assert.ok(event.body.badges.includes('first_perfect'));

    const srsReview = await request('/api/srs/review', {
        method: 'POST',
        headers: authHeaders,
        body: {
            item_type: 'vocab',
            item_id: vocabId,
            quality: 3
        }
    });
    assert.equal(srsReview.response.status, 200, JSON.stringify(srsReview.body));
    assert.equal(srsReview.body.itemType, 'vocab');
    assert.equal(srsReview.body.itemId, vocabId);
    assert.equal(srsReview.body.repetitions, 1);

    const srsProgress = await request('/api/srs/progress', { headers: authHeaders });
    assert.equal(srsProgress.response.status, 200, JSON.stringify(srsProgress.body));
    assert.equal(srsProgress.body.length, 1);
    assert.equal(srsProgress.body[0].itemId, vocabId);
});
