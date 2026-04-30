export const utils = {
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /**
     * Escape HTML entities để ngăn XSS attacks.
     * Chuyển đổi &, <, >, ", ' thành HTML entities an toàn.
     */
    escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * Hiển thị thông báo dạng Toast (Góc trên bên phải)
     * @param {string} message - Nội dung thông báo
     * @param {string} type - 'info', 'success', 'error', 'warning'
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    showToast(message, type = 'info', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconName = 'info';
        if (type === 'success') iconName = 'check_circle';
        if (type === 'error') iconName = 'error';
        if (type === 'warning') iconName = 'warning';

        toast.innerHTML = `
            <span class="toast-icon">${iconName}</span>
            <div class="toast-content">${this.escapeHtml(message)}</div>
        `;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('toast-show');
            });
        });

        setTimeout(() => {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');
            
            // Remove from DOM after animation
            toast.addEventListener('transitionend', () => {
                toast.remove();
                if (container.childNodes.length === 0) {
                    container.remove();
                }
            });
        }, duration);
    }
};
