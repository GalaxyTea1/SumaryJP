import { state } from "../state.js";

export const ui = {
    updateLessonSidebar() {
        const sidebar = document.getElementById("lesson-sidebar");
        const existingList = sidebar.querySelector(".level-list");
        if (existingList) existingList.remove();

        const levelList = document.createElement("div");
        levelList.className = "level-list";

        const sortedLevels = Object.entries(state.lessons).sort(([levelA], [levelB]) => levelB.localeCompare(levelA));

        sortedLevels.forEach(([level, lessons]) => {
            const levelItem = document.createElement("div");
            levelItem.className = "level-item";

            const totalWords = Object.values(lessons).reduce((sum, lesson) => sum + lesson.length, 0);

            levelItem.innerHTML = `
                <div class="level-header">
                    <div class="level-header-title">
                        <span class="level-name">${level}</span>
                        <span class="level-count-total">(${totalWords} từ)</span>
                    </div>
                    <span class="level-toggle">▼</span>
                </div>
            `;

            const lessonContainer = document.createElement("div");
            lessonContainer.className = "lesson-grid";
            lessonContainer.style.display = "none";

            Object.keys(lessons).sort((a, b) => Number(a) - Number(b)).forEach((lesson) => {
                const lessonItem = document.createElement("div");
                lessonItem.className = "lesson-grid-item";
                lessonItem.innerHTML = `
                    <span class="lesson-grid-name">${lesson}</span>
                    <span class="lesson-grid-count">${lessons[lesson].length}</span>
                `;
                lessonItem.title = `Bài ${lesson}`; // Tooltip that says "Bài X"
                lessonItem.addEventListener("click", () => {
                    this.displayVocabulary(lesson, level);
                    document.querySelectorAll('.lesson-grid-item').forEach(el => el.classList.remove('active'));
                    lessonItem.classList.add('active');
                });
                lessonContainer.appendChild(lessonItem);
            });

            const header = levelItem.querySelector(".level-header");
            header.addEventListener("click", () => {
                document.querySelectorAll('.lesson-grid').forEach(container => {
                    if (container !== lessonContainer) {
                        container.style.display = "none";
                        container.previousElementSibling.querySelector('.level-toggle').textContent = "▼";
                    }
                });

                const isHidden = lessonContainer.style.display === "none";
                lessonContainer.style.display = isHidden ? "grid" : "none";
                header.querySelector(".level-toggle").textContent = isHidden ? "▲" : "▼";
            });

            levelItem.appendChild(lessonContainer);
            levelList.appendChild(levelItem);
        });

        sidebar.appendChild(levelList);
    },

    async displayVocabulary(lesson, level) {
        try {
            state.currentLesson = { lesson, level };
            document.getElementById("current-lesson-title").textContent = `Bài ${lesson} - ${level}`;
            const allVocabularies = state.getVocabularyByLesson(level, lesson);
            const tbody = document.getElementById("vocab-list");
            const selectAllCb = document.getElementById("select-all-cb");
            const bulkDeleteBtn = document.getElementById("bulk-delete-btn");
            const adminSearchInput = document.getElementById("admin-search-input");
            const isAdmin = document.body.dataset.isAdmin === "true";

            // Support Search
            let currentVocabs = [...allVocabularies];

            const renderTable = () => {
                tbody.innerHTML = "";
                let selectedIds = new Set();

                const updateBulkDeleteUI = () => {
                    if (!bulkDeleteBtn) return;
                    if (selectedIds.size > 0) {
                        bulkDeleteBtn.style.display = "inline-block";
                        bulkDeleteBtn.querySelector("#selected-count").textContent = selectedIds.size;
                    } else {
                        bulkDeleteBtn.style.display = "none";
                    }
                    if (selectAllCb) {
                        selectAllCb.checked = currentVocabs.length > 0 && selectedIds.size === currentVocabs.length;
                    }
                };

                updateBulkDeleteUI();

                if (selectAllCb) {
                    // Remove old listeners to prevent duplication on re-render
                    const newCb = selectAllCb.cloneNode(true);
                    selectAllCb.parentNode.replaceChild(newCb, selectAllCb);
                    newCb.addEventListener("change", (e) => {
                        const isChecked = e.target.checked;
                        document.querySelectorAll('.vocab-checkbox').forEach(cb => {
                            cb.checked = isChecked;
                        });
                        if (isChecked) {
                            selectedIds = new Set(currentVocabs.map(v => v.id));
                        } else {
                            selectedIds.clear();
                        }
                        updateBulkDeleteUI();
                    });
                }

                if (bulkDeleteBtn) {
                    const newBtn = bulkDeleteBtn.cloneNode(true);
                    bulkDeleteBtn.parentNode.replaceChild(newBtn, bulkDeleteBtn);
                    newBtn.addEventListener("click", async () => {
                        if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} từ đã chọn?`)) {
                            newBtn.disabled = true;
                            newBtn.textContent = "Đang xóa...";
                            for (let id of selectedIds) {
                                await state.removeVocabulary(id); // Wait for deletions
                            }
                            if (window.updateAdminStats) window.updateAdminStats();
                            this.displayVocabulary(lesson, level);
                            this.updateLessonSidebar();
                        }
                    });
                }

                currentVocabs.forEach((vocab) => {
                    const row = document.createElement("tr");
                    row.setAttribute("data-vocab-id", vocab.id);
                    if (!isAdmin) {
                        row.className = `status-${vocab.status}`;
                    }

                    let adminCheckbox = "";
                    let actionColumn = "";
                    if (isAdmin) {
                        adminCheckbox = `<td style="text-align: center;"><input type="checkbox" class="vocab-checkbox" value="${vocab.id}" style="transform: scale(1.2); cursor: pointer;"></td>`;
                        actionColumn = `
                        <td>
                            <button class="edit-btn">Sửa</button>
                            <button class="delete-btn">Xóa</button>
                        </td>
                        `;
                    }

                    let statusAndDifficultyColumn = "";
                    if (!isAdmin) {
                        statusAndDifficultyColumn = `
                        <td>
                            <select class="status-select">
                                <option value="not-learned" ${vocab.status === "not-learned" ? "selected" : ""}>Chưa học</option>
                                <option value="learning" ${vocab.status === "learning" ? "selected" : ""}>Đang học</option>
                                <option value="mastered" ${vocab.status === "mastered" ? "selected" : ""}>Đã thuộc</option>
                            </select>
                        </td>
                        <td>
                            <button class="difficulty-btn ${vocab.is_difficult ? "difficult" : ""}">${vocab.is_difficult ? "★" : "☆"}</button>
                        </td>
                        `;
                    }

                    row.innerHTML = `
                        ${adminCheckbox}
                        <td>${vocab.japanese}</td>
                        <td class="hiragana-text">${vocab.hiragana}</td>
                        <td>${vocab.meaning}</td>
                        <td>${vocab.type}</td>
                        ${statusAndDifficultyColumn}
                        ${actionColumn}
                    `;

                    // Checkbox listener logic
                    const cb = row.querySelector(".vocab-checkbox");
                    if (cb) {
                        cb.addEventListener("change", (e) => {
                            if (e.target.checked) selectedIds.add(vocab.id);
                            else selectedIds.delete(vocab.id);
                            updateBulkDeleteUI();
                        });
                    }

                    if (!isAdmin) {
                        row.querySelector(".status-select").addEventListener("change", async (e) => {
                            await state.updateVocabularyStatus(vocab.id, e.target.value);
                            row.className = `status-${e.target.value}`;
                        });

                        row.querySelector(".difficulty-btn").addEventListener("click", async () => {
                            const isDifficult = await state.toggleDifficulty(vocab.id);
                            if (isDifficult !== null) {
                                const starButton = row.querySelector(".difficulty-btn");
                                starButton.textContent = isDifficult ? "★" : "☆";
                                starButton.classList.toggle("difficult", isDifficult);
                            }
                        });
                    }

                    if (isAdmin) {
                        row.querySelector(".edit-btn").addEventListener("click", () => this.editVocabulary(vocab.id));

                        row.querySelector(".delete-btn").addEventListener("click", async () => {
                            if (confirm("Bạn có chắc muốn xóa từ này?")) {
                                const info = await state.removeVocabulary(vocab.id);
                                if (info) {
                                    if (window.updateAdminStats) window.updateAdminStats();
                                    this.displayVocabulary(info.lesson, info.level);
                                    this.updateLessonSidebar();
                                }
                            }
                        });
                    }

                    tbody.appendChild(row);
                });
            };

            // Setup Search Listener
            if (adminSearchInput) {
                // Remove old event listener to prevent multiple bindings if clicked multiple times
                const newSearch = adminSearchInput.cloneNode(true);
                adminSearchInput.parentNode.replaceChild(newSearch, adminSearchInput);

                newSearch.addEventListener("input", (e) => {
                    const q = e.target.value.toLowerCase();
                    currentVocabs = allVocabularies.filter(v =>
                        v.japanese.toLowerCase().includes(q) ||
                        v.hiragana.toLowerCase().includes(q) ||
                        v.meaning.toLowerCase().includes(q)
                    );
                    renderTable();
                });

                // Clear existing search when changing lessons
                newSearch.value = "";
            }

            renderTable();

        } catch (error) {
            console.error("Error displaying vocabulary:", error);
            alert("Có lỗi khi hiển thị từ vựng.");
        }
    },

    async editVocabulary(id) {
        try {
            const vocab = await state.getVocabularyById(id);
            if (!vocab) return;

            const editForm = document.createElement("div");
            editForm.className = "edit-form-modal";
            editForm.innerHTML = `
    < div class="modal-content" >
                    <h3>Sửa từ vựng</h3>
                    <form id="edit-vocab-form">
                        <input type="text" id="edit-japanese" value="${vocab.japanese}" placeholder="Kanji" required>
                        <input type="text" id="edit-hiragana" value="${vocab.hiragana}" placeholder="Hiragana" required>
                        <input type="text" id="edit-meaning" value="${vocab.meaning}" placeholder="Nghĩa tiếng Việt" required>
                        <select id="edit-type">
                            <option value="Danh từ" ${vocab.type === "Danh từ" ? "selected" : ""}>Danh từ</option>
                            <option value="Động từ" ${vocab.type === "Động từ" ? "selected" : ""}>Động từ</option>
                            <option value="Tính từ" ${vocab.type === "Tính từ" ? "selected" : ""}>Tính từ</option>
                        </select>
                        <div class="modal-buttons">
                            <button type="submit" id="save-edit">Lưu</button>
                            <button type="button" id="cancel-edit">Hủy</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(editForm);

            editForm.querySelector("#save-edit").addEventListener("click", async (e) => {
                e.preventDefault();
                await state.editVocabulary(id, {
                    japanese: document.getElementById("edit-japanese").value,
                    hiragana: document.getElementById("edit-hiragana").value,
                    meaning: document.getElementById("edit-meaning").value,
                    type: document.getElementById("edit-type").value,
                });
                editForm.remove();
                await this.displayVocabulary(vocab.lesson, vocab.level);
            });
            editForm.querySelector("#cancel-edit").addEventListener("click", () => editForm.remove());
        } catch (error) {
            console.error("Error editing vocabulary:", error);
            alert("Có lỗi khi sửa từ vựng.");
        }
    }
};
