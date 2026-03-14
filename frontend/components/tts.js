export const tts = {
    selectedText: "",

    initContextMenu() {
        const menu = document.getElementById("custom-context-menu");
        if (!menu) return;
        
        const readBtn = document.getElementById("menu-read-text");

        document.addEventListener("contextmenu", (e) => {
            const selection = window.getSelection().toString().trim();
            if (selection.length > 0) {
                e.preventDefault();
                this.selectedText = selection;
                
                menu.style.display = "block";
                
                // Defer opacity for CSS transition
                setTimeout(() => {
                    menu.style.opacity = "1";
                }, 10);
                
                // Clamp position within viewport
                let x = e.pageX;
                let y = e.pageY;
                

                x += 10;
                y += 10;

                if (x + menu.offsetWidth > window.innerWidth) {
                    x = window.innerWidth - menu.offsetWidth - 10;
                }
                if (y + menu.offsetHeight > window.innerHeight) {
                    y = window.innerHeight - menu.offsetHeight - 10;
                }
                
                menu.style.left = `${x}px`;
                menu.style.top = `${y}px`;
            } else {
                this.hideMenu(menu);
            }
        });

        document.addEventListener("click", () => {
            this.hideMenu(menu);
        });

        readBtn.addEventListener("click", () => {
            this.speak(this.selectedText);
            this.hideMenu(menu);
        });
    },

    hideMenu(menu) {
        if (!menu) return;
        menu.style.opacity = "0";
        setTimeout(() => {
            menu.style.display = "none";
        }, 200);
    },

    speak(text) {
        if (!('speechSynthesis' in window)) {
            alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Auto-detect language based on character set
        const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);
        if (hasJapanese) {
            utterance.lang = 'ja-JP';
            utterance.rate = 0.8;
        } else {
            utterance.lang = 'vi-VN';
        }

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
};
