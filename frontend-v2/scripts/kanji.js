// ============================================
// Kanji Page Logic — Sumary Japanese
// Dữ liệu từ API: /api/kanji
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    let allKanji = [];
    let filteredKanji = [];
    let activeLevel = 'all';
    let activeLesson = 'all';
    let searchQuery = '';

    // --- Load data ---
    try {
        allKanji = await api.getAllKanji();
    } catch (e) {
        console.warn('Kanji: Không thể tải data.', e);
    }

    // --- DOM ---
    const gridEl = document.getElementById('kanji-grid');
    const emptyEl = document.getElementById('kanji-empty');
    const countEl = document.getElementById('kanji-count');
    const lessonCountEl = document.getElementById('kanji-lesson-count');
    const searchInput = document.getElementById('kanji-search');
    const levelPills = document.querySelectorAll('.filter-pill[data-level]');
    const modalOverlay = document.getElementById('kanji-modal-overlay');
    const modalClose = document.getElementById('kanji-modal-close');

    // --- Custom Dropdown ---
    function initCustomDropdown(container, onChange) {
        if (!container) return;
        const btn = container.querySelector('.custom-dropdown-btn');
        const list = container.querySelector('.custom-dropdown-list');
        const label = btn.querySelector('.label');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown-list.show').forEach(l => {
                if (l !== list) { l.classList.remove('show'); l.closest('.custom-dropdown').querySelector('.custom-dropdown-btn').classList.remove('open'); }
            });
            list.classList.toggle('show');
            btn.classList.toggle('open');
        });

        list.addEventListener('click', (e) => {
            const item = e.target.closest('.custom-dropdown-item');
            if (!item) return;
            list.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            label.textContent = item.textContent;
            list.classList.remove('show');
            btn.classList.remove('open');
            onChange(item.dataset.value);
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown-list.show').forEach(l => {
            l.classList.remove('show');
            l.closest('.custom-dropdown').querySelector('.custom-dropdown-btn').classList.remove('open');
        });
    });

    // --- Init lesson dropdown ---
    function populateLessons() {
        const dropdown = document.getElementById('kanji-lesson-dropdown');
        if (!dropdown) return;
        const list = dropdown.querySelector('.custom-dropdown-list');

        list.innerHTML = '<div class="custom-dropdown-item active" data-value="all">Tất cả bài</div>';

        const lessons = [...new Set(allKanji.map(k => k.lesson).filter(Boolean))].sort((a, b) => {
            const nA = parseInt(a); const nB = parseInt(b);
            if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
            return String(a).localeCompare(String(b));
        });

        lessons.forEach(l => {
            const item = document.createElement('div');
            item.className = 'custom-dropdown-item';
            item.dataset.value = l;
            item.textContent = `Bài ${l}`;
            list.appendChild(item);
        });
    }

    initCustomDropdown(document.getElementById('kanji-lesson-dropdown'), (val) => {
        activeLesson = val;
        applyFilters();
    });

    // --- Level pills ---
    levelPills.forEach(pill => {
        pill.addEventListener('click', () => {
            levelPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeLevel = pill.dataset.level;
            applyFilters();
        });
    });

    // --- Search ---
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(() => {
            searchQuery = searchInput.value.trim().toLowerCase();
            applyFilters();
        }, 250));
    }

    // --- Filter & Render ---
    function applyFilters() {
        filteredKanji = allKanji.filter(k => {
            if (activeLevel !== 'all' && k.level !== activeLevel) return false;
            if (activeLesson !== 'all' && String(k.lesson) !== activeLesson) return false;
            if (searchQuery) {
                return (k.character || '').includes(searchQuery)
                    || (k.meaning || '').toLowerCase().includes(searchQuery)
                    || (k.onyomi || '').toLowerCase().includes(searchQuery)
                    || (k.kunyomi || '').toLowerCase().includes(searchQuery);
            }
            return true;
        });
        renderGrid();
        updateStats();
    }

    function updateStats() {
        countEl.textContent = `${filteredKanji.length} Kanji`;
        const lessons = new Set(filteredKanji.map(k => k.lesson).filter(Boolean));
        lessonCountEl.textContent = `${lessons.size} bài`;
    }

    function renderGrid() {
        if (filteredKanji.length === 0) {
            gridEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
            return;
        }
        emptyEl.classList.add('hidden');

        gridEl.innerHTML = filteredKanji.map(k => {
            const levelClass = getLevelBadgeClass(k.level);
            return `
                <div class="card kanji-card p-5 text-center" data-id="${k.id}">
                    ${k.stroke_count ? `<div class="stroke-count">${k.stroke_count} nét</div>` : ''}
                    <div class="kanji-char mb-3">${utils.escapeHtml(k.character)}</div>
                    <div class="text-sm font-semibold mb-1">${utils.escapeHtml(k.meaning)}</div>
                    <div class="text-xs text-[#5f6b7a] mb-2 font-['Noto_Sans_JP']">
                        ${k.onyomi ? utils.escapeHtml(k.onyomi) : ''}
                        ${k.onyomi && k.kunyomi ? ' / ' : ''}
                        ${k.kunyomi ? utils.escapeHtml(k.kunyomi) : ''}
                    </div>
                    <div class="flex items-center justify-center gap-1.5">
                        <span class="level-badge ${levelClass}">${k.level}</span>
                        ${k.lesson ? `<span class="text-[0.6875rem] text-[#5f6b7a]">Bài ${k.lesson}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Card click → modal
        gridEl.querySelectorAll('.kanji-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const kanji = allKanji.find(k => k.id === id);
                if (kanji) showModal(kanji);
            });
        });
    }

    // --- Modal ---
    function showModal(k) {
        document.getElementById('modal-kanji-char').textContent = k.character;
        document.getElementById('modal-kanji-meaning').textContent = k.meaning;

        const levelEl = document.getElementById('modal-kanji-level');
        levelEl.textContent = k.level;
        levelEl.className = `level-badge ${getLevelBadgeClass(k.level)}`;

        document.getElementById('modal-kanji-lesson').textContent = k.lesson ? `Bài ${k.lesson}` : '';
        document.getElementById('modal-kanji-strokes').textContent = k.stroke_count ? `• ${k.stroke_count} nét` : '';
        document.getElementById('modal-kanji-onyomi').textContent = k.onyomi || '—';
        document.getElementById('modal-kanji-kunyomi').textContent = k.kunyomi || '—';

        // Radical
        const radicalRow = document.getElementById('modal-kanji-radical-row');
        if (k.radical) {
            radicalRow.classList.remove('hidden');
            document.getElementById('modal-kanji-radical').textContent = k.radical;
        } else {
            radicalRow.classList.add('hidden');
        }

        // Examples
        const examplesEl = document.getElementById('modal-kanji-examples');
        if (k.example_words) {
            const words = k.example_words.split('、');
            examplesEl.innerHTML = words.map(w => `
                <div class="bg-[#f8fafb] rounded-lg p-3 flex items-center gap-3">
                    <span class="font-['Noto_Sans_JP'] text-lg font-bold text-[#6caba0]">${utils.escapeHtml(w.split('（')[0])}</span>
                    ${w.includes('（') ? `<span class="text-sm text-[#5f6b7a]">${utils.escapeHtml(w.match(/（(.+?)）/)?.[1] || '')}</span>` : ''}
                </div>
            `).join('');
        } else {
            examplesEl.innerHTML = '<div class="text-sm text-[#5f6b7a] italic">Chưa có ví dụ</div>';
        }

        modalOverlay.classList.add('show');
    }

    function hideModal() {
        modalOverlay.classList.remove('show');
    }

    modalClose.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) hideModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideModal(); });

    function getLevelBadgeClass(level) {
        const map = { 'N5': 'level-n5', 'N4': 'level-n4', 'N3': 'level-n3', 'N2': 'level-n2', 'N1': 'level-n1' };
        return map[level] || 'level-n5';
    }

    // --- Init ---
    populateLessons();
    applyFilters();
    auth.updateSidebarUser();
});
