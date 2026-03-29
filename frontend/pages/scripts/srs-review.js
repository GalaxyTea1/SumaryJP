// ============================================
// SRS Review Logic — Sumary Japanese
// Spaced Repetition System (SM-2 simplified)
// Dùng localStorage cho SRS state
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    const SRS_KEY = 'sumary_srs_data';

    // --- SRS State ---
    let srsData = loadSrsData();
    let reviewQueue = [];
    let currentIndex = 0;
    let reviewedToday = 0;
    let goodCount = 0;
    let forgotCount = 0;

    // --- Load all items ---
    let allVocab = [];
    let allKanji = [];
    let allGrammar = [];

    try {
        [allVocab, allKanji, allGrammar] = await Promise.all([
            api.getAllVocabulary(),
            api.getAllKanji(),
            api.getAllGrammar(),
        ]);
    } catch (e) {
        console.warn('SRS: Không thể tải data:', e);
    }

    // --- SRS Data Management (localStorage) ---
    function loadSrsData() {
        return JSON.parse(localStorage.getItem(SRS_KEY) || '{}');
    }

    function saveSrsData() {
        localStorage.setItem(SRS_KEY, JSON.stringify(srsData));
    }

    function getSrsItem(type, id) {
        const key = `${type}_${id}`;
        if (!srsData[key]) {
            srsData[key] = {
                interval: 0,       // Ngày giữa 2 lần ôn
                repetitions: 0,   // Số lần ôn đúng liên tiếp
                easeFactor: 2.5,  // Hệ số dễ
                nextReview: Date.now(), // Thời điểm cần ôn
                lastReview: null,
            };
        }
        return srsData[key];
    }

    // SM-2 Algorithm (simplified)
    function updateSrs(type, id, quality) {
        // quality: 1=Again, 2=Hard, 3=Good, 4=Easy
        const item = getSrsItem(type, id);
        item.lastReview = Date.now();

        if (quality < 2) {
            // Quên → reset
            item.repetitions = 0;
            item.interval = 0;
            item.nextReview = Date.now() + 60 * 1000; // 1 phút
        } else {
            item.repetitions++;
            if (item.repetitions === 1) {
                item.interval = 1; // 1 ngày
            } else if (item.repetitions === 2) {
                item.interval = 3; // 3 ngày
            } else {
                item.interval = Math.round(item.interval * item.easeFactor);
            }

            // Điều chỉnh ease factor
            item.easeFactor += (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02));
            if (item.easeFactor < 1.3) item.easeFactor = 1.3;

            const msPerDay = 24 * 60 * 60 * 1000;
            item.nextReview = Date.now() + item.interval * msPerDay;
        }

        saveSrsData();
    }

    // --- Build review queue ---
    function buildQueue() {
        const now = Date.now();
        const queue = [];

        allVocab.forEach(v => {
            const srs = getSrsItem('vocab', v.id);
            if (srs.nextReview <= now) {
                queue.push({ type: 'vocab', data: v, srs });
            }
        });

        allKanji.forEach(k => {
            const srs = getSrsItem('kanji', k.id);
            if (srs.nextReview <= now) {
                queue.push({ type: 'kanji', data: k, srs });
            }
        });

        allGrammar.forEach(g => {
            const srs = getSrsItem('grammar', g.id);
            if (srs.nextReview <= now) {
                queue.push({ type: 'grammar', data: g, srs });
            }
        });

        // Sort: shortest interval first (due soonest)
        queue.sort((a, b) => a.srs.interval - b.srs.interval);

        return queue;
    }

    // --- DOM ---
    const overviewEl = document.getElementById('srs-overview');
    const startSection = document.getElementById('srs-start-section');
    const reviewArea = document.getElementById('srs-review-area');
    const completeEl = document.getElementById('srs-complete');
    const cardInner = document.getElementById('srs-card-inner');
    const ratingButtons = document.getElementById('srs-rating-buttons');
    const counterEl = document.getElementById('srs-counter');
    const typeBadge = document.getElementById('srs-type-badge');
    const progressFill = document.getElementById('srs-progress-fill');

    // --- Update overview ---
    function updateOverview() {
        const now = Date.now();
        let dueCount = 0, learningCount = 0, masteredCount = 0;

        const allItems = [
            ...allVocab.map(v => ({ type: 'vocab', id: v.id })),
            ...allKanji.map(k => ({ type: 'kanji', id: k.id })),
            ...allGrammar.map(g => ({ type: 'grammar', id: g.id })),
        ];

        allItems.forEach(({ type, id }) => {
            const srs = getSrsItem(type, id);
            if (srs.nextReview <= now) dueCount++;
            if (srs.repetitions > 0 && srs.interval < 7) learningCount++;
            if (srs.interval >= 7) masteredCount++;
        });

        document.getElementById('srs-due-count').textContent = dueCount;
        document.getElementById('srs-learning-count').textContent = learningCount;
        document.getElementById('srs-reviewed-count').textContent = reviewedToday;
        document.getElementById('srs-mastered-count').textContent = masteredCount;
        document.getElementById('srs-due-text').textContent = dueCount;

        saveSrsData();
    }

    // --- Start review ---
    document.getElementById('srs-start-btn').addEventListener('click', () => {
        reviewQueue = buildQueue();
        if (reviewQueue.length === 0) {
            alert('Không có thẻ nào cần ôn hôm nay! 🎉');
            return;
        }

        currentIndex = 0;
        goodCount = 0;
        forgotCount = 0;

        startSection.classList.add('hidden');
        reviewArea.classList.remove('hidden');
        completeEl.classList.add('hidden');

        renderCard();
        updateProgress();
    });

    // --- Render card ---
    function renderCard() {
        if (currentIndex >= reviewQueue.length) {
            showComplete();
            return;
        }

        const item = reviewQueue[currentIndex];
        const d = item.data;
        cardInner.classList.remove('flipped');
        ratingButtons.classList.add('hidden');

        const typeLabels = { vocab: 'Từ vựng', kanji: 'Kanji', grammar: 'Ngữ pháp' };
        typeBadge.textContent = typeLabels[item.type] || item.type;

        if (item.type === 'vocab') {
            document.getElementById('srs-front-label').textContent = 'Tiếng Nhật';
            document.getElementById('srs-front-main').textContent = d.japanese || '';
            document.getElementById('srs-front-sub').textContent = d.hiragana || '';
            document.getElementById('srs-back-label').textContent = 'Nghĩa';
            document.getElementById('srs-back-main').textContent = d.meaning || '';
            document.getElementById('srs-back-sub').textContent = d.type || '';
        } else if (item.type === 'kanji') {
            document.getElementById('srs-front-label').textContent = 'Kanji';
            document.getElementById('srs-front-main').textContent = d.character || '';
            document.getElementById('srs-front-sub').textContent = `${d.onyomi || ''} / ${d.kunyomi || ''}`;
            document.getElementById('srs-back-label').textContent = 'Nghĩa';
            document.getElementById('srs-back-main').textContent = d.meaning || '';
            document.getElementById('srs-back-sub').textContent = '';
        } else if (item.type === 'grammar') {
            document.getElementById('srs-front-label').textContent = 'Ngữ pháp';
            document.getElementById('srs-front-main').textContent = d.pattern || '';
            document.getElementById('srs-front-sub').textContent = d.example_ja || '';
            document.getElementById('srs-back-label').textContent = 'Nghĩa';
            document.getElementById('srs-back-main').textContent = d.meaning || '';
            document.getElementById('srs-back-sub').textContent = d.example_vi || '';
        }
    }

    function updateProgress() {
        counterEl.textContent = `${currentIndex + 1} / ${reviewQueue.length}`;
        const pct = reviewQueue.length > 0 ? (currentIndex / reviewQueue.length * 100) : 0;
        progressFill.style.width = `${pct}%`;
    }

    // --- Flip ---
    function flipCard() {
        cardInner.classList.toggle('flipped');
        if (cardInner.classList.contains('flipped')) {
            ratingButtons.classList.remove('hidden');
        }
    }

    document.getElementById('srs-card').addEventListener('click', flipCard);

    // --- Rating ---
    ratingButtons.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const quality = parseInt(btn.dataset.rating);
            const item = reviewQueue[currentIndex];

            updateSrs(item.type, item.data.id, quality);
            reviewedToday++;

            if (quality >= 3) {
                goodCount++;
                if (typeof gamification !== 'undefined') gamification.trackEvent('srs_card_good');
            }
            else forgotCount++;

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

        // Gamification
        if (typeof gamification !== 'undefined') {
            gamification.trackEvent('srs_session');
            gamification.trackEvent('vocab_review', { count: goodCount });
        }
    }

    document.getElementById('srs-done-btn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // --- Keyboard ---
    document.addEventListener('keydown', (e) => {
        if (reviewArea.classList.contains('hidden')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            flipCard();
        } else if (['1', '2', '3', '4'].includes(e.key) && cardInner.classList.contains('flipped')) {
            const btn = ratingButtons.querySelector(`[data-rating="${e.key}"]`);
            if (btn) btn.click();
        }
    });

    // --- Init ---
    updateOverview();
    auth.updateSidebarUser();
});
