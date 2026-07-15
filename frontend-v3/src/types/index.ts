// ============================================
// Type Definitions — SumaryJP
// ============================================

// --- Auth ---
export interface User {
  id: number;
  username: string;
  display_name?: string;
  role: 'user' | 'admin';
  level?: string;
}

// --- Vocabulary ---
export interface Vocabulary {
  id: number;
  japanese: string;
  hiragana?: string;
  meaning: string;
  example?: string;
  level?: string;
  lesson?: string;
  status?: 'not-learned' | 'learning' | 'mastered';
  srs_level?: number;
  next_review?: string | null;
  is_difficult?: boolean;
}

// --- Grammar ---
export interface Grammar {
  id: number;
  pattern: string;
  meaning: string;
  explanation?: string;
  example?: string;
  example_ja?: string;
  example_vi?: string;
  note?: string;
  level?: string;
  lesson?: string;
  textbook?: string;
}

// --- Kanji ---
export interface Kanji {
  id: number;
  kanji: string;
  meaning: string;
  onyomi?: string;
  kunyomi?: string;
  level?: string;
  lesson?: string;
  stroke_count?: number;
}

// --- History ---
export interface LearningHistory {
  id: number;
  vocab_id?: number;
  japanese?: string;
  action?: string;
  new_status?: 'not-learned' | 'learning' | 'mastered';
  created_at: string;
}

export interface WeeklyGoal {
  goalCount: number;
  goalTarget?: number;
  weekStart?: string;
  weekEnd?: string;
}

export interface SrsProgress {
  id: number;
  userId: number;
  itemType: 'vocab' | 'kanji' | 'grammar';
  itemId: number;
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReview: string;
  lastReview: string | null;
}

// --- Test ---
export interface TestQuestion {
  id: number;
  vocab_id?: number;
  japanese?: string;
  question: string;
  options: string[];
  correct_answer: string;
  type?: string;
}

export interface TestResult {
  id?: number;
  score: number;
  total: number;
  level?: string | null;
  completed_at?: string;
  time_taken?: number;
  test_type?: string;
  lesson?: number | null;
  total_questions?: number;
  correct_answers?: number;
  correct?: number;
  mode?: string;
  details?: unknown;
}

// --- Gamification ---
export interface GamificationLevel {
  level: number;
  title: string;
  xpRequired: number;
}

export interface GamificationBadgeDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export interface GamificationBadge extends GamificationBadgeDef {
  earned: boolean;
}

export interface GamificationStats {
  testsCompleted: number;
  flashcardsFlipped: number;
  vocabReviewed: number;
  kanjiReviewed: number;
  srsSessions: number;
  kanaMastered?: number;
  kanaQuizCorrect?: number;
}

export interface GamificationData {
  xp: number;
  totalXpEarned: number;
  badges: string[];
  streak: number;
  lastActiveDate: string | null;
  stats: GamificationStats;
}

export interface KanaProgressItem {
  id?: number;
  user_id?: number;
  kana_type: 'hiragana' | 'katakana';
  character: string;
  status: 'new' | 'learning' | 'mastered';
  updated_at?: string;
}

// --- API Generic ---
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// --- Filters ---
export interface VocabFilters {
  level?: string;
  lesson?: string;
  status?: string;
}

export interface GrammarFilters {
  level?: string;
  lesson?: string;
  textbook?: string;
}

export interface KanjiFilters {
  level?: string;
  lesson?: string;
}
