// ============================================
// Gamification — SumaryJP (TypeScript)
// XP, Levels, Streak, Badges (localStorage)
// ============================================

import type {
  GamificationData, GamificationLevel,
  GamificationBadge, GamificationBadgeDef,
} from '@/types';

const STORAGE_KEY = 'sumary_gamification';

export const LEVELS: GamificationLevel[] = [
  { level: 1,  title: 'Tân binh',           xpRequired: 0 },
  { level: 2,  title: 'Người mới bắt đầu',  xpRequired: 50 },
  { level: 3,  title: 'Học sinh chăm',       xpRequired: 150 },
  { level: 4,  title: 'Thợ học từ',          xpRequired: 350 },
  { level: 5,  title: 'Chiến binh N5',       xpRequired: 600 },
  { level: 6,  title: 'Samurai học tập',     xpRequired: 1000 },
  { level: 7,  title: 'Nhà thông thái',      xpRequired: 1500 },
  { level: 8,  title: 'Bậc thầy Kanji',      xpRequired: 2200 },
  { level: 9,  title: 'Sensei',              xpRequired: 3000 },
  { level: 10, title: 'Vua tiếng Nhật',      xpRequired: 4000 },
];

export const BADGE_DEFS: GamificationBadgeDef[] = [
  { id: 'first_login',   icon: '🌸', name: 'Chào mừng!',         desc: 'Lần đầu truy cập' },
  { id: 'first_test',    icon: '📝', name: 'Thử thách đầu tiên', desc: 'Hoàn thành bài test đầu tiên' },
  { id: 'first_perfect', icon: '💯', name: 'Hoàn hảo!',          desc: 'Đạt 100% bài test' },
  { id: 'streak_3',      icon: '🔥', name: 'Streak 3 ngày',      desc: 'Học liên tục 3 ngày' },
  { id: 'streak_7',      icon: '⚡', name: 'Streak 7 ngày',      desc: 'Học liên tục 7 ngày' },
  { id: 'streak_30',     icon: '🏆', name: 'Streak 30 ngày',     desc: 'Học liên tục 30 ngày' },
  { id: 'vocab_50',      icon: '📖', name: '50 từ vựng',         desc: 'Ôn tập 50 từ vựng' },
  { id: 'vocab_200',     icon: '📚', name: '200 từ vựng',        desc: 'Ôn tập 200 từ vựng' },
  { id: 'kanji_20',      icon: '🈳', name: '20 Kanji',           desc: 'Ôn tập 20 Kanji' },
  { id: 'flashcard_100', icon: '🃏', name: '100 Flashcards',     desc: 'Lật 100 flashcard' },
  { id: 'xp_1000',       icon: '⭐', name: '1000 XP',            desc: 'Đạt 1000 XP' },
  { id: 'level_5',       icon: '👑', name: 'Level 5',            desc: 'Đạt Level 5' },
  { id: 'srs_master_10', icon: '🧠', name: 'Nhà ôn tập',         desc: 'Hoàn thành 10 phiên SRS' },
  { id: 'night_owl',     icon: '🦉', name: 'Cú đêm',             desc: 'Học sau 23:00' },
  { id: 'early_bird',    icon: '🐦', name: 'Chim sớm',           desc: 'Học trước 7:00' },
];

export const XP_REWARDS = {
  flashcard_complete: 5,
  test_complete:     15,
  test_perfect:      30,
  srs_session:       10,
  srs_card_good:      3,
  daily_login:       10,
  vocab_mastered:     5,
  kana_mastered:      2,
  kana_quiz_correct:  1,
} as const;

export type XPRewardKey = keyof typeof XP_REWARDS;
export type TrackEventType =
  | 'test_complete' | 'flashcard_flip' | 'flashcard_complete'
  | 'srs_session'   | 'srs_card_good'  | 'vocab_review'
  | 'kanji_review'  | 'first_login'
  | 'kana_mastered' | 'kana_quiz_correct';

// ---- Load / Save ----
function createDefault(): GamificationData {
  return {
    xp: 0, totalXpEarned: 0, badges: [], streak: 0, lastActiveDate: null,
    stats: {
      testsCompleted: 0,
      flashcardsFlipped: 0,
      vocabReviewed: 0,
      kanjiReviewed: 0,
      srsSessions: 0,
      kanaMastered: 0,
      kanaQuizCorrect: 0,
    },
  };
}

export function loadGamification(): GamificationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefault();
    return JSON.parse(raw) as GamificationData;
  } catch {
    return createDefault();
  }
}

function saveGamification(data: GamificationData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- Level Helpers ----
export function getCurrentLevel(xp: number): GamificationLevel {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
    else break;
  }
  return current;
}

export function getNextLevel(xp: number): GamificationLevel | null {
  return LEVELS.find(lvl => xp < lvl.xpRequired) ?? null;
}

export function getLevelProgress(xp: number): number {
  const current = getCurrentLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.xpRequired - current.xpRequired;
  return Math.round(((xp - current.xpRequired) / range) * 100);
}

// ---- Badge ----
function checkBadge(badgeId: string, data: GamificationData): boolean {
  if (data.badges.includes(badgeId)) return false;
  let earned = false;

  switch (badgeId) {
    case 'first_login':     earned = true; break;
    case 'first_test':      earned = data.stats.testsCompleted >= 1; break;
    case 'first_perfect':   earned = true; break;
    case 'streak_3':        earned = data.streak >= 3; break;
    case 'streak_7':        earned = data.streak >= 7; break;
    case 'streak_30':       earned = data.streak >= 30; break;
    case 'vocab_50':        earned = data.stats.vocabReviewed >= 50; break;
    case 'vocab_200':       earned = data.stats.vocabReviewed >= 200; break;
    case 'kanji_20':        earned = data.stats.kanjiReviewed >= 20; break;
    case 'flashcard_100':   earned = data.stats.flashcardsFlipped >= 100; break;
    case 'xp_1000':         earned = data.xp >= 1000; break;
    case 'level_5':         earned = getCurrentLevel(data.xp).level >= 5; break;
    case 'srs_master_10':   earned = data.stats.srsSessions >= 10; break;
    case 'night_owl':       earned = new Date().getHours() >= 23; break;
    case 'early_bird':      earned = new Date().getHours() < 7; break;
  }

  if (earned) {
    data.badges.push(badgeId);
    saveGamification(data);
  }
  return earned;
}

// ---- Add XP ----
export function addXP(amount: number, _reason = ''): GamificationData {
  const data = loadGamification();
  const oldLevel = getCurrentLevel(data.xp);
  data.xp += amount;
  data.totalXpEarned += amount;
  saveGamification(data);

  const newLevel = getCurrentLevel(data.xp);
  if (newLevel.level > oldLevel.level) {
    checkBadge('level_5', data);
  }
  checkBadge('xp_1000', data);
  return data;
}

// ---- Streak ----
export function updateStreak(): GamificationData {
  const data = loadGamification();
  const today = new Date().toDateString();
  if (data.lastActiveDate === today) return data;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (data.lastActiveDate === yesterday.toDateString()) {
    data.streak++;
  } else {
    data.streak = 1;
  }

  data.lastActiveDate = today;
  saveGamification(data);

  checkBadge('streak_3', data);
  checkBadge('streak_7', data);
  checkBadge('streak_30', data);
  addXP(XP_REWARDS.daily_login, 'Đăng nhập hàng ngày');

  return data;
}

// ---- Get Badges ----
export function getBadges(): GamificationBadge[] {
  const data = loadGamification();
  return BADGE_DEFS.map(def => ({ ...def, earned: data.badges.includes(def.id) }));
}

// ---- Track Event ----
export function trackEvent(eventType: TrackEventType, extra: Record<string, number> = {}): void {
  const data = loadGamification();

  switch (eventType) {
    case 'test_complete':
      data.stats.testsCompleted++;
      saveGamification(data);
      addXP(XP_REWARDS.test_complete, 'Hoàn thành bài test');
      checkBadge('first_test', data);
      if (extra['score'] === 100) {
        checkBadge('first_perfect', data);
        addXP(XP_REWARDS.test_perfect, 'Test hoàn hảo 💯');
      }
      break;
    case 'flashcard_flip':
      data.stats.flashcardsFlipped++;
      saveGamification(data);
      checkBadge('flashcard_100', data);
      break;
    case 'flashcard_complete':
      addXP(XP_REWARDS.flashcard_complete, 'Flashcard');
      break;
    case 'srs_session':
      data.stats.srsSessions++;
      saveGamification(data);
      addXP(XP_REWARDS.srs_session, 'Ôn tập SRS');
      checkBadge('srs_master_10', data);
      break;
    case 'srs_card_good':
      addXP(XP_REWARDS.srs_card_good, 'Nhớ tốt');
      break;
    case 'vocab_review':
      data.stats.vocabReviewed += extra['count'] ?? 1;
      saveGamification(data);
      checkBadge('vocab_50', data);
      checkBadge('vocab_200', data);
      break;
    case 'kanji_review':
      data.stats.kanjiReviewed += extra['count'] ?? 1;
      saveGamification(data);
      checkBadge('kanji_20', data);
      break;
    case 'kana_mastered':
      data.stats.kanaMastered = (data.stats.kanaMastered ?? 0) + 1;
      saveGamification(data);
      addXP(XP_REWARDS.kana_mastered, 'Thuộc chữ cái Kana');
      break;
    case 'kana_quiz_correct':
      data.stats.kanaQuizCorrect = (data.stats.kanaQuizCorrect ?? 0) + 1;
      saveGamification(data);
      addXP(XP_REWARDS.kana_quiz_correct, 'Trả lời đúng Kana');
      break;
  }

  checkBadge('night_owl', data);
  checkBadge('early_bird', data);
}
