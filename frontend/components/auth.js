const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
const BASE_URL = isLocalhost ? 'http://localhost:3000/api' : 'https://jp-backend-api.onrender.com/api';

export const auth = {
    API_URL: `${BASE_URL}/auth`,
    STORAGE_KEY: "sumary_jp_token",

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkAuthStatus();
    },

    cacheDOM() {
        // CTA Popup
        this.ctaPopup = document.getElementById("auth-cta-popup");
        this.closeCtaBtn = document.getElementById("close-cta-btn");
        this.ctaLoginBtn = document.getElementById("cta-login-btn");

        // Header
        this.headerLoginBtn = document.getElementById("header-login-btn");
        this.headerUserProfile = document.getElementById("header-user-profile");
        this.headerUsername = document.getElementById("header-username");
        this.headerUserInitial = document.getElementById("header-user-initial");
        this.headerStreakCount = document.getElementById("header-streak-count");
        
        // Avatar Dropdown
        this.headerAvatarBtn = document.getElementById("header-avatar-btn");
        this.headerUserDropdown = document.getElementById("header-user-dropdown");
        this.dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");

        // Modal
        this.modalOverlay = document.getElementById("auth-modal-overlay");
        this.modalContent = document.getElementById("auth-modal-content");
        this.closeModalBtn = document.getElementById("close-auth-modal");
        
        // Tabs
        this.tabLogin = document.getElementById("tab-login");
        this.tabRegister = document.getElementById("tab-register");
        this.tabIndicator = document.getElementById("auth-tab-indicator");
        this.modalTitle = document.getElementById("auth-modal-title");
        this.modalSubtitle = document.getElementById("auth-modal-subtitle");
        
        // Form
        this.authForm = document.getElementById("auth-form");
        this.registerFields = document.getElementById("register-fields");
        this.submitText = document.getElementById("auth-submit-text");
        this.togglePasswordBtn = document.getElementById("toggle-password-visibility");
        this.passwordInput = document.getElementById("auth-password");
        this.confirmPasswordInput = document.getElementById("auth-confirm-password");
        this.usernameInput = document.getElementById("auth-username");

        this.currentTab = 'login'; // 'login' or 'register'
    },

    bindEvents() {
        // Open Modal Triggers
        if(this.headerLoginBtn) this.headerLoginBtn.addEventListener("click", () => this.openModal('login'));
        if(this.ctaLoginBtn) this.ctaLoginBtn.addEventListener("click", () => this.openModal('login'));

        // Close Modal Triggers
        if(this.closeModalBtn) this.closeModalBtn.addEventListener("click", () => this.closeModal());
        if(this.modalOverlay) {
            this.modalOverlay.addEventListener("click", (e) => {
                if(e.target === this.modalOverlay) this.closeModal();
            });
        }
        
        // Close CTA
        if(this.closeCtaBtn) {
            this.closeCtaBtn.addEventListener("click", () => {
                this.hideCTA();
                // Optionally remember they closed it for this session
                sessionStorage.setItem("cta_closed", "true");
            });
        }

        // Tab Switching
        if(this.tabLogin) this.tabLogin.addEventListener("click", () => this.switchTab('login'));
        if(this.tabRegister) this.tabRegister.addEventListener("click", () => this.switchTab('register'));

        // Toggle Password Visibility
        if(this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener("click", () => {
                const type = this.passwordInput.getAttribute("type") === "password" ? "text" : "password";
                this.passwordInput.setAttribute("type", type);
                this.togglePasswordBtn.textContent = type === "password" ? "visibility_off" : "visibility";
            });
        }

        // Form Submit
        if(this.authForm) {
            this.authForm.addEventListener("submit", (e) => this.handleAuthSubmit(e));
        }

        // Avatar Click -> Toggle Dropdown
        if(this.headerAvatarBtn && this.headerUserDropdown) {
            this.headerAvatarBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });

            // Close dropdown when clicking outside
            document.addEventListener("click", (e) => {
                if(!this.headerUserDropdown.contains(e.target) && !this.headerAvatarBtn.contains(e.target)) {
                    this.closeDropdown();
                }
            });
        }

        // Logout from Dropdown
        if(this.dropdownLogoutBtn) {
            this.dropdownLogoutBtn.addEventListener("click", () => {
                this.closeDropdown();
                this.logout();
            });
        }
    },

    openModal(defaultTab = 'login') {
        if(!this.modalOverlay) return;
        this.switchTab(defaultTab);
        this.modalOverlay.classList.remove("hidden");
        // small delay to allow display block to apply before animating opacity
        setTimeout(() => {
            this.modalOverlay.classList.remove("opacity-0");
            this.modalContent.classList.remove("scale-95", "opacity-0");
            this.modalContent.classList.add("scale-100", "opacity-100");
        }, 10);
    },

    closeModal() {
        if(!this.modalOverlay) return;
        this.modalOverlay.classList.remove("opacity-100");
        this.modalOverlay.classList.add("opacity-0");
        this.modalContent.classList.remove("scale-100", "opacity-100");
        this.modalContent.classList.add("scale-95", "opacity-0");
        
        setTimeout(() => {
            this.modalOverlay.classList.add("hidden");
            this.authForm.reset();
        }, 300); // match duration-300
    },

    switchTab(tab) {
        this.currentTab = tab;
        if(tab === 'login') {
            this.tabIndicator.style.transform = "translateX(0)";
            this.tabLogin.classList.replace("text-slate-500", "text-slate-800");
            this.tabLogin.classList.replace("dark:text-slate-400", "dark:text-slate-100");
            this.tabRegister.classList.replace("text-slate-800", "text-slate-500");
            this.tabRegister.classList.replace("dark:text-slate-100", "dark:text-slate-400");
            
            this.modalTitle.textContent = "Chào mừng trở lại";
            this.modalSubtitle.textContent = "Đăng nhập để lưu trữ tiến độ học tập";
            this.registerFields.classList.add("hidden");
            this.submitText.textContent = "Đăng nhập";
        } else {
            this.tabIndicator.style.transform = "translateX(100%)";
            this.tabRegister.classList.replace("text-slate-500", "text-slate-800");
            this.tabRegister.classList.replace("dark:text-slate-400", "dark:text-slate-100");
            this.tabLogin.classList.replace("text-slate-800", "text-slate-500");
            this.tabLogin.classList.replace("dark:text-slate-100", "dark:text-slate-400");
            
            this.modalTitle.textContent = "Tạo tài khoản mới";
            this.modalSubtitle.textContent = "Hành trình chinh phục tiếng Nhật bắt đầu";
            this.registerFields.classList.remove("hidden");
            this.submitText.textContent = "Đăng ký";
        }
    },

    toggleDropdown() {
        if(!this.headerUserDropdown) return;
        if(this.headerUserDropdown.classList.contains("opacity-0")) {
            this.openDropdown();
        } else {
            this.closeDropdown();
        }
    },

    openDropdown() {
        if(!this.headerUserDropdown) return;
        this.headerUserDropdown.classList.remove("opacity-0", "scale-95", "pointer-events-none");
        this.headerUserDropdown.classList.add("opacity-100", "scale-100");
    },

    closeDropdown() {
        if(!this.headerUserDropdown) return;
        this.headerUserDropdown.classList.remove("opacity-100", "scale-100");
        this.headerUserDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
    },

    showCTA() {
        if(!this.ctaPopup) return;
        if(sessionStorage.getItem("cta_closed") === "true") return;

        this.ctaPopup.classList.remove("hidden");
        // small delay for transition
        setTimeout(() => {
            this.ctaPopup.classList.remove("translate-y-24", "opacity-0", "pointer-events-none");
        }, 100);
    },

    hideCTA() {
        if(!this.ctaPopup) return;
        this.ctaPopup.classList.add("translate-y-24", "opacity-0", "pointer-events-none");
        setTimeout(() => {
            this.ctaPopup.classList.add("hidden");
        }, 500); // match duration-500
    },

    async checkAuthStatus() {
        const token = localStorage.getItem(this.STORAGE_KEY);
        if(token) {
            try {
                // Verify token by calling /me
                const response = await fetch(`${this.API_URL}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if(response.ok) {
                    const data = await response.json();
                    this.updateUIToLoggedIn(data.user);
                    return;
                } else {
                    // Token expired or invalid
                    console.warn("Session expired or invalid token.");
                    localStorage.removeItem(this.STORAGE_KEY);
                }
            } catch(e) {
                console.error("Lỗi khi kiểm tra đăng nhập:", e);
            }
        }
        
        // Not logged in
        this.updateUIToGuest();
    },

    updateUIToLoggedIn(user) {
        // Hide CTA
        this.hideCTA();

        // Update Header
        if(this.headerLoginBtn) this.headerLoginBtn.classList.add("hidden");
        if(this.headerUserProfile) {
            this.headerUserProfile.classList.remove("hidden");
            if(this.headerUsername) this.headerUsername.textContent = user.username;
            if(this.headerUserInitial) this.headerUserInitial.textContent = user.username.charAt(0).toUpperCase();
            if(this.headerStreakCount) this.headerStreakCount.textContent = user.current_streak || 0;
        }
    },

    updateUIToGuest() {
        // Show CTA with a delay so it catches attention
        setTimeout(() => {
            this.showCTA();
        }, 2000);

        // Update Header
        if(this.headerLoginBtn) this.headerLoginBtn.classList.remove("hidden");
        if(this.headerUserProfile) this.headerUserProfile.classList.add("hidden");
    },

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();
        if(!username || !password) return;

        // Reset text and disable button during submit
        const originalText = this.submitText.textContent;
        this.submitText.textContent = "Đang xử lý...";
        const submitBtn = document.getElementById("auth-submit-btn");
        submitBtn.disabled = true;

        try {
            let endpoint = `${this.API_URL}/login`;
            const payload = { username, password };

            // Handle Registration validation
            if (this.currentTab === 'register') {
                const confirmPassword = this.confirmPasswordInput.value.trim();
                if (password !== confirmPassword) {
                    alert('Mật khẩu xác nhận không khớp!');
                    return;
                }
                endpoint = `${this.API_URL}/register`;
            }

            // Call API
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Đã có lỗi xảy ra');
                return;
            }

            // Save Token to LocalStorage (Real JWT)
            localStorage.setItem(this.STORAGE_KEY, data.token);
            
            // Update UI
            this.closeModal();
            this.updateUIToLoggedIn(data.user);
            
            console.log("Xác thực thành công cho user:", data.user.username);

        } catch (error) {
            console.error('Lỗi khi đăng nhập/đăng ký:', error);
            alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        } finally {
            this.submitText.textContent = originalText;
            submitBtn.disabled = false;
        }
    },

    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateUIToGuest();
    }
};
