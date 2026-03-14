import { state } from "../state.js";
import { utils } from "../components/utils.js";
import { tts } from "./tts.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initial State
    let testWords = [];
    let currentTestIndex = 0;
    let testAnswers = [];
    let testStartTime = null;
    let testTimeLimit = 0;
    let testTimer = null;
    let showHiragana = true;
    let selectedOptionValue = null;

    // DOM Elements - Config
    const overlayConfig = document.getElementById("config-overlay");
    const selectLevel = document.getElementById("config-level");
    const selectLesson = document.getElementById("config-lesson");
    const inputCount = document.getElementById("config-count");
    const inputTime = document.getElementById("config-time");
    const checkHiragana = document.getElementById("config-hiragana");
    const btnStart = document.getElementById("start-test-btn");
    const btnCloseConfig = document.getElementById("close-config-btn");

    // DOM Elements - Test Area
    const elHeader = document.getElementById("test-header");
    const elMain = document.getElementById("test-main");
    const elWord = document.getElementById("test-word");
    const elHint = document.getElementById("test-hint");
    const elOptions = document.getElementById("test-options");
    const elProgress = document.getElementById("test-progress");
    const elProgressBar = document.getElementById("test-progress-bar");
    const elTimer = document.getElementById("test-timer");
    const btnNext = document.getElementById("next-question-btn");
    const textLabel = document.getElementById("question-label");

    // DOM Elements - Results
    const elResults = document.getElementById("test-results");

    // Initialize Data
    try {
        await state.loadFromServer();
        populateConfigDropdowns();
        tts.initContextMenu();
    } catch (e) {
        alert("Có lỗi tải dữ liệu từ máy chủ.");
    }

    // --- Configuration Logic ---
    function populateConfigDropdowns() {
        // Populate Levels
        const levels = Object.keys(state.lessons || {});
        levels.forEach(l => {
            const opt = document.createElement("option");
            opt.value = opt.textContent = l;
            selectLevel.appendChild(opt);
        });

        // Initialize lessons based on 'all'
        updateLessonDropdown("all");

        selectLevel.addEventListener("change", (e) => {
            updateLessonDropdown(e.target.value);
        });
    }

    function updateLessonDropdown(levelStr) {
        // clear old
        while (selectLesson.options.length > 1) {
            selectLesson.remove(1);
        }

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
            selectLesson.appendChild(opt);
        });
        selectLesson.value = "all";
    }

    btnCloseConfig.addEventListener("click", () => window.location.href = "index.html");
    document.getElementById("quit-test-btn").addEventListener("click", () => {
        if (confirm("Bạn có chắc chắn muốn thoát khi bài thi chưa kết thúc?")) {
            window.location.href = "index.html"
        }
    });

    btnStart.addEventListener("click", () => {
        const wordCount = parseInt(inputCount.value);
        const testTime = parseInt(inputTime.value);
        const selectedLevel = selectLevel.value;
        const selectedLesson = selectLesson.value;
        showHiragana = checkHiragana.checked;

        if (isNaN(wordCount) || isNaN(testTime) || wordCount < 5 || testTime < 1) {
            alert("Vui lòng nhập số lượng từ (ít nhất 5) và thời gian (ít nhất 1 phút)");
            return;
        }

        let allWords = [];
        Object.entries(state.lessons).forEach(([level, lessons]) => {
            if (selectedLevel !== "all" && level !== selectedLevel) return;
            Object.entries(lessons).forEach(([lesson, words]) => {
                if (selectedLesson !== "all" && lesson !== selectedLesson) return;
                allWords = allWords.concat(words.map((word) => ({ ...word, level, lesson })));
            });
        });

        if (allWords.length < 5) {
            alert("Số lượng từ vựng trong phạm vi này quá ít (dưới 5 từ). Vui lòng chọn bài học khác.");
            return;
        }

        if (allWords.length < wordCount) {
            alert(`Phạm vi này hiện chỉ có ${allWords.length} từ. Bài kiểm tra sẽ lấy tối đa số từ đang có.`);
        }

        utils.shuffleArray(allWords);
        testWords = allWords.slice(0, wordCount);

        startTestEngine(testTime);
    });

    // --- Core Test Logic ---
    function startTestEngine(testTimeMinutes) {
        // Unmount config
        overlayConfig.classList.add("opacity-0", "pointer-events-none");
        setTimeout(() => overlayConfig.classList.add("hidden"), 300);

        // Reset state
        currentTestIndex = 0;
        testAnswers = [];
        selectedOptionValue = null;
        testTimeLimit = testTimeMinutes * 60;
        testStartTime = new Date();

        // Show UI
        elHeader.classList.remove("hidden");
        elMain.classList.remove("hidden");

        renderQuestion();

        // Timer
        clearInterval(testTimer);
        testTimer = setInterval(tickTimer, 1000);
        tickTimer(); // Call immediately once to avoid 1 sec delay
    }

    function tickTimer() {
        const elapsed = Math.floor((new Date() - testStartTime) / 1000);
        const remaining = testTimeLimit - elapsed;

        if (remaining <= 0) {
            finishTest();
            return;
        }

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        elTimer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        if (remaining <= 60) {
            elTimer.classList.add("text-rose-600");
            document.querySelector("#test-timer").parentElement.classList.add("animate-pulse", "bg-rose-100");
        }
    }

    function renderQuestion() {
        const currentWord = testWords[currentTestIndex];

        elWord.textContent = currentWord.japanese;
        elHint.textContent = showHiragana ? currentWord.hiragana : ""; // Reserve space with CSS min-height

        textLabel.textContent = `Câu hỏi số ${currentTestIndex + 1}`;
        elProgress.textContent = `Câu: ${currentTestIndex + 1}/${testWords.length}`;

        // Progress bar smooth calc
        const pct = ((currentTestIndex) / testWords.length) * 100;
        elProgressBar.style.width = `${pct}%`;

        // Clear old options
        elOptions.innerHTML = "";
        btnNext.disabled = true;
        selectedOptionValue = null;

        // Generate options (1 correct, 3 wrong)
        let allMeanings = [];
        Object.values(state.lessons).forEach((level) => {
            Object.values(level).forEach((lesson) => {
                lesson.forEach((word) => allMeanings.push(word.meaning));
            });
        });

        // Unique wrong meanings
        allMeanings = [...new Set(allMeanings.filter(m => m.toLowerCase() !== currentWord.meaning.toLowerCase()))];
        utils.shuffleArray(allMeanings);

        const wrongOptionsCount = Math.min(3, allMeanings.length);
        const options = [currentWord.meaning, ...allMeanings.slice(0, wrongOptionsCount)];
        utils.shuffleArray(options);

        // Render Buttons
        const labels = ["A", "B", "C", "D"];
        options.forEach((optionTxt, index) => {
            const btn = document.createElement("button");
            btn.className = "option-btn group text-left w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 rounded-2xl px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] flex items-center gap-4 relative overflow-hidden";

            // Re-creating the pseudo-radio button programatically for better control
            btn.innerHTML = `
                <div class="flex-shrink-0 size-6 rounded-full border-2 border-slate-300 dark:border-slate-600 transition-colors flex items-center justify-center radio-circle"></div>
                <div class="flex-1 font-semibold text-slate-700 dark:text-slate-200 select-text">${optionTxt}</div>
                <div class="absolute right-0 top-0 h-full w-12 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 opacity-50 text-xl border-l border-slate-200 dark:border-slate-700 transition-all group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-500 dark:group-hover:text-indigo-400">${labels[index]}</div>
            `;

            btn.addEventListener("click", () => {
                // Select visual
                document.querySelectorAll(".option-btn").forEach(b => {
                    b.classList.remove("selected", "border-indigo-500", "dark:border-indigo-400", "bg-indigo-50/80", "dark:bg-indigo-900/40");
                    b.querySelector('.radio-circle').classList.remove("border-indigo-600", "dark:border-indigo-400", "bg-indigo-600", "dark:bg-indigo-400", "shadow-[inset_0_0_0_4px_#EEF2FF]", "dark:shadow-[inset_0_0_0_4px_#1e1b4b]");
                });

                btn.classList.add("selected", "border-indigo-500", "dark:border-indigo-400", "bg-indigo-50/80", "dark:bg-indigo-900/40");
                btn.querySelector('.radio-circle').classList.add("border-indigo-600", "dark:border-indigo-400", "bg-indigo-600", "dark:bg-indigo-400", "shadow-[inset_0_0_0_4px_#EEF2FF]", "dark:shadow-[inset_0_0_0_4px_#1e1b4b]");

                selectedOptionValue = optionTxt;
                btnNext.disabled = false;
                btnNext.classList.remove("opacity-50", "cursor-not-allowed");
            });

            elOptions.appendChild(btn);
        });

        btnNext.disabled = true;
        btnNext.classList.add("opacity-50", "cursor-not-allowed");
    }

    btnNext.addEventListener("click", () => {
        if (!selectedOptionValue) return;

        const currentWord = testWords[currentTestIndex];
        const isCorrect = selectedOptionValue.toLowerCase() === currentWord.meaning.toLowerCase();

        testAnswers.push({
            word: currentWord,
            userAnswer: selectedOptionValue,
            correct: isCorrect,
        });

        currentTestIndex++;
        if (currentTestIndex < testWords.length) {
            renderQuestion();
        } else {
            finishTest();
        }
    });

    // --- Finish & Results ---
    function finishTest() {
        clearInterval(testTimer);

        elHeader.classList.add("hidden");
        elMain.classList.add("hidden");
        elResults.classList.remove("hidden");

        const correctCountNum = testAnswers.filter((a) => a.correct).length;
        const score = Math.round((correctCountNum / testWords.length) * 100);
        const timeTaken = Math.floor((new Date() - testStartTime) / 1000);

        document.getElementById("final-score").textContent = score;
        document.getElementById("correct-count").textContent = correctCountNum;
        document.getElementById("wrong-count").textContent = testWords.length - correctCountNum;

        document.getElementById("time-taken").textContent = `${Math.floor(timeTaken / 60)
            .toString()
            .padStart(2, "0")}:${(timeTaken % 60).toString().padStart(2, "0")}`;

        // Populate lists
        const reviewListContainer = document.getElementById("answers-review-list");
        reviewListContainer.innerHTML = testAnswers.map(a => {
            const cls = a.correct ? "correct" : "wrong";
            const icon = a.correct ? '<span class="material-symbols-outlined text-emerald-500 dark:text-emerald-400">check_circle</span>' : '<span class="material-symbols-outlined text-rose-500 dark:text-rose-400">cancel</span>';
            const userAnsCls = a.correct ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 line-through';

            return `
                <div class="review-item ${cls}">
                    <div class="review-word-box flex items-center gap-3">
                        ${icon}
                        <div>
                            <span class="review-word">${a.word.japanese}</span>
                            <span class="text-xs font-bold uppercase tracking-widest opacity-60">${a.word.hiragana}</span>
                        </div>
                    </div>
                    <div class="review-ans-box">
                        <span class="user-ans ${userAnsCls}">${a.userAnswer || "Không trả lời"}</span>
                        ${!a.correct ? `<span class="correct-ans">${a.word.meaning}</span>` : ""}
                    </div>
                </div>
            `;
        }).join("");
    }
});
