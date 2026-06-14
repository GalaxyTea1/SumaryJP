// ============================================
// GamificationContext — SumaryJP
// React 19: useOptimistic cho XP animation
// Đồng bộ với API backend khi đăng nhập, fallback localStorage khi offline
// ============================================

import {
  createContext, useContext, useState,
  useCallback, useOptimistic, useEffect, type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api';
import {
  loadGamification, addXP as libAddXP,
  updateStreak, trackEvent as libTrackEvent,
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
  addXP: (amount: number, reason?: string) => Promise<void>;
  trackEvent: (type: TrackEventType, extra?: Record<string, number>) => Promise<void>;
  initStreak: () => Promise<void>;
  refresh: () => Promise<void>;
  // Constants
  LEVELS: typeof LEVELS;
  BADGE_DEFS: typeof BADGE_DEFS;
  XP_REWARDS: typeof XP_REWARDS;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  const [data, setData] = useState<GamificationData>(() => loadGamification());

  // ✨ React 19 — useOptimistic: UI cập nhật XP ngay lập tức
  const [optimisticXP, addOptimisticXP] = useOptimistic(
    data.xp,
    (currentXP: number, delta: number) => currentXP + delta,
  );

  const refresh = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const backendData = await api.getGamification();
        setData(backendData);
      } catch (err) {
        console.error('Failed to fetch backend gamification:', err);
        setData(loadGamification()); // fallback
      }
    } else {
      setData(loadGamification());
    }
  }, [isLoggedIn]);

  // Sync data khi trạng thái login/user thay đổi
  useEffect(() => {
    void refresh();
  }, [refresh, isLoggedIn, user]);

  const addXP = useCallback(async (amount: number, reason = '') => {
    addOptimisticXP(amount); // UI thấy ngay lập tức
    if (isLoggedIn) {
      // Khi online, XP được cộng gián tiếp qua events hoặc trực tiếp nếu có API.
      // Vì backend không có API addXP trực tiếp (chỉ có trackEvent), ta giả lập event 'daily_login' hoặc srs_card_good tùy trường hợp.
      // Ở đây ta cứ lưu tạm offline và sync nếu cần, hoặc gọi trackEvent nếu là hành động cụ thể.
      try {
        // Gọi trackEvent tương ứng hoặc chỉ cập nhật local
        libAddXP(amount, reason);
      } catch (err) {
        console.error('Add XP local sync error:', err);
      }
    } else {
      libAddXP(amount, reason);
    }
    await refresh();
  }, [addOptimisticXP, refresh, isLoggedIn]);

  const trackEvent = useCallback(async (type: TrackEventType, extra: Record<string, number> = {}) => {
    if (isLoggedIn) {
      try {
        const updatedData = await api.trackGamificationEvent(type, extra);
        setData(updatedData);
      } catch (err) {
        console.error('Failed to track backend gamification event:', err);
        // Fallback offline
        libTrackEvent(type, extra);
        await refresh();
      }
    } else {
      libTrackEvent(type, extra);
      await refresh();
    }
  }, [refresh, isLoggedIn]);

  const initStreak = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const updatedData = await api.trackGamificationEvent('daily_login');
        setData(updatedData);
      } catch (err) {
        console.error('Failed to init streak on backend:', err);
        updateStreak();
        await refresh();
      }
    } else {
      updateStreak();
      await refresh();
    }
  }, [refresh, isLoggedIn]);

  const currentLevel = getCurrentLevel(optimisticXP);
  const nextLevel    = getNextLevel(optimisticXP);
  const levelProgress = getLevelProgress(optimisticXP);

  // Map badges từ data.badges sang BADGE_DEFS
  const badges = BADGE_DEFS.map(def => ({
    ...def,
    earned: data.badges.includes(def.id),
  }));

  return (
    <GamificationContext value={{
      data, optimisticXP, badges,
      currentLevel, nextLevel, levelProgress,
      addXP, trackEvent, initStreak, refresh,
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
