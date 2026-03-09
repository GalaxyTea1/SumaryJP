const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost
    ? 'http://localhost:3000/api/vocab'
    : 'https://jp-backend-api.onrender.com/api/vocab';

const request = async (url, options = {}) => {
    const overlay = document.getElementById('api-loading-overlay');
    if (overlay) overlay.style.display = 'flex';
    try {
        const response = await fetch(url, options);
        if (options.method === 'DELETE') return;
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    } finally {
        if (overlay) overlay.style.display = 'none';
    }
};

const apiManager = {
    async getAllVocabulary() {
        return request(API_URL);
    },

    async getVocabularyByLesson(level, lesson) {
        return request(`${API_URL}/${level}/${lesson}`);
    },

    async getVocabularyById(id) {
        return request(`${API_URL}/${id}`);
    },

    async saveVocabulary(vocab) {
        return request(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocab),
        });
    },

    async updateVocabulary(vocab) {
        return request(`${API_URL}/${vocab.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocab),
        });
    },

    async deleteVocabulary(id) {
        return request(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
    },
};

export default apiManager;