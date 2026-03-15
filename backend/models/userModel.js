const pool = require('../db');

const User = {
    async create(username, password) {
        const query = `
            INSERT INTO users (username, password)
            VALUES ($1, $2)
            RETURNING id, username, current_streak, created_at
        `;
        const values = [username, password];
        try {
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        try {
            const { rows } = await pool.query(query, [username]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async findById(id) {
        const query = 'SELECT id, username, current_streak, created_at FROM users WHERE id = $1';
        try {
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
};

module.exports = User;
