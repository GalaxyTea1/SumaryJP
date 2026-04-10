let cachedHistoryData = null;
let historyFetchedAt = 0;
const HISTORY_CACHE_TTL = 2 * 60 * 1000;

export const historyModal = {
    overlay: null,
    modalContent: null,
    closeBtn: null,
    feedList: null,

    init() {
        this.overlay = document.getElementById('history-overlay');
        this.modalContent = document.getElementById('history-modal-content');
        this.closeBtn = document.getElementById('close-history-btn');
        this.feedList = document.getElementById('history-feed-list');

        if (this.closeBtn && this.overlay) {
            this.closeBtn.addEventListener('click', () => this.hide());
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.hide();
            });
        }
    },

    async show() {
        if (!this.overlay || !this.feedList) return;

        this.feedList.scrollTop = 0;
        this.renderSkeleton();

        this.overlay.classList.remove('hidden');
        setTimeout(() => {
            this.overlay.classList.remove('opacity-0');
            this.overlay.classList.add('opacity-100');
            this.modalContent.classList.remove('scale-95', 'opacity-0');
            this.modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);

        try {
            const now = Date.now();
            if (!cachedHistoryData || (now - historyFetchedAt) > HISTORY_CACHE_TTL) {
                const apiManager = (await import('../api.js')).default;
                cachedHistoryData = await apiManager.getLearningHistory(30);
                historyFetchedAt = now;
            }

            setTimeout(() => this.renderData(cachedHistoryData), 300);
        } catch (error) {
            console.error("Failed to fetch history:", error);
            this.feedList.innerHTML = `<p class="text-center text-rose-500 py-8 font-medium">Không thể tải lịch sử. Vui lòng thử lại sau.</p>`;
        }
    },

    hide() {
        if (!this.overlay) return;
        this.overlay.classList.remove('opacity-100');
        this.overlay.classList.add('opacity-0');
        this.modalContent.classList.remove('scale-100', 'opacity-100');
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => this.overlay.classList.add('hidden'), 300);
    },

    renderSkeleton() {
        let html = '';
        for (let i = 0; i < 5; i++) {
            html += `
                <div class="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 flex items-start gap-4 animate-pulse">
                    <div class="size-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                    <div class="flex-1">
                        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                    <div class="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
                </div>
            `;
        }
        this.feedList.innerHTML = html;
    },

    renderData(data) {
        this.feedList.innerHTML = '';
        if (!data || data.length === 0) {
            this.feedList.innerHTML = `
                <div class="text-center py-12 flex flex-col items-center">
                    <div class="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <span class="material-symbols-outlined text-3xl text-slate-400 dark:text-slate-500">history_toggle_off</span>
                    </div>
                    <p class="text-slate-500 dark:text-slate-400 font-medium">Chưa có hoạt động nào được ghi lại.</p>
                </div>
            `;
            return;
        }

        const statusMap = {
            'not-learned': { label: 'Chưa học', class: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600' },
            'learning': { label: 'Đang học', class: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700' },
            'mastered': { label: 'Đã thuộc', class: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700' },
        };

        const iconTemplates = {
            'mastered': `<div class="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200 dark:border-emerald-700"><span class="material-symbols-outlined text-lg">check_circle</span></div>`,
            'learning': `<div class="size-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-200 dark:border-amber-700"><span class="material-symbols-outlined text-lg">local_fire_department</span></div>`,
            'default': `<div class="size-10 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-slate-600"><span class="material-symbols-outlined text-lg">radio_button_unchecked</span></div>`
        };

        let lastDateString = '';
        let html = '';

        for (const item of data) {
            const dt = new Date(item.created_at);
            const dateStr = dt.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            if (dateStr !== lastDateString) {
                html += `<div class="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-4 mb-2 pl-2">${dateStr}</div>`;
                lastDateString = dateStr;
            }

            const timeStr = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const oldStatus = statusMap[item.old_status] || statusMap['not-learned'];
            const newStatus = statusMap[item.new_status] || statusMap['not-learned'];
            const iconHtml = iconTemplates[item.new_status] || iconTemplates['default'];

            html += `
                <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors shadow-sm">
                    ${iconHtml}
                    <div class="flex-1">
                        <div class="flex items-baseline gap-2">
                            <h4 class="text-base font-bold text-slate-800 dark:text-white">${item.japanese}</h4>
                            <span class="text-sm text-slate-500 dark:text-slate-400">${item.hiragana}</span>
                        </div>
                        <p class="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">${item.meaning}</p>
                    </div>
                    <div class="flex flex-col items-end shrink-0 gap-2">
                        <span class="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">schedule</span> ${timeStr}
                        </span>
                        <div class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                            <span class="px-2 py-1 rounded-md border ${oldStatus.class} opacity-60 hidden sm:inline-block line-through">${oldStatus.label}</span>
                            <span class="material-symbols-outlined text-sm text-slate-300 dark:text-slate-600 hidden sm:inline-block">arrow_right_alt</span>
                            <span class="px-2 py-1 rounded-md border ${newStatus.class}">${newStatus.label}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        this.feedList.innerHTML = html;
    }
};
