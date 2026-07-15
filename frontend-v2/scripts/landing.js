// ============================================
// Landing Page Auth Entry
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (auth.isLoggedIn()) {
        document.querySelectorAll('.js-auth-login, .js-auth-register').forEach(link => {
            link.setAttribute('href', 'dashboard.html');
        });
        return;
    }

    document.querySelectorAll('.js-auth-login').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            window.authModal?.showLogin();
        });
    });

    document.querySelectorAll('.js-auth-register').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            window.authModal?.showRegister();
        });
    });
});

document.addEventListener('sumary:auth-success', (event) => {
    event.preventDefault();
    window.authModal?.showPageLoading('Đang chuẩn bị không gian học tập...');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 350);
});
