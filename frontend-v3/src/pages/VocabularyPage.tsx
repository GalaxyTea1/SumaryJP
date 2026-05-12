// ============================================
// VocabularyPage — SumaryJP
// React 19: use() hook + useOptimistic cho toggle difficult
// ============================================

import { Suspense, use, useState, useOptimistic, useCallback, useMemo, useTransition } from 'react';
import { api } from '@/api';
import { escapeHtml } from '@/lib/utils';
import type { Vocabulary } from '@/types';

// ---- Constants ----
const ITEMS_PER_PAGE = 20;
const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const STATUS_OPTIONS = [
  { value: 'all',         label: 'Tất cả trạng thái' },
  { value: 'not-learned', label: 'Chưa học' },
  { value: 'learning',    label: 'Đang học' },
  { value: 'mastered',    label: 'Đã thuộc' },
] as const;

// ---- Pre-fetch promise (ngoài component để không re-create) ----
const vocabPromise = api.getAllVocabulary().catch(() => [] as Vocabulary[]);

// ---- Helpers ----
function getWordType(vocab: Vocabulary): string {
  if ('word_type' in vocab && vocab['word_type' as keyof Vocabulary]) {
    return String(vocab['word_type' as keyof Vocabulary]);
  }
  const jp = vocab.japanese ?? '';
  if (/[いう]$/.test(jp))              return 'Tính từ';
  if (/[るすくむぐぬぶつ]$/.test(jp)) return 'Động từ';
  return 'Danh từ';
}

function getTypeColor(type: string): string {
  if (type.includes('Động từ')) return 'bg-blue-50 text-[#42a5f5]';
  if (type.includes('Tính từ')) return 'bg-warning-light text-secondary';
  return 'bg-primary-50 text-primary';
}

function getStatusInfo(status?: string): { color: string; text: string } {
  switch (status) {
    case 'mastered':    return { color: '#4caf50', text: 'Đã thuộc' };
    case 'learning':    return { color: '#f0a868', text: 'Đang học' };
    default:            return { color: '#9ca3af', text: 'Chưa học' };
  }
}

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3)         return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

// ---- Select Dropdown ----
interface SelectProps {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

function Select({ options, value, onChange, className = '' }: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-8 py-1.5 text-sm border border-outline-variant rounded-lg
                   bg-white text-on-surface-variant focus:outline-none focus:border-primary
                   focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-base pointer-events-none text-on-surface-variant">
        expand_more
      </span>
    </div>
  );
}

// ---- Skeleton Row ----
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-t border-gray-50">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="skeleton h-3 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ============================================
// VocabRow — useOptimistic cho toggle difficult
// ✨ React 19: UI cập nhật ngay không chờ API
// ============================================
interface VocabRowProps {
  vocab: Vocabulary & { is_difficult?: boolean };
  index: number;
  onDifficultToggle: (vocab: Vocabulary & { is_difficult?: boolean }) => void;
}

function VocabRow({ vocab, index, onDifficultToggle }: VocabRowProps) {
  const [optimisticDifficult, setOptimisticDifficult] = useOptimistic(
    vocab.is_difficult ?? false,
    (_state: boolean, newVal: boolean) => newVal,
  );

  const statusInfo = getStatusInfo(vocab.status);
  const wordType   = getWordType(vocab);
  const typeColor  = getTypeColor(wordType);

  function handleSpeak() {
    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(vocab.japanese);
      utt.lang = 'ja-JP';
      window.speechSynthesis.speak(utt);
    }
  }

  function handleToggleDifficult() {
    setOptimisticDifficult(!optimisticDifficult); // UI ngay lập tức
    onDifficultToggle(vocab);
  }

  return (
    <tr className="border-t border-gray-50 hover:bg-surface-dim transition-colors">
      <td className="px-5 py-3 text-on-surface-variant text-sm">{index}</td>
      <td className="px-5 py-3 font-bold text-base" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
        {escapeHtml(vocab.japanese)}
      </td>
      <td className="px-5 py-3 text-on-surface-variant" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
        {escapeHtml(vocab.hiragana ?? '')}
      </td>
      <td className="px-5 py-3 text-sm">{escapeHtml(vocab.meaning)}</td>
      <td className="px-5 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor}`}>
          {escapeHtml(wordType)}
        </span>
      </td>
      <td className="px-5 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: statusInfo.color }} />
          <span className="text-xs" style={{ color: statusInfo.color }}>{statusInfo.text}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={handleToggleDifficult}
            title="Đánh dấu khó"
            className="p-1 hover:bg-primary-50 rounded transition-colors"
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{
                color: optimisticDifficult ? '#f0a868' : '#9ca3af',
                fontVariationSettings: optimisticDifficult ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              star
            </span>
          </button>
          <button
            onClick={handleSpeak}
            title="Phát âm"
            className="p-1 hover:bg-primary-50 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-on-surface-variant">volume_up</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// VocabTable — nội dung chính
// ============================================
function VocabTable() {
  const allVocab = use(vocabPromise) as (Vocabulary & { is_difficult?: boolean })[];

  // Filter state
  const [activeLevel,  setActiveLevel]  = useState('all');
  const [activeLesson, setActiveLesson] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [vocabList,    setVocabList]    = useState(allVocab);

  // ✨ React 19: useTransition — filter không block UI
  const [isPending, startTransition] = useTransition();

  // Lesson list từ data
  const lessons = useMemo(() => {
    const set = new Set(allVocab.map(v => String(v.lesson ?? '')).filter(Boolean));
    return [...set].sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
  }, [allVocab]);

  const lessonOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả bài' },
    ...lessons.map(l => ({ value: l, label: `Bài ${l}` })),
  ], [lessons]);

  // Filtered vocab
  const filtered = useMemo(() => {
    return vocabList.filter(v => {
      if (activeLevel  !== 'all' && v.level  !== activeLevel)              return false;
      if (activeLesson !== 'all' && String(v.lesson) !== activeLesson)     return false;
      if (activeStatus !== 'all' && v.status !== activeStatus)             return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (v.japanese ?? '').toLowerCase().includes(q)
            || (v.hiragana ?? '').toLowerCase().includes(q)
            || (v.meaning  ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [vocabList, activeLevel, activeLesson, activeStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const page       = Math.min(currentPage, Math.max(1, totalPages));
  const pageItems  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Stats
  const mastered   = filtered.filter(v => v.status === 'mastered').length;
  const learning   = filtered.filter(v => v.status === 'learning').length;
  const notLearned = filtered.filter(v => v.status === 'not-learned').length;

  function handleFilter(key: string, val: string) {
    startTransition(() => {
      if (key === 'level')  setActiveLevel(val);
      if (key === 'lesson') setActiveLesson(val);
      if (key === 'status') setActiveStatus(val);
      setCurrentPage(1);
    });
  }

  async function handleToggleDifficult(vocab: Vocabulary & { is_difficult?: boolean }) {
    const updated = { ...vocab, is_difficult: !vocab.is_difficult };
    try {
      await api.updateVocabulary(updated as Vocabulary);
      setVocabList(prev => prev.map(v => v.id === vocab.id ? updated : v));
    } catch (e) {
      console.error('Toggle difficult failed:', e);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        {/* Level pills */}
        <div className="flex gap-2 flex-wrap">
          {['all', ...LEVELS].map(level => (
            <button
              key={level}
              onClick={() => handleFilter('level', level)}
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

        {/* Lesson dropdown */}
        <Select
          options={lessonOptions}
          value={activeLesson}
          onChange={val => handleFilter('lesson', val)}
          className="min-w-[140px]"
        />

        {/* Status dropdown */}
        <Select
          options={STATUS_OPTIONS}
          value={activeStatus}
          onChange={val => handleFilter('status', val)}
          className="min-w-[160px]"
        />

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm từ vựng..."
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
      </div>

      {/* Table */}
      <div className={`card overflow-hidden transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr className="bg-surface-dim text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <th className="px-5 py-3 w-12">#</th>
              <th className="px-5 py-3">Tiếng Nhật</th>
              <th className="px-5 py-3">Hiragana</th>
              <th className="px-5 py-3">Nghĩa</th>
              <th className="px-5 py-3">Loại từ</th>
              <th className="px-5 py-3 text-center">Trạng thái</th>
              <th className="px-5 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-on-surface-variant">
                  Không tìm thấy từ vựng nào.
                </td>
              </tr>
            ) : (
              pageItems.map((v, i) => (
                <VocabRow
                  key={v.id}
                  vocab={v}
                  index={(page - 1) * ITEMS_PER_PAGE + i + 1}
                  onDifficultToggle={handleToggleDifficult}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-sm text-on-surface-variant">
        {filtered.length} từ &nbsp;|&nbsp;
        <span className="text-success">Đã thuộc: {mastered}</span> &nbsp;|&nbsp;
        <span className="text-secondary">Đang học: {learning}</span> &nbsp;|&nbsp;
        Chưa học: {notLearned}
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
          {getPaginationRange(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-3 py-1.5 text-on-surface-variant">...</span>
            ) : (
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
            )
          )}
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
export function VocabularyPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Từ Vựng Tiếng Nhật
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">Quản lý và ôn tập từ vựng của bạn</p>
      </div>
      <Suspense
        fallback={
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-dim text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {['#','Tiếng Nhật','Hiragana','Nghĩa','Loại từ','Trạng thái','Hành động'].map(h => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody><SkeletonRows /></tbody>
            </table>
          </div>
        }
      >
        <VocabTable />
      </Suspense>
    </div>
  );
}
