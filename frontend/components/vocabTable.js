import { state } from "../state.js";
import { wordDetailsModal } from "./wordDetailsModal.js";
import { tts } from "./tts.js";

// Status display config (centralized for maintainability)
const STATUS_CONFIG = {
    "not-learned": { text: "Chưa học", classes: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" },
    "learning":    { text: "Đang học", classes: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
    "mastered":    { text: "Đã thuộc", classes: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" },
};

export const vocabTable = {
    renderSkeleton(rowCount = 5) {
        const tbody = document.getElementById("vocab-list");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        for(let i=0; i<rowCount; i++) {
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
    },

    async render(lesson, level, customVocabList = null, customTitle = null) {
        if (lesson && level) {
            state.currentLesson = { lesson, level };
        }
        const titleEl = document.getElementById("current-lesson-title");
        if (titleEl) {
            titleEl.textContent = customTitle || `Từ vựng Bài ${lesson} - ${level}`;
        }

        const tbody = document.getElementById("vocab-list");
        if (!tbody) return;


        this.renderSkeleton(5);

        // Brief delay for smooth skeleton-to-content transition
        await new Promise(resolve => setTimeout(resolve, 200));

        const allVocabularies = customVocabList || state.getVocabularyByLesson(level, lesson);

        tbody.innerHTML = "";

        if (allVocabularies.length === 0) {
            const emptyMsg = customVocabList ? "Không có kết quả tìm kiếm." : "Không có dữ liệu từ vựng cho bài học này.";
            tbody.innerHTML = `<tr><td colspan="5" class="px-8 py-6 text-center text-slate-400 dark:text-slate-500">${emptyMsg}</td></tr>`;
            return;
        }

        allVocabularies.forEach((vocab) => {
            const row = document.createElement("tr");
            row.className = "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer group";

            const statusInfo = STATUS_CONFIG[vocab.status] || STATUS_CONFIG["not-learned"];

            // Difficulty stars (boolean toggle, not 1-5 rating)
            let starsHtml = "";
            for (let i = 1; i <= 5; i++) {
                const isActive = vocab.is_difficult;
                const starColorClass = isActive ? "text-amber-400 fill-[1]" : "text-slate-200 dark:text-slate-600";
                starsHtml += `<span class="material-symbols-outlined text-[18px] ${starColorClass} difficulty-star" data-index="${i}">star</span>`;
            }

            row.innerHTML = `
                <td class="px-4 py-4 md:px-8 md:py-6">
                    <div class="flex items-center gap-2 md:gap-4">
                        <div class="font-bold text-base md:text-lg text-slate-900 dark:text-white">${vocab.japanese}</div>
                        <button class="speaker-btn text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none flex items-center justify-center" title="Phát âm" data-text="${vocab.japanese}">
                            <span class="material-symbols-outlined text-xl">volume_up</span>
                        </button>
                    </div>
                </td>
                <td class="px-4 py-4 md:px-8 md:py-6 text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap hiragana-col">${vocab.hiragana}</td>
                <td class="px-4 py-4 md:px-8 md:py-6">
                    <div class="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">${vocab.meaning}</div>
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


            const selectEl = row.querySelector(".status-select");
            const pillEl = row.querySelector(".status-pill");

            selectEl.addEventListener("change", async (e) => {
                const newStatus = e.target.value;
                await state.updateVocabularyStatus(vocab.id, newStatus);


                const newInfo = STATUS_CONFIG[newStatus] || STATUS_CONFIG["not-learned"];
                pillEl.className = `status-pill px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${newInfo.classes}`;
                pillEl.textContent = newInfo.text;

                const { dashboardStats } = await import("./dashboardStats.js");
                dashboardStats.updateStats();
            });


            const starContainer = row.querySelector(".star-container");
            starContainer.addEventListener("click", async () => {
                const isDifficult = await state.toggleDifficulty(vocab.id);

                const stars = starContainer.querySelectorAll(".difficulty-star");
                stars.forEach(star => {
                    if (isDifficult !== null) {
                        star.className = `material-symbols-outlined text-[18px] ${isDifficult ? "text-amber-400 fill-[1]" : "text-slate-200 dark:text-slate-600"} difficulty-star`;
                    }
                });
            });


            row.addEventListener("click", (e) => {
                if (e.target.closest("select") || e.target.closest(".star-container") || e.target.closest(".speaker-btn")) {
                    return;
                }
                wordDetailsModal.show(vocab);
            });

            const speakerBtn = row.querySelector(".speaker-btn");
            if (speakerBtn) {
                speakerBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    tts.speak(vocab.japanese);
                });
            }

            tbody.appendChild(row);
        });
    }
};
