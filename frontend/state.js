import apiManager from "./api.js";

export const state = {
    currentLesson: null,
    vocabulary: [],
    lessons: {},

    async loadFromServer() {
        try {
            const allVocab = await apiManager.getAllVocabulary();
            this.vocabulary = allVocab;
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

    // Update in-memory cache after a successful server write
    _updateLocalCache(updatedVocab) {
        const idx = this.vocabulary.findIndex(v => v.id === updatedVocab.id);
        if (idx !== -1) {
            this.vocabulary[idx] = { ...this.vocabulary[idx], ...updatedVocab };
            // Sync lessons map
            const v = this.vocabulary[idx];
            const lessonArr = this.lessons[v.level]?.[v.lesson];
            if (lessonArr) {
                const li = lessonArr.findIndex(item => item.id === v.id);
                if (li !== -1) lessonArr[li] = v;
            }
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
        await this.loadFromServer(); // Full reload needed (server generates ID)
    },

    async updateVocabularyStatus(id, newStatus) {
        const vocab = await apiManager.getVocabularyById(id);
        if (vocab) {
            vocab.status = newStatus;
            vocab.last_reviewed = new Date().toISOString();
            vocab.review_count = (vocab.review_count || 0) + 1;
            await apiManager.updateVocabulary(vocab);
            this._updateLocalCache(vocab);
            return vocab.status;
        }
        return null;
    },

    async removeVocabulary(id) {
        const vocab = await apiManager.getVocabularyById(id);
        if (vocab) {
            const { lesson, level } = vocab;
            await apiManager.deleteVocabulary(id);
            await this.loadFromServer(); // Full reload needed after deletion
            return { lesson, level };
        }
        return null;
    },

    async toggleDifficulty(id) {
        const vocab = await apiManager.getVocabularyById(id);
        if (vocab) {
            vocab.is_difficult = !vocab.is_difficult;
            await apiManager.updateVocabulary(vocab);
            this._updateLocalCache(vocab);
            return vocab.is_difficult;
        }
        return null;
    },

    async editVocabulary(id, updatedData) {
        const vocab = await apiManager.getVocabularyById(id);
        if (vocab) {
            const updatedVocab = { ...vocab, ...updatedData };
            await apiManager.updateVocabulary(updatedVocab);
            this._updateLocalCache(updatedVocab);
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

    getDifficultVocabulary() {
        return this.vocabulary.filter(v => v.is_difficult);
    },

    async updateVocabulary(vocab) {
        await apiManager.updateVocabulary(vocab);
        this._updateLocalCache(vocab);
    }
};
