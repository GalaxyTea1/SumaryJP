// ============================================
// Text-to-Speech — Sumary Japanese
// ============================================

const tts = {
    speak(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('Trình duyệt không hỗ trợ TTS.');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Auto-detect language
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

window.tts = tts;
