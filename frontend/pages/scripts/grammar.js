// ============================================
// Grammar Page Logic — Sumary Japanese
// Dữ liệu từ API: /api/grammar
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    let allGrammar = [];
    let filteredGrammar = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 6;

    let activeLevel = 'all';
    let activeTextbook = 'all';
    let searchQuery = '';

    // --- Load data ---
    try {
        allGrammar = await api.getAllGrammar();
        filteredGrammar = [...allGrammar];
    } catch (e) {
        console.warn('Grammar: Không thể tải data.', e);
    }

    // --- DOM ---
    const gridEl = document.getElementById('grammar-grid');
    const paginationEl = document.getElementById('grammar-pagination');
    const searchInput = document.getElementById('grammar-search');
    const textbookSelect = document.getElementById('grammar-textbook-filter');
    const levelPills = document.querySelectorAll('.filter-pill[data-level]');

    // --- Events ---
    levelPills.forEach(pill => {
        pill.addEventListener('click', () => {
            levelPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeLevel = pill.dataset.level;
            currentPage = 1;
            applyFilters();
        });
    });

    if (textbookSelect) {
        textbookSelect.addEventListener('change', () => {
            activeTextbook = textbookSelect.value;
            currentPage = 1;
            applyFilters();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(() => {
            searchQuery = searchInput.value.trim().toLowerCase();
            currentPage = 1;
            applyFilters();
        }, 250));
    }

    // --- Filter & Render ---
    function applyFilters() {
        filteredGrammar = allGrammar.filter(g => {
            if (activeLevel !== 'all' && g.level !== activeLevel) return false;
            if (activeTextbook !== 'all' && g.textbook !== activeTextbook) return false;
            if (searchQuery) {
                return (g.pattern || '').toLowerCase().includes(searchQuery)
                    || (g.meaning || '').toLowerCase().includes(searchQuery)
                    || (g.example_ja || '').toLowerCase().includes(searchQuery);
            }
            return true;
        });
        renderGrid();
        renderPagination();
    }

    function renderGrid() {
        if (!gridEl) return;

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = filteredGrammar.slice(start, start + ITEMS_PER_PAGE);

        if (pageItems.length === 0) {
            gridEl.innerHTML = `<div class="col-span-2 text-center text-[#5f6b7a] py-12">Không tìm thấy ngữ pháp nào.</div>`;
            return;
        }

        gridEl.innerHTML = pageItems.map(g => {
            const levelClass = getLevelBadgeClass(g.level);
            const lessonLabel = g.lesson ? `Bài ${g.lesson}` : '';
            const textbookLabel = g.textbook || '';
            const metaLabel = [lessonLabel, textbookLabel].filter(Boolean).join(' • ');

            // Highlight pattern trong example_ja
            const exampleHtml = g.example_ja
                ? highlightPattern(g.example_ja, g.pattern)
                : '<span class="text-[#5f6b7a] italic">Chưa có ví dụ</span>';

            const noteHtml = g.note
                ? `<div class="text-xs text-[#5f6b7a] mt-2 flex items-start gap-1"><span class="material-symbols-outlined text-sm">info</span> ${utils.escapeHtml(g.note)}</div>`
                : '';

            return `
                <div class="card p-6">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <span class="level-badge ${levelClass}">${g.level}</span>
                            <span class="text-xs text-[#5f6b7a]">${metaLabel}</span>
                        </div>
                    </div>
                    <div class="grammar-pattern mb-2">${utils.escapeHtml(g.pattern)}</div>
                    <div class="text-[#5f6b7a] mb-4">${utils.escapeHtml(g.meaning)}</div>
                    <div class="bg-[#f8fafb] rounded-lg p-3 mb-2">
                        <div class="example-ja text-sm">${exampleHtml}</div>
                        ${g.example_vi ? `<div class="example-vi mt-1">→ ${utils.escapeHtml(g.example_vi)}</div>` : ''}
                    </div>
                    ${noteHtml}
                    ${g.explanation ? `<a href="#" class="text-sm text-[#6caba0] font-semibold hover:underline mt-2 inline-block" data-id="${g.id}">Xem chi tiết →</a>` : ''}
                </div>
            `;
        }).join('');
    }

    function highlightPattern(text, pattern) {
        if (!text || !pattern) return utils.escapeHtml(text || '');
        // Cố gắng tìm phần pattern trong example (bỏ dấu ～)
        const cleanPattern = pattern.replace(/[～〜]/g, '');
        const escaped = utils.escapeHtml(text);
        // Tìm chuỗi kết thúc bằng pattern (ví dụ てください)
        if (cleanPattern && text.includes(cleanPattern)) {
            return escaped.replace(
                utils.escapeHtml(cleanPattern),
                `<span class="text-[#6caba0] font-bold">${utils.escapeHtml(cleanPattern)}</span>`
            );
        }
        return escaped;
    }

    function renderPagination() {
        if (!paginationEl) return;
        const totalPages = Math.ceil(filteredGrammar.length / ITEMS_PER_PAGE);
        if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

        let html = `<button class="px-3 py-1.5 rounded-lg border border-gray-200 text-[#5f6b7a] hover:bg-gray-50 ${currentPage === 1 ? 'opacity-40 pointer-events-none' : ''}" data-page="${currentPage - 1}">← Trước</button>`;

        for (let i = 1; i <= totalPages; i++) {
            const active = i === currentPage ? 'bg-[#6caba0] text-white' : 'border border-gray-200 text-[#5f6b7a] hover:bg-gray-50';
            html += `<button class="px-3 py-1.5 rounded-lg ${active}" data-page="${i}">${i}</button>`;
        }

        html += `<button class="px-3 py-1.5 rounded-lg border border-gray-200 text-[#5f6b7a] hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-40 pointer-events-none' : ''}" data-page="${currentPage + 1}">Tiếp →</button>`;
        paginationEl.innerHTML = html;

        paginationEl.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.dataset.page);
                renderGrid();
                renderPagination();
            });
        });
    }

    function getLevelBadgeClass(level) {
        const map = { 'N5': 'level-n5', 'N4': 'level-n4', 'N3': 'level-n3', 'N2': 'level-n2', 'N1': 'level-n1' };
        return map[level] || 'level-n5';
    }

    // Initial render
    applyFilters();
    auth.updateSidebarUser();
});
