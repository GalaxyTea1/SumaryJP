const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';

const BASE_URL = isLocalhost
    ? 'http://localhost:3000/api'
    : 'https://jp-backend-api.onrender.com/api';

const API_URL = `${BASE_URL}/vocab`;
const HISTORY_URL = `${BASE_URL}/history`;
const AUTH_TOKEN_KEY = 'sumary_jp_token';

let activeRequests = 0;

const request = async (url, options = {}) => {
    const isMutative = ['POST', 'PUT', 'DELETE'].includes(options.method);
    const shouldShowOverlay = options.showOverlay !== undefined ? options.showOverlay : isMutative;
    const overlay = document.getElementById('api-loading-overlay');

    if (isMutative) {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }
    }

    if (shouldShowOverlay && overlay) {
        activeRequests++;
        overlay.style.display = 'flex';
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (options.method === 'DELETE') return;
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    } finally {
        if (shouldShowOverlay && overlay) {
            activeRequests--;
            if (activeRequests <= 0) {
                activeRequests = 0;
                overlay.style.display = 'none';
            }
        }
    }
};

const apiManager = {
    async getAllVocabulary() {
        return request(API_URL);
    },

    async getVocabularyByLesson(level, lesson) {
        return request(`${API_URL}/${encodeURIComponent(level)}/${encodeURIComponent(lesson)}`);
    },

    async getVocabularyById(id) {
        return request(`${API_URL}/${encodeURIComponent(id)}`);
    },

    async saveVocabulary(vocab) {
        return request(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocab),
        });
    },

    async updateVocabulary(vocab) {
        return request(`${API_URL}/${encodeURIComponent(vocab.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocab),
        });
    },

    async deleteVocabulary(id) {
        return request(`${API_URL}/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
    },

    async getLearningHistory(limit = 20) {
        return request(`${HISTORY_URL}?limit=${limit}`);
    },

    async getWeeklyGoal() {
        return request(`${HISTORY_URL}/weekly-goal`);
    }
};

export default apiManager;