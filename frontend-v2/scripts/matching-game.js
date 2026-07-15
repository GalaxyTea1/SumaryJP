// ============================================
// Card Matching Game - Sumary Japanese V2
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Require user authorization first
    if (typeof auth !== 'undefined' && !auth.requireAuth()) return;

    // --- GAME CONSTANTS & DATA ---
    const KANA_HIRAGANA = [
        ['あ', 'a', 'Mưa / Kẹo'], ['い', 'i', 'Con chó'], ['う', 'u', 'Biển'], ['え', 'e', 'Bút chì'], ['お', 'o', 'Trà'],
        ['か', 'ka', 'Cái ô'], ['き', 'ki', 'Vé'], ['く', 'ku', 'Xe ô tô'], ['け', 'ke', 'Cục tẩy'], ['こ', 'ko', 'Trẻ em'],
        ['さ', 'sa', 'Con cá'], ['し', 'shi', 'Muối'], ['す', 'su', 'Sushi'], ['せ', 'sen', 'Giáo viên'], ['そ', 'so', 'Bầu trời'],
        ['た', 'ta', 'Quả trứng'], ['ち', 'chi', 'Bản đồ'], ['つ', 'tsu', 'Cái bàn'], ['て', 'te', 'Lá thư'], ['と', 'to', 'Bạn bè'],
        ['な', 'na', 'Mùa hè'], ['に', 'ni', 'Nước Nhật'], ['ぬ', 'nu', 'Tranh tô màu'], ['ね', 'ne', 'Con mèo'], ['の', 'no', 'Đồ uống'],
        ['は', 'ha', 'Hoa / Mũi'], ['ひ', 'hi', 'Máy bay'], ['ふ', 'fu', 'Con thuyền'], ['へ', 'he', 'Căn phòng'], ['ho', 'ho', 'Quyển sách'],
        ['ま', 'ma', 'Thành phố'], ['み', 'mi', 'Nước'], ['む', 'mu', 'Côn trùng'], ['め', 'me', 'Mắt'], ['も', 'mo', 'Khu rừng'],
        ['や', 'ya', 'Rau củ'], ['ゆ', 'yu', 'Tuyết'], ['よ', 'yo', 'Ban đêm'],
        ['ら', 'ra', 'Tuần sau'], ['り', 'ri', 'Quả táo'], ['る', 'ru', 'Làm (suru)'], ['れ', 're', 'Luyện tập'], ['ろ', 'ro', 'Bồn tắm'],
        ['わ', 'wa', 'Tôi'], ['を', 'wo', 'Đọc sách'], ['ん', 'n', 'Nước Nhật']
    ];

    const KANA_KATAKANA = [
        ['ア', 'a', 'Mưa / Kẹo'], ['イ', 'i', 'Con chó'], ['ウ', 'u', 'Biển'], ['エ', 'e', 'Bút chì'], ['オ', 'o', 'Trà'],
        ['カ', 'ka', 'Cái ô'], ['キ', 'ki', 'Vé'], ['ク', 'ku', 'Xe ô tô'], ['ケ', 'ke', 'Cục tẩy'], ['コ', 'ko', 'Trẻ em'],
        ['サ', 'sa', 'Con cá'], ['シ', 'shi', 'Muối'], ['ス', 'su', 'Sushi'], ['セ', 'sen', 'Giáo viên'], ['ソ', 'so', 'Bầu trời'],
        ['タ', 'ta', 'Quả trứng'], ['チ', 'chi', 'Bản đồ'], ['ツ', 'tsu', 'Cái bàn'], ['テ', 'te', 'Lá thư'], ['ト', 'to', 'Bạn bè'],
        ['ナ', 'na', 'Mùa hè'], ['ニ', 'ni', 'Nước Nhật'], ['ヌ', 'nu', 'Tranh tô màu'], ['ネ', 'ne', 'Con mèo'], ['ノ', 'no', 'Đồ uống'],
        ['ハ', 'ha', 'Hoa / Mũi'], ['ヒ', 'hi', 'Máy bay'], ['フ', 'fu', 'Con thuyền'], ['ヘ', 'he', 'Căn phòng'], ['ホ', 'ho', 'Quyển sách'],
        ['マ', 'ma', 'Thành phố'], ['ミ', 'mi', 'Nước'], ['ム', 'mu', 'Côn trùng'], ['メ', 'me', 'Mắt'], ['モ', 'mo', 'Khu rừng'],
        ['ヤ', 'ya', 'Rau củ'], ['ユ', 'yu', 'Tuyết'], ['ヨ', 'yo', 'Ban đêm'],
        ['ラ', 'ra', 'Tuần sau'], ['リ', 'ri', 'Quả táo'], ['ル', 'ru', 'Làm (suru)'], ['レ', 're', 'Luyện tập'], ['ロ', 'ro', 'Bồn tắm'],
        ['ワ', 'wa', 'Tôi'], ['ヲ', 'wo', 'Đọc sách'], ['ン', 'n', 'Nước Nhật']
    ];

    // Fallback Kanji dataset if API call yields empty or fails
    const KANJI_FALLBACK = [
        { kanji: '一', reading: 'ichi', meaning: 'Một' },
        { kanji: '二', reading: 'ni', meaning: 'Hai' },
        { kanji: '三', reading: 'san', meaning: 'Ba' },
        { kanji: '四', reading: 'yon / shi', meaning: 'Bốn' },
        { kanji: '五', reading: 'go', meaning: 'Năm' },
        { kanji: '六', reading: 'roku', meaning: 'Sáu' },
        { kanji: '七', reading: 'nana / shichi', meaning: 'Bảy' },
        { kanji: '八', reading: 'hachi', meaning: 'Tám' },
        { kanji: '九', reading: 'kyuu / ku', meaning: 'Chín' },
        { kanji: '十', reading: 'juu', meaning: 'Mười' },
        { kanji: '日', reading: 'hi / nichi', meaning: 'Ngày / Mặt trời' },
        { kanji: '本', reading: 'hon', meaning: 'Sách / Nguồn gốc' },
        { kanji: '人', reading: 'hito / jin', meaning: 'Người' },
        { kanji: '水', reading: 'mizu / sui', meaning: 'Nước' },
        { kanji: '木', reading: 'ki / moku', meaning: 'Cây' },
        { kanji: '金', reading: 'kane / kin', meaning: 'Vàng / Tiền' }
    ];

    // --- DOM ELEMENTS ---
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const cardGrid = document.getElementById('card-grid');
    const startGameBtn = document.getElementById('start-game-btn');
    const quitGameBtn = document.getElementById('quit-game-btn');
    const gameTimer = document.getElementById('game-timer');
    const gameMoves = document.getElementById('game-moves');
    const gameProgress = document.getElementById('game-progress');
    const sessionXpText = document.getElementById('session-xp');
    const headerXpText = document.getElementById('header-xp-text');

    // Victory Modal elements
    const victoryModal = document.getElementById('victory-modal');
    const modalTime = document.getElementById('modal-time');
    const modalMoves = document.getElementById('modal-moves');
    const modalAccuracy = document.getElementById('modal-accuracy');
    const modalXpBreakdown = document.getElementById('modal-xp-breakdown');
    const modalXpTotal = document.getElementById('modal-xp-total');
    const modalReplayBtn = document.getElementById('modal-replay-btn');
    const modalSetupBtn = document.getElementById('modal-setup-btn');
    const confettiContainer = document.getElementById('confetti-container');

    // --- GAME STATE ---
    let gameConfig = {
        type: 'hiragana', // 'hiragana' | 'katakana' | 'kanji'
        mode: 'reading',  // 'reading'  | 'meaning'
        cardCount: 12     // 8 | 12 | 16 (equals to 4 | 6 | 8 pairs)
    };

    let cardsData = []; // Full deck generated for the game
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;
    let timerInterval = null;
    let totalSeconds = 0;
    let moves = 0;
    let matchesCount = 0;
    let sessionXpEarned = 0;
    let apiKanjiList = [];
    let apiVocabList = [];

    // --- INITIALIZE PAGE ---
    async function initPage() {
        setupConfigListeners();
        setupSidebarUserInfo();
        await fetchApiData();
    }

    // Update username, initial, and current XP on sidebar
    async function setupSidebarUserInfo() {
        try {
            if (typeof gamification !== 'undefined') {
                const stats = await gamification.init();
                const currentXp = stats.dailyXp || 0;
                headerXpText.textContent = `${currentXp} XP Hôm Nay`;

                if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
                    const me = await auth.getCurrentUser();
                    if (me) {
                        const sidebarName = document.getElementById('sidebar-user-name');
                        const sidebarInitial = document.getElementById('sidebar-user-initial');
                        const sidebarLevel = document.getElementById('sidebar-user-level');
                        
                        if (sidebarName) sidebarName.textContent = me.username;
                        if (sidebarInitial) sidebarInitial.textContent = me.username.substring(0, 2).toUpperCase();
                        
                        const lvl = gamification.getCurrentLevel(stats.xp);
                        if (sidebarLevel) sidebarLevel.textContent = `${lvl.title} (Lv.${lvl.level})`;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load user info in matching game:', e);
        }
    }

    // Pre-fetch Kanji and Vocabulary from database to avoid delays mid-game
    async function fetchApiData() {
        try {
            if (typeof api !== 'undefined') {
                const [kanjis, vocabs] = await Promise.all([
                    api.getAllKanji().catch(() => []),
                    api.getAllVocabulary().catch(() => [])
                ]);
                apiKanjiList = kanjis || [];
                apiVocabList = vocabs || [];
                console.log(`Fetched ${apiKanjiList.length} Kanji and ${apiVocabList.length} vocabulary items.`);
            }
        } catch (err) {
            console.error('Error pre-fetching learning data:', err);
        }
    }

    // Set up interactive selection of configuration options
    function setupConfigListeners() {
        // 1. Selector for Card Type (Hiragana / Katakana / Kanji)
        document.querySelectorAll('[data-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-type]').forEach(b => {
                    b.classList.remove('active', 'border-[#6caba0]', 'bg-[#f0f7f6]', 'text-[#4d8a80]');
                    b.classList.add('border-gray-100', 'bg-white', 'text-gray-600');
                });
                btn.classList.add('active', 'border-[#6caba0]', 'bg-[#f0f7f6]', 'text-[#4d8a80]');
                btn.classList.remove('border-gray-100', 'bg-white', 'text-gray-600');
                gameConfig.type = btn.dataset.type;

                // Adjust Modes depending on selection
                adjustModeSelectors();
            });
        });

        // 2. Selector for Matching Mode (Reading / Meaning)
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-mode]').forEach(b => {
                    b.classList.remove('active', 'border-[#6caba0]', 'bg-[#f0f7f6]', 'text-[#4d8a80]');
                    b.classList.add('border-gray-100', 'bg-white', 'text-gray-600');
                });
                btn.classList.add('active', 'border-[#6caba0]', 'bg-[#f0f7f6]', 'text-[#4d8a80]');
                btn.classList.remove('border-gray-100', 'bg-white', 'text-gray-600');
                gameConfig.mode = btn.dataset.mode;
            });
        });

        // 3. Selector for Difficulty (Card Count)
        document.querySelectorAll('[data-count]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-count]').forEach(b => {
                    b.classList.remove('active', 'border-[#6caba0]', 'bg-[#f0f7f6]', 'text-[#4d8a80]');
                    b.classList.add('border-gray-100', 'bg-white', 'text-gray-600');
                    // Reset small description text colors
                    const subText = b.querySelector('span:last-child');
                    if (subText) {
                        subText.classList.remove('text-[#6caba0]');
                        subText.classList.add('text-gray-400');
                    }
                });
                btn.classList.add('active', 'border-[#6caba0]', 'bg-[#f0f7f6]', 'text-[#4d8a80]');
                btn.classList.remove('border-gray-100', 'bg-white', 'text-gray-600');
                const subText = btn.querySelector('span:last-child');
                if (subText) {
                    subText.classList.remove('text-gray-400');
                    subText.classList.add('text-[#6caba0]');
                }
                gameConfig.cardCount = parseInt(btn.dataset.count);
            });
        });

        // 4. Start Game triggers
        startGameBtn.addEventListener('click', startNewGame);
        quitGameBtn.addEventListener('click', stopGame);

        // 5. Victory Modal buttons
        modalReplayBtn.addEventListener('click', () => {
            hideVictoryModal();
            startNewGame();
        });
        modalSetupBtn.addEventListener('click', () => {
            hideVictoryModal();
            stopGame();
        });
    }

    // Limit Mode selections for Kanji (since Kanji always needs meaning or reading)
    function adjustModeSelectors() {
        const modeBtnReading = document.querySelector('[data-mode="reading"]');
        const modeBtnMeaning = document.querySelector('[data-mode="meaning"]');

        if (gameConfig.type === 'kanji') {
            modeBtnReading.querySelector('span:last-child').textContent = 'Chữ Kanji &rarr; Âm On/Kun';
            modeBtnMeaning.querySelector('span:last-child').textContent = 'Chữ Kanji &rarr; Nghĩa Việt';
        } else {
            modeBtnReading.querySelector('span:last-child').textContent = 'Chữ &rarr; Cách Đọc (Romaji)';
            modeBtnMeaning.querySelector('span:last-child').textContent = 'Chữ &rarr; Nghĩa Việt';
        }
    }

    // --- GAME ENGINE ---

    // 1. Start a new game session
    function startNewGame() {
        setupScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        // Reset stats
        moves = 0;
        matchesCount = 0;
        totalSeconds = 0;
        sessionXpEarned = 0;
        firstCard = null;
        secondCard = null;
        lockBoard = false;

        // Render stats on UI
        gameMoves.textContent = moves;
        gameProgress.textContent = `0/${gameConfig.cardCount / 2}`;
        gameTimer.textContent = '00:00';
        sessionXpText.textContent = '0 XP tích lũy';

        // Start timer
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);

        // Prepare cards and render
        generateGameCards();
        renderCards();
    }

    // 2. Stop/Quit current game
    function stopGame() {
        clearInterval(timerInterval);
        gameScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        setupSidebarUserInfo(); // Update global XP stats
    }

    // 3. Update the game timer every second
    function updateTimer() {
        totalSeconds++;
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        gameTimer.textContent = `${mins}:${secs}`;
    }

    // 4. Generate pairs based on config
    function generateGameCards() {
        let pool = [];

        // Determine source pool
        if (gameConfig.type === 'hiragana') {
            pool = KANA_HIRAGANA.map((item, idx) => ({
                id: `hira_${idx}`,
                question: item[0],
                reading: item[1],
                meaning: item[2]
            }));
        } else if (gameConfig.type === 'katakana') {
            pool = KANA_KATAKANA.map((item, idx) => ({
                id: `kata_${idx}`,
                question: item[0],
                reading: item[1],
                meaning: item[2]
            }));
        } else {
            // Kanji / Vocabulary
            if (apiKanjiList.length > 0 || apiVocabList.length > 0) {
                // Combine databases
                const kanjiItems = apiKanjiList.map(k => ({
                    id: `db_kanji_${k.id}`,
                    question: k.kanji,
                    reading: `${k.onyomi || ''} ${k.kunyomi || ''}`.trim() || '—',
                    meaning: k.meaning
                }));
                const vocabItems = apiVocabList.map(v => ({
                    id: `db_vocab_${v.id}`,
                    question: v.word,
                    reading: v.romaji || '—',
                    meaning: v.meaning
                }));
                pool = [...kanjiItems, ...vocabItems];
            }

            // Fallback if no db items found
            if (pool.length === 0) {
                pool = KANJI_FALLBACK.map((k, idx) => ({
                    id: `fallback_${idx}`,
                    question: k.kanji,
                    reading: k.reading,
                    meaning: k.meaning
                }));
            }
        }

        // Shuffle full pool and slice N items (N = half of difficulty count)
        const pairCount = gameConfig.cardCount / 2;
        shuffleArray(pool);
        const selectedPairs = pool.slice(0, pairCount);

        // Duplicate into 2N cards (1 containing Question, 1 containing Match Value)
        cardsData = [];
        selectedPairs.forEach((pair, index) => {
            const matchValue = gameConfig.mode === 'reading' ? pair.reading : pair.meaning;

            // Card 1: The Japanese Character
            cardsData.push({
                matchId: index,
                content: pair.question,
                isQuestion: true,
                id: `card_q_${index}`
            });

            // Card 2: Pronunciation or Meaning
            cardsData.push({
                matchId: index,
                content: matchValue,
                isQuestion: false,
                id: `card_a_${index}`
            });
        });

        // Shuffle the 2N card deck
        shuffleArray(cardsData);
    }

    // 5. Render cards to the grid DOM
    function renderCards() {
        cardGrid.innerHTML = '';

        // Adjust grid columns based on card count to fit perfectly on all screens
        if (gameConfig.cardCount === 8) {
            cardGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto";
        } else if (gameConfig.cardCount === 12) {
            cardGrid.className = "grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-3xl mx-auto";
        } else {
            cardGrid.className = "grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto";
        }

        cardsData.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'matching-card';
            cardEl.dataset.matchId = card.matchId;
            cardEl.id = card.id;

            // Extra stylings for size/font of text
            const isLongText = card.content.length > 5;
            const fontClass = card.isQuestion 
                ? "text-2xl sm:text-3xl font-bold font-['Noto_Sans_JP']" 
                : (isLongText ? "text-xs sm:text-sm font-semibold px-1" : "text-sm sm:text-base font-bold");

            cardEl.innerHTML = `
                <span class="${fontClass} text-center select-none pointer-events-none">${card.content}</span>
            `;

            cardEl.addEventListener('click', handleCardClick);
            cardGrid.appendChild(cardEl);
        });
    }

    // 6. Handle card interactions
    function handleCardClick() {
        if (lockBoard) return;
        if (this.classList.contains('matched')) return;

        // If clicking the currently selected card, deselect it
        if (this === firstCard) {
            this.classList.remove('selected');
            firstCard = null;
            return;
        }

        this.classList.add('selected');

        if (!firstCard) {
            firstCard = this;
            return;
        }

        secondCard = this;
        moves++;
        gameMoves.textContent = moves;

        checkForMatch();
    }

    // 7. Check if two selected cards match
    async function checkForMatch() {
        const isMatch = firstCard.dataset.matchId === secondCard.dataset.matchId;

        if (isMatch) {
            disableCards();
        } else {
            deselectCards();
        }
    }

    // 8. Handle matched pairs
    async function disableCards() {
        lockBoard = true;
        
        const card1 = firstCard;
        const card2 = secondCard;

        card1.classList.remove('selected');
        card2.classList.remove('selected');
        card1.classList.add('matched');
        card2.classList.add('matched');

        let xpGranted = 0;
        try {
            if (typeof gamification !== 'undefined') {
                if (gameConfig.type === 'hiragana' || gameConfig.type === 'katakana') {
                    await gamification.trackEvent('kana_quiz_correct');
                    xpGranted = 1;
                } else {
                    await gamification.trackEvent('vocab_review');
                    xpGranted = 1;
                }
            }
        } catch (err) {
            console.error('Gamification tracking error:', err);
        }

        sessionXpEarned += xpGranted;
        sessionXpText.textContent = `${sessionXpEarned} XP tích lũy`;

        matchesCount++;
        const totalPairs = gameConfig.cardCount / 2;
        gameProgress.textContent = `${matchesCount}/${totalPairs}`;

        setTimeout(() => {
            card1.classList.add('matched-hidden');
            card2.classList.add('matched-hidden');
            resetBoard();
            if (matchesCount === totalPairs) {
                endGameSession();
            }
        }, 400);
    }

    // 9. Handle mismatched pairs
    function deselectCards() {
        lockBoard = true;
        const card1 = firstCard;
        const card2 = secondCard;

        card1.classList.add('mismatched');
        card2.classList.add('mismatched');

        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        setTimeout(() => {
            card1.classList.remove('selected', 'mismatched');
            card2.classList.remove('selected', 'mismatched');
            resetBoard();
        }, 600);
    }

    // Reset current active card selections
    function resetBoard() {
        [firstCard, secondCard] = [null, null];
        lockBoard = false;
    }

    // 10. End Game Session (Victory)
    async function endGameSession() {
        clearInterval(timerInterval);

        // Calculate accuracy
        const totalPairs = gameConfig.cardCount / 2;
        const accuracy = Math.round((totalPairs / moves) * 100);

        // Award victory bonus (+5 XP)
        let bonusXp = 0;
        try {
            if (typeof gamification !== 'undefined') {
                const res = await gamification.trackEvent('flashcard_complete');
                bonusXp = 5;
                sessionXpEarned += bonusXp;
            }
        } catch (err) {
            console.error('Failed to award victory bonus XP:', err);
        }

        // Show modal statistics
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        modalTime.textContent = `${mins}:${secs}`;
        modalMoves.textContent = moves;
        modalAccuracy.textContent = `${accuracy}%`;

        // XP Breakdown text
        modalXpBreakdown.textContent = `Ghép đúng: ${sessionXpEarned - bonusXp} XP + Thắng game: ${bonusXp} XP`;
        modalXpTotal.textContent = `+${sessionXpEarned} XP`;

        // Update header XP live
        setupSidebarUserInfo();

        // Show Victory modal
        showVictoryModal();
        triggerConfetti();
    }

    // --- UX UI EFFECTS ---

    function showVictoryModal() {
        victoryModal.classList.remove('hidden');
        setTimeout(() => {
            victoryModal.classList.remove('opacity-0');
            victoryModal.querySelector('.scale-95').classList.remove('scale-95');
        }, 10);
    }

    function hideVictoryModal() {
        victoryModal.classList.add('opacity-0');
        victoryModal.querySelector('.transform').classList.add('scale-95');
        setTimeout(() => {
            victoryModal.classList.add('hidden');
        }, 300);
    }

    // Premium Emoji fireworks effect
    function triggerConfetti() {
        confettiContainer.innerHTML = '';
        const emojis = ['🌸', '✨', '🎉', '🇯🇵', '💯', '🔥', '🏆', '⭐'];
        const pieceCount = 60;

        for (let i = 0; i < pieceCount; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            // Random positions and anim properties
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.top = `-${Math.random() * 20}px`;
            piece.style.animationDelay = `${Math.random() * 2}s`;
            piece.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
            
            // Random scales
            const scale = 0.5 + Math.random() * 1;
            piece.style.transform = `scale(${scale})`;

            confettiContainer.appendChild(piece);
        }
    }

    // --- UTILITIES ---

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Run initialization
    initPage();
});
