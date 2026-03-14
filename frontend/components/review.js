import { state } from "../state.js";
import { tts } from "./tts.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Parse URL to get optional lesson and level (if reviewing specific lesson, though typically review is all due items)
    const urlParams = new URLSearchParams(window.location.search);
    const lessonParam = urlParams.get('lesson');
    const levelParam = urlParams.get('level');

    const emptyState = document.getElementById("empty-state");
    const container = document.getElementById("review-container");
    const progressEl = document.getElementById("review-progress");
    const emptyTitle = document.getElementById("empty-title");
    const emptyDesc = document.getElementById("empty-desc");

    let reviewQueue = [];
    let currentReviewVocab = null;
    let isProcessing = false;

    // DOM Elements
    const elWord = document.getElementById("review-word");
    const elHint = document.getElementById("review-hint");
    const elAnswerInput = document.getElementById("review-answer");
    const elResult = document.getElementById("review-result");
    const btnSubmit = document.getElementById("submit-answer");

    function showEmptyState(title, desc) {
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

    async function initializeReviewQueue() {
        try {
            await state.loadFromServer();
            tts.initContextMenu();

            const now = new Date();
            reviewQueue = [];

            Object.entries(state.lessons).forEach(([level, lessons]) => {
                // If a specific level is requested, we can filter, but let's just do global review
                Object.entries(lessons).forEach(([lesson, vocabularies]) => {
                    vocabularies.forEach((vocab) => {
                        // Data Initialization if missing
                        if (vocab.interval === undefined) vocab.interval = 0;
                        if (vocab.ease_factor === undefined) vocab.ease_factor = 2.5;
                        if (!vocab.next_review) vocab.next_review = now.toISOString();

                        // Queue if next_review is past or today
                        const nextReviewDate = new Date(vocab.next_review);
                        if (nextReviewDate <= now && vocab.status !== "mastered") {
                            // Filter by requested lesson if provided
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

            // Sort by next review date (oldest first)
            reviewQueue.sort((a, b) => new Date(a.next_review) - new Date(b.next_review));

            if (reviewQueue.length === 0) {
                showEmptyState("Tuyệt vời!", "Không có hoặc đã hết từ vựng cần ôn tập lúc này.");
            } else {
                initUI();
            }

        } catch (e) {
            showEmptyState("Lỗi", "Không thể tải dữ liệu từ máy chủ.");
        }
    }

    function renderNextCard() {
        if (reviewQueue.length === 0) {
            showEmptyState("Hoàn thành!", "Bạn đã ôn tập xong tất cả từ vựng hôm nay.");
            return;
        }

        currentReviewVocab = reviewQueue[0];
        elWord.textContent = currentReviewVocab.japanese;
        elHint.textContent = currentReviewVocab.hiragana;
        elAnswerInput.value = "";
        elAnswerInput.focus();

        progressEl.textContent = `Còn lại: ${reviewQueue.length}`;

        // Reset Result visually
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
        // Allow slightly loose matching or exact
        // A robust app might use string similarity, but we'll stick to exact match or contains.
        // Let's use includes for a tiny bit of leniency (e.g. they typed part of the meaning)
        const isCorrect = correctAnswer.includes(answer) || answer.includes(correctAnswer);

        // UI Feedback
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

        // SM-2 Logic Calculations
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

            if (currentReviewVocab.interval >= 21) {
                currentReviewVocab.status = "mastered";
            } else {
                currentReviewVocab.status = "learning";
            }
        } else {
            // Failed
            currentReviewVocab.review_count = 0;
            currentReviewVocab.interval = 1;
            currentReviewVocab.ease_factor = Math.max(1.3, currentReviewVocab.ease_factor - 0.2);
            currentReviewVocab.status = "learning"; // Downgrade to learning if they failed
        }

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + currentReviewVocab.interval);

        currentReviewVocab.last_reviewed = new Date().toISOString();
        currentReviewVocab.next_review = nextReviewDate.toISOString();

        try {
            // Background update to server
            // Don't await fully to avoid blocking UI for too long, just fire and forget or await briefly
            await state.updateVocabulary(currentReviewVocab);

            // Queue Management
            reviewQueue.shift(); // Remove from front
            // If failed, typical SRS pushes it to the back of the queue for later in the session
            // if you want strict SM-2. Original code did this unconditionally actually.
            // Let's only push to back if failed (so they see it again today)
            if (!isCorrect) {
                reviewQueue.push(currentReviewVocab);
            }

            // Wait 1.5s then show next
            setTimeout(() => {
                isProcessing = false;
                renderNextCard();
            }, 1800);

        } catch (error) {
            alert("Có lỗi khi lưu trạng thái ôn tập.");
            isProcessing = false;
        }
    }

    // Event Listeners
    btnSubmit.addEventListener("click", processAnswer);
    elAnswerInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            processAnswer();
        }
    });

    document.getElementById("exit-review").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    // Start
    initializeReviewQueue();
});
