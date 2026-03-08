import { state } from "../state.js";
import { ui } from "./ui.js";
import { utils } from "./utils.js";

export const review = {
    reviewQueue: [],
    currentReviewVocab: null,

    startSession() {
        this.reviewQueue = [];
        const now = new Date();
        
        Object.entries(state.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, vocabularies]) => {
                vocabularies.forEach((vocab) => {
                    // Start of SM-2 Data Initialization if missing
                    if (vocab.interval === undefined) vocab.interval = 0;
                    if (vocab.ease_factor === undefined) vocab.ease_factor = 2.5;
                    if (!vocab.next_review) vocab.next_review = now.toISOString();

                    // Queue if next_review is past or today
                    const nextReviewDate = new Date(vocab.next_review);
                    if (nextReviewDate <= now && vocab.status !== "mastered") {
                        this.reviewQueue.push({ ...vocab, lesson, level });
                    }
                });
            });
        });
        
        // Sort by next review date (oldest first)
        this.reviewQueue.sort((a, b) => new Date(a.next_review) - new Date(b.next_review));
        
        if (this.reviewQueue.length === 0) {
            alert("Không có từ vựng cần ôn tập hôm nay!");
            return;
        }
        this.showUI();
    },

    showUI() {
        const reviewContainer = document.getElementById("review-container");
        const reviewWord = document.getElementById("review-word");
        const reviewHint = document.getElementById("review-hint");
        
        this.currentReviewVocab = this.reviewQueue[0];
        reviewContainer.style.display = "block";
        reviewWord.textContent = this.currentReviewVocab.japanese;
        reviewHint.textContent = `Hiragana: ${this.currentReviewVocab.hiragana}`;
    },

    async checkAnswer(correct) {
        let quality = correct ? 4 : 0; // Simple SM-2 quality (0=fail, 4=good)
        
        if (correct) {
            this.currentReviewVocab.review_count++;
            
            // SM-2 calculations
            if (this.currentReviewVocab.review_count === 1) {
                this.currentReviewVocab.interval = 1;
            } else if (this.currentReviewVocab.review_count === 2) {
                this.currentReviewVocab.interval = 6;
            } else {
                this.currentReviewVocab.interval = Math.round(this.currentReviewVocab.interval * this.currentReviewVocab.ease_factor);
            }
            
            this.currentReviewVocab.ease_factor = this.currentReviewVocab.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (this.currentReviewVocab.ease_factor < 1.3) this.currentReviewVocab.ease_factor = 1.3;

            if (this.currentReviewVocab.interval >= 21) {
                 this.currentReviewVocab.status = "mastered";
            }
        } else {
            // Failed
            this.currentReviewVocab.review_count = 0;
            this.currentReviewVocab.interval = 1;
            this.currentReviewVocab.ease_factor = Math.max(1.3, this.currentReviewVocab.ease_factor - 0.2);
        }
        
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + this.currentReviewVocab.interval);
        
        this.currentReviewVocab.last_reviewed = new Date().toISOString();
        this.currentReviewVocab.next_review = nextReviewDate.toISOString();

        try {
            await state.updateVocabulary(this.currentReviewVocab);
            this.reviewQueue.push(this.reviewQueue.shift());
            if (this.reviewQueue.length > 0) {
                this.showUI();
            } else {
                document.getElementById("review-container").style.display = "none";
                alert("Hoàn thành phiên ôn tập!");
                if (state.currentLesson) {
                    ui.displayVocabulary(state.currentLesson.lesson, state.currentLesson.level);
                }
            }
        } catch (error) {
            console.error("Error saving review update:", error);
            alert("Có lỗi khi lưu trạng thái ôn tập.");
        }
    },

    async showDifficultWords() {
        await state.loadFromServer(); // Ensure we have latest data
        const difficultWords = [];
        Object.entries(state.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, words]) => {
                words.forEach((word) => {
                    if (word.is_difficult) difficultWords.push({ ...word, level, lesson });
                });
            });
        });

        const modal = document.createElement("div");
        modal.className = "difficult-words-modal";
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Danh sách từ khó</h2>
                    <button id="close-difficult-modal">✕</button>
                </div>
                <div class="modal-body">
                    <table class="difficult-words-table">
                        <thead>
                            <tr>
                                <th>Từ</th>
                                <th>Hiragana</th>
                                <th>Nghĩa</th>
                                <th>Bài/Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${difficultWords
                .map(
                    (word) => `
                                <tr>
                                    <td>${word.japanese}</td>
                                    <td>${word.hiragana}</td>
                                    <td>${word.meaning}</td>
                                    <td>Bài ${word.lesson} - ${word.level}</td>
                                </tr>
                            `
                )
                .join("")}
                        </tbody>
                    </table>
                    <div class="modal-footer">
                        <button id="review-difficult">Ôn tập từ khó</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector("#close-difficult-modal").addEventListener("click", () => modal.remove());
        modal.querySelector("#review-difficult").addEventListener("click", () => {
            this.startDifficultWordsReview();
        });
    },

    startDifficultWordsReview() {
        this.reviewQueue = [];
        Object.entries(state.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, words]) => {
                words.forEach((word) => {
                    if (word.is_difficult) this.reviewQueue.push({ ...word, lesson, level });
                });
            });
        });
        
        if (this.reviewQueue.length === 0) {
            alert("Không có từ khó để ôn tập");
            return;
        }
        
        utils.shuffleArray(this.reviewQueue);
        const difficultWordsModal = document.querySelector(".difficult-words-modal");
        if (difficultWordsModal) difficultWordsModal.remove();
        this.showUI();
    }
};
