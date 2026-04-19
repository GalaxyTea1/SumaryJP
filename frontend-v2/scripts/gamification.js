// ============================================
// Gamification System — Sumary Japanese
// XP, Levels, Streak, Badges (localStorage)
// ============================================

const gamification = (() => {
    const STORAGE_KEY = 'sumary_gamification';

    // --- Level Thresholds ---
    const LEVELS = [
        { level: 1,  title: 'Tân binh',        xpRequired: 0 },
        { level: 2,  title: 'Người mới bắt đầu', xpRequired: 50 },
        { level: 3,  title: 'Học sinh chăm',   xpRequired: 150 },
        { level: 4,  title: 'Thợ học từ',       xpRequired: 350 },
        { level: 5,  title: 'Chiến binh N5',    xpRequired: 600 },
        { level: 6,  title: 'Samurai học tập',  xpRequired: 1000 },
        { level: 7,  title: 'Nhà thông thái',   xpRequired: 1500 },
        { level: 8,  title: 'Bậc thầy Kanji',   xpRequired: 2200 },
        { level: 9,  title: 'Sensei',            xpRequired: 3000 },
        { level: 10, title: 'Vua tiếng Nhật',   xpRequired: 4000 },
    ];

    // --- Badge Definitions ---
    const BADGE_DEFS = [
        { id: 'first_login',     icon: '🌸', name: 'Chào mừng!',       desc: 'Lần đầu truy cập' },
        { id: 'first_test',      icon: '📝', name: 'Thử thách đầu tiên', desc: 'Hoàn thành bài test đầu tiên' },
        { id: 'first_perfect',   icon: '💯', name: 'Hoàn hảo!',        desc: 'Đạt 100% bài test' },
        { id: 'streak_3',        icon: '🔥', name: 'Streak 3 ngày',    desc: 'Học liên tục 3 ngày' },
        { id: 'streak_7',        icon: '⚡', name: 'Streak 7 ngày',    desc: 'Học liên tục 7 ngày' },
        { id: 'streak_30',       icon: '🏆', name: 'Streak 30 ngày',   desc: 'Học liên tục 30 ngày' },
        { id: 'vocab_50',        icon: '📖', name: '50 từ vựng',       desc: 'Ôn tập 50 từ vựng' },
        { id: 'vocab_200',       icon: '📚', name: '200 từ vựng',      desc: 'Ôn tập 200 từ vựng' },
        { id: 'kanji_20',        icon: '🈳', name: '20 Kanji',         desc: 'Ôn tập 20 Kanji' },
        { id: 'flashcard_100',   icon: '🃏', name: '100 Flashcards',   desc: 'Lật 100 flashcard' },
        { id: 'xp_1000',         icon: '⭐', name: '1000 XP',          desc: 'Đạt 1000 XP' },
        { id: 'level_5',         icon: '👑', name: 'Level 5',          desc: 'Đạt Level 5' },
        { id: 'srs_master_10',   icon: '🧠', name: 'Nhà ôn tập',      desc: 'Hoàn thành 10 phiên SRS' },
        { id: 'night_owl',       icon: '🦉', name: 'Cú đêm',          desc: 'Học sau 23:00' },
        { id: 'early_bird',      icon: '🐦', name: 'Chim sớm',        desc: 'Học trước 7:00' },
    ];

    // --- XP Rewards ---
    const XP_REWARDS = {
        flashcard_complete:  5,   // Hoàn thành 1 flashcard
        test_complete:      15,   // Hoàn thành 1 bài test
        test_perfect:       30,   // Test 100%
        srs_session:        10,   // 1 phiên SRS
        srs_card_good:       3,   // 1 thẻ SRS đánh giá Tốt/Dễ
        daily_login:        10,   // Đăng nhập hàng ngày
        vocab_mastered:      5,   // 1 từ vựng thuần thục
    };

    // --- Load/Save ---
    function load() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createDefault();
        try { return JSON.parse(raw); } catch { return createDefault(); }
    }

    function save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function createDefault() {
        const data = {
            xp: 0,
            totalXpEarned: 0,
            badges: [],
            streak: 0,
            lastActiveDate: null,
            stats: {
                testsCompleted: 0,
                flashcardsFlipped: 0,
                vocabReviewed: 0,
                kanjiReviewed: 0,
                srsSessions: 0,
            },
        };
        save(data);
        return data;
    }

    // --- Core Functions ---
    function getData() { return load(); }

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
        return null; // Max level
    }

    function getLevelProgress(xp) {
        const current = getCurrentLevel(xp);
        const next = getNextLevel(xp);
        if (!next) return 100;
        const range = next.xpRequired - current.xpRequired;
        const progress = xp - current.xpRequired;
        return Math.round((progress / range) * 100);
    }

    // --- Add XP ---
    function addXP(amount, reason = '') {
        const data = load();
        data.xp += amount;
        data.totalXpEarned += amount;
        save(data);

        // Check level up
        const newLevel = getCurrentLevel(data.xp);
        const oldLevel = getCurrentLevel(data.xp - amount);
        if (newLevel.level > oldLevel.level) {
            showToast(`🎉 Level Up! Level ${newLevel.level} — ${newLevel.title}`, 'level-up');
            checkBadge('level_5', data);
        } else if (reason) {
            showToast(`+${amount} XP — ${reason}`, 'xp');
        }

        // XP milestones
        checkBadge('xp_1000', data);

        return data;
    }

    // --- Streak ---
    function updateStreak() {
        const data = load();
        const today = new Date().toDateString();

        if (data.lastActiveDate === today) return data; // Already counted today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (data.lastActiveDate === yesterday.toDateString()) {
            data.streak++;
        } else if (data.lastActiveDate !== today) {
            data.streak = 1;
        }

        data.lastActiveDate = today;
        save(data);

        // Streak badges
        checkBadge('streak_3', data);
        checkBadge('streak_7', data);
        checkBadge('streak_30', data);

        // Daily XP
        addXP(XP_REWARDS.daily_login, 'Đăng nhập hàng ngày');

        return data;
    }

    // --- Badges ---
    function checkBadge(badgeId, data) {
        if (!data) data = load();
        if (data.badges.includes(badgeId)) return false;

        let earned = false;
        switch (badgeId) {
            case 'first_login':     earned = true; break;
            case 'first_test':      earned = data.stats.testsCompleted >= 1; break;
            case 'first_perfect':   earned = true; break; // Called directly
            case 'streak_3':        earned = data.streak >= 3; break;
            case 'streak_7':        earned = data.streak >= 7; break;
            case 'streak_30':       earned = data.streak >= 30; break;
            case 'vocab_50':        earned = data.stats.vocabReviewed >= 50; break;
            case 'vocab_200':       earned = data.stats.vocabReviewed >= 200; break;
            case 'kanji_20':        earned = data.stats.kanjiReviewed >= 20; break;
            case 'flashcard_100':   earned = data.stats.flashcardsFlipped >= 100; break;
            case 'xp_1000':         earned = data.xp >= 1000; break;
            case 'level_5':         earned = getCurrentLevel(data.xp).level >= 5; break;
            case 'srs_master_10':   earned = data.stats.srsSessions >= 10; break;
            case 'night_owl':       earned = new Date().getHours() >= 23; break;
            case 'early_bird':      earned = new Date().getHours() < 7; break;
        }

        if (earned) {
            data.badges.push(badgeId);
            save(data);
            const def = BADGE_DEFS.find(b => b.id === badgeId);
            if (def) showToast(`${def.icon} Huy hiệu mới: ${def.name}!`, 'badge');
        }

        return earned;
    }

    function getBadges() {
        const data = load();
        return BADGE_DEFS.map(def => ({
            ...def,
            earned: data.badges.includes(def.id),
        }));
    }

    // --- Event Tracking ---
    function trackEvent(eventType, extra = {}) {
        const data = load();

        switch (eventType) {
            case 'test_complete':
                data.stats.testsCompleted++;
                save(data);
                addXP(XP_REWARDS.test_complete, 'Hoàn thành bài test');
                checkBadge('first_test', data);
                if (extra.score === 100) {
                    checkBadge('first_perfect', data);
                    addXP(XP_REWARDS.test_perfect, 'Test hoàn hảo 💯');
                }
                break;

            case 'flashcard_flip':
                data.stats.flashcardsFlipped++;
                save(data);
                checkBadge('flashcard_100', data);
                break;

            case 'flashcard_complete':
                addXP(XP_REWARDS.flashcard_complete, 'Flashcard');
                break;

            case 'srs_session':
                data.stats.srsSessions++;
                save(data);
                addXP(XP_REWARDS.srs_session, 'Ôn tập SRS');
                checkBadge('srs_master_10', data);
                break;

            case 'srs_card_good':
                addXP(XP_REWARDS.srs_card_good, 'Nhớ tốt');
                break;

            case 'vocab_review':
                data.stats.vocabReviewed += (extra.count || 1);
                save(data);
                checkBadge('vocab_50', data);
                checkBadge('vocab_200', data);
                break;

            case 'kanji_review':
                data.stats.kanjiReviewed += (extra.count || 1);
                save(data);
                checkBadge('kanji_20', data);
                break;
        }

        // Time-based badges
        checkBadge('night_owl', data);
        checkBadge('early_bird', data);
    }

    // --- Toast Notification ---
    function showToast(message, type = 'xp') {
        // Remove existing toast
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

        // Inject animation
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

    // --- Public API ---
    return {
        getData,
        getCurrentLevel,
        getNextLevel,
        getLevelProgress,
        addXP,
        updateStreak,
        getBadges,
        trackEvent,
        showToast,
        LEVELS,
        BADGE_DEFS,
        XP_REWARDS,
    };
})();

window.gamification = gamification;

// Auto: update streak on page load + first login badge
document.addEventListener('DOMContentLoaded', () => {
    gamification.updateStreak();
    const data = gamification.getData();
    if (!data.badges.includes('first_login')) {
        gamification.trackEvent('first_login');
        // Force award it
        const d = gamification.getData();
        if (!d.badges.includes('first_login')) {
            d.badges.push('first_login');
            localStorage.setItem('sumary_gamification', JSON.stringify(d));
        }
    }
});
