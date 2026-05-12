// ============================================
// StatisticsPage — SumaryJP
// React 19: Suspense + use() cho data
// Chart.js cho biểu đồ vocab status + level dist
// ============================================

import { Suspense, use, useEffect, useRef, useMemo } from 'react';
import {
  Chart,
  ArcElement, BarElement,
  CategoryScale, LinearScale,
  Tooltip, Legend,
  DoughnutController, BarController,
} from 'chart.js';
import { api } from '@/api';
import type { Vocabulary, Grammar, Kanji } from '@/types';

// Đăng ký Chart.js components một lần
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController);

// ---- Pre-fetch ----
const dataPromise = Promise.all([
  api.getAllVocabulary().catch(() => [] as Vocabulary[]),
  api.getAllGrammar().catch(() => [] as Grammar[]),
  api.getAllKanji().catch(() => [] as Kanji[]),
]);

// ---- localStorage results ----
const RESULTS_KEY = 'sumary_test_results';
interface TestResult {
  id?: number;
  type?: string;
  correct: number;
  total: number;
  date: string;
  level?: string;
  lesson?: string | number;
}
function loadTestResults(): TestResult[] {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY) ?? '[]'); }
  catch { return []; }
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  const mins  = Math.floor(diff / 60_000);
  if (days > 0)  return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (mins > 0)  return `${mins} phút trước`;
  return 'Vừa xong';
}

// ============================================
// Stat card
// ============================================
interface StatCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  label: string;
  value: number;
  sub?: string;
  barPct?: number;
  barColor?: string;
}
function StatCard({ icon, iconBg, iconColor, label, value, sub, barPct, barColor }: StatCardProps) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </div>
        <div className="text-xs text-on-surface-variant">{label}</div>
      </div>
      <div className="text-2xl font-bold text-on-surface">{value}</div>
      {barPct !== undefined ? (
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${barPct}%` }} />
          </div>
          <span className="text-xs text-on-surface-variant">{barPct}% đã thuộc</span>
        </div>
      ) : sub ? (
        <div className="text-xs text-on-surface-variant mt-1">{sub}</div>
      ) : null}
    </div>
  );
}

// ============================================
// Doughnut chart — Vocab status
// ============================================
interface DoughnutProps {
  mastered: number;
  learning: number;
  notLearned: number;
}
function VocabStatusChart({ mastered, learning, notLearned }: DoughnutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Đã thuộc', 'Đang học', 'Chưa học'],
        datasets: [{
          data: [mastered, learning, notLearned],
          backgroundColor: ['#22c55e', '#f59e0b', '#e5e7eb'],
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, font: { size: 12 } },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [mastered, learning, notLearned]);

  return (
    <div className="card p-6">
      <h3 className="font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Trạng thái Từ Vựng
      </h3>
      <div className="h-[220px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ============================================
// Bar chart — Level distribution
// ============================================
interface LevelDistProps {
  data: Record<string, number>;
}
const LEVEL_COLORS: Record<string, string> = {
  N5: '#6caba0', N4: '#4d8a80', N3: '#f59e0b', N2: '#ef4444', N1: '#8b5cf6',
};
function LevelDistChart({ data }: LevelDistProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  const labels = Object.keys(data).sort();

  useEffect(() => {
    if (!canvasRef.current || labels.length === 0) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Số lượng',
          data: labels.map(l => data[l]),
          backgroundColor: labels.map(l => LEVEL_COLORS[l] ?? '#94a3b8'),
          borderRadius: 8,
          barThickness: 40,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 12 } } },
          x: { grid: { display: false }, ticks: { font: { size: 12, weight: 'bold' } } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [labels, data]);

  return (
    <div className="card p-6">
      <h3 className="font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Phân bố theo Level
      </h3>
      <div className="h-[220px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ============================================
// Main stats content — uses use()
// ============================================
function StatsContent() {
  const [vocab, grammar, kanji] = use(dataPromise);
  const testResults = useMemo(() => loadTestResults(), []);

  // Summary
  const masteredVocab = useMemo(() =>
    vocab.filter(v => (v as Vocabulary & { status?: string }).status === 'mastered').length,
  [vocab]);
  const masteredPct = vocab.length > 0 ? Math.round(masteredVocab / vocab.length * 100) : 0;
  const learningVocab = vocab.filter(v => (v as Vocabulary & { status?: string }).status === 'learning').length;
  const notLearnedVocab = vocab.length - masteredVocab - learningVocab;

  // Level distribution across all data
  const levelData = useMemo(() => {
    const map: Record<string, number> = {};
    [...vocab, ...grammar, ...(kanji as (Kanji & { level?: string })[])].forEach(item => {
      const lv = (item as { level?: string }).level ?? 'Khác';
      map[lv] = (map[lv] ?? 0) + 1;
    });
    return map;
  }, [vocab, grammar, kanji]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="menu_book" iconBg="bg-primary-50" iconColor="text-primary"
          accentColor="#6caba0" label="Từ vựng" value={vocab.length}
          barPct={masteredPct} barColor="bg-primary"
        />
        <StatCard
          icon="edit_note" iconBg="bg-amber-50" iconColor="text-amber-500"
          accentColor="#f59e0b" label="Ngữ pháp" value={grammar.length}
          sub={`${grammar.length} mẫu câu`}
        />
        <StatCard
          icon="translate" iconBg="bg-success-light" iconColor="text-success"
          accentColor="#22c55e" label="Kanji" value={kanji.length}
          sub={`${kanji.length} chữ Kanji`}
        />
        <StatCard
          icon="quiz" iconBg="bg-purple-50" iconColor="text-purple-500"
          accentColor="#8b5cf6" label="Bài test" value={testResults.length}
          sub={`${testResults.length} bài test đã làm`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VocabStatusChart
          mastered={masteredVocab}
          learning={learningVocab}
          notLearned={notLearnedVocab}
        />
        <LevelDistChart data={levelData} />
      </div>

      {/* Recent tests */}
      <div className="card p-6">
        <h3 className="font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Bài test gần đây
        </h3>
        {testResults.length === 0 ? (
          <div className="text-sm text-on-surface-variant italic">Chưa có bài test nào.</div>
        ) : (
          <div className="space-y-3">
            {testResults.slice(0, 5).map((t, i) => {
              const pct   = t.total > 0 ? Math.round(t.correct / t.total * 100) : 0;
              const color = pct >= 80 ? 'text-success bg-success/10' : pct >= 50 ? 'text-[#f59e0b] bg-amber-50' : 'text-error bg-error/10';
              return (
                <div key={t.id ?? i} className="flex items-center justify-between p-3 bg-surface-dim rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${color}`}>
                      {pct}%
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.type ?? 'Vocabulary'} Test</div>
                      <div className="text-xs text-on-surface-variant">
                        {t.correct}/{t.total} đúng • {timeAgo(t.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {[t.level, t.lesson ? `Bài ${t.lesson}` : ''].filter(Boolean).join(' ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Skeleton
// ============================================
function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
            <div className="skeleton h-6 w-12 rounded mb-2" />
            <div className="skeleton h-2 w-full rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6"><div className="skeleton h-[260px] rounded-xl" /></div>
        <div className="card p-6"><div className="skeleton h-[260px] rounded-xl" /></div>
      </div>
    </div>
  );
}

// ============================================
// Page Export
// ============================================
export function StatisticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Thống Kê
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">Tổng quan tiến độ học tập</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsContent />
      </Suspense>
    </div>
  );
}
