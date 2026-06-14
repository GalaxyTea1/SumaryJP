// ============================================
// FlashcardPage — SumaryJP
// React 19: useReducer cho session state, useEffect cho keyboard
// 3D flip animation thuần CSS
// ============================================

import { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/api';
import { useAuth } from '@/context/AuthContext';
import type { Vocabulary, Kanji, Grammar } from '@/types';

// ---- Types ----
type CardType = 'vocab' | 'kanji' | 'grammar';

type AnyCard = (Vocabulary | Kanji | Grammar) & {
  id: number;
  level?: string;
  lesson?: string | number;
  // vocab
  japanese?: string;
  hiragana?: string;
  meaning: string;
  // kanji
  character?: string;
  kanji?: string;
  onyomi?: string;
  kunyomi?: string;
  example_words?: string;
  // grammar
  pattern?: string;
  example_ja?: string;
  example_vi?: string;
};

// ---- Session state via useReducer ----
interface SessionState {
  cards: AnyCard[];
  currentIndex: number;
  isFlipped: boolean;
  knownIds: Set<number>;
  unknownIds: Set<number>;
  phase: 'config' | 'playing' | 'complete';
}

type SessionAction =
  | { type: 'START'; cards: AnyCard[] }
  | { type: 'FLIP' }
  | { type: 'MARK_KNOWN' }
  | { type: 'MARK_UNKNOWN' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'RESTART' }
  | { type: 'REVIEW_UNKNOWN' };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START':
      return {
        cards: action.cards,
        currentIndex: 0,
        isFlipped: false,
        knownIds: new Set(),
        unknownIds: new Set(),
        phase: 'playing',
      };

    case 'FLIP':
      return { ...state, isFlipped: !state.isFlipped };

    case 'MARK_KNOWN': {
      const card = state.cards[state.currentIndex];
      if (!card) return state;
      const knownIds  = new Set(state.knownIds);
      const unknownIds = new Set(state.unknownIds);
      knownIds.add(card.id);
      unknownIds.delete(card.id);
      const next = state.currentIndex + 1;
      return {
        ...state,
        knownIds,
        unknownIds,
        currentIndex: next,
        isFlipped: false,
        phase: next >= state.cards.length ? 'complete' : 'playing',
      };
    }

    case 'MARK_UNKNOWN': {
      const card = state.cards[state.currentIndex];
      if (!card) return state;
      const knownIds  = new Set(state.knownIds);
      const unknownIds = new Set(state.unknownIds);
      unknownIds.add(card.id);
      knownIds.delete(card.id);
      const next = state.currentIndex + 1;
      return {
        ...state,
        knownIds,
        unknownIds,
        currentIndex: next,
        isFlipped: false,
        phase: next >= state.cards.length ? 'complete' : 'playing',
      };
    }

    case 'NEXT': {
      const next = state.currentIndex + 1;
      return {
        ...state,
        currentIndex: next,
        isFlipped: false,
        phase: next >= state.cards.length ? 'complete' : 'playing',
      };
    }

    case 'PREV':
      if (state.currentIndex <= 0) return state;
      return { ...state, currentIndex: state.currentIndex - 1, isFlipped: false };

    case 'RESTART':
      return {
        ...state,
        currentIndex: 0,
        isFlipped: false,
        knownIds: new Set(),
        unknownIds: new Set(),
        phase: 'playing',
      };

    case 'REVIEW_UNKNOWN': {
      const unknownCards = state.cards.filter(c => state.unknownIds.has(c.id));
      const shuffled = shuffle([...unknownCards]);
      return {
        cards: shuffled,
        currentIndex: 0,
        isFlipped: false,
        knownIds: new Set(),
        unknownIds: new Set(),
        phase: 'playing',
      };
    }

    default:
      return state;
  }
}

// ---- Shuffle helper ----
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- TTS helper ----
function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  window.speechSynthesis.speak(u);
}

// ---- Card face content ----
interface FaceContent {
  frontLabel: string;
  frontMain: string;
  frontSub: string;
  backLabel: string;
  backMain: string;
  backSub: string;
  canTts: boolean;
  ttsText: string;
  frontBig?: boolean;
}

function getCardContent(card: AnyCard, type: CardType): FaceContent {
  if (type === 'vocab') {
    return {
      frontLabel: 'Tiếng Nhật',
      frontMain: card.japanese ?? '',
      frontSub: card.hiragana ?? '',
      backLabel: 'Nghĩa',
      backMain: card.meaning ?? '',
      backSub: '',
      canTts: true,
      ttsText: card.japanese ?? card.hiragana ?? '',
    };
  }
  if (type === 'kanji') {
    const char = card.kanji ?? card.character ?? '';
    return {
      frontLabel: 'Kanji',
      frontMain: char,
      frontSub: [card.onyomi, card.kunyomi].filter(Boolean).join(' / '),
      backLabel: 'Nghĩa',
      backMain: card.meaning ?? '',
      backSub: card.example_words ? card.example_words.split('、').slice(0, 3).join('、') : '',
      canTts: false,
      ttsText: '',
    };
  }
  // grammar
  return {
    frontLabel: 'Ngữ Pháp',
    frontMain: card.pattern ?? '',
    frontSub: card.example_ja ?? '',
    backLabel: 'Nghĩa',
    backMain: card.meaning ?? '',
    backSub: card.example_vi ?? '',
    canTts: false,
    ttsText: '',
    frontBig: true,
  };
}

// ============================================
// FlashCard 3D component
// ============================================
interface FlashCardProps {
  content: FaceContent;
  isFlipped: boolean;
  onFlip: () => void;
}

function FlashCard({ content, isFlipped, onFlip }: FlashCardProps) {
  return (
    <div
      onClick={onFlip}
      className="w-full max-w-[520px] max-sm:max-w-full h-[300px] max-sm:h-[240px] mx-auto cursor-pointer"
      style={{ perspective: '1000px' }}
      title="Click để lật thẻ"
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl
                     bg-white border border-black/[0.05] shadow-card"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-xs text-on-surface-variant mb-3 uppercase tracking-wider">
            {content.frontLabel}
          </div>
          <div
            className="font-bold text-on-surface mb-2 text-center"
            style={{
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: content.frontBig ? '2rem' : '3rem',
              lineHeight: 1.1,
            }}
          >
            {content.frontMain}
          </div>
          {content.frontSub && (
            <div className="text-lg text-on-surface-variant text-center" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {content.frontSub}
            </div>
          )}
          {content.canTts && (
            <button
              onClick={e => { e.stopPropagation(); speak(content.ttsText); }}
              className="mt-4 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center
                         hover:bg-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-primary">volume_up</span>
            </button>
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl
                     border border-black/[0.05] shadow-card"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #f0f7f6, #e8f0ee)',
          }}
        >
          <div className="text-xs text-on-surface-variant mb-3 uppercase tracking-wider">
            {content.backLabel}
          </div>
          <div className="text-3xl font-bold text-on-surface mb-2 text-center">
            {content.backMain}
          </div>
          {content.backSub && (
            <div className="text-sm text-on-surface-variant text-center mt-1">
              {content.backSub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Config Panel
// ============================================
interface ConfigProps {
  type: CardType;
  level: string;
  lesson: string;
  lessons: string[];
  loading: boolean;
  onTypeChange: (t: CardType) => void;
  onLevelChange: (l: string) => void;
  onLessonChange: (l: string) => void;
  onStart: () => void;
}

const TYPE_OPTIONS: { value: CardType; label: string }[] = [
  { value: 'vocab',   label: 'Từ Vựng' },
  { value: 'kanji',   label: 'Kanji' },
  { value: 'grammar', label: 'Ngữ Pháp' },
];
const LEVELS = ['all', 'N5', 'N4', 'N3', 'N2', 'N1'];

function ConfigPanel({
  type, level, lesson, lessons, loading,
  onTypeChange, onLevelChange, onLessonChange, onStart,
}: ConfigProps) {
  return (
    <div className="card p-5 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        {/* Type */}
        <div className="flex-1 min-w-[130px]">
          <label className="block text-sm font-semibold mb-1.5">Loại</label>
          <select
            value={type}
            onChange={e => onTypeChange(e.target.value as CardType)}
            className="w-full pl-3 pr-8 py-2.5 text-sm border border-outline-variant rounded-xl
                       bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm font-semibold mb-1.5">Level</label>
          <select
            value={level}
            onChange={e => onLevelChange(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 text-sm border border-outline-variant rounded-xl
                       bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {LEVELS.map(l => (
              <option key={l} value={l}>{l === 'all' ? 'Tất cả' : l}</option>
            ))}
          </select>
        </div>

        {/* Lesson */}
        <div className="flex-1 min-w-[130px]">
          <label className="block text-sm font-semibold mb-1.5">Bài</label>
          <select
            value={lesson}
            onChange={e => onLessonChange(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 text-sm border border-outline-variant rounded-xl
                       bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Tất cả bài</option>
            {lessons.map(l => (
              <option key={l} value={l}>Bài {l}</option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <button
          onClick={onStart}
          disabled={loading}
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold
                     hover:bg-primary-dark transition-all disabled:opacity-60 flex items-center gap-2"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <span className="material-symbols-outlined text-lg">play_arrow</span>
          }
          Bắt đầu
        </button>
      </div>
    </div>
  );
}

// ============================================
// FlashcardPage — main
// ============================================
export function FlashcardPage() {
  const { user } = useAuth();
  // Config state
  const [cardType,  setCardType]  = useState<CardType>('vocab');
  const [level,     setLevel]     = useState('all');
  const [lesson,    setLesson]    = useState('all');
  const [allData,   setAllData]   = useState<AnyCard[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState('');

  // Session state
  const [session, dispatch] = useReducer(sessionReducer, {
    cards: [],
    currentIndex: 0,
    isFlipped: false,
    knownIds: new Set<number>(),
    unknownIds: new Set<number>(),
    phase: 'config',
  });

  // Load data when type changes
  async function loadData(type: CardType) {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: AnyCard[] = [];
      if (type === 'vocab')   data = (await api.getAllVocabulary()) as AnyCard[];
      if (type === 'kanji')   data = (await api.getAllKanji())      as AnyCard[];
      if (type === 'grammar') data = (await api.getAllGrammar())    as AnyCard[];
      setAllData(data);
      setLesson('all');
    } catch {
      setAllData([]);
    } finally {
      setLoading(false);
    }
  }

  // Load vocab on mount or user change
  useEffect(() => { loadData('vocab'); }, [user]);

  function handleTypeChange(t: CardType) {
    setCardType(t);
    loadData(t);
  }

  // Lessons derived from data
  const lessons = useMemo(() => {
    const set = new Set(allData.map(d => String(d.lesson ?? '')).filter(Boolean));
    return [...set].sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
  }, [allData]);

  // Start session
  function handleStart() {
    let filtered = allData.filter(d => {
      if (level  !== 'all' && d.level !== level)          return false;
      if (lesson !== 'all' && String(d.lesson) !== lesson) return false;
      return true;
    });
    if (filtered.length === 0) {
      setErrorMsg('Không có thẻ nào phù hợp. Vui lòng chọn lại.');
      return;
    }
    setErrorMsg('');
    dispatch({ type: 'START', cards: shuffle([...filtered]) });
  }

  // Keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (session.phase !== 'playing') return;
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    switch (e.key) {
      case ' ':
      case 'Enter': e.preventDefault(); dispatch({ type: 'FLIP' }); break;
      case 'ArrowLeft':  dispatch({ type: 'PREV' }); break;
      case 'ArrowRight': dispatch({ type: 'NEXT' }); break;
      case '1': dispatch({ type: 'MARK_UNKNOWN' }); break;
      case '2': dispatch({ type: 'MARK_KNOWN' }); break;
    }
  }, [session.phase]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Current card content
  const currentCard = session.cards[session.currentIndex];
  const cardContent = currentCard ? getCardContent(currentCard, cardType) : null;
  const progress    = session.cards.length > 0
    ? (session.currentIndex / session.cards.length) * 100
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold max-sm:text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Flashcard
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">Học từ vựng bằng phương pháp lật thẻ</p>
      </div>

      {/* Config */}
      <ConfigPanel
        type={cardType}
        level={level}
        lesson={lesson}
        lessons={lessons}
        loading={loading}
        onTypeChange={handleTypeChange}
        onLevelChange={setLevel}
        onLessonChange={setLesson}
        onStart={handleStart}
      />

      {errorMsg && (
        <div className="bg-error-light text-error text-sm px-4 py-3 rounded-xl mb-4 border border-error/20">
          {errorMsg}
        </div>
      )}

      {/* Playing phase */}
      {session.phase === 'playing' && cardContent && (
        <div className="animate-fade-in-up">
          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-on-surface-variant">
                {session.currentIndex + 1} / {session.cards.length}
              </span>
              <span className="font-semibold text-primary">
                Biết: {session.knownIds.size} &nbsp;|&nbsp; Chưa biết: {session.unknownIds.size}
              </span>
            </div>
            <div className="h-1.5 bg-outline-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Hint */}
          <div className="text-center text-xs text-on-surface-variant mb-3">
            <span className="material-symbols-outlined text-sm align-middle">touch_app</span>
            {' '}Click thẻ hoặc nhấn{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> để lật
          </div>

          {/* Card */}
          <FlashCard
            content={cardContent}
            isFlipped={session.isFlipped}
            onFlip={() => dispatch({ type: 'FLIP' })}
          />

          {/* Navigation */}
          <div className="flex items-center justify-center flex-wrap gap-3 mt-6">
            <button
              onClick={() => dispatch({ type: 'PREV' })}
              disabled={session.currentIndex === 0}
              className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center
                         hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              onClick={() => dispatch({ type: 'MARK_UNKNOWN' })}
              className="px-5 py-2.5 rounded-xl border-2 border-error/30 text-error font-semibold text-sm
                         hover:bg-error/5 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">close</span>
              Chưa biết
            </button>

            <button
              onClick={() => dispatch({ type: 'MARK_KNOWN' })}
              className="px-5 py-2.5 rounded-xl border-2 border-success/30 text-success font-semibold text-sm
                         hover:bg-success/5 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Đã biết
            </button>

            <button
              onClick={() => dispatch({ type: 'NEXT' })}
              className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center
                         hover:bg-gray-50 transition-all"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {/* Keyboard hints — ẩn trên mobile nhỏ */}
          <div className="text-center mt-4 text-xs text-on-surface-variant space-x-3 max-sm:hidden">
            {[['←', 'Trước'], ['→', 'Tiếp'], ['1', 'Chưa biết'], ['2', 'Đã biết']].map(([k, label]) => (
              <span key={k}>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">{k}</kbd> {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Complete phase */}
      {session.phase === 'complete' && (
        <div className="text-center py-16 animate-fade-in-up">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Hoàn thành!
          </h3>
          <div className="flex items-center justify-center gap-10 mt-5 mb-8">
            {[
              { value: session.knownIds.size,   label: 'Đã biết',    color: 'text-success' },
              { value: session.unknownIds.size,  label: 'Chưa biết',  color: 'text-error' },
              { value: session.cards.length,     label: 'Tổng',       color: 'text-primary' },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <div className={`text-4xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-on-surface-variant mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => dispatch({ type: 'RESTART' })}
              className="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-semibold
                         hover:bg-primary-dark transition-all"
            >
              Học lại
            </button>
            {session.unknownIds.size > 0 && (
              <button
                onClick={() => dispatch({ type: 'REVIEW_UNKNOWN' })}
                className="px-6 py-2.5 text-sm border border-outline-variant rounded-xl
                           hover:bg-gray-50 transition-colors"
              >
                Ôn lại từ chưa biết ({session.unknownIds.size})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Initial empty state (config phase) */}
      {session.phase === 'config' && !loading && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🃏</div>
          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Chọn loại thẻ và bắt đầu học!
          </h3>
          <p className="text-sm text-on-surface-variant">
            Chọn loại, level và bài ở trên rồi nhấn "Bắt đầu"
          </p>
        </div>
      )}
    </div>
  );
}
