const pool = require('../db');

const VALID_ITEM_TYPES = ['vocab', 'kanji', 'grammar'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalize(row) {
    return {
        id: row.id,
        userId: row.user_id,
        itemType: row.item_type,
        itemId: row.item_id,
        repetitions: Number(row.repetitions || 0),
        interval: Number(row.interval || 0),
        easeFactor: Number(row.ease_factor || 2.5),
        nextReview: row.next_review,
        lastReview: row.last_review,
    };
}

function calculateReviewState(current, quality, now = new Date()) {
    let repetitions = Number(current.repetitions || 0);
    let interval = Number(current.interval || 0);
    let easeFactor = Number(current.ease_factor || current.easeFactor || 2.5);

    if (quality < 2) {
        repetitions = 0;
        interval = 0;
        return {
            repetitions,
            interval,
            easeFactor,
            lastReview: now,
            nextReview: new Date(now.getTime() + 60 * 1000),
        };
    }

    repetitions += 1;
    if (repetitions === 1) {
        interval = 1;
    } else if (repetitions === 2) {
        interval = 3;
    } else {
        interval = Math.round(interval * easeFactor);
    }

    easeFactor += (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    return {
        repetitions,
        interval,
        easeFactor,
        lastReview: now,
        nextReview: new Date(now.getTime() + interval * MS_PER_DAY),
    };
}

const SrsProgress = {
    VALID_ITEM_TYPES,
    calculateReviewState,

    getByUserId: async (userId) => {
        const result = await pool.query(
            `SELECT *
             FROM user_srs_progress
             WHERE user_id = $1
             ORDER BY next_review ASC, item_type ASC, item_id ASC`,
            [userId]
        );
        return result.rows.map(normalize);
    },

    review: async (userId, itemType, itemId, quality) => {
        const existing = await pool.query(
            `SELECT *
             FROM user_srs_progress
             WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
            [userId, itemType, itemId]
        );

        const current = existing.rows[0] || {
            repetitions: 0,
            interval: 0,
            ease_factor: 2.5,
        };
        const next = calculateReviewState(current, quality);

        const result = await pool.query(
            `INSERT INTO user_srs_progress
             (user_id, item_type, item_id, repetitions, "interval", ease_factor, next_review, last_review, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, item_type, item_id)
             DO UPDATE SET
                 repetitions = EXCLUDED.repetitions,
                 "interval" = EXCLUDED."interval",
                 ease_factor = EXCLUDED.ease_factor,
                 next_review = EXCLUDED.next_review,
                 last_review = EXCLUDED.last_review,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [
                userId,
                itemType,
                itemId,
                next.repetitions,
                next.interval,
                next.easeFactor,
                next.nextReview,
                next.lastReview,
            ]
        );

        return normalize(result.rows[0]);
    },
};

module.exports = SrsProgress;
