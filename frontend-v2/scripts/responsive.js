// ============================================
// Responsive JS — Sidebar hamburger toggle
// Shared across all pages
// ============================================

(function () {
    // Inject hamburger button if not exists
    if (!document.querySelector('.hamburger-btn')) {
        const btn = document.createElement('button');
        btn.className = 'hamburger-btn';
        btn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        btn.setAttribute('aria-label', 'Toggle menu');
        document.body.appendChild(btn);
    }

    // Inject overlay if not exists
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    const sidebar = document.querySelector('aside');
    const hamburger = document.querySelector('.hamburger-btn');
    const overlay = document.querySelector('.sidebar-overlay');

    if (!sidebar || !hamburger) return;

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        hamburger.style.display = 'none';
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        hamburger.style.display = '';
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', closeSidebar);

    // Close sidebar when clicking a link (on mobile)
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                closeSidebar();
            }
        });
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            closeSidebar();
        }
    });
})();
