import { Suspense, use, useEffect, useRef, useMemo, useState } from 'react';
import {
  Chart,
  ArcElement, BarElement,
  CategoryScale, LinearScale,
  Tooltip, Legend,
  DoughnutController, BarController,
} from 'chart.js';
import { api } from '@/api';
import type { Vocabulary, Grammar, Kanji } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController);

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
    <div className="card p-5 relative overflow-hidden hover:shadow-md transition-all duration-300 border border-outline/5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </div>
        <div className="text-xs text-on-surface-variant font-medium">{label}</div>
      </div>
      <div className="text-2xl font-bold text-on-surface">{value}</div>
      {barPct !== undefined ? (
        <div className="flex flex-col gap-1 mt-2">
          <div className="w-full h-2 bg-gray-100 dark:bg-surface-dim rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${barPct}%` }} />
          </div>
          <div className="text-[10px] text-right font-semibold text-primary">{barPct}% đã thuộc</div>
        </div>
      ) : sub ? (
        <div className="text-xs text-on-surface-variant mt-1.5 font-medium">{sub}</div>
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
  const total = mastered + learning + notLearned;

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Đã thuộc', 'Đang học', 'Chưa học'],
        datasets: [{
          data: [mastered, learning, notLearned],
          backgroundColor: ['#6caba0', '#f59e0b', '#e2e8f0'],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, font: { size: 12, family: "'Plus Jakarta Sans', sans-serif" } },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw as number;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${context.label}: ${val} (${pct}%)`;
              }
            }
          }
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [mastered, learning, notLearned, total]);

  return (
    <div className="card p-6 border border-outline/5">
      <h3 className="font-bold text-base mb-4 text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Trạng thái Từ Vựng
      </h3>
      <div className="relative h-[220px] flex items-center justify-center">
        <canvas ref={canvasRef} />
        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-on-surface">{total}</span>
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tổng số từ</span>
        </div>
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

  const labels = useMemo(() => Object.keys(data).sort(), [data]);

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
          barThickness: 32,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" } } },
          x: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold', family: "'Plus Jakarta Sans', sans-serif" } } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [labels, data]);

  return (
    <div className="card p-6 border border-outline/5">
      <h3 className="font-bold text-base mb-4 text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Phân bố theo Trình độ
      </h3>
      <div className="h-[220px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function StatsContent({ dataPromise }: { dataPromise: Promise<[Vocabulary[], Grammar[], Kanji[]]> }) {
  const [vocab, grammar, kanji] = use(dataPromise);
  const testResults = useMemo(() => loadTestResults(), []);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('overview');

  // Gamification Data
  const { data: gamificationData, badges, currentLevel, nextLevel, levelProgress, optimisticXP } = useGamification();

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

  // Streak message helper
  const streakMessage = useMemo(() => {
    const streak = gamificationData.streak;
    if (streak === 0) return 'Học ngay hôm nay để bắt đầu chuỗi học tập!';
    if (streak < 3) return 'Đang khởi đầu tốt! Hãy duy trì hàng ngày nhé.';
    if (streak < 7) return 'Tuyệt vời! Bạn đang học tập rất chăm chỉ đấy.';
    return 'Phong độ đỉnh cao! Hãy giữ vững ngọn lửa học tập này 🔥';
  }, [gamificationData.streak]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-outline/10 gap-2 p-1 bg-surface-dim rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-surface text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'achievements'
              ? 'bg-white dark:bg-surface text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">emoji_events</span>
          Thành tích
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-white dark:bg-surface text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">history</span>
          Lịch sử Test
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Gamification Header Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Level & XP card */}
            <div className="md:col-span-2 card p-5 flex flex-col justify-between relative overflow-hidden border border-outline/5 bg-gradient-to-br from-white to-primary-50/20 dark:from-surface dark:to-primary-950/10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-[11px] font-bold text-primary uppercase tracking-wider">Cấp độ hiện tại</div>
                  <h2 className="text-2xl font-black text-on-surface mt-0.5">
                    Lv.{currentLevel.level} — {currentLevel.title}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary font-black">
                  {currentLevel.level}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                  <span>Tiến trình thăng cấp</span>
                  <span>
                    {optimisticXP} / {nextLevel ? nextLevel.xpRequired : 'MAX'} XP
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200/60 dark:bg-surface-dim rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary bg-gradient-to-r from-primary to-teal-400 transition-all duration-1000"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                {nextLevel && (
                  <div className="text-[10px] text-on-surface-variant font-medium">
                    Còn thiếu <strong className="text-primary">{nextLevel.xpRequired - optimisticXP} XP</strong> để lên cấp tiếp theo.
                  </div>
                )}
              </div>
            </div>

            {/* Streak card */}
            <div className="card p-5 flex flex-col justify-between border border-outline/5 bg-gradient-to-br from-white to-orange-50/20 dark:from-surface dark:to-orange-950/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center animate-pulse">
                  <span className="text-3xl">🔥</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Chuỗi liên tục</div>
                  <div className="text-3xl font-black text-on-surface mt-0.5">
                    {gamificationData.streak} ngày
                  </div>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-4 font-medium leading-relaxed">
                {streakMessage}
              </p>
            </div>
          </div>

          {/* Quantity Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="menu_book" iconBg="bg-primary-50 dark:bg-primary-950/30" iconColor="text-primary"
              accentColor="#6caba0" label="Từ vựng" value={vocab.length}
              barPct={masteredPct} barColor="bg-primary"
            />
            <StatCard
              icon="edit_note" iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-500"
              accentColor="#f59e0b" label="Ngữ pháp" value={grammar.length}
              sub={`${grammar.length} mẫu cấu trúc`}
            />
            <StatCard
              icon="translate" iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-500"
              accentColor="#10b981" label="Kanji" value={kanji.length}
              sub={`${kanji.length} chữ Kanji`}
            />
            <StatCard
              icon="quiz" iconBg="bg-purple-50 dark:bg-purple-950/30" iconColor="text-purple-500"
              accentColor="#8b5cf6" label="Bài kiểm tra" value={testResults.length}
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
        </div>
      )}

      {/* TAB CONTENT: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card p-6 border border-outline/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Bộ sưu tập Huy hiệu
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Đã đạt được {badges.filter(b => b.earned).length} / {badges.length} huy hiệu
                </p>
              </div>
              <span className="material-symbols-outlined text-4xl text-amber-400">emoji_events</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {badges.map(b => (
                <div
                  key={b.id}
                  title={b.desc}
                  className={`p-4 rounded-2xl flex flex-col items-center text-center justify-between transition-all duration-300 border ${
                    b.earned
                      ? 'border-primary/20 bg-primary-50/10 dark:bg-primary-950/5 hover:scale-105 hover:shadow-sm'
                      : 'border-dashed border-gray-200 dark:border-surface-dim opacity-40 grayscale select-none'
                  }`}
                >
                  <div className="text-4xl mb-3">{b.icon}</div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-on-surface line-clamp-1">{b.name}</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium leading-tight">
                      {b.desc}
                    </p>
                  </div>
                  {!b.earned && (
                    <div className="mt-2.5 flex items-center justify-center text-[10px] font-semibold text-on-surface-variant gap-0.5 bg-gray-100 dark:bg-surface-dim px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[10px]">lock</span>
                      Khóa
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card p-6 border border-outline/5">
            <h3 className="font-bold text-lg mb-4 text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Lịch sử làm bài kiểm tra
            </h3>

            {testResults.length === 0 ? (
              <div className="text-sm text-on-surface-variant italic py-6 text-center">
                Bạn chưa thực hiện bài kiểm tra nào.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {testResults.map((t, i) => {
                  const pct   = t.total > 0 ? Math.round(t.correct / t.total * 100) : 0;
                  
                  // Determine score color
                  let scoreColor = 'text-error bg-error/10 border border-error/20';
                  if (pct >= 80) {
                    scoreColor = 'text-success bg-success/10 border border-success/20';
                  } else if (pct >= 50) {
                    scoreColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30';
                  }

                  // Determine test icon
                  let testIcon = 'menu_book';
                  if (t.type?.toLowerCase().includes('kanji')) testIcon = 'translate';
                  else if (t.type?.toLowerCase().includes('grammar')) testIcon = 'edit_note';

                  return (
                    <div key={t.id ?? i} className="flex items-center justify-between p-3.5 bg-surface-dim/40 rounded-xl hover:bg-surface-dim/70 transition-all border border-outline/5">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Phần trăm đúng */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${scoreColor}`}>
                          {pct}%
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-on-surface-variant shrink-0">{testIcon}</span>
                            <span className="truncate capitalize">{t.type ?? 'Từ vựng'} Test</span>
                          </div>
                          <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-primary">{t.correct}/{t.total} đúng</span>
                            <span>•</span>
                            <span>{timeAgo(t.date)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs font-bold text-on-surface bg-surface dark:bg-surface-dim border border-outline/10 px-2.5 py-1 rounded-full shrink-0">
                        {[t.level, t.lesson ? `Bài ${t.lesson}` : ''].filter(Boolean).join(' ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs placeholder */}
      <div className="flex gap-2 max-w-md p-1 bg-surface-dim rounded-xl">
        <div className="skeleton h-9 flex-1 rounded-lg" />
        <div className="skeleton h-9 flex-1 rounded-lg" />
        <div className="skeleton h-9 flex-1 rounded-lg" />
      </div>

      {/* Gamification progress placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 card p-5 h-28"><div className="skeleton h-full w-full rounded-xl" /></div>
        <div className="card p-5 h-28"><div className="skeleton h-full w-full rounded-xl" /></div>
      </div>

      {/* Stat cards placeholder */}
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
    </div>
  );
}

export function StatisticsPage() {
  const { user } = useAuth();
  /* eslint-disable react-hooks/exhaustive-deps */
  const dataPromise = useMemo(() => Promise.all([
    api.getAllVocabulary().catch(() => [] as Vocabulary[]),
    api.getAllGrammar().catch(() => [] as Grammar[]),
    api.getAllKanji().catch(() => [] as Kanji[]),
  ]), [user]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <div>
      {/* <div className="mb-6">
        <h1 className="text-2xl font-black max-sm:text-xl text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Thống Kê Học Tập
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">Theo dõi tiến độ, thành tích và lịch sử ôn luyện của bạn</p>
      </div> */}

      <Suspense fallback={<StatsSkeleton />}>
        <StatsContent dataPromise={dataPromise} />
      </Suspense>
    </div>
  );
}
