import { state } from "./state.js";
import { ui } from "./components/ui.js";
import { vocabTable } from "./components/vocabTable.js";
import { dashboardStats } from "./components/dashboardStats.js";
import { search } from "./components/search.js";
import { actions } from "./components/actions.js";
import { historyModal } from "./components/historyModal.js";
import { wordDetailsModal } from "./components/wordDetailsModal.js";
import { auth } from "./components/auth.js";
import { testConfigModal } from "./components/testConfigModal.js";
import { flashcardConfigModal } from "./components/flashcardConfigModal.js";
import { warmupBackend } from "./api.js";

const PARTIALS = [
    "partials/modal-stats.html",
    "partials/mobile-nav.html",
    "partials/modal-history.html",
    "partials/modal-overlays.html",
    "partials/modal-config.html",
    "partials/view-flashcard.html",
    "partials/view-review.html",
    "partials/view-test.html",
];

async function loadPartials() {
    const results = await Promise.all(
        PARTIALS.map(url => fetch(url).then(r => {
            if (!r.ok) throw new Error(`Không tải được partial: ${url} (${r.status})`);
            return r.text();
        }))
    );
    results.forEach(html => document.body.insertAdjacentHTML("beforeend", html));
}

window.onload = async function () {
    warmupBackend();

    try {
        await Promise.all([
            loadPartials(),
            state.loadFromServer(),
        ]);

        ui.initSidebar();
        dashboardStats.initGoalSetting();

        search.init();
        actions.init();
        historyModal.init();
        wordDetailsModal.init();
        auth.init();
        testConfigModal.init();
        flashcardConfigModal.init();

    } catch (error) {
        console.error("Initialization error:", error);
        alert("Có lỗi khi khởi tạo giao diện. Vui lòng tải lại trang.");
    }
};
