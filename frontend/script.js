import apiManager from "./api.js";

const vocabularyManager = {
    currentLesson: null,
    lessons: {},
    reviewQueue: [],
    currentReviewVocab: null,
    currentFlashcardIndex: 0,
    flashcardDeck: [],

    async loadFromServer() {
        try {
            const allVocab = await apiManager.getAllVocabulary();
            this.lessons = {};
            allVocab.forEach((vocab) => {
                if (!this.lessons[vocab.level]) {
                    this.lessons[vocab.level] = {};
                }
                if (!this.lessons[vocab.level][vocab.lesson]) {
                    this.lessons[vocab.level][vocab.lesson] = [];
                }
                this.lessons[vocab.level][vocab.lesson].push(vocab);
            });
            this.updateLessonSidebar();
        } catch (error) {
            console.error("Error loading vocabulary:", error);
            alert("Có lỗi khi tải dữ liệu. Vui lòng thử lại.");
        }
    },

    async loadFromGemini() {
        try {
            const apiKeys = API_KEY_GEMINI.split(",").map((key) => key.trim());
            const randomApiKey = this.getRandomApiKey(apiKeys);
            const prompt = `
        Cung cấp danh sách 10 từ vựng tiếng Nhật ở trình độ N5, bài 1. 
        Trả về dữ liệu dưới dạng JSON (chỉ JSON, không thêm text giải thích), với các trường sau:
        - japanese: kanji hoặc dạng gốc của từ (string, ví dụ: "私", "です")
        - hiragana: cách đọc chính xác bằng hiragana (string, ví dụ: "わたし" cho "私", "desu" cho "です")
        - meaning: nghĩa tiếng Việt chính xác (string)
        - type: loại từ chính xác (string, chọn từ: "Danh từ", "Động từ", "Tính từ", "Trợ từ", "Trợ động từ")
        - level: trình độ (string, "N5")
        - lesson: số bài học (string, "1")
        - status: trạng thái học (string, "not-learned")
        - lastReviewed: ngày ôn tập cuối (null)
        - reviewCount: số lần ôn tập (number, 0)

        Lưu ý: 
        - Đảm bảo "hiragana" là cách đọc đúng của "japanese", không trùng lặp.
        - Phân loại "type" chính xác theo ngữ pháp tiếng Nhật.
        `;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${randomApiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                }
            );

            if (!response.ok) {
                console.log(response.status);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0]) {
                console.log("No candidates found");
            }

            const generatedText = data.candidates[0].content.parts[0].text;

            let jsonString = generatedText;
            const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
            } else {
                throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi từ Gemini");
            }

            let vocabList;
            try {
                vocabList = JSON.parse(jsonString);
            } catch (e) {
                console.error("Lỗi khi parse JSON từ Gemini:", e);
                throw new Error("Dữ liệu từ Gemini không đúng định dạng JSON");
            }

            this.lessons = {};
            vocabList.forEach((vocab) => {
                if (!this.lessons[vocab.level]) {
                    this.lessons[vocab.level] = {};
                }
                if (!this.lessons[vocab.level][vocab.lesson]) {
                    this.lessons[vocab.level][vocab.lesson] = [];
                }
                this.lessons[vocab.level][vocab.lesson].push(vocab);
            });

            this.updateLessonSidebar();
        } catch (error) {
            console.error("Error loading vocabulary:", error);
            alert("Có lỗi khi tải dữ liệu. Vui lòng thử lại.");
        }
    },

    getRandomApiKey(apiKeys) {
        const randomIndex = Math.floor(Math.random() * apiKeys.length);
        return apiKeys[randomIndex];
    },

    async addVocabulary(lesson, level, vocab) {
        try {
            vocab.lesson = lesson;
            vocab.level = level;
            vocab.status = "not-learned";
            vocab.lastReviewed = null;
            vocab.reviewCount = 0;
            await apiManager.saveVocabulary(vocab);
            await this.loadFromServer();
        } catch (error) {
            console.error("Error adding vocabulary:", error);
        }
    },

    async updateVocabularyStatus(id, newStatus) {
        try {
            const vocab = await apiManager.getVocabularyById(id);
            if (vocab) {
                vocab.status = newStatus;
                vocab.lastReviewed = new Date().toISOString();
                vocab.reviewCount = (vocab.reviewCount || 0) + 1;
                await apiManager.updateVocabulary(vocab);
                const row = document.querySelector(`tr[data-vocab-id="${id}"]`);
                if (row) row.className = `status-${newStatus}`;
            }
        } catch (error) {
            console.error("Error updating vocabulary status:", error);
            alert("Có lỗi khi cập nhật trạng thái.");
        }
    },

    async removeVocabulary(id) {
        if (confirm("Bạn có chắc muốn xóa từ này?")) {
            try {
                const vocab = await apiManager.getVocabularyById(id);
                const currentLesson = vocab.lesson;
                const currentLevel = vocab.level;
                await apiManager.deleteVocabulary(id);
                await this.loadFromServer();
                await this.displayVocabulary(currentLesson, currentLevel);
                this.updateLessonSidebar();
            } catch (error) {
                console.error("Error removing vocabulary:", error);
                alert("Có lỗi khi xóa từ vựng.");
            }
        }
    },

    updateLessonSidebar() {
        // const sidebar = document.getElementById("lesson-sidebar");
        // const existingContent = sidebar.querySelector("h2").nextElementSibling;
        // if (existingContent) existingContent.remove();

        // const lessonList = document.createElement("div");
        // lessonList.className = "lesson-list";

        // Object.entries(this.lessons).forEach(([level, lessons]) => {
        //     Object.keys(lessons).forEach((lesson) => {
        //         const lessonItem = document.createElement("div");
        //         lessonItem.innerHTML = `<div>${level}`
        //         lessonItem.className = "lesson-item";
        //         lessonItem.addEventListener('click', () => this.displayVocabulary(lesson, level));
        //         lessonItem.innerHTML += `
        //             <span class="lesson-name">Bài ${lesson} - ${level}</span>
        //             <span class="lesson-count">${lessons[lesson].length}</span>
        //         `;
        //         lessonItem.innerHTML += `</div>`;
        //         lessonList.appendChild(lessonItem);
        //     });
        // });

        // sidebar.appendChild(lessonList);
        const sidebar = document.getElementById("lesson-sidebar");
        const existingContent = sidebar.querySelector("h2").nextElementSibling;
        if (existingContent) existingContent.remove();

        const levelList = document.createElement("div");
        levelList.className = "level-list";

        Object.entries(this.lessons).forEach(([level, lessons]) => {
            const levelItem = document.createElement("div");
            levelItem.className = "level-item";

            const totalWords = Object.values(lessons).reduce((sum, lesson) => sum + lesson.length, 0);

            levelItem.innerHTML = `
                <div class="level-header">
                    <span class="level-name">${level} -</span>
                    <span class="level-count">${totalWords}</span>
                </div>
            `;

            const lessonContainer = document.createElement("div");
            lessonContainer.className = "lesson-container";
            lessonContainer.style.display = "none";

            Object.keys(lessons).forEach((lesson) => {
                const lessonItem = document.createElement("div");
                lessonItem.className = "lesson-item";
                lessonItem.innerHTML = `
                    <span class="lesson-name">Bài ${lesson}</span>
                    <span class="lesson-count">${lessons[lesson].length}</span>
                `;
                lessonItem.addEventListener("click", () => this.displayVocabulary(lesson, level));
                lessonContainer.appendChild(lessonItem);
            });

            levelItem.querySelector(".level-header").addEventListener("click", () => {
                const isHidden = lessonContainer.style.display === "none";
                lessonContainer.style.display = isHidden ? "block" : "none";
            });

            levelItem.appendChild(lessonContainer);
            levelList.appendChild(levelItem);
        });

        sidebar.appendChild(levelList);
    },

    startReviewSession() {
        this.reviewQueue = [];
        Object.entries(this.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, vocabularies]) => {
                vocabularies.forEach((vocab) => {
                    if (vocab.status !== "mastered") {
                        this.reviewQueue.push({ ...vocab, lesson, level });
                    }
                });
            });
        });
        this.reviewQueue.sort((a, b) => new Date(a.lastReviewed || 0) - new Date(b.lastReviewed || 0));
        if (this.reviewQueue.length === 0) {
            alert("Không có từ vựng để ôn tập");
            return;
        }
        this.showReviewUI();
    },

    showReviewUI() {
        const reviewContainer = document.getElementById("review-container");
        const reviewWord = document.getElementById("review-word");
        const reviewHint = document.getElementById("review-hint");
        this.currentReviewVocab = this.reviewQueue[0];
        reviewContainer.style.display = "block";
        reviewWord.textContent = this.currentReviewVocab.japanese;
        reviewHint.textContent = `Hiragana: ${this.currentReviewVocab.hiragana}`;
    },

    checkReviewAnswer(correct) {
        if (correct) {
            this.currentReviewVocab.reviewCount++;
            if (this.currentReviewVocab.reviewCount >= 3) {
                this.currentReviewVocab.status = "mastered";
            }
        }
        this.currentReviewVocab.lastReviewed = new Date().toISOString();
        apiManager
            .updateVocabulary(this.currentReviewVocab)
            .then(() => {
                this.reviewQueue.push(this.reviewQueue.shift());
                if (this.reviewQueue.length > 0) {
                    this.showReviewUI();
                } else {
                    document.getElementById("review-container").style.display = "none";
                    alert("Hoàn thành phiên ôn tập!");
                    this.displayVocabulary(this.currentLesson.lesson, this.currentLesson.level);
                }
            })
            .catch((error) => {
                console.error("Error saving review update:", error);
                alert("Có lỗi khi lưu trạng thái ôn tập.");
            });
    },

    startFlashcardMode() {
        document.getElementById("review-container").style.display = "none";
        document.getElementById("vocab-form").style.display = "none";
        document.getElementById("vocab-table").style.display = "none";
        document.getElementById("flashcard-container").style.display = "flex";
        this.prepareFlashcards();
        this.showCurrentCard();
    },

    prepareFlashcards() {
        this.flashcardDeck = [];
        this.currentFlashcardIndex = 0;
        Object.entries(this.lessons).forEach(([level, lessons]) => {
            Object.values(lessons).forEach((vocabularies) => {
                this.flashcardDeck.push(...vocabularies);
            });
        });
        this.shuffleArray(this.flashcardDeck);
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    showCurrentCard() {
        const card = this.flashcardDeck[this.currentFlashcardIndex];
        if (card) {
            document.getElementById("flashcard-japanese").textContent = card.japanese;
            document.getElementById("flashcard-hiragana").textContent = card.hiragana;
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

    exitFlashcardMode() {
        document.getElementById("flashcard-container").style.display = "none";
        document.getElementById("vocab-form").style.display = "grid";
        document.getElementById("vocab-table").style.display = "table";
        this.currentFlashcardIndex = 0;
        this.flashcardDeck = [];
        const flashcard = document.querySelector(".flashcard");
        if (flashcard.classList.contains("flipped")) flashcard.classList.remove("flipped");
    },

    showStatistics() {
        document.querySelector(".stats-overlay").style.display = "block";
        document.getElementById("statistics-container").style.display = "block";
        this.updateStatistics();
    },

    closeStatistics() {
        document.querySelector(".stats-overlay").style.display = "none";
        document.getElementById("statistics-container").style.display = "none";
    },

    updateStatistics() {
        let totalWords = 0,
            mastered = 0,
            learning = 0,
            notLearned = 0;
        Object.values(this.lessons).forEach((level) => {
            Object.values(level).forEach((lesson) => {
                lesson.forEach((word) => {
                    totalWords++;
                    switch (word.status) {
                        case "mastered":
                            mastered++;
                            break;
                        case "in-progress":
                            learning++;
                            break;
                        case "not-learned":
                            notLearned++;
                            break;
                    }
                });
            });
        });
        document.getElementById("total-words").textContent = totalWords;
        document.getElementById("mastered-words").textContent = mastered;
        document.getElementById("learning-words").textContent = learning;
        document.getElementById("not-learned-words").textContent = notLearned;
        this.drawProgressChart(mastered, learning, notLearned);
    },

    drawProgressChart(mastered, learning, notLearned) {
        const ctx = document.getElementById("learning-progress").getContext("2d");
        if (this.progressChart) this.progressChart.destroy();
        this.progressChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Đã thuộc", "Đang học", "Chưa học"],
                datasets: [
                    {
                        data: [mastered, learning, notLearned],
                        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
            },
        });
    },

    async toggleDifficulty(id) {
        try {
            const vocab = await apiManager.getVocabularyById(id);
            if (vocab) {
                vocab.isDifficult = !vocab.isDifficult;
                await apiManager.updateVocabulary(vocab);
                const row = document.querySelector(`tr[data-vocab-id="${id}"]`);
                if (row) {
                    const starButton = row.querySelector("button");
                    starButton.textContent = vocab.isDifficult ? "★" : "☆";
                    starButton.classList.toggle("difficult", vocab.isDifficult);
                }
            }
        } catch (error) {
            console.error("Error toggling difficulty:", error);
            alert("Có lỗi khi cập nhật trạng thái từ khó.");
        }
    },

    showDifficultWords() {
        const difficultWords = [];
        Object.entries(this.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, words]) => {
                words.forEach((word) => {
                    if (word.isDifficult) difficultWords.push({ ...word, level, lesson });
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
        Object.entries(this.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, words]) => {
                words.forEach((word) => {
                    if (word.isDifficult) this.reviewQueue.push({ ...word, lesson, level });
                });
            });
        });
        if (this.reviewQueue.length === 0) {
            alert("Không có từ khó để ôn tập");
            return;
        }
        this.shuffleArray(this.reviewQueue);
        document.querySelector(".difficult-words-modal").remove();
        this.showReviewUI();
    },

    startTest() {
        if (document.querySelector(".test-config-modal")) return;

        const modal = document.createElement("div");
        modal.className = "test-config-modal";
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

        modal.querySelector("#start-test-btn").addEventListener("click", () => this.initializeTest());
        modal.querySelector("#cancel-test-btn").addEventListener("click", () => this.closeTestConfig());
        modal.addEventListener("click", (e) => {
            if (e.target === modal) this.closeTestConfig();
        });
    },

    closeTestConfig() {
        const modal = document.querySelector(".test-config-modal");
        if (modal) modal.remove();
    },

    initializeTest() {
        const wordCount = parseInt(document.getElementById("word-count").value);
        const testTime = parseInt(document.getElementById("test-time").value);
        if (isNaN(wordCount) || isNaN(testTime) || wordCount < 5 || testTime < 1) {
            alert("Vui lòng nhập số lượng từ (ít nhất 5) và thời gian (ít nhất 1 phút)");
            return;
        }
        let allWords = [];
        Object.entries(this.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, words]) => {
                allWords = allWords.concat(words.map((word) => ({ ...word, level, lesson })));
            });
        });
        if (allWords.length < wordCount) {
            alert(`Bạn chỉ có ${allWords.length} từ. Vui lòng chọn số lượng từ ít hơn.`);
            return;
        }
        this.shuffleArray(allWords);
        this.testWords = allWords.slice(0, wordCount);
        this.currentTestIndex = 0;
        this.testAnswers = [];
        this.testStartTime = new Date();
        this.testTimeLimit = testTime * 60; // Convert to seconds
        this.closeTestConfig();
        document.getElementById("test-container").style.display = "flex";
        this.showTestQuestion();
        this.startTestTimer();
    },

    showTestQuestion() {
        const currentWord = this.testWords[this.currentTestIndex];
        document.getElementById("test-word").textContent = currentWord.japanese;
        document.getElementById("test-hint").textContent = `Hiragana: ${currentWord.hiragana}`;
        document.getElementById("test-progress").textContent = `${this.currentTestIndex + 1}/${this.testWords.length}`;
        document.getElementById("test-answer").value = "";
        document.getElementById("test-answer").focus();
    },

    submitAnswer() {
        const answer = document.getElementById("test-answer").value.trim().toLowerCase();
        const currentWord = this.testWords[this.currentTestIndex];
        const isCorrect = answer === currentWord.meaning.toLowerCase();
        this.testAnswers.push({
            word: currentWord,
            userAnswer: answer,
            correct: isCorrect,
        });
        this.currentTestIndex++;
        if (this.currentTestIndex < this.testWords.length) {
            this.showTestQuestion();
        } else {
            this.finishTest();
        }
    },

    startTestTimer() {
        const timerElement = document.getElementById("test-timer");
        this.testTimer = setInterval(() => {
            const elapsed = Math.floor((new Date() - this.testStartTime) / 1000);
            const remaining = this.testTimeLimit - elapsed;
            if (remaining <= 0) {
                this.finishTest();
                return;
            }
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }, 1000);
    },

    finishTest() {
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
                <span>${a.word.japanese}</span>
                <span>${a.userAnswer}</span>
            </div>
        `
            )
            .join("");
    },

    closeTest() {
        document.getElementById("test-results").style.display = "none";
    },

    async displayVocabulary(lesson, level) {
        try {
            this.currentLesson = { lesson, level };
            document.getElementById("current-lesson-title").textContent = `Bài ${lesson} - ${level}`;
            const vocabularies = await apiManager.getVocabularyByLesson(level, lesson);
            const tbody = document.getElementById("vocab-list");
            tbody.innerHTML = "";
            vocabularies.forEach((vocab) => {
                const row = document.createElement("tr");
                row.setAttribute("data-vocab-id", vocab.id);
                row.className = `status-${vocab.status}`;
                row.innerHTML = `
                      <td>${vocab.japanese}</td>
                      <td>${vocab.hiragana}</td>
                      <td>${vocab.meaning}</td>
                      <td>${vocab.type}</td>
                      <td>
                          <select class="status-select">
                              <option value="not-learned" ${vocab.status === "not-learned" ? "selected" : ""}>Chưa học</option>
                              <option value="learning" ${vocab.status === "learning" ? "selected" : ""}>Đang học</option>
                              <option value="mastered" ${vocab.status === "mastered" ? "selected" : ""}>Đã thuộc</option>
                          </select>
                      </td>
                      <td>
                          <button class="difficulty-btn ${vocab.isDifficult ? "difficult" : ""}">${vocab.isDifficult ? "★" : "☆"}</button>
                      </td>
                      <td>
                          <button class="edit-btn">Sửa</button>
                          <button class="delete-btn">Xóa</button>
                      </td>
                  `;
                row.querySelector(".status-select").addEventListener("change", (e) => this.updateVocabularyStatus(vocab.id, e.target.value));
                row.querySelector(".difficulty-btn").addEventListener("click", () => this.toggleDifficulty(vocab.id));
                row.querySelector(".edit-btn").addEventListener("click", () => this.editVocabulary(vocab.id));
                row.querySelector(".delete-btn").addEventListener("click", () => this.removeVocabulary(vocab.id));
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error("Error displaying vocabulary:", error);
            alert("Có lỗi khi hiển thị từ vựng.");
        }
    },

    async addBulkVocabulary(vocabularyList) {
        try {
            for (const vocab of vocabularyList) {
                await apiManager.saveVocabulary({
                    lesson: vocab.lesson,
                    level: vocab.level,
                    japanese: vocab.japanese,
                    hiragana: vocab.hiragana,
                    meaning: vocab.meaning,
                    type: vocab.type,
                    status: "not-learned",
                    lastReviewed: null,
                    reviewCount: 0,
                });
            }
        } catch (error) {
            console.error("Error adding bulk vocabulary:", error);
            throw error;
        }
    },

    async editVocabulary(id) {
        try {
            const vocab = await apiManager.getVocabularyById(id);
            if (!vocab) return;

            const editForm = document.createElement("div");
            editForm.className = "edit-form-modal";
            editForm.innerHTML = `
                <div class="modal-content">
                    <h3>Sửa từ vựng</h3>
                    <form id="edit-vocab-form">
                        <input type="text" id="edit-japanese" value="${vocab.japanese}" placeholder="Kanji" required>
                        <input type="text" id="edit-hiragana" value="${vocab.hiragana}" placeholder="Hiragana" required>
                        <input type="text" id="edit-meaning" value="${vocab.meaning}" placeholder="Nghĩa tiếng Việt" required>
                        <select id="edit-type">
                            <option value="Danh từ" ${vocab.type === "Danh từ" ? "selected" : ""}>Danh từ</option>
                            <option value="Động từ" ${vocab.type === "Động từ" ? "selected" : ""}>Động từ</option>
                            <option value="Tính từ" ${vocab.type === "Tính từ" ? "selected" : ""}>Tính từ</option>
                        </select>
                        <div class="modal-buttons">
                            <button type="submit" id="save-edit">Lưu</button>
                            <button type="button" id="cancel-edit">Hủy</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(editForm);

            editForm.querySelector("#save-edit").addEventListener("click", async (e) => {
                e.preventDefault();
                const updatedVocab = {
                    ...vocab,
                    japanese: document.getElementById("edit-japanese").value,
                    hiragana: document.getElementById("edit-hiragana").value,
                    meaning: document.getElementById("edit-meaning").value,
                    type: document.getElementById("edit-type").value,
                };
                await apiManager.updateVocabulary(updatedVocab);
                editForm.remove();
                await this.displayVocabulary(vocab.lesson, vocab.level);
            });
            editForm.querySelector("#cancel-edit").addEventListener("click", () => editForm.remove());
        } catch (error) {
            console.error("Error editing vocabulary:", error);
            alert("Có lỗi khi sửa từ vựng.");
        }
    },
};

window.onload = async function () {
    try {
        // await vocabularyManager.loadFromGemini();
        await vocabularyManager.loadFromServer();

        // Add event listeners for review-section
        document.getElementById("start-review").addEventListener("click", () => vocabularyManager.startReviewSession());
        document.getElementById("start-flashcard").addEventListener("click", () => vocabularyManager.startFlashcardMode());
        document.getElementById("show-stats").addEventListener("click", () => vocabularyManager.showStatistics());
        document.getElementById("show-difficult").addEventListener("click", () => vocabularyManager.showDifficultWords());
        document.getElementById("start-test").addEventListener("click", () => vocabularyManager.startTest());

        // Add event listeners for flashcard controls
        document.getElementById("prev-card").addEventListener("click", () => vocabularyManager.previousCard());
        document.getElementById("next-card").addEventListener("click", () => vocabularyManager.nextCard());
        document.getElementById("exit-flashcard").addEventListener("click", () => vocabularyManager.exitFlashcardMode());

        // Add event listeners for statistics
        document.getElementById("close-stats").addEventListener("click", () => vocabularyManager.closeStatistics());

        // Add event listeners for test
        document.getElementById("submit-answer").addEventListener("click", () => vocabularyManager.submitAnswer());
        document.getElementById("close-test").addEventListener("click", () => vocabularyManager.closeTest());

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
            vocabularyManager.addVocabulary(lesson, level, vocab);
            this.reset();
        });

        // Add event listeners for review
        document.getElementById("review-answer").addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                const answer = this.value.trim().toLowerCase();
                const correctAnswer = vocabularyManager.currentReviewVocab.meaning.toLowerCase();
                const resultElement = document.getElementById("review-result");
                if (answer === correctAnswer) {
                    resultElement.textContent = `✅ Chính xác! "${correctAnswer}"`;
                    resultElement.className = "review-result correct";
                    vocabularyManager.checkReviewAnswer(true);
                } else {
                    resultElement.textContent = `❌ Sai rồi! Đáp án đúng là: "${correctAnswer}"`;
                    resultElement.className = "review-result incorrect";
                    vocabularyManager.checkReviewAnswer(false);
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
