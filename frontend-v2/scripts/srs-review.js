// ============================================
// SRS Review Logic - Sumary Japanese
// Online-only spaced repetition review
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.requireAuth()) return;

    let srsData = {};
    let reviewQueue = [];
    let currentIndex = 0;
    let reviewedToday = 0;
    let goodCount = 0;
    let goodVocabCount = 0;
    let forgotCount = 0;

    let allVocab = [];
    let allKanji = [];
    let allGrammar = [];

    try {
        const [vocabData, kanjiData, grammarData, srsProgress] = await Promise.all([
            api.getAllVocabulary(),
            api.getAllKanji(),
            api.getAllGrammar(),
            api.getSrsProgress(),
        ]);
        allVocab = vocabData || [];
        allKanji = kanjiData || [];
        allGrammar = grammarData || [];
        srsData = buildSrsMap(srsProgress);
    } catch (error) {
        console.warn('SRS: could not load data:', error);
        alert('Khong the tai du lieu SRS. Vui long kiem tra ket noi va thu lai.');
        window.location.href = 'dashboard.html';
        return;
    }

    function getSrsKey(type, id) {
        return `${type}_${id}`;
    }

    function buildSrsMap(progressItems) {
        return (progressItems || []).reduce((map, item) => {
            map[getSrsKey(item.itemType, item.itemId)] = item;
            return map;
        }, {});
    }

    function getSrsItem(type, id) {
        const key = getSrsKey(type, id);
        if (!srsData[key]) {
            srsData[key] = {
                itemType: type,
                itemId: id,
                interval: 0,
                repetitions: 0,
                easeFactor: 2.5,
                nextReview: new Date(0).toISOString(),
                lastReview: null,
            };
        }
        return srsData[key];
    }

    function getReviewTime(srs) {
        return new Date(srs.nextReview).getTime();
    }

    async function updateSrs(type, id, quality) {
        const item = await api.reviewSrsItem(type, id, quality);
        srsData[getSrsKey(type, id)] = item;
        return item;
    }

    function buildQueue() {
        const now = Date.now();
        const queue = [];

        allVocab.forEach(vocab => {
            const srs = getSrsItem('vocab', vocab.id);
            if (getReviewTime(srs) <= now) queue.push({ type: 'vocab', data: vocab, srs });
        });

        allKanji.forEach(kanji => {
            const srs = getSrsItem('kanji', kanji.id);
            if (getReviewTime(srs) <= now) queue.push({ type: 'kanji', data: kanji, srs });
        });

        allGrammar.forEach(grammar => {
            const srs = getSrsItem('grammar', grammar.id);
            if (getReviewTime(srs) <= now) queue.push({ type: 'grammar', data: grammar, srs });
        });

        queue.sort((a, b) => a.srs.interval - b.srs.interval);
        return queue;
    }

    const startSection = document.getElementById('srs-start-section');
    const reviewArea = document.getElementById('srs-review-area');
    const completeEl = document.getElementById('srs-complete');
    const cardInner = document.getElementById('srs-card-inner');
    const ratingButtons = document.getElementById('srs-rating-buttons');
    const counterEl = document.getElementById('srs-counter');
    const typeBadge = document.getElementById('srs-type-badge');
    const progressFill = document.getElementById('srs-progress-fill');

    function updateOverview() {
        const now = Date.now();
        let dueCount = 0;
        let learningCount = 0;
        let masteredCount = 0;

        const allItems = [
            ...allVocab.map(vocab => ({ type: 'vocab', id: vocab.id })),
            ...allKanji.map(kanji => ({ type: 'kanji', id: kanji.id })),
            ...allGrammar.map(grammar => ({ type: 'grammar', id: grammar.id })),
        ];

        allItems.forEach(({ type, id }) => {
            const srs = getSrsItem(type, id);
            if (getReviewTime(srs) <= now) dueCount++;
            if (srs.repetitions > 0 && srs.interval < 7) learningCount++;
            if (srs.interval >= 7) masteredCount++;
        });

        document.getElementById('srs-due-count').textContent = dueCount;
        document.getElementById('srs-learning-count').textContent = learningCount;
        document.getElementById('srs-reviewed-count').textContent = reviewedToday;
        document.getElementById('srs-mastered-count').textContent = masteredCount;
        document.getElementById('srs-due-text').textContent = dueCount;
    }

    document.getElementById('srs-start-btn').addEventListener('click', () => {
        reviewQueue = buildQueue();
        if (reviewQueue.length === 0) {
            alert('Không có thẻ nào cần ôn hôm nay!');
            return;
        }

        currentIndex = 0;
        goodCount = 0;
        goodVocabCount = 0;
        forgotCount = 0;

        startSection.classList.add('hidden');
        reviewArea.classList.remove('hidden');
        completeEl.classList.add('hidden');

        renderCard();
        updateProgress();
    });

    function renderCard() {
        if (currentIndex >= reviewQueue.length) {
            showComplete();
            return;
        }

        const item = reviewQueue[currentIndex];
        const data = item.data;
        cardInner.classList.remove('flipped');
        ratingButtons.classList.add('hidden');

        const typeLabels = { vocab: 'Từ vựng', kanji: 'Kanji', grammar: 'Ngữ pháp' };
        typeBadge.textContent = typeLabels[item.type] || item.type;

        if (item.type === 'vocab') {
            document.getElementById('srs-front-label').textContent = 'Tiếng Nhật';
            document.getElementById('srs-front-main').textContent = data.japanese || '';
            document.getElementById('srs-front-sub').textContent = data.hiragana || '';
            document.getElementById('srs-back-label').textContent = 'Nghĩa';
            document.getElementById('srs-back-main').textContent = data.meaning || '';
            document.getElementById('srs-back-sub').textContent = data.type || '';
        } else if (item.type === 'kanji') {
            document.getElementById('srs-front-label').textContent = 'Kanji';
            document.getElementById('srs-front-main').textContent = data.character || '';
            document.getElementById('srs-front-sub').textContent = `${data.onyomi || ''} / ${data.kunyomi || ''}`;
            document.getElementById('srs-back-label').textContent = 'Nghĩa';
            document.getElementById('srs-back-main').textContent = data.meaning || '';
            document.getElementById('srs-back-sub').textContent = '';
        } else if (item.type === 'grammar') {
            document.getElementById('srs-front-label').textContent = 'Ngữ pháp';
            document.getElementById('srs-front-main').textContent = data.pattern || '';
            document.getElementById('srs-front-sub').textContent = data.example_ja || '';
            document.getElementById('srs-back-label').textContent = 'Nghĩa';
            document.getElementById('srs-back-main').textContent = data.meaning || '';
            document.getElementById('srs-back-sub').textContent = data.example_vi || '';
        }
    }

    function updateProgress() {
        counterEl.textContent = `${currentIndex + 1} / ${reviewQueue.length}`;
        const pct = reviewQueue.length > 0 ? (currentIndex / reviewQueue.length * 100) : 0;
        progressFill.style.width = `${pct}%`;
    }

    function flipCard() {
        cardInner.classList.toggle('flipped');
        if (cardInner.classList.contains('flipped')) {
            ratingButtons.classList.remove('hidden');
        }
    }

    document.getElementById('srs-card').addEventListener('click', flipCard);

    ratingButtons.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const quality = parseInt(btn.dataset.rating, 10);
            const item = reviewQueue[currentIndex];

            ratingButtons.querySelectorAll('.rating-btn').forEach(button => button.disabled = true);
            try {
                await updateSrs(item.type, item.data.id, quality);
            } catch (error) {
                console.error('SRS review save failed:', error);
                alert('Khong the luu ket qua on tap. Vui long thu lai.');
                ratingButtons.querySelectorAll('.rating-btn').forEach(button => button.disabled = false);
                return;
            }
            ratingButtons.querySelectorAll('.rating-btn').forEach(button => button.disabled = false);

            reviewedToday++;
            if (quality >= 3) {
                goodCount++;
                if (item.type === 'vocab') goodVocabCount++;
                if (typeof gamification !== 'undefined') gamification.trackEvent('srs_card_good').catch(() => null);
            } else {
                forgotCount++;
            }

            currentIndex++;
            updateOverview();

            if (currentIndex >= reviewQueue.length) {
                showComplete();
            } else {
                renderCard();
                updateProgress();
            }
        });
    });

    function showComplete() {
        reviewArea.classList.add('hidden');
        completeEl.classList.remove('hidden');
        document.getElementById('srs-final-total').textContent = reviewQueue.length;
        document.getElementById('srs-final-good').textContent = goodCount;
        document.getElementById('srs-final-forgot').textContent = forgotCount;

        if (typeof gamification !== 'undefined') {
            gamification.trackEvent('srs_session').catch(() => null);
            if (goodVocabCount > 0) {
                gamification.trackEvent('vocab_review', { count: goodVocabCount }).catch(() => null);
            }
        }
    }

    document.getElementById('srs-done-btn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    document.addEventListener('keydown', (event) => {
        if (reviewArea.classList.contains('hidden')) return;
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            flipCard();
        } else if (['1', '2', '3', '4'].includes(event.key) && cardInner.classList.contains('flipped')) {
            const btn = ratingButtons.querySelector(`[data-rating="${event.key}"]`);
            if (btn) btn.click();
        }
    });

    updateOverview();
    auth.updateSidebarUser();
});
