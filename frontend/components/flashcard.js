import { state } from "../state.js";
import { utils } from "./utils.js";

export const flashcard = {
    currentFlashcardIndex: 0,
    flashcardDeck: [],

    start() {
        if (document.querySelector(".flashcard-config-modal")) return;

        const levelOptions = [`<option value="all">Tất cả</option>`];
        Object.keys(state.lessons).forEach(level => {
            levelOptions.push(`<option value="${level}">${level}</option>`);
        });

        const modal = document.createElement("div");
        modal.className = "test-config-modal flashcard-config-modal";
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Cấu hình Flashcard</h3>
                <div class="test-config">
                    <label>
                        Trình độ:
                        <select id="fc-level-select" style="width: 100px; padding: 5px;">
                            ${levelOptions.join('')}
                        </select>
                    </label>
                    <label>
                        Bài học:
                        <select id="fc-lesson-select" style="width: 100px; padding: 5px;">
                            <option value="all">Tất cả</option>
                        </select>
                    </label>
                </div>
                <div class="modal-buttons">
                    <button id="start-fc-btn">Bắt đầu</button>
                    <button id="cancel-fc-btn">Hủy</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const levelSelect = modal.querySelector("#fc-level-select");
        const lessonSelect = modal.querySelector("#fc-lesson-select");

        levelSelect.addEventListener("change", () => {
            const level = levelSelect.value;
            lessonSelect.innerHTML = `<option value="all">Tất cả</option>`;
            if (level !== "all" && state.lessons[level]) {
                Object.keys(state.lessons[level]).forEach(lesson => {
                    const opt = document.createElement("option");
                    opt.value = lesson;
                    opt.textContent = `Bài ${lesson}`;
                    lessonSelect.appendChild(opt);
                });
            }
        });

        modal.querySelector("#start-fc-btn").addEventListener("click", () => {
            const selectedLevel = levelSelect.value;
            const selectedLesson = lessonSelect.value;
            this.initFlashcards(selectedLevel, selectedLesson);
        });

        modal.querySelector("#cancel-fc-btn").addEventListener("click", () => modal.remove());
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    initFlashcards(selectedLevel, selectedLesson) {
        const modal = document.querySelector(".flashcard-config-modal");
        if (modal) modal.remove();
        document.getElementById("review-container").style.display = "none";
        document.getElementById("vocab-form").style.display = "none";
        document.getElementById("vocab-table").style.display = "none";
        document.getElementById("flashcard-container").style.display = "flex";
        this.prepareFlashcards(selectedLevel, selectedLesson);
    },

    prepareFlashcards(selectedLevel = "all", selectedLesson = "all") {
        this.flashcardDeck = [];
        this.currentFlashcardIndex = 0;
        Object.entries(state.lessons).forEach(([level, lessons]) => {
            if (selectedLevel !== "all" && level !== selectedLevel) return;
            Object.entries(lessons).forEach(([lesson, vocabularies]) => {
                if (selectedLesson !== "all" && lesson !== selectedLesson) return;
                this.flashcardDeck.push(...vocabularies);
            });
        });

        if (this.flashcardDeck.length === 0) {
            alert("Không có từ vựng nào trong bài tập này!");
            this.exit();
            return;
        }

        utils.shuffleArray(this.flashcardDeck);
        this.showCurrentCard();
    },

    showCurrentCard() {
        const card = this.flashcardDeck[this.currentFlashcardIndex];
        if (card) {
            document.getElementById("flashcard-japanese").textContent = card.japanese;
            document.getElementById("flashcard-hiragana").textContent = card.hiragana;
            document.getElementById("flashcard-hiragana").className = "hiragana-text";
            document.getElementById("flashcard-meaning").textContent = card.meaning;
            document.getElementById("flashcard-type").textContent = card.type;
            document.getElementById("card-progress").textContent = `${this.currentFlashcardIndex + 1}/${this.flashcardDeck.length}`;
        }
    },

    nextCard() {
        if (this.currentFlashcardIndex < this.flashcardDeck.length - 1) {
            this.currentFlashcardIndex++;
            this.showCurrentCard();
        }
    },

    previousCard() {
        if (this.currentFlashcardIndex > 0) {
            this.currentFlashcardIndex--;
            this.showCurrentCard();
        }
    },

    exit() {
        document.getElementById("flashcard-container").style.display = "none";
        document.getElementById("vocab-form").style.display = "grid";
        document.getElementById("vocab-table").style.display = "table";
        this.currentFlashcardIndex = 0;
        this.flashcardDeck = [];
        const flashcardElem = document.querySelector(".flashcard");
        if (flashcardElem && flashcardElem.classList.contains("flipped")) {
            flashcardElem.classList.remove("flipped");
        }
    }
};
