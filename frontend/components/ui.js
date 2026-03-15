import { state } from "../state.js";
import { vocabTable } from "./vocabTable.js";
import { dashboardStats } from "./dashboardStats.js";

export const ui = {
    initSidebar() {
        const sidebar = document.getElementById("lesson-sidebar");
        if (!sidebar) return;


        const navContainer = sidebar.querySelector("#lesson-nav-container");
        if (navContainer) {
            navContainer.innerHTML = "";
        }

        const sortedLevels = Object.entries(state.lessons).sort(([levelA], [levelB]) => levelB.localeCompare(levelA));

        const levelListFragment = document.createDocumentFragment();

        sortedLevels.forEach(([level, lessons]) => {
            const levelWrapper = document.createElement("div");
            levelWrapper.className = "flex flex-col gap-2 w-full px-4 mb-2";


            const levelBtn = document.createElement("button");
            levelBtn.className = "flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-bold border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-xl transition-all shadow-sm focus:outline-none";
            levelBtn.innerHTML = `<span>${level}</span><span class="text-sm material-symbols-outlined transition-transform duration-300 transform text-slate-400 dark:text-slate-500">expand_more</span>`;
            
            const lessonContainer = document.createElement("div");
            lessonContainer.className = "grid grid-cols-2 gap-2 w-full pt-1 overflow-hidden transition-all duration-300";
            lessonContainer.style.maxHeight = "0px"; 


            Object.keys(lessons).sort((a, b) => Number(a) - Number(b)).forEach((lesson) => {
                const lessonBtn = document.createElement("button");
                lessonBtn.className = "text-center px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:border-indigo-200 dark:hover:border-indigo-700 rounded-lg border border-slate-100 dark:border-slate-700/50 transition-colors w-full focus:outline-none";
                lessonBtn.textContent = `Bài ${lesson}`;
                
                lessonBtn.addEventListener("click", async () => {

                    document.querySelectorAll('.lesson-nav-active').forEach(el => {
                        el.classList.remove('lesson-nav-active', 'bg-indigo-500', 'text-white', 'border-indigo-600', 'shadow-md', 'dark:bg-indigo-600', 'dark:border-indigo-500');
                        el.classList.add('text-slate-500', 'border-slate-100', 'dark:text-slate-400', 'dark:border-slate-700/50');
                    });
                    lessonBtn.classList.remove('text-slate-500', 'border-slate-100', 'dark:text-slate-400', 'dark:border-slate-700/50', 'hover:text-indigo-600', 'hover:bg-indigo-50', 'dark:hover:text-indigo-400', 'dark:hover:bg-indigo-900/40');
                    lessonBtn.classList.add('lesson-nav-active', 'bg-indigo-500', 'text-white', 'border-indigo-600', 'shadow-md', 'dark:bg-indigo-600', 'dark:border-indigo-500');
                    

                    if (document.body.dataset.isAdmin) {
                        const { adminTable } = await import("./adminTable.js");
                        adminTable.renderSkeleton();
                        await adminTable.render(lesson, level);
                        if (window.updateAdminStats) window.updateAdminStats();
                    } else {
                        vocabTable.renderSkeleton();
                        const { dashboardStats } = await import("./dashboardStats.js");
                        dashboardStats.renderSkeleton();
                        await vocabTable.render(lesson, level);
                        dashboardStats.updateStats();
                    }
                });
                lessonContainer.appendChild(lessonBtn);
            });

            levelBtn.addEventListener("click", () => {
                const icon = levelBtn.querySelector('.material-symbols-outlined');
                const isExpanded = lessonContainer.style.maxHeight !== "0px";
                
                // Collapse all other levels (accordion behavior)
                document.querySelectorAll('.lesson-container').forEach(c => {
                    c.style.maxHeight = "0px";
                    c.previousElementSibling.querySelector('.material-symbols-outlined').style.transform = "rotate(0deg)";
                });

                if (!isExpanded) {
                    lessonContainer.style.maxHeight = lessonContainer.scrollHeight + "px";
                    icon.style.transform = "rotate(180deg)";
                }
            });

            lessonContainer.classList.add('lesson-container');
            levelWrapper.appendChild(levelBtn);
            levelWrapper.appendChild(lessonContainer);
            levelListFragment.appendChild(levelWrapper);
        });

        if (navContainer) {
            navContainer.appendChild(levelListFragment);
            
            // Auto-expand the first level
            const firstLevelWrapper = navContainer.querySelector('.flex-col');
            if(firstLevelWrapper) {
                const btn = firstLevelWrapper.querySelector('button');
                if(btn) btn.click();
                
                // Load the first lesson of that level
                setTimeout(() => {
                   const firstLesson = firstLevelWrapper.querySelector('.lesson-container button');
                   if(firstLesson) firstLesson.click(); 
                }, 100);
            }
        }


        this.initDarkMode();
    },

    initDarkMode() {
        const darkModeToggle = document.getElementById("dark-mode-toggle");
        if (!darkModeToggle) return;


        if (localStorage.getItem("theme") === "dark") {
            document.documentElement.classList.add("dark");
        }

        darkModeToggle.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark");
            

            
            if (document.documentElement.classList.contains("dark")) {
                localStorage.setItem("theme", "dark");
                darkModeToggle.querySelector('span').textContent = "light_mode";
            } else {
                localStorage.setItem("theme", "light");
                darkModeToggle.querySelector('span').textContent = "dark_mode";
            }
        });
    }
};
