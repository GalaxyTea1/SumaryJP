// ============================================
// Test Taking Page Logic - Sumary Japanese
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.requireAuth()) return;

    const params = new URLSearchParams(window.location.search);
    if (!params.has('count')) {
        window.location.href = 'test-center.html';
        return;
    }

    const config = {
        type: params.get('type') || 'vocab',
        level: params.get('level') || 'all',
        lesson: params.get('lesson') || 'all',
        count: parseInt(params.get('count'), 10) || 20,
        time: parseInt(params.get('time'), 10) || 0,
        mode: params.get('mode') || 'practice',
    };

    const TYPE_LABELS = {
        vocab: 'Tu Vung',
        kanji: 'Kanji',
        grammar: 'Ngu Phap',
        mixed: 'Tong Hop',
    };

    let questions = [];
    let optionPool = [];
    let currentIndex = 0;
    let answers = [];
    let startTime = new Date();
    let timerInterval = null;
    let selectedOption = null;
    let finishing = false;

    try {
        const sourceItems = await loadQuestionSource(config.type);
        const filtered = sourceItems.filter(item => {
            if (config.level !== 'all' && item.level !== config.level) return false;
            if (config.lesson !== 'all' && String(item.lesson) !== config.lesson) return false;
            return true;
        });

        optionPool = [...new Set(sourceItems.map(item => item.answer).filter(Boolean))];
        questions = utils.shuffleArray([...filtered]).slice(0, config.count);

        if (questions.length === 0) {
            alert('Khong co cau hoi phu hop de tao de.');
            window.location.href = 'test-center.html';
            return;
        }
    } catch (error) {
        console.error('Load test questions failed:', error);
        alert('Khong the tai du lieu bai test. Vui long kiem tra ket noi va thu lai.');
        window.location.href = 'test-center.html';
        return;
    }

    const titleEl = document.getElementById('test-title');
    const timerEl = document.getElementById('timer');
    const progressFill = document.querySelector('.progress-thin .fill');
    const counterEl = document.getElementById('question-counter');
    const questionLabel = document.getElementById('question-label');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options');
    const feedbackEl = document.getElementById('feedback');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');

    if (titleEl) {
        const levelStr = config.level === 'all' ? '' : ` ${config.level}`;
        const lessonStr = config.lesson === 'all' ? '' : ` - Bai ${config.lesson}`;
        titleEl.textContent = `Test ${TYPE_LABELS[config.type] || TYPE_LABELS.vocab}${levelStr}${lessonStr}`;
    }

    if (config.time > 0) {
        const totalSeconds = config.time * 60;
        startTime = new Date();

        timerInterval = setInterval(() => {
            const elapsed = Math.floor((new Date() - startTime) / 1000);
            const remaining = totalSeconds - elapsed;

            if (remaining <= 0) {
                finishTest();
                return;
            }

            if (timerEl) timerEl.textContent = utils.formatTime(remaining);
            if (remaining <= 60 && timerEl) timerEl.classList.add('text-red-500');
        }, 1000);
    } else if (timerEl) {
        timerEl.textContent = '--:--';
    }

    async function loadQuestionSource(type) {
        const loaders = {
            vocab: async () => normalizeVocab(await api.getAllVocabulary()),
            kanji: async () => normalizeKanji(await api.getAllKanji()),
            grammar: async () => normalizeGrammar(await api.getAllGrammar()),
            mixed: async () => {
                const [vocab, kanji, grammar] = await Promise.all([
                    api.getAllVocabulary(),
                    api.getAllKanji(),
                    api.getAllGrammar(),
                ]);
                return [
                    ...normalizeVocab(vocab),
                    ...normalizeKanji(kanji),
                    ...normalizeGrammar(grammar),
                ];
            },
        };

        return (loaders[type] || loaders.vocab)();
    }

    function normalizeVocab(items) {
        return (items || []).map(item => ({
            id: item.id,
            type: 'vocab',
            level: item.level,
            lesson: item.lesson,
            prompt: item.japanese || '',
            subPrompt: item.hiragana || '',
            answer: item.meaning || '',
            meta: item.type || '',
            raw: item,
        })).filter(item => item.prompt && item.answer);
    }

    function normalizeKanji(items) {
        return (items || []).map(item => ({
            id: item.id,
            type: 'kanji',
            level: item.level,
            lesson: item.lesson,
            prompt: item.character || '',
            subPrompt: [item.onyomi, item.kunyomi].filter(Boolean).join(' / '),
            answer: item.meaning || '',
            meta: item.stroke_count ? `${item.stroke_count} net` : '',
            raw: item,
        })).filter(item => item.prompt && item.answer);
    }

    function normalizeGrammar(items) {
        return (items || []).map(item => ({
            id: item.id,
            type: 'grammar',
            level: item.level,
            lesson: item.lesson,
            prompt: item.pattern || '',
            subPrompt: item.example_ja || '',
            answer: item.meaning || '',
            meta: item.example_vi || '',
            raw: item,
        })).filter(item => item.prompt && item.answer);
    }

    function renderQuestion() {
        const question = questions[currentIndex];
        selectedOption = null;

        const pct = (currentIndex / questions.length) * 100;
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (counterEl) counterEl.innerHTML = `Cau <span class="font-bold text-[#1a2332]">${currentIndex + 1}</span>/${questions.length}`;
        if (questionLabel) questionLabel.textContent = `Cau ${currentIndex + 1}`;

        if (questionText) {
            const typePrefix = config.type === 'mixed' ? `<span class="text-sm text-[#6caba0] mr-2">${TYPE_LABELS[question.type]}</span>` : '';
            questionText.innerHTML = `${typePrefix}<span class="font-['Noto_Sans_JP'] text-2xl">${utils.escapeHtml(question.prompt)}</span> co nghia la gi?`;
            if (question.subPrompt) {
                questionText.innerHTML += `<div class="mt-2 text-sm font-normal text-[#5f6b7a]">${utils.escapeHtml(question.subPrompt)}</div>`;
            }
        }

        const wrongAnswers = optionPool.filter(answer => answer.toLowerCase() !== question.answer.toLowerCase());
        utils.shuffleArray(wrongAnswers);
        const options = utils.shuffleArray([question.answer, ...wrongAnswers.slice(0, 3)]);
        const labels = ['A', 'B', 'C', 'D'];

        if (optionsContainer) {
            optionsContainer.innerHTML = options.map((option, index) => `
                <div class="option-card flex items-center gap-3" data-value="${utils.escapeHtml(option)}" data-correct="${option === question.answer}">
                    <span class="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-[#5f6b7a] flex-shrink-0 option-label">${labels[index]}</span>
                    <span>${utils.escapeHtml(option)}</span>
                </div>
            `).join('');

            optionsContainer.querySelectorAll('.option-card').forEach(card => {
                card.addEventListener('click', () => selectOptionHandler(card));
            });
        }

        if (feedbackEl) feedbackEl.classList.add('hidden');
        if (prevBtn) prevBtn.style.visibility = currentIndex > 0 ? 'visible' : 'hidden';
        if (nextBtn) {
            nextBtn.innerHTML = currentIndex === questions.length - 1
                ? `Hoan thanh <span class="material-symbols-outlined text-lg">check</span>`
                : `Cau tiep theo <span class="material-symbols-outlined text-lg">arrow_forward</span>`;
        }

        const existing = answers[currentIndex];
        if (existing && optionsContainer) {
            optionsContainer.querySelectorAll('.option-card').forEach(card => {
                if (card.dataset.value === existing.userAnswer) {
                    card.classList.add('selected');
                    card.querySelector('.option-label').classList.remove('border-gray-300', 'text-[#5f6b7a]');
                    card.querySelector('.option-label').classList.add('bg-[#6caba0]', 'text-white', 'border-[#6caba0]');
                }
            });
            if (config.mode === 'practice') showFeedback(existing.correct, question);
        }
    }

    function selectOptionHandler(card) {
        if (selectedOption && config.mode === 'practice' && answers[currentIndex]) return;

        optionsContainer.querySelectorAll('.option-card').forEach(item => {
            item.classList.remove('selected', 'correct', 'incorrect');
            item.querySelector('.option-label').classList.remove('bg-[#6caba0]', 'text-white', 'border-[#6caba0]');
            item.querySelector('.option-label').classList.add('border-gray-300', 'text-[#5f6b7a]');
        });

        card.classList.add('selected');
        card.querySelector('.option-label').classList.remove('border-gray-300', 'text-[#5f6b7a]');
        card.querySelector('.option-label').classList.add('bg-[#6caba0]', 'text-white', 'border-[#6caba0]');

        selectedOption = card.dataset.value;
        const isCorrect = card.dataset.correct === 'true';
        answers[currentIndex] = {
            question: questions[currentIndex],
            userAnswer: selectedOption,
            correct: isCorrect,
        };

        if (config.mode === 'practice') {
            showFeedback(isCorrect, questions[currentIndex]);
            optionsContainer.querySelectorAll('.option-card').forEach(item => {
                if (item.dataset.correct === 'true') item.classList.add('correct');
                else if (item === card && !isCorrect) item.classList.add('incorrect');
            });
        }
    }

    function showFeedback(isCorrect, question) {
        if (!feedbackEl) return;
        feedbackEl.classList.remove('hidden');

        if (isCorrect) {
            feedbackEl.className = 'mt-6 bg-[#e8f5e9] border border-[#4caf50]/20 rounded-lg p-4 flex items-center gap-3';
            feedbackEl.innerHTML = `
                <span class="material-symbols-outlined text-[#4caf50] text-2xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                <div>
                    <div class="font-semibold text-[#2e7d32]">Chinh xac!</div>
                    <div class="text-sm text-[#5f6b7a]">${utils.escapeHtml(question.prompt)} nghia la "${utils.escapeHtml(question.answer)}"</div>
                </div>
            `;
        } else {
            feedbackEl.className = 'mt-6 bg-[#ffebee] border border-[#ef5350]/20 rounded-lg p-4 flex items-center gap-3';
            feedbackEl.innerHTML = `
                <span class="material-symbols-outlined text-[#ef5350] text-2xl" style="font-variation-settings: 'FILL' 1;">cancel</span>
                <div>
                    <div class="font-semibold text-[#c62828]">Sai roi!</div>
                    <div class="text-sm text-[#5f6b7a]">Dap an dung: <span class="font-semibold text-[#4caf50]">${utils.escapeHtml(question.answer)}</span></div>
                </div>
            `;
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!answers[currentIndex]) return;

            currentIndex++;
            if (currentIndex < questions.length) renderQuestion();
            else finishTest();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                renderQuestion();
            }
        });
    }

    const quitBtn = document.getElementById('btn-quit');
    if (quitBtn) {
        quitBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (confirm('Ban co chac chan muon thoat khi bai test chua ket thuc?')) {
                clearInterval(timerInterval);
                window.location.href = 'test-center.html';
            }
        });
    }

    async function finishTest() {
        if (finishing) return;
        finishing = true;
        clearInterval(timerInterval);

        const timeTaken = Math.floor((new Date() - startTime) / 1000);
        const correctCount = answers.filter(answer => answer && answer.correct).length;
        const totalCount = questions.length;
        const score = Math.round((correctCount / totalCount) * 100);

        const resultDetails = {
            testName: `Test ${TYPE_LABELS[config.type] || TYPE_LABELS.vocab} ${config.level !== 'all' ? config.level : ''} ${config.lesson !== 'all' ? 'Bai ' + config.lesson : ''}`.trim(),
            answers: answers.map(answer => answer ? {
                type: answer.question.type,
                prompt: answer.question.prompt,
                subPrompt: answer.question.subPrompt,
                meaning: answer.question.answer,
                userAnswer: answer.userAnswer,
                correct: answer.correct,
            } : null).filter(Boolean),
        };

        let savedResult;
        try {
            savedResult = await api.submitTestResult({
                test_type: config.type,
                level: config.level !== 'all' ? config.level : null,
                lesson: config.lesson !== 'all' ? parseInt(config.lesson, 10) : null,
                score,
                total_questions: totalCount,
                correct_answers: correctCount,
                time_taken: timeTaken,
                mode: config.mode,
                details: resultDetails,
            });
        } catch (error) {
            finishing = false;
            console.error('Submit test result failed:', error);
            alert('Khong the luu ket qua bai test. Vui long kiem tra ket noi va thu lai.');
            return;
        }

        if (typeof gamification !== 'undefined') {
            await gamification.trackEvent('test_complete', { score }).catch(() => null);
        }

        window.location.href = `test-results.html?id=${savedResult.id}`;
    }

    renderQuestion();
});
