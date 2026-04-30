import { state } from "../state.js";

const DEFAULT_WEEKLY_GOAL = 200;

let cachedWeeklyGoalCount = null;
let weeklyGoalFetched = false;

function getWeeklyGoalTarget() {
    const parsed = parseInt(localStorage.getItem("weeklyGoalTarget"), 10);
    return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_WEEKLY_GOAL : parsed;
}

function setWeeklyGoalTarget(value) {
    const clamped = Math.max(1, Math.min(value, 9999));
    localStorage.setItem("weeklyGoalTarget", clamped);
    return clamped;
}

import { EVENTS } from "../state.js";

export const dashboardStats = {
    init() {
        this.initGoalSetting();
        state.subscribe(EVENTS.VOCAB_UPDATED, () => {
            this.updateStats();
        });
        state.subscribe(EVENTS.VOCAB_LOADED, () => {
            this.updateStats();
        });
    },

    renderSkeleton() {
        const startReviewBadge = document.querySelector('#start-review span.tracking-wider');
        if (startReviewBadge) startReviewBadge.innerHTML = `<div class="h-3 w-12 bg-indigo-200 dark:bg-indigo-900/50 rounded animate-pulse mt-0.5 inline-block"></div>`;

        const diffBadge = document.querySelector('#show-difficult span.tracking-wider');
        if (diffBadge) diffBadge.innerHTML = `<div class="h-3 w-10 bg-rose-200 dark:bg-rose-900/50 rounded animate-pulse mt-0.5 inline-block"></div>`;

        const weeklyGoalText = document.querySelector('.vocabulary-section .bg-slate-900 h3');
        if (weeklyGoalText) weeklyGoalText.innerHTML = `<div class="h-8 w-32 bg-slate-700 rounded animate-pulse inline-block"></div>`;
    },

    initGoalSetting() {
        const editBtn = document.getElementById('edit-weekly-goal-btn');
        const goalEditor = document.getElementById('weekly-goal-editor');
        const goalInput = document.getElementById('weekly-goal-input');
        const saveBtn = document.getElementById('save-weekly-goal-btn');
        const cancelBtn = document.getElementById('cancel-weekly-goal-btn');

        if (!editBtn || !goalEditor || !goalInput || !saveBtn || !cancelBtn) return;

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goalInput.value = getWeeklyGoalTarget();
            goalEditor.classList.remove('hidden');
            goalInput.focus();
            goalInput.select();
        });

        saveBtn.addEventListener('click', () => {
            const newGoal = parseInt(goalInput.value, 10);
            if (!Number.isNaN(newGoal) && newGoal > 0) {
                setWeeklyGoalTarget(newGoal);
                goalEditor.classList.add('hidden');
                cachedWeeklyGoalCount = null;
                weeklyGoalFetched = false;
                this.updateStats();
            }
        });

        cancelBtn.addEventListener('click', () => goalEditor.classList.add('hidden'));

        goalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
        });
    },

    async updateStats() {
        let diffCount = 0;
        const totalGoal = getWeeklyGoalTarget();

        if (!weeklyGoalFetched) {
            try {
                const apiManager = (await import('../api.js')).default;
                const goalData = await apiManager.getWeeklyGoal();
                cachedWeeklyGoalCount = goalData.goalCount || 0;
                weeklyGoalFetched = true;
            } catch (e) {
                console.error("Failed to fetch weekly goal:", e);
                cachedWeeklyGoalCount = 0;
            }
        }

        const masteredCount = cachedWeeklyGoalCount;
        const progressPercent = Math.min((masteredCount / totalGoal) * 100, 100);

        const diffBadge = document.querySelector('#show-difficult span.tracking-wider');
        if (diffBadge) diffBadge.textContent = `${diffCount} Từ`;

        const weeklyGoalText = document.querySelector('.vocabulary-section .bg-slate-900 h3');
        if (weeklyGoalText) weeklyGoalText.innerHTML = `${masteredCount}/${totalGoal} <span class="text-lg font-medium opacity-60">Từ thuộc</span>`;

        const progressBar = document.querySelector('.vocabulary-section .bg-slate-900 .bg-indigo-500');
        if (progressBar) progressBar.style.width = `${progressPercent}%`;
    }
};
