import React, { useState, useEffect, FormEvent } from "react";
import { 
  Flame, 
  Award, 
  BookOpen, 
  Clock, 
  Activity, 
  Target, 
  Zap, 
  PenTool,
  Trash2,
  Plus,
  Minus,
  Smile,
  Book,
  Info
} from "lucide-react";
import { UserProgress, Track } from "../types";
import PomodoroTimer from "./PomodoroTimer";
import FocusMusicPlayer from "./FocusMusicPlayer";
import StudentOasis from "./StudentOasis";
import StudyLounge from "./StudyLounge";
import AdminPanel from "./AdminPanel";

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
  onUpdateProgress?: (updates: Partial<UserProgress>) => void;
}

const getLocalISOString = (d: Date) => {
  // Use local parts to build YYYY-MM-DD
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

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
  onAddXp,
  onUpdateProgress
}: DashboardProps) {
  const [showGridHelp, setShowGridHelp] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "journal">("overview");
  const [showJournalHelp, setShowJournalHelp] = useState<boolean>(false);
  const [showQuizHelp, setShowQuizHelp] = useState<boolean>(false);
  
  // Study journal local state
  const [journalEntries, setJournalEntries] = useState<any[]>([]);

  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    if (user) {
      import("../lib/db").then(({ syncJournalEntries }) => {
        if (!isMounted) {
          const unsub = syncJournalEntries(setJournalEntries);
          unsub();
        } else {
          unsubscribe = syncJournalEntries(setJournalEntries);
        }
      });
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const [newJournalNote, setNewJournalNote] = useState<string>("");
  const [newJournalMood, setNewJournalMood] = useState<"focused" | "neutral" | "tired">("focused");
  const [activeSessionMinutes, setActiveSessionMinutes] = useState<number>(25);

  const handleAddJournalEntry = async (e: FormEvent) => {
    e.preventDefault();
    if (!newJournalNote.trim()) return;

    const newEntry = {
      id: "journal-" + Date.now(),
      notes: newJournalNote.trim(),
      mood: newJournalMood,
      timestamp: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      durationCompleted: activeSessionMinutes,
      dateStr: getLocalISOString(new Date())
    };

    const { addJournalEntry } = await import("../lib/db");
    await addJournalEntry(newEntry);
    
    // Increment focus seconds in user progress and reward XP
    if (activeSessionMinutes > 0) {
      onFocusComplete(activeSessionMinutes);
    }

    // Also update local for immediate feedback
    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem("ai_study_companion_journal_entries", JSON.stringify(updated));
    window.dispatchEvent(new Event("local-activity-updated"));
    setNewJournalNote("");
  };

  const handleRemoveJournalEntry = async (id: string) => {
    const { deleteJournalEntry } = await import("../lib/db");
    await deleteJournalEntry(id);

    const updated = journalEntries.filter((item) => item.id !== id);
    setJournalEntries(updated);
    localStorage.setItem("ai_study_companion_journal_entries", JSON.stringify(updated));
    window.dispatchEvent(new Event("local-activity-updated"));
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
    window.dispatchEvent(new Event("local-activity-updated"));
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
    // Active days in this 24-week grid
    let activeInGrid = 0;
    gridDates.forEach((d) => {
      const dStr = getLocalISOString(d);
      if ((studyActivityScores.counts[dStr] || 0) > 0) {
        activeInGrid++;
      }
    });

    const activeRatio = ((activeInGrid / 168) * 100).toFixed(0);

    return {
      currentStreak: progress.dailyStreak,
      activeDaysCount: activeInGrid,
      consistencyRatio: activeRatio
    };
  }, [studyActivityScores, gridDates, progress.dailyStreak]);

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
    <div id="dashboard-viewport" className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto py-2 px-2 sm:px-6 lg:px-12 xl:px-[1.5in]">
      
      {/* Tabs Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-200 dark:border-zinc-800">
         <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-colors ${activeTab === 'overview' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}>Overview</button>
         <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-colors ${activeTab === 'analytics' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}>Analytics</button>
         <button onClick={() => setActiveTab('journal')} className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-colors ${activeTab === 'journal' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}>Journal</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 grid-flow-row">
      
      {/* Admin Panel */}
      {user?.email === "pmarkwelly@gmail.com" && onUpdateProgress && (
        <div className="lg:col-span-12 order-first">
          <AdminPanel progress={progress} onUpdateProgress={onUpdateProgress} user={user} />
        </div>
      )}

      {/* OVERVIEW CONTENT */}
        <div className={`lg:col-span-7 flex flex-col order-1 ${activeTab === 'overview' ? 'flex' : 'hidden'}`}>
        {/* Level Card */}
        <div className="bg-black dark:bg-white text-white dark:text-black rounded-3xl p-6 shadow-[0_4px_22px_rgba(0,0,0,0.1)] relative overflow-hidden">
          {/* Ambient background decoration */}
          <span className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 dark:bg-black/5 rounded-full blur-2xl" />
          <span className="absolute -top-10 -left-10 w-32 h-32 bg-white/15 dark:bg-black/5 rounded-full blur-xl" />

          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] font-black uppercase bg-white/20 dark:bg-black/10 text-white/90 dark:text-black/80 px-3 py-1 rounded-full tracking-wider">
                Student Profile Status
              </span>
              <h2 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-1.5 text-white dark:text-black">
                Level {progress.level} Scholar <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
              </h2>
            </div>
            
            <span className="text-3xl font-black font-mono tracking-tight text-white/90 dark:text-black/90">
              {progress.xp} <span className="text-xs uppercase text-white/70 dark:text-black/70 font-bold font-sans">XP</span>
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2 mt-6">
            <div className="flex justify-between text-xs font-semibold text-white/90 dark:text-black/90">
              <span>{progress.xp} XP Earned</span>
              <span>Need {progress.xpToNextLevel} XP to Level UP</span>
            </div>
            {/* Visual Bar */}
            <div className="w-full h-3 bg-black/25 dark:bg-black/10 rounded-full overflow-hidden border border-white/20 dark:border-black/10">
              <div
                className="h-full bg-white dark:bg-black rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${Math.min((progress.xp / progress.xpToNextLevel) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        </div>
        
        <div className={`lg:col-span-5 flex flex-col order-2 ${activeTab === 'overview' ? 'flex' : 'hidden'}`}>
        {/* Daily Study Target */}
        <div className="bg-ios-light-secondary h-full w-full dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-5 justify-between select-none">
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
                  className="stroke-black dark:stroke-white transition-all duration-1000 ease-out"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - Math.min((progress.totalFocusSeconds / 1500) / dailyFocusGoalRounds, 1))}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-black font-mono text-black dark:text-white">
                  {Math.round(Math.min(((progress.totalFocusSeconds / 1500) / dailyFocusGoalRounds) * 100, 100))}%
                </span>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-ios-secondary-text">Goal</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-[13px] sm:text-sm text-zinc-950 dark:text-white flex items-center gap-1.5 break-words">
                Target Action Plan <Target className="w-4 h-4 text-zinc-950 dark:text-zinc-50 shrink-0" />
              </h3>
              <p className="text-[11px] sm:text-xs text-ios-secondary-text mt-1 max-w-md leading-normal font-sans">
                Complete and log Pomodoro intervals to achieve your customizable Daily Target: <strong className="text-zinc-950 dark:text-zinc-50">{dailyFocusGoalRounds} rounds</strong> today!
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

        </div>

        {/* ANALYTICS CONTENT */}
        <div className={`lg:col-span-8 flex flex-col order-1 ${activeTab === 'analytics' ? 'flex' : 'hidden'}`}>
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
            <div className="p-2 sm:p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-950 dark:text-zinc-50" />
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
            <div className="p-2 sm:p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-950 dark:text-zinc-50" />
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
            <div className="p-2 sm:p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-950 dark:text-zinc-50" />
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
            <BookOpen className="w-3.5 h-3.5 animate-pulse text-zinc-950 dark:text-zinc-50" /> Built-in Pomodoro Space
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
        
        <div className="h-6 lg:hidden"></div>

        {/* Study Consistency Heatmap Block */}
        <StudyLounge user={user} />
        
        <div className="h-6 lg:hidden"></div>
        <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-zinc-950 dark:text-zinc-50" />
              <div>
                <h3 className="font-extrabold text-[13px] sm:text-sm text-zinc-950 dark:text-white leading-tight">Study Consistency Grid</h3>
                <span className="text-[11px] sm:text-xs text-ios-secondary-text font-medium mt-0.5 block">Visualize your daily focus metrics in real-time</span>
              </div>
            </div>

            {/* Micro badges */}
            <div className="flex items-center gap-2 flex-wrap max-w-full">
              <span className="text-[10px] px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-black rounded-lg flex items-center gap-1 font-sans">
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

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setShowGridHelp(!showGridHelp)}
              className="text-[10px] w-fit sm:text-[11px] font-semibold text-zinc-900/80 hover:text-zinc-950 flex items-center gap-1 transition-colors bg-zinc-100 dark:bg-zinc-850 px-2 py-1 rounded-full"
            >
              <Info className="w-3.5 h-3.5" />
              How this works
            </button>
            {showGridHelp && (
              <p className="text-[11px] sm:text-xs text-ios-secondary-text leading-normal font-medium animate-in fade-in slide-in-from-top-1 duration-200 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                Every logged Pomodoro round, completed quiz, or reflection journal entry builds your daily learning streak! 
                <strong className="text-zinc-950 dark:text-zinc-50 ml-1 font-semibold">💡 Click any grid square</strong> to toggle a &quot;Simulated Completed Study Session&quot; for that day and watch your analytics grow!
              </p>
            )}
          </div>

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
                      const dateStr = getLocalISOString(date);
                      const count = studyActivityScores.counts[dateStr] || 0;
                      const detailsList = studyActivityScores.hoverDetails[dateStr] || [];

                      // Color assignment categories
                      let bgCol = "bg-zinc-200/50 dark:bg-zinc-800/80";
                      if (count === 1) bgCol = "bg-zinc-300 dark:bg-zinc-700";
                      else if (count === 2) bgCol = "bg-zinc-400 dark:bg-zinc-600";
                      else if (count === 3) bgCol = "bg-zinc-650 dark:bg-zinc-400";
                      else if (count >= 4) bgCol = "bg-black dark:bg-white shadow-[0_0_6px_rgba(0,0,0,0.2)] dark:shadow-[0_0_6px_rgba(255,255,255,0.4)]";

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
                            className={`w-full aspect-square rounded-[2px] transition-all cursor-pointer ${bgCol} hover:ring-2 hover:ring-black dark:hover:ring-white`}
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
                              <div className="mt-1 flex flex-col gap-0.5 border-t border-zinc-800 pt-1 text-[8px] text-zinc-450 dark:text-zinc-550 font-bold">
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
                <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-300 dark:bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-400 dark:bg-zinc-600" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-650 dark:bg-zinc-400" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-black dark:bg-white shadow-[0_0_6px_rgba(0,0,0,0.2)] dark:shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
              </div>
              <span className="pr-1 font-sans">More focus</span>
            </div>
          </div>
        </div>

        </div>
        <div className={`lg:col-span-4 flex flex-col order-5 ${activeTab === 'analytics' ? 'flex' : 'hidden'}`}>
        {/* Quiz Grade History Logs */}
        <div className="bg-ios-light-secondary h-full w-full dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-zinc-950 dark:text-zinc-50" />
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
                      Difficulty: <strong className="text-zinc-950 dark:text-zinc-50 font-bold">{log.difficulty}</strong> • {log.date}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-black text-zinc-950 dark:text-zinc-50 font-mono">
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

        </div>

        {/* JOURNAL CONTENT */}
        <div className={`lg:col-span-8 flex flex-col order-1 ${activeTab === 'journal' ? 'flex' : 'hidden'}`}>
        {/* Dynamic Study Journal Notebook */}
        <div id="reflection-journal-section" className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <PenTool className="w-4 h-4 text-zinc-950 dark:text-zinc-50" />
            </div>
            <h3 className="font-extrabold text-[13px] sm:text-sm text-zinc-950 dark:text-white leading-tight">Active Session Reflection Journal</h3>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); setShowJournalHelp(!showJournalHelp); }}
              className="text-[10px] w-fit sm:text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-colors bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full"
            >
              <Info className="w-3.5 h-3.5" />
              Why keep a journal?
            </button>
            {showJournalHelp && (
              <p className="text-[11px] sm:text-xs text-ios-secondary-text leading-relaxed font-sans animate-in fade-in slide-in-from-top-1 duration-200 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                Solidify what you studied! Active cognitive retrieval—like reflecting on your completed Pomodoro intervals—multiplies conceptual memory recall.
              </p>
            )}
          </div>

          <form onSubmit={handleAddJournalEntry} className="space-y-4 bg-ios-light-bg dark:bg-ios-dark-bg p-4 sm:p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-950">
            <div className="space-y-1.5">
              <label htmlFor="journal-note-textarea" className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block font-sans">
                💡 Lesson Notes & Key Realizations
              </label>
              <textarea
                id="journal-note-textarea"
                value={newJournalNote}
                onChange={(e) => setNewJournalNote(e.target.value)}
                placeholder="What formulas, vocabulary, or systems did you commit to memory? (e.g., Reviewed mitochondria electron transfer chains...)"
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/25 dark:focus:ring-white/25 focus:border-black dark:focus:border-white outline-none placeholder:text-zinc-400 select-text font-medium min-h-[90px] resize-none leading-relaxed transition-all duration-250"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-ios-secondary-text uppercase tracking-wider block font-sans">
                ⏱️ Focus Session Duration to Log
              </span>
              <div className="grid grid-cols-4 gap-2 w-full">
                {([0, 15, 25, 50] as const).map((mins) => {
                  const isActive = activeSessionMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setActiveSessionMinutes(mins)}
                      className={`py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center border font-sans ${
                        isActive
                          ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] scale-[1.02]"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {mins === 0 ? "No Time" : `${mins} min`}
                    </button>
                  );
                })}
              </div>
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
                          ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] scale-[1.02]"
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
                className="w-full sm:w-auto px-5 py-2.5 bg-black dark:bg-white hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-black font-extrabold text-xs rounded-xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center gap-1.5 font-sans"
              >
                <PenTool className="w-3.5 h-3.5" /> Log Reflection Note
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

      </div>

      {/* SHARED COLUMN 3 WIDGETS */}
        <div className={`lg:col-span-4 flex flex-col ${activeTab === 'overview' ? 'order-3 flex' : activeTab === 'journal' ? 'order-2 flex' : 'hidden'}`}>
        <div className="hidden lg:block select-none w-full h-full">
          <h3 className="text-xs font-black text-ios-secondary-text uppercase tracking-widest mb-4 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 animate-pulse text-zinc-950 dark:text-zinc-50" /> Built-in Pomodoro Space
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

        </div>
        
        <div className={`lg:col-span-4 flex flex-col ${activeTab === 'overview' ? 'order-5 flex' : activeTab === 'journal' ? 'order-3 flex' : 'hidden'}`}>
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
        </div>

        <div className={`lg:col-span-4 flex flex-col ${activeTab === 'overview' ? 'order-4 flex' : activeTab === 'analytics' ? 'order-2 flex' : 'hidden'}`}>
        <StudentOasis 
          progress={progress} 
          onAddXp={onAddXp} 
          journalCount={journalEntries.length} 
        />

        </div>

        <div className={`lg:col-span-4 flex flex-col gap-2 ${activeTab === 'overview' ? 'order-6 flex' : activeTab === 'analytics' ? 'order-3 flex' : 'hidden'}`}>
        {/* Quick motivational cards */}
        <div className="flex flex-col gap-2 w-full h-full">
          <button 
            onClick={() => setShowQuizHelp(!showQuizHelp)}
            className="text-[10px] w-fit sm:text-[11px] font-semibold text-zinc-750 dark:text-zinc-300 flex items-center gap-1 transition-colors bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full"
          >
            <Info className="w-3.5 h-3.5" />
            Quiz Tips
          </button>
          {showQuizHelp && (
            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4.5 flex gap-3 text-zinc-900 dark:text-zinc-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <Target className="w-5 h-5 shrink-0 text-zinc-950 dark:text-zinc-50 mt-0.5" />
              <div>
                <h4 className="text-xs font-black">Ready to ace a Hard quiz?</h4>
                <p className="text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 mt-1 leading-normal font-sans">
                  Studying with Pomodoro focus rounds unlocks deeper recall. Earn +150 XP on every successful focus round and trigger levels!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      </div>
    </div>
  );
}
