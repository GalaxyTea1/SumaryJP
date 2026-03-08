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
                
                // Adjust position to not go off screen
                let x = e.pageX;
                let y = e.pageY;
                if (x + menu.offsetWidth > window.innerWidth) {
                    x = window.innerWidth - menu.offsetWidth;
                }
                if (y + menu.offsetHeight > window.innerHeight) {
                    y = window.innerHeight - menu.offsetHeight;
                }
                
                menu.style.left = `${x}px`;
                menu.style.top = `${y}px`;
            } else {
                menu.style.display = "none";
            }
        });

        document.addEventListener("click", () => {
            menu.style.display = "none";
        });

        readBtn.addEventListener("click", () => {
            this.speak(this.selectedText);
            menu.style.display = "none";
        });
    },

    speak(text) {
        if (!('speechSynthesis' in window)) {
            alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Check if text has Japanese characters
        const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);
        if (hasJapanese) {
            utterance.lang = 'ja-JP';
            utterance.rate = 0.8; // Talk a bit slower for learning
        } else {
            utterance.lang = 'vi-VN'; // Fallback to Vietnamese
        }

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
};
