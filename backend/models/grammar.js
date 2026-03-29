const pool = require('../db');

const Grammar = {
    getAll: async (filters = {}) => {
        let query = 'SELECT * FROM grammar';
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
        if (filters.textbook) {
            conditions.push(`textbook = $${paramIndex++}`);
            values.push(filters.textbook);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY level ASC, CAST(lesson AS INTEGER) ASC, id ASC';

        const result = await pool.query(query, values);
        return result.rows;
    },

    getById: async (id) => {
        const result = await pool.query('SELECT * FROM grammar WHERE id = $1', [id]);
        return result.rows[0];
    },

    create: async (data) => {
        const { level, lesson, textbook, pattern, meaning, explanation, example_ja, example_vi, note } = data;
        const result = await pool.query(
            `INSERT INTO grammar (level, lesson, textbook, pattern, meaning, explanation, example_ja, example_vi, note)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [level, lesson || null, textbook || 'Minna', pattern, meaning, explanation || null, example_ja || null, example_vi || null, note || null]
        );
        return result.rows[0];
    },

    update: async (id, data) => {
        const { level, lesson, textbook, pattern, meaning, explanation, example_ja, example_vi, note } = data;
        const result = await pool.query(
            `UPDATE grammar SET level = $1, lesson = $2, textbook = $3, pattern = $4, meaning = $5,
             explanation = $6, example_ja = $7, example_vi = $8, note = $9 WHERE id = $10 RETURNING *`,
            [level, lesson, textbook, pattern, meaning, explanation, example_ja, example_vi, note, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        await pool.query('DELETE FROM grammar WHERE id = $1', [id]);
    }
};

module.exports = Grammar;
