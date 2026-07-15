// ============================================
// Kana Learning Page - Sumary Japanese
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.requireAuth()) return;

    const KANA = {
        hiragana: [
            { group: 'A', items: [['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o']] },
            { group: 'K', items: [['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko']] },
            { group: 'S', items: [['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so']] },
            { group: 'T', items: [['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to']] },
            { group: 'N', items: [['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no']] },
            { group: 'H', items: [['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho']] },
            { group: 'M', items: [['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo']] },
            { group: 'Y', items: [['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo']] },
            { group: 'R', items: [['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro']] },
            { group: 'W', items: [['わ', 'wa'], ['を', 'wo'], ['ん', 'n']] },
            { group: 'Dakuten', items: [['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'], ['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'], ['だ', 'da'], ['ぢ', 'ji'], ['づ', 'zu'], ['de', 'de'], ['ど', 'do'], ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'], ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po']] },
            { group: 'Yoon', items: [['きゃ', 'kya'], ['きゅ', 'kyu'], ['きょ', 'kyo'], ['しゃ', 'sha'], ['しゅ', 'shu'], ['しょ', 'sho'], ['ちゃ', 'cha'], ['ちゅ', 'chu'], ['ちょ', 'cho'], ['niya', 'nya'], ['にゅ', 'nyu'], ['にょ', 'nyo'], ['ひゃ', 'hya'], ['ひゅ', 'hyu'], ['ひょ', 'hyo'], ['みゃ', 'mya'], ['みゅ', 'myu'], ['みょ', 'myo'], ['りゃ', 'rya'], ['りゅ', 'ryu'], ['りょ', 'ryo']] },
        ],
        katakana: [
            { group: 'A', items: [['ア', 'a'], ['イ', 'i'], ['ウ', 'u'], ['エ', 'e'], ['オ', 'o']] },
            { group: 'K', items: [['カ', 'ka'], ['キ', 'ki'], ['ク', 'ku'], ['ケ', 'ke'], ['コ', 'ko']] },
            { group: 'S', items: [['サ', 'sa'], ['シ', 'shi'], ['ス', 'su'], ['セ', 'se'], ['ソ', 'so']] },
            { group: 'T', items: [['タ', 'ta'], ['チ', 'chi'], ['ツ', 'tsu'], ['テ', 'te'], ['ト', 'to']] },
            { group: 'N', items: [['ナ', 'na'], ['ニ', 'ni'], ['ヌ', 'nu'], ['ネ', 'ne'], ['ノ', 'no']] },
            { group: 'H', items: [['ハ', 'ha'], ['hi', 'hi'], ['フ', 'fu'], ['ヘ', 'he'], ['ホ', 'ho']] },
            { group: 'M', items: [['マ', 'ma'], ['ミ', 'mi'], ['ム', 'mu'], ['メ', 'me'], ['モ', 'mo']] },
            { group: 'Y', items: [['ヤ', 'ya'], ['ユ', 'yu'], ['ヨ', 'yo']] },
            { group: 'R', items: [['ラ', 'ra'], ['リ', 'ri'], ['ル', 'ru'], ['レ', 're'], ['ロ', 'ro']] },
            { group: 'W', items: [['ワ', 'wa'], ['ヲ', 'wo'], ['ン', 'n']] },
            { group: 'Dakuten', items: [['ガ', 'ga'], ['ギ', 'gi'], ['グ', 'gu'], ['ゲ', 'ge'], ['ゴ', 'go'], ['ザ', 'za'], ['ジ', 'ji'], ['ズ', 'zu'], ['ゼ', 'ze'], ['ゾ', 'zo'], ['ダ', 'da'], ['ヂ', 'ji'], ['ヅ', 'zu'], ['デ', 'de'], ['ド', 'do'], ['バ', 'ba'], ['ビ', 'bi'], ['ブ', 'bu'], ['ベ', 'be'], ['ボ', 'bo'], ['パ', 'pa'], ['ピ', 'pi'], ['プ', 'pu'], ['ペ', 'pe'], ['ポ', 'po']] },
            { group: 'Yoon', items: [['キャ', 'kya'], ['キュ', 'kyu'], ['キョ', 'kyo'], ['シャ', 'sha'], ['シュ', 'shu'], ['ショ', 'sho'], ['チャ', 'cha'], ['チュ', 'chu'], ['チョ', 'cho'], ['ニャ', 'nya'], ['ニュ', 'nyu'], ['ニョ', 'nyo'], ['ヒゃ', 'hya'], ['ヒュ', 'hyu'], ['ヒョ', 'hyo'], ['ミャ', 'mya'], ['ミュ', 'myu'], ['ミョ', 'myo'], ['リゃ', 'rya'], ['リュ', 'ryu'], ['リョ', 'ryo']] },
        ],
    };

    const KANA_EXAMPLES = {
        'あ': [{ ja: 'あめ (Ame)', vi: 'Mưa / Kẹo' }, { ja: 'ありがとう (Arigatou)', vi: 'Cảm ơn' }],
        'い': [{ ja: 'いぬ (Inu)', vi: 'Con chó' }, { ja: 'いち (Ichi)', vi: 'Số một' }],
        'う': [{ ja: 'うみ (Umi)', vi: 'Biển' }, { ja: 'うち (Uchi)', vi: 'Ngôi nhà' }],
        'え': [{ ja: 'えんぴつ (Enpitsu)', vi: 'Bút chì' }, { ja: 'えき (Eki)', vi: 'Nhà ga' }],
        'お': [{ ja: 'おちゃ (Ocha)', vi: 'Trà' }, { ja: 'おいしい (Oishii)', vi: 'Ngon' }],
        'か': [{ ja: 'かさ (Kasa)', vi: 'Cái ô' }, { ja: 'かばん (Kaban)', vi: 'Cặp sách' }],
        'き': [{ ja: 'きもの (Kimono)', vi: 'Áo Kimono' }, { ja: 'きっぷ (Kippu)', vi: 'Vé' }],
        'く': [{ ja: 'くるま (Kuruma)', vi: 'Xe ô tô' }, { ja: 'くだもの (Kudamono)', vi: 'Hoa quả' }],
        'け': [{ ja: 'けいさつ (Keisatsu)', vi: 'Cảnh sát' }, { ja: 'けしごむ (Keshigomu)', vi: 'Cục tẩy' }],
        'こ': [{ ja: 'こども (Kodomo)', vi: 'Trẻ em' }, { ja: 'こえ (Koe)', vi: 'Giọng nói' }],
        'さ': [{ ja: 'さkana (Sakana)', vi: 'Con cá' }, { ja: 'さくら (Sakura)', vi: 'Hoa anh đào' }],
        'し': [{ ja: 'しんかんせん (Shinkansen)', vi: 'Tàu siêu tốc' }, { ja: 'しお (Shio)', vi: 'Muối' }],
        'す': [{ ja: 'すし (Sushi)', vi: 'Sushi' }, { ja: 'すいか (Suika)', vi: 'Dưa hấu' }],
        'せ': [{ ja: 'せんせい (Sensei)', vi: 'Giáo viên' }, { ja: 'せっけん (Sekken)', vi: 'Xà phòng' }],
        'そ': [{ ja: 'そら (Sora)', vi: 'Bầu trời' }, { ja: 'そうじ (Souji)', vi: 'Dọn dẹp' }],
        'た': [{ ja: 'たまご (Tamago)', vi: 'Quả trứng' }, { ja: 'たべる (Taberu)', vi: 'Ăn' }],
        'ち': [{ ja: 'ちず (Chizu)', vi: 'Bản đồ' }, { ja: 'ちかい (Chikai)', vi: 'Gần' }],
        'つ': [{ ja: 'つくえ (Tsukue)', vi: 'Cái bàn' }, { ja: 'つめたい (Tsumetai)', vi: 'Lạnh' }],
        'て': [{ ja: 'てがmi (Tegami)', vi: 'Lá thư' }, { ja: 'てんき (Tenki)', vi: 'Thời tiết' }],
        'と': [{ ja: 'ともだち (Tomodachi)', vi: 'Bạn bè' }, { ja: 'とけい (Tokei)', vi: 'Đồng hồ' }],
        'な': [{ ja: 'なつ (Natsu)', vi: 'Mùa hè' }, { ja: 'なまえ (Namae)', vi: 'Tên' }],
        'に': [{ ja: 'にほん (Nihon)', vi: 'Nước Nhật' }, { ja: 'にく (Niku)', vi: 'Thịt' }],
        'ぬ': [{ ja: 'いぬ (Inu)', vi: 'Con chó' }, { ja: 'ぬりえ (Nurie)', vi: 'Tranh tô màu' }],
        'ね': [{ ja: 'ねこ (Neko)', vi: 'Con mèo' }, { ja: 'ねつ (Netsu)', vi: 'Cơn sốt' }],
        'の': [{ ja: 'のみもの (Nomimono)', vi: 'Đồ uống' }, { ja: 'のりもの (Norimono)', vi: 'Phương tiện' }],
        'は': [{ ja: 'はな (Hana)', vi: 'Hoa / Cái mũi' }, { ja: 'はし (Hashi)', vi: 'Đũa / Cầu' }],
        'ひ': [{ ja: 'ひこうき (Hikouki)', vi: 'Máy bay' }, { ja: 'ひだり (Hidari)', vi: 'Bên trái' }],
        'ふ': [{ ja: 'ふじさん (Fujisan)', vi: 'Núi Phú Sĩ' }, { ja: 'ふね (Fune)', vi: 'Con thuyền' }],
        'へ': [{ ja: 'へや (Heya)', vi: 'Căn phòng' }, { ja: 'へん (Hen)', vi: 'Kỳ lạ' }],
        'ほ': [{ ja: 'ほん (Hon)', vi: 'Quyển sách' }, { ja: 'ほし (Hoshi)', vi: 'Ngôi sao' }],
        'ま': [{ ja: 'まち (Machi)', vi: 'Thành phố' }, { ja: 'まど (Mado)', vi: 'Cửa sổ' }],
        'み': [{ ja: 'みず (Mizu)', vi: 'Nước' }, { ja: 'みどり (Midori)', vi: 'Màu xanh lá' }],
        'む': [{ ja: 'むし (Mushi)', vi: 'Côn trùng' }, { ja: 'むずかしい (Muzukashii)', vi: 'Khó' }],
        'め': [{ ja: 'め (Me)', vi: 'Mắt' }, { ja: 'megane (Megane)', vi: 'Kính mắt' }],
        'も': [{ ja: 'もり (Mori)', vi: 'Khu rừng' }, { ja: 'もち (Mochi)', vi: 'Bánh Mochi' }],
        'や': [{ ja: 'やま (Yama)', vi: 'Núi' }, { ja: 'やさい (Yasai)', vi: 'Rau củ' }],
        'ゆ': [{ ja: 'ゆき (Yuki)', vi: 'Tuyết' }, { ja: 'ゆめ (Yume)', vi: 'Giấc mơ' }],
        'よ': [{ ja: 'よる (Yoru)', vi: 'Ban đêm' }, { ja: 'よむ (Yomu)', vi: 'Đọc' }],
        'ら': [{ ja: 'らいしゅう (Raishuu)', vi: 'Tuần sau' }, { ja: 'らく (Raku)', vi: 'Nhàn hạ' }],
        'り': [{ ja: 'りんご (Ringo)', vi: 'Quả táo' }, { ja: 'りょこう (Ryokou)', vi: 'Du lịch' }],
        'る': [{ ja: 'はる (Haru)', vi: 'Mùa xuân' }, { ja: 'する (Suru)', vi: 'Làm' }],
        'れ': [{ ja: 'れんしゅう (Renshuu)', vi: 'Luyện tập' }, { ja: 'れいぞうこ (Reizouko)', vi: 'Tủ lạnh' }],
        'ろ': [{ ja: 'おふろ (Ofuro)', vi: 'Bồn tắm' }, { ja: 'ろく (Roku)', vi: 'Số sáu' }],
        'わ': [{ ja: 'わたし (Watashi)', vi: 'Tôi' }, { ja: 'わるい (Warui)', vi: 'Xấu' }],
        'を': [{ ja: 'ほんをよむ (Hon wo yomu)', vi: 'Đọc sách' }, { ja: 'みずをのむ (Mizu wo nomu)', vi: 'Uống nước' }],
        'ん': [{ ja: 'にほん (Nihon)', vi: 'Nước Nhật' }, { ja: 'しんぶん (Shinbun)', vi: 'Báo chí' }]
    };

    const KATA_TO_HIRA = {
        'ア': 'あ', 'イ': 'い', 'ウ': 'う', 'エ': 'え', 'オ': 'お',
        'カ': 'か', 'キ': 'き', 'ク': 'く', 'ケ': 'け', 'コ': 'こ',
        'サ': 'さ', 'シ': 'し', 'ス': 'す', 'セ': 'se', 'ソ': 'そ',
        'タ': 'た', 'チ': 'ち', 'ツ': 'つ', 'テ': 'て', 'ト': 'to',
        'ナ': 'na', 'ニ': 'に', 'ヌ': 'ぬ', 'ネ': 'ね', 'ノ': 'の',
        'ハ': 'ha', 'ヒ': 'ひ', 'フ': 'ふ', 'ヘ': 'へ', 'ホ': 'ほ',
        'マ': 'ma', 'ミ': 'mi', 'ム': 'む', 'メ': 'me', 'モ': 'mo',
        'ヤ': 'ya', 'ユ': 'ゆ', 'ヨ': 'よ',
        'ラ': 'ら', 'リ': 'り', 'ル': 'る', 'レ': 'れ', 'ロ': 'ro',
        'ワ': 'wa', 'ヲ': 'を', 'ン': 'ん'
    };

    // DOM Elements
    const boardEl = document.getElementById('kana-board');
    const tabs = document.querySelectorAll('.kana-tab');
    const subTabs = document.querySelectorAll('.kana-sub-tab');
    const masteredCountEl = document.getElementById('kana-mastered-count');
    const learningCountEl = document.getElementById('kana-learning-count');
    const progressTextEl = document.getElementById('kana-progress-text');
    const progressBarEl = document.getElementById('kana-progress-bar');
    
    // Quick Quiz
    const quizCharEl = document.getElementById('kana-quiz-char');
    const quizOptionsEl = document.getElementById('kana-quiz-options');
    const quizFeedbackEl = document.getElementById('kana-quiz-feedback');
    const quizNextBtn = document.getElementById('kana-quiz-next');
    
    // Character Detail Modal
    const charDetailModal = document.getElementById('char-detail-modal');
    const closeDetailModalBtn = document.getElementById('close-detail-modal');
    const detailCharEl = document.getElementById('detail-char');
    const detailRomajiEl = document.getElementById('detail-romaji');
    const detailTypeEl = document.getElementById('detail-type');
    const detailSpeakBtn = document.getElementById('detail-speak-btn');
    const detailStatusBadge = document.getElementById('detail-status-badge');
    const detailExamplesEl = document.getElementById('detail-examples');
    const detailStatusBtns = document.querySelectorAll('.detail-status-btn');

    // Test Modal
    const openTestBtn = document.getElementById('open-test-btn');
    const testModal = document.getElementById('kana-test-modal');
    const closeTestConfigBtn = document.getElementById('close-test-config');
    const startTestBtn = document.getElementById('start-kana-test-btn');
    const restartTestBtn = document.getElementById('restart-test-btn');
    const finishTestBtn = document.getElementById('finish-test-btn');
    
    const testScreenConfig = document.getElementById('test-screen-config');
    const testScreenSession = document.getElementById('test-screen-session');
    const testScreenResults = document.getElementById('test-screen-results');
    
    const testConfigBtns = document.querySelectorAll('.test-config-btn');
    const testConfigFormats = document.querySelectorAll('.test-config-format');
    const testConfigCounts = document.querySelectorAll('.test-config-count');
    
    const testProgressText = document.getElementById('test-progress-text');
    const testProgressPercent = document.getElementById('test-progress-percent');
    const testProgressBar = document.getElementById('test-progress-bar');
    const testTimerEl = document.getElementById('test-timer');
    const testQuestionType = document.getElementById('test-question-type');
    const testQuestionChar = document.getElementById('test-question-char');
    const testOptionsGrid = document.getElementById('test-options-grid');
    
    const testResultsMessage = document.getElementById('test-results-message');
    const testResultScore = document.getElementById('test-result-score');
    const testResultPercent = document.getElementById('test-result-percent');
    const testResultTime = document.getElementById('test-result-time');
    const testXpEarned = document.getElementById('test-xp-earned');
    const testXpDetail = document.getElementById('test-xp-detail');
    const testReviewList = document.getElementById('test-review-list');
    const testReviewSummary = document.getElementById('test-review-summary');

    let currentType = 'hiragana';
    let currentSubGroup = 'basic'; // basic, dakuten, yoon
    let progressMap = {};
    let currentQuiz = null;
    let selectedDetailChar = null;

    // Test state variables
    let testActive = false;
    let testQuestions = [];
    let testCurrentIdx = 0;
    let testAnswers = [];
    let testTimeElapsed = 0;
    let testTimerInterval = null;
    let testConfig = {
        type: 'all',
        format: 'mixed',
        count: 20
    };

    // Load initial progress data
    try {
        progressMap = buildProgressMap(await api.getKanaProgress());
        await gamification.init().catch(e => console.error(e));
    } catch (error) {
        console.error('Kana: failed to load progress.', error);
        alert('Không thể tải tiến độ Kana. Vui lòng kiểm tra kết nối và thử lại.');
        window.location.href = 'dashboard.html';
        return;
    }

    // Main tabs logic (Hiragana/Katakana)
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            currentType = tab.dataset.type || 'hiragana';
            render();
            nextQuiz();
            
            // Auto scroll container back to top
            const container = document.getElementById('kana-board-container');
            if (container) container.scrollTop = 0;
        });
    });

    // Sub tabs logic (Basic/Dakuten/Yoon)
    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            subTabs.forEach(item => {
                item.className = 'kana-sub-tab px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 transition-all';
            });
            tab.className = 'kana-sub-tab active px-3 py-1.5 rounded-lg text-xs font-bold text-[#6caba0] bg-white shadow-sm transition-all';
            currentSubGroup = tab.dataset.group || 'basic';
            render();
            
            // Auto scroll container back to top
            const container = document.getElementById('kana-board-container');
            if (container) container.scrollTop = 0;
        });
    });

    if (quizNextBtn) quizNextBtn.addEventListener('click', nextQuiz);

    function buildProgressMap(progressItems) {
        return (progressItems || []).reduce((map, item) => {
            map[getKey(item.kanaType, item.character)] = item;
            return map;
        }, {});
    }

    function getKey(type, character) {
        return `${type}:${character}`;
    }

    function getAllItems(type = currentType) {
        if (type === 'all') {
            return [...getAllItems('hiragana'), ...getAllItems('katakana')];
        }
        return KANA[type].flatMap(group => group.items.map(([character, romaji]) => ({
            group: group.group,
            type,
            character,
            romaji,
        })));
    }

    function getProgress(type, character) {
        return progressMap[getKey(type, character)] || null;
    }

    function getExamples(character) {
        const hiraChar = KATA_TO_HIRA[character] || character;
        const examples = KANA_EXAMPLES[hiraChar] || [];
        if (examples.length === 0) {
            return [{ ja: `${character} (Ví dụ)`, vi: 'Ký tự này chưa có ví dụ cụ thể.' }];
        }
        return examples;
    }

    function getFilteredGroups() {
        const groups = KANA[currentType];
        if (currentSubGroup === 'dakuten') {
            return groups.filter(g => g.group === 'Dakuten');
        } else if (currentSubGroup === 'yoon') {
            return groups.filter(g => g.group === 'Yoon');
        } else {
            return groups.filter(g => g.group !== 'Dakuten' && g.group !== 'Yoon');
        }
    }

    // Modal Details functions
    function openDetail(character, romaji, type) {
        selectedDetailChar = { character, romaji, type };
        
        detailCharEl.textContent = character;
        detailRomajiEl.textContent = romaji;
        detailTypeEl.textContent = type === 'hiragana' ? 'Hiragana (Chữ mềm)' : 'Katakana (Chữ cứng)';
        
        const progress = getProgress(type, character);
        const status = progress?.status || 'new';
        updateDetailStatusBadge(status);

        // Render examples
        const examples = getExamples(character);
        detailExamplesEl.innerHTML = examples.map(ex => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors">
              <div>
                <span class="font-['Noto_Sans_JP'] text-base font-bold text-gray-800">${utils.escapeHtml(ex.ja)}</span>
              </div>
              <span class="text-sm font-semibold text-[#6caba0]">${utils.escapeHtml(ex.vi)}</span>
            </div>
        `).join('');

        // Reset detail status buttons classes
        detailStatusBtns.forEach(btn => {
            btn.classList.remove('bg-gray-100', 'border-gray-300', 'bg-[#fffaf3]', 'border-[#f0a868]', 'bg-[#f4fbf5]', 'border-[#4caf50]');
            if (btn.dataset.status === status) {
                if (status === 'new') btn.classList.add('bg-gray-100', 'border-gray-300');
                if (status === 'learning') btn.classList.add('bg-[#fffaf3]', 'border-[#f0a868]');
                if (status === 'mastered') btn.classList.add('bg-[#f4fbf5]', 'border-[#4caf50]');
            }
        });

        // Show Modal
        charDetailModal.classList.remove('hidden');
        setTimeout(() => {
            charDetailModal.querySelector('.modal-backdrop').style.opacity = '1';
            charDetailModal.querySelector('.modal-content').classList.add('modal-open-active');
        }, 10);
    }

    function closeDetail() {
        if (!charDetailModal.classList.contains('hidden')) {
            charDetailModal.querySelector('.modal-backdrop').style.opacity = '0';
            charDetailModal.querySelector('.modal-content').classList.remove('modal-open-active');
            setTimeout(() => {
                charDetailModal.classList.add('hidden');
                selectedDetailChar = null;
            }, 250);
        }
    }

    function updateDetailStatusBadge(status) {
        detailStatusBadge.className = 'mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold';
        if (status === 'new') {
            detailStatusBadge.classList.add('bg-gray-100', 'text-gray-500');
            detailStatusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-gray-400"></span> Chưa học';
        } else if (status === 'learning') {
            detailStatusBadge.classList.add('bg-[#fffaf3]', 'text-[#d98b42]');
            detailStatusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-[#f0a868]"></span> Đang học';
        } else if (status === 'mastered') {
            detailStatusBadge.classList.add('bg-[#f4fbf5]', 'text-[#2e7d32]');
            detailStatusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-[#4caf50]"></span> Đã thuộc';
        }
    }

    // Bind Modal Events
    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeDetail);
    if (charDetailModal) {
        charDetailModal.querySelector('.modal-backdrop').addEventListener('click', closeDetail);
    }

    if (detailSpeakBtn) {
        detailSpeakBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (selectedDetailChar) {
                tts.speak(selectedDetailChar.character);
            }
        });
    }

    detailStatusBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!selectedDetailChar) return;
            const newStatus = btn.dataset.status;
            const previousProgress = getProgress(selectedDetailChar.type, selectedDetailChar.character);
            const prevStatus = previousProgress?.status || 'new';

            if (newStatus === prevStatus) {
                closeDetail();
                return;
            }

            await saveProgress(selectedDetailChar.character, newStatus);
            
            // Gamification trigger
            if (newStatus === 'mastered' && prevStatus !== 'mastered') {
                gamification.trackEvent('kana_mastered').catch(e => console.error(e));
            }
            
            closeDetail();
        });
    });

    // Main render functions
    function render() {
        renderBoard();
        renderStats();
    }

    function renderBoard() {
        if (!boardEl) return;

        const filteredGroups = getFilteredGroups();

        boardEl.innerHTML = filteredGroups.map(group => `
            <section class="space-y-2">
                <div class="kana-group-title">${group.group}</div>
                <div class="kana-grid">
                    ${group.items.map(([character, romaji]) => renderKanaCard(character, romaji)).join('')}
                </div>
            </section>
        `).join('');

        // Add event listeners to cards
        boardEl.querySelectorAll('.kana-card').forEach(card => {
            const char = card.dataset.character;
            const romaji = card.dataset.romaji;
            
            card.addEventListener('click', () => {
                openDetail(char, romaji, currentType);
            });

            const speakBtn = card.querySelector('.kana-card-speak');
            if (speakBtn) {
                speakBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tts.speak(char);
                });
            }

            const statusBtn = card.querySelector('.kana-card-status-btn');
            if (statusBtn) {
                statusBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const progress = getProgress(currentType, char);
                    const status = progress?.status || 'new';
                    
                    // Cycle status: new -> learning -> mastered -> new
                    let nextStatus = 'learning';
                    if (status === 'learning') nextStatus = 'mastered';
                    else if (status === 'mastered') nextStatus = 'new';
                    
                    await saveProgress(char, nextStatus);
                    
                    if (nextStatus === 'mastered') {
                        gamification.trackEvent('kana_mastered').catch(e => console.error(e));
                    }
                });
            }
        });
    }

    function renderKanaCard(character, romaji) {
        const progress = getProgress(currentType, character);
        const status = progress?.status || 'new';
        const cardClass = status === 'mastered' ? 'mastered' : status === 'learning' ? 'learning' : '';

        return `
            <article class="kana-card ${cardClass}" data-character="${utils.escapeHtml(character)}" data-romaji="${utils.escapeHtml(romaji)}">
                <button type="button" class="kana-card-speak" data-character="${utils.escapeHtml(character)}" title="Phát âm">
                    <span class="material-symbols-outlined text-base">volume_up</span>
                </button>
                <button type="button" class="kana-card-status-btn" data-character="${utils.escapeHtml(character)}" title="Đổi trạng thái nhanh">
                    <span class="kana-card-status-dot"></span>
                </button>
                <span class="kana-char">${utils.escapeHtml(character)}</span>
                <span class="kana-romaji">${utils.escapeHtml(romaji)}</span>
            </article>
        `;
    }

    async function saveProgress(character, status) {
        try {
            const apiStatus = status === 'new' ? 'learning' : status;
            const saved = await api.updateKanaProgress(currentType, character, apiStatus);
            
            if (status === 'new') {
                delete progressMap[getKey(currentType, character)];
            } else {
                progressMap[getKey(saved.kanaType, saved.character)] = saved;
            }
            render();
        } catch (error) {
            console.error('Kana: failed to save progress.', error);
            gamification.showToast('Không thể lưu tiến trình. Vui lòng thử lại.', 'xp');
        }
    }

    function renderStats() {
        const all = getAllItems(currentType);
        const mastered = all.filter(item => getProgress(item.type, item.character)?.status === 'mastered').length;
        const learning = all.filter(item => getProgress(item.type, item.character)?.status === 'learning').length;
        const pct = all.length ? Math.round((mastered / all.length) * 100) : 0;

        if (masteredCountEl) masteredCountEl.textContent = mastered;
        if (learningCountEl) learningCountEl.textContent = learning;
        if (progressTextEl) progressTextEl.textContent = `${mastered}/${all.length} ký tự`;
        if (progressBarEl) progressBarEl.style.width = `${pct}%`;
    }

    // Mini Quick Quiz (Quick Practice) logic
    function nextQuiz() {
        const items = getAllItems(currentType);
        if (items.length === 0) return;
        
        currentQuiz = utils.shuffle([...items])[0];
        const wrongOptions = utils.shuffle(items.filter(item => item.romaji !== currentQuiz.romaji)).slice(0, 3);
        const options = utils.shuffle([currentQuiz, ...wrongOptions]);

        if (quizCharEl) quizCharEl.textContent = currentQuiz.character;
        if (quizFeedbackEl) {
            quizFeedbackEl.textContent = '';
            quizFeedbackEl.className = 'text-sm font-semibold min-h-[1.25rem] text-center';
        }
        if (quizOptionsEl) {
            quizOptionsEl.innerHTML = options.map(option => `
                <button class="quiz-option" type="button" data-answer="${utils.escapeHtml(option.romaji)}">
                    ${utils.escapeHtml(option.romaji)}
                </button>
            `).join('');

            quizOptionsEl.querySelectorAll('.quiz-option').forEach(button => {
                button.addEventListener('click', () => handleQuizAnswer(button));
            });
        }
    }

    async function handleQuizAnswer(button) {
        if (!currentQuiz || button.disabled) return;
        const selected = button.dataset.answer;
        const isCorrect = selected === currentQuiz.romaji;

        quizOptionsEl.querySelectorAll('.quiz-option').forEach(option => {
            option.disabled = true;
            if (option.dataset.answer === currentQuiz.romaji) option.classList.add('correct');
        });

        if (isCorrect) {
            button.classList.add('correct');
            if (quizFeedbackEl) {
                quizFeedbackEl.textContent = 'Chính xác! +1 XP';
                quizFeedbackEl.className = 'text-sm font-semibold min-h-[1.25rem] text-center text-[#2e7d32]';
            }
            gamification.trackEvent('kana_quiz_correct').catch(e => console.error(e));
            await saveProgress(currentQuiz.character, 'mastered');
        } else {
            button.classList.add('wrong');
            if (quizFeedbackEl) {
                quizFeedbackEl.textContent = `Chưa đúng. Đáp án là ${currentQuiz.romaji}.`;
                quizFeedbackEl.className = 'text-sm font-semibold min-h-[1.25rem] text-center text-[#c62828]';
            }
            await saveProgress(currentQuiz.character, 'learning');
        }

        setTimeout(nextQuiz, 1200);
    }

    // ============================================
    // Kana Full Test Manual Flow
    // ============================================

    // Test Config Selectors
    testConfigBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            testConfigBtns.forEach(b => b.className = 'test-config-btn flex-1 py-3 px-2 border border-gray-200 rounded-xl font-bold text-sm text-center text-gray-600 hover:bg-gray-50 transition-all');
            btn.className = 'test-config-btn active flex-1 py-3 px-2 border rounded-xl font-bold text-sm text-center transition-all bg-[#6caba0] border-[#6caba0] text-white';
            testConfig.type = btn.dataset.configType;
        });
    });

    testConfigFormats.forEach(btn => {
        btn.addEventListener('click', () => {
            testConfigFormats.forEach(b => b.className = 'test-config-format flex-1 py-3 px-1.5 border border-gray-200 rounded-xl font-bold text-xs text-center text-gray-600 hover:bg-gray-50 transition-all');
            btn.className = 'test-config-format active flex-1 py-3 px-1.5 border rounded-xl font-bold text-xs text-center transition-all bg-[#6caba0] border-[#6caba0] text-white';
            testConfig.format = btn.dataset.configFormat;
        });
    });

    testConfigCounts.forEach(btn => {
        btn.addEventListener('click', () => {
            testConfigCounts.forEach(b => b.className = 'test-config-count flex-1 py-3 border border-gray-200 rounded-xl font-bold text-sm text-center text-gray-600 hover:bg-gray-50 transition-all');
            btn.className = 'test-config-count active flex-1 py-3 border rounded-xl font-bold text-sm text-center transition-all bg-[#6caba0] border-[#6caba0] text-white';
            testConfig.count = parseInt(btn.dataset.configCount, 10);
        });
    });

    // Modals Control
    if (openTestBtn) {
        openTestBtn.addEventListener('click', () => {
            testModal.classList.remove('hidden');
            testScreenConfig.classList.remove('hidden');
            testScreenSession.classList.add('hidden');
            testScreenResults.classList.add('hidden');
            
            setTimeout(() => {
                testModal.querySelector('.absolute.inset-0').style.opacity = '1';
                testModal.querySelector('.modal-content').classList.add('modal-open-active');
            }, 10);
        });
    }

    function closeTestModal() {
        stopTestTimer();
        testActive = false;
        
        testModal.querySelector('.absolute.inset-0').style.opacity = '0';
        testModal.querySelector('.modal-content').classList.remove('modal-open-active');
        setTimeout(() => {
            testModal.classList.add('hidden');
        }, 250);
    }

    if (closeTestConfigBtn) closeTestConfigBtn.addEventListener('click', closeTestModal);
    if (finishTestBtn) finishTestBtn.addEventListener('click', closeTestModal);
    if (restartTestBtn) {
        restartTestBtn.addEventListener('click', () => {
            testScreenResults.classList.add('hidden');
            testScreenConfig.classList.remove('hidden');
        });
    }

    // Start Test Action
    if (startTestBtn) {
        startTestBtn.addEventListener('click', () => {
            testScreenConfig.classList.add('hidden');
            testScreenSession.classList.remove('hidden');
            initKanaTest();
        });
    }

    function initKanaTest() {
        testActive = true;
        testCurrentIdx = 0;
        testAnswers = [];
        testTimeElapsed = 0;
        
        // Pick character pool
        let pool = [];
        if (testConfig.type === 'all') {
            pool = [...getAllItems('hiragana'), ...getAllItems('katakana')];
        } else {
            pool = getAllItems(testConfig.type);
        }

        if (pool.length < 4) {
            alert('Không đủ dữ liệu chữ cái để kiểm tra!');
            closeTestModal();
            return;
        }

        // Shuffle pool
        const shuffled = utils.shuffle([...pool]);
        const questionCount = Math.min(testConfig.count, shuffled.length);
        
        // Generate test questions
        testQuestions = shuffled.slice(0, questionCount).map(item => {
            let format = testConfig.format;
            if (format === 'mixed') {
                format = Math.random() > 0.5 ? 'kana-romaji' : 'romaji-kana';
            }

            const sameTypePool = pool.filter(p => p.type === item.type && p.character !== item.character);
            const distractors = utils.shuffle(sameTypePool).slice(0, 3);
            
            let questionText = '';
            let correctAnswer = '';
            let options = [];

            if (format === 'kana-romaji') {
                questionText = item.character;
                correctAnswer = item.romaji;
                options = utils.shuffle([item.romaji, ...distractors.map(d => d.romaji)]);
            } else {
                questionText = item.romaji;
                correctAnswer = item.character;
                options = utils.shuffle([item.character, ...distractors.map(d => d.character)]);
            }

            return {
                charItem: item,
                format,
                questionText,
                correctAnswer,
                options
            };
        });

        startTestTimer();
        showTestQuestion();
    }

    function startTestTimer() {
        stopTestTimer();
        testTimerEl.textContent = '00:00';
        testTimerInterval = setInterval(() => {
            testTimeElapsed++;
            const mins = String(Math.floor(testTimeElapsed / 60)).padStart(2, '0');
            const secs = String(testTimeElapsed % 60).padStart(2, '0');
            testTimerEl.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    function stopTestTimer() {
        if (testTimerInterval) {
            clearInterval(testTimerInterval);
            testTimerInterval = null;
        }
    }

    function showTestQuestion() {
        if (testCurrentIdx >= testQuestions.length) {
            endKanaTest();
            return;
        }

        const q = testQuestions[testCurrentIdx];
        
        // Progress UI
        testProgressText.textContent = `${testCurrentIdx + 1}/${testQuestions.length}`;
        const pct = Math.round(((testCurrentIdx + 1) / testQuestions.length) * 100);
        testProgressPercent.textContent = `${pct}%`;
        testProgressBar.style.width = `${pct}%`;

        // Question UI
        testQuestionType.textContent = q.format === 'kana-romaji' ? 'Chọn cách đọc Romaji phù hợp' : 'Chọn chữ Kana có cách đọc tương ứng';
        testQuestionChar.textContent = q.questionText;

        // Options UI
        testOptionsGrid.innerHTML = q.options.map((opt, idx) => `
            <button class="test-option-btn py-3.5 border border-gray-200 rounded-2xl font-bold text-lg hover:border-[#6caba0] hover:bg-[#f0f7f6] transition-all flex items-center justify-center bg-white" data-answer="${utils.escapeHtml(opt)}">
                ${utils.escapeHtml(opt)}
            </button>
        `).join('');

        // Option click listener
        testOptionsGrid.querySelectorAll('.test-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const answer = btn.dataset.answer;
                const isCorrect = answer === q.correctAnswer;

                testAnswers.push({
                    question: q,
                    selected: answer,
                    isCorrect
                });

                btn.classList.remove('hover:border-[#6caba0]', 'hover:bg-[#f0f7f6]');
                if (isCorrect) {
                    btn.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-700');
                } else {
                    btn.classList.add('bg-rose-50', 'border-rose-500', 'text-rose-700');
                }

                testOptionsGrid.querySelectorAll('.test-option-btn').forEach(b => b.disabled = true);

                setTimeout(() => {
                    testCurrentIdx++;
                    showTestQuestion();
                }, 200);
            });
        });
    }

    async function endKanaTest() {
        stopTestTimer();
        testActive = false;

        const correctCount = testAnswers.filter(a => a.isCorrect).length;
        const totalCount = testQuestions.length;
        const pctScore = Math.round((correctCount / totalCount) * 100);
        
        testScreenSession.classList.add('hidden');
        testScreenResults.classList.remove('hidden');

        // Results text
        testResultScore.textContent = `${correctCount}/${totalCount}`;
        testResultPercent.textContent = `${pctScore}%`;
        
        const mins = String(Math.floor(testTimeElapsed / 60)).padStart(2, '0');
        const secs = String(testTimeElapsed % 60).padStart(2, '0');
        testResultTime.textContent = `${mins}:${secs}`;

        // Evaluation message
        if (pctScore === 100) {
            testResultsMessage.textContent = 'Xuất sắc! Bạn đạt điểm số tối đa 100%.';
        } else if (pctScore >= 80) {
            testResultsMessage.textContent = 'Rất tốt! Bạn đã làm rất tốt bài kiểm tra.';
        } else if (pctScore >= 50) {
            testResultsMessage.textContent = 'Khá tốt! Tiếp tục cố gắng để thuộc hết nhé.';
        } else {
            testResultsMessage.textContent = 'Bạn cần ôn tập thêm nhiều hơn nhé!';
        }

        // Gamification awards
        let awardedXp = correctCount;
        let isPerfect = pctScore === 100;
        if (isPerfect) {
            awardedXp += 15;
        }

        testXpEarned.textContent = `+${awardedXp} XP`;
        testXpDetail.textContent = isPerfect ? 'Điểm tuyệt đối! Nhận 1 XP/câu + 15 XP thưởng hoàn hảo!' : 'Nhận 1 XP cho mỗi câu trả lời đúng.';

        // Submit XP Events
        try {
            if (correctCount > 0) {
                await api.trackGamificationEvent('kana_quiz_correct', { count: correctCount });
            }
            if (isPerfect) {
                await api.trackGamificationEvent('test_complete', { score: 100 });
            }
        } catch (e) {
            console.error('Gamification: failed to track test XP', e);
        }

        // Auto update cards status
        for (const ans of testAnswers) {
            const char = ans.question.charItem.character;
            const type = ans.question.charItem.type;
            const currentStatus = getProgress(type, char)?.status || 'new';

            if (ans.isCorrect) {
                if (currentStatus !== 'mastered') {
                    await saveProgress(char, 'mastered');
                }
            } else {
                if (currentStatus === 'new') {
                    await saveProgress(char, 'learning');
                }
            }
        }

        // Review List
        testReviewSummary.textContent = `Xem lại ${totalCount - correctCount} câu trả lời sai`;
        testReviewList.innerHTML = testAnswers.map(ans => {
            const statusClass = ans.isCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30';
            const icon = ans.isCorrect ? '<span class="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>' : '<span class="material-symbols-outlined text-rose-500 text-lg">cancel</span>';
            const questionTypeDesc = ans.question.format === 'kana-romaji' ? 'Nhìn chữ đoán âm đọc' : 'Nhìn âm đọc đoán chữ';
            
            return `
                <div class="flex items-center justify-between p-3 border rounded-xl ${statusClass}">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                        <span class="font-['Noto_Sans_JP'] text-base font-bold text-gray-800">${utils.escapeHtml(ans.question.questionText)}</span>
                        <span class="text-[0.625rem] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded-md">${questionTypeDesc}</span>
                    </div>
                    <p class="text-xs text-gray-500">
                      Chọn: <span class="font-bold ${ans.isCorrect ? 'text-emerald-600' : 'text-rose-600'}">${utils.escapeHtml(ans.selected)}</span> 
                      | Đúng: <span class="font-bold text-emerald-600">${utils.escapeHtml(ans.question.correctAnswer)}</span>
                    </p>
                  </div>
                  ${icon}
                </div>
            `;
        }).join('');
    }

    render();
    nextQuiz();
    auth.updateSidebarUser();
});
