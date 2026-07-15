import { Suspense, use, useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { api } from '@/api';
import { escapeHtml } from '@/lib/utils';
import type { Kanji } from '@/types';
import CustomSelect from '@/components/Select';

interface KanjiExtended extends Kanji {
  character?: string;  
  radical?: string;
  example_words?: string;
}

import { useAuth } from '@/context/AuthContext';

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
  const options = useMemo(() => {
    return [
      { value: 'all', label: 'Tất cả bài' },
      ...lessons.map(l => ({ value: l, label: `Bài ${l}` }))
    ];
  }, [lessons]);

  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      className="min-w-[150px] max-sm:flex-1"
    />
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
                 transition-all duration-200 relative w-full bg-white border border-gray-100 flex flex-col items-center justify-between"
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
      <div>
        <div className="text-sm font-semibold mb-1 text-on-surface">{escapeHtml(k.meaning)}</div>
        <div
          className="text-xs text-on-surface-variant mb-2 line-clamp-1"
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
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
        <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-center text-white rounded-t-2xl relative animate-fade-in-up">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <div
            className="text-7xl font-bold mb-2 animate-pulse"
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
              <div className="font-bold text-lg text-on-surface font-['Noto_Sans_JP']">
                {k.onyomi || '—'}
              </div>
            </div>
            <div className="bg-surface-dim rounded-xl p-4">
              <div className="text-xs text-on-surface-variant mb-1 uppercase tracking-wider">Kun'yomi (Âm Kun)</div>
              <div className="font-bold text-lg text-on-surface font-['Noto_Sans_JP']">
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
                      className="text-lg font-bold text-primary font-['Noto_Sans_JP']"
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
              <div className="font-bold text-lg text-on-surface font-['Noto_Sans_JP']">
                {escapeHtml(k.radical)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanjiSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 flex-grow overflow-hidden">
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

function KanjiGrid({ kanjiPromise }: { kanjiPromise: Promise<KanjiExtended[]> }) {
  const allKanji = use(kanjiPromise) as KanjiExtended[];

  const [activeLevel,   setActiveLevel]   = useState('all');
  const [activeLesson,  setActiveLesson]  = useState('all');
  const [localSearch,   setLocalSearch]   = useState('');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedKanji, setSelectedKanji] = useState<KanjiExtended | null>(null);
  const [isPending, startTransition]      = useTransition();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
  }, [activeLevel, activeLesson, searchQuery]);

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
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      <div className="flex items-start gap-3 flex-wrap flex-shrink-0 bg-transparent">
        <div className="flex items-center gap-2 flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:scrollbar-none max-sm:pb-1 flex-shrink-0">
          {(['all', ...LEVELS] as const).map(level => (
            <button
              key={level}
              onClick={() => handleLevel(level)}
              className={`px-3.5 py-1.5 rounded-full text-[0.8125rem] font-medium border transition-all flex-shrink-0
                ${activeLevel === level
                  ? 'bg-primary text-white border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
            >
              {level === 'all' ? 'Tất cả' : level}
            </button>
          ))}
        </div>

        <LessonSelect
          lessons={lessons}
          value={activeLesson}
          onChange={val => {
            startTransition(() => {
              setActiveLesson(val);
            });
          }}
        />

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-sm:w-full max-sm:min-w-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kanji, nghĩa..."
            value={localSearch}
            onChange={e => {
              const val = e.target.value;
              setLocalSearch(val);
              startTransition(() => {
                setSearchQuery(val);
              });
            }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-outline-variant rounded-xl
                       bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-on-surface-variant flex-shrink-0 px-1">
        <span className="font-semibold text-on-surface">{filtered.length} Kanji</span>
        <span>•</span>
        <span>{uniqueLessons} bài</span>
      </div>

      <div
        ref={scrollContainerRef}
        className={`flex-grow overflow-y-auto min-h-0 scrollbar-thin transition-opacity ${isPending ? 'opacity-60' : ''}`}
      >
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white card border border-gray-100 rounded-2xl">
            <h3 className="text-lg font-bold mb-2 text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Không tìm thấy Kanji nào
            </h3>
            <p className="text-sm text-on-surface-variant">Thử lọc theo level hoặc bài khác</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4"
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
      </div>

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

export function KanjiPage() {
  const { user } = useAuth();
  const kanjiPromise = useMemo(() => {
    return user ? api.getAllKanji().catch(() => [] as KanjiExtended[]) : Promise.resolve([] as KanjiExtended[]);
  }, [user]);

  return (
    <div className="flex flex-col h-[calc(100dvh-110px)] lg:h-[calc(100vh-160px)] overflow-hidden space-y-4 pb-2">
      {/* <div className="mb-2 flex-shrink-0">
        <h1 className="text-2xl font-bold max-sm:text-xl text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Kanji
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Khám phá và học Kanji theo bài
        </p>
      </div> */}

      <Suspense fallback={<KanjiSkeleton />}>
        <KanjiGrid kanjiPromise={kanjiPromise} />
      </Suspense>
    </div>
  );
}
