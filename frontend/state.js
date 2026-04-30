import apiManager from "./api.js";
import { utils } from "./components/utils.js";

const CACHE_KEY = "sumary_jp_vocab_cache";
const CACHE_TTL = 2 * 60 * 60 * 1000;   
const STALE_TTL = 10 * 60 * 1000;        

export const EVENTS = {
    VOCAB_LOADED: 'VOCAB_LOADED',
    VOCAB_UPDATED: 'VOCAB_UPDATED',
    LESSON_CHANGED: 'LESSON_CHANGED'
};

export const state = {
    _listeners: {},
    currentLesson: null,
    vocabulary: [],
    lessons: {},

    subscribe(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        return () => {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        };
    },

    publish(event, data) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(cb => cb(data));
        }
    },

    setCurrentLesson(lesson, level) {
        this.currentLesson = { lesson, level };
        this.publish(EVENTS.LESSON_CHANGED, this.currentLesson);
    },

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
                    this.publish(EVENTS.VOCAB_LOADED, this.vocabulary);
                    return;
                }
            }

            const allVocab = await apiManager.getAllVocabulary();
            this._saveToCache(allVocab);
            this.vocabulary = allVocab;
            this._rebuildLessonsMap();
            this.publish(EVENTS.VOCAB_LOADED, this.vocabulary);

        } catch (error) {
            console.error("Error loading vocabulary:", error);

            const staleData = this._getStaleCache();
            if (staleData) {
                this.vocabulary = staleData;
                this._rebuildLessonsMap();
                this.publish(EVENTS.VOCAB_LOADED, this.vocabulary);
                return;
            }

            utils.showToast("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.", "error");
            throw error;
        }
    },

    async _revalidateInBackground() {
        try {
            const allVocab = await apiManager.getAllVocabulary();
            this._saveToCache(allVocab);
            this.vocabulary = allVocab;
            this._rebuildLessonsMap();
            this.publish(EVENTS.VOCAB_LOADED, this.vocabulary);
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

    _updateLocalCache(updatedVocab, action = "update") {
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
        this.publish(EVENTS.VOCAB_UPDATED, { vocab: updatedVocab, action });
    },

    _findLocalById(id) {
        return this.vocabulary.find(v => v.id === id) || null;
    },

    _isLoggedIn() {
        return !!localStorage.getItem("sumary_jp_token");
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
        this.publish(EVENTS.VOCAB_UPDATED, { vocab, action: "add" });
    },

    async updateVocabularyStatus(id, newStatus) {
        const vocab = this._findLocalById(id);
        if (!vocab) return null;

        const prevStatus = vocab.status;
        const prevReviewed = vocab.last_reviewed;
        const prevCount = vocab.review_count;

        vocab.status = newStatus;
        vocab.last_reviewed = new Date().toISOString();
        vocab.review_count = (vocab.review_count || 0) + 1;
        
        if (this._isLoggedIn()) {
            try {
                await apiManager.updateVocabulary(vocab);
            } catch (e) {
                vocab.status = prevStatus;
                vocab.last_reviewed = prevReviewed;
                vocab.review_count = prevCount;
                throw new Error("Lỗi cập nhật máy chủ");
            }
        }
        this._updateLocalCache(vocab, "inline_update");
        return vocab.status;
    },

    async removeVocabulary(id) {
        const vocab = this._findLocalById(id);
        if (!vocab) return null;

        const { lesson, level } = vocab;
        await apiManager.deleteVocabulary(id);
        this._invalidateCache();
        await this.loadFromServer(true);
        this.publish(EVENTS.VOCAB_UPDATED, { id, deleted: true, action: "delete" });
        return { lesson, level };
    },

    async toggleDifficulty(id) {
        const vocab = this._findLocalById(id);
        if (!vocab) return null;

        const prevDifficult = vocab.is_difficult;
        vocab.is_difficult = !vocab.is_difficult;

        if (this._isLoggedIn()) {
            try {
                await apiManager.updateVocabulary(vocab);
            } catch (e) {
                vocab.is_difficult = prevDifficult;
                throw new Error("Lỗi cập nhật máy chủ");
            }
        }
        this._updateLocalCache(vocab, "inline_update");
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
        if (this._isLoggedIn()) {
            try {
                await apiManager.updateVocabulary(vocab);
            } catch (e) {
                console.warn("Guest mode or network error, skipping backend sync");
            }
        }
        this._updateLocalCache(vocab);
    }
};
