// ============================================
// Flashcard Page Logic — Sumary Japanese
// Hỗ trợ: Từ vựng, Kanji, Ngữ pháp
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // --- State ---
    let allData = [];
    let cards = [];
    let currentIndex = 0;
    let knownCount = 0;
    let unknownCount = 0;
    let knownSet = new Set();
    let unknownSet = new Set();
    let selectedType = 'vocab';
    let selectedLevel = 'all';
    let selectedLesson = 'all';

    // --- DOM ---
    const configEl = document.getElementById('flashcard-config');
    const progressEl = document.getElementById('flashcard-progress');
    const areaEl = document.getElementById('flashcard-area');
    const emptyEl = document.getElementById('flashcard-empty');
    const completeEl = document.getElementById('flashcard-complete');

    const cardInner = document.getElementById('fc-card-inner');
    const frontLabel = document.getElementById('fc-front-label');
    const frontMain = document.getElementById('fc-front-main');
    const frontSub = document.getElementById('fc-front-sub');
    const frontTts = document.getElementById('fc-front-tts');
    const backLabel = document.getElementById('fc-back-label');
    const backMain = document.getElementById('fc-back-main');
    const backSub = document.getElementById('fc-back-sub');

    const counterEl = document.getElementById('fc-counter');
    const scoreEl = document.getElementById('fc-score');
    const progressFill = document.getElementById('fc-progress-fill');

    const prevBtn = document.getElementById('fc-prev-btn');
    const nextBtn = document.getElementById('fc-next-btn');
    const knownBtn = document.getElementById('fc-known-btn');
    const unknownBtn = document.getElementById('fc-unknown-btn');
    const startBtn = document.getElementById('fc-start-btn');
    const shuffleBtn = document.getElementById('fc-shuffle-btn');
    const restartBtn = document.getElementById('fc-restart-btn');
    const reviewUnknownBtn = document.getElementById('fc-review-unknown-btn');

    // --- Custom Dropdown Helper ---
    function initCustomDropdown(container, onChange) {
        if (!container) return;
        const btn = container.querySelector('.custom-dropdown-btn');
        const list = container.querySelector('.custom-dropdown-list');
        const label = btn.querySelector('.label');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown-list.show').forEach(l => {
                if (l !== list) {
                    l.classList.remove('show');
                    l.closest('.custom-dropdown').querySelector('.custom-dropdown-btn').classList.remove('open');
                }
            });
            list.classList.toggle('show');
            btn.classList.toggle('open');
        });

        list.addEventListener('click', (e) => {
            const item = e.target.closest('.custom-dropdown-item');
            if (!item) return;
            list.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            label.textContent = item.textContent;
            list.classList.remove('show');
            btn.classList.remove('open');
            onChange(item.dataset.value);
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown-list.show').forEach(l => {
            l.classList.remove('show');
            l.closest('.custom-dropdown').querySelector('.custom-dropdown-btn').classList.remove('open');
        });
    });

    // --- Init dropdowns ---
    initCustomDropdown(document.getElementById('fc-type-dropdown'), async (val) => {
        selectedType = val;
        await loadData();
        populateLessons();
    });

    initCustomDropdown(document.getElementById('fc-level-dropdown'), (val) => {
        selectedLevel = val;
    });

    initCustomDropdown(document.getElementById('fc-lesson-dropdown'), (val) => {
        selectedLesson = val;
    });

    // --- Load data ---
    async function loadData() {
        try {
            if (selectedType === 'vocab') {
                allData = await api.getAllVocabulary();
            } else if (selectedType === 'kanji') {
                allData = await api.getAllKanji();
            } else if (selectedType === 'grammar') {
                allData = await api.getAllGrammar();
            }
        } catch (e) {
            console.warn('Flashcard: Không thể tải data:', e);
            allData = [];
        }
    }

    function populateLessons() {
        const dropdown = document.getElementById('fc-lesson-dropdown');
        if (!dropdown || allData.length === 0) return;
        const list = dropdown.querySelector('.custom-dropdown-list');
        const label = dropdown.querySelector('.label');

        // Reset
        list.innerHTML = '<div class="custom-dropdown-item active" data-value="all">Tất cả bài</div>';
        label.textContent = 'Tất cả bài';
        selectedLesson = 'all';

        const lessons = [...new Set(allData.map(d => d.lesson).filter(Boolean))].sort((a, b) => {
            const nA = parseInt(a); const nB = parseInt(b);
            if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
            return String(a).localeCompare(String(b));
        });

        lessons.forEach(l => {
            const item = document.createElement('div');
            item.className = 'custom-dropdown-item';
            item.dataset.value = l;
            item.textContent = `Bài ${l}`;
            list.appendChild(item);
        });
    }

    // --- Start ---
    startBtn.addEventListener('click', async () => {
        if (allData.length === 0) await loadData();

        cards = allData.filter(d => {
            if (selectedLevel !== 'all' && d.level !== selectedLevel) return false;
            if (selectedLesson !== 'all' && String(d.lesson) !== selectedLesson) return false;
            return true;
        });

        if (cards.length === 0) {
            alert('Không có thẻ nào phù hợp. Vui lòng chọn lại.');
            return;
        }

        // Shuffle by default
        cards = utils.shuffle([...cards]);
        startSession();
    });

    shuffleBtn.addEventListener('click', () => {
        if (cards.length > 0) {
            cards = utils.shuffle([...cards]);
            currentIndex = 0;
            renderCard();
            updateProgress();
        }
    });

    function startSession() {
        currentIndex = 0;
        knownCount = 0;
        unknownCount = 0;
        knownSet = new Set();
        unknownSet = new Set();

        emptyEl.classList.add('hidden');
        completeEl.classList.add('hidden');
        areaEl.classList.remove('hidden');
        progressEl.classList.remove('hidden');

        renderCard();
        updateProgress();
    }

    // --- Render Card ---
    function renderCard() {
        if (currentIndex >= cards.length) {
            showComplete();
            return;
        }

        const card = cards[currentIndex];
        cardInner.classList.remove('flipped');

        if (selectedType === 'vocab') {
            frontLabel.textContent = 'Tiếng Nhật';
            frontMain.textContent = card.japanese || '';
            frontSub.textContent = card.hiragana || '';
            frontTts.classList.remove('hidden');
            backLabel.textContent = 'Nghĩa';
            backMain.textContent = card.meaning || '';
            backSub.textContent = card.type || '';
        } else if (selectedType === 'kanji') {
            frontLabel.textContent = 'Kanji';
            frontMain.textContent = card.character || '';
            frontSub.textContent = `${card.onyomi || ''} / ${card.kunyomi || ''}`;
            frontTts.classList.add('hidden');
            backLabel.textContent = 'Nghĩa';
            backMain.textContent = card.meaning || '';
            backSub.textContent = card.example_words ? card.example_words.split('、').slice(0, 3).join('、') : '';
        } else if (selectedType === 'grammar') {
            frontLabel.textContent = 'Ngữ Pháp';
            frontMain.textContent = card.pattern || '';
            frontMain.style.fontSize = '2rem';
            frontSub.textContent = card.example_ja || '';
            frontTts.classList.add('hidden');
            backLabel.textContent = 'Nghĩa';
            backMain.textContent = card.meaning || '';
            backSub.textContent = card.example_vi || '';
        }

        // Style based on known/unknown
        const container = document.querySelector('.flashcard-container');
        container.style.opacity = '0';
        container.style.transform = 'translateX(20px)';
        requestAnimationFrame(() => {
            container.style.transition = 'opacity 0.3s, transform 0.3s';
            container.style.opacity = '1';
            container.style.transform = 'translateX(0)';
        });
    }

    function updateProgress() {
        const total = cards.length;
        counterEl.textContent = `${currentIndex + 1} / ${total}`;
        scoreEl.textContent = `Biết: ${knownCount} | Chưa biết: ${unknownCount}`;
        const pct = total > 0 ? ((currentIndex) / total * 100) : 0;
        progressFill.style.width = `${pct}%`;
    }

    function showComplete() {
        areaEl.classList.add('hidden');
        progressEl.classList.add('hidden');
        completeEl.classList.remove('hidden');

        document.getElementById('fc-final-known').textContent = knownCount;
        document.getElementById('fc-final-unknown').textContent = unknownCount;
        document.getElementById('fc-final-total').textContent = cards.length;

        // Gamification
        if (typeof gamification !== 'undefined') {
            gamification.trackEvent('flashcard_complete');
            if (selectedType === 'vocab') gamification.trackEvent('vocab_review', { count: knownCount });
            if (selectedType === 'kanji') gamification.trackEvent('kanji_review', { count: knownCount });
        }
    }

    // --- Actions ---
    function flipCard() {
        cardInner.classList.toggle('flipped');
        if (typeof gamification !== 'undefined') gamification.trackEvent('flashcard_flip');
    }

    function markKnown() {
        const card = cards[currentIndex];
        if (card && !knownSet.has(card.id)) {
            knownSet.add(card.id);
            unknownSet.delete(card.id);
            knownCount = knownSet.size;
            unknownCount = unknownSet.size;
        }
        goNext();
    }

    function markUnknown() {
        const card = cards[currentIndex];
        if (card && !unknownSet.has(card.id)) {
            unknownSet.add(card.id);
            knownSet.delete(card.id);
            knownCount = knownSet.size;
            unknownCount = unknownSet.size;
        }
        goNext();
    }

    function goNext() {
        if (currentIndex < cards.length - 1) {
            currentIndex++;
            renderCard();
            updateProgress();
        } else {
            currentIndex = cards.length;
            updateProgress();
            showComplete();
        }
    }

    function goPrev() {
        if (currentIndex > 0) {
            currentIndex--;
            renderCard();
            updateProgress();
        }
    }

    // --- Events ---
    document.getElementById('fc-card').addEventListener('click', flipCard);
    knownBtn.addEventListener('click', markKnown);
    unknownBtn.addEventListener('click', markUnknown);
    nextBtn.addEventListener('click', goNext);
    prevBtn.addEventListener('click', goPrev);

    frontTts.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = cards[currentIndex];
        if (card && selectedType === 'vocab') {
            tts.speak(card.japanese || card.hiragana || '');
        }
    });

    restartBtn.addEventListener('click', startSession);

    reviewUnknownBtn.addEventListener('click', () => {
        const unknownCards = cards.filter(c => unknownSet.has(c.id));
        if (unknownCards.length === 0) {
            alert('Không có từ nào cần ôn lại!');
            return;
        }
        cards = utils.shuffle([...unknownCards]);
        startSession();
    });

    // --- Keyboard shortcuts ---
    document.addEventListener('keydown', (e) => {
        if (areaEl.classList.contains('hidden')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                flipCard();
                break;
            case 'ArrowLeft':
                goPrev();
                break;
            case 'ArrowRight':
                goNext();
                break;
            case '1':
                markUnknown();
                break;
            case '2':
                markKnown();
                break;
        }
    });

    // --- Init ---
    await loadData();
    populateLessons();
    auth.updateSidebarUser();
});
