// ============================================
// Auth Helpers — Sumary Japanese
// ============================================

const auth = {
    TOKEN_KEY: 'sumary_jp_token',

    /** Get stored JWT token */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    /** Check if user is logged in */
    isLoggedIn() {
        return !!this.getToken();
    },

    /** Decode JWT payload (without verification) */
    _decodeToken() {
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (e) {
            return null;
        }
    },

    /** Get user role from JWT */
    getUserRole() {
        const payload = this._decodeToken();
        return payload?.role || 'user';
    },

    /** Check if current user is admin */
    isAdmin() {
        return this.getUserRole() === 'admin';
    },

    /** Verify token and get user info — returns user object or null */
    async getCurrentUser() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const data = await api.getMe();
            return data.user || data;
        } catch (e) {
            console.warn('Token invalid or expired:', e.message);
            this.logout();
            return null;
        }
    },

    /** Update sidebar user info + inject admin link if admin */
    async updateSidebarUser() {
        const userInitialEl = document.getElementById('sidebar-user-initial');
        const userNameEl = document.getElementById('sidebar-user-name');
        const userLevelEl = document.getElementById('sidebar-user-level');

        if (!userInitialEl || !userNameEl) return;

        const user = await this.getCurrentUser();
        if (user) {
            const name = user.display_name || user.username || 'User';
            userInitialEl.textContent = name.substring(0, 2).toUpperCase();
            userInitialEl.className = 'w-9 h-9 rounded-full bg-[#f0f7f6] flex items-center justify-center text-[#6caba0] font-bold text-sm';
            userNameEl.textContent = name;
            if (userLevelEl) {
                userLevelEl.textContent = user.level || 'N5 Level';
                userLevelEl.style.display = 'block';
            }

            // Auto-inject Admin link in sidebar if admin
            const role = user.role || this.getUserRole();
            if (role === 'admin') {
                this._injectAdminLink();
            }
        } else {
            userInitialEl.textContent = '?';
            userInitialEl.className = 'w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm';
            userNameEl.textContent = 'Khách';
            if (userLevelEl) {
                userLevelEl.textContent = 'Chưa đăng nhập';
                userLevelEl.style.display = 'block';
            }
        }
    },

    /** Inject Admin link into sidebar (if not already present) */
    _injectAdminLink() {
        const nav = document.querySelector('aside nav');
        if (!nav || nav.querySelector('.admin-sidebar-link')) return;

        const divider = document.createElement('div');
        divider.className = 'border-t border-gray-100 my-2';

        const link = document.createElement('a');
        link.href = 'admin.html';
        link.className = 'sidebar-link admin-sidebar-link';
        link.innerHTML = '<span class="material-symbols-outlined text-xl">admin_panel_settings</span> Admin';

        // Highlight if on admin page
        if (window.location.pathname.includes('admin.html')) {
            link.classList.add('active');
        }

        nav.appendChild(divider);
        nav.appendChild(link);
    },

    /** Login */
    async login(username, password) {
        const data = await api.login(username, password);
        if (data.token) {
            localStorage.setItem(this.TOKEN_KEY, data.token);
        }
        return data;
    },

    /** Register */
    async register(username, password) {
        const data = await api.register(username, password);
        if (data.token) {
            localStorage.setItem(this.TOKEN_KEY, data.token);
        }
        return data;
    },

    /** Logout */
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    /** Redirect to landing if not logged in */
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'landing.html';
            return false;
        }
        return true;
    }
};

window.auth = auth;
