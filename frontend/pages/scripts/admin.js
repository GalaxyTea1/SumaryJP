// ============================================
// Admin Panel Logic — Sumary Japanese
// CRUD: Vocab, Grammar, Kanji
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // --- State ---
    let activeTab = 'vocab';
    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const pageSize = 15;
    let editingId = null;
    let deletingId = null;

    // --- Tab Configs ---
    const TAB_CONFIG = {
        vocab: {
            label: 'Từ Vựng',
            columns: ['ID', 'Tiếng Nhật', 'Hiragana', 'Nghĩa', 'Loại', 'Level', 'Bài', ''],
            fields: [
                { name: 'japanese', label: 'Tiếng Nhật', type: 'text', required: true },
                { name: 'hiragana', label: 'Hiragana', type: 'text', required: true },
                { name: 'meaning', label: 'Nghĩa (Tiếng Việt)', type: 'text', required: true },
                { name: 'type', label: 'Loại từ', type: 'select', options: ['Danh từ', 'Động từ', 'Tính từ -i', 'Tính từ -na', 'Phó từ', 'Trợ từ', 'Liên từ', 'Khác'] },
                { name: 'level', label: 'Level', type: 'select', options: ['N5', 'N4', 'N3', 'N2', 'N1'] },
                { name: 'lesson', label: 'Bài', type: 'number' },
                { name: 'example', label: 'Ví dụ', type: 'textarea' },
            ],
            fetchAll: () => api.getAllVocabulary(),
            save: (data) => api.saveVocabulary(data),
            update: (id, data) => api.updateVocabulary({ ...data, id }),
            delete: (id) => api.deleteVocabulary(id),
            renderRow: (item) => `
                <td>${item.id}</td>
                <td class="font-['Noto_Sans_JP'] font-bold">${esc(item.japanese)}</td>
                <td class="text-[#5f6b7a]">${esc(item.hiragana)}</td>
                <td>${esc(item.meaning)}</td>
                <td><span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full">${esc(item.type || '')}</span></td>
                <td><span class="text-xs px-2 py-0.5 bg-[#f0f7f6] text-[#6caba0] rounded-full font-semibold">${item.level || ''}</span></td>
                <td>${item.lesson || ''}</td>
            `,
        },
        grammar: {
            label: 'Ngữ Pháp',
            columns: ['ID', 'Mẫu câu', 'Nghĩa', 'Level', 'Bài', 'Sách', ''],
            fields: [
                { name: 'pattern', label: 'Mẫu câu', type: 'text', required: true },
                { name: 'meaning', label: 'Nghĩa', type: 'text', required: true },
                { name: 'explanation', label: 'Giải thích', type: 'textarea' },
                { name: 'example_ja', label: 'Ví dụ (日本語)', type: 'text' },
                { name: 'example_vi', label: 'Ví dụ (Tiếng Việt)', type: 'text' },
                { name: 'level', label: 'Level', type: 'select', options: ['N5', 'N4', 'N3', 'N2', 'N1'] },
                { name: 'lesson', label: 'Bài', type: 'number' },
                { name: 'textbook', label: 'Sách giáo khoa', type: 'text' },
                { name: 'notes', label: 'Ghi chú', type: 'textarea' },
            ],
            fetchAll: () => api.getAllGrammar(),
            save: (data) => api.saveGrammar(data),
            update: (id, data) => api.updateGrammar(id, data),
            delete: (id) => api.deleteGrammar(id),
            renderRow: (item) => `
                <td>${item.id}</td>
                <td class="font-['Noto_Sans_JP'] font-bold">${esc(item.pattern)}</td>
                <td>${esc(item.meaning)}</td>
                <td><span class="text-xs px-2 py-0.5 bg-[#f0f7f6] text-[#6caba0] rounded-full font-semibold">${item.level || ''}</span></td>
                <td>${item.lesson || ''}</td>
                <td class="text-xs text-[#5f6b7a]">${esc(item.textbook || '')}</td>
            `,
        },
        kanji: {
            label: 'Kanji',
            columns: ['ID', 'Kanji', 'Nghĩa', 'On', 'Kun', 'Nét', 'Level', 'Bài', ''],
            fields: [
                { name: 'character', label: 'Kanji', type: 'text', required: true },
                { name: 'meaning', label: 'Nghĩa', type: 'text', required: true },
                { name: 'onyomi', label: 'On\'yomi', type: 'text' },
                { name: 'kunyomi', label: 'Kun\'yomi', type: 'text' },
                { name: 'stroke_count', label: 'Số nét', type: 'number' },
                { name: 'radical', label: 'Bộ thủ', type: 'text' },
                { name: 'example_words', label: 'Từ ví dụ (phân cách bằng 、)', type: 'textarea' },
                { name: 'level', label: 'Level', type: 'select', options: ['N5', 'N4', 'N3', 'N2', 'N1'] },
                { name: 'lesson', label: 'Bài', type: 'number' },
            ],
            fetchAll: () => api.getAllKanji(),
            save: (data) => api.saveKanji(data),
            update: (id, data) => api.updateKanji(id, data),
            delete: (id) => api.deleteKanji(id),
            renderRow: (item) => `
                <td>${item.id}</td>
                <td class="font-['Noto_Sans_JP'] text-2xl font-bold">${esc(item.character)}</td>
                <td>${esc(item.meaning)}</td>
                <td class="text-sm text-[#5f6b7a] font-['Noto_Sans_JP']">${esc(item.onyomi || '')}</td>
                <td class="text-sm text-[#5f6b7a] font-['Noto_Sans_JP']">${esc(item.kunyomi || '')}</td>
                <td>${item.stroke_count || ''}</td>
                <td><span class="text-xs px-2 py-0.5 bg-[#f0f7f6] text-[#6caba0] rounded-full font-semibold">${item.level || ''}</span></td>
                <td>${item.lesson || ''}</td>
            `,
        },
    };

    function esc(str) { return utils.escapeHtml(str); }

    // --- DOM ---
    const loginPrompt = document.getElementById('admin-login-prompt');
    const adminContent = document.getElementById('admin-content');
    const authStatus = document.getElementById('admin-auth-status');
    const thead = document.getElementById('admin-thead');
    const tbody = document.getElementById('admin-tbody');
    const searchInput = document.getElementById('admin-search');
    const countEl = document.getElementById('admin-count');
    const tabs = document.querySelectorAll('.admin-tab');
    const addBtn = document.getElementById('admin-add-btn');

    const modalOverlay = document.getElementById('admin-modal-overlay');
    const modalTitle = document.getElementById('admin-modal-title');
    const formFields = document.getElementById('admin-form-fields');
    const form = document.getElementById('admin-form');
    const formError = document.getElementById('admin-form-error');
    const modalClose = document.getElementById('admin-modal-close');
    const formCancel = document.getElementById('admin-form-cancel');

    const deleteOverlay = document.getElementById('admin-delete-overlay');
    const deleteMsg = document.getElementById('admin-delete-msg');
    const deleteConfirm = document.getElementById('admin-delete-confirm');
    const deleteCancel = document.getElementById('admin-delete-cancel');

    const prevPageBtn = document.getElementById('admin-prev-page');
    const nextPageBtn = document.getElementById('admin-next-page');
    const pageInfo = document.getElementById('admin-page-info');

    // --- Auth check ---
    if (!auth.isLoggedIn()) {
        loginPrompt.classList.remove('hidden');
        adminContent.classList.add('hidden');
        document.getElementById('admin-login-btn').addEventListener('click', () => {
            if (typeof authModal !== 'undefined') authModal.showLogin();
        });
        // Re-check after login
        const observer = new MutationObserver(() => {
            if (auth.isLoggedIn()) {
                observer.disconnect();
                if (auth.isAdmin()) {
                    loginPrompt.classList.add('hidden');
                    adminContent.classList.remove('hidden');
                    init();
                } else {
                    document.querySelector('#admin-login-prompt h3').textContent = 'Không có quyền truy cập';
                    document.querySelector('#admin-login-prompt p').textContent = 'Tài khoản của bạn không phải Admin.';
                    document.getElementById('admin-login-btn').style.display = 'none';
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    } else if (!auth.isAdmin()) {
        loginPrompt.classList.remove('hidden');
        adminContent.classList.add('hidden');
        document.querySelector('#admin-login-prompt .text-5xl').textContent = '🚫';
        document.querySelector('#admin-login-prompt h3').textContent = 'Không có quyền truy cập';
        document.querySelector('#admin-login-prompt p').textContent = 'Tài khoản của bạn không phải Admin.';
        document.getElementById('admin-login-btn').style.display = 'none';
    } else {
        loginPrompt.classList.add('hidden');
        adminContent.classList.remove('hidden');
        init();
    }

    async function init() {
        authStatus.textContent = `Đang đăng nhập`;
        await loadData();
        renderTable();
    }

    // --- Tabs ---
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTab = tab.dataset.tab;
            currentPage = 1;
            searchInput.value = '';
            await loadData();
            renderTable();
        });
    });

    // --- Load data ---
    async function loadData() {
        const config = TAB_CONFIG[activeTab];
        try {
            allData = await config.fetchAll();
        } catch (e) {
            console.error('Admin loadData error:', e);
            allData = [];
        }
        applySearch();
    }

    function applySearch() {
        const q = (searchInput?.value || '').toLowerCase().trim();
        if (!q) {
            filteredData = [...allData];
        } else {
            filteredData = allData.filter(item => {
                return Object.values(item).some(v =>
                    v != null && String(v).toLowerCase().includes(q)
                );
            });
        }
        currentPage = 1;
    }

    searchInput?.addEventListener('input', utils.debounce(() => {
        applySearch();
        renderTable();
    }, 250));

    // --- Render Table ---
    function renderTable() {
        const config = TAB_CONFIG[activeTab];

        // Header
        thead.innerHTML = `<tr>${config.columns.map(c => `<th>${c}</th>`).join('')}</tr>`;

        // Paginate
        const total = filteredData.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * pageSize;
        const pageData = filteredData.slice(start, start + pageSize);

        // Body
        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${config.columns.length}" class="text-center py-8 text-[#5f6b7a]">Không có dữ liệu</td></tr>`;
        } else {
            tbody.innerHTML = pageData.map(item => `
                <tr data-id="${item.id}">
                    ${config.renderRow(item)}
                    <td class="actions">
                        <button class="btn-edit text-[#6caba0] hover:bg-[#f0f7f6] p-1.5 rounded-lg transition-all" title="Sửa">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button class="btn-delete text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-all ml-1" title="Xóa">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </td>
                </tr>
            `).join('');

            // Bind edit/delete
            tbody.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.closest('tr').dataset.id);
                    openEditModal(id);
                });
            });
            tbody.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.closest('tr').dataset.id);
                    openDeleteModal(id);
                });
            });
        }

        // Count & pagination
        countEl.textContent = `${total} mục`;
        pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    // Pagination
    prevPageBtn.addEventListener('click', () => { currentPage--; renderTable(); });
    nextPageBtn.addEventListener('click', () => { currentPage++; renderTable(); });

    // --- Add/Edit Modal ---
    addBtn.addEventListener('click', () => openAddModal());

    function openAddModal() {
        editingId = null;
        modalTitle.textContent = `Thêm ${TAB_CONFIG[activeTab].label}`;
        renderFormFields();
        formError.classList.add('hidden');
        modalOverlay.classList.add('show');
    }

    function openEditModal(id) {
        editingId = id;
        const item = allData.find(d => d.id === id);
        if (!item) return;

        modalTitle.textContent = `Sửa ${TAB_CONFIG[activeTab].label}`;
        renderFormFields(item);
        formError.classList.add('hidden');
        modalOverlay.classList.add('show');
    }

    function renderFormFields(data = {}) {
        const config = TAB_CONFIG[activeTab];
        formFields.innerHTML = config.fields.map(f => {
            const val = data[f.name] != null ? data[f.name] : '';

            if (f.type === 'textarea') {
                return `<div><label>${f.label}${f.required ? ' <span class="text-red-400">*</span>' : ''}</label>
                    <textarea name="${f.name}" rows="3" ${f.required ? 'required' : ''}>${esc(String(val))}</textarea></div>`;
            }
            if (f.type === 'select') {
                const opts = f.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
                return `<div><label>${f.label}</label>
                    <select name="${f.name}"><option value="">-- Chọn --</option>${opts}</select></div>`;
            }
            return `<div><label>${f.label}${f.required ? ' <span class="text-red-400">*</span>' : ''}</label>
                <input type="${f.type}" name="${f.name}" value="${esc(String(val))}" ${f.required ? 'required' : ''}/></div>`;
        }).join('');
    }

    function closeModal() {
        modalOverlay.classList.remove('show');
        editingId = null;
    }

    modalClose.addEventListener('click', closeModal);
    formCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    // --- Form submit ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formError.classList.add('hidden');

        const config = TAB_CONFIG[activeTab];
        const formData = {};

        config.fields.forEach(f => {
            const el = form.querySelector(`[name="${f.name}"]`);
            if (el) {
                let val = el.value.trim();
                if (f.type === 'number' && val) val = parseInt(val);
                formData[f.name] = val || null;
            }
        });

        try {
            if (editingId) {
                await config.update(editingId, formData);
            } else {
                await config.save(formData);
            }
            if (sessionCache) sessionCache.invalidate(sessionCache.KEYS[activeTab]);
            closeModal();
            await loadData();
            renderTable();
        } catch (err) {
            formError.classList.remove('hidden');
            formError.textContent = err.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
        }
    });

    // --- Delete Modal ---
    function openDeleteModal(id) {
        deletingId = id;
        const item = allData.find(d => d.id === id);
        const display = item?.japanese || item?.pattern || item?.character || `#${id}`;
        deleteMsg.textContent = `Bạn có chắc muốn xóa "${display}"?`;
        deleteOverlay.classList.add('show');
    }

    deleteCancel.addEventListener('click', () => { deleteOverlay.classList.remove('show'); deletingId = null; });
    deleteOverlay.addEventListener('click', (e) => { if (e.target === deleteOverlay) { deleteOverlay.classList.remove('show'); deletingId = null; } });

    deleteConfirm.addEventListener('click', async () => {
        if (!deletingId) return;
        const config = TAB_CONFIG[activeTab];
        try {
            await config.delete(deletingId);
            if (sessionCache) sessionCache.invalidate(sessionCache.KEYS[activeTab]);
            deleteOverlay.classList.remove('show');
            deletingId = null;
            await loadData();
            renderTable();
        } catch (err) {
            alert('Xóa thất bại: ' + (err.message || 'Lỗi'));
        }
    });

    // ESC close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            deleteOverlay.classList.remove('show');
            deletingId = null;
        }
    });

    auth.updateSidebarUser();
});
