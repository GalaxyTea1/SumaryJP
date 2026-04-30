import { state } from "../state.js";
import { utils } from "./utils.js";

import { EVENTS } from "../state.js";

export const adminTable = {
    selectedIds: new Set(),

    init() {
        state.subscribe(EVENTS.LESSON_CHANGED, async (currentLesson) => {
            if (currentLesson) {
                await this.render(currentLesson.lesson, currentLesson.level);
            }
        });
        state.subscribe(EVENTS.VOCAB_UPDATED, async (payload) => {
            if (payload && payload.action === "inline_update") {
                return;
            }
            if (state.currentLesson) {
                await this.render(state.currentLesson.lesson, state.currentLesson.level);
            }
        });
    },

    renderSkeleton(rowCount = 5) {
        const tbody = document.getElementById("vocab-list");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        for(let i=0; i<rowCount; i++) {
            const row = document.createElement("tr");
            row.className = "animate-pulse";
            row.innerHTML = `
                <td class="px-4 py-4"><div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4"></div></td>
                <td class="px-3 py-4"><div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                <td class="px-3 py-4"><div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                <td class="px-3 py-4"><div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                <td class="px-4 py-4 text-right"><div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 ml-auto"></div></td>
            `;
            tbody.appendChild(row);
        }
    },

    async render(lesson, level) {
        const titleEl = document.getElementById("current-lesson-title");
        if (titleEl) {
            titleEl.textContent = `Từ vựng Bài ${lesson} - ${level}`;
        }

        const tbody = document.getElementById("vocab-list");
        if (!tbody) return;

        this.renderSkeleton(5);
        this.selectedIds.clear();
        this.updateBulkDeleteUI();

        // Brief delay for skeleton
        await new Promise(resolve => setTimeout(resolve, 200));

        const allVocabularies = state.getVocabularyByLesson(level, lesson);
        tbody.innerHTML = "";

        if (allVocabularies.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-8 py-6 text-center text-slate-400 dark:text-slate-500">Không có dữ liệu từ vựng cho bài học này.</td></tr>`;
            return;
        }

        allVocabularies.forEach((vocab) => {
            const row = document.createElement("tr");
            row.className = "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group";
            
            row.innerHTML = `
                <td class="px-4 py-4 text-center">
                    <input type="checkbox" class="vocab-cb rounded text-primary focus:ring-primary bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 size-4 cursor-pointer align-middle outline-none" data-id="${vocab.id}">
                </td>
                <td class="px-3 py-4 font-bold text-sm text-slate-800 dark:text-slate-100">${utils.escapeHtml(vocab.japanese)}</td>
                <td class="px-3 py-4 text-sm text-slate-600 dark:text-slate-400">${utils.escapeHtml(vocab.hiragana || "")}</td>
                <td class="px-3 py-4 text-sm text-slate-700 dark:text-slate-300">${utils.escapeHtml(vocab.meaning)}</td>
                <td class="px-4 py-4 text-right flex justify-end gap-2">
                    <button class="edit-btn text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1" title="Sửa" data-id="${vocab.id}">
                        <span class="material-symbols-outlined text-sm">edit</span> Sửa
                    </button>
                    <button class="delete-btn text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1" title="Xóa" data-id="${vocab.id}">
                        <span class="material-symbols-outlined text-sm">delete</span> Xóa
                    </button>
                </td>
            `;

            // Checkbox logic
            const cb = row.querySelector(".vocab-cb");
            cb.addEventListener("change", (e) => {
                if (e.target.checked) {
                    this.selectedIds.add(vocab.id);
                    row.classList.add("bg-primary/5", "dark:bg-primary/10");
                } else {
                    this.selectedIds.delete(vocab.id);
                    row.classList.remove("bg-primary/5", "dark:bg-primary/10");
                }
                this.updateBulkDeleteUI();
            });

            // Delete logic
            const delBtn = row.querySelector(".delete-btn");
            delBtn.addEventListener("click", async () => {
                if (confirm(`Bạn có chắc muốn xóa từ "${vocab.japanese}" không?`)) {
                    await state.removeVocabulary(vocab.id);
                }
            });

            // Edit logic (simple prompt for now to avoid building complex modals)
            const editBtn = row.querySelector(".edit-btn");
            editBtn.addEventListener("click", async () => {
                const newJp = prompt("Từ tiếng Nhật:", vocab.japanese);
                if (newJp === null) return;
                const newHg = prompt("Hiragana:", vocab.hiragana);
                if (newHg === null) return;
                const newMn = prompt("Nghĩa VN:", vocab.meaning);
                if (newMn === null) return;
                
                if (newJp.trim() && newMn.trim()) {
                    await state.editVocabulary(vocab.id, {
                        japanese: newJp.trim(),
                        hiragana: newHg.trim(),
                        meaning: newMn.trim()
                    });
                }
            });

            tbody.appendChild(row);
        });

        this.initSelectAll();
        this.initSearch();
    },

    updateBulkDeleteUI() {
        const countSpan = document.getElementById("selected-count");
        const bulkBtn = document.getElementById("bulk-delete-btn");
        const selectAllCb = document.getElementById("select-all-cb");
        const allCbs = document.querySelectorAll(".vocab-cb");

        if (countSpan && bulkBtn) {
            countSpan.textContent = this.selectedIds.size;
            if (this.selectedIds.size > 0) {
                bulkBtn.classList.remove("hidden");
                bulkBtn.classList.add("flex");
            } else {
                bulkBtn.classList.add("hidden");
                bulkBtn.classList.remove("flex");
            }
        }
        
        if (selectAllCb && allCbs.length > 0) {
            selectAllCb.checked = this.selectedIds.size === allCbs.length && allCbs.length > 0;
        }
    },

    initSelectAll() {
        const selectAllCb = document.getElementById("select-all-cb");
        const bulkBtn = document.getElementById("bulk-delete-btn");

        if (selectAllCb) {
            // Remove old listeners by replacing node
            const newSelectAll = selectAllCb.cloneNode(true);
            selectAllCb.parentNode.replaceChild(newSelectAll, selectAllCb);
            
            newSelectAll.addEventListener("change", (e) => {
                const allCbs = document.querySelectorAll(".vocab-cb");
                const isChecked = e.target.checked;
                
                allCbs.forEach(cb => {
                    cb.checked = isChecked;
                    const id = cb.getAttribute("data-id");
                    const row = cb.closest("tr");
                    if (isChecked) {
                        this.selectedIds.add(id);
                        row.classList.add("bg-primary/5", "dark:bg-primary/10");
                    } else {
                        this.selectedIds.delete(id);
                        row.classList.remove("bg-primary/5", "dark:bg-primary/10");
                    }
                });
                this.updateBulkDeleteUI();
            });
        }

        if (bulkBtn && !bulkBtn.dataset.initialized) {
            bulkBtn.dataset.initialized = "true";
            bulkBtn.addEventListener("click", async () => {
                if (this.selectedIds.size === 0) return;
                if (confirm(`Bạn có chắc muốn xóa ${this.selectedIds.size} từ đã chọn không?`)) {
                    bulkBtn.disabled = true;
                    bulkBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Đang xóa...';
                    
                    const deletePromises = Array.from(this.selectedIds).map(id => state.removeVocabulary(id));
                    await Promise.all(deletePromises);
                    
                    this.selectedIds.clear();
                    
                    bulkBtn.disabled = false;
                    bulkBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span> Xóa (<span id="selected-count">0</span>)';
                    this.updateBulkDeleteUI();
                }
            });
        }
    },

    initSearch() {
        const searchInput = document.getElementById("admin-search-input");
        if (searchInput && !searchInput.dataset.initialized) {
            searchInput.dataset.initialized = "true";
            searchInput.addEventListener("input", (e) => {
                const term = e.target.value.toLowerCase();
                const rows = document.querySelectorAll("#vocab-list tr:not(.animate-pulse)");
                
                rows.forEach(row => {
                    if(row.children.length > 1) { // Not empty message
                        const jp = row.children[1].textContent.toLowerCase();
                        const hg = row.children[2].textContent.toLowerCase();
                        const mn = row.children[3].textContent.toLowerCase();
                        
                        if (jp.includes(term) || hg.includes(term) || mn.includes(term)) {
                            row.style.display = "";
                        } else {
                            row.style.display = "none";
                        }
                    }
                });
            });
        }
    }
};
