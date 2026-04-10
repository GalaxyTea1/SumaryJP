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

window.onload = async function () {
    try {
        await state.loadFromServer();

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
