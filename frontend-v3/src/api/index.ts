import type {
  Vocabulary, Grammar, Kanji,
  LearningHistory, WeeklyGoal,
  User, TestResult,
  GrammarFilters, KanjiFilters, GamificationData, KanaProgressItem, SrsProgress,
} from '@/types';

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '';

export const BASE_URL = isLocalhost
  ? 'http://localhost:3000/api'
  : 'https://jp-backend-api.onrender.com/api';

export const AUTH_TOKEN_KEY = 'sumary_jp_token';
const SESSION_CACHE_TTL = 30 * 60 * 1000; // 30 phút

// ---- Session Cache ----
export const sessionCache = {
  KEYS: {
    vocab:   'sj_cache_vocab',
    kanji:   'sj_cache_kanji',
    grammar: 'sj_cache_grammar',
  } as const,

  get<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
      if (Date.now() - ts > SESSION_CACHE_TTL) {
        sessionStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch (e) {
      console.warn('sessionCache: Không thể lưu cache:', e);
    }
  },

  invalidate(...keys: string[]): void {
    keys.forEach(k => sessionStorage.removeItem(k));
  },

  invalidateAll(): void {
    Object.values(this.KEYS).forEach(k => sessionStorage.removeItem(k));
  },
};

// ---- Core Request ----
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (options.method === 'DELETE') return undefined as unknown as T;
  return response.json() as Promise<T>;
}

// ---- API Object ----
export const api = {
  // === VOCABULARY ===
  async getAllVocabulary(): Promise<Vocabulary[]> {
    const cached = sessionCache.get<Vocabulary[]>(sessionCache.KEYS.vocab);
    if (cached) return cached;
    const data = await request<Vocabulary[]>(`${BASE_URL}/vocab`);
    sessionCache.set(sessionCache.KEYS.vocab, data);
    return data;
  },

  async getVocabularyByLesson(level: string, lesson: string): Promise<Vocabulary[]> {
    return request(`${BASE_URL}/vocab/${encodeURIComponent(level)}/${encodeURIComponent(lesson)}`);
  },

  async getVocabularyById(id: number): Promise<Vocabulary> {
    return request(`${BASE_URL}/vocab/${encodeURIComponent(id)}`);
  },

  async saveVocabulary(vocab: Omit<Vocabulary, 'id'>): Promise<Vocabulary> {
    return request(`${BASE_URL}/vocab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vocab),
    });
  },

  async updateVocabulary(vocab: Partial<Vocabulary> & { id: number }): Promise<Vocabulary> {
    return request(`${BASE_URL}/vocab/${encodeURIComponent(vocab.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vocab),
    });
  },

  async updateVocabularyProgress(id: number, progress: {
    status?: 'not-learned' | 'learning' | 'mastered';
    review_count?: number;
    interval?: number;
    ease_factor?: number;
    next_review?: string | null;
    is_difficult?: boolean;
  }): Promise<Vocabulary> {
    return request(`${BASE_URL}/vocab/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    });
  },

  async deleteVocabulary(id: number): Promise<void> {
    return request(`${BASE_URL}/vocab/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // === HISTORY ===
  async getLearningHistory(limit = 20): Promise<LearningHistory[]> {
    return request(`${BASE_URL}/history?limit=${limit}`);
  },

  async getWeeklyGoal(): Promise<WeeklyGoal> {
    return request(`${BASE_URL}/history/weekly-goal`);
  },

  async updateWeeklyGoal(goalTarget: number): Promise<WeeklyGoal> {
    return request(`${BASE_URL}/history/weekly-goal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalTarget }),
    });
  },

  // === AUTH ===
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    return request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  },

  async register(username: string, password: string): Promise<{ token: string; user: User }> {
    return request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request(`${BASE_URL}/auth/me`);
  },

  // === GRAMMAR ===
  async getAllGrammar(filters: GrammarFilters = {}): Promise<Grammar[]> {
    const params = new URLSearchParams();
    if (filters.level)    params.append('level', filters.level);
    if (filters.lesson)   params.append('lesson', filters.lesson);
    if (filters.textbook) params.append('textbook', filters.textbook);
    const qs = params.toString();

    if (!qs) {
      const cached = sessionCache.get<Grammar[]>(sessionCache.KEYS.grammar);
      if (cached) return cached;
      const data = await request<Grammar[]>(`${BASE_URL}/grammar`);
      sessionCache.set(sessionCache.KEYS.grammar, data);
      return data;
    }
    return request(`${BASE_URL}/grammar?${qs}`);
  },

  async getGrammarById(id: number): Promise<Grammar> {
    return request(`${BASE_URL}/grammar/${encodeURIComponent(id)}`);
  },

  async saveGrammar(data: Omit<Grammar, 'id'>): Promise<Grammar> {
    return request(`${BASE_URL}/grammar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateGrammar(id: number, data: Partial<Grammar>): Promise<Grammar> {
    return request(`${BASE_URL}/grammar/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteGrammar(id: number): Promise<void> {
    return request(`${BASE_URL}/grammar/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // === KANJI ===
  async getAllKanji(filters: KanjiFilters = {}): Promise<Kanji[]> {
    const params = new URLSearchParams();
    if (filters.level)  params.append('level', filters.level);
    if (filters.lesson) params.append('lesson', filters.lesson);
    const qs = params.toString();

    if (!qs) {
      const cached = sessionCache.get<Kanji[]>(sessionCache.KEYS.kanji);
      if (cached) return cached;
      const data = await request<Kanji[]>(`${BASE_URL}/kanji`);
      sessionCache.set(sessionCache.KEYS.kanji, data);
      return data;
    }
    return request(`${BASE_URL}/kanji?${qs}`);
  },

  async getKanjiById(id: number): Promise<Kanji> {
    return request(`${BASE_URL}/kanji/${encodeURIComponent(id)}`);
  },

  async saveKanji(data: Omit<Kanji, 'id'>): Promise<Kanji> {
    return request(`${BASE_URL}/kanji`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateKanji(id: number, data: Partial<Kanji>): Promise<Kanji> {
    return request(`${BASE_URL}/kanji/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteKanji(id: number): Promise<void> {
    return request(`${BASE_URL}/kanji/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // === TEST ===
  async submitTestResult(data: Omit<TestResult, 'id'>): Promise<TestResult> {
    return request(`${BASE_URL}/test/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getTestHistory(limit = 10): Promise<TestResult[]> {
    return request(`${BASE_URL}/test/history?limit=${limit}`);
  },

  async getTestResultById(id: number): Promise<TestResult> {
    return request(`${BASE_URL}/test/${encodeURIComponent(id)}`);
  },

  // === GAMIFICATION ===
  async getGamification(): Promise<GamificationData> {
    return request(`${BASE_URL}/gamification/me`);
  },

  async trackGamificationEvent(eventType: string, extra: Record<string, number> = {}): Promise<GamificationData & { awardedXp: number; capped: boolean; newBadges: string[] }> {
    return request(`${BASE_URL}/gamification/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, extra }),
    });
  },

  // === KANA ===
  async getKanaProgress(): Promise<KanaProgressItem[]> {
    return request(`${BASE_URL}/kana/progress`);
  },

  async updateKanaProgress(kanaType: 'hiragana' | 'katakana', character: string, status: 'new' | 'learning' | 'mastered'): Promise<KanaProgressItem> {
    return request(`${BASE_URL}/kana/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kanaType, character, status }),
    });
  },

  // === SRS ===
  async getSrsProgress(): Promise<SrsProgress[]> {
    return request(`${BASE_URL}/srs/progress`);
  },

  async reviewSrsItem(itemType: 'vocab' | 'kanji' | 'grammar', itemId: number, quality: number): Promise<SrsProgress> {
    return request(`${BASE_URL}/srs/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType, itemId, quality }),
    });
  },
};
