import { state } from "./state.js";
import { ui } from "./components/ui.js";
import { adminTable } from "./components/adminTable.js";
import { utils } from "./components/utils.js";

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
const BASE_URL = isLocalhost ? 'http://localhost:3000/api' : 'https://jp-backend-api.onrender.com/api';
const AUTH_URL = `${BASE_URL}/auth`;
const ADMIN_TOKEN_KEY = "sumary_jp_admin_token";

window.onload = function () {
    const loginSection = document.getElementById("login-section");
    const adminContent = document.getElementById("admin-content");
    const usernameInput = document.getElementById("admin-username");
    const passwordInput = document.getElementById("admin-password");
    const loginBtn = document.getElementById("admin-login-btn");
    const logoutBtn = document.getElementById("admin-logout-btn");
    const errorMsg = document.getElementById("login-error");

    // Kiểm tra token đã lưu
    const savedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (savedToken) {
        verifyAdminToken(savedToken).then(isValid => {
            if (isValid) {
                loginSection.classList.add("hidden");
                showAdminContent();
            } else {
                sessionStorage.removeItem(ADMIN_TOKEN_KEY);
                loginSection.classList.remove("hidden");
            }
        });
    } else {
        loginSection.classList.remove("hidden");
    }

    loginBtn.addEventListener("click", async () => {
        const user = usernameInput.value.trim();
        const pass = passwordInput.value.trim();

        if (!user || !pass) {
            errorMsg.textContent = "Vui lòng nhập đầy đủ thông tin.";
            errorMsg.classList.remove("hidden");
            return;
        }

        // Disable button khi đang xử lý
        loginBtn.disabled = true;
        loginBtn.textContent = "Đang xác thực...";

        try {
            const response = await fetch(`${AUTH_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });

            const data = await response.json();

            if (!response.ok) {
                errorMsg.textContent = data.error || "Sai tên đăng nhập hoặc mật khẩu.";
                errorMsg.classList.remove("hidden");
                return;
            }

            // Kiểm tra role admin
            if (data.user.role !== 'admin') {
                errorMsg.textContent = "Tài khoản không có quyền Admin.";
                errorMsg.classList.remove("hidden");
                return;
            }

            // Lưu token và hiển thị admin content
            sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
            errorMsg.classList.add("hidden");
            loginSection.classList.add("hidden");
            showAdminContent();

        } catch (error) {
            console.error("Admin login error:", error);
            errorMsg.textContent = "Không thể kết nối đến máy chủ.";
            errorMsg.classList.remove("hidden");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Đăng nhập";
        }
    });

    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        adminContent.classList.add("hidden");
        loginSection.classList.remove("hidden");
        usernameInput.value = "";
        passwordInput.value = "";
    });

    passwordInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            loginBtn.click();
        }
    });
};

async function verifyAdminToken(token) {
    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data.user && data.user.role === 'admin';
    } catch {
        return false;
    }
}

async function showAdminContent() {
    document.getElementById("admin-content").classList.remove("hidden");
    document.body.classList.add('admin-view');

    try {
        adminTable.init();
        await state.loadFromServer();
        ui.initSidebar();
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

                if (!lesson) return utils.showToast("Vui lòng nhập Bài học trước khi tải CSV!", "warning");
                if (!csvData) return utils.showToast("Vui lòng nhập nội dung CSV!", "warning");

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

                utils.showToast(`Đã nhập thành công ${successCount} từ vựng!`, "success");
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
    ui.initSidebar();
    updateAdminStats();
    state.setCurrentLesson(lesson, level);
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
