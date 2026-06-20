import React, { useState, useEffect, FormEvent } from "react";
import { 
  Flame, 
  Award, 
  BookOpen, 
  Clock, 
  Activity, 
  Target, 
  Zap, 
  RotateCcw, 
  Terminal, 
  FileText, 
  Eye, 
  EyeOff,
  PenTool,
  Trash2,
  Plus,
  Minus,
  Smile,
  Book
} from "lucide-react";
import { UserProgress, Track } from "../types";
import PomodoroTimer from "./PomodoroTimer";
import FocusMusicPlayer from "./FocusMusicPlayer";
import StudentOasis from "./StudentOasis";
import StudyLounge from "./StudyLounge";

interface JournalEntry {
  id: string;
  notes: string;
  mood: "focused" | "neutral" | "tired";
  timestamp: string;
  durationCompleted: number;
  dateStr?: string;
}

interface DashboardProps {
  user?: any;
  progress: UserProgress;
  onFocusComplete: (minutes: number) => void;
  onResetProgress: () => void;
  fileName?: string;
  fileContent?: string;
  timerMode: "focus" | "break";
  timeLeft: number;
  timerIsRunning: boolean;
  setTimerMode: (mode: "focus" | "break") => void;
  setTimeLeft: (time: number) => void;
  setTimerIsRunning: (running: boolean) => void;
  musicTracks: Track[];
  selectedTrackId: string;
  musicIsPlaying: boolean;
  musicVolume: number;
  musicIsMuted: boolean;
  musicSynthType: "40hz" | "pink" | null;
  musicError: string | null;
  onSelectTrack: (id: string, updatedTracks?: Track[]) => void;
  onTogglePlayMusic: () => void;
  onSetMusicVolume: (v: number) => void;
  onSetMusicIsMuted: (m: boolean) => void;
  onAddCustomTrack: (track: Track) => void;
  onRemoveCustomTrack: (id: string) => void;
  
  // Sleep Timer Enhancements
  sleepTimerMinutes: number | null;
  sleepTimerSecondsLeft: number;
  onSetSleepTimerMinutes: (min: number | null) => void;

  // Daily Goals Enhancements
  dailyFocusGoalRounds: number;
  onSetDailyFocusGoalRounds: (rounds: number) => void;

  onAddXp?: (amount: number) => void;
}

export default function Dashboard({
  user,
  progress,
  onFocusComplete,
  onResetProgress,
  fileName,
  fileContent,
  timerMode,
  timeLeft,
  timerIsRunning,
  setTimerMode,
  setTimeLeft,
  setTimerIsRunning,
  musicTracks,
  selectedTrackId,
  musicIsPlaying,
  musicVolume,
  musicIsMuted,
  musicSynthType,
  musicError,
  onSelectTrack,
  onTogglePlayMusic,
  onSetMusicVolume,
  onSetMusicIsMuted,
  onAddCustomTrack,
  onRemoveCustomTrack,
  sleepTimerMinutes,
  sleepTimerSecondsLeft,
  onSetSleepTimerMinutes,
  dailyFocusGoalRounds,
  onSetDailyFocusGoalRounds,
  onAddXp
}: DashboardProps) {
  const [showDebug, setShowDebug] = useState<boolean>(false);
  
  // Study journal local state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem("ai_study_companion_journal_entries");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newJournalNote, setNewJournalNote] = useState<string>("");
  const [newJournalMood, setNewJournalMood] = useState<"focused" | "neutral" | "tired">("focused");
  const [activeSessionMinutes, setActiveSessionMinutes] = useState<number>(25);

  const handleAddJournalEntry = (e: FormEvent) => {
    e.preventDefault();
    if (!newJournalNote.trim()) return;

    const newEntry: JournalEntry = {
      id: "journal-" + Date.now(),
      notes: newJournalNote.trim(),
      mood: newJournalMood,
      timestamp: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      durationCompleted: activeSessionMinutes,
      dateStr: new Date().toLocaleDateString("sv-SE")
    };

    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem("ai_study_companion_journal_entries", JSON.stringify(updated));
    setNewJournalNote("");
  };

  const handleRemoveJournalEntry = (id: string) => {
    const updated = journalEntries.filter((item) => item.id !== id);
    setJournalEntries(updated);
    localStorage.setItem("ai_study_companion_journal_entries", JSON.stringify(updated));
  };

  // Calendar Heatmap Simulator local state
  const [simulatedDates, setSimulatedDates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ai_study_companion_simulated_dates");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleSimulatedDate = (dateStr: string) => {
    let updated: string[];
    if (simulatedDates.includes(dateStr)) {
      updated = simulatedDates.filter((d) => d !== dateStr);
    } else {
      updated = [...simulatedDates, dateStr];
    }
    setSimulatedDates(updated);
    localStorage.setItem("ai_study_companion_simulated_dates", JSON.stringify(updated));
  };

  // Generate exactly 24 weeks of dates (ending on current week's Saturday, starting on Sunday 23 weeks ago)
  const gridDates = React.useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - today.getDay());
    
    const startSunday = new Date(currentSunday);
    startSunday.setDate(currentSunday.getDate() - 23 * 7);
    
    const temp = new Date(startSunday);
    for (let i = 0; i < 24 * 7; i++) {
      dates.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }
    return dates;
  }, []);

  // Compute completed study session metrics
  const studyActivityScores = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const hoverDetails: Record<string, string[]> = {};

    // 1. Quizzes from progress.quizHistory
    progress.quizHistory.forEach((raw) => {
      if (raw.date) {
        counts[raw.date] = (counts[raw.date] || 0) + 1;
        if (!hoverDetails[raw.date]) hoverDetails[raw.date] = [];
        hoverDetails[raw.date].push(`Graded Quiz: ${raw.score}/${raw.total}`);
      }
    });

    // 2. Tracked focus sessions
    try {
      const savedFocus = localStorage.getItem("ai_study_companion_completed_focus_dates");
      if (savedFocus) {
        const focusList = JSON.parse(savedFocus);
        if (Array.isArray(focusList)) {
          focusList.forEach((dateStr) => {
            counts[dateStr] = (counts[dateStr] || 0) + 1;
            if (!hoverDetails[dateStr]) hoverDetails[dateStr] = [];
            hoverDetails[dateStr].push("Completed 25m Pomodoro Round");
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Reflection journals from local state
    journalEntries.forEach((je) => {
      const dStr = je.dateStr;
      if (dStr) {
        counts[dStr] = (counts[dStr] || 0) + 1;
        if (!hoverDetails[dStr]) hoverDetails[dStr] = [];
        hoverDetails[dStr].push(`Logged Journal: Mood is ${je.mood}`);
      }
    });

    // 4. Simulated session completions (interactive click)
    simulatedDates.forEach((dateStr) => {
      counts[dateStr] = (counts[dateStr] || 0) + 1;
      if (!hoverDetails[dateStr]) hoverDetails[dateStr] = [];
      hoverDetails[dateStr].push("Simulated Study Completion");
    });

    return { counts, hoverDetails };
  }, [progress.quizHistory, journalEntries, simulatedDates]);

  // Compute dynamic daily statistical indicators
  const stats = React.useMemo(() => {
    // Compute continuous focus streak backward from today
    let streak = 0;
    const tempDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkStr = tempDate.toLocaleDateString("sv-SE");
      if ((studyActivityScores.counts[checkStr] || 0) > 0) {
        streak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        // If first check (today), allow streak to continue if yesterday was active
        if (i === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toLocaleDateString("sv-SE");
          if ((studyActivityScores.counts[yStr] || 0) > 0) {
            tempDate.setDate(tempDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    // Active days in this 24-week grid
    let activeInGrid = 0;
    gridDates.forEach((d) => {
      const dStr = d.toLocaleDateString("sv-SE");
      if ((studyActivityScores.counts[dStr] || 0) > 0) {
        activeInGrid++;
      }
    });

    const activeRatio = ((activeInGrid / 168) * 100).toFixed(0);

    return {
      currentStreak: streak,
      activeDaysCount: activeInGrid,
      consistencyRatio: activeRatio
    };
  }, [studyActivityScores, gridDates]);

  // Calculate average score safely
  const averageScore = progress.quizHistory.length > 0
    ? Math.round(
        (progress.quizHistory.reduce((acc, q) => acc + (q.score / q.total), 0) /
          progress.quizHistory.length) *
          100
      )
    : 0;

  const totalFocusMin = Math.round(progress.totalFocusSeconds / 60);

  return (
    <div id="dashboard-viewport" className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-[1400px] mx-auto py-2 px-2 sm:px-6 lg:px-12 xl:px-[1.5in]">
      
      {/* Column 1 & 2: Level progress & Analytics */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Level Card */}
        <div className="bg-brand-indigo text-white rounded-3xl p-6 shadow-[0_4px_22px_rgba(90,75,255,0.25)] relative overflow-hidden">
          {/* Ambient background decoration */}
          <span className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <span className="absolute -top-10 -left-10 w-32 h-32 bg-white/15 rounded-full blur-xl" />

          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] font-black uppercase bg-white/20 text-white/90 px-3 py-1 rounded-full tracking-wider">
                Student Profile Status
              </span>
              <h2 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-1.5 text-white">
                Level {progress.level} Scholar <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
              </h2>
            </div>
            
            <span className="text-3xl font-black font-mono tracking-tight text-white/90">
              {progress.xp} <span className="text-xs uppercase text-white/70 font-bold font-sans">XP</span>
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2 mt-6">
            <div className="flex justify-between text-xs font-semibold text-white/90">
              <span>{progress.xp} XP Earned</span>
              <span>Need {progress.xpToNextLevel} XP to Level UP</span>
            </div>
            {/* Visual Bar */}
            <div className="w-full h-3 bg-black/25 rounded-full overflow-hidden border border-white/20">
              <div
                className="h-full bg-white rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${Math.min((progress.xp / progress.xpToNextLevel) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Study Target */}
        <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-5 justify-between select-none">
          <div className="flex items-center gap-4.5 min-w-0 flex-1 w-full">
            {/* SVG Progress Circle Dial */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
              <svg 
                className="w-full h-full transform -rotate-90 overflow-visible" 
                viewBox="0 0 80 80"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-zinc-100 dark:stroke-zinc-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-brand-indigo transition-all duration-1000 ease-out"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - Math.min(Math.floor(progress.totalFocusSeconds / 1500) / dailyFocusGoalRounds, 1))}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-black font-mono text-black dark:text-white">
                  {Math.round(Math.min((Math.floor(progress.totalFocusSeconds / 1500) / dailyFocusGoalRounds) * 100, 100))}%
                </span>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-ios-secondary-text">Goal</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-[13px] sm:text-sm text-zinc-950 dark:text-white flex items-center gap-1.5 break-words">
                Target Action Plan <Target className="w-4 h-4 text-brand-indigo shrink-0" />
              </h3>
              <p className="text-[11px] sm:text-xs text-ios-secondary-text mt-1 max-w-md leading-normal font-sans">
                Complete and log Pomodoro intervals to achieve your customizable Daily Target: <strong className="text-brand-indigo">{dailyFocusGoalRounds} rounds</strong> today!
              </p>
            </div>
          </div>

          {/* Stepper Controllers */}
          <div className="flex items-center justify-between gap-5 bg-ios-light-bg dark:bg-ios-dark-bg px-4 py-2.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-950 w-full md:w-auto shrink-0 uppercase font-bold text-[10px]">
            <span className="text-ios-secondary-text tracking-wide font-sans md:hidden">Goal target:</span>
            <div className="flex items-center gap-3 font-sans w-full md:w-auto justify-end md:justify-center">
              <button
                type="button"
                id="btn-decrement-goal"
                disabled={dailyFocusGoalRounds <= 1}
                onClick={() => {
                  const val = Math.max(1, dailyFocusGoalRounds - 1);
                  onSetDailyFocusGoalRounds(val);
                  localStorage.setItem("ai_study_companion_daily_goal", val.toString());
                }}
                className="p-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 opacity-80 hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="font-extrabold font-mono text-xs text-black dark:text-white bg-zinc-200/30 dark:bg-zinc-800/60 px-2.5 py-0.5 rounded-md min-w-[2rem] text-center">
                {dailyFocusGoalRounds}
              </span>

              <button
                type="button"
                id="btn-increment-goal"
                disabled={dailyFocusGoalRounds >= 12}
                onClick={() => {
                  const val = Math.min(12, dailyFocusGoalRounds + 1);
                  onSetDailyFocusGoalRounds(val);
                  localStorage.setItem("ai_study_companion_daily_goal", val.toString());
                }}
                className="p-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 opacity-80 hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bento Grid Analytics Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          
          {/* Stats 1: Streak */}
          <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
            <div className="p-2 sm:p-3 bg-red-500/10 dark:bg-red-950/40 rounded-xl shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 fill-red-500" />
            </div>
            <div>
              <span className="text-base sm:text-2xl font-black font-mono block text-black dark:text-white leading-tight">
                {progress.dailyStreak} {progress.dailyStreak === 1 ? "Day" : "Days"}
              </span>
              <span className="text-[10px] sm:text-xs text-ios-secondary-text block mt-0.5 sm:mt-0 font-bold sm:font-medium leading-tight">Daily Study Streak</span>
            </div>
          </div>

          {/* Stats 2: Focus Hours */}
          <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
            <div className="p-2 sm:p-3 bg-brand-indigo/10 rounded-xl shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand-indigo" />
            </div>
            <div>
              <span className="text-base sm:text-2xl font-black font-mono block text-black dark:text-white leading-tight">
                {totalFocusMin} Min
              </span>
              <span className="text-[10px] sm:text-xs text-ios-secondary-text block mt-0.5 sm:mt-0 font-bold sm:font-medium leading-tight font-sans">Focus Study Time</span>
            </div>
          </div>

          {/* Stats 3: Academic Mastery % */}
          <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
            <div className="p-2 sm:p-3 bg-brand-indigo/10 rounded-xl shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-brand-indigo" />
            </div>
            <div>
              <span className="text-base sm:text-2xl font-black font-mono block text-black dark:text-white leading-tight">
                {averageScore}%
              </span>
              <span className="text-[10px] sm:text-xs text-ios-secondary-text block mt-0.5 sm:mt-0 font-bold sm:font-medium leading-tight">Average Quiz Score</span>
            </div>
          </div>

          {/* Stats 4: Mastered Terms */}
          <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
            <div className="p-2 sm:p-3 bg-brand-indigo/10 rounded-xl shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-brand-indigo" />
            </div>
            <div>
              <span className="text-base sm:text-2xl font-black font-mono block text-black dark:text-white leading-tight">
                {progress.masteredTermsCount} Words
              </span>
              <span className="text-[10px] sm:text-xs text-ios-secondary-text block mt-0.5 sm:mt-0 font-bold sm:font-medium leading-tight">Flashcards Mastered</span>
            </div>
          </div>

        </div>

        {/* Mobile-only Built-in Pomodoro Space */}
        <div className="block lg:hidden space-y-3">
          <h3 className="text-xs font-black text-ios-secondary-text uppercase tracking-widest flex items-center gap-1 font-sans">
            <BookOpen className="w-3.5 h-3.5 animate-pulse text-brand-indigo" /> Built-in Pomodoro Space
          </h3>
          <PomodoroTimer
            mode={timerMode}
            timeLeft={timeLeft}
            isRunning={timerIsRunning}
            setMode={setTimerMode}
            setTimeLeft={setTimeLeft}
            setIsRunning={setTimerIsRunning}
          />
        </div>

        {/* Study Consistency Heatmap Block */}
        <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-brand-indigo" />
              <div>
                <h3 className="font-extrabold text-[13px] sm:text-sm text-zinc-950 dark:text-white leading-tight">Study Consistency Grid</h3>
                <span className="text-[11px] sm:text-xs text-ios-secondary-text font-medium mt-0.5 block">Visualize your daily focus metrics in real-time</span>
              </div>
            </div>

            {/* Micro badges */}
            <div className="flex items-center gap-2 flex-wrap max-w-full">
              <span className="text-[10px] px-2.5 py-1 bg-brand-indigo/10 text-brand-indigo font-black rounded-lg flex items-center gap-1 font-sans">
                🔥 {stats.currentStreak} Day Streak
              </span>
              <span className="text-[10px] px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black rounded-lg flex items-center gap-1 font-sans">
                ✅ {stats.activeDaysCount} Days Active
              </span>
              <span className="text-[10px] px-2.5 py-1 bg-zinc-200/60 dark:bg-zinc-800 text-zinc-655 dark:text-zinc-300 font-black rounded-lg font-sans">
                🎯 {stats.consistencyRatio}% Ratio
              </span>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-ios-secondary-text leading-normal font-medium">
            Every logged Pomodoro round, completed quiz, or reflection journal entry builds your daily learning streak! 
            <strong className="text-brand-indigo ml-1 font-semibold">💡 Click any grid square</strong> to toggle a &quot;Simulated Completed Study Session&quot; for that day and watch your analytics grow!
          </p>

          <div className="border border-zinc-200/50 dark:border-zinc-900/60 p-4.5 rounded-2xl bg-ios-light-bg dark:bg-ios-dark-bg space-y-3">
            {/* Layout combining Weekdays left + Scrolling Grid (with Month headers built-in) right */}
            <div className="flex items-start">
              {/* Vertical list of weekday tags */}
              <div className="flex flex-col select-none pr-1.5 text-[8px] font-bold uppercase text-zinc-400 dark:text-zinc-500 font-mono text-right w-5 pt-3.5 shrink-0 gap-[4px]">
                <span className="h-[10px] flex items-center justify-end">Su</span>
                <span className="h-[10px] flex items-center justify-end" />
                <span className="h-[10px] flex items-center justify-end">Tu</span>
                <span className="h-[10px] flex items-center justify-end" />
                <span className="h-[10px] flex items-center justify-end">Th</span>
                <span className="h-[10px] flex items-center justify-end" />
                <span className="h-[10px] flex items-center justify-end">Sa</span>
              </div>

              {/* Horizontally scrolling wrapper containing BOTH the Month header AND the column-major grid */}
              <div className="flex-1 overflow-x-auto pb-1 scrollbar-thin">
                <div className="min-w-[420px] space-y-1">
                  
                  {/* Months Header Line nested inside scroll-area */}
                  <div className="select-none grid" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))', gap: '4px' }}>
                    {Array.from({ length: 24 }).map((_, colIndex) => {
                      const colSunday = gridDates[colIndex * 7];
                      const prevSunday = colIndex > 0 ? gridDates[(colIndex - 1) * 7] : null;
                      const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const isNewMonth = colIndex === 0 || (prevSunday && colSunday.getMonth() !== prevSunday.getMonth());
                      return (
                        <span key={colIndex} className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 truncate text-left select-none font-mono">
                          {isNewMonth ? monthsShort[colSunday.getMonth()] : ""}
                        </span>
                      );
                    })}
                  </div>

                  {/* Grid squares */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
                      gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
                      gridAutoFlow: 'column',
                      gap: '4px'
                    }}
                  >
                    {gridDates.map((date) => {
                      const dateStr = date.toLocaleDateString("sv-SE");
                      const count = studyActivityScores.counts[dateStr] || 0;
                      const detailsList = studyActivityScores.hoverDetails[dateStr] || [];

                      // Color assignment categories
                      let bgCol = "bg-zinc-200/50 dark:bg-zinc-800/80";
                      if (count === 1) bgCol = "bg-brand-indigo/15 dark:bg-brand-indigo/10";
                      else if (count === 2) bgCol = "bg-brand-indigo/35 dark:bg-brand-indigo/25";
                      else if (count === 3) bgCol = "bg-brand-indigo/65 dark:bg-brand-indigo/50";
                      else if (count >= 4) bgCol = "bg-brand-indigo shadow-[0_0_6px_rgba(90,75,255,0.3)]";

                      const formattedDate = date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      });

                      return (
                        <div key={dateStr} className="relative group">
                          <button
                            type="button"
                            onClick={() => handleToggleSimulatedDate(dateStr)}
                            className={`w-full aspect-square rounded-[2px] transition-all cursor-pointer ${bgCol} hover:ring-2 hover:ring-brand-indigo/80 dark:hover:ring-brand-indigo/100`}
                            style={{ outline: "none" }}
                            title={`${formattedDate}: ${count} study sessions`}
                          />
                          {/* Tooltip content nested inside */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 min-w-[180px] bg-zinc-950/95 dark:bg-neutral-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 shadow-xl text-[9px] leading-relaxed text-center text-white font-sans">
                            <strong className="font-sans font-extrabold block text-white/95">{formattedDate}</strong>
                            <span className="text-zinc-300 font-medium block mt-0.5">
                              {count === 0 ? "No study activities completed" : `${count} study sessions completed`}
                            </span>
                            {detailsList.length > 0 && (
                              <div className="mt-1 flex flex-col gap-0.5 border-t border-zinc-800 pt-1 text-[8px] text-brand-indigo font-bold">
                                {detailsList.map((itm, keyIdx) => (
                                  <span key={keyIdx} className="block">• {itm}</span>
                                ))}
                              </div>
                            )}
                            <span className="text-[7.5px] text-zinc-500 mt-1 block border-t border-zinc-800/60 pt-1 font-mono uppercase">
                              Click to toggle mock session
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Heatmap Legend row */}
            <div className="flex items-center justify-between text-[9px] text-ios-secondary-text pt-2 border-t border-zinc-200/30 dark:border-zinc-900/30 font-semibold font-sans uppercase">
              <span>Less focus</span>
              <div className="flex items-center gap-1 pl-1">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-200/50 dark:bg-zinc-800/80" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-brand-indigo/15 dark:bg-brand-indigo/10" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-brand-indigo/35 dark:bg-brand-indigo/25" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-brand-indigo/65 dark:bg-brand-indigo/50" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-brand-indigo shadow-[0_0_6px_rgba(90,75,255,0.3)]" />
              </div>
              <span className="pr-1 font-sans">More focus</span>
            </div>
          </div>
        </div>

        {/* Quiz Grade History Logs */}
        <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-brand-indigo" />
            <h3 className="font-extrabold text-[13px] sm:text-sm text-zinc-950 dark:text-white leading-tight">Academic Assessment History</h3>
          </div>

          {progress.quizHistory.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {progress.quizHistory.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 bg-ios-light-bg dark:bg-ios-dark-bg rounded-xl border border-zinc-200/50 dark:border-zinc-900/50"
                >
                  <div>
                    <h4 className="text-xs font-extrabold text-black dark:text-white line-clamp-1">
                      {log.fileName.replace(/\.[^/.]+$/, "")}
                    </h4>
                    <span className="text-[10px] sm:text-[11px] text-ios-secondary-text mt-0.5 inline-block capitalize font-medium">
                      Difficulty: <strong className="text-brand-indigo font-bold">{log.difficulty}</strong> • {log.date}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-black text-brand-indigo font-mono">
                      {log.score} / {log.total}
                    </span>
                    <span className="text-[10px] sm:text-[11px] block text-ios-secondary-text mt-0.5">
                      {((log.score / log.total) * 100).toFixed(0)}% Correct
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-ios-secondary-text text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
              No quiz records available. Run an assessment to save statistics.
            </div>
          )}
        </div>

        {/* Dynamic Study Journal Notebook */}
        <div id="reflection-journal-section" className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-indigo/10 rounded-lg">
              <PenTool className="w-4 h-4 text-brand-indigo" />
            </div>
            <h3 className="font-extrabold text-[13px] sm:text-sm text-zinc-950 dark:text-white leading-tight">Active Session Reflection Journal</h3>
          </div>

          <p className="text-[11px] sm:text-xs text-ios-secondary-text leading-relaxed font-sans">
            Solidify what you studied! Active cognitive retrieval—like reflecting on your completed Pomodoro intervals—multiplies conceptual memory recall.
          </p>

          <form onSubmit={handleAddJournalEntry} className="space-y-4 bg-ios-light-bg dark:bg-ios-dark-bg p-4 sm:p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-950">
            <div className="space-y-1.5">
              <label htmlFor="journal-note-textarea" className="text-[10px] font-black text-brand-indigo uppercase tracking-wider block font-sans">
                💡 Lesson Notes & Key Realizations
              </label>
              <textarea
                id="journal-note-textarea"
                value={newJournalNote}
                onChange={(e) => setNewJournalNote(e.target.value)}
                placeholder="What formulas, vocabulary, or systems did you commit to memory? (e.g., Reviewed mitochondria electron transfer chains...)"
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none placeholder:text-zinc-400 select-text font-medium min-h-[90px] resize-none leading-relaxed transition-all duration-250"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-ios-secondary-text uppercase tracking-wider block font-sans">
                Focus Mind State
              </span>
              <div className="grid grid-cols-3 gap-2 w-full">
                {(["focused", "neutral", "tired"] as const).map((m) => {
                  const isActive = newJournalMood === m;
                  let emoji = "😄";
                  if (m === "neutral") emoji = "😐";
                  else if (m === "tired") emoji = "😴";

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewJournalMood(m)}
                      className={`py-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 border font-sans ${
                        isActive
                          ? "bg-brand-indigo text-white border-brand-indigo shadow-[0_2px_8px_rgba(90,75,255,0.25)] scale-[1.02]"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      <span className="text-xs sm:text-sm">{emoji}</span>
                      <span className="capitalize text-[9px] sm:text-[10px] font-bold">{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submission triggers wrapped inside full size column or row depending on widths */}
            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={!newJournalNote.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-brand-indigo hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl transition-all shadow-[0_2px_10px_rgba(90,75,255,0.15)] flex items-center justify-center gap-1.5 font-sans"
              >
                <PenTool className="w-3.5 h-3.5 text-white" /> Log Reflection Note
              </button>
            </div>
          </form>

          {/* Journal listings */}
          {journalEntries.length > 0 ? (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {journalEntries.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-ios-light-bg dark:bg-ios-dark-bg rounded-xl border border-zinc-200/40 dark:border-zinc-900/40 space-y-1.5 relative group"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveJournalEntry(item.id)}
                    className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-red-500/15 text-ios-secondary-text hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" title={`Mood: ${item.mood}`}>
                      {item.mood === "focused" ? "😄" : item.mood === "neutral" ? "😐" : "😴"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-medium font-sans">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-black dark:text-zinc-100 font-medium leading-relaxed break-words select-text font-sans">
                    {item.notes}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-ios-secondary-text text-xxs font-medium border border-dashed border-zinc-300 dark:border-zinc-805 rounded-2xl">
              No reflection journals logged yet. Wrap up your study session by logging notes above!
            </div>
          )}
        </div>

        {/* Document Parsing Debug Inspector panel */}
        <div id="document-parsing-debug-panel" className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-brand-indigo" />
              <h3 className="font-extrabold text-[13px] sm:text-sm text-zinc-950 dark:text-white leading-tight">Extracted Document Text</h3>
            </div>
            
            <button
              id="btn-toggle-debug-view"
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-brand-indigo/10 text-brand-indigo hover:opacity-85 self-start sm:self-auto shadow-sm"
            >
              {showDebug ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide Text
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Show Text
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] sm:text-xs text-ios-secondary-text leading-normal">
            View the raw text extracted from your document.
          </p>

          {showDebug && (
            <div className="space-y-4 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* File Metadata Stat 1 */}
                <div className="p-3 bg-ios-light-bg dark:bg-ios-dark-bg rounded-xl border border-zinc-200/50 dark:border-zinc-900/30">
                  <span className="text-[10px] sm:text-[11px] text-ios-secondary-text uppercase tracking-wider block font-bold">Active Loaded File</span>
                  <span className="text-xs font-extrabold text-black dark:text-white font-mono truncate block mt-0.5" title={fileName || "No document loaded"}>
                    {fileName || "No active document parsed"}
                  </span>
                </div>

                {/* File Metadata Stat 2 */}
                <div className="p-3 bg-ios-light-bg dark:bg-ios-dark-bg rounded-xl border border-zinc-200/50 dark:border-zinc-900/30">
                  <span className="text-[10px] sm:text-[11px] text-ios-secondary-text uppercase tracking-wider block font-bold">Extraction Metrics</span>
                  <span className="text-xs font-black text-brand-indigo mt-0.5 block font-mono">
                    {fileContent ? fileContent.length.toLocaleString() : 0} chars • {fileContent ? fileContent.trim().split(/\s+/).filter(Boolean).length.toLocaleString() : 0} words
                  </span>
                </div>
              </div>

              {/* Text Area scrollbox with content */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] sm:text-[11px] font-bold text-ios-secondary-text uppercase tracking-wide flex items-center gap-1">
                    <FileText className="w-3 h-3 text-ios-secondary-text" /> Document Preview (First 2,000 Characters)
                  </label>
                </div>
                
                {fileContent ? (
                  <div className="bg-black text-brand-indigo/85 p-4 rounded-2xl font-mono text-[10px] sm:text-xs whitespace-pre-wrap overflow-y-auto max-h-56 leading-relaxed border border-zinc-900/70 select-text">
                    {fileContent.slice(0, 2000)}
                    {fileContent.length > 2000 && (
                      <span className="text-ios-secondary-text block italic mt-2 border-t border-zinc-900/70 pt-2 font-sans font-medium">
                        ... [+ {fileContent.length - 2000} additional characters extracted from this subject outline]
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[10px] sm:text-xs text-ios-secondary-text border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl font-mono">
                    No text extracted yet. Please upload a PDF, DOCX, PPTX, or TXT document first.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear Stats Data option */}
        <div className="flex justify-end pt-2">
          <button
            id="btn-reset-dashboard-data"
            onClick={() => {
              if (confirm("Are you sure you want to restore factory defaults? This clears your XP levels and log histories.")) {
                onResetProgress();
              }
            }}
            className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-ios-secondary-text hover:text-red-500 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Factory Reset Stats
          </button>
        </div>

      </div>

      {/* Column 3: Beautiful Built-in Pomodoro Space */}
      <div className="space-y-6">
        <div className="hidden lg:block select-none">
          <h3 className="text-xs font-black text-ios-secondary-text uppercase tracking-widest mb-4 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 animate-pulse text-brand-indigo" /> Built-in Pomodoro Space
          </h3>
          <PomodoroTimer
            mode={timerMode}
            timeLeft={timeLeft}
            isRunning={timerIsRunning}
            setMode={setTimerMode}
            setTimeLeft={setTimeLeft}
            setIsRunning={setTimerIsRunning}
          />
        </div>

        <FocusMusicPlayer
          tracks={musicTracks}
          selectedTrackId={selectedTrackId}
          isPlaying={musicIsPlaying}
          volume={musicVolume}
          isMuted={musicIsMuted}
          synthType={musicSynthType}
          audioError={musicError}
          onSelectTrack={onSelectTrack}
          onTogglePlay={onTogglePlayMusic}
          onSetVolume={onSetMusicVolume}
          onSetIsMuted={onSetMusicIsMuted}
          onAddCustomTrack={onAddCustomTrack}
          onRemoveCustomTrack={onRemoveCustomTrack}
          sleepTimerMinutes={sleepTimerMinutes}
          sleepTimerSecondsLeft={sleepTimerSecondsLeft}
          onSetSleepTimerMinutes={onSetSleepTimerMinutes}
        />

        <StudentOasis 
          progress={progress} 
          onAddXp={onAddXp} 
          journalCount={journalEntries.length} 
        />

        <StudyLounge user={user} />

        {/* Quick motivational cards */}
        <div className="bg-brand-indigo/10 border border-brand-indigo/20 rounded-2xl p-4.5 flex gap-3 text-brand-indigo">
          <Target className="w-5 h-5 shrink-0 text-brand-indigo mt-0.5" />
          <div>
            <h4 className="text-xs font-black">Ready to ace a Hard quiz?</h4>
            <p className="text-[11px] sm:text-xs text-brand-indigo/80 mt-1 leading-normal font-sans">
              Studying with Pomodoro focus rounds unlocks deeper recall. Earn +150 XP on every successful focus round and trigger levels!
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
