// ============================================
// Test Center Page Logic - Sumary Japanese
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.requireAuth()) return;

    let vocabulary = [];
    let kanji = [];
    let grammar = [];

    try {
        [vocabulary, kanji, grammar] = await Promise.all([
            api.getAllVocabulary(),
            api.getAllKanji(),
            api.getAllGrammar(),
        ]);
    } catch (e) {
        console.error('Test Center: failed to load test data.', e);
        alert('Không thể tải dữ liệu bài test. Vui lòng kiểm tra kết nối và thử lại.');
        window.location.href = 'dashboard.html';
        return;
    }

    function initCustomDropdown(container, onChange) {
        if (!container) return;
        const btn = container.querySelector('.custom-dropdown-btn');
        const list = container.querySelector('.custom-dropdown-list');
        const label = btn?.querySelector('.label');
        if (!btn || !list || !label) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown-list.show').forEach(openList => {
                if (openList !== list) {
                    openList.classList.remove('show');
                    openList.closest('.custom-dropdown')?.querySelector('.custom-dropdown-btn')?.classList.remove('open');
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
        document.querySelectorAll('.custom-dropdown-list.show').forEach(list => {
            list.classList.remove('show');
            list.closest('.custom-dropdown')?.querySelector('.custom-dropdown-btn')?.classList.remove('open');
        });
    });

    const testTypeCards = document.querySelectorAll('.test-type-card');
    const levelDropdown = document.getElementById('config-level-dropdown');
    const lessonDropdown = document.getElementById('config-lesson-dropdown');
    const timeDropdown = document.getElementById('config-time-dropdown');
    const countBtns = document.querySelectorAll('.count-btn');
    const startBtn = document.getElementById('start-test-btn');

    let selectedType = 'vocab';
    let selectedCount = 20;
    let selectedLevel = 'all';
    let selectedLesson = 'all';
    let timeEnabled = false;
    let selectedTime = 15;
    let selectedMode = 'practice';

    function getDatasetByType(type) {
        if (type === 'kanji') return kanji;
        if (type === 'grammar') return grammar;
        if (type === 'mixed') return [...vocabulary, ...kanji, ...grammar];
        return vocabulary;
    }

    function getSelectedDataset() {
        return getDatasetByType(selectedType);
    }

    function getFilteredCount(items) {
        return items.filter(item => {
            if (selectedLevel !== 'all' && item.level !== selectedLevel) return false;
            if (selectedLesson !== 'all' && String(item.lesson) !== selectedLesson) return false;
            return true;
        }).length;
    }

    function sortLessons(a, b) {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
        return String(a).localeCompare(String(b));
    }

    function populateLessons() {
        if (!lessonDropdown) return;
        const list = lessonDropdown.querySelector('.custom-dropdown-list');
        const label = lessonDropdown.querySelector('.label');
        if (!list) return;

        list.innerHTML = '<div class="custom-dropdown-item active" data-value="all">Tất cả bài</div>';
        if (label) label.textContent = 'Tất cả bài';
        selectedLesson = 'all';

        const lessons = [...new Set(getSelectedDataset().map(item => item.lesson).filter(Boolean))].sort(sortLessons);
        lessons.forEach(lesson => {
            const item = document.createElement('div');
            item.className = 'custom-dropdown-item';
            item.dataset.value = lesson;
            item.textContent = `Bài ${lesson}`;
            list.appendChild(item);
        });
    }

    function updateQuestionCount() {
        const datasets = {
            vocab: vocabulary,
            kanji,
            grammar,
            mixed: [...vocabulary, ...kanji, ...grammar],
        };

        Object.entries(datasets).forEach(([type, items]) => {
            const countEl = document.querySelector(`.test-type-card[data-type="${type}"] span.rounded-full`);
            if (countEl) countEl.textContent = `${getFilteredCount(items)} câu hỏi`;
        });
    }

    testTypeCards.forEach(card => {
        card.addEventListener('click', () => {
            testTypeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedType = card.dataset.type || 'vocab';
            populateLessons();
            updateQuestionCount();
        });
    });

    initCustomDropdown(levelDropdown, (val) => {
        selectedLevel = val;
        updateQuestionCount();
    });

    initCustomDropdown(lessonDropdown, (val) => {
        selectedLesson = val;
        updateQuestionCount();
    });

    initCustomDropdown(timeDropdown, (val) => {
        selectedTime = parseInt(val, 10);
    });

    countBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            countBtns.forEach(b => {
                b.classList.remove('bg-[#6caba0]', 'text-white');
                b.classList.add('border', 'border-gray-200');
            });
            btn.classList.add('bg-[#6caba0]', 'text-white');
            btn.classList.remove('border', 'border-gray-200');
            selectedCount = parseInt(btn.dataset.count, 10);
        });
    });

    const timeCheckbox = document.getElementById('config-time-enabled');
    if (timeCheckbox) {
        timeCheckbox.addEventListener('change', () => {
            timeEnabled = timeCheckbox.checked;
        });
    }

    document.querySelectorAll('input[name="mode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            selectedMode = radio.value;
        });
    });

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

    const resultsTable = document.getElementById('recent-results-body');
    if (resultsTable) {
        let results = [];
        try {
            results = utils.normalizeTestResults(await api.getTestHistory(5));
        } catch (e) {
            console.error('Test Center: failed to load test history.', e);
            alert('Không thể tải lịch sử test. Vui lòng kiểm tra kết nối và thử lại.');
            window.location.href = 'dashboard.html';
            return;
        }

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
            resultsTable.innerHTML = '<tr><td colspan="6" class="px-5 py-6 text-center text-[#5f6b7a]">Chưa có kết quả nào.</td></tr>';
        }
    }

    populateLessons();
    updateQuestionCount();
    auth.updateSidebarUser();
});
