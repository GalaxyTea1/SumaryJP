// ============================================
// Test Taking Page Logic — Sumary Japanese
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // --- Parse URL params ---
    const params = new URLSearchParams(window.location.search);
    if (!params.has('count')) {
        window.location.href = 'test-center.html';
        return;
    }

    const config = {
        type: params.get('type') || 'vocab',
        level: params.get('level') || 'all',
        lesson: params.get('lesson') || 'all',
        count: parseInt(params.get('count')) || 20,
        time: parseInt(params.get('time')) || 0,
        mode: params.get('mode') || 'practice',
    };

    // --- State ---
    let testWords = [];
    let currentIndex = 0;
    let answers = [];
    let startTime = new Date();
    let timerInterval = null;
    let selectedOption = null;

    // --- Load questions ---
    try {
        const allVocab = await api.getAllVocabulary();

        // Filter by level/lesson
        let filtered = allVocab.filter(v => {
            if (config.level !== 'all' && v.level !== config.level) return false;
            if (config.lesson !== 'all' && String(v.lesson) !== config.lesson) return false;
            return true;
        });

        utils.shuffleArray(filtered);
        testWords = filtered.slice(0, config.count);

        if (testWords.length === 0) {
            alert('Không có từ vựng nào phù hợp để tạo đề!');
            window.location.href = 'test-center.html';
            return;
        }

        // All meanings for wrong options
        window._allMeanings = [...new Set(allVocab.map(v => v.meaning))];
    } catch (e) {
        console.error('Không thể tải dữ liệu:', e);
        alert('Lỗi tải dữ liệu. Quay về trang chủ.');
        window.location.href = 'test-center.html';
        return;
    }

    // --- DOM ---
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

    // Set title
    if (titleEl) {
        const levelStr = config.level === 'all' ? '' : ` ${config.level}`;
        const lessonStr = config.lesson === 'all' ? '' : ` — Bài ${config.lesson}`;
        titleEl.textContent = `Test Từ Vựng${levelStr}${lessonStr}`;
    }

    // --- Timer ---
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

            if (remaining <= 60 && timerEl) {
                timerEl.classList.add('text-red-500');
            }
        }, 1000);
    } else {
        if (timerEl) timerEl.textContent = '--:--';
    }

    // --- Render Question ---
    function renderQuestion() {
        const word = testWords[currentIndex];
        selectedOption = null;

        // Progress
        const pct = (currentIndex / testWords.length) * 100;
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (counterEl) counterEl.innerHTML = `Câu <span class="font-bold text-[#1a2332]">${currentIndex + 1}</span>/${testWords.length}`;
        if (questionLabel) questionLabel.textContent = `Câu ${currentIndex + 1}`;

        // Question
        if (questionText) {
            questionText.innerHTML = `<span class="font-['Noto_Sans_JP'] text-2xl">「${utils.escapeHtml(word.japanese)}」</span> có nghĩa là gì?`;
        }

        // Options: 1 correct + 3 wrong
        let wrongMeanings = window._allMeanings.filter(m => m.toLowerCase() !== word.meaning.toLowerCase());
        utils.shuffleArray(wrongMeanings);
        const options = utils.shuffleArray([word.meaning, ...wrongMeanings.slice(0, 3)]);
        const labels = ['A', 'B', 'C', 'D'];

        if (optionsContainer) {
            optionsContainer.innerHTML = options.map((opt, i) => `
                <div class="option-card flex items-center gap-3" data-value="${utils.escapeHtml(opt)}" data-correct="${opt === word.meaning}">
                    <span class="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-[#5f6b7a] flex-shrink-0 option-label">${labels[i]}</span>
                    <span>${utils.escapeHtml(opt)}</span>
                </div>
            `).join('');

            // Bind click
            optionsContainer.querySelectorAll('.option-card').forEach(card => {
                card.addEventListener('click', () => selectOptionHandler(card));
            });
        }

        // Hide feedback
        if (feedbackEl) feedbackEl.classList.add('hidden');

        // Prev button
        if (prevBtn) {
            prevBtn.style.visibility = currentIndex > 0 ? 'visible' : 'hidden';
        }

        // Next button text
        if (nextBtn) {
            const span = nextBtn.querySelector('span:not(.material-symbols-outlined)') || nextBtn.childNodes[0];
            if (currentIndex === testWords.length - 1) {
                nextBtn.innerHTML = `Hoàn thành <span class="material-symbols-outlined text-lg">check</span>`;
            } else {
                nextBtn.innerHTML = `Câu tiếp theo <span class="material-symbols-outlined text-lg">arrow_forward</span>`;
            }
        }

        // Check if already answered (going back)
        const existing = answers[currentIndex];
        if (existing) {
            const cards = optionsContainer.querySelectorAll('.option-card');
            cards.forEach(card => {
                if (card.dataset.value === existing.userAnswer) {
                    card.classList.add('selected');
                    card.querySelector('.option-label').classList.remove('border-gray-300', 'text-[#5f6b7a]');
                    card.querySelector('.option-label').classList.add('bg-[#6caba0]', 'text-white', 'border-[#6caba0]');
                }
            });

            if (config.mode === 'practice') {
                showFeedback(existing.correct, word);
            }
        }
    }

    function selectOptionHandler(card) {
        if (selectedOption && config.mode === 'practice' && answers[currentIndex]) return; // Already answered in practice

        // Clear selection
        optionsContainer.querySelectorAll('.option-card').forEach(c => {
            c.classList.remove('selected', 'correct', 'incorrect');
            c.querySelector('.option-label').classList.remove('bg-[#6caba0]', 'text-white', 'border-[#6caba0]');
            c.querySelector('.option-label').classList.add('border-gray-300', 'text-[#5f6b7a]');
        });

        // Select this
        card.classList.add('selected');
        card.querySelector('.option-label').classList.remove('border-gray-300', 'text-[#5f6b7a]');
        card.querySelector('.option-label').classList.add('bg-[#6caba0]', 'text-white', 'border-[#6caba0]');

        selectedOption = card.dataset.value;
        const isCorrect = card.dataset.correct === 'true';

        // Store answer
        answers[currentIndex] = {
            word: testWords[currentIndex],
            userAnswer: selectedOption,
            correct: isCorrect,
        };

        // Practice mode: show feedback immediately
        if (config.mode === 'practice') {
            showFeedback(isCorrect, testWords[currentIndex]);

            // Highlight correct/incorrect
            optionsContainer.querySelectorAll('.option-card').forEach(c => {
                if (c.dataset.correct === 'true') {
                    c.classList.add('correct');
                } else if (c === card && !isCorrect) {
                    c.classList.add('incorrect');
                }
            });
        }
    }

    function showFeedback(isCorrect, word) {
        if (!feedbackEl) return;
        feedbackEl.classList.remove('hidden');

        if (isCorrect) {
            feedbackEl.className = 'mt-6 bg-[#e8f5e9] border border-[#4caf50]/20 rounded-lg p-4 flex items-center gap-3';
            feedbackEl.innerHTML = `
                <span class="material-symbols-outlined text-[#4caf50] text-2xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                <div>
                    <div class="font-semibold text-[#2e7d32]">Chính xác!</div>
                    <div class="text-sm text-[#5f6b7a]">${utils.escapeHtml(word.japanese)} (${utils.escapeHtml(word.hiragana || '')}) nghĩa là "${utils.escapeHtml(word.meaning)}"</div>
                </div>
            `;
        } else {
            feedbackEl.className = 'mt-6 bg-[#ffebee] border border-[#ef5350]/20 rounded-lg p-4 flex items-center gap-3';
            feedbackEl.innerHTML = `
                <span class="material-symbols-outlined text-[#ef5350] text-2xl" style="font-variation-settings: 'FILL' 1;">cancel</span>
                <div>
                    <div class="font-semibold text-[#c62828]">Sai rồi!</div>
                    <div class="text-sm text-[#5f6b7a]">Đáp án đúng: <span class="font-semibold text-[#4caf50]">${utils.escapeHtml(word.meaning)}</span></div>
                </div>
            `;
        }
    }

    // --- Navigation ---
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            // Must select to proceed
            if (!answers[currentIndex]) return;

            currentIndex++;
            if (currentIndex < testWords.length) {
                renderQuestion();
            } else {
                finishTest();
            }
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

    // --- Quit ---
    const quitBtn = document.getElementById('btn-quit');
    if (quitBtn) {
        quitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Bạn có chắc chắn muốn thoát khi bài test chưa kết thúc?')) {
                clearInterval(timerInterval);
                window.location.href = 'test-center.html';
            }
        });
    }

    // --- Finish Test ---
    function finishTest() {
        clearInterval(timerInterval);

        const timeTaken = Math.floor((new Date() - startTime) / 1000);
        const correctCount = answers.filter(a => a && a.correct).length;
        const totalCount = testWords.length;
        const score = Math.round((correctCount / totalCount) * 100);

        // Build result
        const result = {
            id: Date.now(),
            testName: `Test Từ Vựng ${config.level !== 'all' ? config.level : ''} ${config.lesson !== 'all' ? 'Bài ' + config.lesson : ''}`.trim(),
            type: config.type,
            level: config.level,
            lesson: config.lesson,
            score,
            correct: correctCount,
            total: totalCount,
            timeTaken,
            answers: answers.map(a => a ? {
                japanese: a.word.japanese,
                hiragana: a.word.hiragana || '',
                meaning: a.word.meaning,
                userAnswer: a.userAnswer,
                correct: a.correct,
            } : null).filter(Boolean),
            date: new Date().toISOString(),
        };

        // Save to localStorage (always — offline support)
        utils.saveTestResult(result);

        // Also submit to backend API if logged in
        if (auth.isLoggedIn()) {
            api.submitTestResult({
                test_type: config.type,
                level: config.level !== 'all' ? config.level : null,
                lesson: config.lesson !== 'all' ? parseInt(config.lesson) : null,
                score,
                total_questions: totalCount,
                correct_answers: correctCount,
                time_taken: timeTaken,
                answers: result.answers,
            }).catch(err => {
                console.warn('Không thể gửi kết quả test lên server:', err);
            });
        }

        // Track gamification
        if (typeof gamification !== 'undefined') {
            gamification.trackEvent('test_complete', { score });
        }

        // Redirect to results page
        window.location.href = `test-results.html?id=${result.id}`;
    }

    // --- Start ---
    renderQuestion();
});
