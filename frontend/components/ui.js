import { state } from "../state.js";

export const ui = {
    updateLessonSidebar() {
        const sidebar = document.getElementById("lesson-sidebar");
        const existingContent = sidebar.querySelector("h2").nextElementSibling;
        if (existingContent) existingContent.remove();

        const levelList = document.createElement("div");
        levelList.className = "level-list";

        Object.entries(state.lessons).forEach(([level, lessons]) => {
            const levelItem = document.createElement("div");
            levelItem.className = "level-item";

            const totalWords = Object.values(lessons).reduce((sum, lesson) => sum + lesson.length, 0);

            levelItem.innerHTML = `
                <div class="level-header">
                    <span class="level-name">${level} -</span>
                    <span class="level-count">${totalWords}</span>
                </div>
            `;

            const lessonContainer = document.createElement("div");
            lessonContainer.className = "lesson-container";
            lessonContainer.style.display = "none";

            Object.keys(lessons).forEach((lesson) => {
                const lessonItem = document.createElement("div");
                lessonItem.className = "lesson-item";
                lessonItem.innerHTML = `
                    <span class="lesson-name">Bài ${lesson}</span>
                    <span class="lesson-count">${lessons[lesson].length}</span>
                `;
                lessonItem.addEventListener("click", () => this.displayVocabulary(lesson, level));
                lessonContainer.appendChild(lessonItem);
            });

            levelItem.querySelector(".level-header").addEventListener("click", () => {
                const isHidden = lessonContainer.style.display === "none";
                lessonContainer.style.display = isHidden ? "block" : "none";
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
            const vocabularies = state.getVocabularyByLesson(level, lesson);
            const tbody = document.getElementById("vocab-list");
            tbody.innerHTML = "";
            
            vocabularies.forEach((vocab) => {
                const row = document.createElement("tr");
                row.setAttribute("data-vocab-id", vocab.id);
                row.className = `status-${vocab.status}`;
                row.innerHTML = `
                      <td>${vocab.japanese}</td>
                      <td class="hiragana-text">${vocab.hiragana}</td>
                      <td>${vocab.meaning}</td>
                      <td>${vocab.type}</td>
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
                      <td>
                          <button class="edit-btn">Sửa</button>
                          <button class="delete-btn">Xóa</button>
                      </td>
                  `;
                  
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
                
                row.querySelector(".edit-btn").addEventListener("click", () => this.editVocabulary(vocab.id));
                
                row.querySelector(".delete-btn").addEventListener("click", async () => {
                    if (confirm("Bạn có chắc muốn xóa từ này?")) {
                        const info = await state.removeVocabulary(vocab.id);
                        if (info) {
                            this.displayVocabulary(info.lesson, info.level);
                            this.updateLessonSidebar();
                        }
                    }
                });
                
                tbody.appendChild(row);
            });
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
                <div class="modal-content">
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
