const pool = require('../db');

const History = {

    logAction: async (vocab_id, action, old_status, new_status) => {
        try {
            const result = await pool.query(
                'INSERT INTO learning_history (vocab_id, action, old_status, new_status) VALUES ($1, $2, $3, $4) RETURNING *',
                [vocab_id, action, old_status, new_status]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error logging to learning_history:', error);
            return null;
        }
    },

    // Count words mastered this week that are STILL mastered
    getWeeklyGoal: async () => {
        try {
            const result = await pool.query(`
                SELECT COUNT(DISTINCT h.vocab_id) as count
                FROM learning_history h
                JOIN vocabulary v ON h.vocab_id = v.id
                WHERE h.new_status = 'mastered'
                AND h.created_at >= date_trunc('week', CURRENT_DATE)
                AND v.status = 'mastered'
            `);
            return parseInt(result.rows[0].count, 10);
        } catch (error) {
            console.error('Error calculating weekly goal:', error);
            return 0;
        }
    },


    getRecentHistory: async (limit = 20) => {
        try {
            const result = await pool.query(`
                SELECT h.id, h.vocab_id, h.action, h.old_status, h.new_status, h.created_at, v.japanese, v.hiragana, v.meaning 
                FROM learning_history h
                JOIN vocabulary v ON h.vocab_id = v.id
                ORDER BY h.created_at DESC
                LIMIT $1
            `, [limit]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching recent history:', error);
            return [];
        }
    }
};

module.exports = History;
