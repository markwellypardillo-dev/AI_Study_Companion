import { useState, useEffect } from "react";
import { HelpCircle, CheckCircle, XCircle, Award, RefreshCw, BookMarked, ArrowUpRight, Trophy, GraduationCap, FastForward, ShieldAlert } from "lucide-react";
import { AssessmentQuestion, DifficultyTier } from "../types";
import ReactMarkdown from "react-markdown";
import { triggerConfettiWithSound as confetti } from "../lib/sounds";
import { PRELOADED_SUBJECTS } from "../data/preloadedSubjects";

interface QuizViewProps {
  fileName: string;
  fileContent: string;
  onQuizSubmitted: (score: number, total: number, difficulty: DifficultyTier) => void;
  unlockedTiers: DifficultyTier[];
  onUnlockTier: (tier: DifficultyTier) => void;
}

export default function QuizView({
  fileName,
  fileContent,
  onQuizSubmitted,
  unlockedTiers,
  onUnlockTier
}: QuizViewProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier>("basic");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [checkedQuestions, setCheckedQuestions] = useState<{ [qId: string]: boolean }>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [calculatedScore, setCalculatedScore] = useState<number>(0);
  const [showAdaptiveMessage, setShowAdaptiveMessage] = useState<string | null>(null);

  // Load appropriate questions either from server or on tier change
  useEffect(() => {
    fetchQuestions(selectedDifficulty);
  }, [selectedDifficulty]);

  const fetchQuestions = async (tier: DifficultyTier) => {
    try {
      setLoading(true);
      setQuizFinished(false);
      setUserAnswers({});
      setCheckedQuestions({});
      setQuestions([]);
      setShowAdaptiveMessage(null);

      // Intercept preloaded subjects for Instant Trial offline reliability
      const matchedSubject = PRELOADED_SUBJECTS.find((p) => p.title === fileName);
      if (matchedSubject) {
        // Wait a tiny simulated half second for premium aesthetic feedback
        await new Promise((resolve) => setTimeout(resolve, 600));
        const tierQuiz = matchedSubject.assessments[tier];
        setQuestions(tierQuiz || []);
        return;
      }

      const response = await fetch("/api/generate-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          fileContent,
          difficulty: tier
        })
      });

      if (!response.ok) {
        throw new Error("Unable to synthesize assessment questions.");
      }

      const data = await response.json();
      setQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    if (quizFinished) return;
    setUserAnswers({
      ...userAnswers,
      [questionId]: option
    });
  };

  const handleSubmitQuiz = () => {
    let score = 0;

    questions.forEach((q) => {
      const uAns = (userAnswers[q.id] || "").trim().toLowerCase();
      const cAns = (q.correctAnswer || "").trim().toLowerCase();

      if (q.type === "mcq" || q.type === "tf") {
        if (uAns === cAns) score++;
      } else if (q.type === "fib" || q.type === "short") {
        // String matching check with high tolerance for blanks
        if (cAns && uAns.includes(cAns)) {
          score++;
        } else if (cAns.includes(uAns) && uAns.length > 1) {
          score++;
        }
      } else {
        // Essays/scenarios are self-evaluated side-by-side. 
        // We evaluate if user wrote a response of size > 15 characters, we consider positive index.
        if (uAns.length > 15) {
          score++;
        }
      }
    });

    setCalculatedScore(score);
    setQuizFinished(true);
    onQuizSubmitted(score, questions.length, selectedDifficulty);

    const percent = (score / questions.length) * 100;

    // Confetti and Gamification Level Up check
    if (percent >= 85) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });

      if (selectedDifficulty === "basic") {
        onUnlockTier("medium");
        setShowAdaptiveMessage("⭐ Adaptive level unlocked! Medium Difficulty quizzes are now OPEN!");
      } else if (selectedDifficulty === "medium") {
        onUnlockTier("hard");
        setShowAdaptiveMessage("🔥 Elite mind unlocked! Hard Difficulty essay and scenario assessments are now OPEN!");
      } else {
        setShowAdaptiveMessage("👑 Ultimate Academic Champion! You aced the Hard mode!");
      }
    } else {
      // Fun encouragement confetti
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ["#5A4BFF", "#a5b4fc"]
      });
    }
  };

  const setAnswerField = (questionId: string, value: string) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: value
    });
  };

  const handleAdvanceLevel = () => {
    if (selectedDifficulty === "basic") {
      setSelectedDifficulty("medium");
    } else if (selectedDifficulty === "medium") {
      setSelectedDifficulty("hard");
    }
    setShowAdaptiveMessage(null);
  };

  return (
    <div id="assessment-main-panel" className="max-w-3xl mx-auto py-4 px-2">
      
      {/* Level Select Game Rail */}
      <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl mb-8 shadow-sm">
        <h3 className="text-xs font-black text-ios-secondary-text uppercase tracking-widest mb-3 text-center">
          Adaptive Skill Progression Path
        </h3>
        <div className="grid grid-cols-3 gap-3 md:gap-4 w-full">
          {(["basic", "medium", "hard"] as DifficultyTier[]).map((tier) => {
            const isUnlocked = unlockedTiers.includes(tier);
            const isCurrent = selectedDifficulty === tier;
            return (
              <button
                key={tier}
                id={`btn-difficulty-${tier}`}
                onClick={() => isUnlocked && setSelectedDifficulty(tier)}
                disabled={!isUnlocked}
                className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-305 cursor-pointer ${
                  isCurrent
                    ? "border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 shadow-md scale-102"
                    : isUnlocked
                    ? "border-zinc-200 dark:border-zinc-800 bg-ios-light-secondary dark:bg-ios-dark-secondary hover:border-black dark:hover:border-white hover:opacity-90"
                    : "border-zinc-200/50 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-950 opacity-40 cursor-not-allowed"
                }`}
              >
                <span className="text-xs font-extrabold capitalize text-black dark:text-white">
                  {tier}
                </span>
                <span className="text-xxs text-ios-secondary-text mt-1 font-semibold">
                  {tier === "basic" ? "Quiz & MCQs" : tier === "medium" ? "Fill Blanks" : "Scenario / Essay"}
                </span>

                {!isUnlocked && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-ios-light-secondary dark:bg-ios-dark-secondary rounded-3xl border border-zinc-205 dark:border-zinc-850 shadow-sm flex flex-col items-center">
          <div className="relative w-12 h-12 mb-4">
            <span className="absolute inset-0 border-4 border-zinc-100 dark:border-zinc-900 rounded-full" />
            <span className="absolute inset-0 border-4 border-black dark:border-white rounded-full border-t-transparent animate-spin" />
          </div>
          <h4 className="text-base font-bold text-black dark:text-white mt-2 animate-pulse">
            AI is assembling questions...
          </h4>
          <p className="text-xs text-ios-secondary-text mt-1">
            Enforcing strict grounding against document payload
          </p>
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-6 animate-fade-in">
          {/* List of Questions */}
          {(questions || []).map((q, idx) => {
            const hasChecked = !!checkedQuestions[q.id];
            const uAns = userAnswers[q.id] || "";
            const isCorrect = uAns.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase();

            return (
              <div
                key={q.id}
                id={`assessment-question-card-${q.id}`}
                className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4 gap-2">
                  <span className="text-xxs uppercase tracking-wider font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2.5 py-1 rounded-lg">
                    Question {idx + 1} • {q.type.toUpperCase()}
                  </span>
                </div>

                <div className="text-sm font-extrabold text-black dark:text-white leading-relaxed mb-4"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{q.question}</ReactMarkdown></div>

                {/* BASIC MCQ & TRUE / FALSE Options */}
                {(q.type === "mcq" || q.type === "tf") && q.options && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt, oIdx) => {
                      const isSelected = uAns === opt;
                      return (
                        <button
                          key={oIdx}
                          id={`btn-question-${q.id}-opt-${oIdx}`}
                          onClick={() => handleSelectOption(q.id, opt)}
                          disabled={quizFinished}
                          className={`w-full text-left p-3.5 text-xs font-semibold rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "border-black dark:border-white bg-zinc-150 dark:bg-zinc-800 text-black dark:text-white"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white text-black dark:text-white"
                          }`}
                        >
                          <span>{opt}</span>
                          {quizFinished && opt === q.correctAnswer && (
                            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0 ml-2 animate-pulse" />
                          )}
                          {quizFinished && isSelected && opt !== q.correctAnswer && (
                            <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* MEDIUM Fill in the blanks & active recall */}
                {(q.type === "fib" || q.type === "short") && (
                  <div className="space-y-3 font-sans">
                    <input
                      id={`input-question-fib-text-${q.id}`}
                      type="text"
                      disabled={quizFinished}
                      placeholder={q.type === "fib" ? "Type the missing word..." : "Type your direct explanation..."}
                      value={uAns}
                      onChange={(e) => setAnswerField(q.id, e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white placeholder-zinc-400 transition-all font-semibold outline-none"
                    />

                    {quizFinished && (
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-xs space-y-1.5 border border-zinc-200/50 dark:border-zinc-850">
                        <p className="font-extrabold text-black dark:text-white flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          Correct Answer: <span className="text-zinc-900 dark:text-zinc-100 font-bold underline">{q.correctAnswer}</span>
                        </p>
                        <p className="text-ios-secondary-text font-medium">
                          Your answer: <span className="font-bold">{uAns || "(unanswered)"}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* HARD Critical thinking scenario / essay response */}
                {(q.type === "essay" || q.type === "scenario") && (
                  <div className="space-y-4">
                    <textarea
                      id={`input-question-essay-text-${q.id}`}
                      rows={4}
                      disabled={quizFinished}
                      placeholder="Synthesize your comprehensive response based strictly on the source document guidelines..."
                      value={uAns}
                      onChange={(e) => setAnswerField(q.id, e.target.value)}
                      className="w-full p-4 text-xs bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white placeholder-zinc-400 leading-relaxed font-sans transition-all outline-none resize-none"
                    />

                    {quizFinished && (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-855 rounded-2xl text-xs space-y-3">
                        <p className="font-black text-black dark:text-white flex items-center gap-1 text-xs">
                          <BookMarked className="w-4 h-4" /> Grading Guidelines and Ground Truth Metrics:
                        </p>
                        
                        <div className="space-y-1 bg-ios-light-bg dark:bg-ios-dark-bg p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <p className="font-bold text-black dark:text-white mb-1">Expert Reference Answer:</p>
                          <p className="text-ios-secondary-text leading-relaxed italic">{q.sampleAnswer}</p>
                        </div>

                        {q.gradingCriteria && (
                          <div className="space-y-1 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                            <p className="font-bold text-black dark:text-white">Required Grading Checklist points:</p>
                            <p className="text-ios-secondary-text leading-normal font-medium">{q.gradingCriteria}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {quizFinished && q.explanation && (
                  <div className="mt-4 p-3 bg-zinc-150/40 dark:bg-zinc-950/40 rounded-xl text-[11px] text-ios-secondary-text leading-relaxed border border-dashed border-zinc-200 dark:border-zinc-850">
                    <strong className="text-black dark:text-white font-bold">Explanation:</strong> <div className="mt-1"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{q.explanation}</ReactMarkdown></div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Active assessment submit button */}
          {!quizFinished ? (
            <button
              id="btn-submit-assessment-answers"
              onClick={handleSubmitQuiz}
              className="w-full py-4 bg-black dark:bg-white hover:opacity-90 text-white dark:text-black font-extrabold rounded-2xl hover:scale-101 active:scale-99 shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4.5 h-4.5" /> Complete Assessment and Calculate XP
            </button>
          ) : (
            /* Quiz Score Summary Card */
            <div
              id="quiz-results-card"
              className="bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-3xl p-8 text-center flex flex-col items-center shadow-lg"
            >
              <Trophy className="w-16 h-16 text-amber-500 animate-bounce mb-3" />
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                Assessment Synthesized!
              </h3>
              <p className="text-xs text-ios-secondary-text mt-1 max-w-sm mx-auto">
                All metrics have been computed. Check your performance dashboard profile below.
              </p>

              <div className="flex gap-8 my-6 bg-zinc-50 dark:bg-zinc-950 px-6 py-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-3xl font-black font-mono block text-zinc-900 dark:text-zinc-100">
                    {calculatedScore} / {questions.length}
                  </span>
                  <span className="text-xxs text-ios-secondary-text uppercase font-semibold">Grounded Score</span>
                </div>
                <div className="w-px bg-zinc-300 dark:bg-zinc-800" />
                <div>
                  <span className="text-3xl font-black font-mono block text-emerald-500">
                    +{calculatedScore * 100}
                  </span>
                  <span className="text-xxs text-ios-secondary-text uppercase font-semibold">XP Granted</span>
                </div>
              </div>

              {((calculatedScore / questions.length) * 100) >= 85 ? (
                <div className="text-emerald-600 font-extrabold text-sm mb-4">
                  🌟 Brilliant! You aced the exam with {(calculatedScore / questions.length * 100).toFixed(0)}%!
                </div>
              ) : (
                <div className="text-ios-secondary-text text-sm mb-4">
                  Keep working! Score above 85% to trigger progressive level unlocking.
                </div>
              )}

              {/* Dynamic progressive prompt banner */}
              {showAdaptiveMessage && (
                <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl max-w-md mx-auto mb-6">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{showAdaptiveMessage}</p>
                  
                  {(selectedDifficulty === "basic" || selectedDifficulty === "medium") && (
                    <button
                      id="btn-adaptive-advance"
                      onClick={handleAdvanceLevel}
                      className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:scale-105 active:scale-95 text-indigo-950 text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <FastForward className="w-3.5 h-3.5 fill-indigo-950" /> Advance to Next Difficulty Now
                    </button>
                  )}
                </div>
              )}

              <button
                id="btn-retry-assessment-quiz"
                onClick={() => fetchQuestions(selectedDifficulty)}
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-xs font-black rounded-xl hover:opacity-90 shadow-sm active:scale-95 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Run Alternate Assessment
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty / fallback state */
        <div className="text-center py-20 bg-ios-light-secondary dark:bg-ios-dark-secondary rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <ShieldAlert className="w-12 h-12 text-ios-secondary-text mx-auto mb-3" />
          <p className="text-sm font-bold text-ios-secondary-text">Could not initialize questions</p>
          <button
            id="btn-fallback-retry"
            onClick={() => fetchQuestions(selectedDifficulty)}
            className="mt-4 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            Retry Generation
          </button>
        </div>
      )}
    </div>
  );
}
