import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, logout, db } from "./lib/firebase";
import { loadProgressFromFirestore, saveProgressToFirestore, logGlobalActivity, logGuestLogin, subscribeToMaintenanceMode, checkIfBanned } from "./lib/db";
import { onAuthStateChanged } from "firebase/auth";
import { getCustomUser, customSignOut } from "./lib/customAuth";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { LoginView } from "./components/LoginView";

import logoUrl from "./assets/images/app_logo.png";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Cpu,
  ArrowRight,
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
  LayoutDashboard,
  FileText,
  Play,
  FolderOpen,
  History,
  Menu,
  Trash2,
  Camera,
  UserPlus
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
import GuideLoadingScreen from "./components/GuideLoadingScreen";
import GuideView from "./components/GuideView";
import QuizView from "./components/QuizView";
import Flashcards from "./components/Flashcards";
import Dashboard from "./components/Dashboard";
import DynamicIsland from "./components/DynamicIsland";
import FloatingNotepad from "./components/FloatingNotepad";
import WelcomeTour from "./components/WelcomeTour";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { triggerConfettiWithSound as confetti, playNotificationSound } from "./lib/sounds";
import { PRELOADED_SUBJECTS } from "./data/preloadedSubjects";
import ReactPlayer from "react-player";

const LOCAL_STORAGE_PROGRESS_KEY = "ai_study_companion_progress";
import { initGlobalPresence, forceUpdatePresence, subscribeToMessages, getClientUid, subscribeToAnnouncements } from "./lib/socketPresence";

const getLocalISOString = (d: Date) => {
  // Use local parts to build YYYY-MM-DD
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export interface NotificationInfo {
  id: string;
  title: string;
  description: string;
  type: "achievement" | "reminder" | "levelUp" | "info";
  badge?: string;
  xpReward?: number;
  action?: string;
  actionPayload?: any;
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
  xp: 0,
  level: 1,
  xpToNextLevel: 1000,
  dailyStreak: 0,
  lastActiveDate: new Date().toISOString(),
  totalFocusSeconds: 0,
  quizHistory: [],
  masteredTermsCount: 0,
  completedStudiesCount: 0,
  unlockedAchievements: []
};

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
    const photo = localStorage.getItem("ai_study_companion_photo_url") || "";
    let baseProgress = INITIAL_PROGRESS;
    if (saved) {
      try {
        baseProgress = { ...INITIAL_PROGRESS, ...JSON.parse(saved) };
      } catch (err) {
        console.error("Failed to parse progress", err);
      }
    }
    return { ...baseProgress, photoURL: photo || baseProgress.photoURL || "" };
  });
  const [activeMode, setActiveMode] = useState<AppMode>("upload");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const [user, setUser] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToMaintenanceMode(setIsMaintenanceMode);
    return () => unsub();
  }, []);

  useEffect(() => {
    // Check for custom local user first
    const customUser = getCustomUser();
    if (customUser) {
      setUser(customUser);
      setIsGuestMode(false);
      loadProgressFromFirestore().then(storedProgress => {
        const photo = localStorage.getItem("ai_study_companion_photo_url") || (storedProgress && storedProgress.photoURL) || "";
        if (storedProgress) {
          setProgress(prev => ({
            ...prev,
            ...storedProgress,
            photoURL: photo || storedProgress.photoURL || prev.photoURL || ""
          }));
        } else {
          if (photo) {
            setProgress(prev => ({ ...prev, photoURL: photo }));
          }
        }
        setAuthInitialized(true);
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const isBanned = await checkIfBanned(currentUser.uid);
        if (isBanned) {
          await logout();
          alert("Your account has been permanently banned.");
          setUser(null);
          setAuthInitialized(true);
          return;
        }
      }
      setUser(currentUser);
      if (currentUser) {
        setIsGuestMode(false);
        const storedProgress = await loadProgressFromFirestore();
        const photo = localStorage.getItem("ai_study_companion_photo_url") || (storedProgress && storedProgress.photoURL) || currentUser.photoURL || "";
        if (storedProgress) {
          setProgress(prev => ({
            ...prev,
            ...storedProgress,
            photoURL: photo || storedProgress.photoURL || prev.photoURL || ""
          }));
        } else {
          if (photo) {
            setProgress(prev => ({ ...prev, photoURL: photo }));
          }
        }
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !isGuestMode) {
      saveProgressToFirestore(progress);
    } else {
      localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(progress));
    }
  }, [progress, user, isGuestMode]);

  useEffect(() => {
    localStorage.setItem("ai_study_companion_active_tab", activeMode);
    forceUpdatePresence(user);
  }, [activeMode, user]);

  useEffect(() => {
    initGlobalPresence(user);
  }, [user]);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    forceUpdatePresence(user);
  }, [progress.photoURL, user]);

  useEffect(() => {
    if (progress.photoURL) {
      localStorage.setItem("ai_study_companion_photo_url", progress.photoURL);
    } else {
      localStorage.removeItem("ai_study_companion_photo_url");
    }
    window.dispatchEvent(
      new CustomEvent("update-profile-photo", {
        detail: { photoURL: progress.photoURL || "" }
      })
    );
  }, [progress.photoURL]);

  useEffect(() => {
    const handleUpdateProfilePhoto = (e: any) => {
      const { photoURL } = e.detail;
      setProgress(prev => {
        if (prev.photoURL === photoURL) return prev;
        return { ...prev, photoURL };
      });
    };
    window.addEventListener("update-profile-photo", handleUpdateProfilePhoto);
    return () => window.removeEventListener("update-profile-photo", handleUpdateProfilePhoto);
  }, []);

  // Document extraction variables
  const [fileName, setFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [guideData, setGuideData] = useState<StudyGuideData | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Notification / Reminder Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);

  useEffect(() => {
    const savedTime = localStorage.getItem("study_reminder_time");
    const isEnabled = localStorage.getItem("study_reminder_enabled") === "true";
    if (savedTime) setReminderTime(savedTime);
    if (isEnabled) setIsReminderEnabled(isEnabled);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isReminderEnabled && reminderTime) {
      interval = setInterval(() => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        const lastNotified = localStorage.getItem("study_reminder_last_notified");
        const todayStr = now.toDateString() + currentTime;

        if (currentTime === reminderTime && lastNotified !== todayStr) {
          if (Notification.permission === 'granted') {
            new Notification("Study Time!", {
              body: "It's time for your daily study session. Let's keep that streak going!",
              icon: logoUrl,
            });
            localStorage.setItem("study_reminder_last_notified", todayStr);
          }
        }
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [isReminderEnabled, reminderTime]);

  const toggleReminder = async () => {
    if (!isReminderEnabled) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
      }
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }
    }
    const newState = !isReminderEnabled;
    setIsReminderEnabled(newState);
    localStorage.setItem("study_reminder_enabled", String(newState));
  };

  const updateReminderTime = (time: string) => {
    setReminderTime(time);
    localStorage.setItem("study_reminder_time", time);
  };


  // History Sidebar variables
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"history" | "premade">("history");

  const fetchHistory = async () => {
    if (!user || isGuestMode) return;
    setIsLoadingHistory(true);
    try {
      const guidesRef = collection(db, "users", user.uid, "studyGuides");
      const snapshot = await getDocs(guidesRef);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to avoid index issues for now
      items.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setHistoryItems(items);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const renderSidebar = (isDesktop: boolean) => {
    const isCurrentlyCollapsed = isDesktop && isSidebarCollapsed;

    return (
      <motion.div 
        animate={isDesktop ? { width: isCurrentlyCollapsed ? 64 : 288 } : {}}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className={`bg-white dark:bg-[#09090b] border-r border-zinc-100/50 dark:border-zinc-900/50 flex flex-col shrink-0 z-50 overflow-hidden ${
          isDesktop 
            ? "hidden lg:flex sticky top-0 h-dvh" 
            : "flex h-full w-72"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-0 flex items-center justify-between h-16 shrink-0 relative overflow-hidden w-[288px]">
          {/* Logo + Title group (shifts/fades out as it collapses) */}
          <div className={`flex items-center gap-2 truncate transition-all duration-300 ${
            isCurrentlyCollapsed ? "opacity-0 -translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"
          }`}>
            <img src={logoUrl} alt="Logo" className="w-5 h-5 rounded-md object-cover shrink-0" referrerPolicy="no-referrer" />
            <span className="truncate font-bold text-sm text-black dark:text-white">AI Study Companion</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isDesktop ? (
              isCurrentlyCollapsed ? (
                /* Centered open button when collapsed */
                <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-center">
                  <button 
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="relative w-10 h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center transition-all duration-300 group cursor-pointer"
                    title="Open Sidebar"
                  >
                    {/* Logo image with transition */}
                    <div className="transition-all duration-300 group-hover:opacity-0 group-hover:scale-75">
                      <img src={logoUrl} alt="Logo" className="w-6 h-6 rounded-md object-cover" referrerPolicy="no-referrer" />
                    </div>
                    {/* Chevron icon showing on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 text-zinc-600 dark:text-zinc-300">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                </div>
              ) : (
                /* Collapse button when expanded */
                <button 
                  onClick={() => setIsSidebarCollapsed(true)} 
                  className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 shrink-0"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )
            ) : (
              <button onClick={() => setIsHistorySidebarOpen(false)} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0">
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Content (Hidden/Collapsed on desktop when isSidebarCollapsed is true) */}
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 overflow-hidden ${
          isCurrentlyCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`} style={{ width: 288 }}>
          {/* Segmented controls / Tabs */}
          <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/40 border-0 flex gap-1.5 shrink-0">
            <button
              onClick={() => setSidebarTab("history")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sidebarTab === "history"
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                  : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              History
            </button>
            <button
              onClick={() => setSidebarTab("premade")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sidebarTab === "premade"
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                  : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Premade
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {sidebarTab === "history" ? (
              isGuestMode ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">You are currently in Guest Mode.</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Log in to automatically save, sync, and persist your custom generated study materials across sessions.</p>
                </div>
              ) : isLoadingHistory ? (
                <div className="p-4 text-xs text-zinc-500 text-center">Loading history...</div>
              ) : historyItems.length === 0 ? (
                <div className="p-4 text-xs text-zinc-500 text-center">No custom study guides yet. Upload some files to start!</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {historyItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setFileName(item.fileName);
                        setGuideData(item.guideData);
                        setActiveMode("explore");
                        if (!isDesktop) {
                          setIsHistorySidebarOpen(false);
                        }
                      }}
                      className="text-left p-3 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors truncate font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      {item.fileName}
                    </button>
                  ))}
                </div>
              )
            ) : (
              /* Premade files */
              <div className="flex flex-col gap-2">
                {PRELOADED_SUBJECTS.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      handleLoadPremade(doc);
                      if (!isDesktop) {
                        setIsHistorySidebarOpen(false);
                      }
                    }}
                    className="text-left p-3 rounded-xl border-0 bg-ios-light-secondary dark:bg-[#121215] hover:ring-1 hover:ring-zinc-300 dark:hover:ring-zinc-850 cursor-pointer transition-all flex flex-col gap-1.5 group hover:-translate-y-0.5 active:scale-98 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span className="text-[9px] font-extrabold text-black dark:text-white uppercase bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                        {doc.title.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-black dark:text-white truncate group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                      {doc.title.replace(/\.[^/.]+$/, "")}
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {doc.short}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold group-hover:text-black dark:group-hover:text-white transition-colors">
                      <span>Try Subject</span>
                      <Play className="w-2.5 h-2.5 fill-current text-current" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Unified Sidebar Footer with Beautiful Transitions */}
        <div className="border-t border-zinc-100/50 dark:border-zinc-900/50 bg-zinc-50/50 dark:bg-[#0c0c0e]/50 shrink-0 h-[120px] relative overflow-hidden w-[288px]">
          {/* Expanded Footer Content */}
          <div className={`absolute inset-0 p-4 flex flex-col gap-3 transition-all duration-300 ${
            isCurrentlyCollapsed ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"
          }`}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="text-left w-full flex items-center gap-2.5 px-1.5 py-1 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 transition-all active:scale-[0.98] focus:outline-none cursor-pointer"
            >
              {progress.photoURL ? (
                <img
                  src={progress.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-0 shrink-0 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border-0 flex items-center justify-center text-zinc-950 dark:text-zinc-50 font-black text-xs uppercase shrink-0 shadow-sm">
                  {isGuestMode ? "G" : user?.email?.charAt(0) || "U"}
                </div>
              )}
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-black dark:text-white truncate">
                  {isGuestMode ? "Guest User" : user?.username || user?.displayName || user?.email || "User"}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                  {isGuestMode ? "Limited Session" : "Premium Member"}
                </p>
              </div>
            </button>

            <div className="flex justify-start px-1.5">
              <button
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  if (!isDesktop) {
                    setIsHistorySidebarOpen(false);
                  }
                }}
                className="w-10 h-10 rounded-xl bg-ios-light-secondary dark:bg-ios-dark-secondary border-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all flex items-center justify-center text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-sm active:scale-95"
                title="Open App Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsed Footer Content (Centered inside the 64px area) */}
          <div className={`absolute inset-y-0 left-0 w-16 py-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
            isCurrentlyCollapsed ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 -translate-y-4 pointer-events-none"
          }`}>
            {/* Profile Avatar Button */}
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="relative w-8 h-8 rounded-full border-0 shrink-0 shadow-sm focus:outline-none transition-transform active:scale-95 cursor-pointer hover:ring-2 hover:ring-[#5a4bff]/50 dark:hover:ring-[#8075ff]/50"
              title="View Profile & Account"
            >
              {progress.photoURL ? (
                <img
                  src={progress.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-0 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border-0 flex items-center justify-center text-zinc-950 dark:text-zinc-50 font-black text-xs uppercase shrink-0">
                  {isGuestMode ? "G" : user?.email?.charAt(0) || "U"}
                </div>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
              }}
              className="w-10 h-10 rounded-xl bg-ios-light-secondary dark:bg-ios-dark-secondary border-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all flex items-center justify-center text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-sm active:scale-95"
              title="Open App Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("ai_study_companion_active_file", fileName);
    forceUpdatePresence(user);
  }, [fileName, user]);

  // Infinite upload quota queuing system states
  const [isQuotaQueue, setIsQuotaQueue] = useState<boolean>(false);
  const [quotaQueuePosition, setQuotaQueuePosition] = useState<number>(() => Math.floor(Math.random() * 3) + 1);
  const [quotaRetrySeconds, setQuotaRetrySeconds] = useState<number>(30);

  // Difficulty unlocks
  const [unlockedProgressTiers, setUnlockedProgressTiers] = useState<DifficultyTier[]>(["basic"]);

  // Floating System Notifications
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);

  // Global listener for Direct Messages
  const activeModeRef = useRef(activeMode);
  useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);

  useEffect(() => {
    const unsub = subscribeToMessages((msg) => {
      const myId = getClientUid();
      if (msg.fromId !== myId && activeModeRef.current !== "dashboard") {
        window.dispatchEvent(
          new CustomEvent("add-notification", {
            detail: {
              title: `New message from ${msg.fromName}`,
              description: msg.message,
              type: "info",
              badge: "💬 Chat",
              action: "open-chat",
              actionPayload: { companionId: msg.fromId, companionName: msg.fromName }
            }
          })
        );
      }
    });

    const unsubAnnouncements = subscribeToAnnouncements((data) => {
      window.dispatchEvent(
        new CustomEvent("add-notification", {
          detail: {
            title: `System Broadcast • ${data.fromName}`,
            description: data.message,
            type: "warning",
            badge: "📢 Announcement",
          }
        })
      );
    });

    const handleOpenChatAction = (e: any) => {
      if (activeModeRef.current !== "dashboard") {
        setActiveMode("dashboard");
        // re-dispatch for StudyLounge after mount
        setTimeout(() => {
           window.dispatchEvent(new CustomEvent("open-chat-action", { detail: e.detail }));
        }, 300);
      }
    };
    window.addEventListener("open-chat-action", handleOpenChatAction);

    return () => {
      unsub();
      unsubAnnouncements();
      window.removeEventListener("open-chat-action", handleOpenChatAction);
    };
  }, []);

  // Lifted Pomodoro Timer state (persistent background tracking)
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("ai_study_companion_timer_running", timerIsRunning ? "true" : "false");
    localStorage.setItem("ai_study_companion_timer_mode", timerMode);
    // Add small delay to let DOM settle if it's still being read in some places
    setTimeout(() => forceUpdatePresence(user), 100);
  }, [timerIsRunning, timerMode, user]);

  // Periodic study/focus notifications tracker seconds
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [notificationIntervalType, setNotificationIntervalType] = useState<"demo" | "standard">("standard");

  // --- Centralized Focus Music State variables ---
  const [musicTracks, setMusicTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("custom_tracks_data");
    const parsedSaved = saved ? JSON.parse(saved) : [];
    const all = [...DEFAULT_TRACKS, ...parsedSaved];
    // Auto-migrate any existing youtube URLs saved as 'stream'
    return all.map(t => {
      if (t.src && (t.src.includes("youtube.com") || t.src.includes("youtu.be"))) {
        return { ...t, type: "youtube" };
      }
      return t;
    });
  });
  const [selectedTrackId, setSelectedTrackId] = useState<string>("40hz-binaural");
  const [musicIsPlaying, setMusicIsPlaying] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.5);
  const [musicIsMuted, setMusicIsMuted] = useState<boolean>(false);
  const [musicSynthType, setMusicSynthType] = useState<"40hz" | "pink" | null>(null);
  const [musicError, setMusicError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("ai_study_companion_music_playing", musicIsPlaying ? "true" : "false");
    const track = musicTracks.find(t => t.id === selectedTrackId);
    localStorage.setItem("ai_study_companion_track_name", track ? track.name : "Focus Music");
    forceUpdatePresence(user);
  }, [musicIsPlaying, selectedTrackId, musicTracks, user]);

  // Enhancement: Sleep/Snooze timer for focus music
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerSecondsLeft, setSleepTimerSecondsLeft] = useState<number>(0);

  // Customizable Daily Focus Goal
  const [dailyFocusGoalRounds, setDailyFocusGoalRounds] = useState<number>(() => {
    const saved = localStorage.getItem("ai_study_companion_daily_goal");
    return saved ? parseInt(saved, 10) : 4;
  });

  const [localActivityTrigger, setLocalActivityTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setLocalActivityTrigger(prev => prev + 1);
    window.addEventListener("local-activity-updated", handleUpdate);
    
    let lastDate = new Date().toDateString();
    const interval = setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        handleUpdate();
      }
    }, 60000); // Check every minute for day change
    
    return () => {
      window.removeEventListener("local-activity-updated", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Automatically calculate and synchronize the streak across sessions
  useEffect(() => {
    const counts: Record<string, number> = {};
    
    progress.quizHistory.forEach(q => {
      if (q.date) counts[q.date] = 1;
    });
    
    try {
      const fc = localStorage.getItem("ai_study_companion_completed_focus_dates");
      if (fc) JSON.parse(fc).forEach((dStr: string) => { counts[dStr] = 1; });
    } catch(e) {}
    
    try {
       const jc = localStorage.getItem("ai_study_companion_journal_entries");
       if (jc) JSON.parse(jc).forEach((je: any) => { if (je.dateStr) counts[je.dateStr] = 1; });
    } catch(e) {}

    try {
       const sc = localStorage.getItem("ai_study_companion_simulated_dates");
       if (sc) JSON.parse(sc).forEach((dStr: string) => { counts[dStr] = 1; });
    } catch(e) {}

    let streak = 0;
    const tempDate = new Date();
    for (let i = 0; i < 365; i++) {
      const checkStr = getLocalISOString(tempDate);
      if (counts[checkStr]) {
        streak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        if (i === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = getLocalISOString(yesterday);
          if (counts[yStr]) {
            tempDate.setDate(tempDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    if (progress.dailyStreak !== streak) {
      setProgress(p => {
        const next = { ...p, dailyStreak: streak, lastActiveDate: new Date().toISOString() };
        localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [progress.quizHistory, progress.totalFocusSeconds, localActivityTrigger]);

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
      // audio.onplay = () => setMusicIsPlaying(true);
      // audio.onpause = () => setMusicIsPlaying(false);
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

    // Auto-detect youtube URLs if type is incorrectly set to stream
    if (targetTrack.src && (targetTrack.src.includes("youtube.com") || targetTrack.src.includes("youtu.be"))) {
      targetTrack.type = "youtube";
    }

    if (targetTrack.type === "youtube") {
      stopSynth();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else if (targetTrack.type === "synth") {
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
          audioRef.current.src = pathUrl;
        }
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            const errorStr = error?.message || String(error);
            if (error?.name === 'AbortError' || errorStr.includes('interrupted') || errorStr.includes('removed from the document')) {
              // Silently ignore expected interruption errors
              return;
            }
            if (error?.name === 'NotAllowedError') {
              setMusicError("Autoplay blocked by browser. Please interact with the page first.");
              setMusicIsPlaying(false);
              stopSynth();
              return;
            }
            console.error("Audio Playback aborted:", error);
            setMusicError("Unable to stream audio track. Check link or connectivity.");
            setMusicIsPlaying(false);
            stopSynth();
          });
        }
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
    playNotificationSound();
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  useEffect(() => {
    const handleGlobalNotif = (e: any) => addNotification(e.detail);
    window.addEventListener("add-notification", handleGlobalNotif);
    return () => window.removeEventListener("add-notification", handleGlobalNotif);
  }, []);

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
        const photo = localStorage.getItem("ai_study_companion_photo_url") || "";
        setProgress(prev => ({
          ...prev,
          ...parsed,
          photoURL: photo || parsed.photoURL || prev.photoURL || ""
        }));
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
  const syncProgress = (updated: Partial<UserProgress>) => {
    setProgress(prev => {
      const merged = { ...prev, ...updated, photoURL: updated.photoURL || prev.photoURL || "" };
      localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(merged));
      return merged;
    });
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

  // Handle instant premium loading of premade files
  const handleLoadPremade = async (subject: any) => {
    setIsHistorySidebarOpen(false);
    setFileName(subject.title);
    setFileContent(subject.content);
    setIsGeneratingGuide(true);
    setActiveMode("upload"); // visually show parsing animation
    await handleFileParsed(subject.title, subject.content);
  };

  // Triggered when file has completed parsing
  const handleFileParsed = async (name: string, content: string) => {
    let shouldHoldLoading = false;
    try {
      // Record activity for streak
      try {
        const todayStr = getLocalISOString(new Date());
        const saved = localStorage.getItem("ai_study_companion_simulated_dates");
        const list = saved ? JSON.parse(saved) : [];
        if (!list.includes(todayStr)) {
          list.push(todayStr);
          localStorage.setItem("ai_study_companion_simulated_dates", JSON.stringify(list));
          window.dispatchEvent(new Event("local-activity-updated"));
        }
      } catch (e) {
        console.error("Failed to log activity for streak:", e);
      }

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
      
      // Save to Firestore history
      if (user && !isGuestMode) {
        logGlobalActivity("generate_guide", { fileName: name });
        try {
          const guidesRef = collection(db, "users", user.uid, "studyGuides");
          await addDoc(guidesRef, {
            fileName: name,
            guideData: generatedGuide,
            createdAt: serverTimestamp()
          });
        } catch (dbErr) {
          console.error("Failed to save guide to history:", dbErr);
        }
      }

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
    if (user && !isGuestMode) {
      logGlobalActivity("quiz_submitted", { score, total, difficulty, fileName });
    }
    const xpReward = score * 100;
    const newLog = {
      id: "std-" + Date.now(),
      fileName,
      score,
      total,
      difficulty,
      date: getLocalISOString(new Date())
    };

    const nextHistory = [newLog, ...progress.quizHistory];
    addXp(xpReward, { quizHistory: nextHistory });
  };

  // Triggered when Pomodoro focus concludes
  const handleFocusComplete = (minutes: number) => {
    if (user && !isGuestMode) {
      logGlobalActivity("focus_completed", { minutes });
    }
    const addedSecs = minutes * 60;
    try {
      const todayStr = getLocalISOString(new Date());
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
    try {
      customSignOut();
      await logout();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setIsGuestMode(false);
    setActiveMode("upload");
  };

  const isAdminUser = user?.email === 'pmarkwelly@gmail.com';

  if (isMaintenanceMode && !isAdminUser) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white p-4 md:p-8 lg:p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-[120px]"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto bg-white/70 dark:bg-zinc-900/70 backdrop-blur-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-8 md:p-16 lg:p-20 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl shadow-black/5"
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-24">
            <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-amber-100 dark:bg-amber-900/30 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner relative overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-20 border-2 border-amber-500 rounded-[2rem] border-dashed"
                />
                <Settings className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-amber-500 relative z-10" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                Pardon<br className="hidden lg:block" /> our dust
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg lg:text-xl leading-relaxed max-w-xl">
                The AI Study Companion platform is currently undergoing scheduled maintenance to bring you new features and a better experience. We'll be back shortly!
              </p>
            </div>
            
            <div className="flex-1 w-full flex flex-col gap-4 lg:gap-6 lg:mt-0 lg:pt-8 justify-center">
              <p className="text-xs lg:text-sm font-bold text-zinc-500 uppercase tracking-wider text-center lg:text-left mb-2 lg:mb-4">What we are working on</p>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-zinc-100/90 dark:bg-zinc-950/90 rounded-3xl p-6 flex items-center gap-6 text-left border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm"
              >
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shrink-0">
                  <Cpu className="w-7 h-7 lg:w-8 lg:h-8 text-indigo-500" />
                </div>
                <div>
                  <p className="text-lg lg:text-xl font-bold text-zinc-900 dark:text-white mb-1">Upgrading AI Models</p>
                  <p className="text-sm lg:text-base text-zinc-500">Enhancing study guide generation</p>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-zinc-100/90 dark:bg-zinc-950/90 rounded-3xl p-6 flex items-center gap-6 text-left border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm"
              >
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center shrink-0">
                  <Zap className="w-7 h-7 lg:w-8 lg:h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-lg lg:text-xl font-bold text-zinc-900 dark:text-white mb-1">Platform Stability</p>
                  <p className="text-sm lg:text-base text-zinc-500">Improving speed and reliability</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        <div className="absolute bottom-6 md:bottom-12 text-center text-sm md:text-base text-zinc-500 font-medium">
          <p>Thank you for your patience.</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return <LoginView onLogin={setUser} onEnterGuest={() => {
      setIsGuestMode(true);
      const guestName = `Guest_${Math.floor(Math.random() * 10000)}`;
      logGuestLogin(guestName);
      logGlobalActivity("guest_login", { isGuest: true, guestId: guestName, guestName: guestName });
    }} />;
  }

  const currentTrack = musicTracks.find((t) => t.id === selectedTrackId) || musicTracks[0];
  const isYoutubeTrack = currentTrack?.type === "youtube";

  return (
    <div className="min-h-dvh bg-ios-light-bg dark:bg-ios-dark-bg font-sans text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-300 flex">
      <WelcomeTour />
      <OfflineIndicator />
      <div style={{ position: 'fixed', bottom: '0px', right: '0px', width: '1px', height: '1px', overflow: 'hidden', pointerEvents: 'none', zIndex: -10, opacity: 0.01 }}>
        <ReactPlayer 
          url={currentTrack?.type === 'youtube' ? currentTrack.src : "https://www.youtube.com/watch?v=dQw4w9WgXcQ"} 
          playing={isYoutubeTrack && musicIsPlaying} 
          volume={musicIsMuted ? 0 : musicVolume}
          // onPlay={() => {}}
          // onPause={() => {}}
          onEnded={() => {
            if (isYoutubeTrack) setMusicIsPlaying(false);
          }}
          onError={(e) => {
            if (isYoutubeTrack) {
              console.warn("YouTube Player Error:", e);
              // setMusicError("Unable to play YouTube track.");
              setMusicIsPlaying(false);
            }
          }}
          width="10px"
          height="10px"
          config={{
            youtube: {
               // @ts-ignore
              playerVars: { 
                autoplay: 0, 
                playsinline: 1,
                controls: 0,
                disablekb: 1,
                fs: 0
              }
            }
          }}
        />
      </div>
      {/* Google-like Account / Profile Popover Menu for Collapsed Sidebar */}
      <AnimatePresence>
        {isProfileMenuOpen && (
          <>
            {/* Backdrop layer to capture outside clicks */}
            <div
              className="fixed inset-0 z-[190] cursor-default"
              onClick={() => setIsProfileMenuOpen(false)}
            />

            {/* Profile Popover Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 20, stiffness: 220 }}
              className={`fixed bottom-20 w-[calc(100vw-32px)] sm:w-[320px] rounded-[28px] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)] border z-[200] bg-[#e9eef6] dark:bg-[#1e1f22] border-zinc-200/60 dark:border-zinc-800/80 flex flex-col items-center justify-center font-sans animate-in fade-in zoom-in-95 duration-150 left-4 ${
                isSidebarCollapsed ? "sm:left-20" : "sm:left-[304px]"
              }`}
            >
              {/* Center Profile Picture Circle with Camera Overlay */}
              <div className="relative mt-2">
                {progress.photoURL ? (
                  <img
                    src={progress.photoURL}
                    alt="Profile"
                    className="w-[84px] h-[84px] rounded-full object-cover shadow-sm ring-4 ring-white dark:ring-zinc-900 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-[84px] h-[84px] rounded-full bg-zinc-300 dark:bg-zinc-800 flex items-center justify-center text-zinc-950 dark:text-zinc-50 font-black text-2xl uppercase shrink-0 shadow-sm ring-4 ring-white dark:ring-zinc-900">
                    {isGuestMode ? "G" : user?.email?.charAt(0) || "U"}
                  </div>
                )}
                {/* Decorative Camera Badge (Matches second image) */}
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-all">
                  <Camera className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                </div>
              </div>

              {/* Greeting */}
              <h3 className="mt-4 text-[17px] font-bold text-zinc-900 dark:text-white text-center leading-snug">
                Hi, {(user?.displayName || user?.email?.split('@')[0] || "Student").toUpperCase()}!
              </h3>

              {/* Email Address */}
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 text-center select-all truncate max-w-full">
                {user?.email || "student@example.com"}
              </p>

              {/* Separator / Spacer */}
              <div className="w-full h-px bg-zinc-200/50 dark:bg-zinc-800/50 my-5" />

              {/* Quick Actions Pills Row */}
              <div className="flex gap-2.5 w-full">
                {/* Switch Account */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-sm active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#5a4bff] dark:text-[#8075ff]" />
                  <span>Switch account</span>
                </button>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-sm active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-zinc-650 dark:text-zinc-400" />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {renderSidebar(true)}

      <div className="flex-1 flex flex-col min-h-dvh min-w-0">
        <AnimatePresence>
          {isHistorySidebarOpen && (
            <div className="lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsHistorySidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-[150] backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-[#09090b] border-0 z-[160] flex flex-col shadow-2xl"
              >
                {renderSidebar(false)}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Upper Navigation Header bar */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-ios-light-bg/75 dark:bg-ios-dark-bg/75 border-0 transition-colors px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile hamburger menu toggle */}
            <button 
              onClick={() => setIsHistorySidebarOpen(true)}
              className="flex items-center justify-center text-black dark:text-white shrink-0 lg:hidden cursor-pointer hover:opacity-80 transition-opacity"
              title="Open Companion Menu"
            >
              <Menu className="w-5 h-5 text-black dark:text-white" />
            </button>
            <span className="text-sm sm:text-base font-bold text-black dark:text-white lg:hidden">Companion</span>
          </div>
 
        {/* Gamified Core Status widgets inside bar */}
        <div className="flex items-center gap-2 sm:gap-4">
          <PWAInstallButton />

 

 
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-black bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl text-zinc-950 dark:text-zinc-50">
            <Zap className="w-4 h-4 text-zinc-950 dark:text-zinc-50 fill-zinc-950 dark:fill-zinc-50" />
            <span>LVL {progress.level} Scholar</span>
          </div>
 
          <button
            id="btn-nav-dashboard"
            onClick={() => {
              if (activeMode !== "dashboard") setActiveMode("dashboard");
              else if (guideData) setActiveMode("explore");
              else setActiveMode("upload");
            }}
            className={`p-2 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              activeMode === "dashboard"
                ? "text-zinc-950 dark:text-zinc-50 scale-105"
                : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:opacity-100"
            }`}
            title="Profile Dashboard & Pomodoro"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
        </div>
      </header>

      {/* Settings Popover */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop layer to capture outside clicks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[190] bg-black/20 dark:bg-black/40 backdrop-blur-[2px] cursor-default"
              onClick={() => setIsSettingsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 20, stiffness: 220 }}
              className={`fixed bottom-20 w-[calc(100vw-32px)] sm:w-[320px] rounded-[28px] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.16)] border z-[200] bg-[#e9eef6] dark:bg-[#1e1f22] border-zinc-200/60 dark:border-zinc-800/80 flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150 left-4 ${
                isSidebarCollapsed ? "sm:left-20" : "sm:left-[304px]"
              }`}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-base sm:text-lg text-black dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-zinc-950 dark:text-zinc-50" />
                  Settings
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-500 transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 sm:p-4 bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <div className="flex justify-between items-center gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-xs sm:text-sm text-black dark:text-white truncate">Daily Study Reminder</h4>
                      <p className="text-[10px] sm:text-xs text-ios-secondary-text mt-0.5 whitespace-normal leading-tight">Push notification to maintain streaks</p>
                    </div>
                    <button
                      onClick={toggleReminder}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isReminderEnabled ? 'bg-black dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black transition-transform ${isReminderEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  {isReminderEnabled && (
                    <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-800 mt-3">
                      <label className="text-[10px] sm:text-xs font-medium text-black dark:text-white mb-3 block">Reminder Time</label>
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => updateReminderTime(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:[color-scheme:dark]"
                      />
                    </div>
                  )}
                </div>

                {/* Profile Picture setting block */}
                {progress.photoURL && (
                  <div className="p-3.5 sm:p-4 bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs sm:text-sm text-black dark:text-white truncate">Profile Avatar</h4>
                        <p className="text-[10px] sm:text-xs text-ios-secondary-text mt-0.5 whitespace-normal leading-tight font-normal">Custom picture is active</p>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.removeItem("ai_study_companion_photo_url");
                          setProgress(prev => ({ ...prev, photoURL: "" }));
                          window.dispatchEvent(
                            new CustomEvent("update-profile-photo", {
                              detail: { photoURL: "" }
                            })
                          );
                        }}
                        className="flex items-center gap-1.5 p-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-transparent transition-all cursor-pointer shadow-sm text-xs font-bold"
                        title="Reset avatar to default letter initials"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Appearance / Theme setting block */}
                <div className="p-3.5 sm:p-4 bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-xs sm:text-sm text-black dark:text-white truncate">Appearance</h4>
                      <p className="text-[10px] sm:text-xs text-ios-secondary-text mt-0.5 whitespace-normal leading-tight font-normal">Switch color theme</p>
                    </div>
                    <button
                      onClick={handleToggleTheme}
                      className="flex items-center gap-1.5 p-2 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors shadow-sm cursor-pointer"
                      title="Toggle Theme"
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="w-3.5 h-3.5 text-zinc-650" />
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Dark</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-semibold text-zinc-200">Light</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
 
      {/* Main viewport Container */}
      <main className="w-full mx-auto px-3 sm:px-6 py-6 sm:py-8">
        
        {/* If background loading processing guide outlines */}
        {isGeneratingGuide && (
          isQuotaQueue ? (
            <div className="max-w-md mx-auto text-center py-20 bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-md">
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
            </div>
            ) : (
            <GuideLoadingScreen onCancel={() => {
              setIsGeneratingGuide(false);
              setIsQuotaQueue(false);
              setGenerationError("Document processing canceled by user.");
            }} />
          )
        )}

        {!isGeneratingGuide && (
          <div className="space-y-6">
            
            {/* Display error message if guide generation failed */}
            {generationError && (
              <div className="max-w-xl mx-auto p-4.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-start gap-3 text-zinc-900 dark:text-zinc-100">
                <XCircle className="w-5 h-5 shrink-0 text-zinc-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Notice</h4>
                  <p className="text-xxs text-zinc-600 dark:text-zinc-400 mt-1 leading-normal">
                    {generationError}
                  </p>
                  <button
                    id="btn-dismiss-error"
                    onClick={() => setGenerationError(null)}
                    className="mt-3 px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Dismiss and try again
                  </button>
                </div>
              </div>
            )}

            {/* Hub view when guide is ready and mode hasn't been set yet */}
            {guideData && activeMode === "explore" && (
              <div id="mode-selection-hub" className="max-w-3xl mx-auto text-center py-6">
                <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 font-bold rounded-full text-xxs uppercase tracking-wider">
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
                    className="bg-ios-light-secondary dark:bg-ios-dark-secondary border-2 border-zinc-200/80 dark:border-zinc-800 hover:border-black dark:hover:border-white p-6 rounded-3xl cursor-pointer hover:-translate-y-1 active:scale-98 transition-all flex flex-col justify-between group shadow-sm text-left"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="text-base font-extrabold text-black dark:text-white group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                        Structured Study Guide
                      </h4>
                      <p className="text-xs text-ios-secondary-text leading-relaxed mt-2">
                        Review the synthesized executive summary, structured section headers, core concepts, and dictionary word glossaries.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-extrabold group-hover:text-black dark:group-hover:text-white transition-colors">
                      <span>Explore materials</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-500 dark:text-zinc-300" />
                    </div>
                  </div>

                  {/* Option 2: Adaptive Quiz */}
                  <div
                    id="hub-btn-assessment"
                    onClick={() => setActiveMode("assessment")}
                    className="bg-ios-light-secondary dark:bg-ios-dark-secondary border-2 border-zinc-200/80 dark:border-zinc-800 hover:border-black dark:hover:border-white p-6 rounded-3xl cursor-pointer hover:-translate-y-1 active:scale-98 transition-all flex flex-col justify-between group shadow-sm text-left"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                        <Target className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="text-base font-extrabold text-black dark:text-white group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                        Adaptive Assessments
                      </h4>
                      <p className="text-xs text-ios-secondary-text leading-relaxed mt-2">
                        Challenge your brain using progressive difficulty modes. Track scores with adaptive unlocks and level up!
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-extrabold group-hover:text-black dark:group-hover:text-white transition-colors">
                      <span>Begin Quizzes</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-500 dark:text-zinc-300" />
                    </div>
                  </div>

                  {/* Option 3: Flashcards */}
                  <div
                    id="hub-btn-flashcards"
                    onClick={() => setActiveMode("flashcards")}
                    className="bg-ios-light-secondary dark:bg-ios-dark-secondary border-2 border-zinc-200/80 dark:border-zinc-800 hover:border-black dark:hover:border-white p-6 rounded-3xl cursor-pointer hover:-translate-y-1 active:scale-98 transition-all flex flex-col justify-between group shadow-sm text-left"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                        <Shuffle className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="text-base font-extrabold text-black dark:text-white group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                        Interactive Flashcards
                      </h4>
                      <p className="text-xs text-ios-secondary-text leading-relaxed mt-2">
                        Spin flippable memory modules containing key vocabulary words. Test direct recall with visual mastery feedback.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-extrabold group-hover:text-black dark:group-hover:text-white transition-colors">
                      <span>Review cards</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-500 dark:text-zinc-300" />
                    </div>
                  </div>

                </div>

                <div className="mt-12 text-center">
                  <button
                    id="btn-upload-alternate-document"
                    onClick={handleResetDocument}
                    className="px-6 py-2.5 text-xs font-bold text-white dark:text-black bg-black dark:bg-white hover:opacity-90 shadow-md rounded-xl transition-all border border-black dark:border-white"
                  >
                    Upload Another Document
                  </button>
                </div>
              </div>
            )}

            {/* Render Views depending on state modes */}
            {activeMode === "upload" && (
              <UploadView onFileLoaded={handleFileParsed} isLoading={isGeneratingGuide} user={user} />
            )}

            {activeMode === "guide" && guideData && (
              <div className="space-y-4">
                <GuideView guide={guideData} fileName={fileName} />
                <div className="mt-12 text-center pb-8">
                  <button
                    id="btn-back-to-explore-guide"
                    onClick={() => setActiveMode("explore")}
                    className="px-6 py-2.5 text-xs font-bold text-white dark:text-black bg-black dark:bg-white hover:opacity-90 shadow-md rounded-xl transition-all border border-black dark:border-white"
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
                    className="px-6 py-2.5 text-xs font-bold text-white dark:text-black bg-black dark:bg-white hover:opacity-90 shadow-md rounded-xl transition-all border border-black dark:border-white"
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
                    className="px-6 py-2.5 text-xs font-bold text-white dark:text-black bg-black dark:bg-white hover:opacity-90 shadow-md rounded-xl transition-all border border-black dark:border-white"
                  >
                    ← Back to Subject Workspace Hub
                  </button>
                </div>
              </div>
            )}

            {activeMode === "dashboard" && (
              <div className="space-y-4">
                <Dashboard
                  user={user}
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
                  onUpdateProgress={syncProgress}
                />
                {guideData && (
                  <div className="mt-12 text-center pb-8">
                    <button
                      id="btn-back-to-explore-dashboard"
                      onClick={() => setActiveMode("explore")}
                      className="px-6 py-2.5 text-xs font-bold text-white dark:text-black bg-black dark:bg-white hover:opacity-90 shadow-md rounded-xl transition-all border border-black dark:border-white"
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
      <footer className="mt-20 border-t lg:border-t-0 border-zinc-200/60 dark:border-zinc-900 pb-10 pt-6 text-center text-zinc-400 text-xxs font-medium tracking-normal container mx-auto">
        <p>© 2026 AI Study Companion. Developed by Mark Welly Pardillo.</p>
      </footer>

      {/* Floating iPhone-style Dynamic Island Notification & Companion System */}
      <DynamicIsland
        sidebarCollapsed={isSidebarCollapsed}
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
    </div>
  );
}
