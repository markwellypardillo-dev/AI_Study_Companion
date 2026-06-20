import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";
import { LoginView } from "./components/LoginView";

const logoUrl = "https://i.postimg.cc/ht4X0Tbj/LOGO-for-Ai-companion.png";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  HelpCircle,
  Clock,
  User,
  LogOut,
  Moon,
  Sun,
  Flame,
  Zap,
  Target,
  Shuffle,
  FileSpreadsheet,
  Settings,
  XCircle,
  CheckCircle,
  LayoutDashboard
} from "lucide-react";
import { AppMode, DifficultyTier, StudyGuideData, UserProgress, Track } from "./types";

export const DEFAULT_TRACKS: Track[] = [
  {
    id: "40hz-binaural",
    name: "Pure 40 Hz Study Music",
    type: "stream",
    src: "/40-hz-study-music.mp3",
    description: "The uploaded high-quality 40 Hz focus soundtrack (40 Hz Study Music_spotdown.org.mp3)."
  },
  {
    id: "40hz-synth",
    name: "Live 40 Hz Binaural Synth",
    type: "synth",
    description: "Natively synthesized 40 Hz Gamma waves (200Hz left/240Hz right) to maximize focus and study alertness."
  },
  {
    id: "lofi-focus",
    name: "Lo-Fi Study Beats Preset",
    type: "stream",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    description: "Relaxed hip-hop lofi instrumentation to maintain rhythmic study flow."
  },
  {
    id: "ambient-space",
    name: "Cosmic Study Drone",
    type: "stream",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    description: "Ethereal, slow-frequency cosmic synthesizer pad ideal for writing sessions."
  },
  {
    id: "pink-noise",
    name: "Gentle Pink Noise",
    type: "synth",
    description: "Synthesized natural sound masking frequency that cancels ambient room distractions."
  }
];
import UploadView from "./components/UploadView";
import GuideView from "./components/GuideView";
import QuizView from "./components/QuizView";
import Flashcards from "./components/Flashcards";
import Dashboard from "./components/Dashboard";
import DynamicIsland from "./components/DynamicIsland";
import FloatingNotepad from "./components/FloatingNotepad";
import confetti from "canvas-confetti";
import { PRELOADED_SUBJECTS } from "./data/preloadedSubjects";

const LOCAL_STORAGE_PROGRESS_KEY = "ai_study_companion_progress";

export interface NotificationInfo {
  id: string;
  title: string;
  description: string;
  type: "achievement" | "reminder" | "levelUp" | "info";
  badge?: string;
  xpReward?: number;
}

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  badge: string;
  xpReward: number;
  condition: (prog: UserProgress) => boolean;
}

const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first_upload",
    title: "Document Scaffolder",
    description: "Successfully upload and parse your first study materials document.",
    badge: "📂 First Upload",
    xpReward: 100,
    condition: (p) => (p.completedStudiesCount || 0) >= 1
  },
  {
    id: "level_2",
    title: "Scholar Level 2",
    description: "Advance your scholarship level of intellect to Level 2.",
    badge: "👑 Level 2",
    xpReward: 150,
    condition: (p) => p.level >= 2
  },
  {
    id: "level_5",
    title: "Master Polymath",
    description: "Reach elite level 5 of study mastery.",
    badge: "🧠 Level 5 Elite",
    xpReward: 300,
    condition: (p) => p.level >= 5
  },
  {
    id: "first_quiz",
    title: "First Steps Assessment",
    description: "Complete your very first academic assessment quiz round.",
    badge: "📝 First Quiz",
    xpReward: 100,
    condition: (p) => p.quizHistory.length >= 1
  },
  {
    id: "perfect_quiz",
    title: "Honor Roll Perfection",
    description: "Achieve a perfect 100% score on any quiz assessment mode.",
    badge: "💯 Perfect Score",
    xpReward: 200,
    condition: (p) => p.quizHistory.some((q) => q.score === q.total && q.total > 0)
  },
  {
    id: "vocab_5",
    title: "Lexicon Cadet",
    description: "Master 5 interactive vocabulary flashcards.",
    badge: "📚 5 Terms Mastered",
    xpReward: 100,
    condition: (p) => p.masteredTermsCount >= 5
  },
  {
    id: "vocab_15",
    title: "Vocabulary Titan",
    description: "Master 15 vocabulary flashcard terms across study sessions.",
    badge: "📖 15 Terms Mastered",
    xpReward: 250,
    condition: (p) => p.masteredTermsCount >= 15
  },
  {
    id: "streak_3",
    title: "Consistency Cadet",
    description: "Maintain a study streak of 3 active study days.",
    badge: "🔥 3-Day Daily Streak",
    xpReward: 150,
    condition: (p) => p.dailyStreak >= 3
  },
  {
    id: "focus_1",
    title: "Focus Round Disciple",
    description: "Log at least 25 minutes of Pomodoro concentration.",
    badge: "⏱️ Focus Novice",
    xpReward: 100,
    condition: (p) => p.totalFocusSeconds >= 1500
  },
  {
    id: "focus_4",
    title: "Deep Work Virtuoso",
    description: "Log at least 100 minutes of total Pomodoro focus.",
    badge: "🏆 Deep Focus Master",
    xpReward: 300,
    condition: (p) => p.totalFocusSeconds >= 6000
  }
];

const INITIAL_PROGRESS: UserProgress = {
  xp: 150,
  level: 1,
  xpToNextLevel: 1000,
  dailyStreak: 0,
  lastActiveDate: new Date().toISOString(),
  totalFocusSeconds: 1500, // Preloaded focus minutes for demo styling
  quizHistory: [
    {
      id: "pre-1",
      fileName: "Biology 101 - Mitochondria.txt",
      score: 4,
      total: 5,
      difficulty: "basic",
      date: "2026-06-11"
    }
  ],
  masteredTermsCount: 2,
  completedStudiesCount: 1,
  unlockedAchievements: ["first_upload", "focus_1"]
};

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [progress, setProgress] = useState<UserProgress>(INITIAL_PROGRESS);
  const [activeMode, setActiveMode] = useState<AppMode>("upload");

  const [user, setUser] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);

  // Document extraction variables
  const [fileName, setFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [guideData, setGuideData] = useState<StudyGuideData | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Infinite upload quota queuing system states
  const [isQuotaQueue, setIsQuotaQueue] = useState<boolean>(false);
  const [quotaQueuePosition, setQuotaQueuePosition] = useState<number>(() => Math.floor(Math.random() * 3) + 1);
  const [quotaRetrySeconds, setQuotaRetrySeconds] = useState<number>(30);

  // Difficulty unlocks
  const [unlockedProgressTiers, setUnlockedProgressTiers] = useState<DifficultyTier[]>(["basic"]);

  // Floating System Notifications
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);

  // Lifted Pomodoro Timer state (persistent background tracking)
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);

  // Periodic study/focus notifications tracker seconds
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [notificationIntervalType, setNotificationIntervalType] = useState<"demo" | "standard">("standard");

  // --- Centralized Focus Music State variables ---
  const [musicTracks, setMusicTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("custom_tracks_data");
    const parsedSaved = saved ? JSON.parse(saved) : [];
    return [...DEFAULT_TRACKS, ...parsedSaved];
  });
  const [selectedTrackId, setSelectedTrackId] = useState<string>("40hz-binaural");
  const [musicIsPlaying, setMusicIsPlaying] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.5);
  const [musicIsMuted, setMusicIsMuted] = useState<boolean>(false);
  const [musicSynthType, setMusicSynthType] = useState<"40hz" | "pink" | null>(null);
  const [musicError, setMusicError] = useState<string | null>(null);

  // Enhancement: Sleep/Snooze timer for focus music
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerSecondsLeft, setSleepTimerSecondsLeft] = useState<number>(0);

  // Enhancement: Customizable Daily Focus Goal
  const [dailyFocusGoalRounds, setDailyFocusGoalRounds] = useState<number>(() => {
    const saved = localStorage.getItem("ai_study_companion_daily_goal");
    return saved ? parseInt(saved, 10) : 4;
  });

  // Web Audio Context & Oscillator Node refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize standard background html audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio();
      audio.loop = true;
      audio.onplay = () => setMusicIsPlaying(true);
      audio.onpause = () => setMusicIsPlaying(false);
      audio.onerror = () => {
        if (musicIsPlaying) {
          setMusicError("Error loading streaming source. CORS blockage or broken link.");
          setMusicIsPlaying(false);
          stopSynth();
        }
      };
      audioRef.current = audio;
    }

    return () => {
      stopSynth();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume & muting reactively across nodes
  useEffect(() => {
    const activeVolume = musicIsMuted ? 0 : musicVolume;
    if (audioRef.current) {
      audioRef.current.volume = activeVolume;
    }
    if (synthGainRef.current && audioContextRef.current) {
      synthGainRef.current.gain.setValueAtTime(activeVolume * 0.45, audioContextRef.current.currentTime);
    }
  }, [musicVolume, musicIsMuted]);

  const stopSynth = () => {
    try {
      if (leftOscRef.current) {
        leftOscRef.current.stop();
        leftOscRef.current.disconnect();
        leftOscRef.current = null;
      }
      if (rightOscRef.current) {
        rightOscRef.current.stop();
        rightOscRef.current.disconnect();
        rightOscRef.current = null;
      }
      if (bufferSourceRef.current) {
        bufferSourceRef.current.stop();
        bufferSourceRef.current.disconnect();
        bufferSourceRef.current = null;
      }
      if (synthGainRef.current) {
        synthGainRef.current.disconnect();
        synthGainRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping local synthesizers:", e);
    }
    setMusicSynthType(null);
  };

  const playSynth = (mode: "40hz" | "pink") => {
    stopSynth();

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const masterGain = ctx.createGain();
    const activeVolume = musicIsMuted ? 0 : musicVolume;
    masterGain.gain.setValueAtTime(activeVolume * 0.45, ctx.currentTime);
    synthGainRef.current = masterGain;

    if (mode === "40hz") {
      const merger = ctx.createChannelMerger(2);

      const leftOsc = ctx.createOscillator();
      leftOsc.type = "sine";
      leftOsc.frequency.setValueAtTime(200, ctx.currentTime);

      const rightOsc = ctx.createOscillator();
      rightOsc.type = "sine";
      rightOsc.frequency.setValueAtTime(240, ctx.currentTime);

      const leftGain = ctx.createGain();
      const rightGain = ctx.createGain();
      leftGain.gain.setValueAtTime(1.0, ctx.currentTime);
      rightGain.gain.setValueAtTime(1.0, ctx.currentTime);

      leftOsc.connect(leftGain).connect(merger, 0, 0);
      rightOsc.connect(rightGain).connect(merger, 0, 1);

      merger.connect(masterGain).connect(ctx.destination);

      leftOsc.start();
      rightOsc.start();

      leftOscRef.current = leftOsc;
      rightOscRef.current = rightOsc;
      setMusicSynthType("40hz");
    } else if (mode === "pink") {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        output[i] = pink * 0.11;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      noiseNode.connect(masterGain).connect(ctx.destination);
      noiseNode.start();

      bufferSourceRef.current = noiseNode;
      setMusicSynthType("pink");
    }
  };

  const runMusicPlayback = (trackId: string, tracksList: Track[]) => {
    setMusicError(null);
    const targetTrack = tracksList.find((t) => t.id === trackId) || tracksList[0];

    if (targetTrack.type === "synth") {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      playSynth(targetTrack.id === "40hz-synth" ? "40hz" : "pink");
    } else {
      stopSynth();
      if (audioRef.current) {
        audioRef.current.volume = musicIsMuted ? 0 : musicVolume;
        
        let pathUrl = targetTrack.src || "";
        if (pathUrl.startsWith("/")) {
          pathUrl = window.location.origin + pathUrl;
        }

        if (audioRef.current.src !== pathUrl) {
          audioRef.current.src = targetTrack.src || "";
        }
        audioRef.current.play().catch((error) => {
          console.error("Audio Playback aborted:", error);
          setMusicError("Unable to stream audio track. Check link or connectivity.");
          setMusicIsPlaying(false);
          stopSynth();
        });
      }
    }
  };

  const pauseMusicPlayback = () => {
    stopSynth();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setMusicIsPlaying(false);
  };

  const togglePlayMusic = () => {
    const nextPlay = !musicIsPlaying;
    if (nextPlay) {
      setMusicIsPlaying(true);
      runMusicPlayback(selectedTrackId, musicTracks);
    } else {
      pauseMusicPlayback();
    }
  };

  const changeTrack = (id: string, updatedTracks?: Track[]) => {
    const list = updatedTracks || musicTracks;
    setSelectedTrackId(id);
    setMusicIsPlaying(true);
    runMusicPlayback(id, list);
  };

  const handleAddCustomTrack = (newTrack: Track) => {
    const nextTracks = [...musicTracks, newTrack];
    setMusicTracks(nextTracks);
    localStorage.setItem("custom_tracks_data", JSON.stringify(nextTracks.filter((t) => t.id.startsWith("custom-"))));
    changeTrack(newTrack.id, nextTracks);
  };

  const handleRemoveCustomTrack = (id: string) => {
    if (selectedTrackId === id) {
      pauseMusicPlayback();
      setSelectedTrackId("40hz-binaural");
    }
    const nextTracks = musicTracks.filter((t) => t.id !== id);
    setMusicTracks(nextTracks);
    localStorage.setItem("custom_tracks_data", JSON.stringify(nextTracks.filter((t) => t.id.startsWith("custom-"))));
  };

  const switchToNextTrack = () => {
    const idx = musicTracks.findIndex((t) => t.id === selectedTrackId);
    if (idx !== -1) {
      const nextIdx = idx === musicTracks.length - 1 ? 0 : idx + 1;
      changeTrack(musicTracks[nextIdx].id);
    }
  };

  const switchToPreviousTrack = () => {
    const idx = musicTracks.findIndex((t) => t.id === selectedTrackId);
    if (idx !== -1) {
      const prevIdx = idx === 0 ? musicTracks.length - 1 : idx - 1;
      changeTrack(musicTracks[prevIdx].id);
    }
  };

  // 1. Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting inputs or text fields
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        togglePlayMusic();
        addNotification({
          title: "🎵 Music Shortcut Triggered",
          description: musicIsPlaying ? "Pausing and silencing study soundtrack." : "Resuming your high-fidelity concentration soundscape.",
          type: "info",
          badge: "⌨️ Hotkey Desk"
        });
      } else if (key === "p") {
        e.preventDefault();
        setTimerIsRunning(!timerIsRunning);
        addNotification({
          title: "⏱️ Timer Shortcut Triggered",
          description: timerIsRunning ? "Interrupted study countdown session." : "Initiating/Resuming study round timer countdown.",
          type: "info",
          badge: "⌨️ Hotkey Desk"
        });
      } else if (key === "v") {
        e.preventDefault();
        setMusicIsMuted(!musicIsMuted);
        addNotification({
          title: "🔊 Audio Muting Toggle",
          description: musicIsMuted ? "Audio flow has been un-muted." : "Audio channel muted to ensure absolute classroom quietness.",
          type: "info",
          badge: "⌨️ Hotkey Desk"
        });
      } else if (key === "[") {
        e.preventDefault();
        switchToPreviousTrack();
      } else if (key === "]") {
        e.preventDefault();
        switchToNextTrack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [musicIsPlaying, timerIsRunning, musicIsMuted, selectedTrackId, musicTracks]);

  // 2. Sleep countdown timer loop
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      return;
    }

    setSleepTimerSecondsLeft(sleepTimerMinutes * 60);
  }, [sleepTimerMinutes]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (sleepTimerMinutes !== null && musicIsPlaying && sleepTimerSecondsLeft > 0) {
      interval = setInterval(() => {
        setSleepTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            // Sleep timer triggered!
            clearInterval(interval!);
            pauseMusicPlayback();
            setSleepTimerMinutes(null);
            
            addNotification({
              title: "💤 Music Sleep Timer Triggered",
              description: "Focus audio deactivated automatically to safeguard your rest cycle.",
              type: "info",
              badge: "⏱️ Auto-Snooze"
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sleepTimerMinutes, musicIsPlaying, sleepTimerSecondsLeft]);

  // Handle browser back button to navigate between tabs
  useEffect(() => {
    // When the component mounts or activeMode changes outside of popstate,
    // verify if we need to push a new state to the history
    if (window.history.state?.mode !== activeMode) {
      window.history.pushState({ mode: activeMode }, "");
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.mode) {
        setActiveMode(e.state.mode);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeMode]);

  const addNotification = (notif: Omit<NotificationInfo, "id">) => {
    const id = "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const newNotif = { ...notif, id };
    setNotifications((prev) => [...prev, newNotif]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  const triggerDemoNotification = (type: "reminder" | "achievement") => {
    if (type === "reminder") {
      addNotification({
        title: "🧠 Focus Zone Active!",
        description: "Your periodic notification countdown is running perfectly.",
        type: "reminder",
        badge: "⏱️ Focus Tracker"
      });
    } else {
      addNotification({
        title: "🏆 Achievement Unleashed: Quiz Ace!",
        description: "Scored 100% on high difficulty assessments (+200 XP Added!)",
        type: "achievement",
        badge: "💎 Elite Achievement",
        xpReward: 200
      });
    }
  };

  // 1. Initial configuration loader
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }

    // Load progress from localStorage if it exists
    const savedProgress = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        // Fallback for unlocked Achievements
        if (!parsed.unlockedAchievements) {
          parsed.unlockedAchievements = ["first_upload", "focus_1"];
        }
        setProgress(parsed);
      } catch (e) {
        console.error("Failed to parse progress, resetting to defaults", e);
      }
    }
  }, []);

  // 2. Centralized Pomodoro countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerIsRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer complete!
            setTimerIsRunning(false);
            if (timerMode === "focus") {
              // Focus round completes
              handleFocusComplete(25);
              setTimerMode("break");
            } else {
              setTimerMode("focus");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerIsRunning, timerMode]);

  // Sync timeLeft reset on timer mode changes
  useEffect(() => {
    const defaultTime = timerMode === "focus" ? 25 * 60 : 5 * 60;
    setTimeLeft(defaultTime);
  }, [timerMode]);

  // 3. Periodic notifications checker (Study / Quiz / Focus Round)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const isFocusRunning = timerIsRunning && timerMode === "focus";
    const isInStudyOrQuiz = ["guide", "assessment", "flashcards"].includes(activeMode);
    
    const shouldTrack = isFocusRunning || isInStudyOrQuiz;

    if (shouldTrack) {
      interval = setInterval(() => {
        setActiveSeconds((prev) => {
          const limit = notificationIntervalType === "demo" ? 30 : 300; // 30s vs 5m
          const nextSecs = prev + 1;
          if (nextSecs >= limit) {
            triggerPeriodicReminder();
            return 0;
          }
          return nextSecs;
        });
      }, 1000);
    } else {
      setActiveSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerIsRunning, timerMode, activeMode, notificationIntervalType]);

  const triggerPeriodicReminder = () => {
    const reminders = [
      {
        title: "🧠 Focus Flow Zone!",
        description: "You've completed another 5-minute block of study round focus! Keep absorbing knowledge."
      },
      {
        title: "⚡ Neuron Acceleration!",
        description: "5 straight minutes of study in style! Your level progress is scaling up."
      },
      {
        title: "📚 Academic Momentum!",
        description: "Another 5-minute concentration landmark. You are mastering your text material!"
      },
      {
        title: "🌟 High-Impact Concentration!",
        description: "5 minutes of hyper-focus logged. Your study streak is growing stronger."
      },
      {
        title: "🎯 Bulletproof Recall!",
        description: "Another 5 minutes down! Stay sharp, you are acing this study round."
      }
    ];

    const demoReminders = [
      {
        title: "⏰ Demo: 30-Second Focus Zone!",
        description: "This is a demonstrative notification representing 5 minutes of study concentration!"
      },
      {
        title: "⚡ Demo: Dynamic Study Round Complete!",
        description: "Your 30-second study interval concluded (simulating 5 minutes of focus)."
      }
    ];

    const pool = notificationIntervalType === "demo" ? demoReminders : reminders;
    const selected = pool[Math.floor(Math.random() * pool.length)];

    addNotification({
      title: selected.title,
      description: selected.description,
      type: "reminder",
      badge: "⏱️ Study Tracker"
    });
  };

  // Sync progress data to localStorage
  const syncProgress = (updated: UserProgress) => {
    setProgress(updated);
    localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(updated));
  };

  const handleToggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Infinite Queue Loop Retrier for daily uploads quota saturation
  const handleQuotaRetryCall = async () => {
    if (!fileName || !fileContent) return;
    try {
      console.log(`[Queue Retry] Initiating automatic background retry for file: ${fileName}...`);
      const response = await fetch("/api/generate-study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: fileName, fileContent: fileContent }),
      });

      if (!response.ok) {
        let errorMessage = "Quota saturated.";
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMessage = errData.error;
        } catch (_) {}
        throw new Error(errorMessage);
      }

      const generatedGuide: StudyGuideData = await response.json();
      setGuideData(generatedGuide);
      setIsQuotaQueue(false);
      setIsGeneratingGuide(false);
      setActiveMode("explore");

      const nextCompleted = (progress.completedStudiesCount || 0) + 1;
      addXp(200, { completedStudiesCount: nextCompleted });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.warn("[Queue Retry] Saturated. Re-queueing with standard slot cycle...");
      // Reset timer to keep looping indefinitely
      setQuotaRetrySeconds(30);
    }
  };

  // Periodic state triggers for holding queue
  useEffect(() => {
    let timer: any;
    if (isQuotaQueue && quotaRetrySeconds > 0) {
      timer = setTimeout(() => {
        setQuotaRetrySeconds((prev) => prev - 1);
      }, 1000);
    } else if (isQuotaQueue && quotaRetrySeconds === 0) {
      handleQuotaRetryCall();
    }
    return () => clearTimeout(timer);
  }, [isQuotaQueue, quotaRetrySeconds]);

  // Triggered when file has completed parsing
  const handleFileParsed = async (name: string, content: string) => {
    let shouldHoldLoading = false;
    try {
      setFileName(name);
      setFileContent(content);
      setIsGeneratingGuide(true);
      setGenerationError(null);
      setIsQuotaQueue(false); // Reset queue
      setActiveMode("upload"); // Keep in visual loading state

      const matchedSubject = PRELOADED_SUBJECTS.find((p) => p.title === name);
      if (matchedSubject) {
        // Wait for a simulated 1.2s to preserve the premium parsing transition feelings
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setGuideData(matchedSubject.guide);
        setActiveMode("explore");

        // Increment studies completed
        const nextCompleted = (progress.completedStudiesCount || 0) + 1;
        addXp(200, { completedStudiesCount: nextCompleted });

        // Highlight confetti
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
        return;
      }

      const response = await fetch("/api/generate-study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: name, fileContent: content }),
      });

      if (!response.ok) {
        let errorMessage = "Tutor module failed to synthesize document outline.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMessage = errData.error;
          }
        } catch (_) {}
        throw new Error(errorMessage);
      }

      const generatedGuide: StudyGuideData = await response.json();
      setGuideData(generatedGuide);
      setActiveMode("explore"); // Load the Mode Selection Hub

      // Increment studies completed
      const nextCompleted = (progress.completedStudiesCount || 0) + 1;
      addXp(200, { completedStudiesCount: nextCompleted });

      // Highlight confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e: any) {
      console.error("Guide generation failure:", e);
      // Automatically route all failures of custom documents to the friendly background queue
      setIsQuotaQueue(true);
      setQuotaRetrySeconds(30);
      shouldHoldLoading = true;
    } finally {
      if (!shouldHoldLoading) {
        setIsGeneratingGuide(false);
      }
    }
  };

  // XP addition logic with Level Up checking
  const addXp = (amount: number, additionalFields: Partial<UserProgress> = {}) => {
    setProgress((prev) => {
      // 1. Merge default progress fields first to ensure accuracy
      let draft: UserProgress = {
        ...prev,
        ...additionalFields,
      };

      // 2. Count normal XP and check level-ups
      let nextXp = draft.xp + amount;
      let nextLevel = draft.level;
      let nextXpNeeded = draft.xpToNextLevel;
      let leveledUp = false;

      while (nextXp >= nextXpNeeded) {
        nextXp -= nextXpNeeded;
        nextLevel += 1;
        nextXpNeeded = Math.round(nextXpNeeded * 1.15);
        leveledUp = true;
      }

      draft.level = nextLevel;
      draft.xp = nextXp;
      draft.xpToNextLevel = nextXpNeeded;

      // 3. Dynamic achievement evaluation
      const previouslyUnlocked = draft.unlockedAchievements || [];
      let newlyUnlockedIds: string[] = [];
      let achievementXpBonus = 0;

      ACHIEVEMENTS.forEach((ach) => {
        if (!previouslyUnlocked.includes(ach.id) && ach.condition(draft)) {
          newlyUnlockedIds.push(ach.id);
          achievementXpBonus += ach.xpReward;
        }
      });

      // 4. Inject achievement XP rewards if earned, recalculate Level-Ups
      if (achievementXpBonus > 0) {
        nextXp += achievementXpBonus;
        while (nextXp >= nextXpNeeded) {
          nextXp -= nextXpNeeded;
          nextLevel += 1;
          nextXpNeeded = Math.round(nextXpNeeded * 1.15);
          leveledUp = true;
        }
        draft.level = nextLevel;
        draft.xp = nextXp;
        draft.xpToNextLevel = nextXpNeeded;
      }

      draft.unlockedAchievements = [...previouslyUnlocked, ...newlyUnlockedIds];

      // 5. Trigger Level-Up Celebration
      if (leveledUp) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.4 },
            colors: ["#ffd700", "#ff6b6b", "#4ecdc4", "#6366f1"]
          });
          addNotification({
            title: `👑 LEVEL UP: Level ${nextLevel} Scholar!`,
            description: `A milestone of incredible study hours. You reached Level ${nextLevel}!`,
            type: "levelUp",
            badge: "👑 Level Up"
          });
        }, 300);
      }

      // 6. Trigger Achievements unlocked staggered toasts
      if (newlyUnlockedIds.length > 0) {
        setTimeout(() => {
          newlyUnlockedIds.forEach((id, index) => {
            const ach = ACHIEVEMENTS.find((a) => a.id === id);
            if (ach) {
              setTimeout(() => {
                confetti({
                  particleCount: 50,
                  spread: 45,
                  origin: { y: 0.85 }
                });
                addNotification({
                  title: `🏆 Achievement: ${ach.title}`,
                  description: `${ach.description} (+${ach.xpReward} XP Granted)`,
                  type: "achievement",
                  badge: ach.badge,
                  xpReward: ach.xpReward
                });
              }, index * 1000);
            }
          });
        }, 1200);
      }

      localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(draft));
      return draft;
    });
  };

  // Triggered when a flashcard is successfully memorized
  const handleMasterTerm = () => {
    addXp(25, { masteredTermsCount: progress.masteredTermsCount + 1 });
  };

  // Triggered when quiz finishes
  const handleQuizSubmitted = (score: number, total: number, difficulty: DifficultyTier) => {
    const xpReward = score * 100;
    const newLog = {
      id: "std-" + Date.now(),
      fileName,
      score,
      total,
      difficulty,
      date: new Date().toISOString().split("T")[0]
    };

    const nextHistory = [newLog, ...progress.quizHistory];
    addXp(xpReward, { quizHistory: nextHistory });
  };

  // Triggered when Pomodoro focus concludes
  const handleFocusComplete = (minutes: number) => {
    const addedSecs = minutes * 60;
    try {
      const todayStr = new Date().toLocaleDateString("sv-SE");
      const saved = localStorage.getItem("ai_study_companion_completed_focus_dates");
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes(todayStr)) {
        list.push(todayStr);
        localStorage.setItem("ai_study_companion_completed_focus_dates", JSON.stringify(list));
      }
    } catch (e) {
      console.error("Failed to log focus completion date for heatmap:", e);
    }
    addXp(150, { totalFocusSeconds: progress.totalFocusSeconds + addedSecs });
  };

  const handleUnlockTier = (tier: DifficultyTier) => {
    if (!unlockedProgressTiers.includes(tier)) {
      setUnlockedProgressTiers([...unlockedProgressTiers, tier]);
    }
  };

  const handleResetDocument = () => {
    setFileName("");
    setFileContent("");
    setGuideData(null);
    setUnlockedProgressTiers(["basic"]);
    setActiveMode("upload");
  };

  const resetAllProgressData = () => {
    syncProgress(INITIAL_PROGRESS);
    handleResetDocument();
  };

  const handleLogout = async () => {
    if (supabase && supabase.auth) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsGuestMode(false);
    setActiveMode("upload");
  };

  if (!user && !isGuestMode) {
    return <LoginView onLogin={setUser} onEnterGuest={() => setIsGuestMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-ios-light-bg dark:bg-ios-dark-bg font-sans text-black dark:text-white selection:bg-brand-indigo/20 transition-colors duration-300">
      
      {/* Upper Navigation Header bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-ios-light-bg/75 dark:bg-ios-dark-bg/75 border-b border-zinc-200/60 dark:border-zinc-900/60 transition-colors px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div id="desktop-app-header-brand" className="aria-label flex items-center gap-1.5 sm:gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center shadow-md shadow-brand-indigo/15 hover:rotate-6 transition-transform bg-white border border-zinc-200/50">
            <img src={logoUrl} alt="AI Study Companion Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1 sm:gap-1.5 text-black dark:text-white">
              AI Study Companion
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 font-bold tracking-normal uppercase bg-brand-indigo/10 text-brand-indigo rounded-md">
                V1.5
              </span>
            </h1>
          </div>
        </div>
 
        {/* Gamified Core Status widgets inside bar */}
        <div className="flex items-center gap-2 sm:gap-4">

 

 
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-black bg-brand-indigo/10 px-3 py-2 rounded-xl text-brand-indigo">
            <Zap className="w-4 h-4 fill-brand-indigo" />
            <span>LVL {progress.level} Scholar</span>
          </div>
 
          <button
            id="btn-nav-dashboard"
            onClick={() => {
              if (activeMode !== "dashboard") setActiveMode("dashboard");
              else if (guideData) setActiveMode("explore");
              else setActiveMode("upload");
            }}
            className={`p-2 sm:p-2.5 rounded-xl border transition-colors flex items-center gap-2 text-xs font-bold ${
              activeMode === "dashboard"
                ? "bg-brand-indigo text-white border-brand-indigo"
                : "bg-ios-light-secondary dark:bg-ios-dark-secondary border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:opacity-85"
            }`}
            title="Profile Dashboard & Pomodoro"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
 
          {/* Theme solar toggler */}
          <button
            id="btn-toggle-solar-scheme"
            onClick={handleToggleTheme}
            className="p-2 sm:p-2.5 rounded-xl bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Toggle contrast colors"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-zinc-650" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Logout App Button */}
          <button
            id="btn-app-logout"
            onClick={handleLogout}
            className="p-2 sm:p-2.5 rounded-xl bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-500 dark:hover:border-red-900/50 transition-colors duration-200"
            title="Sign out / Exit Guest Mode"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
 
      {/* Main viewport Container */}
      <main className="w-full mx-auto px-3 sm:px-6 py-6 sm:py-8">
        
        {/* If background loading processing guide outlines */}
        {isGeneratingGuide && (
          <div className="max-w-md mx-auto text-center py-20 bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-md">
            {isQuotaQueue ? (
              <>
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <span className="absolute inset-0 border-4 border-amber-500/15 rounded-full" />
                  <span className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin" />
                  <Clock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <span id="queue-position-badge" className="px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md">
                    Queue Position #{quotaQueuePosition}
                  </span>
                  <h3 className="text-lg font-black text-black dark:text-white mt-1">
                    Daily Upload Quota Reached
                  </h3>
                </div>
                <p className="text-xs text-ios-secondary-text mt-3 max-w-sm mx-auto leading-relaxed">
                  This system is currently in practice mode and operates under a limited daily document processing quota. 
                  Since the daily processing capacity has been saturated, the system cannot accept additional documents at this moment.
                </p>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mt-6 text-left space-y-1">
                  <div className="flex items-center justify-between text-xxs font-bold text-amber-600 dark:text-amber-400">
                    <span className="uppercase">Retrying connection...</span>
                    <span>{quotaRetrySeconds}s</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-1000" 
                      style={{ width: `${(quotaRetrySeconds / 30) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-ios-secondary-text mt-2 leading-relaxed">
                    Please keep this tab open. The system will hold your document in the queue and automatically resume parsing once daily quota clears.
                  </p>
                </div>
                <button
                  id="btn-cancel-queue"
                  type="button"
                  onClick={() => {
                    setIsGeneratingGuide(false);
                    setIsQuotaQueue(false);
                    setGenerationError("Document processing canceled by user.");
                  }}
                  className="mt-6 text-xs text-ios-secondary-text hover:text-black dark:hover:text-white font-bold underline transition-colors"
                >
                  Cancel and go back
                </button>
              </>
            ) : (
              <>
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <span className="absolute inset-0 border-4 border-brand-indigo/15 rounded-full" />
                  <span className="absolute inset-0 border-4 border-brand-indigo rounded-full border-t-transparent animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-brand-indigo animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-black dark:text-white">
                  Synthesizing Study Outline...
                </h3>
                <p className="text-xs text-ios-secondary-text mt-1 max-w-sm mx-auto leading-relaxed">
                  Applying advanced prompt-chain scaffolding to structured sections. Please wait while materials are formatted securely.
                </p>
     
                <div className="mt-8 flex flex-col items-center gap-1 text-xs text-brand-indigo font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo animate-bounce" />
                  Processing document structure...
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGeneratingGuide(false);
                      setIsQuotaQueue(false);
                      setGenerationError("Document processing canceled by user.");
                    }}
                    className="px-6 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-ios-light dark:bg-ios-dark text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all text-xs font-bold"
                  >
                    Cancel / Go Back
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!isGeneratingGuide && (
          <div className="space-y-6">
            
            {/* Display error message if guide generation failed */}
            {generationError && (
              <div className="max-w-xl mx-auto p-4.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-900 dark:text-red-300">
                <XCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Tuning Failure Detected</h4>
                  <p className="text-xxs text-red-700 dark:text-red-400 mt-1 leading-normal">
                    {generationError}
                  </p>
                  <button
                    id="btn-dismiss-error"
                    onClick={() => setGenerationError(null)}
                    className="mt-2 text-xxs font-black underline hover:text-red-600"
                  >
                    Try another file
                  </button>
                </div>
              </div>
            )}

            {/* Hub view when guide is ready and mode hasn't been set yet */}
            {guideData && activeMode === "explore" && (
              <div id="mode-selection-hub" className="max-w-3xl mx-auto text-center py-6">
                <span className="px-3 py-1 bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo font-bold rounded-full text-xxs uppercase tracking-wider">
                  ✓ Document parsed: {fileName}
                </span>

                <h2 className="text-3xl font-black text-black dark:text-white mt-4 tracking-tight">
                  Subject Workspace Ready!
                </h2>
                <p className="text-xs text-ios-secondary-text mt-2 max-w-sm mx-auto">
                  How would you like to master this material? Choose your pathway below to begin studying.
                </p>

                {/* Subject Choice Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                  
                  {/* Option 1: Study Guide */}
                  <div
                    id="hub-btn-study-guide"
                    onClick={() => setActiveMode("guide")}
                    className="bg-ios-light-secondary dark:bg-ios-dark-secondary border-2 border-zinc-200/80 dark:border-zinc-800 hover:border-brand-indigo dark:hover:border-brand-indigo p-6 rounded-3xl cursor-pointer hover:-translate-y-1 active:scale-98 transition-all flex flex-col justify-between group shadow-sm text-left"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="text-base font-extrabold text-black dark:text-white group-hover:text-brand-indigo dark:group-hover:text-brand-indigo transition-colors">
                        Structured Study Guide
                      </h4>
                      <p className="text-xs text-ios-secondary-text leading-relaxed mt-2">
                        Review the synthesized executive summary, structured section headers, core concepts, and dictionary word glossaries.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs text-brand-indigo font-extrabold">
                      <span>Explore materials</span>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                  </div>

                  {/* Option 2: Adaptive Quiz */}
                  <div
                    id="hub-btn-assessment"
                    onClick={() => setActiveMode("assessment")}
                    className="bg-ios-light-secondary dark:bg-ios-dark-secondary border-2 border-zinc-200/80 dark:border-zinc-800 hover:border-brand-indigo dark:hover:border-brand-indigo p-6 rounded-3xl cursor-pointer hover:-translate-y-1 active:scale-98 transition-all flex flex-col justify-between group shadow-sm text-left"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                        <Target className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="text-base font-extrabold text-black dark:text-white group-hover:text-brand-indigo dark:group-hover:text-brand-indigo transition-colors">
                        Adaptive Assessments
                      </h4>
                      <p className="text-xs text-ios-secondary-text leading-relaxed mt-2">
                        Challenge your brain using progressive difficulty modes. Track scores with adaptive unlocks and level up!
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs text-brand-indigo font-extrabold">
                      <span>Begin Quizzes</span>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                  </div>

                  {/* Option 3: Flashcards */}
                  <div
                    id="hub-btn-flashcards"
                    onClick={() => setActiveMode("flashcards")}
                    className="bg-ios-light-secondary dark:bg-ios-dark-secondary border-2 border-zinc-200/80 dark:border-zinc-800 hover:border-brand-indigo dark:hover:border-brand-indigo p-6 rounded-3xl cursor-pointer hover:-translate-y-1 active:scale-98 transition-all flex flex-col justify-between group shadow-sm text-left"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                        <Shuffle className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="text-base font-extrabold text-black dark:text-white group-hover:text-brand-indigo dark:group-hover:text-brand-indigo transition-colors">
                        Interactive Flashcards
                      </h4>
                      <p className="text-xs text-ios-secondary-text leading-relaxed mt-2">
                        Spin flippable memory modules containing key vocabulary words. Test direct recall with visual mastery feedback.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs text-brand-indigo font-extrabold">
                      <span>Review cards</span>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                  </div>

                </div>

                <div className="mt-12 text-center">
                  <button
                    id="btn-upload-alternate-document"
                    onClick={handleResetDocument}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-brand-indigo hover:opacity-90 shadow-md shadow-brand-indigo/20 rounded-xl transition-all border border-brand-indigo"
                  >
                    Upload Another Document
                  </button>
                </div>
              </div>
            )}

            {/* Render Views depending on state modes */}
            {activeMode === "upload" && (
              <UploadView onFileLoaded={handleFileParsed} isLoading={isGeneratingGuide} />
            )}

            {activeMode === "guide" && guideData && (
              <div className="space-y-4">
                <GuideView guide={guideData} fileName={fileName} />
                <div className="mt-12 text-center pb-8">
                  <button
                    id="btn-back-to-explore-guide"
                    onClick={() => setActiveMode("explore")}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-brand-indigo hover:opacity-90 shadow-md shadow-brand-indigo/20 rounded-xl transition-all border border-brand-indigo"
                  >
                    ← Back to Subject Workspace Hub
                  </button>
                </div>
              </div>
            )}

            {activeMode === "assessment" && (
              <div className="space-y-4">
                <QuizView
                  fileName={fileName}
                  fileContent={fileContent}
                  onQuizSubmitted={handleQuizSubmitted}
                  unlockedTiers={unlockedProgressTiers}
                  onUnlockTier={handleUnlockTier}
                />
                <div className="mt-12 text-center pb-8">
                  <button
                    id="btn-back-to-explore-quiz"
                    onClick={() => setActiveMode("explore")}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-brand-indigo hover:opacity-90 shadow-md shadow-brand-indigo/20 rounded-xl transition-all border border-brand-indigo"
                  >
                    ← Back to Subject Workspace Hub
                  </button>
                </div>
              </div>
            )}

            {activeMode === "flashcards" && guideData && (
              <div className="space-y-4">
                <Flashcards cards={guideData.flashcards} onMasterTerm={handleMasterTerm} />
                <div className="mt-12 text-center pb-8">
                  <button
                    id="btn-back-to-explore-flashcards"
                    onClick={() => setActiveMode("explore")}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-brand-indigo hover:opacity-90 shadow-md shadow-brand-indigo/20 rounded-xl transition-all border border-brand-indigo"
                  >
                    ← Back to Subject Workspace Hub
                  </button>
                </div>
              </div>
            )}

            {activeMode === "dashboard" && (
              <div className="space-y-4">
                <Dashboard
                  progress={progress}
                  onFocusComplete={handleFocusComplete}
                  onResetProgress={resetAllProgressData}
                  fileName={fileName}
                  fileContent={fileContent}
                  timerMode={timerMode}
                  timeLeft={timeLeft}
                  timerIsRunning={timerIsRunning}
                  setTimerMode={setTimerMode}
                  setTimeLeft={setTimeLeft}
                  setTimerIsRunning={setTimerIsRunning}
                  musicTracks={musicTracks}
                  selectedTrackId={selectedTrackId}
                  musicIsPlaying={musicIsPlaying}
                  musicVolume={musicVolume}
                  musicIsMuted={musicIsMuted}
                  musicSynthType={musicSynthType}
                  musicError={musicError}
                  onSelectTrack={changeTrack}
                  onTogglePlayMusic={togglePlayMusic}
                  onSetMusicVolume={setMusicVolume}
                  onSetMusicIsMuted={setMusicIsMuted}
                  onAddCustomTrack={handleAddCustomTrack}
                  onRemoveCustomTrack={handleRemoveCustomTrack}
                  sleepTimerMinutes={sleepTimerMinutes}
                  sleepTimerSecondsLeft={sleepTimerSecondsLeft}
                  onSetSleepTimerMinutes={setSleepTimerMinutes}
                  dailyFocusGoalRounds={dailyFocusGoalRounds}
                  onSetDailyFocusGoalRounds={setDailyFocusGoalRounds}
                  onAddXp={(amount) => addXp(amount)}
                />
                {guideData && (
                  <div className="mt-12 text-center pb-8">
                    <button
                      id="btn-back-to-explore-dashboard"
                      onClick={() => setActiveMode("explore")}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-brand-indigo hover:opacity-90 shadow-md shadow-brand-indigo/20 rounded-xl transition-all border border-brand-indigo"
                    >
                      ← Back to Subject Workspace Hub
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Styled academic Footer footer */}
      <footer className="mt-20 border-t border-zinc-200/60 dark:border-zinc-900 pb-10 pt-6 text-center text-zinc-400 text-xxs font-medium tracking-normal container mx-auto">
        <p>© 2026 AI Study Companion. Developed by Mark Welly Pardillo by the help of Google AI Studio.</p>
      </footer>

      {/* Floating iPhone-style Dynamic Island Notification & Companion System */}
      <DynamicIsland
        timerIsRunning={timerIsRunning}
        timeLeft={timeLeft}
        timerMode={timerMode}
        setTimerIsRunning={setTimerIsRunning}
        setTimeLeft={setTimeLeft}
        setTimerMode={setTimerMode}
        notifications={notifications}
        setNotifications={setNotifications}
        activeMode={activeMode}
        progress={progress}
        setActiveMode={setActiveMode}
        musicTracks={musicTracks}
        selectedTrackId={selectedTrackId}
        musicIsPlaying={musicIsPlaying}
        musicVolume={musicVolume}
        musicIsMuted={musicIsMuted}
        onTogglePlayMusic={togglePlayMusic}
        onSetMusicVolume={setMusicVolume}
        onSetMusicIsMuted={setMusicIsMuted}
      />

      {/* Floating Notepad / Scratchpad */}
      <FloatingNotepad />
    </div>
  );
}
