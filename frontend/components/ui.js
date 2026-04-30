import { state } from "../state.js";
import { vocabTable } from "./vocabTable.js";
import { dashboardStats } from "./dashboardStats.js";


function openMobileLessonSheet() {
    const overlay = document.getElementById("mobile-lesson-sheet-overlay");
    const sheet = document.getElementById("mobile-lesson-sheet");
    if (!overlay || !sheet) return;
    overlay.classList.remove("hidden", "opacity-0");
    requestAnimationFrame(() => {
        sheet.classList.remove("translate-y-full");
    });
}

function closeMobileLessonSheet() {
    const overlay = document.getElementById("mobile-lesson-sheet-overlay");
    const sheet = document.getElementById("mobile-lesson-sheet");
    if (!overlay || !sheet) return;
    sheet.classList.add("translate-y-full");
    overlay.classList.add("opacity-0");
    setTimeout(() => overlay.classList.add("hidden"), 300);
}

export const ui = {
    initSidebar() {
        const sidebar = document.getElementById("lesson-sidebar");
        if (!sidebar) return;


        const navContainer = sidebar.querySelector("#lesson-nav-container");
        if (navContainer) {
            const skeleton = navContainer.querySelector("#sidebar-skeleton");
            if (skeleton) skeleton.remove();

            navContainer.innerHTML = "";
        }

        const sortedLevels = Object.entries(state.lessons).sort(([levelA], [levelB]) => levelB.localeCompare(levelA));

        const levelListFragment = document.createDocumentFragment();
        const levelWrappers = []; // Keep refs so we can clone for mobile BEFORE fragment is consumed

        sortedLevels.forEach(([level, lessons]) => {
            const levelWrapper = document.createElement("div");
            levelWrapper.className = "flex flex-col gap-2 w-full px-4";


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
                        state.setCurrentLesson(lesson, level);
                    }
                });
                lessonContainer.appendChild(lessonBtn);
            });

            levelBtn.addEventListener("click", () => {
                const icon = levelBtn.querySelector('.material-symbols-outlined');
                const isExpanded = lessonContainer.style.maxHeight !== "0px";


                navContainer.querySelectorAll('.lesson-container').forEach(c => {
                    c.style.maxHeight = "0px";
                    const prevIcon = c.previousElementSibling?.querySelector('.material-symbols-outlined');
                    if (prevIcon) prevIcon.style.transform = "rotate(0deg)";
                });

                if (!isExpanded) {
                    lessonContainer.style.maxHeight = lessonContainer.scrollHeight + "px";
                    icon.style.transform = "rotate(180deg)";
                }
            });

            lessonContainer.classList.add('lesson-container');
            levelWrapper.appendChild(levelBtn);
            levelWrapper.appendChild(lessonContainer);
            levelWrappers.push(levelWrapper); // Save ref before appending to fragment
            levelListFragment.appendChild(levelWrapper);
        });

        if (navContainer) {
            navContainer.appendChild(levelListFragment);

            const mobileNavContainer = document.getElementById("mobile-lesson-nav-container");
            if (mobileNavContainer) {
                const mobileSkeleton = mobileNavContainer.querySelector("#mobile-sidebar-skeleton");
                if (mobileSkeleton) mobileSkeleton.remove();

                mobileNavContainer.innerHTML = "";
                levelWrappers.forEach(wrapper => mobileNavContainer.appendChild(wrapper.cloneNode(true)));

                mobileNavContainer.querySelectorAll(".lesson-container button").forEach(btn => {
                    btn.addEventListener("click", async () => {
                        closeMobileLessonSheet();

                        mobileNavContainer.querySelectorAll(".lesson-nav-active").forEach(el => {
                            el.classList.remove("lesson-nav-active", "bg-indigo-500", "text-white", "border-indigo-600", "shadow-md", "dark:bg-indigo-600", "dark:border-indigo-500");
                            el.classList.add("text-slate-500", "border-slate-100", "dark:text-slate-400", "dark:border-slate-700/50");
                        });
                        btn.classList.remove("text-slate-500", "border-slate-100", "dark:text-slate-400", "dark:border-slate-700/50");
                        btn.classList.add("lesson-nav-active", "bg-indigo-500", "text-white", "border-indigo-600", "shadow-md", "dark:bg-indigo-600", "dark:border-indigo-500");

                        const text = btn.textContent.trim();
                        const lessonMatch = text.match(/Bài (\S+)/);
                        if (!lessonMatch) return;
                        const lesson = lessonMatch[1];

                        const wrapper = btn.closest(".flex-col");
                        const levelSpan = wrapper ? wrapper.querySelector("button > span") : null;
                        const level = levelSpan ? levelSpan.textContent.trim() : "N5";

                        state.setCurrentLesson(lesson, level);
                    });
                });

                mobileNavContainer.querySelectorAll(".flex-col > button").forEach(levelBtn => {
                    levelBtn.addEventListener("click", () => {
                        const icon = levelBtn.querySelector(".material-symbols-outlined");
                        const lessonContainer = levelBtn.nextElementSibling;
                        if (!lessonContainer) return;
                        const isExpanded = lessonContainer.style.maxHeight !== "0px";

                        mobileNavContainer.querySelectorAll(".lesson-container").forEach(c => {
                            c.style.maxHeight = "0px";
                            const prevIcon = c.previousElementSibling?.querySelector(".material-symbols-outlined");
                            if (prevIcon) prevIcon.style.transform = "rotate(0deg)";
                        });

                        if (!isExpanded) {
                            lessonContainer.style.maxHeight = lessonContainer.scrollHeight + "px";
                            if (icon) icon.style.transform = "rotate(180deg)";
                        }
                    });
                });

            }

        }

        this.initDarkMode();
        this.initMobileNav();
    },

    initDarkMode() {
        // Mobile dark mode toggle id
        const mobileToggleId = "dark-mode-toggle";

        const isDark = localStorage.getItem("theme") === "dark";
        if (isDark) {
            document.documentElement.classList.add("dark");
        }

        // Sync all dark mode related UI elements
        const syncDarkModeUI = () => {
            const dark = document.documentElement.classList.contains("dark");

            // Mobile button icon
            const mobileBtn = document.getElementById(mobileToggleId);
            if (mobileBtn) {
                const span = mobileBtn.querySelector("span");
                if (span) span.textContent = dark ? "light_mode" : "dark_mode";
            }

            // Settings menu icon/label (desktop)
            const icon = document.getElementById("settings-darkmode-icon");
            const label = document.getElementById("settings-darkmode-label");
            const sub = document.getElementById("settings-darkmode-sub");
            if (icon) icon.textContent = dark ? "light_mode" : "dark_mode";
            if (label) label.textContent = dark ? "Chế độ sáng" : "Chế độ tối";
            if (sub) sub.textContent = dark ? "Tắt" : "Bật";
        };
        syncDarkModeUI();

        // Mobile dark mode button
        const mobileBtn = document.getElementById(mobileToggleId);
        if (mobileBtn) {
            mobileBtn.addEventListener("click", () => {
                document.documentElement.classList.toggle("dark");
                const dark = document.documentElement.classList.contains("dark");
                localStorage.setItem("theme", dark ? "dark" : "light");
                syncDarkModeUI();
            });
        }

        // ── Desktop Settings Context Menu ──────────────────────────────
        const settingsBtn = document.getElementById("settings-menu-btn");
        const settingsMenu = document.getElementById("settings-context-menu");

        const openSettingsMenu = () => {
            if (!settingsMenu) return;
            settingsMenu.classList.remove("opacity-0", "scale-95", "pointer-events-none");
            settingsMenu.classList.add("opacity-100", "scale-100");
        };

        const closeSettingsMenu = () => {
            if (!settingsMenu) return;
            settingsMenu.classList.add("opacity-0", "scale-95", "pointer-events-none");
            settingsMenu.classList.remove("opacity-100", "scale-100");
        };

        if (settingsBtn) {
            settingsBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = !settingsMenu?.classList.contains("pointer-events-none");
                isOpen ? closeSettingsMenu() : openSettingsMenu();
            });
        }

        // Dark mode row click inside settings menu
        const darkModeRow = document.getElementById("settings-darkmode-row");
        if (darkModeRow) {
            darkModeRow.addEventListener("click", (e) => {
                e.stopPropagation();
                document.documentElement.classList.toggle("dark");
                const dark = document.documentElement.classList.contains("dark");
                localStorage.setItem("theme", dark ? "dark" : "light");
                syncDarkModeUI();
            });
        }

        // Hiragana row click → toggle the checkbox
        const hiraganaRow = document.getElementById("settings-hiragana-row");
        const desktopToggle = document.getElementById("toggle-hiragana-desktop");
        if (hiraganaRow && desktopToggle) {
            hiraganaRow.addEventListener("click", (e) => {
                // Avoid double-fire if click lands on the checkbox itself
                if (e.target === desktopToggle) return;
                e.stopPropagation();
                desktopToggle.checked = !desktopToggle.checked;
                desktopToggle.dispatchEvent(new Event("change"));
            });
        }

        // Close menu when clicking outside
        document.addEventListener("click", (e) => {
            const wrapper = document.getElementById("settings-menu-wrapper");
            if (wrapper && !wrapper.contains(e.target)) {
                closeSettingsMenu();
            }
        });
        // ──────────────────────────────────────────────────────────────

        // Hiragana sync
        const mobileHiragana = document.getElementById("toggle-hiragana");
        const vocabSection = document.querySelector(".vocabulary-section");

        const applyHiragana = (checked) => {
            if (vocabSection) {
                vocabSection.classList.toggle("hide-hiragana", !checked);
            }
            localStorage.setItem("showHiragana", checked ? "true" : "false");
        };

        const savedPref = localStorage.getItem("showHiragana");
        const showHiragana = savedPref !== "false";
        if (mobileHiragana) mobileHiragana.checked = showHiragana;
        if (desktopToggle) desktopToggle.checked = showHiragana;
        applyHiragana(showHiragana);

        if (mobileHiragana) {
            mobileHiragana.addEventListener("change", (e) => {
                if (desktopToggle) desktopToggle.checked = e.target.checked;
                applyHiragana(e.target.checked);
            });
        }
        if (desktopToggle) {
            desktopToggle.addEventListener("change", (e) => {
                if (mobileHiragana) mobileHiragana.checked = e.target.checked;
                applyHiragana(e.target.checked);
            });
        }
    },

    initMobileNav() {
        const lessonBtn = document.getElementById("mobile-nav-lessons");
        const statsBtn = document.getElementById("mobile-nav-stats");
        const closeSheetBtn = document.getElementById("mobile-lesson-sheet-close");

        if (lessonBtn) {
            lessonBtn.addEventListener("click", () => openMobileLessonSheet());
        }

        if (closeSheetBtn) {
            closeSheetBtn.addEventListener("click", () => closeMobileLessonSheet());
        }

        if (statsBtn) {
            statsBtn.addEventListener("click", () => {
                const showStatsBtn = document.getElementById("show-stats");
                if (showStatsBtn) showStatsBtn.click();
            });
        }

        const allNavBtns = [
            document.getElementById("mobile-nav-dashboard"),
            document.getElementById("mobile-nav-lessons"),
            document.getElementById("mobile-nav-stats"),
            document.getElementById("mobile-nav-profile"),
        ];

        const setActive = (activeBtn) => {
            allNavBtns.forEach(b => {
                if (!b) return;
                b.className = b === activeBtn
                    ? "text-indigo-600 dark:text-indigo-400 scale-110 transition-all active:scale-95"
                    : "text-slate-400 dark:text-slate-500 transition-all active:scale-95";
            });
        };

        allNavBtns[0] && allNavBtns[0].addEventListener("click", () => setActive(allNavBtns[0]));
        allNavBtns[1] && allNavBtns[1].addEventListener("click", () => setActive(allNavBtns[1]));
        allNavBtns[2] && allNavBtns[2].addEventListener("click", () => setActive(allNavBtns[0])); // keep dashboard active
        allNavBtns[3] && allNavBtns[3].addEventListener("click", () => setActive(allNavBtns[3]));
    }
};
