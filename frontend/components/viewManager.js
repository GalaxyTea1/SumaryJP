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

        if (currentView === viewName) {
            // Already showing this view, just re-init with new params
            view.init(params);
            return;
        }

        const container = document.getElementById(`view-${viewName}`);
        if (!container) return;

        let elementToHide = document.getElementById("dashboard-content");
        if (currentView) {
            const oldView = views[currentView];
            if (oldView && oldView.destroy) oldView.destroy();
            elementToHide = document.getElementById(`view-${currentView}`);
        }

        if (elementToHide) {
            elementToHide.style.opacity = "0";
            elementToHide.style.transition = "opacity 0.2s ease";
            
            setTimeout(() => {
                elementToHide.classList.add("hidden");
                
                container.classList.remove("hidden");
                requestAnimationFrame(() => {
                    container.style.opacity = "1";
                    container.style.transition = "opacity 0.2s ease";
                });
                
                currentView = viewName;
                view.init(params);
            }, 200);
        } else {
            // fallback
            container.classList.remove("hidden");
            container.style.opacity = "1";
            currentView = viewName;
            view.init(params);
        }
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
