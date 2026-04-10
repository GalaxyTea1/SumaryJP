import { state } from "../state.js";

export const stats = {
    progressChart: null,
    eventsBound: false,

    show() {
        const overlay = document.getElementById("stats-overlay");
        const modal = document.getElementById("stats-modal-content");
        
        overlay.classList.remove("hidden");
        setTimeout(() => {
            overlay.classList.remove("opacity-0");
            modal.classList.remove("scale-95", "opacity-0");
            modal.classList.add("scale-100", "opacity-100");
        }, 10);

        this.update();
        this.bindEvents();
    },

    close() {
        const overlay = document.getElementById("stats-overlay");
        const modal = document.getElementById("stats-modal-content");
        
        overlay.classList.add("opacity-0");
        modal.classList.remove("scale-100", "opacity-100");
        modal.classList.add("scale-95", "opacity-0");
        
        setTimeout(() => overlay.classList.add("hidden"), 300);
    },

    bindEvents() {
        if (this.eventsBound) return;
        
        const closeBtn = document.getElementById("close-stats-btn");
        if (closeBtn) closeBtn.addEventListener("click", () => this.close());

        const overlay = document.getElementById("stats-overlay");
        if (overlay) {
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) this.close();
            });
        }
        
        this.eventsBound = true;
    },

    update() {
        let mastered = 0, learning = 0, notLearned = 0;

        for (const word of state.vocabulary) {
            switch (word.status) {
                case "mastered": mastered++; break;
                case "in-progress":
                case "learning": learning++; break;
                case "not-learned": notLearned++; break;
            }
        }
        
        const totalWords = mastered + learning + notLearned;
        
        document.getElementById("stats-total-words").textContent = totalWords;
        document.getElementById("stats-mastered-words").textContent = mastered;
        document.getElementById("stats-learning-words").textContent = learning;
        document.getElementById("stats-not-learned-words").textContent = notLearned;
        
        this.drawProgressChart(mastered, learning, notLearned);
    },

    drawProgressChart(mastered, learning, notLearned) {
        if (typeof Chart === "undefined") return;
        
        const canvas = document.getElementById("learning-progress-chart");
        if (!canvas) return;
        
        if (this.progressChart) this.progressChart.destroy();
        
        const isDark = document.documentElement.classList.contains('dark');

        this.progressChart = new Chart(canvas.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: ["Đã thuộc", "Đang học", "Chưa học"],
                datasets: [{
                    data: [mastered, learning, notLearned],
                    backgroundColor: ["#10b981", "#f59e0b", "#0ea5e9"],
                    borderWidth: isDark ? 2 : 0,
                    borderColor: isDark ? '#1e293b' : '#ffffff',
                    hoverOffset: 4
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { 
                    legend: { 
                        position: "bottom",
                        labels: {
                            font: { family: "'Inter', sans-serif", weight: 600 },
                            color: isDark ? '#94a3b8' : '#64748b'
                        }
                    } 
                },
            },
        });
    }
};
