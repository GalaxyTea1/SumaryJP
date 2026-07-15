import { Suspense, use, useState, useOptimistic, useMemo, useTransition, useRef, startTransition } from 'react';
import { api } from '@/api';
import { escapeHtml } from '@/lib/utils';
import type { Vocabulary } from '@/types';
import { useAuth } from '@/context/AuthContext';
import CustomSelect from '@/components/Select';

const ITEMS_PER_PAGE = 20;
const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const STATUS_OPTIONS = [
  { value: 'all',         label: 'Tất cả trạng thái' },
  { value: 'not-learned', label: 'Chưa học' },
  { value: 'learning',    label: 'Đang học' },
  { value: 'mastered',    label: 'Đã thuộc' },
] as const;

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

interface SelectProps {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

function Select({ options, value, onChange, className = '' }: SelectProps) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options as { value: string | number; label: string }[]}
      className={className}
    />
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      <div className="card p-4 flex flex-wrap gap-3 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-full" />
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        <div className="h-8 w-36 bg-gray-200 rounded-lg" />
        <div className="h-8 w-48 bg-gray-200 rounded-lg flex-1" />
      </div>
      <div className="card p-4 flex-grow overflow-hidden animate-pulse space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
            <div className="space-y-2 w-1/3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface VocabRowProps {
  vocab: Vocabulary;
  index: number;
  onDifficultToggle: (vocab: Vocabulary) => void;
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
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(vocab.japanese);
      utt.lang = 'ja-JP';
      utt.rate = 0.7;
      window.speechSynthesis.speak(utt);
    }
  }

  function handleToggleDifficult() {
    startTransition(async () => {
      setOptimisticDifficult(!optimisticDifficult);
      try {
        await onDifficultToggle(vocab);
      } catch {
      }
    });
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

function VocabCard({ vocab, index, onDifficultToggle }: VocabRowProps) {
  const [optimisticDifficult, setOptimisticDifficult] = useOptimistic(
    vocab.is_difficult ?? false,
    (_state: boolean, newVal: boolean) => newVal,
  );

  const statusInfo = getStatusInfo(vocab.status);
  const wordType   = getWordType(vocab);
  const typeColor  = getTypeColor(wordType);

  function handleSpeak() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(vocab.japanese);
      utt.lang = 'ja-JP';
      utt.rate = 0.7;
      window.speechSynthesis.speak(utt);
    }
  }

  function handleToggleDifficult() {
    startTransition(async () => {
      setOptimisticDifficult(!optimisticDifficult);
      try {
        await onDifficultToggle(vocab);
      } catch {
      }
    });
  }

  return (
    <article className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <div className="text-xs text-on-surface-variant mb-1 font-medium">#{index}</div>
            <div className="font-bold text-lg text-on-surface font-['Noto_Sans_JP'] break-all leading-snug">
              {escapeHtml(vocab.japanese)}
            </div>
            <div className="text-xs text-on-surface-variant font-['Noto_Sans_JP'] mt-0.5 break-all">
              {escapeHtml(vocab.hiragana ?? '')}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={handleToggleDifficult}
              title="Đánh dấu khó"
              className="p-1.5 hover:bg-primary-50 rounded-lg transition-colors"
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
              className="p-1.5 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-on-surface-variant">volume_up</span>
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-on-surface leading-relaxed break-words font-medium">
          {escapeHtml(vocab.meaning)}
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center text-xs pt-2 border-t border-gray-50 flex-shrink-0">
        <span className={`px-2.5 py-0.5 rounded-full font-medium ${typeColor}`}>
          {escapeHtml(wordType)}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: statusInfo.color }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusInfo.color }} />
          {statusInfo.text}
        </span>
      </div>
    </article>
  );
}

function VocabTable({ vocabPromise }: { vocabPromise: Promise<Vocabulary[]> }) {
  const allVocab = use(vocabPromise);

  const [activeLevel,  setActiveLevel]  = useState('all');
  const [activeLesson, setActiveLesson] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [localSearch,  setLocalSearch]  = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [vocabList,    setVocabList]    = useState(allVocab);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isPending, startTransition] = useTransition();

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

  // Stats (reserved for future UI use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mastered   = filtered.filter(v => v.status === 'mastered').length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const learning   = filtered.filter(v => v.status === 'learning').length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const notLearned = filtered.filter(v => v.status === 'not-learned').length;

  function handleFilter(key: string, val: string) {
    startTransition(() => {
      if (key === 'level')  setActiveLevel(val);
      if (key === 'lesson') setActiveLesson(val);
      if (key === 'status') setActiveStatus(val);
      setCurrentPage(1);
    });
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  async function handleToggleDifficult(vocab: Vocabulary) {
    const nextDifficult = !vocab.is_difficult;
    const updated = { ...vocab, is_difficult: nextDifficult };
    try {
      await api.updateVocabularyProgress(vocab.id, {
        is_difficult: nextDifficult,
        status: vocab.status,
      });
      setVocabList(prev => prev.map(v => v.id === vocab.id ? updated : v));
    } catch (e) {
      console.error('Toggle difficult failed:', e);
      throw e;
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      <div className="card p-4 flex flex-wrap items-center gap-3 max-sm:gap-2 flex-shrink-0">
        
        <div className="flex gap-1.5 flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:scrollbar-none max-sm:pb-1 flex-shrink-0">
          {['all', ...LEVELS].map(level => (
            <button
              key={level}
              onClick={() => handleFilter('level', level)}
              className={`px-3 py-1.5 rounded-full text-[0.8125rem] font-medium border transition-all max-sm:text-xs max-sm:px-2.5 flex-shrink-0
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

        <Select
          options={lessonOptions}
          value={activeLesson}
          onChange={val => handleFilter('lesson', val)}
          className="min-w-[140px] max-2xl:flex-1"
        />

        <Select
          options={STATUS_OPTIONS}
          value={activeStatus}
          onChange={val => handleFilter('status', val)}
          className="min-w-[160px] max-2xl:flex-1"
        />

        <div className="w-full 2xl:flex-1 2xl:min-w-[200px] relative flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm từ vựng..."
            value={localSearch}
            onChange={e => {
              const val = e.target.value;
              setLocalSearch(val);
              startTransition(() => {
                setSearchQuery(val);
                setCurrentPage(1);
              });
            }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-outline-variant rounded-lg
                       bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       transition-all"
          />
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className={`flex-grow overflow-y-auto min-h-0 transition-opacity scrollbar-thin ${isPending ? 'opacity-60' : ''}`}
      >
        
        <div className="hidden 2xl:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '600px' }}>
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
        </div>

        <div className="2xl:hidden grid grid-cols-1 lg:grid-cols-2 gap-3 pb-4">
          {pageItems.length === 0 ? (
            <div className="col-span-full bg-white border border-gray-100 rounded-xl p-6 text-center text-on-surface-variant text-sm">
              Không tìm thấy từ vựng nào.
            </div>
          ) : (
            pageItems.map((v, i) => (
              <VocabCard
                key={v.id}
                vocab={v}
                index={(page - 1) * ITEMS_PER_PAGE + i + 1}
                onDifficultToggle={handleToggleDifficult}
              />
            ))
          )}
        </div>

      </div>

      {/* <div className="text-sm text-on-surface-variant flex-shrink-0 pt-1">
        {filtered.length} từ &nbsp;|&nbsp;
        <span className="text-success font-medium">Đã thuộc: {mastered}</span> &nbsp;|&nbsp;
        <span className="text-secondary font-medium">Đang học: {learning}</span> &nbsp;|&nbsp;
        Chưa học: {notLearned}
      </div> */}

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

// ============================================
// Page Export
// ============================================
export function VocabularyPage() {
  const { user } = useAuth();
  const vocabPromise = useMemo(() => {
    return user ? api.getAllVocabulary().catch(() => [] as Vocabulary[]) : Promise.resolve([] as Vocabulary[]);
  }, [user]);

  return (
    <div className="flex flex-col h-[calc(100dvh-110px)] lg:h-[calc(100vh-160px)] overflow-hidden space-y-4 pb-2">
      {/* <div className="mb-2 flex-shrink-0">
        <h1 className="text-2xl font-bold max-sm:text-xl text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Từ Vựng Tiếng Nhật
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">Quản lý và ôn tập từ vựng của bạn</p>
      </div> */}
      <Suspense fallback={<SkeletonLoader />}>
        <VocabTable vocabPromise={vocabPromise} />
      </Suspense>
    </div>
  );
}
