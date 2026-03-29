const pool = require('../db');

const TestResult = {
    save: async (data) => {
        const { user_id, test_type, level, lesson, total_questions, correct_answers, score, time_taken, mode, details } = data;
        const result = await pool.query(
            `INSERT INTO test_results (user_id, test_type, level, lesson, total_questions, correct_answers, score, time_taken, mode, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [user_id, test_type, level || null, lesson || null, total_questions, correct_answers, score, time_taken || null, mode || 'practice', details ? JSON.stringify(details) : null]
        );
        return result.rows[0];
    },

    getByUserId: async (userId, limit = 10) => {
        const result = await pool.query(
            'SELECT * FROM test_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
            [userId, limit]
        );
        return result.rows;
    },

    getById: async (id) => {
        const result = await pool.query('SELECT * FROM test_results WHERE id = $1', [id]);
        return result.rows[0];
    }
};

module.exports = TestResult;
