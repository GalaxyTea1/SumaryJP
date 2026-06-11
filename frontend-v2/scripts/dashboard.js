// ============================================
// Dashboard Page Logic — Sumary Japanese
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.requireAuth()) return;

    // --- Load data ---
    let vocabulary = [];
    let grammar = [];
    let kanji = [];
    let srsProgress = [];
    let weeklyGoalData = { goalCount: 0 };
    let historyData = [];

    try {
        [vocabulary, grammar, kanji, srsProgress, weeklyGoalData, historyData] = await Promise.all([
            api.getAllVocabulary(),
            api.getAllGrammar(),
            api.getAllKanji(),
            api.getSrsProgress(),
            api.getWeeklyGoal(),
            api.getLearningHistory(10),
        ]);
    } catch (e) {
        console.error('Dashboard: Không thể tải data từ API.', e);
        alert('Khong the tai du lieu dashboard. Vui long kiem tra ket noi va thu lai.');
        return;
    }

    // --- Stats Cards ---
    const totalVocab = vocabulary.length || 0;
    const masteredVocab = vocabulary.filter(v => v.status === 'mastered').length;
    const totalGrammar = grammar.length || 0;
    const totalKanji = kanji.length || 0;
    const grammarIds = new Set(grammar.map(item => Number(item.id)));
    const kanjiIds = new Set(kanji.map(item => Number(item.id)));
    const masteredGrammar = getSrsMasteredCount(srsProgress, 'grammar', grammarIds);
    const masteredKanji = getSrsMasteredCount(srsProgress, 'kanji', kanjiIds);

    // Update Vocab stats
    updateStatCard('stat-vocab-count', masteredVocab, totalVocab);
    updateStatCard('stat-grammar-count', masteredGrammar, totalGrammar);
    updateStatCard('stat-kanji-count', masteredKanji, totalKanji);

    // Update progress bars
    updateProgressBar('stat-vocab-bar', masteredVocab, totalVocab || 1);
    updateProgressBar('stat-grammar-bar', masteredGrammar, totalGrammar || 1);
    updateProgressBar('stat-kanji-bar', masteredKanji, totalKanji || 1);

    // Update percentages
    updatePercent('stat-vocab-pct', masteredVocab, totalVocab || 1);
    updatePercent('stat-grammar-pct', masteredGrammar, totalGrammar || 1);
    updatePercent('stat-kanji-pct', masteredKanji, totalKanji || 1);

    // --- Weekly Goal ---
    let weeklyGoalTarget = weeklyGoalData.goalTarget || 20;
    const weeklyCount = weeklyGoalData.goalCount || 0;
    const goalEl = document.getElementById('weekly-goal-progress');
    const goalCountEl = document.getElementById('weekly-goal-count');
    const goalTargetInput = document.getElementById('weekly-goal-target-input');
    const goalSaveBtn = document.getElementById('weekly-goal-save-btn');

    function renderWeeklyGoal() {
        if (goalCountEl) {
            goalCountEl.innerHTML = `${weeklyCount}<span class="text-sm font-normal text-[#5f6b7a]">/${weeklyGoalTarget}</span>`;
        }
        const pct = Math.min((weeklyCount / weeklyGoalTarget) * 100, 100);
        if (goalEl) goalEl.style.width = `${pct}%`;
        if (goalTargetInput) goalTargetInput.value = weeklyGoalTarget;
    }
    renderWeeklyGoal();

    if (goalSaveBtn && goalTargetInput) {
        goalSaveBtn.addEventListener('click', async () => {
            const nextTarget = Number(goalTargetInput.value);
            if (!Number.isInteger(nextTarget) || nextTarget < 1 || nextTarget > 500) {
                alert('Muc tieu tuan phai nam trong khoang 1-500.');
                return;
            }

            goalSaveBtn.disabled = true;
            try {
                const updatedGoal = await api.updateWeeklyGoal(nextTarget);
                weeklyGoalTarget = updatedGoal.goalTarget || nextTarget;
                renderWeeklyGoal();
            } catch (error) {
                console.error('Update weekly goal failed:', error);
                alert('Khong the luu muc tieu tuan. Vui long thu lai.');
            } finally {
                goalSaveBtn.disabled = false;
            }
        });
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
        const userName = document.getElementById('sidebar-user-name')?.textContent || 'bạn';
        greetingEl.innerHTML = `Chào buổi sáng, ${userName}! 🌸`;
    }

    // --- Gamification Widget ---
    if (typeof gamification !== 'undefined') {
        await gamification.init().catch(() => null);
        const gm = gamification.getData();
        const currentLvl = gamification.getCurrentLevel(gm.xp);
        const nextLvl = gamification.getNextLevel(gm.xp);
        const progress = gamification.getLevelProgress(gm.xp);
        const dailyXp = gm.dailyXp || 0;
        const dailyXpCap = gm.dailyXpCap || 150;

        const dailyXpEl = document.getElementById('stat-daily-xp');
        const dailyXpDesc = dailyXpEl?.nextElementSibling?.querySelector('span:not(.material-symbols-outlined)');
        if (dailyXpEl) {
            dailyXpEl.innerHTML = `${dailyXp} <span class="text-sm font-normal text-[#5f6b7a]">XP</span>`;
        }
        if (dailyXpDesc) {
            dailyXpDesc.className = 'text-xs text-[#5f6b7a]';
            dailyXpDesc.textContent = `${dailyXp}/${dailyXpCap} XP hom nay`;
        }

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

    function getSrsMasteredCount(progressItems, itemType, validIds) {
        return (progressItems || []).filter(item => {
            return item.itemType === itemType
                && validIds.has(Number(item.itemId))
                && Number(item.interval || 0) >= 7;
        }).length;
    }

    function updatePercent(id, current, total) {
        const el = document.getElementById(id);
        if (el) {
            const pct = total > 0 ? Math.round((current / total) * 100) : 0;
            el.textContent = `${pct}% hoàn thành`;
        }
    }
});
