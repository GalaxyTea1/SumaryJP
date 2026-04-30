import { state } from "../state.js";
import { router } from "./router.js";
import { utils } from "./utils.js";

export const testConfigModal = {
    init() {
        this.overlay = document.getElementById("test-config-overlay");
        this.content = document.getElementById("test-config-content");
        if (!this.overlay || !this.content) return;

        this.btnLevel = document.getElementById("test-config-level-btn");
        this.listLevel = document.getElementById("test-config-level-list");
        this.labelLevel = document.getElementById("test-config-level-label");

        this.btnLesson = document.getElementById("test-config-lesson-btn");
        this.listLesson = document.getElementById("test-config-lesson-list");
        this.labelLesson = document.getElementById("test-config-lesson-label");

        this.selectedLevel = "all";
        this.selectedLesson = "all";

        this.inputCount = document.getElementById("test-config-count");
        this.inputTime = document.getElementById("test-config-time");
        this.checkHiragana = document.getElementById("test-config-hiragana");
        this.btnStart = document.getElementById("test-start-btn");
        this.btnClose = document.getElementById("test-close-btn");

        this.btnClose.addEventListener("click", () => this.hide());
        
        this.overlay.addEventListener("click", (e) => {
            if (e.target === this.overlay) this.hide();
        });

        // Dropdown toggles
        this.btnLevel.addEventListener("click", () => {
            const isHidden = this.listLevel.classList.contains("hidden");
            this.listLesson.classList.add("hidden"); // close the other
            if (isHidden) this.listLevel.classList.remove("hidden");
            else this.listLevel.classList.add("hidden");
        });

        this.btnLesson.addEventListener("click", () => {
            const isHidden = this.listLesson.classList.contains("hidden");
            this.listLevel.classList.add("hidden"); // close the other
            if (isHidden) this.listLesson.classList.remove("hidden");
            else this.listLesson.classList.add("hidden");
        });

        // Close dropdowns when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest("#level-dropdown-container")) {
                this.listLevel?.classList.add("hidden");
            }
            if (!e.target.closest("#lesson-dropdown-container")) {
                this.listLesson?.classList.add("hidden");
            }
        });

        this.btnStart.addEventListener("click", () => {
            const wordCount = parseInt(this.inputCount.value);
            const testTime = parseInt(this.inputTime.value);
            const selectedLevel = this.selectedLevel;
            const selectedLesson = this.selectedLesson;
            const showHiragana = this.checkHiragana.checked;

            if (isNaN(wordCount) || isNaN(testTime) || wordCount < 5 || testTime < 1) {
                utils.showToast("Vui lòng nhập số lượng từ (ít nhất 5) và thời gian (ít nhất 1 phút)", "warning");
                return;
            }

            let count = 0;
            Object.entries(state.lessons).forEach(([level, lessons]) => {
                if (selectedLevel !== "all" && level !== selectedLevel) return;
                Object.entries(lessons).forEach(([lesson, words]) => {
                    if (selectedLesson !== "all" && lesson !== selectedLesson) return;
                    count += words.length;
                });
            });

            if (count < 5) {
                utils.showToast("Số lượng từ vựng trong phạm vi này quá ít (dưới 5 từ). Vui lòng chọn bài học khác.", "warning");
                return;
            }

            const queryParams = new URLSearchParams({
                level: selectedLevel,
                lesson: selectedLesson,
                count: wordCount,
                time: testTime,
                hiragana: showHiragana
            });

            this.hide();
            router.navigate('test', { 
                level: selectedLevel, 
                lesson: selectedLesson,
                count: wordCount,
                time: testTime,
                hiragana: showHiragana
            });
        });
    },

    populateConfigDropdowns() {
        this.selectedLevel = "all";
        this.labelLevel.textContent = "Tất cả mức độ";
        this.listLevel.innerHTML = "";
        
        const createMenuItem = (text, onClick) => {
            const li = document.createElement("li");
            li.className = "px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer rounded-lg text-slate-700 dark:text-slate-200 transition-colors text-sm font-medium";
            li.textContent = text;
            li.addEventListener("click", onClick);
            return li;
        };

        this.listLevel.appendChild(createMenuItem("Tất cả mức độ", () => {
            this.selectedLevel = "all";
            this.labelLevel.textContent = "Tất cả mức độ";
            this.updateLessonDropdown("all");
            this.listLevel.classList.add("hidden");
        }));

        const levels = Object.keys(state.lessons || {}).sort((a,b) => b.localeCompare(a));
        levels.forEach(l => {
            this.listLevel.appendChild(createMenuItem(l, () => {
                this.selectedLevel = l;
                this.labelLevel.textContent = l;
                this.updateLessonDropdown(l);
                this.listLevel.classList.add("hidden");
            }));
        });

        this.updateLessonDropdown("all");
    },

    updateLessonDropdown(levelStr) {
        this.selectedLesson = "all";
        this.labelLesson.textContent = "Tất cả bài học";
        this.listLesson.innerHTML = "";

        const createMenuItem = (text, onClick) => {
            const li = document.createElement("li");
            li.className = "px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors text-sm font-medium";
            li.textContent = text;
            li.addEventListener("click", onClick);
            return li;
        };

        this.listLesson.appendChild(createMenuItem("Tất cả bài học", () => {
            this.selectedLesson = "all";
            this.labelLesson.textContent = "Tất cả bài học";
            this.listLesson.classList.add("hidden");
        }));

        let filteredLessons = new Set();
        if (levelStr === "all") {
            Object.values(state.lessons || {}).forEach(lessonsObj => {
                Object.keys(lessonsObj).forEach(lesson => filteredLessons.add(lesson));
            });
        } else {
            Object.keys(state.lessons[levelStr] || {}).forEach(lesson => filteredLessons.add(lesson));
        }

        const sortedLessons = Array.from(filteredLessons).sort((a, b) => a - b);
        sortedLessons.forEach(l => {
            this.listLesson.appendChild(createMenuItem(`Bài ${l}`, () => {
                this.selectedLesson = l;
                this.labelLesson.textContent = `Bài ${l}`;
                this.listLesson.classList.add("hidden");
            }));
        });
    },

    show() {
        this.populateConfigDropdowns();
        this.overlay.classList.remove("hidden");
        setTimeout(() => {
            this.overlay.classList.remove("opacity-0");
            this.content.classList.remove("scale-95", "opacity-0");
        }, 10);
    },

    hide() {
        this.overlay.classList.add("opacity-0");
        this.content.classList.add("scale-95", "opacity-0");
        setTimeout(() => {
            this.overlay.classList.add("hidden");
        }, 300);
    }
};
