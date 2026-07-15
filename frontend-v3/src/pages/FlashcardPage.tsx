import { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import type { Vocabulary, Kanji, Grammar } from '@/types';
import CustomSelect from '@/components/Select';

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

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.7;
  window.speechSynthesis.speak(u);
}

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

function getFontSizeClass(text: string, isBig?: boolean) {
  if (isBig) return 'text-lg sm:text-2xl'; 
  const len = text.length;
  if (len > 12) return 'text-base sm:text-xl';
  if (len > 8) return 'text-xl sm:text-2xl';
  if (len > 5) return 'text-2xl sm:text-3xl';
  return 'text-4xl sm:text-5xl';
}

interface FlashCardProps {
  content: FaceContent;
  isFlipped: boolean;
  onFlip: () => void;
}

function FlashCard({ content, isFlipped, onFlip }: FlashCardProps) {
  return (
    <div
      onClick={onFlip}
      className="w-full max-w-[520px] max-sm:max-w-full h-[300px] max-sm:h-[240px] mx-auto cursor-pointer group"
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
                     bg-white border border-black/[0.05] group-hover:border-primary/30 group-hover:shadow-xl transition-all duration-300 shadow-md"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-xs text-on-surface-variant/80 mb-3 uppercase tracking-wider font-semibold select-none">
            {content.frontLabel}
          </div>
          <div
            className={`font-bold text-on-surface mb-2 text-center break-words max-w-full ${getFontSizeClass(content.frontMain, content.frontBig)}`}
            style={{
              fontFamily: "'Noto Sans JP', sans-serif",
              lineHeight: 1.2,
            }}
          >
            {content.frontMain}
          </div>
          {content.frontSub && (
            <div className="text-base sm:text-lg text-on-surface-variant text-center" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {content.frontSub}
            </div>
          )}
          {content.canTts && (
            <button
              onClick={e => { e.stopPropagation(); speak(content.ttsText); }}
              className="mt-4 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center
                         hover:bg-primary/20 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title="Phát âm"
            >
              <span className="material-symbols-outlined text-primary">volume_up</span>
            </button>
          )}
          
          {/* Flip helper indicator */}
          <div className="absolute bottom-4 right-5 flex items-center gap-1 text-[10px] font-bold text-on-surface-variant/40 group-hover:text-primary transition-colors select-none">
            <span>Lật thẻ</span>
            <span className="material-symbols-outlined text-xs animate-spin-slow">sync</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl
                     border border-black/[0.05] group-hover:border-primary/30 group-hover:shadow-xl transition-all duration-300 shadow-md"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #f2f8f7, #e6f2f0)',
          }}
        >
          <div className="text-xs text-on-surface-variant/80 mb-3 uppercase tracking-wider font-semibold select-none">
            {content.backLabel}
          </div>
          <div
            className={`font-bold text-on-surface mb-2 text-center break-words max-w-full ${getFontSizeClass(content.backMain)}`}
            style={{ lineHeight: 1.2 }}
          >
            {content.backMain}
          </div>
          {content.backSub && (
            <div className="text-xs sm:text-sm text-on-surface-variant/90 text-center mt-1">
              {content.backSub}
            </div>
          )}
          
          {/* Flip helper indicator */}
          <div className="absolute bottom-4 right-5 flex items-center gap-1 text-[10px] font-bold text-on-surface-variant/40 group-hover:text-primary transition-colors select-none">
            <span>Lật thẻ</span>
            <span className="material-symbols-outlined text-xs">sync</span>
          </div>
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
  const levelOptions = useMemo(() => {
    return LEVELS.map(l => ({
      value: l,
      label: l === 'all' ? 'Tất cả level' : l
    }));
  }, []);

  const lessonOptions = useMemo(() => {
    return [
      { value: 'all', label: 'Tất cả bài' },
      ...lessons.map(l => ({ value: l, label: `Bài ${l}` }))
    ];
  }, [lessons]);

  return (
    <div className="card p-5 mb-6">
      <div className="grid grid-cols-2 md:flex md:flex-wrap items-end gap-4">
        {/* Type */}
        <div className="col-span-1 md:flex-1 md:min-w-[130px]">
          <label className="block text-sm font-semibold mb-1.5 text-on-surface">Loại</label>
          <CustomSelect
            value={type}
            onChange={onTypeChange}
            options={TYPE_OPTIONS}
          />
        </div>

        {/* Level */}
        <div className="col-span-1 md:flex-1 md:min-w-[120px]">
          <label className="block text-sm font-semibold mb-1.5 text-on-surface">Level</label>
          <CustomSelect
            value={level}
            onChange={onLevelChange}
            options={levelOptions}
          />
        </div>

        {/* Lesson */}
        <div className="col-span-1 md:flex-1 md:min-w-[130px]">
          <label className="block text-sm font-semibold mb-1.5 text-on-surface">Bài</label>
          <CustomSelect
            value={lesson}
            onChange={onLessonChange}
            options={lessonOptions}
          />
        </div>

        {/* Start Button */}
        <div className="col-span-1 md:flex-none">
          <button
            onClick={onStart}
            disabled={loading}
            className="w-full md:w-auto h-[42px] bg-primary text-white px-6 rounded-xl text-sm font-semibold
                       hover:bg-primary-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-lg">play_arrow</span>
            }
            <span>Bắt đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FlashcardPage — main
// ============================================
export function FlashcardPage() {
  const { user } = useAuth();
  const { trackEvent } = useGamification();

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

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/user change
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
    const filtered = allData.filter(d => {
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

  // Track event completed
  useEffect(() => {
    if (session.phase === 'complete') {
      void trackEvent('flashcard_complete');
    }
  }, [session.phase, trackEvent]);

  // Handle Flip and Track Event
  const handleFlip = useCallback(() => {
    dispatch({ type: 'FLIP' });
    void trackEvent('flashcard_flip');
  }, [trackEvent]);

  // Keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (session.phase !== 'playing') return;
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    switch (e.key) {
      case ' ':
      case 'Enter': {
        e.preventDefault();
        dispatch({ type: 'FLIP' });
        void trackEvent('flashcard_flip');
        break;
      }
      case 'ArrowLeft':  dispatch({ type: 'PREV' }); break;
      case 'ArrowRight': dispatch({ type: 'NEXT' }); break;
      case '1': dispatch({ type: 'MARK_UNKNOWN' }); break;
      case '2': dispatch({ type: 'MARK_KNOWN' }); break;
    }
  }, [session.phase, trackEvent]);

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
      {/* <div className="mb-6">
        <h1 className="text-2xl font-bold max-sm:text-xl text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Flashcard
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">Học từ vựng bằng phương pháp lật thẻ</p>
      </div> */}

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
          <div className="text-center text-xs text-on-surface-variant mb-3 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">touch_app</span>
            <span>Click thẻ hoặc nhấn <kbd className="px-1.5 py-0.5 bg-outline-variant/30 rounded font-mono text-[10px]">Space</kbd> để lật</span>
          </div>

          {/* Card */}
          <FlashCard
            content={cardContent}
            isFlipped={session.isFlipped}
            onFlip={handleFlip}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 w-full max-w-[520px] mx-auto mt-6 flex-nowrap">
            <button
              onClick={() => dispatch({ type: 'PREV' })}
              disabled={session.currentIndex === 0}
              title="Thẻ trước (ArrowLeft)"
              className="w-12 h-12 shrink-0 rounded-full border border-outline-variant flex items-center justify-center
                         hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all text-on-surface"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              onClick={() => dispatch({ type: 'MARK_UNKNOWN' })}
              className="flex-1 py-2.5 rounded-xl border-2 border-error/30 bg-error/5 text-error font-bold text-sm
                         hover:bg-error/10 transition-all flex items-center justify-center gap-1.5 min-w-0"
            >
              <span className="material-symbols-outlined text-lg shrink-0">close</span>
              <span className="truncate">Chưa biết</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-error/15 text-error rounded font-mono border border-error/20 max-sm:hidden shrink-0">1</kbd>
            </button>

            <button
              onClick={() => dispatch({ type: 'MARK_KNOWN' })}
              className="flex-1 py-2.5 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary-dark font-bold text-sm
                         hover:bg-primary/10 transition-all flex items-center justify-center gap-1.5 min-w-0"
            >
              <span className="material-symbols-outlined text-lg shrink-0">check</span>
              <span className="truncate">Đã biết</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-primary/15 text-primary rounded font-mono border border-primary/20 max-sm:hidden shrink-0">2</kbd>
            </button>

            <button
              onClick={() => dispatch({ type: 'NEXT' })}
              title="Thẻ sau (ArrowRight)"
              className="w-12 h-12 shrink-0 rounded-full border border-outline-variant flex items-center justify-center
                         hover:bg-gray-50 transition-all text-on-surface"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="text-center mt-4 text-xs text-on-surface-variant space-x-3 max-sm:hidden">
            {[['←', 'Trước'], ['→', 'Tiếp'], ['1', 'Chưa biết'], ['2', 'Đã biết']].map(([k, label]) => (
              <span key={k}>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-outline-variant/60 rounded font-mono text-[10px]">{k}</kbd> {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Complete phase */}
      {session.phase === 'complete' && (() => {
        const accuracy = session.cards.length > 0
          ? Math.round((session.knownIds.size / session.cards.length) * 100)
          : 0;
        const getEncouragement = (acc: number) => {
          if (acc === 100) return { title: 'Thật hoàn hảo! 💯', desc: 'Bạn đã thuộc toàn bộ thẻ học. Xuất sắc!' };
          if (acc >= 80) return { title: 'Quá xuất sắc! 🎉', desc: 'Khả năng ghi nhớ của bạn rất đáng nể đấy!' };
          if (acc >= 50) return { title: 'Làm tốt lắm! 👍', desc: 'Hãy tiếp tục ôn tập để nâng cao tỷ lệ ghi nhớ nhé.' };
          return { title: 'Cố gắng lên nhé! 💪', desc: 'Luyện tập nhiều lần sẽ giúp bạn ghi nhớ sâu sắc hơn.' };
        };
        const msg = getEncouragement(accuracy);
        return (
          <div className="text-center py-10 px-4 max-w-[600px] mx-auto bg-white border border-black/[0.03] rounded-3xl shadow-sm animate-fade-in-up">
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-xl font-bold mb-1 text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {msg.title}
            </h3>
            <p className="text-sm text-on-surface-variant max-w-[400px] mx-auto mb-6">
              {msg.desc}
            </p>

            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary/10 to-primary/5 border-2 border-primary/20 shadow-inner">
                <div className="text-center">
                  <span className="text-3.5xl font-extrabold text-primary-dark">{accuracy}%</span>
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/80 font-bold mt-0.5">Thuộc bài</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-[450px] mx-auto mb-8 mt-4">
              {[
                { value: session.knownIds.size,   label: 'Đã biết',    bg: 'bg-success/5 border-success/20 text-success' },
                { value: session.unknownIds.size,  label: 'Chưa biết',  bg: 'bg-error/5 border-error/20 text-error' },
                { value: session.cards.length,     label: 'Tổng số thẻ', bg: 'bg-primary/5 border-primary/20 text-primary-dark' },
              ].map(({ value, label, bg }) => (
                <div key={label} className={`text-center py-3 px-2 rounded-2xl border ${bg}`}>
                  <div className="text-2xl sm:text-3xl font-extrabold">{value}</div>
                  <div className="text-[10px] sm:text-xs font-semibold mt-1 opacity-90">{label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center flex-wrap gap-3">
              <button
                onClick={() => dispatch({ type: 'RESTART' })}
                className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all shadow-sm cursor-pointer"
              >
                Học lại
              </button>
              {session.unknownIds.size > 0 && (
                <button
                  onClick={() => dispatch({ type: 'REVIEW_UNKNOWN' })}
                  className="px-6 py-3 text-sm border border-outline-variant bg-white text-on-surface rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm cursor-pointer"
                >
                  Ôn lại từ chưa biết ({session.unknownIds.size})
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Initial empty state (config phase) */}
      {session.phase === 'config' && !loading && (
        <div className="max-w-[600px] mx-auto text-center py-10 px-6 bg-white border border-black/[0.03] rounded-3xl p-6 shadow-sm animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">psychology</span>
          </div>
          {/* <h3 className="text-lg font-bold mb-2 text-on-surface font-display">
            Phương pháp lật thẻ (Spaced Repetition)
          </h3>
          <p className="text-sm text-on-surface-variant max-w-[450px] mx-auto mb-8">
            Phương pháp học chủ động giúp kích thích não bộ ghi nhớ sâu từ vựng, Kanji và ngữ pháp tiếng Nhật thông qua việc chủ động gợi nhớ nghĩa của thẻ.
          </p> */}
          
          <div className="border-t border-outline-variant/60 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-4">Hướng dẫn phím tắt (Desktop)</h4>
            <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto text-left text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface border border-outline-variant rounded shadow-sm font-mono text-[10px]">Space / Enter</kbd>
                <span>Lật thẻ</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface border border-outline-variant rounded shadow-sm font-mono text-[10px]">1</kbd>
                <span>Chưa biết</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface border border-outline-variant rounded shadow-sm font-mono text-[10px]">2</kbd>
                <span>Đã biết</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface border border-outline-variant rounded shadow-sm font-mono text-[10px]">← / →</kbd>
                <span>Trước / Sau</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
