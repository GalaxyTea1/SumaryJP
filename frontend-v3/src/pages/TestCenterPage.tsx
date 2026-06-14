// ============================================
// TestCenterPage — SumaryJP
// React 19: Suspense + use() cho vocab data
// Config panel + recent results từ localStorage
// ============================================

import { Suspense, use, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import type { Vocabulary } from '@/types';

import { useAuth } from '@/context/AuthContext';

// ---- Local results (localStorage) ----
const RESULTS_KEY = 'sumary_test_results';

interface TestResult {
  id: number;
  testName: string;
  score: number;
  correct: number;
  total: number;
  timeTaken: number;
  date: string;
}

function loadResults(): TestResult[] {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY) ?? '[]'); }
  catch { return []; }
}

function formatTime(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}p ${s}s` : `${s}s`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days > 0)  return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (mins > 0)  return `${mins} phút trước`;
  return 'Vừa xong';
}

// ---- Test type configs ----
const TEST_TYPES = [
  {
    id: 'vocab',
    label: 'Test Từ Vựng',
    desc: 'Kiểm tra nghĩa và cách đọc từ vựng tiếng Nhật',
    icon: 'menu_book',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary',
    available: true,
  },
  {
    id: 'kanji',
    label: 'Test Kanji',
    desc: 'Nhận diện Kanji, âm đọc ON/KUN và nghĩa',
    icon: 'translate',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    badge: 'Sắp ra mắt',
    badgeBg: 'bg-blue-50 text-blue-500',
    available: false,
  },
  {
    id: 'grammar',
    label: 'Test Ngữ Pháp',
    desc: 'Điền ngữ pháp đúng vào câu, chọn cấu trúc phù hợp',
    icon: 'edit_note',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    badge: 'Sắp ra mắt',
    badgeBg: 'bg-amber-50 text-amber-500',
    available: false,
  },
  {
    id: 'mixed',
    label: 'Test Tổng Hợp',
    desc: 'Kết hợp tất cả các loại câu hỏi từ vựng, kanji, ngữ pháp',
    icon: 'emoji_events',
    iconBg: 'bg-success-light',
    iconColor: 'text-success',
    badge: 'Sắp ra mắt',
    badgeBg: 'bg-success-light text-success',
    available: false,
  },
] as const;

type TestTypeId = typeof TEST_TYPES[number]['id'];

const QUESTION_COUNTS = [10, 20, 30, 50];
const LEVELS          = ['all', 'N5', 'N4', 'N3', 'N2', 'N1'];
const TIME_OPTIONS    = [{ value: 15, label: '15 phút' }, { value: 30, label: '30 phút' }, { value: 45, label: '45 phút' }, { value: 60, label: '60 phút' }];

// ============================================
// Config section — uses vocab data via use()
// ============================================
function TestConfigPanel({ vocab }: { vocab: Vocabulary[] }) {
  const navigate = useNavigate();

  const [selectedType,   setSelectedType]   = useState<TestTypeId>('vocab');
  const [selectedLevel,  setSelectedLevel]  = useState('all');
  const [selectedLesson, setSelectedLesson] = useState('all');
  const [selectedCount,  setSelectedCount]  = useState(20);
  const [timeEnabled,    setTimeEnabled]    = useState(false);
  const [selectedTime,   setSelectedTime]   = useState(15);
  const [selectedMode,   setSelectedMode]   = useState<'practice' | 'exam'>('practice');

  // Lesson options from vocab
  const lessons = useMemo(() => {
    const set = new Set(vocab.map(v => String(v.lesson ?? '')).filter(Boolean));
    return [...set].sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
  }, [vocab]);

  // Filtered count for vocab type
  const filteredCount = useMemo(() => {
    if (selectedType !== 'vocab') return 0;
    return vocab.filter(v => {
      if (selectedLevel  !== 'all' && v.level !== selectedLevel)           return false;
      if (selectedLesson !== 'all' && String(v.lesson) !== selectedLesson) return false;
      return true;
    }).length;
  }, [vocab, selectedType, selectedLevel, selectedLesson]);

  function handleStart() {
    const params = new URLSearchParams({
      type:   selectedType,
      level:  selectedLevel,
      lesson: selectedLesson,
      count:  String(selectedCount),
      time:   timeEnabled ? String(selectedTime) : '0',
      mode:   selectedMode,
    });
    navigate(`/test?${params.toString()}`);
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Test type selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEST_TYPES.map(type => {
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => type.available && setSelectedType(type.id)}
              disabled={!type.available}
              className={`text-left p-5 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'border-primary bg-primary-50'
                  : 'border-transparent bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5'
                }
                ${!type.available ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${type.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined ${type.iconColor}`}>{type.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {type.label}
                  </h3>
                  {type.id === 'vocab' ? (
                    <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full">
                      {filteredCount} câu hỏi
                    </span>
                  ) : (
                    'badge' in type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${type.badgeBg}`}>
                        {type.badge}
                      </span>
                    )
                  )}
                </div>
              </div>
              <p className="text-sm text-on-surface-variant">{type.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Config card */}
      <div className="card p-6">
        <h3 className="font-bold text-lg mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Cấu hình bài test
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Level */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Chọn Level</label>
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 text-sm border border-outline-variant rounded-xl
                         bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {LEVELS.map(l => (
                <option key={l} value={l}>{l === 'all' ? 'Tất cả level' : l}</option>
              ))}
            </select>
          </div>

          {/* Lesson */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Chọn Bài</label>
            <select
              value={selectedLesson}
              onChange={e => setSelectedLesson(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 text-sm border border-outline-variant rounded-xl
                         bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tất cả bài</option>
              {lessons.map(l => (
                <option key={l} value={l}>Bài {l}</option>
              ))}
            </select>
          </div>

          {/* Question count */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Số câu hỏi</label>
            <div className="flex gap-2">
              {QUESTION_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setSelectedCount(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedCount === n
                      ? 'bg-primary text-white'
                      : 'border border-outline-variant hover:border-primary hover:text-primary'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Time limit */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Giới hạn thời gian</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={timeEnabled}
                  onChange={e => setTimeEnabled(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary"
                />
                Bật
              </label>
              <select
                value={selectedTime}
                onChange={e => setSelectedTime(Number(e.target.value))}
                disabled={!timeEnabled}
                className="flex-1 pl-3 pr-8 py-2 text-sm border border-outline-variant rounded-xl
                           bg-white focus:outline-none focus:border-primary disabled:opacity-50"
              >
                {TIME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mode */}
        <div className="mt-5">
          <label className="block text-sm font-semibold mb-2">Chế độ</label>
          <div className="flex gap-3">
            {[
              { val: 'practice' as const, label: 'Luyện tập' },
              { val: 'exam'     as const, label: 'Thi thử' },
            ].map(m => (
              <label
                key={m.val}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all
                  ${selectedMode === m.val
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
                  }`}
              >
                <input
                  type="radio"
                  name="test-mode"
                  value={m.val}
                  checked={selectedMode === m.val}
                  onChange={() => setSelectedMode(m.val)}
                  className="sr-only"
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="bg-primary text-white w-full py-3 rounded-xl text-base font-semibold
                     hover:bg-primary-dark transition-all mt-6 flex items-center justify-center gap-2"
        >
          Bắt Đầu Kiểm Tra
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// Recent Results Table
// ============================================
function RecentResults() {
  const results = loadResults().slice(0, 5);

  return (
    <div>
      <h3 className="font-bold text-lg mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Kết quả gần đây
      </h3>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-dim text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {['Bài test', 'Điểm', 'Kết quả', 'Thời gian', 'Ngày', ''].map(h => (
                <th key={h} className={`px-5 py-3 ${h === 'Điểm' || h === 'Kết quả' || h === 'Thời gian' ? 'text-center' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-on-surface-variant">
                  Chưa có kết quả nào.
                </td>
              </tr>
            ) : results.map(r => {
              const scoreColor = r.score >= 80
                ? 'text-success'
                : r.score >= 60
                  ? 'text-[#f59e0b]'
                  : 'text-error';
              return (
                <tr key={r.id} className="border-t border-outline-variant/30 hover:bg-surface-dim/50">
                  <td className="px-5 py-3 font-medium">{r.testName || 'Test'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-bold ${scoreColor}`}>{r.score}%</span>
                  </td>
                  <td className="px-5 py-3 text-center">{r.correct}/{r.total} đúng</td>
                  <td className="px-5 py-3 text-center text-on-surface-variant">{formatTime(r.timeTaken ?? 0)}</td>
                  <td className="px-5 py-3 text-on-surface-variant">{timeAgo(r.date)}</td>
                  <td className="px-5 py-3">
                    <button className="text-primary hover:underline text-xs">Chi tiết</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Inner component that uses use()
// ============================================
function TestCenterInner({ vocabPromise }: { vocabPromise: Promise<Vocabulary[]> }) {
  const vocab = use(vocabPromise);
  return <TestConfigPanel vocab={vocab} />;
}

// ============================================
// Skeleton for Suspense
// ============================================
function TestCenterSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton w-10 h-10 rounded-lg" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            </div>
            <div className="skeleton h-3 w-full rounded" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="skeleton h-5 w-40 rounded mb-5" />
        <div className="grid grid-cols-2 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
        <div className="skeleton h-12 w-full rounded-xl mt-6" />
      </div>
    </div>
  );
}

// ============================================
// Page Export
// ============================================
export function TestCenterPage() {
  const { user } = useAuth();
  const vocabPromise = useMemo(() => api.getAllVocabulary().catch(() => [] as Vocabulary[]), [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Trung Tâm Kiểm Tra
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Chọn loại bài test và bắt đầu luyện tập
        </p>
      </div>

      <Suspense fallback={<TestCenterSkeleton />}>
        <TestCenterInner vocabPromise={vocabPromise} />
      </Suspense>

      <RecentResults />
    </div>
  );
}
