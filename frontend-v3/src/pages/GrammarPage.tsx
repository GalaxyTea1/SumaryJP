// ============================================
// GrammarPage — SumaryJP
// React 19: use() + useTransition cho filter
// Card layout với pattern highlight
// ============================================

import { Suspense, use, useState, useMemo, useTransition } from 'react';
import { api } from '@/api';
import { escapeHtml } from '@/lib/utils';
import type { Grammar } from '@/types';

// ---- Constants ----
const ITEMS_PER_PAGE = 6;
const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

// ---- Pre-fetch ----
const grammarPromise = api.getAllGrammar().catch(() => [] as Grammar[]);

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

// ---- Highlight pattern trong example_ja ----
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
    <div className="card p-6 hover:shadow-card-hover transition-shadow">
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

      {/* Expand explanation */}
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

// ---- Skeleton Card ----
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

// ---- Grammar Grid (data fetched via use()) ----
function GrammarGrid() {
  const allGrammar = use(grammarPromise) as (Grammar & {
    example_ja?: string;
    example_vi?: string;
    note?: string;
  })[];

  const [activeLevel,  setActiveLevel]  = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [isPending, startTransition]    = useTransition();

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
    startTransition(() => {
      setActiveLevel(level);
      setCurrentPage(1);
    });
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        {/* Level pills */}
        <div className="flex gap-2 flex-wrap">
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

        <div className="h-6 w-px bg-gray-200 hidden md:block" />

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm ngữ pháp..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-outline-variant rounded-lg
                       bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       transition-all"
          />
        </div>

        {/* Count */}
        <span className="text-xs text-on-surface-variant ml-auto">
          {filtered.length} cấu trúc
        </span>
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        {pageItems.length === 0 ? (
          <div className="col-span-2 text-center text-on-surface-variant py-12">
            Không tìm thấy ngữ pháp nào.
          </div>
        ) : (
          pageItems.map(g => <GrammarCard key={g.id} grammar={g} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          <button
            onClick={() => setCurrentPage(p => p - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant
                       hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            ← Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                p === page
                  ? 'bg-primary text-white'
                  : 'border border-outline-variant text-on-surface-variant hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => p + 1)}
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

// ============================================
// Page Export
// ============================================
export function GrammarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Ngữ Pháp Tiếng Nhật
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Tổng hợp cấu trúc ngữ pháp từ N5 đến N1
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <GrammarCardSkeleton key={i} />)}
          </div>
        }
      >
        <GrammarGrid />
      </Suspense>
    </div>
  );
}
