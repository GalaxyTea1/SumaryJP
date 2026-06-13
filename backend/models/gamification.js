const pool = require('../db');

const DAILY_XP_CAP = 150;

const DEFAULT_STATS = {
    testsCompleted: 0,
    flashcardsFlipped: 0,
    vocabReviewed: 0,
    kanjiReviewed: 0,
    srsSessions: 0,
    kanaMastered: 0,
    kanaQuizCorrect: 0,
};

const LEVELS = [
    { level: 1, xpRequired: 0 },
    { level: 2, xpRequired: 50 },
    { level: 3, xpRequired: 150 },
    { level: 4, xpRequired: 350 },
    { level: 5, xpRequired: 600 },
    { level: 6, xpRequired: 1000 },
    { level: 7, xpRequired: 1500 },
    { level: 8, xpRequired: 2200 },
    { level: 9, xpRequired: 3000 },
    { level: 10, xpRequired: 4000 },
];

const XP_REWARDS = {
    first_login: 10,
    daily_login: 10,
    flashcard_complete: 5,
    test_complete: 15,
    test_perfect: 30,
    srs_session: 10,
    srs_card_good: 3,
    kana_mastered: 2,
    kana_quiz_correct: 1,
};

function toDateKey(value) {
    if (!value) return null;
    if (value instanceof Date) return formatDateKey(value);
    return String(value).slice(0, 10);
}

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayKey() {
    return formatDateKey(new Date());
}

function getYesterdayKey() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return formatDateKey(date);
}

function getCurrentLevel(xp) {
    let current = LEVELS[0];
    for (const level of LEVELS) {
        if (xp >= level.xpRequired) current = level;
        else break;
    }
    return current;
}

function createDefaultRow(userId) {
    return {
        user_id: userId,
        xp: 0,
        total_xp_earned: 0,
        daily_xp: 0,
        daily_xp_date: getTodayKey(),
        streak: 0,
        last_active_date: null,
        badges: [],
        stats: { ...DEFAULT_STATS },
    };
}

function normalizeRow(row) {
    const stats = typeof row.stats === 'string' ? JSON.parse(row.stats) : (row.stats || {});
    const badges = typeof row.badges === 'string' ? JSON.parse(row.badges) : (row.badges || []);

    return {
        userId: row.user_id,
        xp: Number(row.xp || 0),
        totalXpEarned: Number(row.total_xp_earned || 0),
        dailyXp: Number(row.daily_xp || 0),
        dailyXpCap: DAILY_XP_CAP,
        dailyXpDate: toDateKey(row.daily_xp_date),
        streak: Number(row.streak || 0),
        lastActiveDate: toDateKey(row.last_active_date),
        badges,
        stats: { ...DEFAULT_STATS, ...stats },
    };
}

function updateStreak(row, today = getTodayKey()) {
    const lastActiveDate = toDateKey(row.last_active_date);
    if (lastActiveDate === today) return;

    row.streak = lastActiveDate === getYesterdayKey() ? Number(row.streak || 0) + 1 : 1;
    row.last_active_date = today;
}

function applyDailyReset(row, today = getTodayKey()) {
    if (toDateKey(row.daily_xp_date) !== today) {
        row.daily_xp = 0;
        row.daily_xp_date = today;
    }
}

function addXp(row, amount) {
    const remaining = Math.max(DAILY_XP_CAP - Number(row.daily_xp || 0), 0);
    const awarded = Math.min(Math.max(Number(amount || 0), 0), remaining);
    row.xp = Number(row.xp || 0) + awarded;
    row.total_xp_earned = Number(row.total_xp_earned || 0) + awarded;
    row.daily_xp = Number(row.daily_xp || 0) + awarded;
    return awarded;
}

function addBadge(row, badgeId, newBadges) {
    if (!row.badges.includes(badgeId)) {
        row.badges.push(badgeId);
        newBadges.push(badgeId);
    }
}

function applyBadges(row, eventType, extra, newBadges) {
    if (eventType === 'first_login' || eventType === 'daily_login') addBadge(row, 'first_login', newBadges);
    if (row.stats.testsCompleted >= 1) addBadge(row, 'first_test', newBadges);
    if (Number(extra.score) === 100) addBadge(row, 'first_perfect', newBadges);
    if (row.streak >= 3) addBadge(row, 'streak_3', newBadges);
    if (row.streak >= 7) addBadge(row, 'streak_7', newBadges);
    if (row.streak >= 30) addBadge(row, 'streak_30', newBadges);
    if (row.stats.vocabReviewed >= 50) addBadge(row, 'vocab_50', newBadges);
    if (row.stats.vocabReviewed >= 200) addBadge(row, 'vocab_200', newBadges);
    if (row.stats.kanjiReviewed >= 20) addBadge(row, 'kanji_20', newBadges);
    if (row.stats.flashcardsFlipped >= 100) addBadge(row, 'flashcard_100', newBadges);
    if (row.xp >= 1000) addBadge(row, 'xp_1000', newBadges);
    if (getCurrentLevel(row.xp).level >= 5) addBadge(row, 'level_5', newBadges);
    if (row.stats.srsSessions >= 10) addBadge(row, 'srs_master_10', newBadges);

    const hour = new Date().getHours();
    if (hour >= 23) addBadge(row, 'night_owl', newBadges);
    if (hour < 7) addBadge(row, 'early_bird', newBadges);
}

function applyEvent(row, eventType, extra = {}) {
    const stats = { ...DEFAULT_STATS, ...(row.stats || {}) };
    const newBadges = [];
    let awardedXp = 0;
    const wasActiveToday = toDateKey(row.last_active_date) === getTodayKey();

    row.stats = stats;
    row.badges = Array.isArray(row.badges) ? row.badges : [];
    applyDailyReset(row);
    updateStreak(row);

    switch (eventType) {
        case 'first_login':
        case 'daily_login':
            if (!wasActiveToday) {
                awardedXp += addXp(row, XP_REWARDS.daily_login);
            }
            break;
        case 'test_complete':
            stats.testsCompleted += 1;
            awardedXp += addXp(row, XP_REWARDS.test_complete);
            if (Number(extra.score) === 100) {
                awardedXp += addXp(row, XP_REWARDS.test_perfect);
            }
            break;
        case 'flashcard_flip':
            stats.flashcardsFlipped += 1;
            break;
        case 'flashcard_complete':
            awardedXp += addXp(row, XP_REWARDS.flashcard_complete);
            break;
        case 'srs_session':
            stats.srsSessions += 1;
            awardedXp += addXp(row, XP_REWARDS.srs_session);
            break;
        case 'srs_card_good':
            awardedXp += addXp(row, XP_REWARDS.srs_card_good);
            break;
        case 'vocab_review':
            stats.vocabReviewed += Math.max(Number(extra.count || 1), 0);
            break;
        case 'kanji_review':
            stats.kanjiReviewed += Math.max(Number(extra.count || 1), 0);
            break;
        case 'kana_mastered':
            stats.kanaMastered = Number(stats.kanaMastered || 0) + 1;
            awardedXp += addXp(row, XP_REWARDS.kana_mastered);
            break;
        case 'kana_quiz_correct':
            stats.kanaQuizCorrect = Number(stats.kanaQuizCorrect || 0) + 1;
            awardedXp += addXp(row, XP_REWARDS.kana_quiz_correct);
            break;
        default:
            throw new Error('INVALID_EVENT_TYPE');
    }

    applyBadges(row, eventType, extra, newBadges);
    return { awardedXp, capped: Number(row.daily_xp || 0) >= DAILY_XP_CAP, newBadges };
}

async function getOrCreate(userId, client = pool) {
    const existing = await client.query('SELECT * FROM user_gamification WHERE user_id = $1', [userId]);
    if (existing.rows[0]) return existing.rows[0];

    const created = await client.query(
        `INSERT INTO user_gamification (user_id, stats, badges)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, JSON.stringify(DEFAULT_STATS), JSON.stringify([])]
    );
    return created.rows[0];
}

const Gamification = {
    DAILY_XP_CAP,
    normalizeRow,
    applyEvent,

    getByUserId: async (userId) => {
        const row = await getOrCreate(userId);
        return normalizeRow(row);
    },

    trackEvent: async (userId, eventType, extra = {}) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const row = await getOrCreate(userId, client);
            const eventResult = applyEvent(row, eventType, extra);
            const saved = await client.query(
                `UPDATE user_gamification
                 SET xp = $2,
                     total_xp_earned = $3,
                     daily_xp = $4,
                     daily_xp_date = $5,
                     streak = $6,
                     last_active_date = $7,
                     badges = $8,
                     stats = $9,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1
                 RETURNING *`,
                [
                    userId,
                    row.xp,
                    row.total_xp_earned,
                    row.daily_xp,
                    row.daily_xp_date,
                    row.streak,
                    row.last_active_date,
                    JSON.stringify(row.badges),
                    JSON.stringify(row.stats),
                ]
            );
            await client.query('COMMIT');
            return {
                ...normalizeRow(saved.rows[0]),
                awardedXp: eventResult.awardedXp,
                capped: eventResult.capped,
                newBadges: eventResult.newBadges,
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = Gamification;
