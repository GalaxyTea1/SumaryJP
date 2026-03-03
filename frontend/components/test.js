import { state } from "../state.js";
import { utils } from "./utils.js";

export const testObj = {
    testWords: [],
    currentTestIndex: 0,
    testAnswers: [],
    testStartTime: null,
    testTimeLimit: 0,
    testTimer: null,

    start() {
        if (document.querySelector(".test-config-modal-test")) return;

        const modal = document.createElement("div");
        modal.className = "test-config-modal test-config-modal-test";
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Cấu hình bài kiểm tra</h3>
                <div class="test-config">
                    <label>
                        Số lượng từ:
                        <input type="number" id="word-count" min="5" max="50" value="10">
                    </label>
                    <label>
                        Thời gian (phút):
                        <input type="number" id="test-time" min="1" max="30" value="5">
                    </label>
                </div>
                <div class="modal-buttons">
                    <button id="start-test-btn">Bắt đầu</button>
                    <button id="cancel-test-btn">Hủy</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector("#start-test-btn").addEventListener("click", () => this.initialize());
        modal.querySelector("#cancel-test-btn").addEventListener("click", () => this.closeConfig());
        modal.addEventListener("click", (e) => {
            if (e.target === modal) this.closeConfig();
        });
    },

    closeConfig() {
        const modal = document.querySelector(".test-config-modal-test");
        if (modal) modal.remove();
    },

    initialize() {
        const wordCount = parseInt(document.getElementById("word-count").value);
        const testTime = parseInt(document.getElementById("test-time").value);
        if (isNaN(wordCount) || isNaN(testTime) || wordCount < 5 || testTime < 1) {
            alert("Vui lòng nhập số lượng từ (ít nhất 5) và thời gian (ít nhất 1 phút)");
            return;
        }
        let allWords = [];
        Object.entries(state.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, words]) => {
                allWords = allWords.concat(words.map((word) => ({ ...word, level, lesson })));
            });
        });
        if (allWords.length < wordCount) {
            alert(`Bạn chỉ có ${allWords.length} từ. Vui lòng chọn số lượng từ ít hơn.`);
            return;
        }
        utils.shuffleArray(allWords);
        this.testWords = allWords.slice(0, wordCount);
        this.currentTestIndex = 0;
        this.testAnswers = [];
        this.testStartTime = new Date();
        this.testTimeLimit = testTime * 60; // Convert to seconds
        this.closeConfig();
        document.getElementById("test-container").style.display = "flex";
        this.showQuestion();
        this.startTimer();
    },

    showQuestion() {
        const currentWord = this.testWords[this.currentTestIndex];
        document.getElementById("test-word").textContent = currentWord.japanese;
        document.getElementById("test-hint").textContent = `Hiragana: ${currentWord.hiragana}`;
        document.getElementById("test-progress").textContent = `${this.currentTestIndex + 1}/${this.testWords.length}`;

        const optionsContainer = document.getElementById("test-options");
        optionsContainer.innerHTML = "";

        // Generate options: 1 correct, up to 3 wrong
        let allMeanings = [];
        Object.values(state.lessons).forEach((level) => {
            Object.values(level).forEach((lesson) => {
                lesson.forEach((word) => allMeanings.push(word.meaning));
            });
        });

        // Filter out correct meaning and duplicates
        allMeanings = [...new Set(allMeanings.filter(m => m.toLowerCase() !== currentWord.meaning.toLowerCase()))];
        utils.shuffleArray(allMeanings);

        const wrongOptionsCount = Math.min(3, allMeanings.length);
        const options = [currentWord.meaning, ...allMeanings.slice(0, wrongOptionsCount)];
        utils.shuffleArray(options);

        const labels = ["A", "B", "C", "D"];
        options.forEach((option, index) => {
            const button = document.createElement("button");
            button.className = "test-option-btn";
            button.innerHTML = `<strong>${labels[index]}.</strong> ${option}`;
            button.onclick = () => this.submitAnswer(option);
            optionsContainer.appendChild(button);
        });
    },

    submitAnswer(selectedAnswer) {
        const currentWord = this.testWords[this.currentTestIndex];
        const isCorrect = selectedAnswer.toLowerCase() === currentWord.meaning.toLowerCase();
        this.testAnswers.push({
            word: currentWord,
            userAnswer: selectedAnswer,
            correct: isCorrect,
        });
        this.currentTestIndex++;
        if (this.currentTestIndex < this.testWords.length) {
            this.showQuestion();
        } else {
            this.finish();
        }
    },

    startTimer() {
        const timerElement = document.getElementById("test-timer");
        this.testTimer = setInterval(() => {
            const elapsed = Math.floor((new Date() - this.testStartTime) / 1000);
            const remaining = this.testTimeLimit - elapsed;
            if (remaining <= 0) {
                this.finish();
                return;
            }
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }, 1000);
    },

    finish() {
        clearInterval(this.testTimer);
        const correctCount = this.testAnswers.filter((a) => a.correct).length;
        const score = Math.round((correctCount / this.testWords.length) * 100);
        const timeTaken = Math.floor((new Date() - this.testStartTime) / 1000);
        document.getElementById("test-container").style.display = "none";
        document.getElementById("test-results").style.display = "block";
        document.getElementById("final-score").textContent = score;
        document.getElementById("correct-count").textContent = correctCount;
        document.getElementById("wrong-count").textContent = this.testWords.length - correctCount;
        document.getElementById("time-taken").textContent = `${Math.floor(timeTaken / 60)
            .toString()
            .padStart(2, "0")}:${(timeTaken % 60).toString().padStart(2, "0")}`;
        document.getElementById("answers-review").innerHTML = this.testAnswers
            .map(
                (a) => `
            <div class="answer-item ${a.correct ? "correct" : "wrong"}">
                <span class="answer-word">${a.word.japanese}</span>
                <div class="answer-details">
                    <span class="user-answer">${a.userAnswer}</span>
                    ${!a.correct ? `<span class="correct-answer">✔️ ${a.word.meaning}</span>` : ""}
                </div>
            </div>
        `
            )
            .join("");
    },

    close() {
        document.getElementById("test-results").style.display = "none";
    }
};
