// frontend/api.js
const API_URL = 'http://localhost:3000/api/vocab';

const apiManager = {
    async getAllVocabulary() {
        const response = await fetch(API_URL);
        return response.json();
    },

    async getVocabularyByLesson(level, lesson) {
        const response = await fetch(`${API_URL}/${level}/${lesson}`);
        return response.json();
    },

    async getVocabularyById(id) {
        const response = await fetch(`${API_URL}/${id}`);
        return response.json();
    },

    async saveVocabulary(vocab) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocab),
        });
        return response.json();
    },

    async updateVocabulary(vocab) {
        const response = await fetch(`${API_URL}/${vocab.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocab),
        });
        return response.json();
    },

    async deleteVocabulary(id) {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
    },
};

export default apiManager;