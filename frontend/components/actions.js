import { state } from "../state.js";
import { vocabTable } from "./vocabTable.js";
import { stats } from "./stats.js";
import { historyModal } from "./historyModal.js";

export const actions = {
    init() {

        const startReviewBtn = document.getElementById("start-review");
        const startFlashcardBtn = document.getElementById("start-flashcard");
        const showStatsBtn = document.getElementById("show-stats");
        const showDifficultBtn = document.getElementById("show-difficult");
        const startTestBtn = document.getElementById("start-test");

        if (startReviewBtn) {
            startReviewBtn.addEventListener("click", () => {
                if (!state.currentLesson) return alert("Vui lòng chọn một bài học trước!");
                window.location.href = `review.html?lesson=${encodeURIComponent(state.currentLesson.lesson)}&level=${encodeURIComponent(state.currentLesson.level)}`;
            });
        }

        if (startFlashcardBtn) {
            startFlashcardBtn.addEventListener("click", () => {
                 if (!state.currentLesson) return alert("Vui lòng chọn một bài học trước!");
                 window.location.href = `flashcard.html?lesson=${encodeURIComponent(state.currentLesson.lesson)}&level=${encodeURIComponent(state.currentLesson.level)}`;
            });
        }

        if (showStatsBtn) {
            showStatsBtn.addEventListener("click", () => {
                stats.show();
            });
        }

        if (showDifficultBtn) {
            showDifficultBtn.addEventListener("click", () => {
                const difficultVocabs = state.getDifficultVocabulary();
                vocabTable.render(null, null, difficultVocabs, "Những từ vựng khó (đánh dấu sao)");
                

                document.querySelectorAll('.lesson-nav-active').forEach(el => {
                    el.classList.remove('lesson-nav-active', 'bg-indigo-500', 'text-white', 'border-indigo-600', 'shadow-md');
                    el.classList.add('text-slate-500', 'border-slate-100');
                });
            });
        }

        if (startTestBtn) {
            startTestBtn.addEventListener("click", () => {
                window.location.href = `test.html`;
            });
        }

        const viewHistoryBtn = document.getElementById("view-history-btn");
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener("click", () => {
                historyModal.show();
            });
        }
    }
};
