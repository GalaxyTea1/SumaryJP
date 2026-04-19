document.addEventListener('DOMContentLoaded', async () => {
    let allVocab = [];
    let filteredVocab = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 20;

    // Filters state
    let activeLevel = 'all';
    let activeLesson = 'all';
    let activeStatus = 'all';
    let searchQuery = '';

    // --- Load data ---
    try {
        allVocab = await api.getAllVocabulary();
        filteredVocab = [...allVocab];
    } catch (e) {
        console.warn('Vocabulary: Không thể tải từ API.', e);
    }

    // --- DOM Elements ---
    const tableBody = document.getElementById('vocab-table-body');
    const paginationEl = document.getElementById('vocab-pagination');
    const searchInput = document.getElementById('vocab-search');
    const lessonDropdown = document.getElementById('vocab-lesson-dropdown');
    const statusDropdown = document.getElementById('vocab-status-dropdown');
    const levelPills = document.querySelectorAll('.filter-pill[data-level]');
    const summaryEl = document.getElementById('vocab-summary');

    // --- Custom Dropdown Helper ---
    function initCustomDropdown(container, onChange) {
        if (!container) return;
        const btn = container.querySelector('.custom-dropdown-btn');
        const list = container.querySelector('.custom-dropdown-list');
        const label = btn.querySelector('.label');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close all other dropdowns first
            document.querySelectorAll('.custom-dropdown-list.show').forEach(l => {
                if (l !== list) {
                    l.classList.remove('show');
                    l.closest('.custom-dropdown').querySelector('.custom-dropdown-btn').classList.remove('open');
                }
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

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown-list.show').forEach(l => {
            l.classList.remove('show');
            l.closest('.custom-dropdown').querySelector('.custom-dropdown-btn').classList.remove('open');
        });
    });

    // --- Event Listeners ---
    // Level pills
    levelPills.forEach(pill => {
        pill.addEventListener('click', () => {
            levelPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeLevel = pill.dataset.level;
            currentPage = 1;
            applyFilters();
        });
    });

    // Populate lesson dropdown
    if (lessonDropdown) {
        const list = lessonDropdown.querySelector('.custom-dropdown-list');
        const lessons = [...new Set(allVocab.map(v => v.lesson))].sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return String(a).localeCompare(String(b));
        });
        lessons.forEach(l => {
            const item = document.createElement('div');
            item.className = 'custom-dropdown-item';
            item.dataset.value = l;
            item.textContent = `Bài ${l}`;
            list.appendChild(item);
        });

        initCustomDropdown(lessonDropdown, (val) => {
            activeLesson = val;
            currentPage = 1;
            applyFilters();
        });
    }

    // Status dropdown
    if (statusDropdown) {
        initCustomDropdown(statusDropdown, (val) => {
            activeStatus = val;
            currentPage = 1;
            applyFilters();
        });
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(() => {
            searchQuery = searchInput.value.trim().toLowerCase();
            currentPage = 1;
            applyFilters();
        }, 250));
    }

    // --- Filter & Render ---
    function applyFilters() {
        filteredVocab = allVocab.filter(v => {
            if (activeLevel !== 'all' && v.level !== activeLevel) return false;
            if (activeLesson !== 'all' && String(v.lesson) !== activeLesson) return false;
            if (activeStatus !== 'all' && v.status !== activeStatus) return false;
            if (searchQuery) {
                const q = searchQuery;
                return (v.japanese || '').toLowerCase().includes(q)
                    || (v.hiragana || '').toLowerCase().includes(q)
                    || (v.meaning || '').toLowerCase().includes(q);
            }
            return true;
        });

        renderTable();
        renderPagination();
        renderSummary();
    }

    function renderTable() {
        if (!tableBody) return;

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = filteredVocab.slice(start, start + ITEMS_PER_PAGE);

        if (pageItems.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-[#5f6b7a]">Không tìm thấy từ vựng nào.</td></tr>`;
            return;
        }

        tableBody.innerHTML = pageItems.map((v, i) => {
            const statusInfo = utils.getStatusInfo(v.status);
            const isDifficult = v.is_difficult;
            const starFill = isDifficult ? "font-variation-settings: 'FILL' 1;" : '';
            const starColor = isDifficult ? 'text-[#f0a868]' : 'text-[#5f6b7a]';
            const wordType = getWordType(v);
            const typeColor = getTypeColor(wordType);

            return `
                <tr class="border-t border-gray-50" data-id="${v.id}">
                    <td class="px-5 py-3 text-[#5f6b7a]">${start + i + 1}</td>
                    <td class="px-5 py-3 font-bold font-['Noto_Sans_JP'] text-base">${utils.escapeHtml(v.japanese)}</td>
                    <td class="px-5 py-3 font-['Noto_Sans_JP'] text-[#5f6b7a]">${utils.escapeHtml(v.hiragana || '')}</td>
                    <td class="px-5 py-3">${utils.escapeHtml(v.meaning)}</td>
                    <td class="px-5 py-3"><span class="text-xs ${typeColor} px-2 py-0.5 rounded-full">${utils.escapeHtml(wordType)}</span></td>
                    <td class="px-5 py-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <span class="w-2 h-2 rounded-full" style="background: ${statusInfo.color}"></span>
                            <span class="text-xs" style="color: ${statusInfo.color}">${statusInfo.text}</span>
                        </div>
                    </td>
                    <td class="px-5 py-3 text-center">
                        <div class="flex items-center justify-center gap-1">
                            <button class="p-1 hover:bg-[#f0f7f6] rounded btn-toggle-difficult" data-id="${v.id}" title="Đánh dấu khó">
                                <span class="material-symbols-outlined text-lg ${starColor}" style="${starFill}">star</span>
                            </button>
                            <button class="p-1 hover:bg-[#f0f7f6] rounded btn-tts" data-text="${utils.escapeHtml(v.japanese)}" title="Phát âm">
                                <span class="material-symbols-outlined text-lg text-[#5f6b7a]">volume_up</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind events
        tableBody.querySelectorAll('.btn-tts').forEach(btn => {
            btn.addEventListener('click', () => tts.speak(btn.dataset.text));
        });

        tableBody.querySelectorAll('.btn-toggle-difficult').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                try {
                    const vocab = allVocab.find(v => v.id === id);
                    if (vocab) {
                        vocab.is_difficult = !vocab.is_difficult;
                        await api.updateVocabulary(vocab);
                        applyFilters();
                    }
                } catch (e) {
                    console.error('Toggle difficult failed:', e);
                }
            });
        });
    }

    function renderPagination() {
        if (!paginationEl) return;

        const totalPages = Math.ceil(filteredVocab.length / ITEMS_PER_PAGE);
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let html = '';
        html += `<button class="px-3 py-1.5 rounded-lg border border-gray-200 text-[#5f6b7a] hover:bg-gray-50 ${currentPage === 1 ? 'opacity-40 pointer-events-none' : ''}" data-page="${currentPage - 1}">← Trước</button>`;

        const pages = getPaginationRange(currentPage, totalPages);
        pages.forEach(p => {
            if (p === '...') {
                html += `<span class="px-3 py-1.5 text-[#5f6b7a]">...</span>`;
            } else {
                const active = p === currentPage ? 'bg-[#6caba0] text-white' : 'border border-gray-200 text-[#5f6b7a] hover:bg-gray-50';
                html += `<button class="px-3 py-1.5 rounded-lg ${active}" data-page="${p}">${p}</button>`;
            }
        });

        html += `<button class="px-3 py-1.5 rounded-lg border border-gray-200 text-[#5f6b7a] hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-40 pointer-events-none' : ''}" data-page="${currentPage + 1}">Tiếp →</button>`;

        paginationEl.innerHTML = html;

        paginationEl.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.dataset.page);
                renderTable();
                renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    function renderSummary() {
        if (!summaryEl) return;
        const mastered = filteredVocab.filter(v => v.status === 'mastered').length;
        const learning = filteredVocab.filter(v => v.status === 'learning').length;
        const notLearned = filteredVocab.filter(v => v.status === 'not-learned').length;
        summaryEl.innerHTML = `
            ${filteredVocab.length} từ |
            <span class="text-[#4caf50]">Đã thuộc: ${mastered}</span> |
            <span class="text-[#f0a868]">Đang học: ${learning}</span> |
            Chưa học: ${notLearned}
        `;
    }

    // --- Helpers ---
    function getWordType(vocab) {
        if (vocab.word_type) return vocab.word_type;
        // Auto-detect based on Japanese text
        const jp = vocab.japanese || '';
        if (/[いう]$/.test(jp)) return 'Tính từ';
        if (/[るすくむぐぬぶつ]$/.test(jp)) return 'Động từ';
        return 'Danh từ';
    }

    function getTypeColor(type) {
        if (type.includes('Động từ')) return 'bg-[#e3f2fd] text-[#42a5f5]';
        if (type.includes('Tính từ')) return 'bg-[#fff3e0] text-[#f0a868]';
        return 'bg-[#f0f7f6] text-[#6caba0]';
    }

    function getPaginationRange(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages = [];
        if (current <= 3) {
            pages.push(1, 2, 3, 4, '...', total);
        } else if (current >= total - 2) {
            pages.push(1, '...', total - 3, total - 2, total - 1, total);
        } else {
            pages.push(1, '...', current - 1, current, current + 1, '...', total);
        }
        return pages;
    }

    // Initial render
    applyFilters();
    auth.updateSidebarUser();
});
