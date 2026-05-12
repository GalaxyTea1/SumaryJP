// ============================================
// KanjiPage — SumaryJP
// React 19: use() + useState cho modal
// Card grid với detail modal
// ============================================

import { Suspense, use, useState, useMemo, useTransition, useEffect } from 'react';
import { api } from '@/api';
import { escapeHtml } from '@/lib/utils';
import type { Kanji } from '@/types';

// ---- Extended Kanji type (từ v2 có thêm fields) ----
interface KanjiExtended extends Kanji {
  character?: string;   // alias cho kanji field
  radical?: string;
  example_words?: string;
}

// ---- Pre-fetch ----
const kanjiPromise = api.getAllKanji().catch(() => [] as KanjiExtended[]);

// ---- Level badge ----
const LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  N5: { bg: 'bg-success-light',   text: 'text-[#388e3c]' },
  N4: { bg: 'bg-blue-50',         text: 'text-[#1976d2]' },
  N3: { bg: 'bg-warning-light',   text: 'text-[#e65100]' },
  N2: { bg: 'bg-pink-50',         text: 'text-[#c62828]' },
  N1: { bg: 'bg-purple-50',       text: 'text-[#7b1fa2]' },
};
function getLevelStyle(level?: string) {
  return LEVEL_STYLES[level ?? ''] ?? LEVEL_STYLES['N5'];
}

// ---- Lesson select ----
interface LessonSelectProps {
  lessons: string[];
  value: string;
  onChange: (v: string) => void;
}
function LessonSelect({ lessons, value, onChange }: LessonSelectProps) {
  return (
    <div className="relative min-w-[150px]">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-8 py-1.5 text-sm border border-outline-variant
                   rounded-lg bg-white text-on-surface-variant focus:outline-none focus:border-primary
                   focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
      >
        <option value="all">Tất cả bài</option>
        {lessons.map(l => (
          <option key={l} value={l}>Bài {l}</option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-base pointer-events-none text-on-surface-variant">
        expand_more
      </span>
    </div>
  );
}

// ---- Kanji Card ----
function KanjiCard({ k, onClick }: { k: KanjiExtended; onClick: () => void }) {
  const char       = k.kanji ?? k.character ?? '';
  const levelStyle = getLevelStyle(k.level);

  return (
    <button
      onClick={onClick}
      className="card p-5 text-center cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5
                 transition-all duration-200 relative w-full"
    >
      {k.stroke_count && (
        <div className="absolute top-2.5 right-2.5 text-[0.6875rem] text-on-surface-variant
                        bg-surface-dim px-1.5 py-0.5 rounded">
          {k.stroke_count} nét
        </div>
      )}
      <div
        className="text-[3.5rem] font-bold leading-none mb-3 text-on-surface group-hover:text-primary transition-colors"
        style={{ fontFamily: "'Noto Sans JP', serif" }}
      >
        {escapeHtml(char)}
      </div>
      <div className="text-sm font-semibold mb-1">{escapeHtml(k.meaning)}</div>
      <div
        className="text-xs text-on-surface-variant mb-2"
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        {[k.onyomi, k.kunyomi].filter(Boolean).join(' / ')}
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <span className={`text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
          {k.level}
        </span>
        {k.lesson && (
          <span className="text-[0.6875rem] text-on-surface-variant">Bài {k.lesson}</span>
        )}
      </div>
    </button>
  );
}

// ---- Kanji Detail Modal ----
interface KanjiModalProps {
  kanji: KanjiExtended | null;
  onClose: () => void;
}

function KanjiModal({ kanji: k, onClose }: KanjiModalProps) {
  // Đóng bằng Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!k) return null;

  const char        = k.kanji ?? k.character ?? '';
  const levelStyle  = getLevelStyle(k.level);
  const exampleWords = k.example_words
    ? k.example_words.split('、').map(w => ({
        word: w.split('（')[0],
        reading: w.match(/（(.+?)）/)?.[1] ?? '',
      }))
    : [];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[100] flex items-center justify-center p-4 animate-fade-in-up"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-elevated">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-center text-white rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <div
            className="text-7xl font-bold mb-2"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            {escapeHtml(char)}
          </div>
          <div className="text-lg font-semibold">{escapeHtml(k.meaning)}</div>
          <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
            <span className={`text-[0.6875rem] font-bold px-2.5 py-1 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
              {k.level}
            </span>
            {k.lesson && <span className="text-sm text-white/80">Bài {k.lesson}</span>}
            {k.stroke_count && <span className="text-sm text-white/80">• {k.stroke_count} nét</span>}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-dim rounded-xl p-4">
              <div className="text-xs text-on-surface-variant mb-1 uppercase tracking-wider">On'yomi (Âm On)</div>
              <div className="font-bold text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                {k.onyomi || '—'}
              </div>
            </div>
            <div className="bg-surface-dim rounded-xl p-4">
              <div className="text-xs text-on-surface-variant mb-1 uppercase tracking-wider">Kun'yomi (Âm Kun)</div>
              <div className="font-bold text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                {k.kunyomi || '—'}
              </div>
            </div>
          </div>

          {/* Example words */}
          <div>
            <div className="text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Từ ví dụ</div>
            {exampleWords.length > 0 ? (
              <div className="space-y-2">
                {exampleWords.map((ex, i) => (
                  <div key={i} className="bg-surface-dim rounded-lg p-3 flex items-center gap-3">
                    <span
                      className="text-lg font-bold text-primary"
                      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                    >
                      {escapeHtml(ex.word)}
                    </span>
                    {ex.reading && (
                      <span className="text-sm text-on-surface-variant">{escapeHtml(ex.reading)}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-on-surface-variant italic">Chưa có ví dụ</div>
            )}
          </div>

          {/* Radical */}
          {k.radical && (
            <div>
              <div className="text-xs text-on-surface-variant mb-1 uppercase tracking-wider">Bộ thủ</div>
              <div className="font-bold text-lg" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                {escapeHtml(k.radical)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Skeleton Grid ----
function KanjiSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="card p-5 text-center">
          <div className="skeleton h-14 w-14 rounded-lg mx-auto mb-3" />
          <div className="skeleton h-3 w-3/4 rounded mx-auto mb-2" />
          <div className="skeleton h-3 w-1/2 rounded mx-auto" />
        </div>
      ))}
    </div>
  );
}

// ---- Kanji Grid (fetches with use()) ----
function KanjiGrid() {
  const allKanji = use(kanjiPromise) as KanjiExtended[];

  const [activeLevel,   setActiveLevel]   = useState('all');
  const [activeLesson,  setActiveLesson]  = useState('all');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedKanji, setSelectedKanji] = useState<KanjiExtended | null>(null);
  const [isPending, startTransition]      = useTransition();

  const lessons = useMemo(() => {
    const set = new Set(allKanji.map(k => String(k.lesson ?? '')).filter(Boolean));
    return [...set].sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
  }, [allKanji]);

  const filtered = useMemo(() => {
    return allKanji.filter(k => {
      if (activeLevel  !== 'all' && k.level !== activeLevel)           return false;
      if (activeLesson !== 'all' && String(k.lesson) !== activeLesson) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const char = k.kanji ?? k.character ?? '';
        return char.includes(q)
            || (k.meaning  ?? '').toLowerCase().includes(q)
            || (k.onyomi   ?? '').toLowerCase().includes(q)
            || (k.kunyomi  ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [allKanji, activeLevel, activeLesson, searchQuery]);

  const uniqueLessons = new Set(filtered.map(k => k.lesson).filter(Boolean)).size;

  function handleLevel(level: string) {
    startTransition(() => { setActiveLevel(level); });
  }

  const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', ...LEVELS] as const).map(level => (
            <button
              key={level}
              onClick={() => handleLevel(level)}
              className={`px-3.5 py-1.5 rounded-full text-[0.8125rem] font-medium border transition-all
                ${activeLevel === level
                  ? 'bg-primary text-white border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
            >
              {level === 'all' ? 'Tất cả' : level}
            </button>
          ))}
        </div>

        <LessonSelect lessons={lessons} value={activeLesson} onChange={val => setActiveLesson(val)} />

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kanji, nghĩa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-outline-variant rounded-xl
                       bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-sm text-on-surface-variant">
        <span className="font-semibold text-on-surface">{filtered.length} Kanji</span>
        <span>•</span>
        <span>{uniqueLessons} bài</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Không tìm thấy Kanji nào
          </h3>
          <p className="text-sm text-on-surface-variant">Thử lọc theo level hoặc bài khác</p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4
            transition-opacity ${isPending ? 'opacity-60' : ''}`}
        >
          {filtered.map(k => (
            <KanjiCard
              key={k.id}
              k={k}
              onClick={() => setSelectedKanji(k)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedKanji && (
        <KanjiModal
          kanji={selectedKanji}
          onClose={() => setSelectedKanji(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Page Export
// ============================================
export function KanjiPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Kanji
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Khám phá và học Kanji theo bài
        </p>
      </div>

      <Suspense fallback={<KanjiSkeleton />}>
        <KanjiGrid />
      </Suspense>
    </div>
  );
}
