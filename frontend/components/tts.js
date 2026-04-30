import { utils } from "./utils.js";

export const tts = {
    initContextMenu() {
        // Feature not currently implemented
    },
    speak(text) {
        if (!('speechSynthesis' in window)) {
            utils.showToast("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.", "error");
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
