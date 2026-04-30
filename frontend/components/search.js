import { state } from "../state.js";
import { vocabTable } from "./vocabTable.js";
import { wordDetailsModal } from "./wordDetailsModal.js";
import { utils } from "./utils.js";

let _tesseractLoaded = false;
function _loadTesseract() {
    if (_tesseractLoaded || typeof Tesseract !== 'undefined') {
        _tesseractLoaded = true;
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = () => { _tesseractLoaded = true; resolve(); };
        script.onerror = () => reject(new Error('Không tải được Tesseract.js'));
        document.head.appendChild(script);
    });
}

export const search = {
    init() {
        const searchInput = document.getElementById("global-search-input");
        const mobileSearchInput = document.getElementById("global-search-input-mobile");
        const resultsDropdown = document.getElementById("search-results-dropdown");
        const mobileResultsDropdown = document.getElementById("search-results-dropdown-mobile");
        const ocrUploadBtn = document.getElementById("ocr-upload-btn");
        const ocrFileInput = document.getElementById("ocr-file-input");
        const ocrIcon = document.getElementById("ocr-icon");
        const ocrSpinner = document.getElementById("ocr-spinner");

        if (!searchInput || !resultsDropdown) return;

        if (ocrUploadBtn && ocrFileInput) {
            ocrUploadBtn.addEventListener("click", () => {
                ocrFileInput.click();
            });

            ocrFileInput.addEventListener("change", async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                ocrIcon.classList.add("hidden");
                ocrSpinner.classList.remove("hidden");
                searchInput.placeholder = "Đang phân tích hình ảnh...";
                searchInput.disabled = true;

                try {
                    await _loadTesseract();

                    const imageUrl = URL.createObjectURL(file);

                    const result = await Tesseract.recognize(
                        imageUrl,
                        'jpn+eng',
                        { logger: m => console.log("OCR Progress:", m) }
                    );

                    let extText = result.data.text.replace(/[\r\n]+/g, ' ').trim();

                    searchInput.value = extText;

                    const inputEvent = new Event('input', { bubbles: true });
                    searchInput.dispatchEvent(inputEvent);

                    URL.revokeObjectURL(imageUrl);

                } catch (error) {
                    console.error("OCR Error:", error);
                    utils.showToast("Có lỗi xảy ra khi quét ảnh. Vui lòng thử lại.", "error");
                } finally {
                    ocrIcon.classList.remove("hidden");
                    ocrSpinner.classList.add("hidden");
                    searchInput.placeholder = "Tìm kiếm từ vựng (Kanji, Kana, Tiếng Việt...)";
                    searchInput.disabled = false;
                    searchInput.focus();
                    ocrFileInput.value = "";
                }
            });
        }

        const performSearch = (query, dropdown, inputEl) => {
            dropdown.innerHTML = "";

            if (query.length === 0) {
                dropdown.classList.add("hidden");
                if (state.currentLesson) {
                    state.setCurrentLesson(state.currentLesson.lesson, state.currentLesson.level);
                }
                return;
            }

            const results = state.vocabulary.filter(v =>
                v.japanese.toLowerCase().includes(query) ||
                v.hiragana.toLowerCase().includes(query) ||
                v.meaning.toLowerCase().includes(query)
            );

            if (results.length > 0) {
                dropdown.classList.remove("hidden");
                results.slice(0, 5).forEach((vocab) => {
                    const li = document.createElement("li");
                    li.className = "px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex justify-between items-center";
                    li.innerHTML = `
                        <div>
                            <span class="font-bold text-slate-800 dark:text-white block">${utils.escapeHtml(vocab.japanese)}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400">${utils.escapeHtml(vocab.hiragana)} - ${utils.escapeHtml(vocab.meaning)}</span>
                        </div>
                        <span class="text-[10px] text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">Bài ${utils.escapeHtml(vocab.lesson)}</span>
                    `;

                    li.addEventListener("click", () => {
                        inputEl.value = "";
                        dropdown.classList.add("hidden");

                        const sidebarItems = document.querySelectorAll('#lesson-sidebar button, #mobile-lesson-nav-container button');
                        let targetBtns = Array.from(sidebarItems).filter(btn => {
                            if (btn.textContent.trim() !== `Bài ${vocab.lesson}`) return false;
                            const wrapper = btn.closest(".flex-col");
                            if (!wrapper) return false;
                            const levelSpan = wrapper.querySelector("button > span");
                            return levelSpan && levelSpan.textContent.trim() === vocab.level;
                        });

                        if (targetBtns.length > 0) {
                            targetBtns.forEach(btn => {
                                btn.click();
                                const wrapper = btn.closest(".flex-col");
                                const levelBtn = wrapper.querySelector("button");
                                const lessonContainer = btn.parentElement;
                                if (lessonContainer && (lessonContainer.style.maxHeight === "0px" || !lessonContainer.style.maxHeight)) {
                                    if (levelBtn) levelBtn.click();
                                }
                            });
                        } else {
                            state.setCurrentLesson(vocab.lesson, vocab.level);
                        }
                    });

                    dropdown.appendChild(li);
                });
            } else {
                dropdown.classList.remove("hidden");
                const noResultLi = document.createElement("li");
                noResultLi.className = "px-4 py-3 text-sm text-slate-500 dark:text-slate-400";
                noResultLi.textContent = `Không tìm thấy "${query}"`;
                dropdown.appendChild(noResultLi);
            }

            this.renderSearchResultsTable(results);
        };

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            performSearch(query, resultsDropdown, searchInput);
        });

        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
                resultsDropdown.classList.add("hidden");
            }
        });

        if (mobileSearchInput && mobileResultsDropdown) {
            mobileSearchInput.addEventListener("input", (e) => {
                const query = e.target.value.toLowerCase().trim();
                performSearch(query, mobileResultsDropdown, mobileSearchInput);
            });

            document.addEventListener("click", (e) => {
                if (!mobileSearchInput.contains(e.target) && !mobileResultsDropdown.contains(e.target)) {
                    mobileResultsDropdown.classList.add("hidden");
                }
            });
        }
    },

    renderSearchResultsTable(results) {
        const titleEl = document.getElementById("current-lesson-title");
        if (titleEl) titleEl.textContent = `Kết quả tìm kiếm (${results.length})`;
        
        const thStatus = document.getElementById("th-status");
        const thDifficulty = document.getElementById("th-difficulty");
        if (thStatus) {
            thStatus.textContent = "Loại từ";
            thStatus.classList.remove("text-center");
            thStatus.classList.add("text-left");
        }
        if (thDifficulty) thDifficulty.classList.add("hidden");

        const tbody = document.getElementById("vocab-list");
        const mobileList = document.getElementById("vocab-list-mobile");

        if (tbody) {
            tbody.innerHTML = "";
            if (results.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="px-8 py-6 text-center text-slate-400 dark:text-slate-500">Không tìm thấy từ vựng nào.</td></tr>`;
            } else {
                results.forEach((vocab) => {
                    const row = document.createElement("tr");
                    row.className = "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-colors group";
                    row.innerHTML = `
                        <td class="px-8 py-6">
                            <div class="flex items-center gap-4">
                                <div class="font-bold text-lg text-slate-900 dark:text-white">${utils.escapeHtml(vocab.japanese)}</div>
                            </div>
                        </td>
                        <td class="px-8 py-6 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">${utils.escapeHtml(vocab.hiragana)}</td>
                        <td class="px-8 py-6">
                            <div class="text-sm font-semibold text-slate-700 dark:text-slate-300">${utils.escapeHtml(vocab.meaning)}</div>
                        </td>
                        <td class="px-8 py-6">
                            <span class="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg uppercase tracking-wider">${utils.escapeHtml(vocab.type || "Từ vựng")}</span>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        }

        if (mobileList) {
            mobileList.innerHTML = "";
            if (results.length === 0) {
                mobileList.innerHTML = `<div class="text-center py-8 text-slate-400 dark:text-slate-500">Không tìm thấy từ vựng nào.</div>`;
            } else {
                results.forEach((vocab) => {
                    const card = document.createElement("div");
                    card.className = "bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm";
                    card.innerHTML = `
                        <div class="flex items-center gap-3 mb-2">
                            <div class="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg shrink-0">${utils.escapeHtml(vocab.japanese.charAt(0) || "あ")}</div>
                            <div class="min-w-0">
                                <div class="font-bold text-base text-slate-900 dark:text-white truncate">${utils.escapeHtml(vocab.japanese)}</div>
                                <span class="text-xs text-indigo-500 dark:text-indigo-400 font-medium">${utils.escapeHtml(vocab.hiragana)}</span>
                            </div>
                            <span class="ml-auto text-[9px] text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full shrink-0 font-bold">Bài ${utils.escapeHtml(vocab.lesson)}-${utils.escapeHtml(vocab.level)}</span>
                        </div>
                        <div class="text-sm text-slate-600 dark:text-slate-300 font-medium">${utils.escapeHtml(vocab.meaning)}</div>
                    `;
                    mobileList.appendChild(card);
                });
            }
        }
    }
};
