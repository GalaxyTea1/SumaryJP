import apiManager from "./api.js";

export const state = {
    currentLesson: null,
    lessons: {},

    async loadFromServer() {
        try {
            const allVocab = await apiManager.getAllVocabulary();
            this.lessons = {};
            allVocab.forEach((vocab) => {
                if (!this.lessons[vocab.level]) {
                    this.lessons[vocab.level] = {};
                }
                if (!this.lessons[vocab.level][vocab.lesson]) {
                    this.lessons[vocab.level][vocab.lesson] = [];
                }
                this.lessons[vocab.level][vocab.lesson].push(vocab);
            });
        } catch (error) {
            console.error("Error loading vocabulary:", error);
            alert("Có lỗi khi tải dữ liệu. Vui lòng thử lại.");
            throw error;
        }
    },

    async addVocabulary(lesson, level, vocab) {
        vocab.lesson = lesson;
        vocab.level = level;
        vocab.status = "not-learned";
        vocab.last_reviewed = null;
        vocab.review_count = 0;
        vocab.interval = 0;
        vocab.ease_factor = 2.5;
        vocab.next_review = new Date().toISOString();
        await apiManager.saveVocabulary(vocab);
        await this.loadFromServer();
    },

    async updateVocabularyStatus(id, newStatus) {
        const vocab = await apiManager.getVocabularyById(id);
        if (vocab) {
            vocab.status = newStatus;
            vocab.last_reviewed = new Date().toISOString();
            vocab.review_count = (vocab.review_count || 0) + 1;
            await apiManager.updateVocabulary(vocab);
            return true;
        }
        return false;
    },

    async removeVocabulary(id) {
        const vocab = await apiManager.getVocabularyById(id);
        if (vocab) {
            const currentLesson = vocab.lesson;
            const currentLevel = vocab.level;
            await apiManager.deleteVocabulary(id);
            await this.loadFromServer();
            return { lesson: currentLesson, level: currentLevel };
        }
        return null;
    },

    async toggleDifficulty(id) {
        const vocab = await apiManager.getVocabularyById(id);
        if (vocab) {
            vocab.is_difficult = !vocab.is_difficult;
            await apiManager.updateVocabulary(vocab);
            await this.loadFromServer();
            return vocab.is_difficult;
        }
        return null;
    },

    async editVocabulary(id, updatedData) {
        const vocab = await apiManager.getVocabularyById(id);
        if (vocab) {
            const updatedVocab = { ...vocab, ...updatedData };
            await apiManager.updateVocabulary(updatedVocab);
            await this.loadFromServer();
            return updatedVocab;
        }
        return null;
    },

    async getVocabularyById(id) {
        return await apiManager.getVocabularyById(id);
    },

    getVocabularyByLesson(level, lesson) {
        return this.lessons[level]?.[lesson] || [];
    },
    
    updateVocabulary: async function(vocab) {
        await apiManager.updateVocabulary(vocab);
        await this.loadFromServer();
    }
};
