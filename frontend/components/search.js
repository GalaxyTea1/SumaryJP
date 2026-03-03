import { state } from "../state.js";

export const search = {
    init() {
        this.searchInput = document.getElementById("global-search-input");
        this.dropdown = document.getElementById("search-results-dropdown");
        this.detailModal = document.getElementById("word-detail-modal");
        this.closeDetailBtn = document.getElementById("close-detail-modal");
        
        if (!this.searchInput || !this.dropdown || !this.detailModal) return;

        // Hide dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!this.searchInput.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.dropdown.style.display = "none";
            }
        });

        // Search logic on input
        this.searchInput.addEventListener("input", (e) => this.handleSearch(e.target.value));

        // Enter key logic
        this.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.handleSearch(e.target.value);
            }
        });

        // Close details modal
        this.closeDetailBtn.addEventListener("click", () => {
            this.detailModal.style.display = "none";
        });
        this.detailModal.addEventListener("click", (e) => {
            if (e.target === this.detailModal) {
                this.detailModal.style.display = "none";
            }
        });
    },

    handleSearch(query) {
        query = query.trim().toLowerCase();
        if (query === "") {
            this.dropdown.style.display = "none";
            this.dropdown.innerHTML = "";
            return;
        }

        // Get all vocabularies
        const allVocabs = [];
        Object.entries(state.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lessonName, vocabList]) => {
                vocabList.forEach(vocab => {
                    allVocabs.push({ ...vocab, level_info: level, lesson_info: lessonName });
                });
            });
        });

        // Filter occurrences
        const results = allVocabs.filter(vocab => {
            return vocab.japanese.toLowerCase().includes(query) ||
                   vocab.hiragana.toLowerCase().includes(query) ||
                   vocab.meaning.toLowerCase().includes(query) ||
                   vocab.type.toLowerCase().includes(query);
        });

        // Limit results to 15 to keep dropdown manageable
        const limitedResults = results.slice(0, 15);
        this.renderDropdown(limitedResults);
    },

    renderDropdown(results) {
        this.dropdown.innerHTML = "";

        if (results.length === 0) {
            this.dropdown.innerHTML = `<li style="text-align: center; color: var(--text-color); opacity: 0.7;">Không tìm thấy.</li>`;
            this.dropdown.style.display = "block";
            return;
        }

        results.forEach(vocab => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div>
                    <div class="search-match-jp">${vocab.japanese} ${vocab.hiragana !== vocab.japanese ? `(${vocab.hiragana})` : ''}</div>
                    <div class="search-match-vi">${vocab.meaning}</div>
                </div>
                <div style="font-size: 0.8em; opacity: 0.6;">${vocab.level_info} - Bài ${vocab.lesson_info}</div>
            `;
            li.addEventListener("click", () => {
                this.searchInput.value = "";
                this.dropdown.style.display = "none";
                this.showWordDetail(vocab);
            });
            this.dropdown.appendChild(li);
        });

        this.dropdown.style.display = "block";
    },

    showWordDetail(vocab) {
        document.getElementById("detail-japanese").textContent = vocab.japanese;
        document.getElementById("detail-hiragana").textContent = vocab.hiragana;
        document.getElementById("detail-meaning").textContent = vocab.meaning;
        document.getElementById("detail-type").textContent = vocab.type;
        document.getElementById("detail-lesson").textContent = `${vocab.level_info} - Bài ${vocab.lesson_info}`;
        
        // Since we don't have "example" in current backend, statically show or hide it
        const exampleText = vocab.example ? vocab.example : "Hiện chưa có ví dụ cho từ này.";
        let exampleEl = document.getElementById("detail-example");
        if (exampleEl) {
            exampleEl.textContent = exampleText;
        }

        this.detailModal.style.display = "flex";
    }
};
