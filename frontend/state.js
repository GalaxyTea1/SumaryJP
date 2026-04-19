import apiManager from "./api.js";

const CACHE_KEY = "sumary_jp_vocab_cache";
const CACHE_TTL = 2 * 60 * 60 * 1000;   
const STALE_TTL = 10 * 60 * 1000;        

export const state = {
    currentLesson: null,
    vocabulary: [],
    lessons: {},

    async loadFromServer(forceRefresh = false) {
        try {
            if (!forceRefresh) {
                const cached = this._getFromCache(true); 
                if (cached) {
                    this.vocabulary = cached.data;
                    this._rebuildLessonsMap();

                    if (cached.isStale) {
                        this._revalidateInBackground();
                    }
                    return;
                }
            }

            const allVocab = await apiManager.getAllVocabulary();
            this._saveToCache(allVocab);
            this.vocabulary = allVocab;
            this._rebuildLessonsMap();

        } catch (error) {
            console.error("Error loading vocabulary:", error);

            const staleData = this._getStaleCache();
            if (staleData) {
                this.vocabulary = staleData;
                this._rebuildLessonsMap();
                return;
            }

            alert("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
            throw error;
        }
    },

    async _revalidateInBackground() {
        try {
            const allVocab = await apiManager.getAllVocabulary();
            this._saveToCache(allVocab);
            this.vocabulary = allVocab;
            this._rebuildLessonsMap();
            console.info('[Cache] Stale-while-revalidate: data refreshed in background');
        } catch (e) {
            console.warn('[Cache] Background revalidation failed:', e);
        }
    },

    _getFromCache(withMeta = false) {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;

            const cached = JSON.parse(raw);
            const age = Date.now() - cached.timestamp;

            if (age > CACHE_TTL) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }

            if (withMeta) return { data: cached.data, isStale: age > STALE_TTL };
            return cached.data;
        } catch {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    },

    _getStaleCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            return cached.data || null;
        } catch {
            return null;
        }
    },

    _saveToCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data
            }));
        } catch (e) {
            console.warn("Could not save vocab cache (storage full?), clearing old:", e);
            try {
                localStorage.removeItem(CACHE_KEY);
                localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
            } catch { /* bỏ qua */ }
        }
    },

    _invalidateCache() {
        localStorage.removeItem(CACHE_KEY);
    },

    _rebuildLessonsMap() {
        this.lessons = {};
        for (const vocab of this.vocabulary) {
            (this.lessons[vocab.level] ??= {})[vocab.lesson] ??= [];
            this.lessons[vocab.level][vocab.lesson].push(vocab);
        }
    },

    _updateLocalCache(updatedVocab) {
        const idx = this.vocabulary.findIndex(v => v.id === updatedVocab.id);
        if (idx !== -1) {
            this.vocabulary[idx] = { ...this.vocabulary[idx], ...updatedVocab };
            const v = this.vocabulary[idx];
            const lessonArr = this.lessons[v.level]?.[v.lesson];
            if (lessonArr) {
                const li = lessonArr.findIndex(item => item.id === v.id);
                if (li !== -1) lessonArr[li] = v;
            }
        }
        this._saveToCache(this.vocabulary);
    },

    _findLocalById(id) {
        return this.vocabulary.find(v => v.id === id) || null;
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
        this._invalidateCache();
        await this.loadFromServer(true);
    },

    async updateVocabularyStatus(id, newStatus) {
        const vocab = this._findLocalById(id);
        if (!vocab) return null;

        vocab.status = newStatus;
        vocab.last_reviewed = new Date().toISOString();
        vocab.review_count = (vocab.review_count || 0) + 1;
        await apiManager.updateVocabulary(vocab);
        this._updateLocalCache(vocab);
        return vocab.status;
    },

    async removeVocabulary(id) {
        const vocab = this._findLocalById(id);
        if (!vocab) return null;

        const { lesson, level } = vocab;
        await apiManager.deleteVocabulary(id);
        this._invalidateCache();
        await this.loadFromServer(true);
        return { lesson, level };
    },

    async toggleDifficulty(id) {
        const vocab = this._findLocalById(id);
        if (!vocab) return null;

        vocab.is_difficult = !vocab.is_difficult;
        await apiManager.updateVocabulary(vocab);
        this._updateLocalCache(vocab);
        return vocab.is_difficult;
    },

    async editVocabulary(id, updatedData) {
        const vocab = this._findLocalById(id);
        if (!vocab) return null;

        const updatedVocab = { ...vocab, ...updatedData };
        await apiManager.updateVocabulary(updatedVocab);
        this._updateLocalCache(updatedVocab);
        return updatedVocab;
    },

    async getVocabularyById(id) {
        return this._findLocalById(id) || await apiManager.getVocabularyById(id);
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
