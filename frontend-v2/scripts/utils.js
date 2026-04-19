// ============================================
// Utility Functions — Sumary Japanese
// ============================================

const utils = {
    /** Fisher-Yates shuffle */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /** Alias for shuffleArray */
    shuffle(array) {
        return this.shuffleArray(array);
    },

    /** Escape HTML to prevent XSS */
    escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /** Format seconds → mm:ss */
    formatTime(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /** Format date → relative time (e.g. "2 phút trước") */
    timeAgo(dateStr) {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay < 7) return `${diffDay} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    },

    /** Get status display text + color */
    getStatusInfo(status) {
        const map = {
            'mastered': { text: 'Đã thuộc', color: '#4caf50', dot: 'status-mastered' },
            'learning': { text: 'Đang học', color: '#f0a868', dot: 'status-learning' },
            'not-learned': { text: 'Chưa học', color: '#5f6b7a', dot: 'status-not-learned' },
        };
        return map[status] || map['not-learned'];
    },

    /** Simple debounce */
    debounce(fn, delay = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /** Store test results in localStorage */
    saveTestResult(result) {
        const KEY = 'sumary_test_results';
        const results = JSON.parse(localStorage.getItem(KEY) || '[]');
        results.unshift({ ...result, date: new Date().toISOString() });
        // Keep only last 50
        if (results.length > 50) results.length = 50;
        localStorage.setItem(KEY, JSON.stringify(results));
    },

    /** Get test results from localStorage */
    getTestResults() {
        const KEY = 'sumary_test_results';
        return JSON.parse(localStorage.getItem(KEY) || '[]');
    },
};

window.utils = utils;
