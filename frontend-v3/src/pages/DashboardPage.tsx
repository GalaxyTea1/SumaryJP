import { Suspense, use, useMemo, useState, useEffect, type ReactNode } from 'react';

// ============================================
// Skeleton
// ============================================
function StatCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton w-8 h-8 rounded-lg" />
      </div>
      <div className="skeleton h-7 w-24 rounded mb-2" />
      <div className="skeleton h-2 w-full rounded mb-1.5" />
      <div className="skeleton h-3 w-28 rounded" />
    </div>
  );
}

// ============================================
// Stat Card
// ============================================
interface StatCardProps {
  label: string;
  current: number;
  total: number;
  color: string;
  icon: string;
  iconBg: string;
}

function StatCard({ label, current, total, color, icon, iconBg }: StatCardProps) {
  const pct = calcPercent(current, total);
  return (
    <div className="card p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-on-surface-variant">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined text-lg`} style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {current.toLocaleString()}
        <span className="text-sm font-normal text-on-surface-variant"> / {total.toLocaleString()}</span>
      </div>
      <div className="progress-bar mt-2">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-xs text-on-surface-variant mt-1.5">{pct}% hoàn thành</div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { api } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { calcPercent, timeAgo } from '@/lib/utils';
import type { Vocabulary, Grammar, Kanji, LearningHistory, WeeklyGoal, SrsProgress } from '@/types';

// ============================================
// Stats Section — dùng React 19 use()
// ✨ use() có thể gọi trong điều kiện, loop — khác với useEffect
// ============================================
function StatsSection({ vocabPromise, grammarPromise, kanjiPromise, srsPromise }: {
  vocabPromise: Promise<Vocabulary[]>;
  grammarPromise: Promise<Grammar[]>;
  kanjiPromise: Promise<Kanji[]>;
  srsPromise: Promise<SrsProgress[]>;
}) {
  // React 19: use() unwrap Promise trực tiếp trong render
  const vocabulary = use(vocabPromise);
  const grammar    = use(grammarPromise);
  const kanji      = use(kanjiPromise);
  const srsProgress = use(srsPromise);

  const masteredVocab = vocabulary.filter(v => v.status === 'mastered').length;

  const grammarIds = useMemo(() => new Set(grammar.map(g => g.id)), [grammar]);
  const kanjiIds = useMemo(() => new Set(kanji.map(k => k.id)), [kanji]);

  const masteredGrammar = useMemo(() => {
    return srsProgress.filter(item => 
      item.itemType === 'grammar' && 
      grammarIds.has(item.itemId) && 
      item.interval >= 7
    ).length;
  }, [srsProgress, grammarIds]);

  const masteredKanji = useMemo(() => {
    return srsProgress.filter(item => 
      item.itemType === 'kanji' && 
      kanjiIds.has(item.itemId) && 
      item.interval >= 7
    ).length;
  }, [srsProgress, kanjiIds]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Từ Vựng"
        current={masteredVocab} total={vocabulary.length}
        color="#6caba0" icon="menu_book" iconBg="bg-primary-50"
      />
      <StatCard
        label="Ngữ Pháp"
        current={masteredGrammar} total={grammar.length}
        color="#f0a868" icon="edit_note" iconBg="bg-warning-light"
      />
      <StatCard
        label="Kanji"
        current={masteredKanji} total={kanji.length}
        color="#4caf50" icon="translate" iconBg="bg-success-light"
      />
      {/* XP Card */}
      <XPCard />
    </div>
  );
}

// ============================================
// XP Card từ Gamification Context
// ============================================
function XPCard() {
  const { optimisticXP } = useGamification();
  return (
    <div className="card p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-on-surface-variant">XP Hôm Nay</span>
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#42a5f5] text-lg">bolt</span>
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {optimisticXP.toLocaleString()}
        <span className="text-sm font-normal text-on-surface-variant"> XP</span>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className="material-symbols-outlined text-success text-sm">trending_up</span>
        <span className="text-xs text-success">Tiếp tục học mỗi ngày!</span>
      </div>
    </div>
  );
}

// ============================================
// Weekly Goal
// ============================================
function WeeklyGoalSection({ weeklyPromise, onRefresh }: { weeklyPromise: Promise<WeeklyGoal>; onRefresh: () => void }) {
  const weeklyData = use(weeklyPromise);
  const { isLoggedIn } = useAuth();
  
  const initialTarget = weeklyData.goalTarget ?? 20;
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState(initialTarget);
  const [weeklyTarget, setWeeklyTarget] = useState(initialTarget);
  const [isSaving, setIsSaving] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (weeklyData.goalTarget) {
      setWeeklyTarget(weeklyData.goalTarget);
      setTempTarget(weeklyData.goalTarget);
    }
  }, [weeklyData.goalTarget]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const weeklyCount = weeklyData.goalCount ?? 0;
  const pct = calcPercent(weeklyCount, weeklyTarget);

  const handleSave = async () => {
    if (!Number.isInteger(tempTarget) || tempTarget < 1 || tempTarget > 500) {
      alert('Mục tiêu phải là số nguyên trong khoảng 1-500.');
      return;
    }
    setIsSaving(true);
    try {
      await api.updateWeeklyGoal(tempTarget);
      setWeeklyTarget(tempTarget);
      setIsEditing(false);
      onRefresh();
    } catch {
      alert('Không thể lưu mục tiêu tuần. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card p-5 animate-fade-in-up relative">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Mục tiêu tuần
            </h3>
            {isLoggedIn && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary hover:text-primary-dark transition-colors flex items-center p-1 cursor-pointer"
                title="Chỉnh sửa mục tiêu"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={tempTarget}
                onChange={e => setTempTarget(Number(e.target.value))}
                min={1}
                max={500}
                className="border border-outline rounded-lg px-2 py-1 text-xs w-20 focus:border-primary focus:outline-none"
                disabled={isSaving}
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => { setIsEditing(false); setTempTarget(weeklyTarget); }}
                disabled={isSaving}
                className="border border-outline text-on-surface-variant text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">Thuộc {weeklyTarget} từ mới trong tuần này</p>
          )}
        </div>
        <div className="text-2xl font-bold text-primary" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {weeklyCount}
          <span className="text-sm font-normal text-on-surface-variant">/{weeklyTarget}</span>
        </div>
      </div>
      <div className="progress-bar mt-3">
        <div className="progress-fill bg-primary" style={{ width: `${pct}%` }} />
      </div>
      {/* Day indicators */}
      <div className="flex gap-2 mt-3">
        {['T2','T3','T4','T5','T6','T7','CN'].map((day, i) => {
          const today = new Date();
          let currentDayIdx = today.getDay();
          if (currentDayIdx === 0) currentDayIdx = 6;
          else currentDayIdx = currentDayIdx - 1;
          
          return (
            <span
              key={day}
              className={`w-8 h-8 rounded-full text-xs flex items-center justify-center font-semibold ${
                i <= currentDayIdx && isLoggedIn
                  ? 'bg-primary text-white'
                  : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Gamification Widget
// ============================================
function LockOverlay() {
  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-2xl">
      <span className="material-symbols-outlined text-3xl text-primary mb-2">lock</span>
      <span className="text-sm font-semibold">Đăng nhập để xem</span>
    </div>
  );
}

function GamificationWidget() {
  const { isLoggedIn } = useAuth();
  const { data, currentLevel, nextLevel, levelProgress, badges, optimisticXP } = useGamification();
  const earnedBadges = badges.filter(b => b.earned).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Level & XP */}
      <div className="card p-5 relative overflow-hidden">
        {!isLoggedIn && <LockOverlay />}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-on-surface-variant">Level & XP</h3>
          <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-bold">
            Lv.{currentLevel.level}
          </span>
        </div>
        <div className="text-lg font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {currentLevel.title}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-on-surface-variant">{optimisticXP} XP</span>
        </div>
        <div className="text-[0.6875rem] text-on-surface-variant mt-1">
          {nextLevel
            ? `Cần ${nextLevel.xpRequired - data.xp} XP để lên Level ${nextLevel.level}`
            : '🎉 Max Level!'}
        </div>
      </div>

      {/* Streak */}
      <div className="card p-5 relative overflow-hidden">
        {!isLoggedIn && <LockOverlay />}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-on-surface-variant">Chuỗi ngày học</h3>
          <span className="text-2xl">🔥</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-amber-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.streak}
          </span>
          <span className="text-sm text-on-surface-variant">ngày liên tục</span>
        </div>
        <div className="text-xs text-on-surface-variant mt-1">
          {data.streak >= 7
            ? '⚡ Tuyệt vời! Streak dài ngày!'
            : data.streak >= 3
            ? '🔥 Rất tốt! Tiếp tục nào!'
            : 'Hãy học mỗi ngày để duy trì streak!'}
        </div>
      </div>

      {/* Badges */}
      <div className="card p-5 relative overflow-hidden">
        {!isLoggedIn && <LockOverlay />}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-on-surface-variant">Huy hiệu</h3>
          <span className="text-xs text-on-surface-variant">{earnedBadges}/{badges.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {badges.map(badge => (
            <span
              key={badge.id}
              title={`${badge.name}: ${badge.desc}${badge.earned ? ' ✅' : ''}`}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg cursor-default transition-all
                ${badge.earned ? '' : 'opacity-25 grayscale'}`}
            >
              {badge.icon}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Quick Actions
// ============================================
interface QuickAction {
  to:      string;
  icon:    string;
  color:   string;
  bgColor: string;
  title:   string;
  desc:    string;
  btnText: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { to: '/flashcard',   icon: 'style',   color: '#6caba0', bgColor: 'bg-primary-50', title: 'Học Flashcard',  desc: '15 thẻ cần ôn hôm nay',  btnText: 'Bắt đầu' },
  { to: '/test-center', icon: 'quiz',    color: '#f0a868', bgColor: 'bg-warning-light', title: 'Làm Bài Test', desc: 'Bài test từ vựng N5',      btnText: 'Làm ngay' },
  { to: '/srs-review',  icon: 'replay',  color: '#42a5f5', bgColor: 'bg-blue-50',   title: 'Ôn Tập SRS',    desc: '8 từ đến hạn ôn',         btnText: 'Ôn tập' },
];

function QuickActions() {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Hành động nhanh
      </h3>
      {QUICK_ACTIONS.map(action => (
        <Link
          key={action.to}
          to={action.to}
          className="flex items-center gap-4 card p-4 border border-outline-variant
                     hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary
                     transition-all duration-200 cursor-pointer block"
        >
          <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className="material-symbols-outlined text-2xl" style={{ color: action.color }}>
              {action.icon}
            </span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{action.title}</div>
            <div className="text-xs text-on-surface-variant">{action.desc}</div>
          </div>
          <span className="bg-primary text-white rounded-lg font-semibold text-[0.8125rem] px-3 py-2 hover:bg-primary-dark transition-colors flex-shrink-0 max-sm:hidden">
            {action.btnText}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ============================================
// Recent Activity
// ============================================
const ICON_MAP: Record<string, { icon: string; bg: string; color: string }> = {
  'mastered':    { icon: 'check',  bg: 'bg-success-light', color: 'text-success' },
  'learning':    { icon: 'replay', bg: 'bg-primary-50',    color: 'text-primary' },
  'not-learned': { icon: 'school', bg: 'bg-blue-50',       color: 'text-[#42a5f5]' },
};

function RecentActivity({ historyPromise }: { historyPromise: Promise<LearningHistory[]> }) {
  const history = use(historyPromise);

  return (
    <div>
      <h3 className="font-bold text-lg mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Hoạt động gần đây
      </h3>
      <div className="card p-4 space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-4">Chưa có hoạt động nào</p>
        ) : (
          history.map((item, idx) => {
            const info = ICON_MAP[item.new_status ?? 'not-learned'] ?? ICON_MAP['not-learned'];
            return (
              <div key={item.id ?? idx} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${info.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className={`material-symbols-outlined ${info.color} text-sm`}>{info.icon}</span>
                </div>
                <div>
                  <div className="text-sm">
                    {item.action ?? 'Hoạt động'}{' '}
                    <span className="font-semibold" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      {item.japanese ?? ''}
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant">{timeAgo(item.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================
// Dashboard Page — Root
// Dùng Suspense boundary cho mỗi section
// ============================================

function SectionFallback({ count = 1 }: { count?: number }) {
  return (
    <div className={`grid gap-4 ${count > 1 ? `grid-cols-${count}` : ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

function Wrapper({ children }: { children: ReactNode }) {
  return <div className="space-y-6 animate-fade-in-up">{children}</div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  /* eslint-disable react-hooks/exhaustive-deps */
  const vocabPromise   = useMemo(() => user ? api.getAllVocabulary().catch(() => [] as Vocabulary[]) : Promise.resolve([] as Vocabulary[]), [user]);
  const grammarPromise = useMemo(() => user ? api.getAllGrammar().catch(() => [] as Grammar[]) : Promise.resolve([] as Grammar[]), [user]);
  const kanjiPromise   = useMemo(() => user ? api.getAllKanji().catch(() => [] as Kanji[]) : Promise.resolve([] as Kanji[]), [user]);
  const srsPromise     = useMemo(() => user ? api.getSrsProgress().catch(() => [] as SrsProgress[]) : Promise.resolve([] as SrsProgress[]), [user]);
  const historyPromise = useMemo(() => user ? api.getLearningHistory(4).catch(() => [] as LearningHistory[]) : Promise.resolve([] as LearningHistory[]), [user, refreshKey]);
  const weeklyPromise  = useMemo(() => user ? api.getWeeklyGoal().catch(() => ({ goalCount: 0 } as WeeklyGoal)) : Promise.resolve({ goalCount: 0 } as WeeklyGoal), [user, refreshKey]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <Wrapper>
      {/* Stats - dùng Suspense riêng để mỗi section load độc lập */}
      <Suspense fallback={<SectionFallback count={4} />}>
        <StatsSection vocabPromise={vocabPromise} grammarPromise={grammarPromise} kanjiPromise={kanjiPromise} srsPromise={srsPromise} />
      </Suspense>

      {/* Weekly Goal */}
      <Suspense fallback={<StatCardSkeleton />}>
        <WeeklyGoalSection weeklyPromise={weeklyPromise} onRefresh={handleRefresh} />
      </Suspense>

      {/* Gamification */}
      {/* <GamificationWidget /> */}

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<StatCardSkeleton />}>
            <RecentActivity historyPromise={historyPromise} />
          </Suspense>
        </div>
      </div>
    </Wrapper>
  );
}
