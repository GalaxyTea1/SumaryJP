import { state } from "../state.js";
import { ui } from "./ui.js";
import { utils } from "./utils.js";
import { router } from "./router.js";

let cleanupFns = [];
let testTimer = null;

export const testView = {
    init(params = {}) {
        const { level: selectedLevel, lesson: selectedLesson, count: wordCount, time: testTime, hiragana } = params;
        const showHiragana = hiragana === true || hiragana === "true";

        cleanupFns = [];

        const elHeader = document.getElementById("ts-header");
        const elMain = document.getElementById("ts-main");
        const elWord = document.getElementById("ts-word");
        const elHint = document.getElementById("ts-hint");
        const elOptions = document.getElementById("ts-options");
        const elProgress = document.getElementById("ts-progress");
        const elProgressBar = document.getElementById("ts-progress-bar");
        const elTimer = document.getElementById("ts-timer");
        const btnNext = document.getElementById("ts-next-btn");
        const btnPrev = document.getElementById("ts-prev-btn");
        const jumpInput = document.getElementById("ts-jump-input");
        const jumpBtn = document.getElementById("ts-jump-btn");
        const textLabel = document.getElementById("ts-question-label");
        const elResults = document.getElementById("ts-results");

        // Reset UI
        elHeader.classList.remove("hidden");
        elMain.classList.remove("hidden");
        elResults.classList.add("hidden");

        let testWords = [];
        let currentTestIndex = 0;
        // testAnswers[i] = { word, userAnswer, correct } — undefined nếu chưa trả lời
        let testAnswers = [];
        let testStartTime = null;
        let testTimeLimit = 0;
        // Lưu đáp án đang chọn ở câu hiện tại (có thể là đáp án cũ khi quay lại)
        let selectedOptionValue = null;

        if (!wordCount) {
            utils.showToast("Thiếu cấu hình bài kiểm tra.", "warning");
            router.back();
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

        utils.shuffleArray(allWords);
        testWords = allWords.slice(0, parseInt(wordCount));

        testAnswers = new Array(testWords.length).fill(null);

        function startTestEngine(timeMinutes) {
            currentTestIndex = 0;
            testAnswers = new Array(testWords.length).fill(null);
            selectedOptionValue = null;
            testTimeLimit = parseInt(timeMinutes) * 60;
            testStartTime = new Date();
            renderQuestion();
            clearInterval(testTimer);
            testTimer = setInterval(tickTimer, 1000);
            tickTimer();
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
                elTimer.parentElement.classList.add("animate-pulse", "bg-rose-100");
            }
        }

        function updateNavButtons() {
            // Nút Previous: disable ở câu đầu tiên
            btnPrev.disabled = currentTestIndex === 0;

            // Cập nhật max cho jump input
            jumpInput.max = testWords.length;
        }

        function renderQuestion() {
            const currentWord = testWords[currentTestIndex];
            elWord.textContent = currentWord.japanese;
            elHint.textContent = showHiragana ? currentWord.hiragana : "";
            textLabel.textContent = `Câu hỏi số ${currentTestIndex + 1}`;
            elProgress.textContent = `Câu: ${currentTestIndex + 1}/${testWords.length}`;

            const pct = (currentTestIndex / testWords.length) * 100;
            elProgressBar.style.width = `${pct}%`;

            elOptions.innerHTML = "";

            const savedAnswer = testAnswers[currentTestIndex];
            selectedOptionValue = savedAnswer ? savedAnswer.userAnswer : null;

            // Nếu đã có đáp án, cho phép bấm Next ngay
            if (selectedOptionValue) {
                btnNext.disabled = false;
                btnNext.classList.remove("opacity-50", "cursor-not-allowed");
            } else {
                btnNext.disabled = true;
                btnNext.classList.add("opacity-50", "cursor-not-allowed");
            }

            // Tạo options
            let allMeanings = [];
            Object.values(state.lessons).forEach((level) => {
                Object.values(level).forEach((lesson) => {
                    lesson.forEach((word) => allMeanings.push(word.meaning));
                });
            });

            allMeanings = [...new Set(allMeanings.filter(m => m.toLowerCase() !== currentWord.meaning.toLowerCase()))];
            utils.shuffleArray(allMeanings);

            const wrongOptionsCount = Math.min(3, allMeanings.length);
            const options = [currentWord.meaning, ...allMeanings.slice(0, wrongOptionsCount)];
            utils.shuffleArray(options);

            const labels = ["A", "B", "C", "D"];
            options.forEach((optionTxt, index) => {
                const btn = document.createElement("button");

                const isSelected = selectedOptionValue && selectedOptionValue.toLowerCase() === optionTxt.toLowerCase();
                const isCorrect = optionTxt.toLowerCase() === currentWord.meaning.toLowerCase();

                // Style cơ bản
                let btnClass = "option-btn group text-left w-full border-2 rounded-2xl px-6 py-4 font-semibold transition-all active:scale-[0.98] flex items-center gap-4 relative overflow-hidden ";

                if (isSelected) {
                    // Câu đã trả lời: hiển thị trạng thái đúng/sai
                    if (isCorrect) {
                        btnClass += "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-200";
                    } else {
                        btnClass += "bg-rose-50 dark:bg-rose-900/30 border-rose-400 dark:border-rose-500 text-rose-800 dark:text-rose-200";
                    }
                } else if (savedAnswer && isCorrect) {
                    // Hiển thị đáp án đúng khi câu đã trả lời sai
                    btnClass += "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300";
                } else {
                    btnClass += "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200";
                }

                btn.className = btnClass;

                let radioClass = "flex-shrink-0 size-6 rounded-full border-2 transition-colors flex items-center justify-center radio-circle ";
                if (isSelected) {
                    radioClass += isCorrect
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-rose-500 bg-rose-500";
                } else {
                    radioClass += "border-slate-300 dark:border-slate-600";
                }

                btn.innerHTML = `
                    <div class="${radioClass}"></div>
                    <div class="flex-1 font-semibold select-text">${optionTxt}</div>
                    <div class="absolute right-0 top-0 h-full w-12 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 opacity-50 text-xl border-l border-slate-200 dark:border-slate-700 transition-all group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-500 dark:group-hover:text-indigo-400">${labels[index]}</div>
                `;

                btn.addEventListener("click", () => {
                    // Cho phép đổi đáp án nếu muốn
                    elOptions.querySelectorAll(".option-btn").forEach(b => {
                        b.className = "option-btn group text-left w-full border-2 rounded-2xl px-6 py-4 font-semibold transition-all active:scale-[0.98] flex items-center gap-4 relative overflow-hidden bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30";
                        b.querySelector('.radio-circle').className = "flex-shrink-0 size-6 rounded-full border-2 border-slate-300 dark:border-slate-600 transition-colors flex items-center justify-center radio-circle";
                    });

                    btn.className = "option-btn group text-left w-full border-2 border-indigo-500 dark:border-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/40 rounded-2xl px-6 py-4 font-semibold transition-all active:scale-[0.98] flex items-center gap-4 relative overflow-hidden text-slate-700 dark:text-slate-200";
                    btn.querySelector('.radio-circle').className = "flex-shrink-0 size-6 rounded-full border-2 border-indigo-600 dark:border-indigo-400 bg-indigo-600 dark:bg-indigo-400 transition-colors flex items-center justify-center radio-circle shadow-[inset_0_0_0_4px_#EEF2FF] dark:shadow-[inset_0_0_0_4px_#1e1b4b]";

                    selectedOptionValue = optionTxt;
                    // Lưu ngay đáp án tạm vào mảng
                    const isCorr = optionTxt.toLowerCase() === currentWord.meaning.toLowerCase();
                    testAnswers[currentTestIndex] = { word: currentWord, userAnswer: optionTxt, correct: isCorr };

                    btnNext.disabled = false;
                    btnNext.classList.remove("opacity-50", "cursor-not-allowed");
                });

                elOptions.appendChild(btn);
            });

            updateNavButtons();
        }

        function onNextClick() {
            if (!selectedOptionValue) return;
            const currentWord = testWords[currentTestIndex];
            const isCorrect = selectedOptionValue.toLowerCase() === currentWord.meaning.toLowerCase();
            testAnswers[currentTestIndex] = { word: currentWord, userAnswer: selectedOptionValue, correct: isCorrect };

            currentTestIndex++;
            if (currentTestIndex < testWords.length) {
                renderQuestion();
            } else {
                finishTest();
            }
        }

        function onPrevClick() {
            if (currentTestIndex === 0) return;
            if (selectedOptionValue) {
                const currentWord = testWords[currentTestIndex];
                const isCorrect = selectedOptionValue.toLowerCase() === currentWord.meaning.toLowerCase();
                testAnswers[currentTestIndex] = { word: currentWord, userAnswer: selectedOptionValue, correct: isCorrect };
            }
            currentTestIndex--;
            renderQuestion();
        }

        function onJump() {
            const val = parseInt(jumpInput.value);
            if (isNaN(val) || val < 1 || val > testWords.length) {
                jumpInput.classList.add("text-rose-500");
                setTimeout(() => jumpInput.classList.remove("text-rose-500"), 800);
                return;
            }
            if (selectedOptionValue) {
                const currentWord = testWords[currentTestIndex];
                const isCorrect = selectedOptionValue.toLowerCase() === currentWord.meaning.toLowerCase();
                testAnswers[currentTestIndex] = { word: currentWord, userAnswer: selectedOptionValue, correct: isCorrect };
            }
            currentTestIndex = val - 1;
            jumpInput.value = "";
            renderQuestion();
        }

        function finishTest() {
            clearInterval(testTimer);
            testTimer = null;

            elHeader.classList.add("hidden");
            elMain.classList.add("hidden");
            elResults.classList.remove("hidden");

            const answeredCount = testAnswers.filter(a => a !== null).length;
            const correctCountNum = testAnswers.filter((a) => a && a.correct).length;
            const score = answeredCount > 0 ? Math.round((correctCountNum / testWords.length) * 100) : 0;
            const timeTaken = Math.floor((new Date() - testStartTime) / 1000);

            document.getElementById("ts-final-score").textContent = score;
            document.getElementById("ts-correct-count").textContent = correctCountNum;
            document.getElementById("ts-wrong-count").textContent = testWords.length - correctCountNum;
            document.getElementById("ts-time-taken").textContent = `${Math.floor(timeTaken / 60).toString().padStart(2, "0")}:${(timeTaken % 60).toString().padStart(2, "0")}`;

            const reviewListContainer = document.getElementById("ts-answers-list");
            reviewListContainer.innerHTML = testAnswers.map((a, i) => {
                if (!a) {
                    return `
                        <div class="ts-review-item wrong">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-slate-400">help</span>
                                <div>
                                    <span class="text-2xl font-black text-slate-800 dark:text-white block">${testWords[i].japanese}</span>
                                    <span class="text-xs font-bold uppercase tracking-widest opacity-60">${testWords[i].hiragana}</span>
                                </div>
                            </div>
                            <div class="flex-1 text-sm sm:text-right">
                                <span class="font-semibold block text-base text-slate-400 dark:text-slate-500 italic">Chưa trả lời</span>
                                <span class="font-bold text-emerald-600 dark:text-emerald-400 mt-1 block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 inline-block rounded-lg text-xs">${testWords[i].meaning}</span>
                            </div>
                        </div>
                    `;
                }
                const cls = a.correct ? "correct" : "wrong";
                const icon = a.correct
                    ? '<span class="material-symbols-outlined text-emerald-500 dark:text-emerald-400">check_circle</span>'
                    : '<span class="material-symbols-outlined text-rose-500 dark:text-rose-400">cancel</span>';
                const userAnsCls = a.correct ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400 line-through";
                return `
                    <div class="ts-review-item ${cls}">
                        <div class="flex items-center gap-3">
                            ${icon}
                            <div>
                                <span class="text-2xl font-black text-slate-800 dark:text-white block">${a.word.japanese}</span>
                                <span class="text-xs font-bold uppercase tracking-widest opacity-60">${a.word.hiragana}</span>
                            </div>
                        </div>
                        <div class="flex-1 text-sm sm:text-right">
                            <span class="font-semibold block text-base ${userAnsCls}">${a.userAnswer || "Không trả lời"}</span>
                            ${!a.correct ? `<span class="font-bold text-emerald-600 dark:text-emerald-400 mt-1 block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 inline-block rounded-lg text-xs">${a.word.meaning}</span>` : ""}
                        </div>
                    </div>
                `;
            }).join("");
        }

        function onQuit() {
            if (confirm("Bạn có chắc chắn muốn thoát khi bài thi chưa kết thúc?")) {
                router.back();
            }
        }

        function onJumpKeydown(e) {
            if (e.key === "Enter") onJump();
        }

        const onBackFromResults = () => router.back();

        btnNext.addEventListener("click", onNextClick);
        btnPrev.addEventListener("click", onPrevClick);
        jumpBtn.addEventListener("click", onJump);
        jumpInput.addEventListener("keydown", onJumpKeydown);
        document.getElementById("ts-quit-btn").addEventListener("click", onQuit);
        document.getElementById("ts-back-btn").addEventListener("click", onBackFromResults);

        cleanupFns.push(
            () => btnNext.removeEventListener("click", onNextClick),
            () => btnPrev.removeEventListener("click", onPrevClick),
            () => jumpBtn.removeEventListener("click", onJump),
            () => jumpInput.removeEventListener("keydown", onJumpKeydown),
            () => document.getElementById("ts-quit-btn")?.removeEventListener("click", onQuit),
            () => document.getElementById("ts-back-btn")?.removeEventListener("click", onBackFromResults)
        );

        startTestEngine(testTime);
    },

    destroy() {
        if (testTimer) {
            clearInterval(testTimer);
            testTimer = null;
        }
        cleanupFns.forEach(fn => fn());
        cleanupFns = [];
    }
};
