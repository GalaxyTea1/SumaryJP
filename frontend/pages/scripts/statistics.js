// ============================================
// Statistics Page Logic — Sumary Japanese
// Chart.js for visualizations
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    let allVocab = [];
    let allGrammar = [];
    let allKanji = [];
    let testResults = [];

    // --- Load data ---
    try {
        [allVocab, allGrammar, allKanji] = await Promise.all([
            api.getAllVocabulary(),
            api.getAllGrammar(),
            api.getAllKanji(),
        ]);
    } catch (e) {
        console.warn('Statistics: Không thể tải data:', e);
    }

    // Test results from localStorage
    testResults = utils.getTestResults();

    // --- Summary Cards ---
    const masteredVocab = allVocab.filter(v => v.status === 'mastered').length;
    const masteredPct = allVocab.length > 0 ? Math.round(masteredVocab / allVocab.length * 100) : 0;

    document.getElementById('stat-vocab-total').textContent = allVocab.length;
    document.getElementById('stat-vocab-bar').style.width = `${masteredPct}%`;
    document.getElementById('stat-vocab-pct').textContent = `${masteredPct}% đã thuộc`;

    document.getElementById('stat-grammar-total').textContent = allGrammar.length;
    document.getElementById('stat-grammar-desc').textContent = `${allGrammar.length} mẫu câu`;

    document.getElementById('stat-kanji-total').textContent = allKanji.length;
    document.getElementById('stat-kanji-desc').textContent = `${allKanji.length} chữ Kanji`;

    document.getElementById('stat-test-total').textContent = testResults.length;
    document.getElementById('stat-test-desc').textContent = `${testResults.length} bài test đã làm`;

    // --- Chart 1: Vocab Status (Doughnut) ---
    const statusCounts = {
        'mastered': allVocab.filter(v => v.status === 'mastered').length,
        'learning': allVocab.filter(v => v.status === 'learning').length,
        'not-learned': allVocab.filter(v => v.status === 'not-learned' || !v.status).length,
    };

    new Chart(document.getElementById('chart-vocab-status'), {
        type: 'doughnut',
        data: {
            labels: ['Đã thuộc', 'Đang học', 'Chưa học'],
            datasets: [{
                data: [statusCounts['mastered'], statusCounts['learning'], statusCounts['not-learned']],
                backgroundColor: ['#22c55e', '#f59e0b', '#e5e7eb'],
                borderWidth: 0,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12, family: "'Be Vietnam Pro'" } } },
            }
        }
    });

    // --- Chart 2: Level Distribution (Bar) ---
    const levelData = {};
    [...allVocab, ...allGrammar, ...allKanji].forEach(item => {
        const lv = item.level || 'Khác';
        levelData[lv] = (levelData[lv] || 0) + 1;
    });

    const levelLabels = Object.keys(levelData).sort();
    const levelColors = { N5: '#6caba0', N4: '#4d8a80', N3: '#f59e0b', N2: '#ef4444', N1: '#8b5cf6' };

    new Chart(document.getElementById('chart-level-dist'), {
        type: 'bar',
        data: {
            labels: levelLabels,
            datasets: [{
                label: 'Số lượng',
                data: levelLabels.map(l => levelData[l]),
                backgroundColor: levelLabels.map(l => levelColors[l] || '#94a3b8'),
                borderRadius: 8,
                barThickness: 40,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 12 } } },
                x: { grid: { display: false }, ticks: { font: { size: 12, weight: 'bold' } } }
            }
        }
    });

    // --- Chart 3: Vocab by Lesson (Horizontal Bar) ---
    const lessonData = {};
    allVocab.forEach(v => {
        const key = v.lesson ? `Bài ${v.lesson}` : 'Khác';
        lessonData[key] = (lessonData[key] || 0) + 1;
    });

    const lessonLabels = Object.keys(lessonData).sort((a, b) => {
        const nA = parseInt(a.replace(/\D/g, '')); const nB = parseInt(b.replace(/\D/g, ''));
        if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
        return a.localeCompare(b);
    });

    // --- Recent Tests ---
    const recentEl = document.getElementById('recent-tests');
    if (testResults.length > 0) {
        recentEl.innerHTML = testResults.slice(0, 5).map(t => {
            const pct = t.total > 0 ? Math.round(t.correct / t.total * 100) : 0;
            const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
            return `
                <div class="flex items-center justify-between p-3 bg-[#f8fafb] rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style="background: ${color}20; color: ${color}">${pct}%</div>
                        <div>
                            <div class="text-sm font-semibold">${utils.escapeHtml(t.type || 'Vocabulary')} Test</div>
                            <div class="text-xs text-[#5f6b7a]">${t.correct}/${t.total} đúng • ${utils.timeAgo(t.date)}</div>
                        </div>
                    </div>
                    <div class="text-xs text-[#5f6b7a]">${t.level || ''} ${t.lesson ? 'Bài ' + t.lesson : ''}</div>
                </div>
            `;
        }).join('');
    }

    auth.updateSidebarUser();
});
