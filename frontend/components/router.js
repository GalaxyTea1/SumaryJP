import { viewManager } from "./viewManager.js";

export const router = {
    init() {
        window.addEventListener("popstate", () => {
            this.handleRoute();
        });
        
        // Handle initial route
        this.handleRoute();
    },

    navigate(viewName, params = {}, replace = false) {
        const urlParams = new URLSearchParams();
        urlParams.set("view", viewName);
        for (const [key, value] of Object.entries(params)) {
            urlParams.set(key, value);
        }
        
        const newUrl = `?${urlParams.toString()}`;
        
        if (replace) {
            window.history.replaceState({ view: viewName, params }, "", newUrl);
        } else {
            window.history.pushState({ view: viewName, params }, "", newUrl);
        }
        
        this.handleRoute();
    },

    back() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewName = urlParams.get("view");
        
        if (viewName && viewName !== "home") {
            // Revert back to home
            this.navigate("home");
        } else {
            // Normally go back in history
            window.history.back();
        }
    },

    handleRoute() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewName = urlParams.get("view") || "home";
        
        const params = {};
        for (const [key, value] of urlParams.entries()) {
            if (key !== "view") {
                params[key] = value;
            }
        }

        if (viewName === "home") {
            viewManager.back(); 
        } else {
            viewManager.show(viewName, params);
        }
    }
};
