// ============================================
// GamificationContext — SumaryJP
// React 19: useOptimistic cho XP animation
// ============================================

import {
  createContext, useContext, useState,
  useCallback, useOptimistic, type ReactNode,
} from 'react';
import {
  loadGamification, addXP as libAddXP,
  updateStreak, getBadges, trackEvent as libTrackEvent,
  getCurrentLevel, getNextLevel, getLevelProgress,
  LEVELS, BADGE_DEFS, XP_REWARDS,
} from '@/lib/gamification';
import type {
  GamificationData, GamificationBadge,
  GamificationLevel,
} from '@/types';
import type { TrackEventType } from '@/lib/gamification';

interface GamificationContextValue {
  data: GamificationData;
  optimisticXP: number;           // ← React 19 useOptimistic
  badges: GamificationBadge[];
  currentLevel: GamificationLevel;
  nextLevel: GamificationLevel | null;
  levelProgress: number;
  addXP: (amount: number, reason?: string) => void;
  trackEvent: (type: TrackEventType, extra?: Record<string, number>) => void;
  initStreak: () => void;
  // Constants
  LEVELS: typeof LEVELS;
  BADGE_DEFS: typeof BADGE_DEFS;
  XP_REWARDS: typeof XP_REWARDS;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GamificationData>(() => loadGamification());

  // ✨ React 19 — useOptimistic: UI cập nhật XP ngay lập tức
  //    trước khi localStorage thực sự được ghi xong
  const [optimisticXP, addOptimisticXP] = useOptimistic(
    data.xp,
    (currentXP: number, delta: number) => currentXP + delta,
  );

  const refresh = useCallback(() => {
    setData(loadGamification());
  }, []);

  const addXP = useCallback((amount: number, reason = '') => {
    addOptimisticXP(amount);          // UI thấy ngay
    libAddXP(amount, reason);         // localStorage
    refresh();                        // sync state
  }, [addOptimisticXP, refresh]);

  const trackEvent = useCallback((type: TrackEventType, extra: Record<string, number> = {}) => {
    libTrackEvent(type, extra);
    refresh();
  }, [refresh]);

  const initStreak = useCallback(() => {
    updateStreak();
    refresh();
  }, [refresh]);

  const currentLevel = getCurrentLevel(optimisticXP);
  const nextLevel    = getNextLevel(optimisticXP);
  const levelProgress = getLevelProgress(optimisticXP);
  const badges = getBadges();

  return (
    <GamificationContext value={{
      data, optimisticXP, badges,
      currentLevel, nextLevel, levelProgress,
      addXP, trackEvent, initStreak,
      LEVELS, BADGE_DEFS, XP_REWARDS,
    }}>
      {children}
    </GamificationContext>
  );
}

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification phải dùng trong GamificationProvider');
  return ctx;
}
