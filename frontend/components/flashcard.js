import { state } from "../state.js";
import { tts } from "./tts.js";
import { viewManager } from "./viewManager.js";

let cleanupFns = [];

export const flashcardView = {
    init(params = {}) {
        const { lesson, level } = params;

        const emptyState = document.getElementById("fc-empty-state");
        const container = document.getElementById("fc-card-container");
        const controls = document.getElementById("fc-controls");
        const progressEl = document.getElementById("fc-progress");
        const headerTitle = document.getElementById("fc-header-title");

        cleanupFns = [];

        if (!lesson || !level) {
            showEmpty("Vui lòng chọn bài học từ trang chủ trước.");
            return;
        }

        headerTitle.textContent = `Bài ${lesson} - ${level}`;

        const rawVocabularies = state.getVocabularyByLesson(level, lesson);
        if (!rawVocabularies || rawVocabularies.length === 0) {
            showEmpty(`Bài học ${lesson} (${level}) hiện chưa có từ vựng nào.`);
            return;
        }

        let flashcards = [...rawVocabularies].sort(() => Math.random() - 0.5);
        let currentIndex = 0;
        let isFlipped = false;

        const innerCard = document.getElementById("fc-inner");
        const elJapanese = document.getElementById("fc-japanese");
        const elHiragana = document.getElementById("fc-hiragana");
        const elMeaning = document.getElementById("fc-meaning");
        const elType = document.getElementById("fc-type");

        function showEmpty(msg) {
            emptyState.classList.remove("hidden");
            container.classList.add("hidden");
            controls.classList.add("hidden");
            if (msg) emptyState.querySelector("p").textContent = msg;
        }

        function renderCard() {
            if (flashcards.length === 0) return;
            isFlipped = false;
            innerCard.classList.remove("rotate-y-180");
            const card = flashcards[currentIndex];
            elJapanese.textContent = card.japanese || card.hiragana;
            elHiragana.textContent = card.hiragana;
            elMeaning.textContent = card.meaning;
            elType.textContent = card.type || "Từ vựng";
            progressEl.textContent = `${currentIndex + 1} / ${flashcards.length}`;
        }

        function flipCard() {
            isFlipped = !isFlipped;
            innerCard.classList.toggle("rotate-y-180", isFlipped);
        }

        function nextCard() {
            if (currentIndex < flashcards.length - 1) {
                currentIndex++;
            } else {
                flashcards = [...rawVocabularies].sort(() => Math.random() - 0.5);
                currentIndex = 0;
            }
            innerCard.classList.remove("rotate-y-180");
            setTimeout(renderCard, 150);
        }

        function prevCard() {
            if (currentIndex > 0) {
                currentIndex--;
                innerCard.classList.remove("rotate-y-180");
                setTimeout(renderCard, 150);
            }
        }

        function onKeydown(e) {
            if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") {
                e.preventDefault();
                flipCard();
            } else if (e.code === "ArrowRight") {
                nextCard();
            } else if (e.code === "ArrowLeft") {
                prevCard();
            }
        }

        const onFlipInner = () => flipCard();
        const onFlipBtn = () => flipCard();
        const onNext = () => nextCard();
        const onPrev = () => prevCard();
        const onExit = () => viewManager.back();

        innerCard.addEventListener("click", onFlipInner);
        document.getElementById("fc-flip-btn").addEventListener("click", onFlipBtn);
        document.getElementById("fc-next").addEventListener("click", onNext);
        document.getElementById("fc-prev").addEventListener("click", onPrev);
        document.getElementById("fc-exit").addEventListener("click", onExit);
        document.addEventListener("keydown", onKeydown);

        cleanupFns.push(
            () => innerCard.removeEventListener("click", onFlipInner),
            () => document.getElementById("fc-flip-btn")?.removeEventListener("click", onFlipBtn),
            () => document.getElementById("fc-next")?.removeEventListener("click", onNext),
            () => document.getElementById("fc-prev")?.removeEventListener("click", onPrev),
            () => document.getElementById("fc-exit")?.removeEventListener("click", onExit),
            () => document.removeEventListener("keydown", onKeydown)
        );

        emptyState.classList.add("hidden");
        container.classList.remove("hidden");
        controls.classList.remove("hidden");
        renderCard();
        tts.initContextMenu();
    },

    destroy() {
        cleanupFns.forEach(fn => fn());
        cleanupFns = [];
    }
};
