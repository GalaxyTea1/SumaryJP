import { state } from "./state.js";
import { ui } from "./components/ui.js";

window.onload = function () {
    const loginSection = document.getElementById("login-section");
    const adminContent = document.getElementById("admin-content");
    const usernameInput = document.getElementById("admin-username");
    const passwordInput = document.getElementById("admin-password");
    const loginBtn = document.getElementById("admin-login-btn");
    const logoutBtn = document.getElementById("admin-logout-btn");
    const errorMsg = document.getElementById("login-error");

    // Check if already logged in via sessionStorage
    if (sessionStorage.getItem("adminLoggedIn") === "true") {
        loginSection.style.display = "none";
        showAdminContent();
    } else {
        loginSection.style.display = "flex";
    }

    loginBtn.addEventListener("click", () => {
        const user = usernameInput.value.trim();
        const pass = passwordInput.value.trim();

        if (user === "admin" && pass === "1") {
            sessionStorage.setItem("adminLoggedIn", "true");
            errorMsg.style.display = "none";
            loginSection.style.display = "none";
            showAdminContent();
        } else {
            errorMsg.style.display = "block";
        }
    });

    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("adminLoggedIn");
        adminContent.style.display = "none";
        loginSection.style.display = "flex";
        usernameInput.value = "";
        passwordInput.value = "";
    });

    passwordInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            loginBtn.click();
        }
    });

    // Dark mode logic
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    if (darkModeToggle) {
        if (localStorage.getItem("theme") === "dark") {
            document.body.classList.add("dark-mode");
        }
        darkModeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
        });
    }
};

async function showAdminContent() {
    document.getElementById("admin-content").style.display = "flex";
    document.body.classList.add('admin-view');

    try {
        await state.loadFromServer();
        ui.updateLessonSidebar();
        updateAdminStats();

        const vocabForm = document.getElementById("vocab-form");
        if (vocabForm) {
            vocabForm.addEventListener("submit", async function (e) {
                e.preventDefault();
                const lesson = document.getElementById("lesson-input").value;
                if (!lesson) return;

                const vocab = {
                    japanese: document.getElementById("japanese-input").value,
                    hiragana: document.getElementById("hiragana-input").value,
                    meaning: document.getElementById("meaning-input").value,
                    type: document.getElementById("type-select").value,
                };
                const level = document.getElementById("level-select").value;

                await state.addVocabulary(lesson, level, vocab);
                refreshUI(lesson, level);

                // Reset inputs but keep lesson and level
                document.getElementById("japanese-input").value = "";
                document.getElementById("hiragana-input").value = "";
                document.getElementById("meaning-input").value = "";
            });
        }

        const importCsvBtn = document.getElementById("import-csv-btn");
        if (importCsvBtn) {
            importCsvBtn.addEventListener("click", async () => {
                const lesson = document.getElementById("lesson-input").value;
                const level = document.getElementById("level-select").value;
                const csvData = document.getElementById("csv-input").value.trim();

                if (!lesson) return alert("Vui lòng nhập Bài học trước khi tải CSV!");
                if (!csvData) return alert("Vui lòng nhập nội dung CSV!");

                const lines = csvData.split("\n");
                let successCount = 0;

                importCsvBtn.textContent = "Đang xử lý...";
                importCsvBtn.disabled = true;

                for (let line of lines) {
                    const row = line.split(",").map(t => t.trim());
                    if (row.length >= 3) {
                        const vocab = {
                            japanese: row[0],
                            hiragana: row[1] || "",
                            meaning: row[2],
                            type: row[3] || "Danh từ"
                        };
                        try {
                            await state.addVocabulary(lesson, level, vocab);
                            successCount++;
                        } catch (e) {
                            console.error("Error inserting vocab row", e);
                        }
                    }
                }

                alert(`Đã nhập thành công ${successCount} từ vựng!`);
                document.getElementById("csv-input").value = "";
                importCsvBtn.textContent = "Thêm CSV";
                importCsvBtn.disabled = false;

                refreshUI(lesson, level);
            });
        }
    } catch (error) {
        console.error("Initialization error:", error);
    }
}

function refreshUI(lesson, level) {
    ui.updateLessonSidebar();
    updateAdminStats();
    if (state.currentLesson && state.currentLesson.lesson === lesson && state.currentLesson.level === level) {
        ui.displayVocabulary(lesson, level);
    }
}

window.updateAdminStats = function () {
    let total = 0, n5 = 0, n4 = 0;
    let lessonSet = new Set();

    Object.entries(state.lessons).forEach(([level, lessonsObj]) => {
        Object.entries(lessonsObj).forEach(([lessonName, words]) => {
            lessonSet.add(`${level}-${lessonName}`);
            total += words.length;
            if (level === "N5") n5 += words.length;
            if (level === "N4") n4 += words.length;
        });
    });

    const elTotal = document.getElementById("dash-total");
    if (elTotal) elTotal.textContent = total;

    const elLessons = document.getElementById("dash-lessons");
    if (elLessons) elLessons.textContent = lessonSet.size;

    const elN5 = document.getElementById("dash-n5");
    if (elN5) elN5.textContent = n5;

    const elN4 = document.getElementById("dash-n4");
    if (elN4) elN4.textContent = n4;
};
