import { utils } from "./components/utils.js";

const SYNC_QUEUE_KEY = 'sumary_sync_queue';

export const syncManager = {
    queue: [],
    isSyncing: false,

    init() {
        this.loadQueue();
        
        // Listen for online event to trigger sync
        window.addEventListener('online', () => {
            this.sync();
        });

        // Try syncing on load if we have pending items and network
        if (this.queue.length > 0 && navigator.onLine) {
            this.sync();
        }
    },

    loadQueue() {
        try {
            const saved = localStorage.getItem(SYNC_QUEUE_KEY);
            if (saved) {
                this.queue = JSON.parse(saved);
            }
        } catch (e) {
            this.queue = [];
        }
    },

    saveQueue() {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    },

    enqueue(url, options) {
        // We shouldn't store AbortSignal in localStorage
        const cleanOptions = { ...options };
        delete cleanOptions.signal;

        this.queue.push({
            url,
            options: cleanOptions,
            timestamp: Date.now()
        });
        this.saveQueue();

        utils.showToast("Đã lưu thao tác ngoại tuyến. Sẽ đồng bộ khi có mạng.", "info");

        // Try to sync immediately if we believe we have network 
        // (sometimes failed to fetch is a fluke)
        if (navigator.onLine) {
            setTimeout(() => this.sync(), 2000);
        }
    },

    async sync() {
        if (this.queue.length === 0 || !navigator.onLine || this.isSyncing) return;
        
        this.isSyncing = true;
        let successCount = 0;

        // Process queue sequentially
        while (this.queue.length > 0) {
            const item = this.queue[0];
            
            // Re-inject the latest auth token just in case it changed
            const AUTH_TOKEN_KEY = 'sumary_jp_token';
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (token) {
                item.options.headers = {
                    ...item.options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }

            try {
                // Do not show overlay during background sync to avoid disrupting UX
                const response = await fetch(item.url, item.options);
                
                if (response.ok || (response.status >= 400 && response.status < 500)) {
                    // Success or Client Error (e.g., 400 Bad Request, 404 Not Found)
                    // We remove from queue because retrying won't fix a 4xx error.
                    this.queue.shift();
                    this.saveQueue();
                    if (response.ok) successCount++;
                } else {
                    // 5xx Server Error: server is down. We should pause syncing and try later.
                    break;
                }
            } catch (e) {
                // Network Error: still offline or unstable
                break;
            }
        }

        this.isSyncing = false;

        if (successCount > 0) {
            utils.showToast(`Đã đồng bộ ngầm ${successCount} req!`, "success");
        }
    }
};
