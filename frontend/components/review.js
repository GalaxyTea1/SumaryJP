import { state } from "../state.js";
import { tts } from "./tts.js";
import { viewManager } from "./viewManager.js";

let cleanupFns = [];

export const reviewView = {
    init(params = {}) {
        const { lesson: lessonParam, level: levelParam } = params;

        const emptyState = document.getElementById("rv-empty-state");
        const container = document.getElementById("rv-container");
        const progressEl = document.getElementById("rv-progress");
        const emptyTitle = document.getElementById("rv-empty-title");
        const emptyDesc = document.getElementById("rv-empty-desc");
        const headerTitle = document.getElementById("rv-header-title");

        const elWord = document.getElementById("rv-word");
        const elHint = document.getElementById("rv-hint");
        const elAnswerInput = document.getElementById("rv-answer");
        const elResult = document.getElementById("rv-result");
        const btnSubmit = document.getElementById("rv-submit");

        cleanupFns = [];
        let reviewQueue = [];
        let currentReviewVocab = null;
        let isProcessing = false;

        if (headerTitle) {
            headerTitle.textContent = lessonParam && levelParam 
                ? `Bài ${lessonParam} - ${levelParam}` 
                : "Đang rèn luyện trí nhớ";
        }

        function showEmpty(title, desc) {
            emptyState.classList.remove("hidden");
            container.classList.add("hidden");
            if (title) emptyTitle.textContent = title;
            if (desc) emptyDesc.textContent = desc;
        }

        function initUI() {
            emptyState.classList.add("hidden");
            container.classList.remove("hidden");
            renderNextCard();
        }

        function buildReviewQueue() {
            tts.initContextMenu();
            const now = new Date();
            reviewQueue = [];

            Object.entries(state.lessons).forEach(([level, lessons]) => {
                Object.entries(lessons).forEach(([lesson, vocabularies]) => {
                    vocabularies.forEach((vocab) => {
                        if (vocab.interval === undefined) vocab.interval = 0;
                        if (vocab.ease_factor === undefined) vocab.ease_factor = 2.5;
                        if (!vocab.next_review) vocab.next_review = now.toISOString();

                        const nextReviewDate = new Date(vocab.next_review);
                        if (nextReviewDate <= now && vocab.status !== "mastered") {
                            if (lessonParam && levelParam) {
                                if (lesson === lessonParam && level === levelParam) {
                                    reviewQueue.push({ ...vocab, lesson, level });
                                }
                            } else {
                                reviewQueue.push({ ...vocab, lesson, level });
                            }
                        }
                    });
                });
            });

            reviewQueue.sort((a, b) => new Date(a.next_review) - new Date(b.next_review));

            if (reviewQueue.length === 0) {
                showEmpty("Tuyệt vời!", "Không có hoặc đã hết từ vựng cần ôn tập lúc này.");
            } else {
                initUI();
            }
        }

        function renderNextCard() {
            if (reviewQueue.length === 0) {
                showEmpty("Hoàn thành!", "Bạn đã ôn tập xong tất cả từ vựng hôm nay.");
                return;
            }

            currentReviewVocab = reviewQueue[0];
            elWord.textContent = currentReviewVocab.japanese;
            elHint.textContent = currentReviewVocab.hiragana;
            elAnswerInput.value = "";
            elAnswerInput.focus();
            progressEl.textContent = `Còn lại: ${reviewQueue.length}`;

            elResult.classList.remove("translate-y-0", "opacity-100", "bg-emerald-100", "text-emerald-700", "bg-rose-100", "text-rose-700");
            elResult.classList.add("translate-y-4", "opacity-0");
            elAnswerInput.classList.remove("border-rose-400", "border-emerald-400");
        }

        async function processAnswer() {
            if (isProcessing) return;
            const answer = elAnswerInput.value.trim().toLowerCase();
            if (!answer) return;

            isProcessing = true;
            const correctAnswer = currentReviewVocab.meaning.toLowerCase();
            const isCorrect = correctAnswer.includes(answer) || answer.includes(correctAnswer);

            elResult.classList.remove("translate-y-4", "opacity-0");
            elResult.classList.add("translate-y-0", "opacity-100");

            if (isCorrect) {
                elResult.textContent = `✅ Chính xác! Nghĩa là: "${currentReviewVocab.meaning}"`;
                elResult.classList.add("bg-emerald-100", "text-emerald-700");
                elAnswerInput.classList.add("border-emerald-400");
            } else {
                elResult.textContent = `❌ Sai rồi! Nghĩa đúng là: "${currentReviewVocab.meaning}"`;
                elResult.classList.add("bg-rose-100", "text-rose-700");
                elAnswerInput.classList.add("border-rose-400", "shake-anim");
                setTimeout(() => elAnswerInput.classList.remove("shake-anim"), 300);
            }

            let quality = isCorrect ? 4 : 0;

            if (isCorrect) {
                currentReviewVocab.review_count = (currentReviewVocab.review_count || 0) + 1;
                if (currentReviewVocab.review_count === 1) {
                    currentReviewVocab.interval = 1;
                } else if (currentReviewVocab.review_count === 2) {
                    currentReviewVocab.interval = 6;
                } else {
                    currentReviewVocab.interval = Math.round(currentReviewVocab.interval * currentReviewVocab.ease_factor);
                }
                currentReviewVocab.ease_factor = currentReviewVocab.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
                if (currentReviewVocab.ease_factor < 1.3) currentReviewVocab.ease_factor = 1.3;
                currentReviewVocab.status = currentReviewVocab.interval >= 21 ? "mastered" : "learning";
            } else {
                currentReviewVocab.review_count = 0;
                currentReviewVocab.interval = 1;
                currentReviewVocab.ease_factor = Math.max(1.3, currentReviewVocab.ease_factor - 0.2);
                currentReviewVocab.status = "learning";
            }

            const nextReviewDate = new Date();
            nextReviewDate.setDate(nextReviewDate.getDate() + currentReviewVocab.interval);
            currentReviewVocab.last_reviewed = new Date().toISOString();
            currentReviewVocab.next_review = nextReviewDate.toISOString();

            try {
                await state.updateVocabulary(currentReviewVocab);
                reviewQueue.shift();
                if (!isCorrect) reviewQueue.push(currentReviewVocab);

                setTimeout(() => {
                    isProcessing = false;
                    renderNextCard();
                }, 1800);
            } catch (error) {
                alert("Có lỗi khi lưu trạng thái ôn tập.");
                isProcessing = false;
            }
        }

        const onSubmitClick = () => processAnswer();
        const onEnter = (e) => { if (e.key === "Enter") { e.preventDefault(); processAnswer(); } };
        const onExit = () => viewManager.back();
        const onEmptyBack = () => viewManager.back();

        btnSubmit.addEventListener("click", onSubmitClick);
        elAnswerInput.addEventListener("keypress", onEnter);
        document.getElementById("rv-exit").addEventListener("click", onExit);
        document.getElementById("rv-back-btn").addEventListener("click", onEmptyBack);

        cleanupFns.push(
            () => btnSubmit.removeEventListener("click", onSubmitClick),
            () => elAnswerInput.removeEventListener("keypress", onEnter),
            () => document.getElementById("rv-exit")?.removeEventListener("click", onExit),
            () => document.getElementById("rv-back-btn")?.removeEventListener("click", onEmptyBack)
        );

        buildReviewQueue();
    },

    destroy() {
        cleanupFns.forEach(fn => fn());
        cleanupFns = [];
    }
};
