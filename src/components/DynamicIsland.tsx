import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Target,
  Sparkles,
  Flame,
  X,
  Settings,
  ArrowLeft,
  Music,
  Volume2,
  VolumeX
} from "lucide-react";
import { NotificationInfo } from "../App";
import { AppMode, UserProgress, Track } from "../types";

interface DynamicIslandProps {
  timerIsRunning: boolean;
  timeLeft: number;
  timerMode: "focus" | "break";
  setTimerIsRunning: (running: boolean) => void;
  setTimeLeft: (time: number) => void;
  setTimerMode: (mode: "focus" | "break") => void;
  notifications: NotificationInfo[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationInfo[]>>;
  activeMode: AppMode;
  progress: UserProgress;
  setActiveMode: (mode: AppMode) => void;
  musicTracks: Track[];
  selectedTrackId: string;
  musicIsPlaying: boolean;
  musicVolume: number;
  musicIsMuted: boolean;
  onTogglePlayMusic: () => void;
  onSetMusicVolume: (v: number) => void;
  onSetMusicIsMuted: (m: boolean) => void;
}

export default function DynamicIsland({
  timerIsRunning,
  timeLeft,
  timerMode,
  setTimerIsRunning,
  setTimeLeft,
  setTimerMode,
  notifications,
  setNotifications,
  activeMode,
  progress,
  setActiveMode,
  musicTracks,
  selectedTrackId,
  musicIsPlaying,
  musicVolume,
  musicIsMuted,
  onTogglePlayMusic,
  onSetMusicVolume,
  onSetMusicIsMuted
}: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [internalHover, setInternalHover] = useState<boolean>(false);
  const [isConfiguringPosition, setIsConfiguringPosition] = useState<boolean>(false);
  
  const [preferredPosition, setPreferredPosition] = useState<
    "top-center" | "top-left" | "top-right" | "bottom-center" | "bottom-left" | "bottom-right"
  >(() => {
    return (localStorage.getItem("ai_study_companion_island_position") as any) || "top-center";
  });

  const activeNotification = notifications.length > 0 ? notifications[0] : null;
  const selectedTrack = musicTracks.find((t) => t.id === selectedTrackId) || musicTracks[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (activeNotification) {
      setIsExpanded(false);
      setIsConfiguringPosition(false);
    }
  }, [activeNotification]);

  const changePosition = (pos: "top-center" | "top-left" | "top-right" | "bottom-center" | "bottom-left" | "bottom-right") => {
    setPreferredPosition(pos);
    localStorage.setItem("ai_study_companion_island_position", pos);
  };

  const handleDismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleToggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimerIsRunning(!timerIsRunning);
  };

  const handleResetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimerIsRunning(false);
    setTimeLeft(timerMode === "focus" ? 25 * 60 : 5 * 60);
  };

  const handleModeNavigate = () => {
    setActiveMode("dashboard");
    setIsExpanded(false);
  };

  const renderIslandContent = () => {
    // ------------------ Notification State ------------------
    if (activeNotification) {
      const isAchievement = activeNotification.type === "achievement";
      const isLevelUp = activeNotification.type === "levelUp";

      const handleActionClick = (e: React.MouseEvent) => {
        if (activeNotification.action) {
          window.dispatchEvent(
            new CustomEvent(`${activeNotification.action}-action`, { detail: activeNotification.actionPayload })
          );
          handleDismissNotification(activeNotification.id, e);
        }
      };

      return (
        <motion.div
          key="notification"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full h-full flex flex-col justify-between ${activeNotification.action ? "cursor-pointer group" : ""}`}
          onClick={handleActionClick}
        >
          <div className="flex items-start justify-between gap-3 text-left font-sans">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg select-none shrink-0 ${
              isAchievement
                ? "bg-amber-500/15 text-amber-550 dark:text-amber-400"
                : isLevelUp
                ? "bg-brand-indigo/20 text-brand-indigo"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}>
              {isAchievement ? "🏆" : isLevelUp ? "👑" : "⏱️"}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 justify-between">
                {activeNotification.badge && (
                  <span className={`text-[9px] font-black uppercase tracking-widest block font-sans ${
                    isAchievement ? "text-amber-500" : isLevelUp ? "text-brand-indigo" : "text-zinc-400"
                  }`}>
                    {activeNotification.badge}
                  </span>
                )}
                {notifications.length > 1 && (
                  <span className="text-[8px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-full font-extrabold select-none">
                    +{notifications.length - 1} more
                  </span>
                )}
              </div>
              <h4 className="text-xs font-extrabold text-zinc-950 dark:text-zinc-50 leading-tight truncate mt-0.5">
                {activeNotification.title}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-700 dark:text-zinc-300 font-medium leading-normal mt-1 block">
                {activeNotification.description}
              </p>
            </div>

            <button
              onClick={(e) => handleDismissNotification(activeNotification.id, e)}
              className="p-1 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-150 dark:hover:bg-zinc-800/80 transition-all select-none shrink-0 cursor-pointer border-none bg-transparent"
              title="Dismiss Alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {isAchievement && (
            <div className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold flex items-center justify-between border-t border-zinc-250 dark:border-zinc-800/80 pt-1.5 font-sans">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                <Sparkles className="w-3 h-3 fill-amber-500" />
                Durable Achievement Unlocked!
              </span>
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded text-[9px] border border-amber-500/15">
                +{activeNotification.xpReward || 100} XP
              </span>
            </div>
          )}
        </motion.div>
      );
    }

    // ------------------ Expanded Controller State ------------------
    if (isExpanded) {
      if (isConfiguringPosition) {
        return (
          <motion.div
            key="timer-expanded-settings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col justify-between h-full text-left font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-2 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfiguringPosition(false);
                }}
                className="text-[10px] uppercase font-bold tracking-wider text-brand-indigo flex items-center gap-1 hover:text-brand-indigo/80 transition-colors cursor-pointer bg-transparent border-none"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Dock Placement
              </span>
            </div>
 
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">
              Select your preferred screen dock to float this companion widget:
            </p>              {/* Grid preset locations */}
            <div className="grid grid-cols-3 gap-1 px-1 py-1 bg-zinc-100/50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {[
                { id: "top-left", icon: "↖", label: "Top Left" },
                { id: "top-center", icon: "⬆", label: "Top Center" },
                { id: "top-right", icon: "↗", label: "Top Right" },
                { id: "bottom-left", icon: "↙", label: "Bot Left" },
                { id: "bottom-center", icon: "⬇", label: "Bot Center" },
                { id: "bottom-right", icon: "↘", label: "Bot Right" },
              ].map((pos) => (
                <button
                  key={pos.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    changePosition(pos.id as any);
                  }}
                  className={`py-1 rounded-md text-[10px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer border-none ${
                    preferredPosition === pos.id
                      ? "bg-brand-indigo text-white shadow-md ring-1 ring-white/10"
                      : "bg-zinc-200/50 dark:bg-zinc-900 hover:bg-zinc-300/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  <span className="text-[13px] leading-none mb-0.5">{pos.icon}</span>
                  <span className="text-[8px] tracking-tight">{pos.label}</span>
                </button>
              ))}
            </div>
 
            <div className="mt-1.5 text-[8px] text-zinc-400 dark:text-zinc-500 font-medium text-center">
              State saves automatically in your local dashboard cache.
            </div>
          </motion.div>
        );
      }

      return (
        <motion.div
          key="timer-expanded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full flex flex-col justify-between h-full text-left font-sans"
        >
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-sans">
              {timerMode === "focus" ? (
                <>
                  <Target className="w-3 h-3 text-red-500 dark:text-red-400 shrink-0" /> Focus Round Control
                </>
              ) : (
                <>
                  <Coffee className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" /> Break Interval
                </>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfiguringPosition(true);
                }}
                className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer border-none bg-transparent"
                title="Customize Position"
              >
                <Settings className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Time digits & Mini visualizer */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <span className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-white block leading-none">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1 block uppercase font-bold tracking-tight">
                {timerIsRunning ? "Active Study Run Logged" : "Dormant / Interrupted"}
              </span>
            </div>

            {/* Quick interactive shortcuts */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetTimer}
                className="p-2 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700/80 transition-all text-xs cursor-pointer border-none"
                title="Reset Countdown"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleToggleTimer}
                className={`p-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1 text-white shadow-md transition-all cursor-pointer border-none ${
                  timerIsRunning ? "bg-zinc-400 dark:bg-zinc-755 hover:bg-zinc-500 dark:hover:bg-zinc-700" : "bg-brand-indigo hover:opacity-90"
                }`}
              >
                {timerIsRunning ? (
                  <>
                    <Pause className="w-3 h-3 fill-white" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-white" /> Resume
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Background music controls (available when outside the dashboard) */}
          {activeMode !== "dashboard" && (
            <div className="border-t border-zinc-200 dark:border-zinc-800/80 pt-2 mb-1.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1 font-sans">
                  <Music className="w-2.5 h-2.5 text-brand-indigo" /> Focus Soundtrack (Remote)
                </span>
                {musicIsPlaying && (
                  <span className="flex items-center gap-0.5 h-2 shrink-0">
                    <span className="w-0.5 h-1.5 bg-brand-indigo rounded-full animate-pulse" />
                    <span className="w-0.5 h-2.5 bg-brand-indigo rounded-full animate-pulse [animation-delay:0.1s]" />
                    <span className="w-0.5 h-2 bg-brand-indigo rounded-full animate-pulse [animation-delay:0.2s]" />
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 text-xs bg-zinc-150/50 dark:bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-900/60 font-sans">
                <div className="flex-1 min-w-0 pr-1 select-none">
                  <div className="text-[10px] font-extrabold text-zinc-900 dark:text-white leading-none truncate mb-0.5">
                    {selectedTrack?.name || "Pure 40 Hz Study Music"}
                  </div>
                  <div className="text-[8px] text-zinc-505 dark:text-zinc-500 leading-none truncate">
                    {selectedTrack?.type === "synth" ? "Natively Synthesized" : "Cloud Stream"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetMusicIsMuted(!musicIsMuted);
                    }}
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border-none bg-transparent"
                  >
                    {musicIsMuted || musicVolume === 0 ? (
                      <VolumeX className="w-3 h-3 text-red-500" />
                    ) : (
                      <Volume2 className="w-3 h-3 text-brand-indigo" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlayMusic();
                    }}
                    className={`p-1 px-2.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1 text-white shadow-sm transition-all cursor-pointer border-none ${
                      musicIsPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-brand-indigo hover:opacity-90"
                    }`}
                  >
                    {musicIsPlaying ? "Pause" : "Play"}
                  </button>
                </div>
              </div>

              {/* Volume horizontal slider */}
              <div className="flex items-center gap-1.5 px-0.5 text-[8px] font-extrabold text-zinc-500 dark:text-zinc-500">
                <span>VOL</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSetMusicVolume(parseFloat(e.target.value));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full accent-brand-indigo h-0.5 rounded-full cursor-pointer bg-zinc-200 dark:bg-zinc-800"
                  title="Adjust Music Volume"
                />
              </div>
            </div>
          )}

          {/* Dynamic mode navigation line */}
          <div className="mt-1.5 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-2 text-[10px]">
            <span className="text-zinc-500 dark:text-zinc-500 font-semibold font-sans">Session Focus Interval (25 Mins)</span>
            <button
              onClick={handleModeNavigate}
              className="font-black text-brand-indigo hover:underline select-none cursor-pointer bg-transparent border-none"
            >
              Control Desk →
            </button>
          </div>
        </motion.div>
      );
    }

    // ------------------ Compact Active Timer + Playback Combined State ------------------
    if (activeMode !== "dashboard" && (timerIsRunning || musicIsPlaying)) {
      return (
        <motion.div
          key="timer-music-compact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-full flex items-center justify-between px-1 gap-1.5 font-sans"
        >
          {/* Timer panel if running */}
          {timerIsRunning ? (
            <div className="flex items-center gap-1">
              {timerMode === "focus" ? (
                <span className="relative flex h-1.5  w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
              ) : (
                <Coffee className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span className="font-mono text-[10px] font-black text-zinc-950 dark:text-white shrink-0">
                {formatTime(timeLeft)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-zinc-500 dark:text-zinc-550 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-650" />
              TIMER IDLE
            </div>
          )}

          {/* Tiny Divider */}
          <span className="w-[1px] h-3 bg-zinc-200 dark:bg-zinc-800 shrink-0" />

          {/* Music status panel */}
          {musicIsPlaying ? (
            <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0 justify-end">
              <span className="flex items-center gap-0.5 h-1.5 shrink-0 select-none">
                <span className="w-0.5 h-1 bg-brand-indigo rounded-full animate-pulse" />
                <span className="w-0.5 text-brand-indigo h-1.5 bg-brand-indigo rounded-full animate-pulse [animation-delay:0.1s]" />
              </span>
              <span className="text-[8px] font-black text-zinc-800 dark:text-zinc-100 truncate uppercase tracking-tight max-w-[55px] font-sans">
                {selectedTrack?.name || "Playing"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[8px] font-extrabold text-zinc-500 dark:text-zinc-600 select-none pr-0.5">
              <span>🔇 MUTED</span>
            </div>
          )}
        </motion.div>
      );
    }

    // Default basic compact active timer (if on dashboard or default simple timers of simple modes)
    if (timerIsRunning) {
      return (
        <motion.div
          key="timer-compact-solo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-full flex items-center justify-between px-1 font-sans"
        >
          <div className="flex items-center gap-1.5">
            {timerMode === "focus" ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            ) : (
              <Coffee className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest hidden sm:inline select-none font-sans">
              {timerMode === "focus" ? "Focus" : "Break"}
            </span>
          </div>

          <span className="font-mono text-xs font-black text-zinc-950 dark:text-white shrink-0">
            {formatTime(timeLeft)}
          </span>
        </motion.div>
      );
    }

    // ------------------ Idle State (✨ AI Companion branding or Study Mode) ------------------
    return (
      <motion.div
        key="idle-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full flex items-center justify-between px-1 text-zinc-650 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider select-none font-sans"
      >
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
          <Flame className="w-3.5 h-3.5 fill-amber-600 dark:fill-amber-500 animate-pulse" />
          {progress.dailyStreak}D Streak
        </span>
        <span className="text-zinc-500 dark:text-zinc-500 font-mono text-[9px] tracking-widest">
          LVL {progress.level}
        </span>
      </motion.div>
    );
  };

  // Compute size dynamically for the Dynamic Island container with live activities morphing rates
  let widthClasses = "w-[124px] h-[28px]"; // Idle default
  if (activeNotification) {
    widthClasses = "w-[340px] sm:w-[380px] h-auto min-h-[96px] p-3.5 sm:p-4";
  } else if (isExpanded) {
    // Make taller for integrated remote soundscape options when outside dashboard
    const height = isConfiguringPosition
      ? "h-[194px]"
      : activeMode !== "dashboard"
      ? "h-[228px]"
      : "h-[134px]";
    widthClasses = `w-[310px] sm:w-[335px] ${height} p-3.5`;
  } else if (activeMode !== "dashboard" && (timerIsRunning || musicIsPlaying)) {
    // Elegant split dashboard live activity width
    widthClasses = "w-[165px] h-[34px] px-2.5";
  } else if (timerIsRunning) {
    widthClasses = "w-[145px] h-[32px] px-3";
  } else if (internalHover) {
    widthClasses = "w-[155px] h-[30px] px-2.5 cursor-pointer";
  }

  const POSITION_CLASSES = {
    "top-center": "top-[62px] sm:top-[84px] lg:top-[84px] left-1/2 -translate-x-1/2",
    "top-left": "top-[62px] sm:top-[84px] lg:top-[84px] left-3 sm:left-6",
    "top-right": "top-[62px] sm:top-[84px] lg:top-[84px] right-3 sm:right-6",
    "bottom-center": "bottom-3 left-1/2 -translate-x-1/2",
    "bottom-left": "bottom-3 left-3 sm:left-6",
    "bottom-right": "bottom-3 right-3 sm:right-6"
  };

  const currentPosClass = POSITION_CLASSES[preferredPosition] || POSITION_CLASSES["top-center"];

  return (
    <div
      id="dynamic-island-anchor"
      className={`fixed ${currentPosClass} z-[100] flex flex-col items-center pointer-events-none select-none transition-all duration-300`}
    >
      <motion.div
        layoutId="dynamic-island-capsule"
        onMouseEnter={() => setInternalHover(true)}
        onMouseLeave={() => setInternalHover(false)}
        onClick={() => {
          if (!activeNotification) {
            setIsExpanded(!isExpanded);
          }
        }}
        className={`bg-white/80 dark:bg-black/65 backdrop-blur-xl backdrop-saturate-150 text-zinc-950 dark:text-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)] border border-black/5 dark:border-white/10 flex items-center justify-center transition-all duration-300 pointer-events-auto overflow-hidden relative ${widthClasses}`}
        layout // Framer Motion layout morph physics
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 28,
          mass: 0.8
        }}
      >
        {/* Animated Liquid Glass Background Effects */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none">
          {/* Purple/Indigo glowing fluid liquid gradient orb */}
          <div className="absolute -top-[40px] -left-[30px] w-[130px] h-[130px] bg-brand-indigo/25 rounded-full blur-[20px] opacity-70 animate-pulse duration-5000" />
          {/* Fuchsia liquid gradient orb */}
          <div className="absolute -bottom-[50px] -right-[20px] w-[110px] h-[110px] bg-fuchsia-500/15 rounded-full blur-[20px] opacity-65 animate-[pulse_6s_infinite_alternate]" />
          {/* Dynamic timer state (Red for Focus, Emerald for Break) */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] rounded-full blur-[30px] opacity-20 transition-all duration-700 ${
            timerMode === "focus" ? "bg-red-500/15" : "bg-emerald-500/15"
          }`} />
          {/* Glass glare specular line across the top edge */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent" />
          {/* Micro diagonal shine accent */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/3 via-transparent to-transparent opacity-30" />
        </div>

        <AnimatePresence mode="wait">
          {renderIslandContent()}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
