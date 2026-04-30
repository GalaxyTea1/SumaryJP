import { state } from "../state.js";
import { router } from "./router.js";
import { utils } from "./utils.js";

export const flashcardConfigModal = {
    init() {
        this.overlay = document.getElementById("flashcard-config-overlay");
        this.content = document.getElementById("flashcard-config-content");
        if (!this.overlay || !this.content) return;

        this.btnLevel = document.getElementById("flashcard-config-level-btn");
        this.listLevel = document.getElementById("flashcard-config-level-list");
        this.labelLevel = document.getElementById("flashcard-config-level-label");

        this.btnLesson = document.getElementById("flashcard-config-lesson-btn");
        this.listLesson = document.getElementById("flashcard-config-lesson-list");
        this.labelLesson = document.getElementById("flashcard-config-lesson-label");

        this.selectedLevel = "all";
        this.selectedLesson = "all";

        this.btnStart = document.getElementById("flashcard-start-btn");
        this.btnClose = document.getElementById("flashcard-close-btn");

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
            if (!e.target.closest("#fc-level-dropdown-container")) {
                this.listLevel?.classList.add("hidden");
            }
            if (!e.target.closest("#fc-lesson-dropdown-container")) {
                this.listLesson?.classList.add("hidden");
            }
        });

        this.btnStart.addEventListener("click", () => {
            const selectedLevel = this.selectedLevel;
            const selectedLesson = this.selectedLesson;

            if (selectedLevel === "all" || selectedLesson === "all") {
                utils.showToast("Vui lòng chọn cụ thể cấp độ và bài học để ôn tập.", "warning");
                return;
            }

            let count = 0;
            const lessons = state.getVocabularyByLesson(selectedLevel, selectedLesson);
            if (lessons) {
                count = lessons.length;
            }

            if (count === 0) {
                utils.showToast("Bài học này chưa có từ vựng nào. Vui lòng chọn bài khác.", "warning");
                return;
            }

            const queryParams = new URLSearchParams({
                level: selectedLevel,
                lesson: selectedLesson
            });

            this.hide();
            router.navigate('flashcard', { level: selectedLevel, lesson: selectedLesson });
        });
    },

    populateConfigDropdowns() {
        this.selectedLevel = "all";
        this.labelLevel.textContent = "Chọn mức độ";
        this.listLevel.innerHTML = "";
        
        const createMenuItem = (text, onClick) => {
            const li = document.createElement("li");
            li.className = "px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer rounded-lg text-slate-700 dark:text-slate-200 transition-colors text-sm font-medium";
            li.textContent = text;
            li.addEventListener("click", onClick);
            return li;
        };

        const levels = Object.keys(state.lessons || {}).sort((a,b) => b.localeCompare(a));
        levels.forEach(l => {
            this.listLevel.appendChild(createMenuItem(l, () => {
                this.selectedLevel = l;
                this.labelLevel.textContent = l;
                this.updateLessonDropdown(l);
                this.listLevel.classList.add("hidden");
            }));
        });

        // Pre-select first level if available
        if (levels.length > 0) {
            this.selectedLevel = levels[0];
            this.labelLevel.textContent = levels[0];
            this.updateLessonDropdown(levels[0]);
        } else {
            this.updateLessonDropdown("all");
        }
    },

    updateLessonDropdown(levelStr) {
        this.selectedLesson = "all";
        this.labelLesson.textContent = "Chọn bài học";
        this.listLesson.innerHTML = "";

        const createMenuItem = (text, onClick) => {
            const li = document.createElement("li");
            li.className = "px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer rounded-lg text-slate-700 dark:text-slate-200 transition-colors text-sm font-medium";
            li.textContent = text;
            li.addEventListener("click", onClick);
            return li;
        };

        let filteredLessons = new Set();
        if (levelStr !== "all") {
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
        
        // Pre-select first lesson if available
        if (sortedLessons.length > 0) {
            this.selectedLesson = sortedLessons[0];
            this.labelLesson.textContent = `Bài ${sortedLessons[0]}`;
        }
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
