import { state } from "../state.js";

export const testConfigModal = {
    init() {
        this.overlay = document.getElementById("test-config-overlay");
        this.content = document.getElementById("test-config-content");
        if (!this.overlay || !this.content) return;

        this.selectLevel = document.getElementById("test-config-level");
        this.selectLesson = document.getElementById("test-config-lesson");
        this.inputCount = document.getElementById("test-config-count");
        this.inputTime = document.getElementById("test-config-time");
        this.checkHiragana = document.getElementById("test-config-hiragana");
        this.btnStart = document.getElementById("test-start-btn");
        this.btnClose = document.getElementById("test-close-btn");

        this.btnClose.addEventListener("click", () => this.hide());
        
        this.overlay.addEventListener("click", (e) => {
            if (e.target === this.overlay) this.hide();
        });

        this.selectLevel.addEventListener("change", (e) => {
            this.updateLessonDropdown(e.target.value);
        });

        this.btnStart.addEventListener("click", () => {
            const wordCount = parseInt(this.inputCount.value);
            const testTime = parseInt(this.inputTime.value);
            const selectedLevel = this.selectLevel.value;
            const selectedLesson = this.selectLesson.value;
            const showHiragana = this.checkHiragana.checked;

            if (isNaN(wordCount) || isNaN(testTime) || wordCount < 5 || testTime < 1) {
                alert("Vui lòng nhập số lượng từ (ít nhất 5) và thời gian (ít nhất 1 phút)");
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
                alert("Số lượng từ vựng trong phạm vi này quá ít (dưới 5 từ). Vui lòng chọn bài học khác.");
                return;
            }

            const queryParams = new URLSearchParams({
                level: selectedLevel,
                lesson: selectedLesson,
                count: wordCount,
                time: testTime,
                hiragana: showHiragana
            });

            window.location.href = `test.html?${queryParams.toString()}`;
        });
    },

    populateConfigDropdowns() {
        this.selectLevel.innerHTML = '<option value="all">Tất cả mức độ</option>';
        const levels = Object.keys(state.lessons || {}).sort((a,b) => b.localeCompare(a));
        levels.forEach(l => {
            const opt = document.createElement("option");
            opt.value = opt.textContent = l;
            this.selectLevel.appendChild(opt);
        });

        this.updateLessonDropdown("all");
    },

    updateLessonDropdown(levelStr) {
        this.selectLesson.innerHTML = '<option value="all">Tất cả bài học</option>';
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
            const opt = document.createElement("option");
            opt.value = l;
            opt.textContent = `Bài ${l}`;
            this.selectLesson.appendChild(opt);
        });
        this.selectLesson.value = "all";
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
