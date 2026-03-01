const pool = require('../db');

const Vocabulary = {
    getAll: async () => {
        const result = await pool.query('SELECT * FROM vocabulary ORDER BY level ASC, id ASC');
        return result.rows;
    },

    getById: async (id) => {
        const result = await pool.query('SELECT * FROM vocabulary WHERE id = $1', [id]);
        return result.rows[0];
    },

    getByLevelAndLesson: async (level, lesson) => {
        const result = await pool.query(
            'SELECT * FROM vocabulary WHERE level = $1 AND lesson = $2 ORDER BY level ASC, id ASC',
            [level, lesson]
        );
        return result.rows;
    },

    create: async (data) => {
        const { lesson, level, japanese, hiragana, meaning, type } = data;
        const result = await pool.query(
            'INSERT INTO vocabulary (lesson, level, japanese, hiragana, meaning, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [lesson, level, japanese, hiragana, meaning, type]
        );
        return result.rows[0];
    },

    update: async (id, data) => {
        const { status, last_reviewed, review_count, is_difficult, japanese, hiragana, meaning, type } = data;

        const result = await pool.query(
            'UPDATE vocabulary SET status = $1, last_reviewed = $2, review_count = $3, is_difficult = $4, japanese = $5, hiragana = $6, meaning = $7, type = $8 WHERE id = $9 RETURNING *',
            [status, last_reviewed, review_count, is_difficult, japanese, hiragana, meaning, type, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        await pool.query('DELETE FROM vocabulary WHERE id = $1', [id]);
    }
};

module.exports = Vocabulary;
