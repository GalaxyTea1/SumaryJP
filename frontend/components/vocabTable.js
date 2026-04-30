import { state } from "../state.js";
import { wordDetailsModal } from "./wordDetailsModal.js";
import { tts } from "./tts.js";
import { utils } from "./utils.js";

const STATUS_CONFIG = {
    "not-learned": { text: "Chưa học", classes: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" },
    "learning":    { text: "Đang học", classes: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
    "mastered":    { text: "Đã thuộc", classes: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" },
};

function isMobile() {
    return window.innerWidth < 768;
}

import { EVENTS } from "../state.js";

export const vocabTable = {
    init() {
        state.subscribe(EVENTS.LESSON_CHANGED, async (currentLesson) => {
            if (currentLesson) {
                this.renderSkeleton();
                await this.render(currentLesson.lesson, currentLesson.level);
            }
        });

        state.subscribe(EVENTS.VOCAB_UPDATED, async (payload) => {
            if (payload && payload.action === "inline_update") {
                return;
            }
            if (state.currentLesson) {
                await this.render(state.currentLesson.lesson, state.currentLesson.level);
            }
        });
    },

    renderSkeleton(rowCount = 5) {
        const tbody = document.getElementById("vocab-list");
        const mobileList = document.getElementById("vocab-list-mobile");

        const emptyState = document.getElementById("vocab-empty-state");
        const tableWrapper = document.getElementById("vocab-table-wrapper");
        if (emptyState) emptyState.classList.add("hidden");
        if (tableWrapper) tableWrapper.classList.remove("hidden");

        if (tbody) {
            tbody.innerHTML = "";
            for (let i = 0; i < rowCount; i++) {
                const row = document.createElement("tr");
                row.className = "animate-pulse";
                row.innerHTML = `
                    <td class="px-4 py-4 md:px-8 md:py-6">
                        <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-24"></div>
                    </td>
                    <td class="px-4 py-4 md:px-8 md:py-6">
                        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-16"></div>
                    </td>
                    <td class="px-4 py-4 md:px-8 md:py-6">
                        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-32"></div>
                    </td>
                    <td class="px-4 py-4 md:px-8 md:py-6 text-center">
                        <div class="h-6 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
                    </td>
                    <td class="px-4 py-4 md:px-8 md:py-6 text-right">
                        <div class="flex justify-end gap-1">
                            <div class="size-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div class="size-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div class="size-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            }
        }

        if (mobileList) {
            mobileList.innerHTML = "";
            for (let i = 0; i < rowCount; i++) {
                const card = document.createElement("div");
                card.className = "animate-pulse bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50";
                card.innerHTML = `
                    <div class="flex items-center justify-between mb-3">
                        <div class="h-7 bg-slate-200 dark:bg-slate-700 rounded-lg w-20"></div>
                        <div class="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
                    </div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28 mb-2"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36"></div>
                `;
                mobileList.appendChild(card);
            }
        }
    },

    async render(lesson, level, customVocabList = null, customTitle = null) {

        const emptyState = document.getElementById("vocab-empty-state");
        const tableWrapper = document.getElementById("vocab-table-wrapper");
        if (emptyState) emptyState.classList.add("hidden");
        if (tableWrapper) tableWrapper.classList.remove("hidden");

        const thStatus = document.getElementById("th-status");
        const thDifficulty = document.getElementById("th-difficulty");
        if (thStatus) {
            thStatus.textContent = "Trạng thái";
            thStatus.classList.remove("text-left");
            thStatus.classList.add("text-center");
        }
        if (thDifficulty) thDifficulty.classList.remove("hidden");

        const titleEl = document.getElementById("current-lesson-title");
        if (titleEl) {
            titleEl.textContent = customTitle || `Từ vựng Bài ${lesson} - ${level}`;
        }

        const tbody = document.getElementById("vocab-list");
        const mobileList = document.getElementById("vocab-list-mobile");
        if (!tbody && !mobileList) return;

        this.renderSkeleton(5);
        await new Promise(resolve => setTimeout(resolve, 200));

        const allVocabularies = customVocabList || state.getVocabularyByLesson(level, lesson);

        if (tbody) tbody.innerHTML = "";
        if (mobileList) mobileList.innerHTML = "";

        if (allVocabularies.length === 0) {
            const emptyMsg = customVocabList ? "Không có kết quả tìm kiếm." : "Không có dữ liệu từ vựng cho bài học này.";
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="px-8 py-6 text-center text-slate-400 dark:text-slate-500">${emptyMsg}</td></tr>`;
            if (mobileList) mobileList.innerHTML = `<div class="text-center py-8 text-slate-400 dark:text-slate-500">${emptyMsg}</div>`;
            return;
        }

        allVocabularies.forEach((vocab) => {
            if (tbody) this._renderDesktopRow(tbody, vocab);
            if (mobileList) this._renderMobileCard(mobileList, vocab);
        });
    },

    _renderDesktopRow(tbody, vocab) {
        const row = document.createElement("tr");
        row.className = "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer group";

        const statusInfo = STATUS_CONFIG[vocab.status] || STATUS_CONFIG["not-learned"];

        let starsHtml = "";
        for (let i = 1; i <= 5; i++) {
            const starColorClass = vocab.is_difficult ? "text-amber-400 fill-[1]" : "text-slate-200 dark:text-slate-600";
            starsHtml += `<span class="material-symbols-outlined text-[18px] ${starColorClass} difficulty-star" data-index="${i}">star</span>`;
        }

        row.innerHTML = `
            <td class="px-4 py-4 md:px-8 md:py-6">
                <div class="flex items-center gap-2 md:gap-4">
                    <div class="font-bold text-base md:text-lg text-slate-900 dark:text-white">${utils.escapeHtml(vocab.japanese)}</div>
                    <button class="speaker-btn text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none flex items-center justify-center" title="Phát âm" data-text="${utils.escapeHtml(vocab.japanese)}">
                        <span class="material-symbols-outlined text-xl">volume_up</span>
                    </button>
                </div>
            </td>
            <td class="px-4 py-4 md:px-8 md:py-6 text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap hiragana-col">${utils.escapeHtml(vocab.hiragana)}</td>
            <td class="px-4 py-4 md:px-8 md:py-6">
                <div class="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">${utils.escapeHtml(vocab.meaning)}</div>
            </td>
            <td class="px-4 py-4 md:px-8 md:py-6 text-center whitespace-nowrap relative">
                <select class="status-select appearance-none bg-transparent absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Change Status">
                    <option class="text-slate-900 dark:text-slate-100 dark:bg-slate-800 text-sm font-medium" value="not-learned" ${vocab.status === "not-learned" ? "selected" : ""}>Chưa học</option>
                    <option class="text-slate-900 dark:text-slate-100 dark:bg-slate-800 text-sm font-medium" value="learning" ${vocab.status === "learning" ? "selected" : ""}>Đang học</option>
                    <option class="text-slate-900 dark:text-slate-100 dark:bg-slate-800 text-sm font-medium" value="mastered" ${vocab.status === "mastered" ? "selected" : ""}>Đã thuộc</option>
                </select>
                <span class="status-pill px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${statusInfo.classes}">${statusInfo.text}</span>
            </td>
            <td class="px-4 py-4 md:px-8 md:py-6 text-right whitespace-nowrap">
                <div class="flex justify-end gap-0.5 cursor-pointer star-container">
                    ${starsHtml}
                </div>
            </td>
        `;

        this._bindRowEvents(row, vocab);
        tbody.appendChild(row);
    },

    _renderMobileCard(container, vocab) {
        const statusInfo = STATUS_CONFIG[vocab.status] || STATUS_CONFIG["not-learned"];
        const card = document.createElement("div");
        card.className = "vocab-mobile-card bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 active:scale-[0.98] transition-all cursor-pointer shadow-sm";

        card.innerHTML = `
            <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="font-bold text-lg text-slate-900 dark:text-white truncate">${utils.escapeHtml(vocab.japanese)}</span>
                    <button class="speaker-btn shrink-0 text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none" title="Phát âm" data-text="${utils.escapeHtml(vocab.japanese)}">
                        <span class="material-symbols-outlined text-lg">volume_up</span>
                    </button>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="star-toggle cursor-pointer material-symbols-outlined text-lg ${vocab.is_difficult ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}">star</span>
                    <div class="relative">
                        <select class="status-select appearance-none bg-transparent absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" aria-label="Change Status">
                            <option value="not-learned" ${vocab.status === "not-learned" ? "selected" : ""}>Chưa học</option>
                            <option value="learning" ${vocab.status === "learning" ? "selected" : ""}>Đang học</option>
                            <option value="mastered" ${vocab.status === "mastered" ? "selected" : ""}>Đã thuộc</option>
                        </select>
                        <span class="status-pill px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusInfo.classes}">${statusInfo.text}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-baseline gap-2 hiragana-col">
                <span class="text-sm text-indigo-500 dark:text-indigo-400 font-medium">${utils.escapeHtml(vocab.hiragana)}</span>
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">${utils.escapeHtml(vocab.meaning)}</div>
        `;

        const selectEl = card.querySelector(".status-select");
        const pillEl = card.querySelector(".status-pill");

        selectEl.addEventListener("change", async (e) => {
            e.stopPropagation();
            const newStatus = e.target.value;
            const prevStatus = vocab.status;
            
            // Optimistic UI update
            vocab.status = newStatus;
            const newInfo = STATUS_CONFIG[newStatus] || STATUS_CONFIG["not-learned"];
            pillEl.className = `status-pill px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${newInfo.classes}`;
            pillEl.textContent = newInfo.text;

            try {
                await state.updateVocabularyStatus(vocab.id, newStatus);
            } catch (error) {
                vocab.status = prevStatus;
                selectEl.value = prevStatus;
                const prevInfo = STATUS_CONFIG[prevStatus] || STATUS_CONFIG["not-learned"];
                pillEl.className = `status-pill px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${prevInfo.classes}`;
                pillEl.textContent = prevInfo.text;
                utils.showToast(error.message || "Lỗi đồng bộ dữ liệu", "error");
            }
        });

        const starToggle = card.querySelector(".star-toggle");
        starToggle.addEventListener("click", async (e) => {
            e.stopPropagation();
            const prevDifficult = vocab.is_difficult;
            const newDifficult = !prevDifficult;
            
            // Optimistic UI update
            vocab.is_difficult = newDifficult;
            starToggle.className = `star-toggle cursor-pointer material-symbols-outlined text-lg ${newDifficult ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`;
            
            try {
                await state.toggleDifficulty(vocab.id);
            } catch (error) {
                vocab.is_difficult = prevDifficult;
                starToggle.className = `star-toggle cursor-pointer material-symbols-outlined text-lg ${prevDifficult ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`;
                utils.showToast(error.message || "Lỗi đồng bộ dữ liệu", "error");
            }
        });

        const speakerBtn = card.querySelector(".speaker-btn");
        if (speakerBtn) {
            speakerBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                tts.speak(vocab.japanese);
            });
        }

        card.addEventListener("click", (e) => {
            if (e.target.closest("select") || e.target.closest(".star-toggle") || e.target.closest(".speaker-btn")) return;
            wordDetailsModal.show(vocab);
        });

        container.appendChild(card);
    },

    _bindRowEvents(row, vocab) {
        const selectEl = row.querySelector(".status-select");
        const pillEl = row.querySelector(".status-pill");

        selectEl.addEventListener("change", async (e) => {
            const newStatus = e.target.value;
            const prevStatus = vocab.status;
            
            // Optimistic UI update
            vocab.status = newStatus;
            const newInfo = STATUS_CONFIG[newStatus] || STATUS_CONFIG["not-learned"];
            pillEl.className = `status-pill px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${newInfo.classes}`;
            pillEl.textContent = newInfo.text;

            try {
                await state.updateVocabularyStatus(vocab.id, newStatus);
            } catch (error) {
                vocab.status = prevStatus;
                selectEl.value = prevStatus;
                const prevInfo = STATUS_CONFIG[prevStatus] || STATUS_CONFIG["not-learned"];
                pillEl.className = `status-pill px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${prevInfo.classes}`;
                pillEl.textContent = prevInfo.text;
                utils.showToast(error.message || "Lỗi đồng bộ dữ liệu", "error");
            }
        });

        const starContainer = row.querySelector(".star-container");
        starContainer.addEventListener("click", async () => {
            const prevDifficult = vocab.is_difficult;
            const newDifficult = !prevDifficult;
            
            // Optimistic UI update
            vocab.is_difficult = newDifficult;
            const stars = starContainer.querySelectorAll(".difficulty-star");
            stars.forEach(star => {
                star.className = `material-symbols-outlined text-[18px] ${newDifficult ? "text-amber-400 fill-[1]" : "text-slate-200 dark:text-slate-600"} difficulty-star`;
            });

            try {
                await state.toggleDifficulty(vocab.id);
            } catch (error) {
                vocab.is_difficult = prevDifficult;
                stars.forEach(star => {
                    star.className = `material-symbols-outlined text-[18px] ${prevDifficult ? "text-amber-400 fill-[1]" : "text-slate-200 dark:text-slate-600"} difficulty-star`;
                });
                utils.showToast(error.message || "Lỗi đồng bộ dữ liệu", "error");
            }
        });

        row.addEventListener("click", (e) => {
            if (e.target.closest("select") || e.target.closest(".star-container") || e.target.closest(".speaker-btn")) return;
            wordDetailsModal.show(vocab);
        });

        const speakerBtn = row.querySelector(".speaker-btn");
        if (speakerBtn) {
            speakerBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                tts.speak(vocab.japanese);
            });
        }
    }
};
