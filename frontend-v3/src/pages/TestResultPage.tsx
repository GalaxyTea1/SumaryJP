// ============================================
// TestResultPage.tsx — SumaryJP
// React 19 + TypeScript + Tailwind CSS v4
// Detailed test results page
// ============================================

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { FullscreenLoader } from '@/components/LoadingSpinner';

const RESULTS_KEY = 'sumary_test_results';

interface AnswerDetail {
  type: 'vocab' | 'kanji' | 'grammar';
  prompt: string;
  subPrompt?: string;
  meaning: string;
  userAnswer: string;
  correct: boolean;
}

interface TestResultData {
  id: number;
  testName: string;
  score: number;
  correct: number;
  total: number;
  timeTaken: number;
  date: string;
  answers: AnswerDetail[];
}

function formatTime(seconds: number): string {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}phút ${s}giây` : `${s}giây`;
}

// Speak helper using Web Speech API
function speakJapanese(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  }
}

export default function TestResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [result, setResult] = useState<TestResultData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resultId = searchParams.get('id');
  const localIndexStr = searchParams.get('localIndex');

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);

        if (resultId) {
          // 1. Load from Backend API
          const res = await api.getTestResultById(parseInt(resultId, 10));
          if (res) {
            // Normalize backend payload
            const details = typeof res.details === 'string'
              ? JSON.parse(res.details || '{}')
              : (res.details || {});
            
            const total = res.total_questions ?? res.total ?? 0;
            const correct = res.correct_answers ?? res.correct ?? 0;

            setResult({
              id: res.id ?? 0,
              testName: details.testName || `${res.test_type || 'Vocabulary'} Test`,
              score: res.score || 0,
              correct,
              total,
              timeTaken: res.time_taken ?? 0,
              date: res.completed_at || new Date().toISOString(),
              answers: details.answers || [],
            });
            setLoading(false);
            return;
          }
        }

        // 2. Load from localStorage fallback
        const localResults = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
        const idx = localIndexStr ? parseInt(localIndexStr, 10) : 0;

        if (localResults.length > 0 && idx >= 0 && idx < localResults.length) {
          const item = localResults[idx];
          
          setResult({
            id: item.id,
            testName: item.testName || 'Bài Test Không Tên',
            score: item.score || 0,
            correct: item.correct || 0,
            total: item.total || 0,
            timeTaken: item.timeTaken || 0,
            date: item.date || new Date().toISOString(),
            answers: item.details?.answers || item.answers || [],
          });
        } else {
          setErrorMsg('Không tìm thấy kết quả bài kiểm tra tương ứng.');
        }
        setLoading(false);
      } catch (err) {
        console.error('Lỗi khi tải kết quả bài kiểm tra:', err);
        setErrorMsg('Đã xảy ra lỗi khi truy vấn kết quả thi.');
        setLoading(false);
      }
    }

    void loadResult();
  }, [resultId, localIndexStr]);

  if (loading) {
    return <FullscreenLoader message="Đang phân tích bảng điểm..." />;
  }

  if (errorMsg || !result) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-6">
        <span className="material-symbols-outlined text-6xl text-error mb-4">warning</span>
        <h2 className="text-xl font-bold font-headline mb-2">Lỗi Tải Kết Quả</h2>
        <p className="text-on-surface-variant text-sm mb-6">{errorMsg || 'Không tìm thấy kết quả.'}</p>
        <button
          onClick={() => navigate('/test-center')}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-xl transition-all text-sm cursor-pointer"
        >
          Quay lại Test Center
        </button>
      </div>
    );
  }

  // Determine feedback badge style based on score
  let badgeText = '📚 Ôn tập thêm nhé!';
  let badgeClass = 'bg-error-light text-error border border-error/10';
  let ringColor = 'var(--color-error)';

  if (result.score >= 90) {
    badgeText = '🌟 Xuất Sắc!';
    badgeClass = 'bg-secondary-light text-secondary-dark border border-secondary/15';
    ringColor = 'var(--color-primary)'; // Sage Teal ring
  } else if (result.score >= 70) {
    badgeText = '👍 Tốt lắm!';
    badgeClass = 'bg-success-light text-success border border-success/15';
    ringColor = 'var(--color-primary-light)';
  } else if (result.score >= 50) {
    badgeText = '💪 Cần cố gắng';
    badgeClass = 'bg-blue-50 text-blue-500 border border-blue-100';
    ringColor = 'var(--color-warning)';
  }

  const wrongAnswers = result.answers.filter(a => !a.correct);
  const avgTimePerQuestion = result.total > 0 ? (result.timeTaken / result.total).toFixed(1) : '0';

  return (
    <div className="flex flex-col min-h-[80vh] w-full max-w-3xl mx-auto py-6 px-4 animate-fade-in-up space-y-6">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center gap-2 sm:gap-4 border-b border-outline-variant pb-4">
        <button
          onClick={() => navigate('/test-center')}
          className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-all cursor-pointer flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="hidden xs:inline">Quay về Test Center</span>
          <span className="xs:hidden">Quay về</span>
        </button>
        <h1 className="font-extrabold text-xs sm:text-base font-headline truncate max-w-[100px] xs:max-w-[170px] sm:max-w-sm flex-1 min-w-0 text-center">
          {result.testName}
        </h1>
        <div className="w-8 sm:w-10 flex-shrink-0" /> {/* Spacer */}
      </header>

      {/* SCORE HERO CARD */}
      <div className="card p-8 text-center flex flex-col items-center justify-center bg-surface border border-outline-variant rounded-2xl shadow-sm space-y-4">
        {/* Conic-gradient Score Ring */}
        <div
          className="w-40 h-40 rounded-full flex items-center justify-center shadow-md relative"
          style={{
            background: `conic-gradient(${ringColor} 0% ${result.score}%, var(--color-surface-container) ${result.score}% 100%)`,
          }}
        >
          {/* Inner white circle */}
          <div className="w-32 h-32 rounded-full bg-surface flex flex-col items-center justify-center shadow-inner">
            <span className="text-3xl font-extrabold font-headline text-on-surface">
              {result.score}%
            </span>
            <span className="text-xs font-bold text-on-surface-variant mt-0.5">
              {result.correct}/{result.total} đúng
            </span>
          </div>
        </div>

        {/* Feedback Badge */}
        <div className={`px-4 py-1.5 rounded-full text-sm font-extrabold shadow-sm ${badgeClass}`}>
          {badgeText}
        </div>

        {/* Time Stats */}
        <div className="flex items-center gap-1.5 text-sm text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-lg">timer</span>
          <span>Thời gian làm bài: </span>
          <span className="font-bold text-on-surface">{formatTime(result.timeTaken)}</span>
        </div>
      </div>

      {/* STATS DETAIL GRID */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="card p-3 sm:p-4 text-center bg-surface border border-outline-variant/60 rounded-2xl shadow-sm">
          <div className="text-2xl font-extrabold text-success">{result.correct}</div>
          <div className="text-[10.5px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
            Câu đúng
          </div>
        </div>

        <div className="card p-3 sm:p-4 text-center bg-surface border border-outline-variant/60 rounded-2xl shadow-sm">
          <div className="text-2xl font-extrabold text-error">
            {result.total - result.correct}
          </div>
          <div className="text-[10.5px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
            Câu sai
          </div>
        </div>

        <div className="card p-3 sm:p-4 text-center bg-surface border border-outline-variant/60 rounded-2xl shadow-sm">
          <div className="text-2xl font-extrabold text-primary-dark">{avgTimePerQuestion}s</div>
          <div className="text-[10.5px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
            Thời gian TB/câu
          </div>
        </div>
      </div>

      {/* WEAK POINTS (DIỂM CẦN CẢI THIỆN) */}
      <div className="card p-6 bg-surface border border-outline-variant rounded-2xl shadow-sm">
        <h3 className="font-bold font-headline text-base border-b border-outline-variant pb-3 flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-error">flag</span>
          Điểm Cần Cải Thiện
        </h3>

        {wrongAnswers.length === 0 ? (
          <div className="p-6 bg-success-light border border-success/15 rounded-2xl text-center space-y-2">
            <span className="material-symbols-outlined text-success text-4xl animate-bounce">
              emoji_events
            </span>
            <p className="font-extrabold text-success text-sm">Kết Quả Hoàn Hảo!</p>
            <p className="text-xs text-on-surface-variant/80">
              Tuyệt vời, bạn đã trả lời đúng tất cả các câu hỏi trong đề thi này!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {wrongAnswers.map((ans, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3.5 bg-error-light/25 border border-error/15 rounded-xl text-left"
              >
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-[14.5px] font-japanese flex flex-wrap items-center gap-2">
                    <span>{ans.prompt}</span>
                    {ans.subPrompt && (
                      <span className="text-xs font-normal text-on-surface-variant/75 font-body">
                        ({ans.subPrompt})
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-on-surface-variant break-words">
                    Bạn chọn:{' '}
                    <span className="text-error font-semibold line-through mr-3 break-all">
                      {ans.userAnswer}
                    </span>
                    Đáp án đúng:{' '}
                    <span className="text-success font-extrabold break-all">{ans.meaning}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => speakJapanese(ans.prompt)}
                  className="flex-shrink-0 text-xs font-bold bg-white hover:bg-primary-50 text-primary border border-outline-variant px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <span className="material-symbols-outlined text-sm">volume_up</span>
                  Nghe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL ANSWERS REVIEW GRID */}
      {result.answers.length > 0 && (
        <div className="card p-6 bg-surface border border-outline-variant rounded-2xl shadow-sm">
          <h3 className="font-bold font-headline text-base border-b border-outline-variant pb-3 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">list_alt</span>
            Chi Tiết Từng Câu
          </h3>

          <div className="flex flex-wrap gap-2.5 justify-start">
            {result.answers.map((ans, idx) => {
              const statusBg = ans.correct
                ? 'bg-success-light text-success border border-success/15'
                : 'bg-error-light/35 text-error border border-error/15';

              return (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12.5px] font-bold shadow-sm select-none ${statusBg}`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTION ACTIONS BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              navigate('/test-center');
            });
          }}
          className="flex-1 bg-surface hover:bg-surface-dim text-on-surface border border-outline font-bold py-3.5 px-6 rounded-xl transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">replay</span>
          Làm Bài Test Khác
        </button>

        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              navigate('/dashboard');
            });
          }}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark shadow-md"
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          Về Trang Chủ (Dashboard)
        </button>
      </div>
    </div>
  );
}
