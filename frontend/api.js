const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';

const BASE_URL = isLocalhost
    ? 'http://localhost:3000/api'
    : 'https://jp-backend-api.onrender.com/api';

const API_URL = `${BASE_URL}/vocab`;
const HISTORY_URL = `${BASE_URL}/history`;
const AUTH_TOKEN_KEY = 'sumary_jp_token';

const REQUEST_TIMEOUT_MS = 20000;   // 20s timeout mỗi lần thử
const MAX_RETRIES = 2;              // Thử lại tối đa 2 lần
const RETRY_BASE_DELAY_MS = 1500;   // Delay cơ bản giữa các lần retry

let activeRequests = 0;

let _toastTimeout = null;

function _showColdStartToast() {
    let toast = document.getElementById('_cold-start-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = '_cold-start-toast';
        toast.style.cssText = [
            'position:fixed', 'bottom:24px', 'left:50%',
            'transform:translateX(-50%) translateY(80px)',
            'background:#1e293b', 'color:#e2e8f0',
            'padding:12px 20px', 'border-radius:14px',
            'font-size:14px', 'font-weight:600',
            'box-shadow:0 8px 32px rgba(0,0,0,0.3)',
            'z-index:99999', 'display:flex', 'align-items:center', 'gap:10px',
            'transition:transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.35s ease',
            'opacity:0', 'pointer-events:none', 'white-space:nowrap',
        ].join(';');
        toast.innerHTML = `
            <span style="display:inline-block;width:16px;height:16px;border:2px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:_spin 0.8s linear infinite;flex-shrink:0"></span>
            <span>Chờ chút bạn nhé...</span>
        `;
        const style = document.createElement('style');
        style.textContent = '@keyframes _spin{to{transform:rotate(360deg)}}';
        document.head.appendChild(style);
        document.body.appendChild(toast);
    }
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });
    _toastTimeout = setTimeout(() => _hideColdStartToast(), 60000); // tự ẩn sau 60s
}

function _hideColdStartToast() {
    clearTimeout(_toastTimeout);
    const toast = document.getElementById('_cold-start-toast');
    if (!toast) return;
    toast.style.transform = 'translateX(-50%) translateY(80px)';
    toast.style.opacity = '0';
}
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Gửi req với AbortController timeout + exponential-backoff retry.
 * retry sau 3s nếu chưa có response (cold start).
 */
const request = async (url, options = {}, _attempt = 0) => {
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

    let coldStartTimer = null;
    if (_attempt === 0) {
        coldStartTimer = setTimeout(_showColdStartToast, 3000);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        clearTimeout(coldStartTimer);
        _hideColdStartToast();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (options.method === 'DELETE') return;
        return await response.json();

    } catch (error) {
        clearTimeout(timeoutId);
        clearTimeout(coldStartTimer);

        const isAborted = error.name === 'AbortError';
        const isNetworkDown = error instanceof TypeError && error.message === 'Failed to fetch';
        const isServerError = error.message?.startsWith('HTTP 5');
        const canRetry = (isAborted || isServerError) && !isNetworkDown;
        const shouldRetry = canRetry && _attempt < MAX_RETRIES;

        if (shouldRetry) {
            // Exponential backoff: 1.5s, 3s
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, _attempt);
            console.warn(`API retry ${_attempt + 1}/${MAX_RETRIES} after ${delay}ms:`, url);
            await new Promise(res => setTimeout(res, delay));
            return request(url, options, _attempt + 1);
        }

        _hideColdStartToast();
        if (isNetworkDown) {
            console.warn('API: Server không phản hồi (offline hoặc chưa khởi động):', url);
        } else {
            console.error('API Error:', isAborted ? 'Timeout' : error);
        }
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

export function warmupBackend() {
    if (isLocalhost) return;
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    fetch(`${BASE_URL}/health`, { signal: controller.signal, priority: 'low' })
        .catch(() => { /* silent - chỉ để đánh thức server */ });
}

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