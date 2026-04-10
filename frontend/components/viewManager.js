import { flashcardView } from "./flashcard.js";
import { reviewView } from "./review.js";
import { testView } from "./test.js";

const views = {
    flashcard: flashcardView,
    review: reviewView,
    test: testView,
};

let currentView = null;

export const viewManager = {
    show(viewName, params = {}) {
        const view = views[viewName];
        if (!view) return;

        const dashboard = document.getElementById("dashboard-content");
        const container = document.getElementById(`view-${viewName}`);
        if (!dashboard || !container) return;

        dashboard.style.opacity = "0";
        dashboard.style.transition = "opacity 0.2s ease";

        setTimeout(() => {
            dashboard.classList.add("hidden");
            container.classList.remove("hidden");

            requestAnimationFrame(() => {
                container.style.opacity = "1";
                container.style.transition = "opacity 0.2s ease";
            });

            currentView = viewName;
            view.init(params);
        }, 200);
    },

    back() {
        if (!currentView) return;

        const container = document.getElementById(`view-${currentView}`);
        const dashboard = document.getElementById("dashboard-content");
        if (!container || !dashboard) return;

        const view = views[currentView];
        if (view && view.destroy) view.destroy();

        container.style.opacity = "0";

        setTimeout(() => {
            container.classList.add("hidden");
            dashboard.classList.remove("hidden");

            requestAnimationFrame(() => {
                dashboard.style.opacity = "1";
            });

            currentView = null;
        }, 200);
    }
};
