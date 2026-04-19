// ============================================
// Dashboard Page Logic — Sumary Japanese
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // --- Load data ---
    let vocabulary = [];
    let grammar = [];
    let kanji = [];
    let weeklyGoalData = { goalCount: 0 };
    let historyData = [];

    try {
        [vocabulary, grammar, kanji, weeklyGoalData, historyData] = await Promise.all([
            api.getAllVocabulary().catch(() => []),
            api.getAllGrammar().catch(() => []),
            api.getAllKanji().catch(() => []),
            api.getWeeklyGoal().catch(() => ({ goalCount: 0 })),
            api.getLearningHistory(10).catch(() => []),
        ]);
    } catch (e) {
        console.warn('Dashboard: Không thể tải data từ API, dùng dữ liệu mặc định.', e);
    }

    // --- Stats Cards ---
    const totalVocab = vocabulary.length || 0;
    const masteredVocab = vocabulary.filter(v => v.status === 'mastered').length;
    const learningVocab = vocabulary.filter(v => v.status === 'learning').length;
    const totalGrammar = grammar.length || 0;
    const totalKanji = kanji.length || 0;

    // Update Vocab stats
    updateStatCard('stat-vocab-count', masteredVocab, totalVocab);
    updateStatCard('stat-grammar-count', totalGrammar, totalGrammar);
    updateStatCard('stat-kanji-count', totalKanji, totalKanji);

    // Update progress bars
    updateProgressBar('stat-vocab-bar', masteredVocab, totalVocab || 1);
    updateProgressBar('stat-grammar-bar', totalGrammar, totalGrammar || 1);
    updateProgressBar('stat-kanji-bar', totalKanji, totalKanji || 1);

    // Update percentages
    updatePercent('stat-vocab-pct', masteredVocab, totalVocab || 1);
    updatePercent('stat-grammar-pct', totalGrammar, totalGrammar || 1);
    updatePercent('stat-kanji-pct', totalKanji, totalKanji || 1);

    // --- Weekly Goal ---
    const weeklyGoalTarget = parseInt(localStorage.getItem('weeklyGoalTarget') || '20');
    const weeklyCount = weeklyGoalData.goalCount || 0;
    const goalEl = document.getElementById('weekly-goal-progress');
    const goalCountEl = document.getElementById('weekly-goal-count');

    if (goalCountEl) {
        goalCountEl.innerHTML = `${weeklyCount}<span class="text-sm font-normal text-[#5f6b7a]">/${weeklyGoalTarget}</span>`;
    }
    if (goalEl) {
        const pct = Math.min((weeklyCount / weeklyGoalTarget) * 100, 100);
        goalEl.style.width = `${pct}%`;
    }

    // --- Recent Activity ---
    const activityContainer = document.getElementById('recent-activity');
    if (activityContainer && historyData.length > 0) {
        activityContainer.innerHTML = historyData.slice(0, 4).map(item => {
            const iconMap = {
                'mastered': { icon: 'check', bg: 'bg-[#e8f5e9]', color: 'text-[#4caf50]' },
                'learning': { icon: 'replay', bg: 'bg-[#f0f7f6]', color: 'text-[#6caba0]' },
                'not-learned': { icon: 'school', bg: 'bg-[#e3f2fd]', color: 'text-[#42a5f5]' },
            };
            const info = iconMap[item.new_status] || iconMap['not-learned'];
            const timeStr = utils.timeAgo(item.created_at);
            const vocabText = item.japanese || item.vocab_id || '';

            return `
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full ${info.bg} flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span class="material-symbols-outlined ${info.color} text-sm">${info.icon}</span>
                    </div>
                    <div>
                        <div class="text-sm">${utils.escapeHtml(item.action || 'Hoạt động')} <span class="font-semibold font-['Noto_Sans_JP']">${utils.escapeHtml(vocabText)}</span></div>
                        <div class="text-xs text-[#5f6b7a]">${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Update user info in sidebar ---
    await auth.updateSidebarUser();

    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl) {
        if (auth.isLoggedIn()) {
            const userName = document.getElementById('sidebar-user-name')?.textContent || 'bạn';
            greetingEl.innerHTML = `Chào buổi sáng, ${userName}! 🌸`;
        } else {
            greetingEl.innerHTML = `Chào buổi sáng! 🌸`;
            // Show popup reminding to login
            setTimeout(() => {
                if (window.authModal) window.authModal.showLogin();
            }, 800);
        }
    }

    // --- Gamification Widget ---
    if (typeof gamification !== 'undefined') {
        const gm = gamification.getData();
        const currentLvl = gamification.getCurrentLevel(gm.xp);
        const nextLvl = gamification.getNextLevel(gm.xp);
        const progress = gamification.getLevelProgress(gm.xp);

        // Level & XP
        const lvlBadge = document.getElementById('gm-level-badge');
        const lvlTitle = document.getElementById('gm-level-title');
        const xpBar = document.getElementById('gm-xp-bar');
        const xpText = document.getElementById('gm-xp-text');
        const xpNext = document.getElementById('gm-xp-next');

        if (lvlBadge) lvlBadge.textContent = `Lv.${currentLvl.level}`;
        if (lvlTitle) lvlTitle.textContent = currentLvl.title;
        if (xpBar) xpBar.style.width = `${progress}%`;
        if (xpText) xpText.textContent = `${gm.xp} XP`;
        if (xpNext) {
            xpNext.textContent = nextLvl
                ? `Cần ${nextLvl.xpRequired - gm.xp} XP để lên Level ${nextLvl.level}`
                : '🎉 Max Level!';
        }

        // Streak
        const streakCount = document.getElementById('gm-streak-count');
        const streakMsg = document.getElementById('gm-streak-msg');
        if (streakCount) streakCount.textContent = gm.streak;
        if (streakMsg) {
            if (gm.streak >= 7) streakMsg.textContent = '⚡ Tuyệt vời! Streak dài ngày!';
            else if (gm.streak >= 3) streakMsg.textContent = '🔥 Rất tốt! Tiếp tục chuỗi ngày nào!';
            else streakMsg.textContent = 'Hãy học mỗi ngày để duy trì streak!';
        }

        // Badges
        const badges = gamification.getBadges();
        const badgesGrid = document.getElementById('gm-badges-grid');
        const badgeCount = document.getElementById('gm-badge-count');
        const earnedCount = badges.filter(b => b.earned).length;

        if (badgeCount) badgeCount.textContent = `${earnedCount}/${badges.length}`;
        if (badgesGrid) {
            badgesGrid.innerHTML = badges.map(b => `
                <span class="w-8 h-8 rounded-lg flex items-center justify-center text-lg cursor-default transition-all ${b.earned ? '' : 'opacity-25 grayscale'}"
                      title="${b.name}: ${b.desc}${b.earned ? ' ✅' : ''}">${b.icon}</span>
            `).join('');
        }
    }

    // --- Lock Gamification if not logged in ---
    if (!auth.isLoggedIn()) {
        const widgetCards = document.querySelectorAll('#gamification-widget .card');
        widgetCards.forEach(card => {
            card.classList.add('relative', 'overflow-hidden');
            card.insertAdjacentHTML('beforeend', `
                <div class="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/50 group">
                    <span class="material-symbols-outlined text-3xl text-[#6caba0] mb-2 group-hover:scale-110 transition-transform">lock</span>
                    <span class="text-sm font-semibold text-[#1a2332]">Đăng nhập để xem</span>
                </div>
            `);
            card.lastElementChild.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.authModal) window.authModal.showLogin();
            });
        });
    }

    // --- Helper Functions ---
    function updateStatCard(id, current, total) {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `${current.toLocaleString()} <span class="text-sm font-normal text-[#5f6b7a]">/ ${total.toLocaleString()}</span>`;
        }
    }

    function updateProgressBar(id, current, total) {
        const el = document.getElementById(id);
        if (el) {
            const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
            el.style.width = `${pct}%`;
        }
    }

    function updatePercent(id, current, total) {
        const el = document.getElementById(id);
        if (el) {
            const pct = total > 0 ? Math.round((current / total) * 100) : 0;
            el.textContent = `${pct}% hoàn thành`;
        }
    }
});
