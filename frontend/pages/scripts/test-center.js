// ============================================
// Test Center Page Logic — Sumary Japanese
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    let vocabulary = [];

    // --- Load vocab để đếm câu hỏi ---
    try {
        vocabulary = await api.getAllVocabulary();
    } catch (e) {
        console.warn('Test Center: Không thể tải từ vựng.', e);
    }

    // --- Custom Dropdown Helper ---
    function initCustomDropdown(container, onChange) {
        if (!container) return;
        const btn = container.querySelector('.custom-dropdown-btn');
        const list = container.querySelector('.custom-dropdown-list');
        const label = btn.querySelector('.label');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown-list.show').forEach(l => {
                if (l !== list) {
                    l.classList.remove('show');
                    l.closest('.custom-dropdown').querySelector('.custom-dropdown-btn').classList.remove('open');
                }
            });
            list.classList.toggle('show');
            btn.classList.toggle('open');
        });

        list.addEventListener('click', (e) => {
            const item = e.target.closest('.custom-dropdown-item');
            if (!item) return;
            list.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            label.textContent = item.textContent;
            list.classList.remove('show');
            btn.classList.remove('open');
            onChange(item.dataset.value);
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown-list.show').forEach(l => {
            l.classList.remove('show');
            l.closest('.custom-dropdown').querySelector('.custom-dropdown-btn').classList.remove('open');
        });
    });

    // --- Test Type Selection ---
    const testTypeCards = document.querySelectorAll('.test-type-card');
    let selectedType = 'vocab';

    testTypeCards.forEach(card => {
        card.addEventListener('click', () => {
            testTypeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedType = card.dataset.type || 'vocab';
            updateQuestionCount();
        });
    });

    // --- Config ---
    const levelDropdown = document.getElementById('config-level-dropdown');
    const lessonDropdown = document.getElementById('config-lesson-dropdown');
    const timeDropdown = document.getElementById('config-time-dropdown');
    const countBtns = document.querySelectorAll('.count-btn');
    const startBtn = document.getElementById('start-test-btn');

    let selectedCount = 20;
    let selectedLevel = 'all';
    let selectedLesson = 'all';
    let timeEnabled = false;
    let selectedTime = 15;
    let selectedMode = 'practice';

    // Populate lessons dropdown
    if (lessonDropdown && vocabulary.length > 0) {
        const list = lessonDropdown.querySelector('.custom-dropdown-list');
        const lessons = [...new Set(vocabulary.map(v => v.lesson))].sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return String(a).localeCompare(String(b));
        });
        lessons.forEach(l => {
            const item = document.createElement('div');
            item.className = 'custom-dropdown-item';
            item.dataset.value = l;
            item.textContent = `Bài ${l}`;
            list.appendChild(item);
        });
    }

    // Init Level dropdown
    initCustomDropdown(levelDropdown, (val) => {
        selectedLevel = val;
        updateQuestionCount();
    });

    // Init Lesson dropdown
    initCustomDropdown(lessonDropdown, (val) => {
        selectedLesson = val;
        updateQuestionCount();
    });

    // Init Time dropdown
    initCustomDropdown(timeDropdown, (val) => {
        selectedTime = parseInt(val);
    });

    // Count buttons
    countBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            countBtns.forEach(b => {
                b.classList.remove('bg-[#6caba0]', 'text-white');
                b.classList.add('border', 'border-gray-200');
            });
            btn.classList.add('bg-[#6caba0]', 'text-white');
            btn.classList.remove('border', 'border-gray-200');
            selectedCount = parseInt(btn.dataset.count);
        });
    });

    // Time checkbox
    const timeCheckbox = document.getElementById('config-time-enabled');
    if (timeCheckbox) {
        timeCheckbox.addEventListener('change', () => {
            timeEnabled = timeCheckbox.checked;
        });
    }

    // Mode radio
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            selectedMode = radio.value;
        });
    });

    // --- Start Test ---
    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const params = new URLSearchParams({
                type: selectedType,
                level: selectedLevel,
                lesson: selectedLesson,
                count: selectedCount,
                time: timeEnabled ? selectedTime : 0,
                mode: selectedMode,
            });
            window.location.href = `test-taking.html?${params.toString()}`;
        });
    }

    // --- Recent Results ---
    const resultsTable = document.getElementById('recent-results-body');
    if (resultsTable) {
        const results = utils.getTestResults();
        if (results.length > 0) {
            resultsTable.innerHTML = results.slice(0, 5).map(r => {
                const scoreColor = r.score >= 80 ? 'text-[#4caf50]' : r.score >= 60 ? 'text-[#f0a868]' : 'text-[#ef5350]';
                return `
                    <tr class="border-t border-gray-50 hover:bg-[#f8fafb]">
                        <td class="px-5 py-3 font-medium">${utils.escapeHtml(r.testName || 'Test')}</td>
                        <td class="px-5 py-3 text-center"><span class="${scoreColor} font-bold">${r.score}%</span></td>
                        <td class="px-5 py-3 text-center">${r.correct}/${r.total} đúng</td>
                        <td class="px-5 py-3 text-center text-[#5f6b7a]">${utils.formatTime(r.timeTaken || 0)}</td>
                        <td class="px-5 py-3 text-[#5f6b7a]">${utils.timeAgo(r.date)}</td>
                        <td class="px-5 py-3"><a href="test-results.html?id=${r.id || 0}" class="text-[#6caba0] hover:underline">Chi tiết</a></td>
                    </tr>
                `;
            }).join('');
        } else {
            resultsTable.innerHTML = `<tr><td colspan="6" class="px-5 py-6 text-center text-[#5f6b7a]">Chưa có kết quả nào.</td></tr>`;
        }
    }

    function updateQuestionCount() {
        const filteredCount = vocabulary.filter(v => {
            if (selectedLevel !== 'all' && v.level !== selectedLevel) return false;
            if (selectedLesson !== 'all' && String(v.lesson) !== selectedLesson) return false;
            return true;
        }).length;

        const vocabCountEl = document.getElementById('vocab-question-count');
        if (vocabCountEl) vocabCountEl.textContent = `${filteredCount} câu hỏi`;
    }

    updateQuestionCount();
    auth.updateSidebarUser();
});
