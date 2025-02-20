const dbManager = {
    db: null,
    DB_NAME: 'JapaneseVocabDB',
    DB_VERSION: 1,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('vocabulary')) {
                    const store = db.createObjectStore('vocabulary', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('level', 'level', { unique: false });
                    store.createIndex('lesson', 'lesson', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                }
            };
        });
    },

    async saveVocabulary(vocab) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary'], 'readwrite');
            const store = transaction.objectStore('vocabulary');
            const request = store.add(vocab);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async updateVocabulary(vocab) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary'], 'readwrite');
            const store = transaction.objectStore('vocabulary');
            const request = store.put(vocab);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async deleteVocabulary(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary'], 'readwrite');
            const store = transaction.objectStore('vocabulary');
            const request = store.delete(Number(id));
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getAllVocabulary() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary'], 'readonly');
            const store = transaction.objectStore('vocabulary');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getVocabularyById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary'], 'readonly');
            const store = transaction.objectStore('vocabulary');
            const request = store.get(Number(id));
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getVocabularyByLesson(level, lesson) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary'], 'readonly');
            const store = transaction.objectStore('vocabulary');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const results = request.result.filter(
                    vocab => vocab.level === level && vocab.lesson === lesson
                );
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }
}; 