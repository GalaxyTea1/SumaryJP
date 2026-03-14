import { state } from "../state.js";

export const stats = {
    progressChart: null,

    async show() {
        const overlay = document.getElementById("stats-overlay");
        const modal = document.getElementById("stats-modal-content");
        

        await state.loadFromServer();
        
        overlay.classList.remove("hidden");
        // Delay for CSS transition
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
        
        setTimeout(() => {
            overlay.classList.add("hidden");
        }, 300);
    },

    eventsBound: false,

    bindEvents() {
        if (this.eventsBound) return;
        
        const closeBtn = document.getElementById("close-stats-btn");
        if(closeBtn) {
            closeBtn.addEventListener("click", () => this.close());
        }

        const overlay = document.getElementById("stats-overlay");
        if(overlay) {
            overlay.addEventListener("click", (e) => {
                if(e.target === document.getElementById("stats-overlay")) {
                    this.close();
                }
            });
        }
        
        this.eventsBound = true;
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
        
        document.getElementById("stats-total-words").textContent = totalWords;
        document.getElementById("stats-mastered-words").textContent = mastered;
        document.getElementById("stats-learning-words").textContent = learning;
        document.getElementById("stats-not-learned-words").textContent = notLearned;
        
        this.drawProgressChart(mastered, learning, notLearned);
    },

    drawProgressChart(mastered, learning, notLearned) {
        if (typeof Chart === "undefined") {
            console.warn("Chart.js not loaded.");
            return;
        }
        
        const canvas = document.getElementById("learning-progress-chart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        
        if (this.progressChart) this.progressChart.destroy();
        
        const isDark = document.documentElement.classList.contains('dark');
        const legendColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 vs slate-500

        this.progressChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Đã thuộc", "Đang học", "Chưa học"],
                datasets: [
                    {
                        data: [mastered, learning, notLearned],
                        backgroundColor: ["#10b981", "#f59e0b", "#0ea5e9"],
                        borderWidth: isDark ? 2 : 0,
                        borderColor: isDark ? '#1e293b' : '#ffffff',
                        hoverOffset: 4
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { 
                    legend: { 
                        position: "bottom",
                        labels: {
                            font: {
                                family: "'Inter', sans-serif",
                                weight: 600
                            },
                            color: legendColor
                        }
                    } 
                },
            },
        });
    }
};
