// ============================================
// TestTakingPage.tsx — SumaryJP
// React 19 + TypeScript + Tailwind CSS v4
// Multiple choice test page
// ============================================

import { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useGamification } from '@/context/GamificationContext';
import { FullscreenLoader } from '@/components/LoadingSpinner';

// --- DATA TYPES FOR TEST SESSION ---
interface NormalizedQuestion {
  id: number;
  type: 'vocab' | 'kanji' | 'grammar';
  level?: string;
  lesson?: string;
  prompt: string;
  subPrompt?: string;
  answer: string;
  meta?: string;
  options: string[];
}

interface SavedAnswer {
  question: NormalizedQuestion;
  userAnswer: string;
  correct: boolean;
}

const RESULTS_KEY = 'sumary_test_results';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

export default function TestTakingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackEvent } = useGamification();
  const [, startTransition] = useTransition();

  // Test session parameters
  const config = {
    type: searchParams.get('type') || 'vocab',
    level: searchParams.get('level') || 'all',
    lesson: searchParams.get('lesson') || 'all',
    count: parseInt(searchParams.get('count') || '20', 10),
    time: parseInt(searchParams.get('time') || '0', 10),
    mode: (searchParams.get('mode') as 'practice' | 'exam') || 'practice',
  };

  const TYPE_LABELS: Record<string, string> = {
    vocab: 'Từ Vựng',
    kanji: 'Kanji',
    grammar: 'Ngữ Pháp',
    mixed: 'Tổng Hợp',
  };

  // State Management
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, SavedAnswer>>({});
  const [remainingTime, setRemainingTime] = useState<number>(config.time * 60);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeTakenRef = useRef<number>(0);
  const handleFinishRef = useRef<(isTimeOut?: boolean) => void>(() => {});

  // Initialize and load questions
  useEffect(() => {
    let active = true;

    async function loadTest() {
      try {
        setLoading(true);
        let sourceItems: Array<{ id: number; type: 'vocab' | 'kanji' | 'grammar'; level?: string; lesson?: string; prompt: string; subPrompt?: string; answer: string; meta?: string }> = [];

        // Load correct source based on type
        if (config.type === 'vocab') {
          const vocab = await api.getAllVocabulary();
          sourceItems = vocab.map(v => ({
            id: v.id,
            type: 'vocab',
            level: v.level,
            lesson: v.lesson,
            prompt: v.japanese || '',
            subPrompt: v.hiragana || '',
            answer: v.meaning || '',
            meta: v.level ? `${v.level} - Bài ${v.lesson || ''}` : ''
          }));
        } else if (config.type === 'kanji') {
          const kanji = await api.getAllKanji();
          sourceItems = kanji.map(k => ({
            id: k.id,
            type: 'kanji',
            level: k.level,
            lesson: k.lesson,
            prompt: k.kanji || '',
            subPrompt: [k.onyomi, k.kunyomi].filter(Boolean).join(' / '),
            answer: k.meaning || '',
            meta: k.stroke_count ? `${k.stroke_count} nét` : ''
          }));
        } else if (config.type === 'grammar') {
          const grammar = await api.getAllGrammar();
          sourceItems = grammar.map(g => ({
            id: g.id,
            type: 'grammar',
            level: g.level,
            lesson: g.lesson,
            prompt: g.pattern || '',
            subPrompt: g.example_ja || '',
            answer: g.meaning || '',
            meta: g.example_vi || ''
          }));
        } else {
          // Mixed
          const [vocab, kanji, grammar] = await Promise.all([
            api.getAllVocabulary().catch(() => []),
            api.getAllKanji().catch(() => []),
            api.getAllGrammar().catch(() => [])
          ]);
          
          const vItems = vocab.map(v => ({
            id: v.id,
            type: 'vocab' as const,
            level: v.level,
            lesson: v.lesson,
            prompt: v.japanese || '',
            subPrompt: v.hiragana || '',
            answer: v.meaning || ''
          }));
          const kItems = kanji.map(k => ({
            id: k.id,
            type: 'kanji' as const,
            level: k.level,
            lesson: k.lesson,
            prompt: k.kanji || '',
            subPrompt: [k.onyomi, k.kunyomi].filter(Boolean).join(' / '),
            answer: k.meaning || ''
          }));
          const gItems = grammar.map(g => ({
            id: g.id,
            type: 'grammar' as const,
            level: g.level,
            lesson: g.lesson,
            prompt: g.pattern || '',
            subPrompt: g.example_ja || '',
            answer: g.meaning || ''
          }));

          sourceItems = [...vItems, ...kItems, ...gItems];
        }

        if (!active) return;

        // Filter items based on configuration
        const filtered = sourceItems.filter(item => {
          if (config.level !== 'all' && item.level !== config.level) return false;
          if (config.lesson !== 'all' && String(item.lesson) !== config.lesson) return false;
          return true;
        });

        if (filtered.length === 0) {
          setErrorMsg('Không tìm thấy câu hỏi phù hợp với cấu hình của bạn.');
          setLoading(false);
          return;
        }

        // Shuffle and pick limit
        const selected = shuffleArray(filtered).slice(0, config.count);
        
        // Generate options (1 correct, 3 wrong from optionPool)
        const optionPool = Array.from(new Set(sourceItems.map(s => s.answer).filter(Boolean)));
        
        const preparedQuestions: NormalizedQuestion[] = selected.map(q => {
          const wrongAnswers = shuffleArray(optionPool.filter(ans => ans.toLowerCase() !== q.answer.toLowerCase()));
          const options = shuffleArray([q.answer, ...wrongAnswers.slice(0, 3)]);
          
          return {
            ...q,
            options
          };
        });

        setQuestions(preparedQuestions);
        setLoading(false);
      } catch (err) {
        console.error('Lỗi khi tải bài kiểm tra:', err);
        if (active) {
          setErrorMsg('Đã xảy ra lỗi khi tải dữ liệu bài kiểm tra. Vui lòng thử lại.');
          setLoading(false);
        }
      }
    }

    void loadTest();

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer running effect
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (loading || errorMsg || isSubmitting) return;

    // Timer tracking time taken
    const elapsedTimer = setInterval(() => {
      timeTakenRef.current += 1;
      setTimeTaken(timeTakenRef.current);
    }, 1000);

    // Limit Timer
    if (config.time > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            clearInterval(elapsedTimer);
            void handleFinishRef.current(true); // Auto submit via ref
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(elapsedTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, errorMsg, isSubmitting]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Handle Option Select
  const handleSelectOption = (option: string) => {
    // If practice mode and already answered, lock selection
    if (config.mode === 'practice' && answers[currentIndex]) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.answer;

    // Speak Japanese text for vocabulary prompts on select
    if (currentQuestion.type === 'vocab') {
      speakJapanese(currentQuestion.prompt);
    }

    setAnswers(prev => ({
      ...prev,
      [currentIndex]: {
        question: currentQuestion,
        userAnswer: option,
        correct: isCorrect,
      }
    }));
  };

  // Submit test session
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFinish = async (_isTimeOut = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const answeredList = Object.values(answers);
    const correctCount = answeredList.filter(a => a.correct).length;
    const totalCount = questions.length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const finalTimeTaken = timeTakenRef.current;

    const resultDetails = {
      testName: `Test ${TYPE_LABELS[config.type] || TYPE_LABELS.vocab} ${
        config.level !== 'all' ? config.level : ''
      } ${config.lesson !== 'all' ? 'Bài ' + config.lesson : ''}`.trim(),
      answers: questions.map((q, idx) => {
        const userAns = answers[idx];
        return {
          type: q.type,
          prompt: q.prompt,
          subPrompt: q.subPrompt,
          meaning: q.answer,
          userAnswer: userAns ? userAns.userAnswer : 'Không trả lời',
          correct: userAns ? userAns.correct : false,
        };
      })
    };

    let resultId = null;
    try {
      // 1. Submit to Backend API
      const apiResult = await api.submitTestResult({
        test_type: config.type,
        level: config.level !== 'all' ? config.level : undefined,
        lesson: config.lesson !== 'all' ? parseInt(config.lesson, 10) : undefined,
        score,
        total: totalCount,
        total_questions: totalCount,
        correct_answers: correctCount,
        time_taken: finalTimeTaken,
        mode: config.mode,
        details: resultDetails,
      });

      resultId = apiResult.id;
    } catch (err) {
      console.warn('Không thể gửi kết quả bài test lên backend:', err);
    }

    // 2. Award XP via gamification
    try {
      await trackEvent('test_complete', { score });
    } catch (e) {
      console.error('Không thể cộng XP gamification:', e);
    }

    // 3. Save to localStorage (Local fallback / guest results)
    const localResult = {
      id: resultId || Date.now(),
      testName: resultDetails.testName,
      score,
      correct: correctCount,
      total: totalCount,
      timeTaken: finalTimeTaken,
      date: new Date().toISOString(),
      details: resultDetails,
    };

    try {
      const localResults = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
      localResults.unshift(localResult);
      localStorage.setItem(RESULTS_KEY, JSON.stringify(localResults.slice(0, 30)));
    } catch (e) {
      console.error('Lỗi khi lưu localStorage:', e);
    }

    // 4. Redirect to result page
    startTransition(() => {
      if (resultId) {
        navigate(`/test-center/result?id=${resultId}`);
      } else {
        navigate(`/test-center/result?localIndex=0`);
      }
    });
  };

  // Keep ref in sync with latest handleFinish
  useEffect(() => {
    handleFinishRef.current = handleFinish;
  });

  const handleQuit = () => {
    if (window.confirm('Bạn có chắc chắn muốn thoát khi bài kiểm tra chưa hoàn thành?')) {
      if (timerRef.current) clearInterval(timerRef.current);
      navigate('/test-center');
    }
  };

  const formatTimeSeconds = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return <FullscreenLoader message="Đang soạn đề thi ngẫu nhiên..." />;
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-6">
        <span className="material-symbols-outlined text-6xl text-error mb-4">warning</span>
        <h2 className="text-xl font-bold font-headline mb-2">Không Thể Tạo Đề</h2>
        <p className="text-on-surface-variant text-sm mb-6">{errorMsg}</p>
        <button
          onClick={() => navigate('/test-center')}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-xl transition-all text-sm cursor-pointer"
        >
          Quay lại Test Center
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const isAnswered = !!currentAnswer;
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  return (
    <div className="flex flex-col min-h-[85vh] w-full max-w-3xl mx-auto py-6 px-4 animate-fade-in-up">
      {/* HEADER BAR */}
      <header className="bg-surface border border-outline-variant rounded-2xl p-3 sm:p-4 flex justify-between items-center gap-2 sm:gap-4 shadow-sm mb-1">
        <button
          onClick={handleQuit}
          className="flex items-center gap-1 sm:gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg px-2 py-1 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="hidden xs:inline">Thoát</span>
        </button>

        <div className="text-center flex-1 min-w-0">
          <div className="font-extrabold text-xs sm:text-sm font-headline truncate max-w-[90px] xs:max-w-[150px] sm:max-w-sm mx-auto">
            Bài Test {TYPE_LABELS[config.type] || TYPE_LABELS.vocab}
            {config.level !== 'all' ? ` - ${config.level}` : ''}
            {config.lesson !== 'all' ? ` - Bài ${config.lesson}` : ''}
          </div>
          <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70 mt-0.5 truncate">
            {config.mode === 'practice' ? 'Luyện tập' : 'Thi thử'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {config.time > 0 ? (
            <div className={`flex items-center gap-1 text-xs sm:text-sm font-bold font-mono ${remainingTime <= 60 ? 'text-error animate-pulse' : 'text-on-surface'}`}>
              <span className="material-symbols-outlined text-base sm:text-lg">timer</span>
              <span>{formatTimeSeconds(remainingTime)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-on-surface-variant/80 font-mono">
              <span className="material-symbols-outlined text-base sm:text-lg">schedule</span>
              <span>{formatTimeSeconds(timeTaken)}</span>
            </div>
          )}
          
          <div className="text-[10px] sm:text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            {currentIndex + 1}/{questions.length}
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="w-full bg-outline-variant h-1.5 rounded-full overflow-hidden mb-6 shadow-inner">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* QUESTION MAIN AREA */}
      <main className="flex-1 w-full bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-card flex flex-col justify-between">
        <div className="space-y-6">
          <div className="text-xs font-bold text-primary uppercase tracking-widest">
            Câu Hỏi {currentIndex + 1}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-headline leading-relaxed">
              Từ/Ký tự{' '}
              <span className="font-japanese text-3xl font-bold text-primary mx-1">
                {currentQuestion.prompt}
              </span>{' '}
              có nghĩa là gì?
            </h2>
            {currentQuestion.subPrompt && (
              <p className="text-sm text-on-surface-variant bg-surface-dim px-3 py-2 rounded-xl border border-outline-variant/55 inline-block font-medium max-w-full break-words">
                {currentQuestion.subPrompt}
              </p>
            )}
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-1 gap-3.5 mt-6">
            {currentQuestion.options.map((option, idx) => {
              const label = ['A', 'B', 'C', 'D'][idx];
              const isSelected = currentAnswer?.userAnswer === option;
              
              // Styling states
              let optionClass = 'border-outline-variant bg-surface hover:bg-surface-dim hover:border-primary/50';
              let labelClass = 'border-outline text-on-surface-variant';

              if (config.mode === 'practice') {
                const hasCorrectAnswer = isAnswered;
                const isCorrectOption = option === currentQuestion.answer;
                
                if (hasCorrectAnswer) {
                  if (isCorrectOption) {
                    optionClass = 'border-success bg-success-light text-success cursor-default';
                    labelClass = 'bg-success text-white border-success';
                  } else if (isSelected) {
                    optionClass = 'border-error bg-error-light/30 text-error cursor-default';
                    labelClass = 'bg-error text-white border-error';
                  } else {
                    optionClass = 'border-outline-variant bg-surface cursor-default opacity-60';
                    labelClass = 'border-outline text-on-surface-variant/40';
                  }
                } else if (isSelected) {
                  optionClass = 'border-primary bg-primary-50 text-primary-dark';
                  labelClass = 'bg-primary text-white border-primary';
                }
              } else {
                // Exam mode
                if (isSelected) {
                  optionClass = 'border-primary bg-primary-50 text-primary-dark';
                  labelClass = 'bg-primary text-white border-primary';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={isSubmitting}
                  className={`option-card flex items-center gap-3.5 w-full text-left font-medium p-4 border-2 rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${optionClass}`}
                >
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-colors ${labelClass}`}>
                    {label}
                  </span>
                  <span className="text-[14.5px] break-words flex-1 min-w-0">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback section (Practice Mode only) */}
          {config.mode === 'practice' && isAnswered && (
            <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3.5 animate-fade-in ${
              currentAnswer.correct
                ? 'bg-success-light border-success/20 text-success'
                : 'bg-error-light/30 border-error/20 text-error'
            }`}>
              <span className="material-symbols-outlined text-2xl fill-1 mt-0.5">
                {currentAnswer.correct ? 'check_circle' : 'cancel'}
              </span>
              <div>
                <h4 className="font-extrabold text-sm leading-none">
                  {currentAnswer.correct ? 'Chính xác!' : 'Sai rồi!'}
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1.5">
                  Đáp án đúng: <span className="font-bold text-success">{currentQuestion.answer}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center gap-2 sm:gap-4 mt-8 border-t border-outline-variant pt-5">
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0 || isSubmitting}
            className={`flex items-center gap-1 px-3 py-2 sm:px-5 sm:py-2.5 text-sm font-bold border border-outline rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              currentIndex === 0
                ? 'opacity-0 invisible pointer-events-none'
                : 'bg-surface text-on-surface hover:bg-surface-dim cursor-pointer'
            }`}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="hidden xs:inline">Câu trước</span>
            <span className="xs:hidden">Trước</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              type="button"
              disabled={isSubmitting || (config.mode === 'exam' && !isAnswered)}
              onClick={() => handleFinish(false)}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark ${
                isSubmitting 
                  ? 'bg-primary/50 cursor-not-allowed'
                  : config.mode === 'exam' && !isAnswered
                    ? 'bg-outline text-on-surface-variant/40 cursor-not-allowed shadow-none'
                    : 'bg-primary hover:bg-primary-dark cursor-pointer'
              }`}
            >
              Nộp Bài
              <span className="material-symbols-outlined text-lg">check</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!isAnswered && config.mode === 'practice'}
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className={`flex items-center justify-center gap-1 px-3 py-2 sm:px-5 sm:py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark ${
                !isAnswered && config.mode === 'practice'
                  ? 'bg-outline text-on-surface-variant/40 cursor-not-allowed shadow-none'
                  : 'bg-primary hover:bg-primary-dark cursor-pointer'
              }`}
            >
              <span className="hidden xs:inline">Câu tiếp theo</span>
              <span className="xs:hidden">Tiếp</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
