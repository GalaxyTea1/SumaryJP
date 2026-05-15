import apiManager from "../api.js";
import { utils } from "./utils.js";

let cachedTestHistory = null;
let testHistoryFetchedAt = 0;
const TEST_HISTORY_CACHE_TTL = 2 * 60 * 1000;

function isLoggedIn() {
    return !!(localStorage.getItem("sumary_jp_token") || sessionStorage.getItem("sumary_jp_admin_token"));
}

function formatDuration(seconds) {
    const value = Number(seconds) || 0;
    const minutes = Math.floor(value / 60);
    const remain = value % 60;
    return `${minutes.toString().padStart(2, "0")}:${remain.toString().padStart(2, "0")}`;
}

function parseDetails(details) {
    if (!details) return [];
    if (Array.isArray(details)) return details;
    try {
        const parsed = JSON.parse(details);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export const testHistoryModal = {
    overlay: null,
    modalContent: null,
    closeBtn: null,
    list: null,
    countEl: null,
    averageEl: null,
    bestEl: null,

    init() {
        this.overlay = document.getElementById("test-history-overlay");
        this.modalContent = document.getElementById("test-history-modal-content");
        this.closeBtn = document.getElementById("close-test-history-btn");
        this.list = document.getElementById("test-history-list");
        this.countEl = document.getElementById("test-history-count");
        this.averageEl = document.getElementById("test-history-average");
        this.bestEl = document.getElementById("test-history-best");

        if (this.closeBtn && this.overlay) {
            this.closeBtn.addEventListener("click", () => this.hide());
            this.overlay.addEventListener("click", (event) => {
                if (event.target === this.overlay) this.hide();
            });
        }
    },

    async show() {
        if (!this.overlay || !this.list) return;

        this.renderSkeleton();
        this.overlay.classList.remove("hidden");
        setTimeout(() => {
            this.overlay.classList.remove("opacity-0");
            this.overlay.classList.add("opacity-100");
            this.modalContent.classList.remove("scale-95", "opacity-0");
            this.modalContent.classList.add("scale-100", "opacity-100");
        }, 10);

        if (!isLoggedIn()) {
            this.renderEmpty("Dang nhap de xem lich su kiem tra.");
            return;
        }

        try {
            const now = Date.now();
            if (!cachedTestHistory || (now - testHistoryFetchedAt) > TEST_HISTORY_CACHE_TTL) {
                cachedTestHistory = await apiManager.getTestHistory(30);
                testHistoryFetchedAt = now;
            }
            this.renderData(cachedTestHistory);
        } catch (error) {
            console.error("Failed to fetch test history:", error);
            this.renderEmpty("Khong the tai lich su kiem tra. Vui long thu lai sau.", true);
        }
    },

    hide() {
        if (!this.overlay) return;
        this.overlay.classList.remove("opacity-100");
        this.overlay.classList.add("opacity-0");
        this.modalContent.classList.remove("scale-100", "opacity-100");
        this.modalContent.classList.add("scale-95", "opacity-0");
        setTimeout(() => this.overlay.classList.add("hidden"), 300);
    },

    renderSkeleton() {
        this.updateSummary([]);
        this.list.innerHTML = Array.from({ length: 5 }).map(() => `
            <div class="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 animate-pulse">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex-1">
                        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
                        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                    </div>
                    <div class="h-10 w-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
            </div>
        `).join("");
    },

    renderEmpty(message, isError = false) {
        this.updateSummary([]);
        this.list.innerHTML = `
            <div class="text-center py-12 flex flex-col items-center">
                <div class="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined text-3xl ${isError ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}">assignment</span>
                </div>
                <p class="${isError ? "text-rose-500" : "text-slate-500 dark:text-slate-400"} font-medium">${utils.escapeHtml(message)}</p>
            </div>
        `;
    },

    updateSummary(data) {
        const scores = data.map(item => Number(item.score)).filter(score => Number.isFinite(score));
        const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
        const best = scores.length ? Math.max(...scores) : 0;

        if (this.countEl) this.countEl.textContent = data.length;
        if (this.averageEl) this.averageEl.textContent = `${average}%`;
        if (this.bestEl) this.bestEl.textContent = `${best}%`;
    },

    renderData(data) {
        if (!data || data.length === 0) {
            this.renderEmpty("Chưa có bài kiểm tra nào được lưu.");
            return;
        }

        this.updateSummary(data);
        this.list.innerHTML = data.map(item => {
            const date = new Date(item.created_at);
            const details = parseDetails(item.details);
            const totalQuestions = Number(item.total_questions) || 0;
            const correctAnswers = Number(item.correct_answers) || 0;
            const wrongCount = Math.max(0, totalQuestions - correctAnswers);
            const scope = [item.level, item.lesson && item.lesson !== "all" ? `Bai ${item.lesson}` : null].filter(Boolean).join(" - ") || "Tat ca";
            const score = Number(item.score) || 0;
            const scoreClass = score >= 80
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                : score >= 50
                    ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800"
                    : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800";

            const missedWords = details
                .filter(detail => !detail.correct)
                .slice(0, 3)
                .map(detail => utils.escapeHtml(detail.japanese || detail.meaning || ""))
                .filter(Boolean)
                .join(", ");

            return `
                <article class="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2 mb-2">
                                <span class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">${utils.escapeHtml(item.test_type || "vocab")}</span>
                                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">${utils.escapeHtml(scope)}</span>
                            </div>
                            <p class="text-sm font-bold text-slate-800 dark:text-white">${date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Dung ${correctAnswers}/${totalQuestions} cau · Sai ${wrongCount} · ${formatDuration(item.time_taken)}
                            </p>
                            ${missedWords ? `<p class="text-xs text-rose-500 dark:text-rose-400 mt-2">Can xem lai: ${missedWords}</p>` : ""}
                        </div>
                        <div class="rounded-2xl border px-4 py-3 text-center shrink-0 ${scoreClass}">
                            <p class="text-[10px] font-bold uppercase tracking-widest opacity-70">Diem</p>
                            <p class="text-2xl font-black">${score}%</p>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }
};
