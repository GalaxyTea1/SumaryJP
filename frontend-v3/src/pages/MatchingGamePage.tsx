// ============================================
// MatchingGamePage.tsx — Card Matching Game
// React 19 + TypeScript + Tailwind CSS v4
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGamification } from '@/context/GamificationContext';
import { api } from '@/api';
import type { Kanji, Vocabulary } from '@/types';

// --- KANA DATA ---
interface KanaItem {
  char: string;
  romaji: string;
  meaning: string;
}

const KANA_HIRAGANA: KanaItem[] = [
  { char: 'あ', romaji: 'a', meaning: 'Mưa / Kẹo' },
  { char: 'い', romaji: 'i', meaning: 'Con chó' },
  { char: 'う', romaji: 'u', meaning: 'Biển' },
  { char: 'え', romaji: 'e', meaning: 'Bút chì' },
  { char: 'お', romaji: 'o', meaning: 'Trà' },
  { char: 'か', romaji: 'ka', meaning: 'Cái ô' },
  { char: 'き', romaji: 'ki', meaning: 'Vé' },
  { char: 'く', romaji: 'ku', meaning: 'Xe ô tô' },
  { char: 'け', romaji: 'ke', meaning: 'Cục tẩy' },
  { char: 'こ', romaji: 'ko', meaning: 'Trẻ em' },
  { char: 'さ', romaji: 'sa', meaning: 'Con cá' },
  { char: 'し', romaji: 'shi', meaning: 'Muối' },
  { char: 'す', romaji: 'su', meaning: 'Sushi' },
  { char: 'せ', romaji: 'se', meaning: 'Giáo viên' },
  { char: 'そ', romaji: 'so', meaning: 'Bầu trời' },
  { char: 'た', romaji: 'ta', meaning: 'Quả trứng' },
  { char: 'ち', romaji: 'chi', meaning: 'Bản đồ' },
  { char: 'つ', romaji: 'tsu', meaning: 'Cái bàn' },
  { char: 'て', romaji: 'te', meaning: 'Lá thư' },
  { char: 'と', romaji: 'to', meaning: 'Bạn bè' },
  { char: 'な', romaji: 'na', meaning: 'Mùa hè' },
  { char: 'に', romaji: 'ni', meaning: 'Nước Nhật' },
  { char: 'ぬ', romaji: 'nu', meaning: 'Tranh tô màu' },
  { char: 'ね', romaji: 'ne', meaning: 'Con mèo' },
  { char: 'の', romaji: 'no', meaning: 'Đồ uống' },
  { char: 'は', romaji: 'ha', meaning: 'Hoa / Mũi' },
  { char: 'ひ', romaji: 'hi', meaning: 'Máy bay' },
  { char: 'ふ', romaji: 'fu', meaning: 'Con thuyền' },
  { char: 'へ', romaji: 'he', meaning: 'Căn phòng' },
  { char: 'ほ', romaji: 'ho', meaning: 'Quyển sách' },
  { char: 'ま', romaji: 'ma', meaning: 'Thành phố' },
  { char: 'み', romaji: 'mi', meaning: 'Nước' },
  { char: 'む', romaji: 'mu', meaning: 'Côn trùng' },
  { char: 'め', romaji: 'me', meaning: 'Mắt' },
  { char: 'も', romaji: 'mo', meaning: 'Khu rừng' },
  { char: 'や', romaji: 'ya', meaning: 'Rau củ' },
  { char: 'ゆ', romaji: 'yu', meaning: 'Tuyết' },
  { char: 'よ', romaji: 'yo', meaning: 'Ban đêm' },
  { char: 'ら', romaji: 'ra', meaning: 'Tuần sau' },
  { char: 'り', romaji: 'ri', meaning: 'Quả táo' },
  { char: 'る', romaji: 'ru', meaning: 'Làm (suru)' },
  { char: 'れ', romaji: 're', meaning: 'Luyện tập' },
  { char: 'ろ', romaji: 'ro', meaning: 'Bồn tắm' },
  { char: 'わ', romaji: 'wa', meaning: 'Tôi' },
  { char: 'を', romaji: 'wo', meaning: 'Đọc sách' },
  { char: 'ん', romaji: 'n', meaning: 'Nước Nhật' }
];

const KANA_KATAKANA: KanaItem[] = [
  { char: 'ア', romaji: 'a', meaning: 'Mưa / Kẹo' },
  { char: 'イ', romaji: 'i', meaning: 'Con chó' },
  { char: 'ウ', romaji: 'u', meaning: 'Biển' },
  { char: 'エ', romaji: 'e', meaning: 'Bút chì' },
  { char: 'オ', romaji: 'o', meaning: 'Trà' },
  { char: 'カ', romaji: 'ka', meaning: 'Cái ô' },
  { char: 'キ', romaji: 'ki', meaning: 'Vé' },
  { char: 'ク', romaji: 'ku', meaning: 'Xe ô tô' },
  { char: 'ケ', romaji: 'ke', meaning: 'Cục tẩy' },
  { char: 'コ', romaji: 'ko', meaning: 'Trẻ em' },
  { char: 'サ', romaji: 'sa', meaning: 'Con cá' },
  { char: 'シ', romaji: 'shi', meaning: 'Muối' },
  { char: 'ス', romaji: 'su', meaning: 'Sushi' },
  { char: 'セ', romaji: 'se', meaning: 'Giáo viên' },
  { char: 'ソ', romaji: 'so', meaning: 'Bầu trời' },
  { char: 'タ', romaji: 'ta', meaning: 'Quả trứng' },
  { char: 'チ', romaji: 'chi', meaning: 'Bản đồ' },
  { char: 'ツ', romaji: 'tsu', meaning: 'Cái bàn' },
  { char: 'テ', romaji: 'te', meaning: 'Lá thư' },
  { char: 'ト', romaji: 'to', meaning: 'Bạn bè' },
  { char: 'ナ', romaji: 'na', meaning: 'Mùa hè' },
  { char: 'ニ', romaji: 'ni', meaning: 'Nước Nhật' },
  { char: 'ヌ', romaji: 'nu', meaning: 'Tranh tô màu' },
  { char: 'ネ', romaji: 'ne', meaning: 'Con mèo' },
  { char: 'ノ', romaji: 'no', meaning: 'Đồ uống' },
  { char: 'ハ', romaji: 'ha', meaning: 'Hoa / Mũi' },
  { char: 'ヒ', romaji: 'hi', meaning: 'Máy bay' },
  { char: 'フ', romaji: 'fu', meaning: 'Con thuyền' },
  { char: 'ヘ', romaji: 'he', meaning: 'Căn phòng' },
  { char: 'ホ', romaji: 'ho', meaning: 'Quyển sách' },
  { char: 'マ', romaji: 'ma', meaning: 'Thành phố' },
  { char: 'ミ', romaji: 'mi', meaning: 'Nước' },
  { char: 'ム', romaji: 'mu', meaning: 'Côn trùng' },
  { char: 'メ', romaji: 'me', meaning: 'Mắt' },
  { char: 'モ', romaji: 'mo', meaning: 'Khu rừng' },
  { char: 'ヤ', romaji: 'ya', meaning: 'Rau củ' },
  { char: 'ユ', romaji: 'yu', meaning: 'Tuyết' },
  { char: 'ヨ', romaji: 'yo', meaning: 'Ban đêm' },
  { char: 'ラ', romaji: 'ra', meaning: 'Tuần sau' },
  { char: 'リ', romaji: 'ri', meaning: 'Quả táo' },
  { char: 'ル', romaji: 'ru', meaning: 'Làm (suru)' },
  { char: 'レ', romaji: 're', meaning: 'Luyện tập' },
  { char: 'ロ', romaji: 'ro', meaning: 'Bồn tắm' },
  { char: 'ワ', romaji: 'wa', meaning: 'Tôi' },
  { char: 'ヲ', romaji: 'wo', meaning: 'Đọc sách' },
  { char: 'ン', romaji: 'n', meaning: 'Nước Nhật' }
];

// Fallback Kanji dataset
interface KanjiItem {
  kanji: string;
  reading: string;
  meaning: string;
}

const KANJI_FALLBACK: KanjiItem[] = [
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

// --- CARD TYPE DEFINITION ---
interface Card {
  id: string;
  matchId: number;
  content: string;
  isQuestion: boolean;
  isSelected?: boolean;
  isMatched?: boolean;
  isMismatched?: boolean;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function MatchingGamePage() {
  const { data: gamificationData, trackEvent } = useGamification();
  
  // State for loaded database items
  const [apiKanjiList, setApiKanjiList] = useState<Kanji[]>([]);
  const [apiVocabList, setApiVocabList] = useState<Vocabulary[]>([]);
  
  // Game Setup Configurations
  const [gameConfig, setGameConfig] = useState<{
    type: 'hiragana' | 'katakana' | 'kanji';
    mode: 'reading' | 'meaning';
    cardCount: 8 | 12 | 16;
  }>({
    type: 'hiragana',
    mode: 'reading',
    cardCount: 12
  });

  const isMeaningDisabled = gameConfig.type === 'hiragana' || gameConfig.type === 'katakana';

  // Game Engine State
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'victory'>('setup');
  const [cards, setCards] = useState<Card[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const [sessionXp, setSessionXp] = useState<number>(0);
  
  const [selectedFirstId, setSelectedFirstId] = useState<string | null>(null);
  const [selectedSecondId, setSelectedSecondId] = useState<string | null>(null);
  const [lockBoard, setLockBoard] = useState<boolean>(false);

  // Confetti particles state
  const [confetti, setConfetti] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string; emoji: string; scale: number }>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load API data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [kanjis, vocabs] = await Promise.all([
          api.getAllKanji().catch(() => []),
          api.getAllVocabulary().catch(() => [])
        ]);
        setApiKanjiList(kanjis || []);
        setApiVocabList(vocabs || []);
      } catch (err) {
        console.error('Lỗi khi tải trước dữ liệu Kanji/Vocab:', err);
      }
    }
    void fetchData();
  }, []);

  // Timer runner
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Modal Scroll Lock
  useEffect(() => {
    if (gameState === 'victory') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [gameState]);

  // Generate cards
  const startNewGame = useCallback(() => {
    let pool: Array<{ id: string; question: string; reading: string; meaning: string }> = [];

    if (gameConfig.type === 'hiragana') {
      pool = KANA_HIRAGANA.map((item, idx) => ({
        id: `hira_${idx}`,
        question: item.char,
        reading: item.romaji,
        meaning: item.meaning
      }));
    } else if (gameConfig.type === 'katakana') {
      pool = KANA_KATAKANA.map((item, idx) => ({
        id: `kata_${idx}`,
        question: item.char,
        reading: item.romaji,
        meaning: item.meaning
      }));
    } else {
      // Kanji & Vocab
      if (apiKanjiList.length > 0 || apiVocabList.length > 0) {
        const kanjiItems = apiKanjiList.map(k => ({
          id: `db_kanji_${k.id}`,
          question: k.kanji,
          reading: `${k.onyomi || ''} ${k.kunyomi || ''}`.trim() || '—',
          meaning: k.meaning
        }));
        const vocabItems = apiVocabList.map(v => ({
          id: `db_vocab_${v.id}`,
          question: v.japanese,
          reading: v.hiragana || '—',
          meaning: v.meaning
        }));
        pool = [...kanjiItems, ...vocabItems];
      }

      // Fallback
      if (pool.length === 0) {
        pool = KANJI_FALLBACK.map((k, idx) => ({
          id: `fallback_${idx}`,
          question: k.kanji,
          reading: k.reading,
          meaning: k.meaning
        }));
      }
    }

    // Shuffle and pick cards
    const pairCount = gameConfig.cardCount / 2;
    const shuffledPool = shuffleArray(pool);
    const selectedPairs = shuffledPool.slice(0, pairCount);

    const generatedCards: Card[] = [];
    selectedPairs.forEach((pair, index) => {
      const matchValue = gameConfig.mode === 'reading' ? pair.reading : pair.meaning;

      generatedCards.push({
        id: `card_q_${index}`,
        matchId: index,
        content: pair.question,
        isQuestion: true
      });

      generatedCards.push({
        id: `card_a_${index}`,
        matchId: index,
        content: matchValue,
        isQuestion: false
      });
    });

    setCards(shuffleArray(generatedCards));
    setTimer(0);
    setMoves(0);
    setMatchesCount(0);
    setSessionXp(0);
    setSelectedFirstId(null);
    setSelectedSecondId(null);
    setLockBoard(false);
    setGameState('playing');
  }, [gameConfig, apiKanjiList, apiVocabList]);

  const stopGame = useCallback(() => {
    setGameState('setup');
  }, []);

  // Handle card click
  const handleCardClick = (cardId: string) => {
    if (lockBoard) return;
    
    const clickedCard = cards.find(c => c.id === cardId);
    if (!clickedCard || clickedCard.isMatched) return;

    // Deselect if clicking the same card
    if (cardId === selectedFirstId) {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, isSelected: false } : c));
      setSelectedFirstId(null);
      return;
    }

    // Set selected on card
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isSelected: true } : c));

    if (!selectedFirstId) {
      setSelectedFirstId(cardId);
      return;
    }

    // Second card selected
    setSelectedSecondId(cardId);
    setMoves(m => m + 1);

    const firstCard = cards.find(c => c.id === selectedFirstId)!;
    const secondCard = clickedCard;

    const isMatch = firstCard.matchId === secondCard.matchId;

    if (isMatch) {
      // MATCHED SUCCESS
      setLockBoard(true);
      
      // Mark as matched
      setCards(prev => prev.map(c => 
        (c.id === selectedFirstId || c.id === cardId) 
          ? { ...c, isMatched: true, isSelected: false } 
          : c
      ));

      // Track gamification XP
      let xpAwarded = 1;
      async function trackProgress() {
        try {
          if (gameConfig.type === 'hiragana' || gameConfig.type === 'katakana') {
            await trackEvent('kana_quiz_correct');
          } else {
            await trackEvent('vocab_review');
          }
        } catch (e) {
          console.error('Không thể lưu kết quả XP:', e);
        }
      }
      void trackProgress();
      setSessionXp(x => x + xpAwarded);
      setMatchesCount(m => m + 1);

      // Animation delay for hide
      setTimeout(() => {
        setSelectedFirstId(null);
        setSelectedSecondId(null);
        setLockBoard(false);

        // Check victory
        const nextMatchesCount = matchesCount + 1;
        const totalPairs = gameConfig.cardCount / 2;
        if (nextMatchesCount === totalPairs) {
          triggerVictory();
        }
      }, 400);

    } else {
      // MATCHED FAIL
      setLockBoard(true);
      
      // Mark as mismatched
      setCards(prev => prev.map(c => 
        (c.id === selectedFirstId || c.id === cardId) 
          ? { ...c, isMismatched: true } 
          : c
      ));

      // Shake vibration if API supports
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      // Reset mismatch state after animation ends
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          (c.id === selectedFirstId || c.id === cardId) 
            ? { ...c, isMismatched: false, isSelected: false } 
            : c
        ));
        setSelectedFirstId(null);
        setSelectedSecondId(null);
        setLockBoard(false);
      }, 600);
    }
  };

  // Victory Handler
  const triggerVictory = () => {
    setGameState('victory');

    // Victory bonus XP (+5 XP)
    let bonusXp = 5;
    async function trackVictoryEvent() {
      try {
        await trackEvent('flashcard_complete');
      } catch (e) {
        console.error('Không thể cộng bonus XP hoàn thành:', e);
      }
    }
    void trackVictoryEvent();
    setSessionXp(x => x + bonusXp);

    // Launch Confetti
    const emojis = ['🌸', '✨', '🎉', '🇯🇵', '💯', '🔥', '🏆', '⭐'];
    const count = 60;
    const pieces = [];
    for (let i = 0; i < count; i++) {
      pieces.push({
        id: i,
        left: `${Math.random() * 100}vw`,
        top: `-${Math.random() * 20 + 20}px`,
        delay: `${Math.random() * 2}s`,
        duration: `${2.5 + Math.random() * 2.5}s`,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        scale: 0.5 + Math.random() * 1
      });
    }
    setConfetti(pieces);
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalPairs = gameConfig.cardCount / 2;
  const accuracy = moves > 0 ? Math.round((totalPairs / moves) * 100) : 0;

  return (
    <div className="flex flex-col min-h-[80vh] w-full max-w-6xl mx-auto py-6 px-4 animate-fade-in-up">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">extension</span>
            Trò Chơi Ghép Thẻ
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">Rèn luyện phản xạ ghi nhớ Kana và Kanji siêu tốc</p>
        </div>
        
        {/* Live XP Display */}
        <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 px-4 py-2 rounded-full text-primary-500 font-semibold text-sm">
          <span className="material-symbols-outlined text-lg">workspace_premium</span>
          <span>{gamificationData.xp} XP Hệ Thống</span>
        </div>
      </div>

      {/* 1. SETUP SCREEN */}
      {gameState === 'setup' && (
        <div className="max-w-2xl mx-auto w-full bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-card space-y-6">
          <h3 className="text-lg font-bold font-headline border-b border-outline-variant pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            Cấu Hình Trò Chơi
          </h3>

          {/* Option 1: Card Type Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">1. Chọn bộ thẻ học</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setGameConfig(prev => ({ ...prev, type: 'hiragana', mode: 'reading' }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-bold ${
                  gameConfig.type === 'hiragana'
                    ? 'border-primary bg-primary-50 text-primary-dark shadow-sm'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <span className="text-3xl">あ</span>
                <span className="text-sm">Hiragana</span>
              </button>

              <button
                type="button"
                onClick={() => setGameConfig(prev => ({ ...prev, type: 'katakana', mode: 'reading' }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-bold ${
                  gameConfig.type === 'katakana'
                    ? 'border-primary bg-primary-50 text-primary-dark shadow-sm'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <span className="text-3xl">ア</span>
                <span className="text-sm">Katakana</span>
              </button>

              <button
                type="button"
                onClick={() => setGameConfig(prev => ({ ...prev, type: 'kanji' }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-bold ${
                  gameConfig.type === 'kanji'
                    ? 'border-primary bg-primary-50 text-primary-dark shadow-sm'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <span className="text-3xl font-japanese">漢</span>
                <span className="text-sm">Kanji & Từ vựng</span>
              </button>
            </div>
          </div>

          {/* Option 2: Match Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">2. Chế độ ghép cặp</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGameConfig(prev => ({ ...prev, mode: 'reading' }))}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all font-bold text-sm ${
                  gameConfig.mode === 'reading'
                    ? 'border-primary bg-primary-50 text-primary-dark shadow-sm'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <span className="material-symbols-outlined text-lg">translate</span>
                <span>
                  {gameConfig.type === 'kanji'
                    ? 'Kanji → Cách đọc (On/Kun)'
                    : 'Chữ Nhật → Romaji cách đọc'}
                </span>
              </button>

              <button
                type="button"
                disabled={isMeaningDisabled}
                onClick={() => setGameConfig(prev => ({ ...prev, mode: 'meaning' }))}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all font-bold text-sm ${
                  isMeaningDisabled
                    ? 'border-outline-variant bg-surface-container text-on-surface-variant/40 cursor-not-allowed opacity-60'
                    : gameConfig.mode === 'meaning'
                      ? 'border-primary bg-primary-50 text-primary-dark shadow-sm'
                      : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <span className="material-symbols-outlined text-lg">description</span>
                <span className="flex flex-col items-center">
                  <span>Chữ Nhật → Nghĩa Tiếng Việt</span>
                  {isMeaningDisabled && (
                    <span className="text-[10px] font-normal text-on-surface-variant/60 mt-0.5">
                      (Chỉ áp dụng cho Kanji / Từ vựng)
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Option 3: Difficulty Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">3. Số lượng thẻ (Độ khó)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setGameConfig(prev => ({ ...prev, cardCount: 8 }))}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                  gameConfig.cardCount === 8
                    ? 'border-primary bg-primary-50 text-primary-dark'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <span>Dễ</span>
                <span className="text-xs font-normal text-on-surface-variant/70 mt-0.5">8 thẻ (4 cặp)</span>
              </button>

              <button
                type="button"
                onClick={() => setGameConfig(prev => ({ ...prev, cardCount: 12 }))}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                  gameConfig.cardCount === 12
                    ? 'border-primary bg-primary-50 text-primary-dark'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <span>Trung bình</span>
                <span className="text-xs font-normal text-on-surface-variant/70 mt-0.5">12 thẻ (6 cặp)</span>
              </button>

              <button
                type="button"
                onClick={() => setGameConfig(prev => ({ ...prev, cardCount: 16 }))}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                  gameConfig.cardCount === 16
                    ? 'border-primary bg-primary-50 text-primary-dark'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <span>Khó</span>
                <span className="text-xs font-normal text-on-surface-variant/70 mt-0.5">16 thẻ (8 cặp)</span>
              </button>
            </div>
          </div>

          {/* START BUTTON */}
          <button
            type="button"
            onClick={startNewGame}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl transition-all text-base"
          >
            <span className="material-symbols-outlined">play_circle</span>
            Bắt Đầu Chơi
          </button>
        </div>
      )}

      {/* 2. GAME BOARD SCREEN */}
      {gameState === 'playing' && (
        <div className="w-full max-w-4xl mx-auto space-y-6">
          
          {/* Stats bar */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              
              {/* Timer */}
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
                <div className="text-left">
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Thời gian</div>
                  <div className="font-mono font-bold text-lg leading-tight">{formatTime(timer)}</div>
                </div>
              </div>

              {/* Moves */}
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-2xl">swap_horiz</span>
                <div className="text-left">
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Lượt đi</div>
                  <div className="font-bold text-lg leading-tight">{moves}</div>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                <div className="text-left">
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Ghép đúng</div>
                  <div className="font-bold text-lg leading-tight">{matchesCount}/{totalPairs}</div>
                </div>
              </div>

              {/* Session XP */}
              <div className="flex items-center gap-2 text-primary-dark bg-primary-50 px-3.5 py-1.5 rounded-full border border-primary-100">
                <span className="material-symbols-outlined text-base">workspace_premium</span>
                <span className="text-xs font-bold font-mono">+{sessionXp} XP Tích Lũy</span>
              </div>
            </div>

            {/* Quit action */}
            <button
              type="button"
              onClick={stopGame}
              className="text-xs font-bold text-error border border-error/20 hover:bg-error-light/30 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">close</span>
              Thoát Game
            </button>
          </div>

          {/* Cards Grid */}
          <div
            className={`grid gap-4 max-w-3xl mx-auto w-full ${
              gameConfig.cardCount === 8
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-3 sm:grid-cols-4'
            }`}
          >
            {cards.map(card => {
              const isSelected = card.id === selectedFirstId || card.id === selectedSecondId;
              const isMismatched = card.isMismatched;
              const isMatched = card.isMatched;

              // Styling states
              let cardStyle = 'border-outline-variant bg-surface text-on-surface';
              if (isMismatched) {
                cardStyle = 'border-error bg-error-light/30 text-error animate-shake';
              } else if (isMatched) {
                cardStyle = 'border-success bg-success-light text-success cursor-default pointer-events-none opacity-0 invisible duration-300 scale-95';
              } else if (isSelected) {
                cardStyle = 'border-primary bg-primary-50 text-primary-dark scale-103 shadow-md ring-3 ring-primary/20';
              }

              // Text sizes based on length
              const isLongText = card.content.length > 6;
              const textClass = card.isQuestion
                ? 'text-2xl sm:text-3xl font-bold font-japanese'
                : (isLongText ? 'text-[11px] sm:text-xs font-semibold leading-snug px-1.5' : 'text-sm sm:text-base font-bold');

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCardClick(card.id)}
                  disabled={isMatched || lockBoard}
                  className={`flex flex-col items-center justify-center p-4 min-h-[85px] sm:min-h-[105px] border-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer select-none text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${cardStyle}`}
                >
                  <span className={`${textClass} select-none pointer-events-none w-full break-words`}>
                    {card.content}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VICTORY MODAL OVERLAY */}
      {gameState === 'victory' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          
          {/* Confetti Emoji elements */}
          {confetti.map(piece => (
            <div
              key={piece.id}
              className="confetti-piece"
              style={{
                left: piece.left,
                top: piece.top,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                transform: `scale(${piece.scale})`,
              }}
            >
              {piece.emoji}
            </div>
          ))}

          <div className="bg-surface rounded-3xl w-full max-w-md shadow-elevated border border-outline-variant overflow-hidden transform animate-fade-in-up duration-300">
            {/* Header top gradient decoration */}
            <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-center text-white relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto text-4xl mb-3 animate-bounce">
                🏆
              </div>
              <h3 className="text-2xl font-bold font-headline">Tuyệt Vời!</h3>
              <p className="text-sm text-white/90 mt-1">Bạn đã hoàn thành thử thách ghép cặp!</p>
            </div>

            {/* Content Stats body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-surface-dim border border-outline-variant/50 rounded-2xl p-3">
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Thời gian</div>
                  <div className="font-mono font-bold text-base text-on-surface">{formatTime(timer)}</div>
                </div>

                <div className="bg-surface-dim border border-outline-variant/50 rounded-2xl p-3">
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Lượt đi</div>
                  <div className="font-bold text-base text-on-surface">{moves}</div>
                </div>

                <div className="bg-surface-dim border border-outline-variant/50 rounded-2xl p-3">
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Độ chính xác</div>
                  <div className="font-bold text-base text-on-surface">{accuracy}%</div>
                </div>
              </div>

              {/* XP Rewards details */}
              <div className="bg-primary-50 rounded-2xl p-4 flex items-center gap-3 border border-primary-100">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-xl font-bold">
                  ✨
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs text-primary-dark font-bold">Điểm XP Nhận Được</div>
                  <div className="text-[10.5px] text-on-surface-variant mt-0.5">
                    Ghép đúng: {sessionXp - 5} XP + Thắng game: 5 XP
                  </div>
                </div>
                <div className="text-lg font-extrabold text-primary-dark font-mono">+{sessionXp} XP</div>
              </div>

              {/* Actions buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={startNewGame}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                >
                  <span className="material-symbols-outlined text-lg">replay</span>
                  Chơi Lại Lượt Mới
                </button>

                <button
                  type="button"
                  onClick={stopGame}
                  className="w-full bg-surface hover:bg-surface-dim text-on-surface border border-outline font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <span className="material-symbols-outlined text-lg">settings</span>
                  Thay Đổi Cấu Hình
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
