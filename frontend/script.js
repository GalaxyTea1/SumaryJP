import { state } from "./state.js";
import { ui } from "./components/ui.js";
import { flashcard } from "./components/flashcard.js";
import { stats } from "./components/stats.js";
import { testObj } from "./components/test.js";
import { review } from "./components/review.js";
import { tts } from "./components/tts.js";
import { search } from "./components/search.js";

window.onload = async function () {
    try {
        await state.loadFromServer();
        ui.updateLessonSidebar();

        // Add event listeners for review-section
        document.getElementById("start-review").addEventListener("click", () => review.startSession());
        document.getElementById("start-flashcard").addEventListener("click", () => flashcard.start());
        document.getElementById("show-stats").addEventListener("click", () => stats.show());
        document.getElementById("show-difficult").addEventListener("click", () => review.showDifficultWords());
        document.getElementById("start-test").addEventListener("click", () => testObj.start());
        
        // Init TTS context menu
        tts.initContextMenu();
        
        // Init Global Search
        search.init();

        // Init Dark Mode
        const darkModeToggle = document.getElementById("dark-mode-toggle");
        if (darkModeToggle) {
            // Check previous preference
            if (localStorage.getItem("theme") === "dark") {
                document.body.classList.add("dark-mode");
            }
            
            darkModeToggle.addEventListener("click", () => {
                document.body.classList.toggle("dark-mode");
                if (document.body.classList.contains("dark-mode")) {
                    localStorage.setItem("theme", "dark");
                } else {
                    localStorage.setItem("theme", "light");
                }
            });
        }

        // Init Hiragana Toggle
        const toggleHiragana = document.getElementById("toggle-hiragana");
        const mainContent = document.querySelector(".main-content");
        if (toggleHiragana) {
            toggleHiragana.addEventListener("change", (e) => {
                if (e.target.checked) {
                    mainContent.classList.remove("hide-hiragana");
                } else {
                    mainContent.classList.add("hide-hiragana");
                }
            });
        }

        // Add event listeners for flashcard controls
        document.getElementById("prev-card").addEventListener("click", () => flashcard.previousCard());
        document.getElementById("next-card").addEventListener("click", () => flashcard.nextCard());
        document.getElementById("exit-flashcard").addEventListener("click", () => flashcard.exit());

        // Add event listeners for statistics
        document.getElementById("close-stats").addEventListener("click", () => stats.close());

        // Add event listeners for test
        document.getElementById("close-test").addEventListener("click", () => testObj.close());

        // Add event listeners for form submit
        document.getElementById("vocab-form").addEventListener("submit", function (e) {
            e.preventDefault();
            const lesson = prompt("Nhập số bài học:");
            if (!lesson) return;
            const vocab = {
                japanese: document.getElementById("japanese-input").value,
                hiragana: document.getElementById("hiragana-input").value,
                meaning: document.getElementById("meaning-input").value,
                type: document.getElementById("type-select").value,
            };
            const level = document.getElementById("level-select").value;
            
            state.addVocabulary(lesson, level, vocab).then(() => {
                ui.updateLessonSidebar();
            });
            
            this.reset();
        });

        // Add event listeners for review
        document.getElementById("review-answer").addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                const answer = this.value.trim().toLowerCase();
                if (!review.currentReviewVocab) return;

                const correctAnswer = review.currentReviewVocab.meaning.toLowerCase();
                const resultElement = document.getElementById("review-result");
                if (answer === correctAnswer) {
                    resultElement.textContent = `✅ Chính xác! "${correctAnswer}"`;
                    resultElement.className = "review-result correct";
                    review.checkAnswer(true);
                } else {
                    resultElement.textContent = `❌ Sai rồi! Đáp án đúng là: "${correctAnswer}"`;
                    resultElement.className = "review-result incorrect";
                    review.checkAnswer(false);
                }
                this.value = "";
                setTimeout(() => {
                    resultElement.textContent = "";
                    resultElement.className = "review-result";
                }, 2000);
            }
        });

        // Add event listeners for flashcard
        document.querySelector(".flashcard").addEventListener("click", function () {
            this.classList.toggle("flipped");
        });
    } catch (error) {
        console.error("Initialization error:", error);
        alert("Có lỗi khi khởi tạo ứng dụng. Vui lòng tải lại trang.");
    }
};
