// ============================================
// Test Results Page Logic — Sumary Japanese
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Get result from localStorage ---
    const params = new URLSearchParams(window.location.search);
    const resultId = parseInt(params.get('id'));
    const allResults = utils.getTestResults();

    let result = null;
    if (resultId) {
        result = allResults.find(r => r.id === resultId);
    }
    if (!result && allResults.length > 0) {
        result = allResults[0]; // Fallback to latest
    }

    if (!result) {
        document.querySelector('main').innerHTML = `
            <div class="text-center py-20">
                <span class="material-symbols-outlined text-6xl text-[#d1d5db]">quiz</span>
                <p class="mt-4 text-[#5f6b7a]">Không tìm thấy kết quả bài test.</p>
                <a href="test-center.html" class="inline-block mt-4 px-6 py-3 bg-[#6caba0] text-white rounded-lg font-semibold">Làm bài test mới</a>
            </div>
        `;
        return;
    }

    // --- Score Ring ---
    const scoreRing = document.getElementById('score-ring');
    const scoreLabel = document.getElementById('score-label');
    const scoreDetail = document.getElementById('score-detail');

    if (scoreRing) {
        scoreRing.style.background = `conic-gradient(#6caba0 0% ${result.score}%, #e8ebee ${result.score}% 100%)`;
    }
    if (scoreLabel) scoreLabel.textContent = `${result.score}%`;
    if (scoreDetail) scoreDetail.textContent = `${result.correct}/${result.total} đúng`;

    // --- Badge ---
    const badgeEl = document.getElementById('score-badge');
    if (badgeEl) {
        if (result.score >= 90) {
            badgeEl.innerHTML = '🌟 Xuất Sắc!';
            badgeEl.className = 'inline-flex items-center gap-1.5 bg-[#fff3e0] text-[#f0a868] px-3 py-1 rounded-full text-sm font-semibold mb-3';
        } else if (result.score >= 70) {
            badgeEl.innerHTML = '👍 Tốt lắm!';
            badgeEl.className = 'inline-flex items-center gap-1.5 bg-[#e8f5e9] text-[#4caf50] px-3 py-1 rounded-full text-sm font-semibold mb-3';
        } else if (result.score >= 50) {
            badgeEl.innerHTML = '💪 Cần cải thiện';
            badgeEl.className = 'inline-flex items-center gap-1.5 bg-[#e3f2fd] text-[#42a5f5] px-3 py-1 rounded-full text-sm font-semibold mb-3';
        } else {
            badgeEl.innerHTML = '📚 Ôn tập thêm nhé!';
            badgeEl.className = 'inline-flex items-center gap-1.5 bg-[#ffebee] text-[#ef5350] px-3 py-1 rounded-full text-sm font-semibold mb-3';
        }
    }

    // --- Time & comparison ---
    const timeEl = document.getElementById('result-time');
    if (timeEl) timeEl.textContent = utils.formatTime(result.timeTaken || 0);

    // --- Stat cards ---
    const correctEl = document.getElementById('stat-correct');
    const wrongEl = document.getElementById('stat-wrong');
    const avgTimeEl = document.getElementById('stat-avg-time');

    if (correctEl) correctEl.textContent = result.correct;
    if (wrongEl) wrongEl.textContent = result.total - result.correct;
    if (avgTimeEl) {
        const avg = result.timeTaken && result.total ? (result.timeTaken / result.total).toFixed(1) : '—';
        avgTimeEl.textContent = `${avg}s`;
    }

    // --- Weak Points ---
    const weakPointsEl = document.getElementById('weak-points');
    if (weakPointsEl && result.answers) {
        const wrongAnswers = result.answers.filter(a => !a.correct);
        if (wrongAnswers.length === 0) {
            weakPointsEl.innerHTML = `
                <div class="p-4 bg-[#e8f5e9] rounded-lg text-center">
                    <span class="material-symbols-outlined text-[#4caf50] text-3xl">emoji_events</span>
                    <p class="mt-2 font-semibold text-[#2e7d32]">Hoàn hảo! Không có câu sai.</p>
                </div>
            `;
        } else {
            weakPointsEl.innerHTML = wrongAnswers.map(a => `
                <div class="flex items-center gap-4 p-3 bg-[#ffebee] rounded-lg">
                    <span class="text-[#ef5350] font-bold">❌</span>
                    <div class="flex-1">
                        <div class="font-semibold text-sm font-['Noto_Sans_JP']">${utils.escapeHtml(a.japanese)} <span class="text-[#5f6b7a] font-['Be_Vietnam_Pro'] font-normal">(${utils.escapeHtml(a.hiragana)})</span></div>
                        <div class="text-xs text-[#5f6b7a]">Bạn chọn: <span class="text-[#ef5350]">${utils.escapeHtml(a.userAnswer)}</span> → Đáp án: <span class="text-[#4caf50] font-semibold">${utils.escapeHtml(a.meaning)}</span></div>
                    </div>
                    <button class="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#6caba0] font-semibold hover:bg-[#f0f7f6] btn-tts-review" data-text="${utils.escapeHtml(a.japanese)}">🔊 Nghe</button>
                </div>
            `).join('');

            // TTS for review
            weakPointsEl.querySelectorAll('.btn-tts-review').forEach(btn => {
                btn.addEventListener('click', () => tts.speak(btn.dataset.text));
            });
        }
    }

    // --- Answer Review Grid ---
    const gridEl = document.getElementById('answer-grid');
    if (gridEl && result.answers) {
        gridEl.innerHTML = result.answers.map((a, i) => {
            const bg = a.correct ? 'bg-[#e8f5e9] text-[#4caf50]' : 'bg-[#ffebee] text-[#ef5350]';
            return `<span class="w-9 h-9 rounded-lg ${bg} flex items-center justify-center text-sm font-bold">${i + 1}</span>`;
        }).join('');
    }

    // --- Test title ---
    const testTitleEl = document.getElementById('result-test-title');
    if (testTitleEl) testTitleEl.textContent = result.testName || 'Kết quả bài test';
});
