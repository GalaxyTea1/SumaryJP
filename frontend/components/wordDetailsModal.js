export const wordDetailsModal = {
    modal: null,
    content: null,
    japaneseEl: null,
    hiraganaEl: null,
    meaningEl: null,
    typeEl: null,
    lessonEl: null,
    closeBtn: null,

    init() {
        this.modal = document.getElementById("word-detail-modal");
        if (!this.modal) return;
        
        this.content = document.getElementById("word-detail-content");
        this.japaneseEl = document.getElementById("detail-japanese");
        this.hiraganaEl = document.getElementById("detail-hiragana");
        this.meaningEl = document.getElementById("detail-meaning");
        this.typeEl = document.getElementById("detail-type");
        this.lessonEl = document.getElementById("detail-lesson");
        this.closeBtn = document.getElementById("close-detail-modal");

        this.closeBtn.addEventListener("click", () => this.hide());
        

        this.modal.addEventListener("click", (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });


        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !this.modal.classList.contains("opacity-0")) {
                this.hide();
            }
        });
    },

    show(vocab) {
        if (!this.modal || !vocab) return;


        this.japaneseEl.textContent = vocab.japanese;
        this.hiraganaEl.textContent = vocab.hiragana;
        this.meaningEl.textContent = vocab.meaning;
        this.typeEl.textContent = vocab.type || "Từ vựng";
        this.lessonEl.textContent = `Bài ${vocab.lesson} - ${vocab.level}`;


        this.modal.classList.remove("pointer-events-none", "opacity-0");
        
        setTimeout(() => {
            this.content.classList.remove("scale-95", "opacity-0");
            this.content.classList.add("scale-100", "opacity-100");
        }, 10);
    },

    hide() {
        if (!this.modal) return;
        
        this.content.classList.remove("scale-100", "opacity-100");
        this.content.classList.add("scale-95", "opacity-0");
        
        setTimeout(() => {
            this.modal.classList.add("pointer-events-none", "opacity-0");
        }, 300);
    }
};
