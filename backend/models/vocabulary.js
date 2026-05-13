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
        const {
            lesson,
            level,
            japanese,
            hiragana,
            meaning,
            type,
            status = 'not-learned',
            last_reviewed = null,
            review_count = 0,
            interval = 0,
            ease_factor = 2.5,
            next_review = new Date().toISOString(),
            is_difficult = false
        } = data;
        const result = await pool.query(
            `INSERT INTO vocabulary
             (lesson, level, japanese, hiragana, meaning, type, status, last_reviewed, review_count, "interval", ease_factor, next_review, is_difficult)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [lesson, level, japanese, hiragana, meaning, type, status, last_reviewed, review_count, interval, ease_factor, next_review, is_difficult]
        );
        return result.rows[0];
    },

    update: async (id, data) => {
        const {
            status,
            last_reviewed,
            review_count,
            interval,
            ease_factor,
            next_review,
            is_difficult,
            japanese,
            hiragana,
            meaning,
            type
        } = data;

        const result = await pool.query(
            `UPDATE vocabulary
             SET status = $1,
                 last_reviewed = $2,
                 review_count = $3,
                 "interval" = $4,
                 ease_factor = $5,
                 next_review = $6,
                 is_difficult = $7,
                 japanese = $8,
                 hiragana = $9,
                 meaning = $10,
                 type = $11
             WHERE id = $12
             RETURNING *`,
            [status, last_reviewed, review_count, interval, ease_factor, next_review, is_difficult, japanese, hiragana, meaning, type, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        await pool.query('DELETE FROM vocabulary WHERE id = $1', [id]);
    }
};

module.exports = Vocabulary;
