import { state } from "../state.js";

export const stats = {
    progressChart: null,

    show() {
        document.querySelector(".stats-overlay").style.display = "block";
        document.getElementById("statistics-container").style.display = "block";
        this.update();
    },

    close() {
        document.querySelector(".stats-overlay").style.display = "none";
        document.getElementById("statistics-container").style.display = "none";
    },

    update() {
        let totalWords = 0,
            mastered = 0,
            learning = 0,
            notLearned = 0;
        Object.values(state.lessons).forEach((level) => {
            Object.values(level).forEach((lesson) => {
                lesson.forEach((word) => {
                    totalWords++;
                    switch (word.status) {
                        case "mastered":
                            mastered++;
                            break;
                        case "in-progress":
                        case "learning":
                            learning++;
                            break;
                        case "not-learned":
                            notLearned++;
                            break;
                    }
                });
            });
        });
        document.getElementById("total-words").textContent = totalWords;
        document.getElementById("mastered-words").textContent = mastered;
        document.getElementById("learning-words").textContent = learning;
        document.getElementById("not-learned-words").textContent = notLearned;
        this.drawProgressChart(mastered, learning, notLearned);
    },

    drawProgressChart(mastered, learning, notLearned) {
        if (typeof Chart === "undefined") {
            console.warn("Chart.js not loaded.");
            return;
        }
        
        const canvas = document.getElementById("learning-progress");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        
        if (this.progressChart) this.progressChart.destroy();
        this.progressChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Đã thuộc", "Đang học", "Chưa học"],
                datasets: [
                    {
                        data: [mastered, learning, notLearned],
                        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
            },
        });
    }
};
