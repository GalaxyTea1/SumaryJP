import { Suspense, use, useState, useMemo, useTransition, useRef } from 'react';
import { api } from '@/api';
import { escapeHtml } from '@/lib/utils';
import type { Grammar } from '@/types';

// ---- Constants ----
const ITEMS_PER_PAGE = 6;
const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

import { useAuth } from '@/context/AuthContext';

// ---- Level badge colors ----
const LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  N5: { bg: 'bg-primary-50',      text: 'text-primary' },
  N4: { bg: 'bg-warning-light',   text: 'text-secondary' },
  N3: { bg: 'bg-blue-50',         text: 'text-[#42a5f5]' },
  N2: { bg: 'bg-pink-50',         text: 'text-[#e91e63]' },
  N1: { bg: 'bg-purple-50',       text: 'text-[#9c27b0]' },
};

function getLevelStyle(level?: string) {
  return LEVEL_STYLES[level ?? ''] ?? LEVEL_STYLES['N5'];
}

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3)         return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

function highlightPattern(text: string, pattern: string): string {
  if (!text || !pattern) return escapeHtml(text ?? '');
  const cleanPattern = pattern.replace(/[～〜]/g, '');
  const escaped = escapeHtml(text);
  if (cleanPattern && text.includes(cleanPattern)) {
    return escaped.replace(
      escapeHtml(cleanPattern),
      `<span class="text-primary font-bold">${escapeHtml(cleanPattern)}</span>`,
    );
  }
  return escaped;
}

// ---- Grammar Card ----
interface GrammarCardProps {
  grammar: Grammar & { example_ja?: string; example_vi?: string; note?: string };
}

function GrammarCard({ grammar: g }: GrammarCardProps) {
  const [expanded, setExpanded] = useState(false);
  const levelStyle = getLevelStyle(g.level);
  const metaLabel = [g.lesson ? `Bài ${g.lesson}` : '', g.textbook ?? ''].filter(Boolean).join(' • ');
  const exampleHtml = g.example_ja
    ? highlightPattern(g.example_ja, g.pattern)
    : '<span class="text-on-surface-variant italic">Chưa có ví dụ</span>';

  return (
    <div className="card p-6 hover:shadow-card-hover transition-shadow bg-white border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
            {g.level}
          </span>
          {metaLabel && (
            <span className="text-xs text-on-surface-variant">{metaLabel}</span>
          )}
        </div>
      </div>

      {/* Pattern */}
      <div
        className="text-2xl font-bold mb-2 text-on-surface"
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        {escapeHtml(g.pattern)}
      </div>

      {/* Meaning */}
      <div className="text-on-surface-variant mb-4 text-sm">{escapeHtml(g.meaning)}</div>

      {/* Example */}
      <div className="bg-surface-dim rounded-xl p-3 mb-2">
        <div
          className="text-sm text-on-surface"
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          dangerouslySetInnerHTML={{ __html: exampleHtml }}
        />
        {g.example_vi && (
          <div className="text-on-surface-variant italic text-sm mt-1">
            → {escapeHtml(g.example_vi)}
          </div>
        )}
      </div>

      {/* Note */}
      {g.note && (
        <div className="text-xs text-on-surface-variant mt-2 flex items-start gap-1">
          <span className="material-symbols-outlined text-sm">info</span>
          {escapeHtml(g.note)}
        </div>
      )}

      {g.explanation && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-sm text-primary font-semibold hover:underline mt-2 inline-block"
          >
            {expanded ? 'Thu gọn ↑' : 'Xem chi tiết →'}
          </button>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-outline-variant text-sm text-on-surface-variant leading-relaxed animate-fade-in-up">
              {escapeHtml(g.explanation ?? '')}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GrammarCardSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton h-4 w-10 rounded-full" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      <div className="skeleton h-7 w-40 rounded mb-2" />
      <div className="skeleton h-4 w-3/4 rounded mb-4" />
      <div className="bg-surface-dim rounded-xl p-3 space-y-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

function GrammarGrid({ grammarPromise }: { grammarPromise: Promise<Grammar[]> }) {
  const allGrammar = use(grammarPromise);

  const [activeLevel,  setActiveLevel]  = useState('all');
  const [localSearch,  setLocalSearch]  = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [isPending, startTransitionHook] = useTransition();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return allGrammar.filter(g => {
      if (activeLevel !== 'all' && g.level !== activeLevel) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (g.pattern   ?? '').toLowerCase().includes(q)
            || (g.meaning   ?? '').toLowerCase().includes(q)
            || (g.example_ja ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [allGrammar, activeLevel, searchQuery]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const page       = Math.min(currentPage, Math.max(1, totalPages));
  const pageItems  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function handleLevel(level: string) {
    startTransitionHook(() => {
      setActiveLevel(level);
      setCurrentPage(1);
    });
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      <div className="card p-4 flex flex-wrap items-center gap-3 max-sm:gap-2 flex-shrink-0 bg-white">
        
        <div className="flex gap-2 flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:scrollbar-none max-sm:pb-1 flex-shrink-0">
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

        <div className="h-6 w-px bg-gray-200 hidden md:block" />

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative max-sm:min-w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm ngữ pháp..."
            value={localSearch}
            onChange={e => {
              const val = e.target.value;
              setLocalSearch(val);
              startTransitionHook(() => {
                setSearchQuery(val);
                setCurrentPage(1);
              });
            }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-outline-variant rounded-lg
                       bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       transition-all"
          />
        </div>

        {/* Count */}
        <span className="text-xs text-on-surface-variant ml-auto max-sm:w-full max-sm:text-right">
          {filtered.length} cấu trúc
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className={`flex-grow overflow-y-auto min-h-0 scrollbar-thin transition-opacity ${isPending ? 'opacity-60' : ''}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {pageItems.length === 0 ? (
            <div className="col-span-2 text-center text-on-surface-variant py-12 bg-white card border border-gray-100">
              Không tìm thấy ngữ pháp nào.
            </div>
          ) : (
            pageItems.map(g => <GrammarCard key={g.id} grammar={g} />)
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-2 text-sm flex-shrink-0 py-1">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant
                       hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            ← Trước
          </button>
          {getPaginationRange(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-3 py-1.5 text-on-surface-variant">...</span>
            ) : (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'border border-outline-variant text-on-surface-variant hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant
                       hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
}

export function GrammarPage() {
  const { user } = useAuth();
  const grammarPromise = useMemo(() => {
    return user ? api.getAllGrammar().catch(() => [] as Grammar[]) : Promise.resolve([] as Grammar[]);
  }, [user]);

  return (
    <div className="flex flex-col h-[calc(100dvh-110px)] lg:h-[calc(100vh-160px)] overflow-hidden space-y-4 pb-2">
      {/* <div className="mb-2 flex-shrink-0">
        <h1 className="text-2xl font-bold max-sm:text-xl text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Ngữ Pháp Tiếng Nhật
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Tổng hợp cấu trúc ngữ pháp từ N5 đến N1
        </p>
      </div> */}

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => <GrammarCardSkeleton key={i} />)}
          </div>
        }
      >
        <GrammarGrid grammarPromise={grammarPromise} />
      </Suspense>
    </div>
  );
}
