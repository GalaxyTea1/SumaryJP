// ============================================
// SrsReviewPage — SumaryJP
// SM-2 Spaced Repetition System
// React 19: useReducer cho session + localStorage cho SRS state
// ============================================

import { Suspense, use, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import type { Vocabulary, Kanji, Grammar } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';

// ============================================
// SRS Algorithm (SM-2 simplified)
// ============================================
const SRS_KEY = 'sumary_srs_data';

interface SrsItem {
  interval: number;       // days between reviews
  repetitions: number;    // consecutive correct reviews
  easeFactor: number;     // ease factor (default 2.5)
  nextReview: number;     // next review timestamp
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

/**
 * quality mapping:
 *   1 = Quên  (Again)  → reset về đầu
 *   2 = Khó   (Hard)   → interval nhân ~0.5
 *   4 = Nhớ   (Good)   → interval bình thường SM-2
 */
function calcNextSrs(item: SrsItem, quality: number): SrsItem {
  const updated = { ...item, lastReview: Date.now() };
  if (quality < 2) {
    // Forgot -> reset
    updated.repetitions = 0;
    updated.interval    = 0;
    updated.nextReview  = Date.now() + 60_000; // 1 min
  } else if (quality === 2) {
    // Hard -> reduce/keep interval
    updated.repetitions = Math.max(0, updated.repetitions - 1);
    updated.interval    = Math.max(1, Math.round(updated.interval * 0.6));
    updated.easeFactor  = Math.max(1.3, updated.easeFactor - 0.15);
    updated.nextReview  = Date.now() + updated.interval * 86_400_000;
  } else {
    // Good -> normal SM-2 progress
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
// TTS helper
// ============================================
function speak(text: string) {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
}

// ============================================
// Types
// ============================================
type ItemType = 'vocab' | 'kanji' | 'grammar';

interface ReviewItem {
  type: ItemType;
  id: number;
  japanese?: string;
  hiragana?: string;
  meaning: string;
  character?: string;
  kanji?: string;
  onyomi?: string;
  kunyomi?: string;
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
  hardCount: number;
  forgotCount: number;
  reviewedToday: number;
  phase: 'overview' | 'playing' | 'complete';
  srsStore: SrsStore;
}

type SessionAction =
  | { type: 'START'; queue: ReviewItem[]; store: SrsStore }
  | { type: 'FLIP' }
  | { type: 'RATE'; quality: number }
  | { type: 'BACK_TO_OVERVIEW' };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        queue: action.queue,
        currentIndex: 0,
        isFlipped: false,
        goodCount: 0,
        hardCount: 0,
        forgotCount: 0,
        phase: 'playing',
        srsStore: action.store,
      };

    case 'FLIP':
      return { ...state, isFlipped: !state.isFlipped };

    case 'RATE': {
      const item = state.queue[state.currentIndex];
      if (!item) return state;

      const newStore = { ...state.srsStore };
      const key = `${item.type}_${item.id}`;
      newStore[key] = calcNextSrs(getSrsItem(newStore, item.type, item.id), action.quality);
      saveSrsStore(newStore);

      const nextIdx = state.currentIndex + 1;
      const isEnd   = nextIdx >= state.queue.length;

      return {
        ...state,
        srsStore: newStore,
        currentIndex: nextIdx,
        isFlipped: false,
        goodCount:     action.quality >= 4 ? state.goodCount + 1 : state.goodCount,
        hardCount:     action.quality === 2 ? state.hardCount + 1 : state.hardCount,
        forgotCount:   action.quality < 2 ? state.forgotCount + 1 : state.forgotCount,
        reviewedToday: state.reviewedToday + 1,
        phase: isEnd ? 'complete' : 'playing',
      };
    }

    case 'BACK_TO_OVERVIEW':
      return { ...state, phase: 'overview' };

    default: return state;
  }
}

// ============================================
// Rating config — 3 visual buttons
// ============================================
const RATINGS = [
  {
    q: 1,
    label: 'Quên rồi',
    sub: 'Ôn lại ngay',
    icon: 'refresh',
    border: 'border-error/40',
    bg: 'bg-error/5 hover:bg-error/12',
    text: 'text-error',
    key: 'J',
    keyLabel: 'J',
  },
  {
    q: 2,
    label: 'Còn khó',
    sub: 'Sớm ôn lại',
    icon: 'warning',
    border: 'border-amber-400/50',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-600',
    key: 'K',
    keyLabel: 'K',
  },
  {
    q: 4,
    label: 'Nhớ được!',
    sub: 'Lịch ôn tới',
    icon: 'check_circle',
    border: 'border-primary/40',
    bg: 'bg-primary/5 hover:bg-primary/12',
    text: 'text-primary-dark',
    key: 'L',
    keyLabel: 'L',
  },
];

// ============================================
// Overview stats card
// ============================================
function StatCard({ value, label, color, icon }: { value: number; label: string; color: string; icon: string }) {
  return (
    <div className="card p-4 sm:p-5 text-center flex flex-col items-center gap-1">
      <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
      <div className={`text-2xl sm:text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-on-surface-variant font-medium">{label}</div>
    </div>
  );
}

// ============================================
// Exit Confirmation Dialog
// ============================================
function ExitConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-[380px] w-full text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-error/10 rounded-2xl flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-error">exit_to_app</span>
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Thoát phiên ôn tập?
        </h3>
        <p className="text-sm text-on-surface-variant mb-6">
          Tiến trình đã ôn sẽ được lưu lại. Bạn có thể tiếp tục bất cứ lúc nào.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            Tiếp tục học
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-semibold hover:bg-red-600 transition-all"
          >
            Thoát
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SRS Content — fetches with use()
// ============================================
const TYPE_LABELS: Record<ItemType, string> = { vocab: 'Từ vựng', kanji: 'Kanji', grammar: 'Ngữ pháp' };

function getItemContent(item: ReviewItem) {
  if (item.type === 'vocab') {
    return {
      frontLabel: 'Tiếng Nhật',
      frontMain: item.japanese ?? '',
      frontSub: item.hiragana ?? '',
      backLabel: 'Nghĩa',
      backMain: item.meaning,
      backSub: '',
      canTts: true,
      ttsText: item.japanese ?? item.hiragana ?? '',
    };
  }
  if (item.type === 'kanji') {
    const char = item.kanji ?? item.character ?? '';
    return {
      frontLabel: 'Kanji',
      frontMain: char,
      frontSub: [item.onyomi, item.kunyomi].filter(Boolean).join(' / '),
      backLabel: 'Nghĩa',
      backMain: item.meaning,
      backSub: '',
      canTts: false,
      ttsText: '',
    };
  }
  return {
    frontLabel: 'Ngữ pháp',
    frontMain: item.pattern ?? '',
    frontSub: item.example_ja ?? '',
    backLabel: 'Nghĩa',
    backMain: item.meaning,
    backSub: item.example_vi ?? '',
    canTts: false,
    ttsText: '',
  };
}

// Auto-adjust font size based on text length
function getFrontFontSize(text: string): string {
  const len = text.length;
  if (len > 12) return 'text-base sm:text-xl';
  if (len > 8)  return 'text-xl sm:text-2xl';
  if (len > 5)  return 'text-2xl sm:text-3xl';
  return 'text-4xl sm:text-5xl';
}

function SrsContent({ allDataPromise }: { allDataPromise: Promise<[Vocabulary[], Kanji[], Grammar[]]> }) {
  const [vocab, kanji, grammar] = use(allDataPromise) as [Vocabulary[], Kanji[], Grammar[]];
  const { trackEvent } = useGamification();
  const [showExitDialog, setShowExitDialog] = useState(false);

  const initStore = useMemo(() => loadSrsStore(), []);

  const [state, dispatch] = useReducer(sessionReducer, {
    queue: [], currentIndex: 0, isFlipped: false,
    goodCount: 0, hardCount: 0, forgotCount: 0, reviewedToday: 0,
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
    void trackEvent('srs_session');
  }

  // Handle rating with gamification
  const handleRate = useCallback((quality: number) => {
    dispatch({ type: 'RATE', quality });
    if (quality >= 4) {
      void trackEvent('srs_card_good');
    }
  }, [trackEvent]);

  // Keyboard handler — Space/Enter=flip, J=Forgot, K=Hard, L=Good
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (state.phase !== 'playing') return;
    if (showExitDialog) return;
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      dispatch({ type: 'FLIP' });
      return;
    }

    if (e.key === 'Escape') {
      setShowExitDialog(true);
      return;
    }

    if (state.isFlipped) {
      if (e.key === 'j' || e.key === 'J') handleRate(1);
      if (e.key === 'k' || e.key === 'K') handleRate(2);
      if (e.key === 'l' || e.key === 'L') handleRate(4);
    }
  }, [state.phase, state.isFlipped, showExitDialog, handleRate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const currentItem = state.queue[state.currentIndex];
  const content     = currentItem ? getItemContent(currentItem) : null;
  const progress    = state.queue.length > 0 ? (state.currentIndex / state.queue.length) * 100 : 0;

  // Accuracy for complete screen
  const accuracy = state.queue.length > 0
    ? Math.round((state.goodCount / state.queue.length) * 100)
    : 0;

  const getEncouragement = (acc: number) => {
    if (acc === 100) return { title: 'Hoàn hảo tuyệt đối! 💯', desc: 'Bạn đã nhớ toàn bộ thẻ. Thật ấn tượng!' };
    if (acc >= 80)  return { title: 'Xuất sắc! 🎊', desc: 'Khả năng ghi nhớ của bạn rất đáng khen ngợi!' };
    if (acc >= 50)  return { title: 'Tốt lắm! 👍', desc: 'Hãy tiếp tục ôn tập để cải thiện tỷ lệ ghi nhớ nhé.' };
    return { title: 'Cố gắng lên! 💪', desc: 'Luyện tập đều đặn mỗi ngày sẽ giúp bạn tiến bộ nhanh hơn.' };
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard value={stats.due}           color="text-error"    icon="pending"          label="Cần ôn hôm nay" />
        <StatCard value={stats.learning}      color="text-amber-500" icon="sync"             label="Đang học" />
        <StatCard value={state.reviewedToday} color="text-primary"  icon="task_alt"          label="Đã ôn hôm nay" />
        <StatCard value={stats.mastered}      color="text-success"  icon="military_tech"     label="Đã thuộc" />
      </div>

      {/* ─── OVERVIEW PHASE ─── */}
      {state.phase === 'overview' && (
        <div className="max-w-[600px] mx-auto text-center py-10 px-6 bg-white border border-black/[0.03] rounded-3xl shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">neurology</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                       flex items-center gap-2 mx-auto shadow-sm"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            {stats.due === 0 ? 'Không có thẻ nào cần ôn' : `Bắt đầu ôn ${stats.due} thẻ`}
          </button>

          {stats.due === 0 && (
            <p className="text-xs text-on-surface-variant mt-4">
              Tuyệt vời! Hãy quay lại vào ngày mai để tiếp tục luyện tập.
            </p>
          )}

          <div className="border-t border-outline-variant/60 mt-8 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-4">Hướng dẫn phím tắt</h4>
            <div className="grid grid-cols-2 gap-3 max-w-[380px] mx-auto text-left text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface border border-outline-variant rounded shadow-sm font-mono text-[10px]">Space / Enter</kbd>
                <span>Lật thẻ</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface border border-outline-variant rounded shadow-sm font-mono text-[10px]">J</kbd>
                <span className="text-error font-medium">Quên rồi</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface border border-outline-variant rounded shadow-sm font-mono text-[10px]">K</kbd>
                <span className="text-amber-600 font-medium">Còn khó</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface border border-outline-variant rounded shadow-sm font-mono text-[10px]">L</kbd>
                <span className="text-primary-dark font-medium">Nhớ được!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PLAYING PHASE ─── */}
      {state.phase === 'playing' && content && (
        <div>
          {/* Progress bar + exit */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="font-semibold text-on-surface-variant">
                  {state.currentIndex + 1} / {state.queue.length}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                  {TYPE_LABELS[currentItem.type]}
                </span>
              </div>
              <div className="h-1.5 bg-outline-variant rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {/* Exit button */}
            <button
              onClick={() => setShowExitDialog(true)}
              title="Thoát phiên ôn tập (Esc)"
              className="shrink-0 w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant
                         flex items-center justify-center hover:bg-error/10 hover:text-error hover:border-error/30
                         transition-all"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Flip hint */}
          <div className="text-center text-xs text-on-surface-variant mb-3 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">touch_app</span>
            <span>Click thẻ hoặc nhấn <kbd className="px-1.5 py-0.5 bg-outline-variant/30 rounded font-mono text-[10px]">Space</kbd> để lật</span>
          </div>

          {/* 3D Card */}
          <div
            onClick={() => dispatch({ type: 'FLIP' })}
            className="w-full max-w-[560px] max-sm:max-w-full h-[280px] sm:h-[300px] mx-auto cursor-pointer group"
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
                           bg-white border border-black/[0.05] group-hover:border-primary/30 group-hover:shadow-xl
                           transition-all duration-300 shadow-md"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-xs text-on-surface-variant/80 mb-3 uppercase tracking-wider font-semibold select-none">
                  {content.frontLabel}
                </div>
                <div
                  className={`font-bold text-on-surface mb-2 text-center break-words max-w-full ${getFrontFontSize(content.frontMain)}`}
                  style={{ fontFamily: "'Noto Sans JP', sans-serif", lineHeight: 1.2 }}
                >
                  {content.frontMain}
                </div>
                {content.frontSub && (
                  <div className="text-sm sm:text-base text-on-surface-variant text-center" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {content.frontSub}
                  </div>
                )}
                {content.canTts && (
                  <button
                    onClick={e => { e.stopPropagation(); speak(content.ttsText); }}
                    className="mt-4 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center
                               hover:bg-primary/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    title="Phát âm"
                  >
                    <span className="material-symbols-outlined text-primary">volume_up</span>
                  </button>
                )}
                {/* Flip indicator */}
                <div className="absolute bottom-4 right-5 flex items-center gap-1 text-[10px] font-bold text-on-surface-variant/40 group-hover:text-primary transition-colors select-none">
                  <span>Lật thẻ</span>
                  <span className="material-symbols-outlined text-xs animate-spin-slow">sync</span>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl
                           border border-black/[0.05] group-hover:border-primary/30 group-hover:shadow-xl
                           transition-all duration-300 shadow-md"
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
                  className={`font-bold text-on-surface mb-2 text-center break-words max-w-full ${getFrontFontSize(content.backMain)}`}
                  style={{ lineHeight: 1.2 }}
                >
                  {content.backMain}
                </div>
                {content.backSub && (
                  <div className="text-xs sm:text-sm text-on-surface-variant/90 text-center mt-1">
                    {content.backSub}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating buttons — hiện sau khi lật */}
          {state.isFlipped && (
            <div className="flex items-stretch justify-center gap-3 mt-6 animate-fade-in-up w-full max-w-[560px] max-sm:max-w-full mx-auto">
              {RATINGS.map(r => (
                <button
                  key={r.q}
                  onClick={() => handleRate(r.q)}
                  className={`flex-1 py-3 rounded-2xl border-2 font-semibold transition-all
                              ${r.border} ${r.bg} ${r.text}
                              flex flex-col items-center gap-0.5`}
                >
                  <span className="material-symbols-outlined text-xl">{r.icon}</span>
                  <span className="text-sm font-bold">{r.label}</span>
                  <span className="text-[10px] opacity-60">{r.sub}</span>
                  <kbd className={`mt-1 px-1.5 py-0.5 text-[10px] rounded font-mono border max-sm:hidden
                                  ${r.q === 1 ? 'bg-error/10 border-error/20 text-error'
                                    : r.q === 2 ? 'bg-amber-100 border-amber-200 text-amber-600'
                                    : 'bg-primary/10 border-primary/20 text-primary'}`}>
                    {r.keyLabel}
                  </kbd>
                </button>
              ))}
            </div>
          )}

          {/* Keyboard hints */}
          <div className="text-center mt-4 text-xs text-on-surface-variant flex items-center justify-center gap-4 max-sm:hidden">
            {state.isFlipped ? (
              RATINGS.map(r => (
                <span key={r.q} className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-outline-variant/60 rounded font-mono text-[10px]">{r.keyLabel}</kbd>
                  <span className={r.text}>{r.label}</span>
                </span>
              ))
            ) : (
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-outline-variant/60 rounded font-mono text-[10px]">Space</kbd>
                <span>Lật thẻ</span>
                <span className="mx-2 text-outline-variant">·</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-outline-variant/60 rounded font-mono text-[10px]">Esc</kbd>
                <span>Thoát</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── COMPLETE PHASE ─── */}
      {state.phase === 'complete' && (() => {
        const msg = getEncouragement(accuracy);
        return (
          <div className="text-center py-8 px-4 max-w-[600px] mx-auto bg-white border border-black/[0.03] rounded-3xl shadow-sm animate-fade-in-up">
            <div className="text-5xl mb-4 animate-bounce">🎊</div>
            <h3 className="text-xl font-bold mb-1 text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {msg.title}
            </h3>
            <p className="text-sm text-on-surface-variant max-w-[400px] mx-auto mb-6">
              {msg.desc}
            </p>

            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center my-5">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary/10 to-primary/5 border-2 border-primary/20 shadow-inner">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-primary-dark">{accuracy}%</span>
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/80 font-bold mt-0.5">Nhớ được</div>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 max-w-[440px] mx-auto mb-7 mt-4">
              {[
                { val: state.goodCount,   label: 'Nhớ được',  bg: 'bg-primary/5 border-primary/20 text-primary-dark' },
                { val: state.hardCount,   label: 'Còn khó',   bg: 'bg-amber-50 border-amber-200 text-amber-600' },
                { val: state.forgotCount, label: 'Quên rồi',  bg: 'bg-error/5 border-error/20 text-error' },
              ].map(s => (
                <div key={s.label} className={`text-center py-3 px-2 rounded-2xl border ${s.bg}`}>
                  <div className="text-2xl sm:text-3xl font-extrabold">{s.val}</div>
                  <div className="text-[10px] sm:text-xs font-semibold mt-1 opacity-90">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center flex-wrap gap-3">
              <button
                onClick={() => dispatch({ type: 'BACK_TO_OVERVIEW' })}
                className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-semibold
                           hover:bg-primary-dark transition-all shadow-sm"
              >
                Ôn tiếp lần khác
              </button>
              <Link
                to="/dashboard"
                className="px-6 py-3 text-sm border border-outline-variant bg-white text-on-surface rounded-xl
                           hover:bg-gray-50 transition-colors font-semibold shadow-sm"
              >
                Về Dashboard
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Exit Dialog */}
      {showExitDialog && (
        <ExitConfirmDialog
          onConfirm={() => {
            setShowExitDialog(false);
            dispatch({ type: 'BACK_TO_OVERVIEW' });
          }}
          onCancel={() => setShowExitDialog(false)}
        />
      )}
    </div>
  );
}

// ============================================
// Page Export
// ============================================
export function SrsReviewPage() {
  const { user } = useAuth();
  const allDataPromise = useMemo(() => Promise.all([
    api.getAllVocabulary().catch(() => [] as Vocabulary[]),
    api.getAllKanji().catch(() => [] as Kanji[]),
    api.getAllGrammar().catch(() => [] as Grammar[]),
  ]), [user]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold max-sm:text-xl text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
        <SrsContent allDataPromise={allDataPromise} />
      </Suspense>
    </div>
  );
}
