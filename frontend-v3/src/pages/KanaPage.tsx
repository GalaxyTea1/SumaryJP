// ============================================
// KanaPage — SumaryJP V3
// Bảng chữ cái tiếng Nhật, Mini Quiz & Test Kana hoàn chỉnh
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useToast } from '@/context/ToastContext';
import type { KanaProgressItem } from '@/types';

// ---- Data structures ----
const KANA = {
  hiragana: [
    { group: 'Basic A', items: [['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o']] },
    { group: 'Basic K', items: [['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko']] },
    { group: 'Basic S', items: [['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so']] },
    { group: 'Basic T', items: [['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to']] },
    { group: 'Basic N', items: [['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no']] },
    { group: 'Basic H', items: [['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho']] },
    { group: 'Basic M', items: [['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo']] },
    { group: 'Basic Y', items: [['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo']] },
    { group: 'Basic R', items: [['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro']] },
    { group: 'Basic W', items: [['わ', 'wa'], ['を', 'wo'], ['ん', 'n']] },
    {
      group: 'Dakuten',
      items: [
        ['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'],
        ['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'],
        ['だ', 'da'], ['ぢ', 'ji'], ['づ', 'zu'], ['で', 'de'], ['ど', 'do'],
        ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'],
        ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po']
      ]
    },
    {
      group: 'Yoon',
      items: [
        ['きゃ', 'kya'], ['きゅ', 'kyu'], ['きょ', 'kyo'],
        ['しゃ', 'sha'], ['しゅ', 'shu'], ['しょ', 'sho'],
        ['ちゃ', 'cha'], ['ちゅ', 'chu'], ['ちょ', 'cho'],
        ['にゃ', 'nya'], ['にゅ', 'nyu'], ['にょ', 'nyo'],
        ['ひゃ', 'hya'], ['ひゅ', 'hyu'], ['ひょ', 'hyo'],
        ['みゃ', 'mya'], ['みゅ', 'myu'], ['みょ', 'myo'],
        ['りゃ', 'rya'], ['りゅ', 'ryu'], ['りょ', 'ryo']
      ]
    },
  ],
  katakana: [
    { group: 'Basic A', items: [['ア', 'a'], ['イ', 'i'], ['ウ', 'u'], ['エ', 'e'], ['オ', 'o']] },
    { group: 'Basic K', items: [['カ', 'ka'], ['キ', 'ki'], ['ク', 'ku'], ['ケ', 'ke'], ['コ', 'ko']] },
    { group: 'Basic S', items: [['サ', 'sa'], ['シ', 'shi'], ['ス', 'su'], ['セ', 'se'], ['ソ', 'so']] },
    { group: 'Basic T', items: [['タ', 'ta'], ['チ', 'chi'], ['ツ', 'tsu'], ['テ', 'te'], ['ト', 'to']] },
    { group: 'Basic N', items: [['ナ', 'na'], ['ニ', 'ni'], ['ヌ', 'nu'], ['ネ', 'ne'], ['ノ', 'no']] },
    { group: 'Basic H', items: [['ハ', 'ha'], ['ヒ', 'hi'], ['フ', 'fu'], ['ヘ', 'he'], ['ホ', 'ho']] },
    { group: 'Basic M', items: [['マ', 'ma'], ['ミ', 'mi'], ['ム', 'mu'], ['メ', 'me'], ['モ', 'mo']] },
    { group: 'Basic Y', items: [['ヤ', 'ya'], ['ユ', 'yu'], ['ヨ', 'yo']] },
    { group: 'Basic R', items: [['ラ', 'ra'], ['リ', 'ri'], ['ル', 'ru'], ['レ', 're'], ['ロ', 'ro']] },
    { group: 'Basic W', items: [['ワ', 'wa'], ['ヲ', 'wo'], ['ン', 'n']] },
    {
      group: 'Dakuten',
      items: [
        ['ガ', 'ga'], ['ギ', 'gi'], ['グ', 'gu'], ['ゲ', 'ge'], ['ゴ', 'go'],
        ['ザ', 'za'], ['ジ', 'ji'], ['ズ', 'zu'], ['ゼ', 'ze'], ['ゾ', 'zo'],
        ['ダ', 'da'], ['ヂ', 'ji'], ['ヅ', 'zu'], ['デ', 'de'], ['ド', 'do'],
        ['バ', 'ba'], ['ビ', 'bi'], ['ブ', 'bu'], ['ベ', 'be'], ['ボ', 'bo'],
        ['パ', 'pa'], ['ピ', 'pi'], ['プ', 'pu'], ['ペ', 'pe'], ['ポ', 'po']
      ]
    },
    {
      group: 'Yoon',
      items: [
        ['キャ', 'kya'], ['キュ', 'kyu'], ['キョ', 'kyo'],
        ['シャ', 'sha'], ['シュ', 'shu'], ['ショ', 'sho'],
        ['チャ', 'cha'], ['チュ', 'chu'], ['チョ', 'cho'],
        ['ニャ', 'nya'], ['ニュ', 'nyu'], ['ニョ', 'nyo'],
        ['ヒャ', 'hya'], ['ヒュ', 'hyu'], ['ヒョ', 'hyo'],
        ['ミャ', 'mya'], ['ミュ', 'myu'], ['ミョ', 'myo'],
        ['リャ', 'rya'], ['リュ', 'ryu'], ['リョ', 'ryo']
      ]
    },
  ],
};

const KANA_EXAMPLES: Record<string, { ja: string; vi: string }[]> = {
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
  'さ': [{ ja: 'さかな (Sakana)', vi: 'Con cá' }, { ja: 'さくら (Sakura)', vi: 'Hoa anh đào' }],
  'し': [{ ja: 'しんかんせん (Shinkansen)', vi: 'Tàu siêu tốc' }, { ja: 'しお (Shio)', vi: 'Muối' }],
  'す': [{ ja: 'すし (Sushi)', vi: 'Sushi' }, { ja: 'すいか (Suika)', vi: 'Dưa hấu' }],
  'せ': [{ ja: 'せんせい (Sensei)', vi: 'Giáo viên' }, { ja: 'せっけん (Sekken)', vi: 'Xà phòng' }],
  'そ': [{ ja: 'そら (Sora)', vi: 'Bầu trời' }, { ja: 'そうじ (Souji)', vi: 'Dọn dẹp' }],
  'た': [{ ja: 'たまご (Tamago)', vi: 'Quả trứng' }, { ja: 'たべる (Taberu)', vi: 'Ăn' }],
  'ち': [{ ja: 'ちず (Chizu)', vi: 'Bản đồ' }, { ja: 'ちかい (Chikai)', vi: 'Gần' }],
  'つ': [{ ja: 'つくえ (Tsukue)', vi: 'Cái bàn' }, { ja: 'つめたい (Tsumetai)', vi: 'Lạnh' }],
  'て': [{ ja: 'てがみ (Tegami)', vi: 'Lá thư' }, { ja: 'てんき (Tenki)', vi: 'Thời tiết' }],
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
};

const KATA_TO_HIRA: Record<string, string> = {
  'ア': 'あ', 'イ': 'い', 'ウ': 'う', 'エ': 'え', 'オ': 'お',
  'カ': 'か', 'キ': 'き', 'ク': 'く', 'ケ': 'け', 'コ': 'こ',
  'サ': 'さ', 'シ': 'し', 'ス': 'す', 'セ': 'せ', 'ソ': 'そ',
  'タ': 'た', 'チ': 'ち', 'ツ': 'つ', 'テ': 'て', 'ト': 'と',
  'ナ': 'な', 'ニ': 'に', 'ヌ': 'ぬ', 'ネ': 'ね', 'ノ': 'の',
  'ハ': 'は', 'ヒ': 'ひ', 'フ': 'ふ', 'ヘ': 'へ', 'ホ': 'ho',
  'マ': 'ま', 'ミ': 'み', 'ム': 'む', 'メ': 'め', 'モ': 'も',
};

// ---- TTS speaking function ----
function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    window.speechSynthesis.speak(utterance);
  }
}

// ---- Shuffle helper ----
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function KanaPage() {
  const { isLoggedIn } = useAuth();
  const { trackEvent } = useGamification();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'hiragana' | 'katakana'>('hiragana');
  const [subGroup, setSubGroup] = useState<'basic' | 'dakuten' | 'yoon'>('basic');
  const [progressList, setProgressList] = useState<KanaProgressItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'grid' | 'practice'>('grid');

  // Character Detail Modal state
  const [detailChar, setDetailChar] = useState<{ character: string; romaji: string; type: 'hiragana' | 'katakana' } | null>(null);

  // Quick practice quiz state
  const [quizItem, setQuizItem] = useState<{ character: string; romaji: string; type: 'hiragana' | 'katakana' } | null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string>('');

  // Test Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testScreen, setTestScreen] = useState<'config' | 'session' | 'results'>('config');
  const [testConfig, setTestConfig] = useState({
    type: 'all' as 'all' | 'hiragana' | 'katakana',
    format: 'mixed' as 'mixed' | 'kana-romaji' | 'romaji-kana',
    count: 20,
  });

  interface TestQuestion {
    char: string;
    romaji: string;
    type: 'hiragana' | 'katakana';
    format: 'kana-romaji' | 'romaji-kana';
    questionText: string;
    correctAnswer: string;
    options: string[];
  }

  // Active test session variables
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [testAnswers, setTestAnswers] = useState<{ selected: string; correct: boolean }[]>([]);
  const [testTime, setTestTime] = useState(0);
  const [testTimerActive, setTestTimerActive] = useState(false);

  // Fetch initial progress
  const fetchProgress = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await api.getKanaProgress();
      setProgressList(data);
    } catch (err) {
      console.error('Failed to fetch kana progress:', err);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Khóa cuộn nền khi mở các modal
  useEffect(() => {
    if (detailChar || testModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [detailChar, testModalOpen]);

  // Build progress helper map
  const progressMap = useMemo(() => {
    const map = new Map<string, 'new' | 'learning' | 'mastered'>();
    progressList.forEach(item => {
      map.set(`${item.kana_type}:${item.character}`, item.status);
    });
    return map;
  }, [progressList]);

  // Derive flat list of all characters in current tab
  const tabCharacters = useMemo(() => {
    return KANA[activeTab].flatMap(g =>
      g.items.map(([character, romaji]) => ({ character, romaji, type: activeTab }))
    );
  }, [activeTab]);

  // Filter groups
  const groupsToDisplay = useMemo(() => {
    const groups = KANA[activeTab];
    if (subGroup === 'dakuten') return groups.filter(g => g.group === 'Dakuten');
    if (subGroup === 'yoon') return groups.filter(g => g.group === 'Yoon');
    return groups.filter(g => g.group !== 'Dakuten' && g.group !== 'Yoon');
  }, [activeTab, subGroup]);

  // Metrics
  const stats = useMemo(() => {
    const total = tabCharacters.length;
    let mastered = 0;
    let learning = 0;
    tabCharacters.forEach(item => {
      const status = progressMap.get(`${item.type}:${item.character}`);
      if (status === 'mastered') mastered++;
      else if (status === 'learning') learning++;
    });
    return { total, mastered, learning, percent: total ? Math.round((mastered / total) * 100) : 0 };
  }, [tabCharacters, progressMap]);

  // Save character status helper
  async function handleSaveProgress(
    character: string,
    status: 'new' | 'learning' | 'mastered',
    type: 'hiragana' | 'katakana',
    silent = false
  ) {
    if (!isLoggedIn) {
      if (!silent) {
        showToast('Bạn cần đăng nhập để lưu tiến độ!', 'info');
      }
      return;
    }
    try {
      const apiStatus = status === 'new' ? 'learning' : status;
      await api.updateKanaProgress(type, character, apiStatus);
      if (status === 'new') {
        setProgressList(prev => prev.filter(p => !(p.character === character && p.kana_type === type)));
      } else {
        setProgressList(prev => {
          const idx = prev.findIndex(p => p.character === character && p.kana_type === type);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], status };
            return copy;
          }
          return [...prev, { kana_type: type, character, status }];
        });
      }
      if (status === 'mastered') {
        void trackEvent('kana_mastered');
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }

  // Quick Practice Quiz Generator
  const generateQuickQuiz = useCallback(() => {
    const items = KANA[activeTab].flatMap(g =>
      g.items.map(([character, romaji]) => ({ character, romaji, type: activeTab }))
    );
    if (items.length === 0) return;
    const randomItem = items[Math.floor(Math.random() * items.length)];
    const otherItems = items.filter(i => i.romaji !== randomItem.romaji);
    const shuffledOthers = shuffleArray(otherItems).slice(0, 3);
    const options = shuffleArray([randomItem.romaji, ...shuffledOthers.map(o => o.romaji)]);

    setQuizItem(randomItem);
    setQuizOptions(options);
    setQuizAnswered(null);
    setQuizFeedback('');
  }, [activeTab]);

  useEffect(() => {
    generateQuickQuiz();
  }, [activeTab, generateQuickQuiz]);

  function handleQuickQuizAnswer(selected: string) {
    if (!quizItem || quizAnswered) return;
    setQuizAnswered(selected);
    const isCorrect = selected === quizItem.romaji;
    if (isCorrect) {
      setQuizFeedback('Chính xác! +1 XP');
      void trackEvent('kana_quiz_correct');
      void handleSaveProgress(quizItem.character, 'mastered', quizItem.type, true);
    } else {
      setQuizFeedback(`Chưa đúng. Đáp án là: ${quizItem.romaji.toUpperCase()}`);
      void handleSaveProgress(quizItem.character, 'learning', quizItem.type, true);
    }
    setTimeout(generateQuickQuiz, 1500);
  }

  // Character Detail Modal Helper
  const selectedCharacterProgress = useMemo(() => {
    if (!detailChar) return 'new';
    return progressMap.get(`${detailChar.type}:${detailChar.character}`) || 'new';
  }, [detailChar, progressMap]);

  const selectedCharacterExamples = useMemo(() => {
    if (!detailChar) return [];
    const hira = KATA_TO_HIRA[detailChar.character] || detailChar.character;
    return KANA_EXAMPLES[hira] || [{ ja: `${detailChar.character} (Ví dụ)`, vi: 'Ký tự này đang chờ cập nhật thêm ví dụ.' }];
  }, [detailChar]);

  // Full Test logic
  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (testTimerActive) {
      interval = setInterval(() => {
        setTestTime(t => t + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [testTimerActive]);

  function formatTestTime(sec: number) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function startTest() {
    let pool: { character: string; romaji: string; type: 'hiragana' | 'katakana' }[] = [];
    const type = testConfig.type;
    if (type === 'all') {
      pool = [
        ...KANA.hiragana.flatMap(g => g.items.map(([c, r]) => ({ character: c, romaji: r, type: 'hiragana' as const }))),
        ...KANA.katakana.flatMap(g => g.items.map(([c, r]) => ({ character: c, romaji: r, type: 'katakana' as const }))),
      ];
    } else {
      pool = KANA[type].flatMap(g => g.items.map(([c, r]) => ({ character: c, romaji: r, type })));
    }

    if (pool.length < 4) {
      showToast('Không đủ dữ liệu chữ cái để kiểm tra!', 'error');
      return;
    }

    const shuffled = shuffleArray(pool);
    const count = Math.min(testConfig.count, shuffled.length);

    const questions: TestQuestion[] = shuffled.slice(0, count).map(item => {
      let qFormat = testConfig.format;
      if (qFormat === 'mixed') {
        qFormat = Math.random() > 0.5 ? 'kana-romaji' : 'romaji-kana';
      }

      const distractors = shuffleArray(pool.filter(p => p.type === item.type && p.character !== item.character)).slice(0, 3);

      let questionText = '';
      let correctAnswer = '';
      let options: string[] = [];

      if (qFormat === 'kana-romaji') {
        questionText = item.character;
        correctAnswer = item.romaji;
        options = shuffleArray([item.romaji, ...distractors.map(d => d.romaji)]);
      } else {
        questionText = item.romaji;
        correctAnswer = item.character;
        options = shuffleArray([item.character, ...distractors.map(d => d.character)]);
      }

      return {
        char: item.character,
        romaji: item.romaji,
        type: item.type,
        format: qFormat,
        questionText,
        correctAnswer,
        options,
      };
    });

    setTestQuestions(questions);
    setCurrentQuestionIdx(0);
    setTestAnswers([]);
    setTestTime(0);
    setTestScreen('session');
    setTestModalOpen(true);
    setTestTimerActive(true);
  }

  function handleTestAnswer(selected: string) {
    const currentQ = testQuestions[currentQuestionIdx];
    const isCorrect = selected === currentQ.correctAnswer;
    setTestAnswers(prev => [...prev, { selected, correct: isCorrect }]);

    void handleSaveProgress(currentQ.char, isCorrect ? 'mastered' : 'learning', currentQ.type, true);

    if (currentQuestionIdx + 1 >= testQuestions.length) {
      setTestTimerActive(false);
      setTestScreen('results');
      const correctCount = testAnswers.filter(a => a.correct).length + (isCorrect ? 1 : 0);
      const isPerfect = correctCount === testQuestions.length;
      void trackEvent('test_complete', { score: isPerfect ? 100 : Math.round((correctCount / testQuestions.length) * 100) });
    } else {
      setCurrentQuestionIdx(idx => idx + 1);
    }
  }

  const testStats = useMemo(() => {
    if (testQuestions.length === 0 || testAnswers.length < testQuestions.length) return { correct: 0, percent: 0, xp: 0 };
    const correct = testAnswers.filter(a => a.correct).length;
    const percent = Math.round((correct / testQuestions.length) * 100);
    const xp = correct + (percent === 100 ? 15 : 0);
    return { correct, percent, xp };
  }, [testAnswers, testQuestions]);

  return (
    <div className="flex flex-col h-[calc(100dvh-110px)] lg:h-[calc(100vh-160px)] overflow-hidden space-y-4 pb-2">
      {/* Header — cố định */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold max-sm:text-xl text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Học Chữ Cái Kana
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Luyện tập Hiragana và Katakana mỗi ngày</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface-variant/50 p-1 rounded-xl flex-shrink-0">
          <button
            onClick={() => { setActiveTab('hiragana'); setSubGroup('basic'); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'hiragana' ? 'bg-surface text-primary shadow-sm animate-fade-in-up' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Hiragana<span className="hidden sm:inline"> (Chữ mềm)</span>
          </button>
          <button
            onClick={() => { setActiveTab('katakana'); setSubGroup('basic'); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'katakana' ? 'bg-surface text-primary shadow-sm animate-fade-in-up' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Katakana<span className="hidden sm:inline"> (Chữ cứng)</span>
          </button>
        </div>
      </div>

      {/* Mobile Section switcher (Bảng chữ / Luyện tập) */}
      <div className="flex lg:hidden gap-1 bg-surface-variant/30 p-1 rounded-xl w-full flex-shrink-0">
        <button
          onClick={() => setMobileTab('grid')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'grid' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Bảng chữ cái
        </button>
        <button
          onClick={() => setMobileTab('practice')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'practice' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Luyện tập & Test
        </button>
      </div>

      {/* Main Content Area (2 cột trái phải) */}
      <div className="flex-grow overflow-hidden min-h-0">
        <div className="flex flex-col lg:flex-row gap-6 pb-4 lg:pb-0 h-full">
          
          {/* Alphabet Grid (bên trái) */}
          <div className={`flex-1 flex flex-col h-full overflow-hidden ${mobileTab === 'grid' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* Sticky Header Wrapper */}
            <div className="sticky top-0 z-10 bg-[#f8fafb] pt-2 pb-4 space-y-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
              {/* Progress Card */}
              <div className="card p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-gray-100 shadow-sm">
                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1">
                    <span className="font-bold text-primary">{stats.mastered} / {stats.total} chữ đã thuộc ({stats.percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-outline-variant rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${stats.percent}%` }} />
                  </div>
                </div>
                {/* <div className="flex gap-4 border-l border-gray-100 pl-4 hidden md:flex">
                  <div className="text-center font-semibold">
                    <div className="text-2xl font-bold text-[#f0a868]">{stats.learning}</div>
                    <div className="text-xs text-on-surface-variant">Đang học</div>
                  </div>
                  <div className="text-center font-semibold">
                    <div className="text-2xl font-bold text-success">{stats.mastered}</div>
                    <div className="text-xs text-on-surface-variant">Đã thuộc</div>
                  </div>
                </div> */}
              </div>

              {/* Sub-tabs BASIC / DAKUTEN / YOON */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'basic' as const, label: 'Chữ cơ bản' },
                  { value: 'dakuten' as const, label: 'Âm đục (Dakuten)' },
                  { value: 'yoon' as const, label: 'Âm ghép (Yōon)' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSubGroup(opt.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      subGroup === opt.value
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kana Grid Display */}
            <div className="space-y-6 flex-grow overflow-y-auto pr-2 scrollbar-thin min-h-0 pb-4 mt-6">
              {groupsToDisplay.map(group => {
                const isYoon = group.group === 'Yoon';
                const gridColsClass = isYoon 
                  ? 'grid grid-cols-3 gap-2 sm:gap-3' 
                  : 'grid grid-cols-5 gap-1.5 sm:gap-2.5';

                return (
                  <section key={group.group} className="space-y-2 animate-fade-in-up">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant pl-1">
                      {group.group}
                    </h3>
                    <div className={gridColsClass}>
                      {group.items.map(([char, romaji]) => {
                        const status = progressMap.get(`${activeTab}:${char}`) || 'new';
                        const statusBorder =
                          status === 'mastered' ? 'border-success bg-success-light/30' :
                          status === 'learning' ? 'border-[#f0a868] bg-[#fffaf3]' :
                          'border-outline-variant hover:border-primary bg-white';

                        return (
                          <article
                            key={char}
                            onClick={() => setDetailChar({ character: char, romaji, type: activeTab })}
                            className={`relative min-h-[76px] sm:min-h-[96px] md:min-h-[100px] border-2 rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${statusBorder}`}
                          >
                            {/* Speak button - desktop only */}
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); speak(char); }}
                              className="hidden sm:flex absolute top-1.5 left-1.5 text-on-surface-variant/40 hover:text-primary transition-colors p-1"
                              title="Phát âm"
                            >
                              <span className="material-symbols-outlined text-sm">volume_up</span>
                            </button>

                            {/* Status indicator dot - desktop (clickable) */}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                let next: 'learning' | 'mastered' | 'new' = 'learning';
                                if (status === 'learning') next = 'mastered';
                                else if (status === 'mastered') next = 'new';
                                void handleSaveProgress(char, next, activeTab);
                              }}
                              className="hidden sm:flex absolute top-2.5 right-2.5 w-3 h-3 rounded-full items-center justify-center"
                              title="Đổi nhanh trạng thái"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                status === 'mastered' ? 'bg-success' :
                                status === 'learning' ? 'bg-[#f0a868]' :
                                'bg-gray-300'
                              }`} />
                            </button>

                            {/* Status indicator dot - mobile (non-clickable indicator) */}
                            <div className="flex sm:hidden absolute top-1 right-1 w-2.5 h-2.5 items-center justify-center pointer-events-none">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                status === 'mastered' ? 'bg-success' :
                                status === 'learning' ? 'bg-[#f0a868]' :
                                'bg-gray-300'
                              }`} />
                            </div>

                            <span
                              className="text-lg sm:text-2xl font-extrabold text-on-surface mt-1.5 sm:mt-2 transition-transform duration-200 hover:scale-110"
                              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                            >
                              {char}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-on-surface-variant font-bold tracking-wider mt-0.5 sm:mt-1 uppercase">
                              {romaji}
                            </span>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          {/* Sidebar (bên phải) */}
          <div className={`w-full lg:w-[320px] space-y-6 flex-shrink-0 h-full overflow-y-auto pr-1 pb-4 scrollbar-thin ${mobileTab === 'practice' ? 'block' : 'hidden lg:block'}`}>
            {/* Quick Quiz Card */}
            {quizItem && (
              <div className="card p-6 border border-outline-variant relative overflow-hidden bg-white shadow-sm">
                <div className="absolute top-4 left-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Luyện Tập Nhanh
                </div>
                <div className="flex flex-col items-center justify-center py-6 mt-2">
                  <div
                    className="text-5xl font-black text-primary leading-none mb-4 animate-pulse"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    {quizItem.character}
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {quizOptions.map(opt => {
                      const isAnswered = quizAnswered !== null;
                      const isSelected = quizAnswered === opt;
                      const isCorrectOpt = opt === quizItem.romaji;

                      const btnStyle =
                        isAnswered && isCorrectOpt ? 'bg-success text-white border-success' :
                        isAnswered && isSelected ? 'bg-error text-white border-error' :
                        'border-outline-variant hover:border-primary hover:bg-primary-50 bg-white text-on-surface';

                      return (
                        <button
                          key={opt}
                          onClick={() => handleQuickQuizAnswer(opt)}
                          disabled={isAnswered}
                          className={`py-2 border-2 rounded-xl font-bold text-sm text-center transition-all ${btnStyle}`}
                        >
                          {opt.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                  {quizFeedback && (
                    <div className={`text-xs font-bold mt-4 animate-fade-in-up text-center ${
                      quizFeedback.includes('Chính xác') ? 'text-success' : 'text-error'
                    }`}>
                      {quizFeedback}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test Section Starter */}
            <div className="card p-5 border border-outline-variant space-y-4 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl">quiz</span>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Bài Kiểm Tra Tổng Hợp</h3>
                  <p className="text-xs text-on-surface-variant">Làm bài test chấm điểm và nhận XP</p>
                </div>
              </div>
              <button
                onClick={() => setTestModalOpen(true)}
                className="w-full bg-[#f0f7f6] text-primary hover:bg-primary hover:text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">play_arrow</span>
                Bắt đầu kiểm tra
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modals ở dưới cùng */}
      {/* ── CHARACTER DETAIL MODAL ── */}
      {detailChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailChar(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up z-10">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Chi tiết ký tự
              </h3>
              <button
                onClick={() => setDetailChar(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-on-surface-variant/60"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 bg-[#f0f7f6] rounded-2xl flex flex-col items-center justify-center relative shadow-inner">
                  <span
                    className="text-5xl font-extrabold text-primary leading-none"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    {detailChar.character}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-2">
                    {detailChar.romaji}
                  </span>
                  <button
                    onClick={() => speak(detailChar.character)}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-primary hover:scale-105 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">volume_up</span>
                  </button>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Trạng thái học</span>
                    <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      selectedCharacterProgress === 'mastered' ? 'bg-[#f4fbf5] text-[#2e7d32]' :
                      selectedCharacterProgress === 'learning' ? 'bg-[#fffaf3] text-[#d98b42]' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        selectedCharacterProgress === 'mastered' ? 'bg-success' :
                        selectedCharacterProgress === 'learning' ? 'bg-[#f0a868]' :
                        'bg-gray-400'
                      }`} />
                      {selectedCharacterProgress === 'mastered' ? 'Đã thuộc' :
                       selectedCharacterProgress === 'learning' ? 'Đang học' :
                       'Chưa học'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Bảng chữ cái</span>
                    <div className="text-xs font-semibold text-on-surface mt-0.5">
                      {detailChar.type === 'hiragana' ? 'Hiragana (Chữ mềm)' : 'Katakana (Chữ cứng)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Example words */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Từ vựng ví dụ</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedCharacterExamples.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface-dim rounded-xl">
                      <span className="font-bold text-on-surface" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {ex.ja}
                      </span>
                      <span className="text-xs font-semibold text-primary">{ex.vi}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                {[
                  { val: 'new' as const, label: 'Chưa học', icon: 'radio_button_unchecked', style: 'hover:bg-gray-50 border-gray-200 text-on-surface-variant' },
                  { val: 'learning' as const, label: 'Đang học', icon: 'menu_book', style: 'hover:bg-[#fffaf3] hover:border-[#f0a868] text-[#f0a868]' },
                  { val: 'mastered' as const, label: 'Đã thuộc', icon: 'check_circle', style: 'hover:bg-[#f4fbf5] hover:border-[#4caf50] text-[#4caf50]' },
                ].map(opt => {
                  const isActive = selectedCharacterProgress === opt.val;
                  const activeBorder =
                    isActive && opt.val === 'mastered' ? 'border-[#4caf50] bg-[#f4fbf5]' :
                    isActive && opt.val === 'learning' ? 'border-[#f0a868] bg-[#fffaf3]' :
                    isActive && opt.val === 'new' ? 'border-gray-300 bg-gray-100' :
                    '';

                  return (
                    <button
                      key={opt.val}
                      onClick={() => {
                        void handleSaveProgress(detailChar.character, opt.val, detailChar.type);
                        setDetailChar(null);
                      }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border font-bold text-[10px] transition-all ${opt.style} ${activeBorder}`}
                    >
                      <span className="material-symbols-outlined text-base">{opt.icon}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KANA TEST MODAL (FULL SCREEN) ── */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setTestModalOpen(false)} />
          <div className="relative bg-white w-full sm:rounded-2xl shadow-2xl max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden z-10 animate-fade-in-up">
            
            {/* Screen 1: Config */}
            {testScreen === 'config' && (
              <div className="flex flex-col h-full p-6 sm:p-8 space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Bài Kiểm Tra Kana
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">Đánh giá khả năng nhớ bảng chữ cái Kana</p>
                  </div>
                  <button onClick={() => setTestModalOpen(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-on-surface-variant/60">
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Scope config */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phạm vi kiểm tra</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'all' as const, label: 'Cả hai' },
                        { val: 'hiragana' as const, label: 'Hiragana' },
                        { val: 'katakana' as const, label: 'Katakana' },
                      ].map(o => (
                        <button
                          key={o.val}
                          type="button"
                          onClick={() => setTestConfig(c => ({ ...c, type: o.val }))}
                          className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                            testConfig.type === o.val ? 'bg-primary text-white border-primary border-transparent' : 'bg-white text-on-surface-variant hover:bg-gray-50 border-outline-variant'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format config */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Định dạng câu hỏi</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'mixed' as const, label: 'Trộn lẫn' },
                        { val: 'kana-romaji' as const, label: 'Chữ → Đọc' },
                        { val: 'romaji-kana' as const, label: 'Đọc → Chữ' },
                      ].map(o => (
                        <button
                          key={o.val}
                          type="button"
                          onClick={() => setTestConfig(c => ({ ...c, format: o.val }))}
                          className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                            testConfig.format === o.val ? 'bg-primary text-white border-primary border-transparent' : 'bg-white text-on-surface-variant hover:bg-gray-50 border-outline-variant'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Questions count */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số lượng câu hỏi</label>
                    <div className="flex gap-2">
                      {[10, 20, 40].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTestConfig(cfg => ({ ...cfg, count: c }))}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                            testConfig.count === c ? 'bg-primary text-white border-primary border-transparent' : 'bg-white text-on-surface-variant hover:bg-gray-50 border-outline-variant'
                          }`}
                        >
                          {c} câu
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gamification tip */}
                <div className="bg-[#f0f7f6] border border-primary/20 p-4 rounded-2xl flex items-start gap-3 mt-4">
                  <span className="material-symbols-outlined text-primary text-xl">emoji_events</span>
                  <div className="text-xs text-primary-dark">
                    <span className="font-bold block">Phần thưởng Gamification</span>
                    Nhận 1 XP cho mỗi câu đúng. Đạt 100% nhận thêm +15 XP Hoàn hảo. Giới hạn XP hàng ngày tối đa 150 XP.
                  </div>
                </div>

                <button
                  onClick={startTest}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-1.5 mt-auto"
                >
                  Bắt đầu thi ngay
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Screen 2: Session */}
            {testScreen === 'session' && testQuestions[currentQuestionIdx] && (
              <div className="flex flex-col h-full p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
                      <span>Đang làm: {currentQuestionIdx + 1} / {testQuestions.length}</span>
                      <span>{Math.round(((currentQuestionIdx + 1) / testQuestions.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-outline-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIdx + 1) / testQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-dim rounded-xl font-mono font-bold text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-base leading-none">timer</span>
                    {formatTestTime(testTime)}
                  </div>
                </div>

                {/* Question Character panel */}
                <div className="flex-1 flex flex-col items-center justify-center py-12 bg-surface-dim rounded-2xl border border-outline-variant/30 min-h-[180px] relative">
                  <span className="absolute top-3 left-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {testQuestions[currentQuestionIdx].format === 'kana-romaji' ? 'Chọn Romaji của chữ cái sau' : 'Chọn chữ cái có cách đọc sau'}
                  </span>
                  <div
                    className="text-6xl font-black text-on-surface leading-none"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    {testQuestions[currentQuestionIdx].questionText}
                  </div>
                </div>

                {/* Options grid */}
                <div className="grid grid-cols-2 gap-3 pb-2">
                  {testQuestions[currentQuestionIdx].options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleTestAnswer(opt)}
                      className="py-3 border-2 border-outline-variant hover:border-primary hover:bg-primary-50 rounded-2xl font-bold text-base transition-all flex items-center justify-center"
                    >
                      {opt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Screen 3: Results */}
            {testScreen === 'results' && (
              <div className="flex flex-col h-full p-6 sm:p-8 space-y-6 overflow-y-auto">
                <div className="text-center space-y-1">
                  <div className="inline-flex p-3 bg-primary-50 text-primary rounded-full mb-1">
                    <span className="material-symbols-outlined text-3xl">emoji_events</span>
                  </div>
                  <h2 className="text-xl font-black text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Kết Quả Kiểm Tra
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {testStats.percent === 100 ? 'Tuyệt vời! Bạn đạt điểm tối đa hoàn hảo 💯' : 'Hoàn thành tốt! Hãy tiếp tục luyện tập.'}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-surface-dim rounded-2xl text-center space-y-0.5">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Đúng</span>
                    <div className="text-lg font-black text-primary">{testStats.correct} / {testQuestions.length}</div>
                  </div>
                  <div className="p-3 bg-surface-dim rounded-2xl text-center space-y-0.5">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tỉ lệ</span>
                    <div className="text-lg font-black text-primary">{testStats.percent}%</div>
                  </div>
                  <div className="p-3 bg-surface-dim rounded-2xl text-center space-y-0.5">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Thời gian</span>
                    <div className="text-lg font-black text-on-surface">{formatTestTime(testTime)}</div>
                  </div>
                </div>

                {/* XP Earned Card */}
                <div className="bg-[#fffbeb] border border-[#fef3c7] p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <h4 className="font-extrabold text-amber-800 text-xs">Điểm XP nhận được</h4>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        +1 XP cho mỗi câu đúng {testStats.percent === 100 && '+ 15 XP Perfect Bonus'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-amber-700">+{testStats.xp} XP</span>
                </div>

                {/* Question review */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs text-on-surface flex items-center justify-between">
                    <span>Xem lại câu hỏi</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">Hiển thị câu sai</span>
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {testQuestions.map((q, i) => {
                      const ans = testAnswers[i];
                      if (!ans || ans.correct) return null;
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-red-50 rounded-xl text-xs text-red-800 border border-red-100">
                          <div>
                            <span className="font-bold font-['Noto_Sans_JP']">
                              {q.questionText}
                            </span>
                            <span className="text-on-surface-variant/70 ml-2">
                              (Bạn chọn: {ans.selected.toUpperCase()})
                            </span>
                          </div>
                          <span className="font-semibold text-error">Đáp án: {q.correctAnswer.toUpperCase()}</span>
                        </div>
                      );
                    })}
                    {testAnswers.every(a => a.correct) && (
                      <div className="text-center text-xs text-on-surface-variant italic py-3">
                        Bạn trả lời đúng tất cả câu hỏi!
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setTestScreen('config')}
                    className="flex-1 py-3 border border-outline-variant hover:bg-gray-50 rounded-2xl font-bold text-xs text-on-surface"
                  >
                    Test mới
                  </button>
                  <button
                    onClick={() => setTestModalOpen(false)}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-xs shadow-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default KanaPage;
