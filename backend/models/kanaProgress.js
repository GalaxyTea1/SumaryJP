const pool = require('../db');

const VALID_KANA_TYPES = ['hiragana', 'katakana'];
const VALID_STATUSES = ['learning', 'mastered'];

function normalize(row) {
    return {
        id: row.id,
        userId: row.user_id,
        kanaType: row.kana_type,
        character: row.character,
        status: row.status,
        reviewCount: Number(row.review_count || 0),
        lastReviewed: row.last_reviewed,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

const KanaProgress = {
    VALID_KANA_TYPES,
    VALID_STATUSES,

    getByUserId: async (userId) => {
        const result = await pool.query(
            `SELECT *
             FROM user_kana_progress
             WHERE user_id = $1
             ORDER BY kana_type ASC, character ASC`,
            [userId]
        );
        return result.rows.map(normalize);
    },

    upsert: async (userId, kanaType, character, status) => {
        const result = await pool.query(
            `INSERT INTO user_kana_progress
             (user_id, kana_type, character, status, review_count, last_reviewed, updated_at)
             VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, kana_type, character)
             DO UPDATE SET
                 status = EXCLUDED.status,
                 review_count = user_kana_progress.review_count + 1,
                 last_reviewed = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, kanaType, character, status]
        );
        return normalize(result.rows[0]);
    },
};

module.exports = KanaProgress;
