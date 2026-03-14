import { state } from "../state.js";
import { vocabTable } from "./vocabTable.js";

export const search = {
    init() {
        const searchInput = document.getElementById("global-search-input");
        const resultsDropdown = document.getElementById("search-results-dropdown");
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

                // Show loading state
                ocrIcon.classList.add("hidden");
                ocrSpinner.classList.remove("hidden");
                searchInput.placeholder = "Đang phân tích hình ảnh...";
                searchInput.disabled = true;

                try {
                    // Create object url for the image
                    const imageUrl = URL.createObjectURL(file);
                    
                    // Run Tesseract
                    const result = await Tesseract.recognize(
                        imageUrl,
                        'jpn+eng', // Japanese and English language
                        { logger: m => console.log("OCR Progress:", m) }
                    );

                    // Clean up text (remove new lines, keeping it readable)
                    let extText = result.data.text.replace(/[\r\n]+/g, ' ').trim();

                    // Put into search logic
                    searchInput.value = extText;
                    
                    // Trigger input event to search immediately
                    const inputEvent = new Event('input', { bubbles: true });
                    searchInput.dispatchEvent(inputEvent);

                    // Revoke object url
                    URL.revokeObjectURL(imageUrl);

                } catch (error) {
                    console.error("OCR Error:", error);
                    alert("Có lỗi xảy ra khi quét ảnh. Vui lòng thử lại.");
                } finally {
                    // Restore state
                    ocrIcon.classList.remove("hidden");
                    ocrSpinner.classList.add("hidden");
                    searchInput.placeholder = "Tìm kiếm từ vựng (Kanji, Kana, Tiếng Việt...)";
                    searchInput.disabled = false;
                    searchInput.focus();
                    ocrFileInput.value = ""; // Reset file input
                }
            });
        }

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            resultsDropdown.innerHTML = "";

            if (query.length === 0) {
                resultsDropdown.classList.add("hidden");
                // Reset to current lesson view
                if(state.currentLesson) {
                    vocabTable.render(state.currentLesson.lesson, state.currentLesson.level);
                }
                return;
            }


            const results = state.vocabulary.filter(v =>
                v.japanese.toLowerCase().includes(query) ||
                v.hiragana.toLowerCase().includes(query) ||
                v.meaning.toLowerCase().includes(query)
            );

            if (results.length > 0) {
                resultsDropdown.classList.remove("hidden");
                results.slice(0, 5).forEach((vocab) => {
                    const li = document.createElement("li");
                    li.className = "px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex justify-between items-center";
                    li.innerHTML = `
                        <div>
                            <span class="font-bold text-slate-800 dark:text-white block">${vocab.japanese}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400">${vocab.hiragana} - ${vocab.meaning}</span>
                        </div>
                        <span class="text-[10px] text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">Bài ${vocab.lesson}</span>
                    `;
                    
                    li.addEventListener("click", () => {

                        searchInput.value = "";
                        resultsDropdown.classList.add("hidden");

                        // Try to activate the correct sidebar button
                        const sidebarItems = document.querySelectorAll('#lesson-sidebar .lesson-nav-active, #lesson-sidebar button');
                        let targetLessonBtn = Array.from(sidebarItems).find(btn => btn.textContent === `Bài ${vocab.lesson}` && btn.closest('.flex-col').previousElementSibling.textContent.includes(vocab.level));
                        
                        if(targetLessonBtn){
                            targetLessonBtn.click();
                        } else {
                           vocabTable.render(vocab.lesson, vocab.level);
                        }
                    });
                    
                    resultsDropdown.appendChild(li);
                });
            } else {
                resultsDropdown.classList.remove("hidden");
                const noResultLi = document.createElement("li");
                noResultLi.className = "px-4 py-3 text-sm text-slate-500 dark:text-slate-400";
                noResultLi.textContent = `Không tìm thấy "${query}"`;
                resultsDropdown.appendChild(noResultLi);
            }

            // Live-filter the main table as well
            this.renderSearchResultsTable(results);
        });


        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
                resultsDropdown.classList.add("hidden");
            }
        });
    },

    renderSearchResultsTable(results) {
        const titleEl = document.getElementById("current-lesson-title");
        if (titleEl) {
            titleEl.textContent = `Kết quả tìm kiếm (${results.length})`;
        }
        
        const tbody = document.getElementById("vocab-list");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        
        if(results.length === 0) {
             tbody.innerHTML = `<tr><td colspan="6" class="px-8 py-6 text-center text-slate-400 dark:text-slate-500">Không tìm thấy từ vựng nào.</td></tr>`;
             return;
        }

        // Simplified read-only row for search results
        results.forEach((vocab) => {
            const row = document.createElement("tr");
            row.className = "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-colors group";

            
            row.innerHTML = `
                <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">${vocab.japanese.charAt(0) || "あ"}</div>
                        <div class="font-bold text-lg text-slate-900 dark:text-white">${vocab.japanese} <span class="text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full ml-2">Bài ${vocab.lesson}-${vocab.level}</span></div>
                    </div>
                </td>
                <td class="px-8 py-6 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">${vocab.hiragana}</td>
                <td class="px-8 py-6">
                    <div class="text-sm font-semibold text-slate-700 dark:text-slate-300">${vocab.meaning}</div>
                </td>
                <td class="px-8 py-6">
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg uppercase tracking-wider">${vocab.type || "Từ vựng"}</span>
                </td>
                <td class="px-8 py-6 text-center whitespace-nowrap">
                   <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">View Only</span>
                </td>
                <td class="px-8 py-6 text-right whitespace-nowrap">
                   <div class="flex justify-end gap-0.5"><span class="material-symbols-outlined text-[18px] text-slate-200 dark:text-slate-600">star</span></div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
};
