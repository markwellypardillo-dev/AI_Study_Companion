import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Coffee, Target, Award } from "lucide-react";

interface PomodoroTimerProps {
  mode: "focus" | "break";
  timeLeft: number;
  isRunning: boolean;
  setMode: (mode: "focus" | "break") => void;
  setTimeLeft: (time: number) => void;
  setIsRunning: (running: boolean) => void;
}

export default function PomodoroTimer({
  mode,
  timeLeft,
  isRunning,
  setMode,
  setTimeLeft,
  setIsRunning
}: PomodoroTimerProps) {
  const [earnedXpAward, setEarnedXpAward] = useState<boolean>(false);

  const initialTime = mode === "focus" ? 25 * 60 : 5 * 60;

  // Trigger a quick pulse if we transition from focus to break (completed focus!)
  useEffect(() => {
    if (mode === "break" && !isRunning && timeLeft === 5 * 60) {
      setEarnedXpAward(true);
      const timer = setTimeout(() => {
        setEarnedXpAward(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPct = ((initialTime - timeLeft) / initialTime) * 100;

  return (
    <div
      id="pomodoro-container"
      className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border-none rounded-3xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none"
    >
      <div className="flex items-center gap-2 mb-4">
        {mode === "focus" ? (
          <span className="flex items-center gap-1.5 px-3 bg-red-500/10 text-red-600 font-semibold py-1 rounded-full text-xs tracking-wider uppercase">
            <Target className="w-3.5 h-3.5" />
            Focus Round
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 bg-emerald-500/10 text-emerald-600 py-1 rounded-full text-xs tracking-wider uppercase">
            <Coffee className="w-3.5 h-3.5" />
            Short Break
          </span>
        )}
      </div>

      {/* Circle Timer dial */}
      <div className="relative w-44 h-44 flex items-center justify-center mb-6 shrink-0">
        <svg 
          className="w-full h-full transform -rotate-90 overflow-visible" 
          viewBox="0 0 176 176"
        >
          <circle
            cx="88"
            cy="88"
            r="80"
            className="stroke-zinc-200 dark:stroke-zinc-800/80 fill-transparent"
            strokeWidth="6"
          />
          <circle
            cx="88"
            cy="88"
            r="80"
            className={`fill-transparent transition-all duration-300 ${
              mode === "focus" ? "stroke-red-500" : "stroke-emerald-500"
            }`}
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 80}
            strokeDashoffset={2 * Math.PI * 80 * (1 - progressPct / 100)}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold font-mono tracking-tight text-black dark:text-white">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-ios-secondary-text mt-1 uppercase tracking-wider font-semibold">
            {isRunning ? "Studying..." : "Paused"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 w-full justify-center">
        <button
          id="btn-timer-reset"
          onClick={resetTimer}
          className="p-3 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-ios-secondary-text transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          id="btn-timer-toggle"
          onClick={toggleTimer}
          className={`px-8 py-3.5 rounded-full font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2 ${
            mode === "focus"
              ? "bg-red-500 hover:bg-red-650"
              : "bg-emerald-500 hover:bg-emerald-650"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-white" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> Start
            </>
          )}
        </button>

        <button
          id="btn-timer-skip"
          onClick={() => setMode(mode === "focus" ? "break" : "focus")}
          className="p-3 text-xs font-semibold text-ios-secondary-text hover:text-black dark:hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>

      {earnedXpAward && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-white dark:bg-amber-500/10 px-3 py-1.5 rounded-xl shadow-[0_2px_8px_rgba(245,158,11,0.15)] dark:shadow-none border-none animate-bounce">
          <Award className="w-3.5 h-3.5 animate-pulse" /> Focus Complete! +150 XP Earned
        </div>
      )}
    </div>
  );
}
