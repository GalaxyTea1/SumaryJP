// ============================================
// SrsReviewPage — SumaryJP
// SM-2 Spaced Repetition System
// React 19: useReducer cho session + localStorage cho SRS state
// ============================================

import { Suspense, use, useReducer, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import type { Vocabulary, Kanji, Grammar } from '@/types';

// ============================================
// SRS Algorithm (SM-2 simplified)
// ============================================
const SRS_KEY = 'sumary_srs_data';

interface SrsItem {
  interval: number;       // ngày giữa 2 lần ôn
  repetitions: number;    // số lần ôn đúng liên tiếp
  easeFactor: number;     // hệ số dễ (2.5 default)
  nextReview: number;     // timestamp cần ôn
  lastReview: number | null;
}

type SrsStore = Record<string, SrsItem>;

function loadSrsStore(): SrsStore {
  try { return JSON.parse(localStorage.getItem(SRS_KEY) ?? '{}'); }
  catch { return {}; }
}

function saveSrsStore(store: SrsStore) {
  localStorage.setItem(SRS_KEY, JSON.stringify(store));
}

function getSrsItem(store: SrsStore, type: string, id: number): SrsItem {
  const key = `${type}_${id}`;
  if (!store[key]) {
    store[key] = { interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: Date.now(), lastReview: null };
  }
  return store[key];
}

/** quality: 1=Again, 2=Hard, 3=Good, 4=Easy */
function calcNextSrs(item: SrsItem, quality: number): SrsItem {
  const updated = { ...item, lastReview: Date.now() };
  if (quality < 2) {
    updated.repetitions = 0;
    updated.interval    = 0;
    updated.nextReview  = Date.now() + 60_000; // 1 phút
  } else {
    updated.repetitions++;
    if (updated.repetitions === 1)      updated.interval = 1;
    else if (updated.repetitions === 2) updated.interval = 3;
    else updated.interval = Math.round(updated.interval * updated.easeFactor);

    updated.easeFactor += 0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02);
    if (updated.easeFactor < 1.3) updated.easeFactor = 1.3;

    updated.nextReview = Date.now() + updated.interval * 86_400_000;
  }
  return updated;
}

// ============================================
// Types
// ============================================
type ItemType = 'vocab' | 'kanji' | 'grammar';

interface ReviewItem {
  type: ItemType;
  id: number;
  // vocab
  japanese?: string;
  hiragana?: string;
  meaning: string;
  // kanji
  character?: string;
  kanji?: string;
  onyomi?: string;
  kunyomi?: string;
  // grammar
  pattern?: string;
  example_ja?: string;
  example_vi?: string;
}

// ============================================
// Session state reducer
// ============================================
interface SessionState {
  queue: ReviewItem[];
  currentIndex: number;
  isFlipped: boolean;
  goodCount: number;
  forgotCount: number;
  reviewedToday: number;
  phase: 'overview' | 'playing' | 'complete';
  srsStore: SrsStore;
}

type SessionAction =
  | { type: 'START'; queue: ReviewItem[]; store: SrsStore }
  | { type: 'FLIP' }
  | { type: 'RATE'; quality: number }
  | { type: 'DONE' };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START':
      return { ...state, queue: action.queue, currentIndex: 0, isFlipped: false, goodCount: 0, forgotCount: 0, phase: 'playing', srsStore: action.store };

    case 'FLIP':
      return { ...state, isFlipped: !state.isFlipped };

    case 'RATE': {
      const item = state.queue[state.currentIndex];
      if (!item) return state;

      // Update SRS store
      const newStore = { ...state.srsStore };
      const key = `${item.type}_${item.id}`;
      newStore[key] = calcNextSrs(getSrsItem(newStore, item.type, item.id), action.quality);
      saveSrsStore(newStore);

      const isGood   = action.quality >= 3;
      const nextIdx  = state.currentIndex + 1;
      const isEnd    = nextIdx >= state.queue.length;

      return {
        ...state,
        srsStore: newStore,
        currentIndex: nextIdx,
        isFlipped: false,
        goodCount:     isGood ? state.goodCount + 1 : state.goodCount,
        forgotCount:   !isGood ? state.forgotCount + 1 : state.forgotCount,
        reviewedToday: state.reviewedToday + 1,
        phase: isEnd ? 'complete' : 'playing',
      };
    }

    case 'DONE':
      return { ...state, phase: 'overview' };

    default: return state;
  }
}

// ============================================
// Pre-fetch all data at module level
// ============================================
const allDataPromise = Promise.all([
  api.getAllVocabulary().catch(() => []),
  api.getAllKanji().catch(() => []),
  api.getAllGrammar().catch(() => []),
]);

// ============================================
// Overview stats card
// ============================================
function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="card p-5 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-on-surface-variant mt-1">{label}</div>
    </div>
  );
}

// ============================================
// Review Card (3D flip)
// ============================================
const TYPE_LABELS: Record<ItemType, string> = { vocab: 'Từ vựng', kanji: 'Kanji', grammar: 'Ngữ pháp' };

function getItemContent(item: ReviewItem) {
  if (item.type === 'vocab') {
    return {
      frontLabel: 'Tiếng Nhật', frontMain: item.japanese ?? '', frontSub: item.hiragana ?? '',
      backLabel: 'Nghĩa', backMain: item.meaning, backSub: '',
    };
  }
  if (item.type === 'kanji') {
    const char = item.kanji ?? item.character ?? '';
    return {
      frontLabel: 'Kanji', frontMain: char, frontSub: [item.onyomi, item.kunyomi].filter(Boolean).join(' / '),
      backLabel: 'Nghĩa', backMain: item.meaning, backSub: '',
    };
  }
  return {
    frontLabel: 'Ngữ pháp', frontMain: item.pattern ?? '', frontSub: item.example_ja ?? '',
    backLabel: 'Nghĩa', backMain: item.meaning, backSub: item.example_vi ?? '',
  };
}

const RATINGS = [
  { q: 1, label: 'Quên',  sub: '< 1 phút', border: 'border-error/50',   text: 'text-error',   hover: 'hover:bg-error/5' },
  { q: 2, label: 'Khó',   sub: '~10 phút', border: 'border-[#f59e0b]/50', text: 'text-[#f59e0b]', hover: 'hover:bg-yellow-50' },
  { q: 3, label: 'Tốt',   sub: '~1 ngày',  border: 'border-primary/50', text: 'text-primary', hover: 'hover:bg-primary-50' },
  { q: 4, label: 'Dễ',    sub: '~3 ngày',  border: 'border-success/50', text: 'text-success', hover: 'hover:bg-success/5' },
];

// ============================================
// SRS Content — fetches with use()
// ============================================
function SrsContent() {
  const [vocab, kanji, grammar] = use(allDataPromise) as [Vocabulary[], Kanji[], Grammar[]];

  const initStore = useMemo(() => loadSrsStore(), []);

  const [state, dispatch] = useReducer(sessionReducer, {
    queue: [], currentIndex: 0, isFlipped: false,
    goodCount: 0, forgotCount: 0, reviewedToday: 0,
    phase: 'overview', srsStore: initStore,
  });

  // Compute overview stats
  const stats = useMemo(() => {
    const now   = Date.now();
    let due = 0, learning = 0, mastered = 0;
    const store = state.srsStore;

    const allIds = [
      ...vocab.map(v => ({ type: 'vocab' as ItemType, id: v.id })),
      ...(kanji as (Kanji & { id: number })[]).map(k => ({ type: 'kanji' as ItemType, id: k.id })),
      ...(grammar as (Grammar & { id: number })[]).map(g => ({ type: 'grammar' as ItemType, id: g.id })),
    ];

    allIds.forEach(({ type, id }) => {
      const item = getSrsItem({ ...store }, type, id);
      if (item.nextReview <= now) due++;
      if (item.repetitions > 0 && item.interval < 7) learning++;
      if (item.interval >= 7) mastered++;
    });

    return { due, learning, mastered };
  }, [vocab, kanji, grammar, state.srsStore, state.reviewedToday]);

  // Build review queue
  function handleStart() {
    const now   = Date.now();
    const store = loadSrsStore();
    const queue: ReviewItem[] = [];

    vocab.forEach(v => {
      const srs = getSrsItem(store, 'vocab', v.id);
      if (srs.nextReview <= now) {
        queue.push({ type: 'vocab', id: v.id, japanese: v.japanese, hiragana: v.hiragana, meaning: v.meaning });
      }
    });
    (kanji as (Kanji & { id: number; character?: string; kanji?: string; onyomi?: string; kunyomi?: string })[]).forEach(k => {
      const srs = getSrsItem(store, 'kanji', k.id);
      if (srs.nextReview <= now) {
        queue.push({ type: 'kanji', id: k.id, kanji: k.kanji, character: k.character, onyomi: k.onyomi, kunyomi: k.kunyomi, meaning: k.meaning });
      }
    });
    (grammar as (Grammar & { id: number; pattern?: string; example_ja?: string; example_vi?: string })[]).forEach(g => {
      const srs = getSrsItem(store, 'grammar', g.id);
      if (srs.nextReview <= now) {
        queue.push({ type: 'grammar', id: g.id, pattern: g.pattern, example_ja: g.example_ja, example_vi: g.example_vi, meaning: g.meaning });
      }
    });

    queue.sort((a, b) => {
      const ia = getSrsItem(store, a.type, a.id).interval;
      const ib = getSrsItem(store, b.type, b.id).interval;
      return ia - ib;
    });

    dispatch({ type: 'START', queue, store });
  }

  // Keyboard handler
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (state.phase !== 'playing') return;
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); dispatch({ type: 'FLIP' }); }
    if (state.isFlipped && ['1','2','3','4'].includes(e.key)) {
      dispatch({ type: 'RATE', quality: parseInt(e.key) });
    }
  }, [state.phase, state.isFlipped]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const currentItem = state.queue[state.currentIndex];
  const content     = currentItem ? getItemContent(currentItem) : null;
  const progress    = state.queue.length > 0 ? (state.currentIndex / state.queue.length) * 100 : 0;

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats.due}                color="text-error"    label="Cần ôn hôm nay" />
        <StatCard value={stats.learning}           color="text-[#f59e0b]" label="Đang học" />
        <StatCard value={state.reviewedToday}      color="text-primary"   label="Đã ôn hôm nay" />
        <StatCard value={stats.mastered}           color="text-success"   label="Đã thuộc" />
      </div>

      {/* Overview — start section */}
      {state.phase === 'overview' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Sẵn sàng ôn tập!
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">
            Bạn có <strong className="text-error">{stats.due}</strong> thẻ cần ôn hôm nay
          </p>
          <button
            onClick={handleStart}
            disabled={stats.due === 0}
            className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-semibold
                       hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 mx-auto"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            {stats.due === 0 ? 'Không có thẻ nào cần ôn' : 'Bắt đầu ôn tập'}
          </button>
        </div>
      )}

      {/* Playing phase */}
      {state.phase === 'playing' && content && (
        <div>
          {/* Progress */}
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-semibold text-on-surface-variant">
              {state.currentIndex + 1} / {state.queue.length}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary-50 text-primary font-semibold">
              {TYPE_LABELS[currentItem.type]}
            </span>
          </div>
          <div className="h-1.5 bg-outline-variant rounded-full overflow-hidden mb-5">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {/* Flip hint */}
          <div className="text-center text-xs text-on-surface-variant mb-3">
            <span className="material-symbols-outlined text-sm align-middle">touch_app</span>
            {' '}Click thẻ hoặc nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> để lật
          </div>

          {/* 3D Card */}
          <div
            onClick={() => dispatch({ type: 'FLIP' })}
            className="w-full max-w-[560px] h-[300px] mx-auto cursor-pointer"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full h-full"
              style={{
                transformStyle: 'preserve-3d',
                transform: state.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl
                           bg-white border border-black/5 shadow-card"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-xs text-on-surface-variant mb-3 uppercase tracking-wider">{content.frontLabel}</div>
                <div className="text-4xl font-bold text-on-surface mb-2 text-center" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  {content.frontMain}
                </div>
                {content.frontSub && (
                  <div className="text-lg text-on-surface-variant text-center" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {content.frontSub}
                  </div>
                )}
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl
                           border border-black/5 shadow-card"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, #f0f7f6, #e8f0ee)' }}
              >
                <div className="text-xs text-on-surface-variant mb-3 uppercase tracking-wider">{content.backLabel}</div>
                <div className="text-3xl font-bold text-on-surface mb-2 text-center">{content.backMain}</div>
                {content.backSub && <div className="text-sm text-on-surface-variant text-center">{content.backSub}</div>}
              </div>
            </div>
          </div>

          {/* Rating buttons — chỉ hiện sau flip */}
          {state.isFlipped && (
            <div className="flex items-center justify-center gap-3 mt-6 animate-fade-in-up">
              {RATINGS.map(r => (
                <button
                  key={r.q}
                  onClick={() => dispatch({ type: 'RATE', quality: r.q })}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-[0.8125rem] border-2
                              ${r.border} ${r.text} ${r.hover} transition-all`}
                >
                  <span className="block">{r.label}</span>
                  <span className="text-[0.625rem] opacity-60">{r.sub}</span>
                </button>
              ))}
            </div>
          )}

          {/* Keyboard hints */}
          <div className="text-center mt-4 text-xs text-on-surface-variant space-x-2">
            {RATINGS.map(r => (
              <span key={r.q}>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">{r.q}</kbd> {r.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Complete phase */}
      {state.phase === 'complete' && (
        <div className="text-center py-16 animate-fade-in-up">
          <div className="text-6xl mb-4">🎊</div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Hoàn thành ôn tập!
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">Bạn đã ôn xong tất cả thẻ hôm nay</p>
          <div className="flex items-center justify-center gap-10 mb-8">
            {[
              { val: state.queue.length, label: 'Tổng ôn', color: 'text-primary' },
              { val: state.goodCount,    label: 'Nhớ',     color: 'text-success' },
              { val: state.forgotCount,  label: 'Quên',    color: 'text-error' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-4xl font-bold ${s.color}`}>{s.val}</div>
                <div className="text-xs text-on-surface-variant mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <Link
            to="/dashboard"
            className="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-semibold
                       hover:bg-primary-dark transition-all inline-block"
          >
            Về Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================
// Page Export
// ============================================
export function SrsReviewPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Ôn Tập SRS
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Ôn tập thông minh — Spaced Repetition System
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 text-center">
                <div className="skeleton h-9 w-12 rounded mx-auto mb-2" />
                <div className="skeleton h-3 w-20 rounded mx-auto" />
              </div>
            ))}
          </div>
        }
      >
        <SrsContent />
      </Suspense>
    </div>
  );
}
