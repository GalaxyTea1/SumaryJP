const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
const BASE_URL = isLocalhost ? 'http://localhost:3000/api' : 'https://jp-backend-api.onrender.com/api';

const AUTH_TOKEN_KEY = 'sumary_jp_token';
const SESSION_CACHE_TTL = 30 * 60 * 1000;

const sessionCache = {
    KEYS: {
        vocab: 'sj_cache_vocab',
        kanji: 'sj_cache_kanji',
        grammar: 'sj_cache_grammar',
    },

    get(key) {
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return null;
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts > SESSION_CACHE_TTL) {
                sessionStorage.removeItem(key);
                return null;
            }
            return data;
        } catch {
            return null;
        }
    },

    set(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
        } catch (e) {
            console.warn('sessionCache: Không thể lưu cache:', e);
        }
    },

    invalidate(...keys) {
        keys.forEach(k => sessionStorage.removeItem(k));
    },

    invalidateAll() {
        Object.values(this.KEYS).forEach(k => sessionStorage.removeItem(k));
    },
};

// --- Core request function ---
async function request(url, options = {}) {
    const isMutative = ['POST', 'PUT', 'DELETE'].includes(options.method);

    // Auto attach auth token for mutative requests
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (options.method === 'DELETE') return;
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// --- API Manager ---
const api = {
    // === VOCABULARY ===
    async getAllVocabulary() {
        const cached = sessionCache.get(sessionCache.KEYS.vocab);
        if (cached) return cached;
        const data = await request(`${BASE_URL}/vocab`);
        sessionCache.set(sessionCache.KEYS.vocab, data);
        return data;
    },

    async getVocabularyByLesson(level, lesson) {
        return request(`${BASE_URL}/vocab/${encodeURIComponent(level)}/${encodeURIComponent(lesson)}`);
    },

    async getVocabularyById(id) {
        return request(`${BASE_URL}/vocab/${encodeURIComponent(id)}`);
    },

    async saveVocabulary(vocab) {
        return request(`${BASE_URL}/vocab`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocab),
        });
    },

    async updateVocabulary(vocab) {
        return request(`${BASE_URL}/vocab/${encodeURIComponent(vocab.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocab),
        });
    },

    async deleteVocabulary(id) {
        return request(`${BASE_URL}/vocab/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
    },

    // === HISTORY ===
    async getLearningHistory(limit = 20) {
        return request(`${BASE_URL}/history?limit=${limit}`);
    },

    async getWeeklyGoal() {
        return request(`${BASE_URL}/history/weekly-goal`);
    },

    // === AUTH ===
    async login(username, password) {
        return request(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
    },

    async register(username, password) {
        return request(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
    },

    async getMe() {
        return request(`${BASE_URL}/auth/me`);
    },

    // === GRAMMAR ===
    async getAllGrammar(filters = {}) {
        const params = new URLSearchParams();
        if (filters.level) params.append('level', filters.level);
        if (filters.lesson) params.append('lesson', filters.lesson);
        if (filters.textbook) params.append('textbook', filters.textbook);
        const qs = params.toString();

        if (!qs) {
            const cached = sessionCache.get(sessionCache.KEYS.grammar);
            if (cached) return cached;
            const data = await request(`${BASE_URL}/grammar`);
            sessionCache.set(sessionCache.KEYS.grammar, data);
            return data;
        }
        return request(`${BASE_URL}/grammar?${qs}`);
    },

    async getGrammarById(id) {
        return request(`${BASE_URL}/grammar/${encodeURIComponent(id)}`);
    },

    async saveGrammar(data) {
        return request(`${BASE_URL}/grammar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    async updateGrammar(id, data) {
        return request(`${BASE_URL}/grammar/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    async deleteGrammar(id) {
        return request(`${BASE_URL}/grammar/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },

    // === KANJI ===
    async getAllKanji(filters = {}) {
        const params = new URLSearchParams();
        if (filters.level) params.append('level', filters.level);
        if (filters.lesson) params.append('lesson', filters.lesson);
        const qs = params.toString();

        if (!qs) {
            const cached = sessionCache.get(sessionCache.KEYS.kanji);
            if (cached) return cached;
            const data = await request(`${BASE_URL}/kanji`);
            sessionCache.set(sessionCache.KEYS.kanji, data);
            return data;
        }
        return request(`${BASE_URL}/kanji?${qs}`);
    },

    async getKanjiById(id) {
        return request(`${BASE_URL}/kanji/${encodeURIComponent(id)}`);
    },

    async saveKanji(data) {
        return request(`${BASE_URL}/kanji`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    async updateKanji(id, data) {
        return request(`${BASE_URL}/kanji/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    async deleteKanji(id) {
        return request(`${BASE_URL}/kanji/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },

    // === TEST RESULTS ===
    async submitTestResult(data) {
        return request(`${BASE_URL}/test/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    async getTestHistory(limit = 10) {
        return request(`${BASE_URL}/test/history?limit=${limit}`);
    },

    async getTestResultById(id) {
        return request(`${BASE_URL}/test/${encodeURIComponent(id)}`);
    },
};

// Export for use in other scripts
window.api = api;
window.AUTH_TOKEN_KEY = AUTH_TOKEN_KEY;
window.sessionCache = sessionCache;

