// ============================================
// Auth Modal — Popup Đăng Nhập / Đăng Ký
// Tự inject HTML vào page, không cần sửa HTML
// ============================================

(function () {
    // --- Inject modal HTML ---
    const modalHTML = `
    <div id="auth-modal-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] hidden items-center justify-center" style="display:none;">
        <div id="auth-modal-box" class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#6caba0] to-[#4d8a80] p-6 text-white text-center">
                <div class="text-3xl mb-1">🌸</div>
                <h2 id="auth-modal-title" class="text-xl font-bold font-['Plus_Jakarta_Sans']">Đăng Nhập</h2>
                <p id="auth-modal-subtitle" class="text-sm text-white/80">Đăng nhập để lưu tiến độ học tập</p>
            </div>

            <!-- Body -->
            <div class="p-6">
                <div id="auth-modal-error" class="hidden mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"></div>
                <div id="auth-modal-success" class="hidden mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm"></div>

                <form id="auth-modal-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold mb-1.5">Tên đăng nhập</label>
                        <input id="auth-username" type="text" placeholder="Nhập tên đăng nhập" required
                            class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6caba0] focus:border-transparent outline-none" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1.5">Mật khẩu</label>
                        <input id="auth-password" type="password" placeholder="Nhập mật khẩu" required minlength="6"
                            class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6caba0] focus:border-transparent outline-none" />
                    </div>
                    <div id="auth-confirm-row" class="hidden">
                        <label class="block text-sm font-semibold mb-1.5">Xác nhận mật khẩu</label>
                        <input id="auth-confirm-password" type="password" placeholder="Nhập lại mật khẩu" minlength="6"
                            class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6caba0] focus:border-transparent outline-none" />
                    </div>

                    <button id="auth-submit-btn" type="submit"
                        class="w-full bg-[#6caba0] hover:bg-[#4d8a80] text-white font-semibold py-2.5 rounded-lg transition-all text-sm flex items-center justify-center gap-2">
                        <span id="auth-submit-text">Đăng Nhập</span>
                        <svg id="auth-spinner" class="hidden animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" stroke-opacity="0.3"></circle>
                            <path d="M4 12a8 8 0 018-8"></path>
                        </svg>
                    </button>
                </form>

                <div class="mt-4 text-center text-sm text-[#5f6b7a]">
                    <span id="auth-switch-text">Chưa có tài khoản?</span>
                    <button id="auth-switch-btn" class="text-[#6caba0] font-semibold hover:underline ml-1">Đăng ký</button>
                </div>
            </div>

            <!-- Close button -->
            <button id="auth-modal-close" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all">
                <span class="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // --- DOM references ---
    const overlay = document.getElementById('auth-modal-overlay');
    const box = document.getElementById('auth-modal-box');
    const titleEl = document.getElementById('auth-modal-title');
    const subtitleEl = document.getElementById('auth-modal-subtitle');
    const errorEl = document.getElementById('auth-modal-error');
    const successEl = document.getElementById('auth-modal-success');
    const form = document.getElementById('auth-modal-form');
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');
    const confirmRow = document.getElementById('auth-confirm-row');
    const confirmInput = document.getElementById('auth-confirm-password');
    const submitText = document.getElementById('auth-submit-text');
    const spinner = document.getElementById('auth-spinner');
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-btn');
    const closeBtn = document.getElementById('auth-modal-close');

    let isRegisterMode = false;
    let isSubmitting = false;

    // --- Show/Hide ---
    function showModal(registerMode = false) {
        isRegisterMode = registerMode;
        updateMode();
        hideMessages();
        form.reset();
        overlay.style.display = 'flex';
        overlay.classList.remove('hidden');
        setTimeout(() => usernameInput.focus(), 100);
    }

    function hideModal() {
        overlay.style.display = 'none';
        overlay.classList.add('hidden');
        hideMessages();
    }

    function updateMode() {
        if (isRegisterMode) {
            titleEl.textContent = 'Đăng Ký';
            subtitleEl.textContent = 'Tạo tài khoản mới để bắt đầu học';
            submitText.textContent = 'Đăng Ký';
            switchText.textContent = 'Đã có tài khoản?';
            switchBtn.textContent = 'Đăng nhập';
            confirmRow.classList.remove('hidden');
        } else {
            titleEl.textContent = 'Đăng Nhập';
            subtitleEl.textContent = 'Đăng nhập để lưu tiến độ học tập';
            submitText.textContent = 'Đăng Nhập';
            switchText.textContent = 'Chưa có tài khoản?';
            switchBtn.textContent = 'Đăng ký';
            confirmRow.classList.add('hidden');
        }
    }

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
        successEl.classList.add('hidden');
    }

    function showSuccess(msg) {
        successEl.textContent = msg;
        successEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
    }

    function hideMessages() {
        errorEl.classList.add('hidden');
        successEl.classList.add('hidden');
    }

    function setLoading(loading) {
        isSubmitting = loading;
        submitText.style.display = loading ? 'none' : 'inline';
        spinner.classList.toggle('hidden', !loading);
        form.querySelectorAll('input, button[type=submit]').forEach(el => el.disabled = loading);
    }

    // --- Events ---
    switchBtn.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        updateMode();
        hideMessages();
    });

    closeBtn.addEventListener('click', hideModal);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.style.display === 'flex') hideModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            return showError('Vui lòng nhập đầy đủ thông tin.');
        }

        if (password.length < 6) {
            return showError('Mật khẩu phải có ít nhất 6 ký tự.');
        }

        if (isRegisterMode) {
            const confirm = confirmInput.value;
            if (password !== confirm) {
                return showError('Mật khẩu xác nhận không khớp.');
            }
        }

        setLoading(true);
        hideMessages();

        try {
            if (isRegisterMode) {
                await auth.register(username, password);
                showSuccess('Đăng ký thành công! Đang chuyển hướng...');
            } else {
                await auth.login(username, password);
                showSuccess('Đăng nhập thành công!');
            }

            // Cập nhật sidebar user info
            await auth.updateSidebarUser();
            updateAuthUI();

            setTimeout(hideModal, 1000);
        } catch (err) {
            showError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    });

    // --- Update sidebar auth UI ---
    function updateAuthUI() {
        const sidebarUserDiv = document.querySelector('.p-4.border-t.border-gray-50');
        if (!sidebarUserDiv) return;

        // Auto update sidebar user info on all pages
        auth.updateSidebarUser();

        if (auth.isLoggedIn()) {
            // Nếu đã đăng nhập, hiện nút Đăng xuất
            let logoutBtn = document.getElementById('sidebar-logout-btn');
            if (!logoutBtn) {
                logoutBtn = document.createElement('button');
                logoutBtn.id = 'sidebar-logout-btn';
                logoutBtn.className = 'mt-2 w-full text-xs text-[#5f6b7a] hover:text-red-500 transition-colors text-center';
                logoutBtn.textContent = 'Đăng xuất';
                logoutBtn.addEventListener('click', () => {
                    auth.logout();
                    updateAuthUI();
                    window.location.reload();
                });
                sidebarUserDiv.appendChild(logoutBtn);
            }

            // Ẩn nút login nếu có
            const loginBtn = document.getElementById('sidebar-login-btn');
            if (loginBtn) loginBtn.style.display = 'none';
        } else {
            // Hiện nút login
            let loginBtn = document.getElementById('sidebar-login-btn');
            if (!loginBtn) {
                loginBtn = document.createElement('button');
                loginBtn.id = 'sidebar-login-btn';
                loginBtn.className = 'mt-2 w-full text-xs bg-[#f0f7f6] text-[#6caba0] hover:bg-[#e0eeec] py-1.5 rounded-lg font-semibold transition-all';
                loginBtn.textContent = '🔐 Đăng nhập';
                loginBtn.addEventListener('click', () => showModal(false));
                sidebarUserDiv.appendChild(loginBtn);
            }
            loginBtn.style.display = 'block';

            // Ẩn nút logout
            const logoutBtn = document.getElementById('sidebar-logout-btn');
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    // --- Expose globally ---
    window.authModal = {
        show: showModal,
        hide: hideModal,
        showLogin: () => showModal(false),
        showRegister: () => showModal(true),
    };

    // Auto-update auth UI on load
    document.addEventListener('DOMContentLoaded', updateAuthUI);
})();
