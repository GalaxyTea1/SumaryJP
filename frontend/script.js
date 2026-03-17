import { state } from "./state.js";
import { ui } from "./components/ui.js";
import { vocabTable } from "./components/vocabTable.js";
import { dashboardStats } from "./components/dashboardStats.js";
import { search } from "./components/search.js";
import { actions } from "./components/actions.js";
import { historyModal } from "./components/historyModal.js";
import { tts } from "./components/tts.js";
import { wordDetailsModal } from "./components/wordDetailsModal.js";
import { auth } from "./components/auth.js";
import { testConfigModal } from "./components/testConfigModal.js";

window.onload = async function () {
    try {
        // Render skeletons immediately
        vocabTable.renderSkeleton(10);
        dashboardStats.renderSkeleton();

        // Fetch initial data
        await state.loadFromServer();

        // Initialize UI
        ui.initSidebar();

        // Determine the default level & lesson to show initially
        let defaultLevel = "N5";
        let defaultLesson = "1";

        const sortedLevels = Object.keys(state.lessons).sort((a, b) => b.localeCompare(a));
        if (sortedLevels.length > 0) {
            defaultLevel = sortedLevels[sortedLevels.length - 1];
            const lessonsInLevel = Object.keys(state.lessons[defaultLevel]).sort((a, b) => Number(a) - Number(b));
            if (lessonsInLevel.length > 0) {
                defaultLesson = lessonsInLevel[0];
            }
        }

        // Render initial dashboard
        await vocabTable.render(defaultLesson, defaultLevel);
        dashboardStats.updateStats();
        dashboardStats.initGoalSetting();

        // Toggle Hiragana
        const toggleHiragana = document.getElementById("toggle-hiragana");
        const vocabSection = document.querySelector(".vocabulary-section");

        if (toggleHiragana && vocabSection) {
            // Restore saved preference
            const savedPref = localStorage.getItem("showHiragana");
            if (savedPref === "false") {
                toggleHiragana.checked = false;
                vocabSection.classList.add("hide-hiragana");
            }

            toggleHiragana.addEventListener("change", (e) => {
                if (e.target.checked) {
                    vocabSection.classList.remove("hide-hiragana");
                    localStorage.setItem("showHiragana", "true");
                } else {
                    vocabSection.classList.add("hide-hiragana");
                    localStorage.setItem("showHiragana", "false");
                }
            });
        }

        search.init();
        actions.init();
        historyModal.init();
        wordDetailsModal.init();
        auth.init();
        testConfigModal.init();

    } catch (error) {
        console.error("Initialization error for index.html:", error);
        alert("Có lỗi khi khởi tạo giao diện mới. Vui lòng tải lại trang.");
    }
};
