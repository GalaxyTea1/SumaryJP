// ============================================
// Gamification System - online-only
// ============================================

const gamification = (() => {
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
        { level: 1, title: 'Tân binh', xpRequired: 0 },
        { level: 2, title: 'Người mới bắt đầu', xpRequired: 50 },
        { level: 3, title: 'Học sinh chăm', xpRequired: 150 },
        { level: 4, title: 'Thợ học từ', xpRequired: 350 },
        { level: 5, title: 'Chiến binh N5', xpRequired: 600 },
        { level: 6, title: 'Samurai học tập', xpRequired: 1000 },
        { level: 7, title: 'Nhà thông thái', xpRequired: 1500 },
        { level: 8, title: 'Bậc thầy Kanji', xpRequired: 2200 },
        { level: 9, title: 'Sensei', xpRequired: 3000 },
        { level: 10, title: 'Vua tiếng Nhật', xpRequired: 4000 },
    ];

    const BADGE_DEFS = [
        { id: 'first_login', icon: '🌸', name: 'Chào mừng!', desc: 'Lần đầu truy cập' },
        { id: 'first_test', icon: '📝', name: 'Thử thách đầu tiên', desc: 'Hoàn thành bài test đầu tiên' },
        { id: 'first_perfect', icon: '💯', name: 'Hoàn hảo!', desc: 'Đạt 100% bài test' },
        { id: 'streak_3', icon: '🔥', name: 'Streak 3 ngày', desc: 'Học liên tục 3 ngày' },
        { id: 'streak_7', icon: '⚡', name: 'Streak 7 ngày', desc: 'Học liên tục 7 ngày' },
        { id: 'streak_30', icon: '🏆', name: 'Streak 30 ngày', desc: 'Học liên tục 30 ngày' },
        { id: 'vocab_50', icon: '📖', name: '50 từ vựng', desc: 'Ôn tập 50 từ vựng' },
        { id: 'vocab_200', icon: '📚', name: '200 từ vựng', desc: 'Ôn tập 200 từ vựng' },
        { id: 'kanji_20', icon: '🈳', name: '20 Kanji', desc: 'Ôn tập 20 Kanji' },
        { id: 'flashcard_100', icon: '🃏', name: '100 Flashcards', desc: 'Lật 100 flashcard' },
        { id: 'xp_1000', icon: '⭐', name: '1000 XP', desc: 'Đạt 1000 XP' },
        { id: 'level_5', icon: '👑', name: 'Level 5', desc: 'Đạt Level 5' },
        { id: 'srs_master_10', icon: '🧠', name: 'Nhà ôn tập', desc: 'Hoàn thành 10 phiên SRS' },
        { id: 'night_owl', icon: '🦉', name: 'Cú đêm', desc: 'Học sau 23:00' },
        { id: 'early_bird', icon: '🐦', name: 'Chim sớm', desc: 'Học trước 7:00' },
    ];

    const XP_REWARDS = {
        flashcard_complete: 5,
        test_complete: 15,
        test_perfect: 30,
        srs_session: 10,
        srs_card_good: 3,
        daily_login: 10,
        kana_mastered: 2,
        kana_quiz_correct: 1,
    };

    let state = createDefault();
    let initPromise = null;
    let hasLoaded = false;

    function createDefault() {
        return {
            xp: 0,
            totalXpEarned: 0,
            dailyXp: 0,
            dailyXpCap: 150,
            badges: [],
            streak: 0,
            lastActiveDate: null,
            stats: { ...DEFAULT_STATS },
        };
    }

    function normalize(data) {
        return {
            ...createDefault(),
            ...(data || {}),
            stats: { ...DEFAULT_STATS, ...((data && data.stats) || {}) },
            badges: Array.isArray(data?.badges) ? data.badges : [],
        };
    }

    async function init() {
        if (!auth.isLoggedIn()) {
            state = createDefault();
            hasLoaded = true;
            return state;
        }
        if (!initPromise) {
            initPromise = api.getGamification()
                .then(data => {
                    state = normalize(data);
                    hasLoaded = true;
                    return state;
                })
                .catch(error => {
                    console.error('Gamification load failed:', error);
                    throw error;
                })
                .finally(() => {
                    initPromise = null;
                });
        }
        return initPromise;
    }

    function getData() {
        return state;
    }

    function getCurrentLevel(xp) {
        let current = LEVELS[0];
        for (const lvl of LEVELS) {
            if (xp >= lvl.xpRequired) current = lvl;
            else break;
        }
        return current;
    }

    function getNextLevel(xp) {
        for (const lvl of LEVELS) {
            if (xp < lvl.xpRequired) return lvl;
        }
        return null;
    }

    function getLevelProgress(xp) {
        const current = getCurrentLevel(xp);
        const next = getNextLevel(xp);
        if (!next) return 100;
        return Math.round(((xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100);
    }

    function getBadges() {
        return BADGE_DEFS.map(def => ({
            ...def,
            earned: state.badges.includes(def.id),
        }));
    }

    async function trackEvent(eventType, extra = {}) {
        if (!auth.isLoggedIn()) return state;

        try {
            if (!hasLoaded) {
                await init().catch(() => null);
            }
            const previousLevel = getCurrentLevel(state.xp);
            const result = await api.trackGamificationEvent(eventType, extra);
            state = normalize(result);
            const currentLevel = getCurrentLevel(state.xp);

            if (result.awardedXp > 0 && currentLevel.level > previousLevel.level) {
                showToast(`🎉 Level Up! Level ${currentLevel.level} - ${currentLevel.title}`, 'level-up');
            } else if (result.awardedXp > 0) {
                showToast(`+${result.awardedXp} XP`, 'xp');
            }

            if (Array.isArray(result.newBadges)) {
                for (const badgeId of result.newBadges) {
                    const badge = BADGE_DEFS.find(item => item.id === badgeId);
                    if (badge) showToast(`${badge.icon} Huy hiệu mới: ${badge.name}!`, 'badge');
                }
            }

            return state;
        } catch (error) {
            console.error('Gamification event failed:', error);
            showToast('Không thể cập nhật XP. Vui lòng thử lại.', 'xp');
            throw error;
        }
    }

    function showToast(message, type = 'xp') {
        document.querySelectorAll('.gamification-toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'gamification-toast';

        const colors = {
            xp: { bg: '#f0f7f6', border: '#6caba0', text: '#4d8a80' },
            badge: { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' },
            'level-up': { bg: '#f5f3ff', border: '#8b5cf6', text: '#7c3aed' },
        };
        const c = colors[type] || colors.xp;

        toast.style.cssText = `
            position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
            background: ${c.bg}; border: 2px solid ${c.border}; color: ${c.text};
            padding: 0.75rem 1.25rem; border-radius: 1rem;
            font-size: 0.875rem; font-weight: 600; font-family: 'Be Vietnam Pro', sans-serif;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            animation: toastSlide 0.4s ease;
            max-width: 320px;
        `;
        toast.textContent = message;

        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                @keyframes toastSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes toastOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(20px); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    return {
        init,
        getData,
        getCurrentLevel,
        getNextLevel,
        getLevelProgress,
        getBadges,
        trackEvent,
        showToast,
        LEVELS,
        BADGE_DEFS,
        XP_REWARDS,
    };
})();

window.gamification = gamification;

document.addEventListener('DOMContentLoaded', () => {
    if (auth.isLoggedIn()) {
        gamification.trackEvent('daily_login').catch(() => {});
    }
});
