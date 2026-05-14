const pool = require('../db');

const BASE_COLUMNS = `
    v.id,
    v.lesson,
    v.level,
    v.japanese,
    v.hiragana,
    v.meaning,
    v.type
`;

const GUEST_PROGRESS_COLUMNS = `
    'not-learned'::varchar AS status,
    NULL::timestamp AS last_reviewed,
    0 AS review_count,
    0 AS "interval",
    2.50::numeric AS ease_factor,
    CURRENT_TIMESTAMP AS next_review,
    false AS is_difficult
`;

const USER_PROGRESS_COLUMNS = `
    COALESCE(p.status, 'not-learned') AS status,
    p.last_reviewed,
    COALESCE(p.review_count, 0) AS review_count,
    COALESCE(p."interval", 0) AS "interval",
    COALESCE(p.ease_factor, 2.50) AS ease_factor,
    COALESCE(p.next_review, CURRENT_TIMESTAMP) AS next_review,
    COALESCE(p.is_difficult, false) AS is_difficult
`;

function selectVocabularyQuery({ where = '', orderBy = 'ORDER BY v.level ASC, v.id ASC', userId = null } = {}) {
    if (userId) {
        return {
            text: `
                SELECT ${BASE_COLUMNS}, ${USER_PROGRESS_COLUMNS}
                FROM vocabulary v
                LEFT JOIN user_vocabulary_progress p
                    ON p.vocab_id = v.id AND p.user_id = $1
                ${where}
                ${orderBy}
            `,
            baseValues: [userId],
        };
    }

    return {
        text: `
            SELECT ${BASE_COLUMNS}, ${GUEST_PROGRESS_COLUMNS}
            FROM vocabulary v
            ${where}
            ${orderBy}
        `,
        baseValues: [],
    };
}

const Vocabulary = {
    getAll: async (userId = null) => {
        const query = selectVocabularyQuery({ userId });
        const result = await pool.query(query.text, query.baseValues);
        return result.rows;
    },

    getById: async (id, userId = null) => {
        const query = selectVocabularyQuery({
            where: userId ? 'WHERE v.id = $2' : 'WHERE v.id = $1',
            orderBy: '',
            userId
        });
        const result = await pool.query(query.text, [...query.baseValues, id]);
        return result.rows[0];
    },

    getByLevelAndLesson: async (level, lesson, userId = null) => {
        const query = selectVocabularyQuery({
            where: userId ? 'WHERE v.level = $2 AND v.lesson = $3' : 'WHERE v.level = $1 AND v.lesson = $2',
            orderBy: 'ORDER BY v.level ASC, v.id ASC',
            userId
        });
        const result = await pool.query(query.text, [...query.baseValues, level, lesson]);
        return result.rows;
    },

    create: async (data) => {
        const { lesson, level, japanese, hiragana, meaning, type } = data;
        const result = await pool.query(
            `INSERT INTO vocabulary (lesson, level, japanese, hiragana, meaning, type)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [lesson, level, japanese, hiragana, meaning, type]
        );
        return Vocabulary.getById(result.rows[0].id);
    },

    updateBase: async (id, data) => {
        const { lesson, level, japanese, hiragana, meaning, type } = data;
        const result = await pool.query(
            `UPDATE vocabulary
             SET lesson = $1,
                 level = $2,
                 japanese = $3,
                 hiragana = $4,
                 meaning = $5,
                 type = $6
             WHERE id = $7
             RETURNING id`,
            [lesson, level, japanese, hiragana, meaning, type, id]
        );
        if (!result.rows[0]) return null;
        return Vocabulary.getById(result.rows[0].id);
    },

    upsertProgress: async (userId, vocabId, data) => {
        const {
            status = 'not-learned',
            last_reviewed = null,
            review_count = 0,
            interval = 0,
            ease_factor = 2.5,
            next_review = new Date().toISOString(),
            is_difficult = false
        } = data;

        await pool.query(
            `INSERT INTO user_vocabulary_progress
             (user_id, vocab_id, status, last_reviewed, review_count, "interval", ease_factor, next_review, is_difficult, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, vocab_id)
             DO UPDATE SET
                 status = EXCLUDED.status,
                 last_reviewed = EXCLUDED.last_reviewed,
                 review_count = EXCLUDED.review_count,
                 "interval" = EXCLUDED."interval",
                 ease_factor = EXCLUDED.ease_factor,
                 next_review = EXCLUDED.next_review,
                 is_difficult = EXCLUDED.is_difficult,
                 updated_at = CURRENT_TIMESTAMP`,
            [userId, vocabId, status, last_reviewed, review_count, interval, ease_factor, next_review, is_difficult]
        );

        return Vocabulary.getById(vocabId, userId);
    },

    delete: async (id) => {
        await pool.query('DELETE FROM vocabulary WHERE id = $1', [id]);
    }
};

module.exports = Vocabulary;
