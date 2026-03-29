const pool = require('../db');

const Kanji = {
    getAll: async (filters = {}) => {
        let query = 'SELECT * FROM kanji';
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (filters.level) {
            conditions.push(`level = $${paramIndex++}`);
            values.push(filters.level);
        }
        if (filters.lesson) {
            conditions.push(`lesson = $${paramIndex++}`);
            values.push(filters.lesson);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY level ASC, CAST(lesson AS INTEGER) ASC, id ASC';

        const result = await pool.query(query, values);
        return result.rows;
    },

    getById: async (id) => {
        const result = await pool.query('SELECT * FROM kanji WHERE id = $1', [id]);
        return result.rows[0];
    },

    create: async (data) => {
        const { level, lesson, character, onyomi, kunyomi, meaning, stroke_count, radical, example_words } = data;
        const result = await pool.query(
            `INSERT INTO kanji (level, lesson, character, onyomi, kunyomi, meaning, stroke_count, radical, example_words)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [level, lesson || null, character, onyomi || null, kunyomi || null, meaning, stroke_count || null, radical || null, example_words || null]
        );
        return result.rows[0];
    },

    update: async (id, data) => {
        const { level, lesson, character, onyomi, kunyomi, meaning, stroke_count, radical, example_words } = data;
        const result = await pool.query(
            `UPDATE kanji SET level = $1, lesson = $2, character = $3, onyomi = $4, kunyomi = $5,
             meaning = $6, stroke_count = $7, radical = $8, example_words = $9 WHERE id = $10 RETURNING *`,
            [level, lesson, character, onyomi, kunyomi, meaning, stroke_count, radical, example_words, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        await pool.query('DELETE FROM kanji WHERE id = $1', [id]);
    }
};

module.exports = Kanji;
