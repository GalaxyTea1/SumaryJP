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
    document.body.classList.add('admin-view'); // layout fix class if required

    try {
        await state.loadFromServer();
        ui.updateLessonSidebar();

        const vocabForm = document.getElementById("vocab-form");
        if (vocabForm) {
            vocabForm.addEventListener("submit", function (e) {
                e.preventDefault();
                const lesson = prompt("Thêm vào bài học số (ví dụ: 1, 2, 3...):");
                if (!lesson) return;

                const vocab = {
                    japanese: document.getElementById("japanese-input").value,
                    hiragana: document.getElementById("hiragana-input").value,
                    meaning: document.getElementById("meaning-input").value,
                    type: document.getElementById("type-select").value,
                };
                const level = document.getElementById("level-select").value;

                state.addVocabulary(lesson, level, vocab).then(() => {
                    ui.updateLessonSidebar();
                    // if currently viewing same lesson, refresh it
                    if (state.currentLesson && state.currentLesson.lesson === lesson && state.currentLesson.level === level) {
                        ui.displayVocabulary(lesson, level);
                    }
                });

                this.reset();
            });
        }
    } catch (error) {
        console.error("Initialization error:", error);
    }
}
