import { state } from "../state.js";
import { tts } from "./tts.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Parse URL to get lesson and level
    const urlParams = new URLSearchParams(window.location.search);
    const lesson = urlParams.get('lesson');
    const level = urlParams.get('level');

    const emptyState = document.getElementById("empty-state");
    const container = document.getElementById("flashcard-container");
    const controls = document.getElementById("flashcard-controls");
    const progressEl = document.getElementById("card-progress");
    const headerTitle = document.getElementById("header-lesson-title");

    if (!lesson || !level) {
        showEmptyState("Vui lòng chọn bài học từ trang chủ trước.");
        return;
    }

    headerTitle.textContent = `Bài ${lesson} - ${level}`;

    // 2. Load data
    try {
        await state.loadFromServer();
    } catch (e) {
        showEmptyState("Lỗi kết nối máy chủ dữ liệu.");
        return;
    }

    // 3. Setup Flashcards Array
    const rawVocabularies = state.getVocabularyByLesson(level, lesson);
    if (!rawVocabularies || rawVocabularies.length === 0) {
        showEmptyState(`Bài học ${lesson} (${level}) hiện chưa có từ vựng nào.`);
        return;
    }

    // Shuffle array for randomness
    let flashcards = [...rawVocabularies].sort(() => Math.random() - 0.5);
    let currentIndex = 0;
    let isFlipped = false;

    // DOM Elements
    const innerCard = document.getElementById("flashcard-inner");
    const elJapanese = document.getElementById("flashcard-japanese");
    const elHiragana = document.getElementById("flashcard-hiragana");
    const elMeaning = document.getElementById("flashcard-meaning");
    const elType = document.getElementById("flashcard-type");

    function showEmptyState(msg) {
        emptyState.classList.remove("hidden");
        container.classList.add("hidden");
        controls.classList.add("hidden");
        if (msg) emptyState.querySelector('p').textContent = msg;
    }

    function initUI() {
        emptyState.classList.add("hidden");
        emptyState.classList.add("hidden");
        container.classList.remove("hidden");
        controls.classList.remove("hidden");
        renderCard();
        tts.initContextMenu();
    }

    function renderCard() {
        if (flashcards.length === 0) return;

        isFlipped = false;
        innerCard.classList.remove("rotate-y-180");

        const card = flashcards[currentIndex];
        // Front
        elJapanese.textContent = card.japanese || card.hiragana;
        // Back
        elHiragana.textContent = card.hiragana;
        elMeaning.textContent = card.meaning;
        elType.textContent = card.type || "Từ vựng";

        // Progress
        progressEl.textContent = `${currentIndex + 1} / ${flashcards.length}`;
    }

    function flipCard() {
        isFlipped = !isFlipped;
        if (isFlipped) {
            innerCard.classList.add("rotate-y-180");
        } else {
            innerCard.classList.remove("rotate-y-180");
        }
    }

    function nextCard() {
        if (currentIndex < flashcards.length - 1) {
            currentIndex++;
            innerCard.classList.remove("rotate-y-180");
            setTimeout(renderCard, 150); // slight delay to let flip animation start
        } else {
            // Loop back to start but reshuffle
            flashcards = [...rawVocabularies].sort(() => Math.random() - 0.5);
            currentIndex = 0;
            innerCard.classList.remove("rotate-y-180");
            setTimeout(renderCard, 150);
        }
    }

    function prevCard() {
        if (currentIndex > 0) {
            currentIndex--;
            innerCard.classList.remove("rotate-y-180");
            setTimeout(renderCard, 150);
        }
    }

    // Event Listeners
    innerCard.addEventListener("click", flipCard);
    document.getElementById("flip-btn-control").addEventListener("click", flipCard);

    document.getElementById("next-card").addEventListener("click", nextCard);
    document.getElementById("prev-card").addEventListener("click", prevCard);

    document.getElementById("exit-flashcard").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    // Keyboard support
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") {
            e.preventDefault();
            flipCard();
        } else if (e.code === "ArrowRight") {
            nextCard();
        } else if (e.code === "ArrowLeft") {
            prevCard();
        }
    });

    // Start
    initUI();
});
