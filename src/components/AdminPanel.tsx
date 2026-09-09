import React, { useState, useEffect } from "react";
import { UserProgress } from "../types";
import { Settings, Save, ChevronDown, ChevronUp, AlertOctagon, Unlock, Trash2, Megaphone, Users, Activity, UserX, Lock, ShieldAlert, Eye, MessageSquareWarning } from "lucide-react";
import { forceUpdatePresence, subscribeToPresence, CompanionStudent, sendGlobalAnnouncement, kickUserFromLounge, sendAdminWarning } from "../lib/socketPresence";
import { getGlobalAnalytics, subscribeToGlobalActivities, setMaintenanceMode, fetchAllPublicGuidesForModeration, deleteUserGuide, subscribeToMaintenanceMode, banUser, getBannedUsers, unbanUser, updateUserProgressRemote } from "../lib/db";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AdminPanelProps {
  progress: UserProgress;
  onUpdateProgress: (updates: Partial<UserProgress>) => void;
  user?: any;
}

export default function AdminPanel({ progress, onUpdateProgress, user }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [level, setLevel] = useState(progress.level.toString());
  const [streak, setStreak] = useState(progress.dailyStreak.toString());
  const [xp, setXp] = useState(progress.xp.toString());
  const [focusSeconds, setFocusSeconds] = useState(progress.totalFocusSeconds.toString());
  const [studiesCount, setStudiesCount] = useState((progress.completedStudiesCount || 0).toString());
  const [activeTab, setActiveTab] = useState<"progress" | "users" | "broadcast" | "analytics" | "activity" | "moderation">("progress");
  
  // Real-time states
  const [activeUsers, setActiveUsers] = useState<CompanionStudent[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [activeCount, setActiveCount] = useState(1);
  const [globalStats, setGlobalStats] = useState({ totalUsers: 0, totalDocuments: 0, registeredUsersList: [] as any[], totalGuests: 0, guestsList: [] as any[] });
  const [globalActivities, setGlobalActivities] = useState<any[]>([]);
  
  // Moderation state
  const [moderationGuides, setModerationGuides] = useState<any[]>([]);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [bannedUsersList, setBannedUsersList] = useState<string[]>([]);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ level: 1, xp: 0, streak: 0 });

  useEffect(() => {
    const unsub = subscribeToMaintenanceMode(setIsMaintenance);
    getBannedUsers().then(setBannedUsersList);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubPresence = subscribeToPresence((companions, count) => {
      setActiveUsers(companions);
      setActiveCount(count);
    });
    return () => unsubPresence();
  }, []);

  useEffect(() => {
    setLevel(progress.level.toString());
    setStreak(progress.dailyStreak.toString());
    setXp(progress.xp.toString());
    setFocusSeconds(progress.totalFocusSeconds.toString());
    setStudiesCount((progress.completedStudiesCount || 0).toString());
  }, [progress]);

  useEffect(() => {
    if (activeTab === "analytics") {
      getGlobalAnalytics().then(stats => setGlobalStats(stats));
    }
    if (activeTab === "moderation") {
      fetchAllPublicGuidesForModeration().then(setModerationGuides);
    }
    if (activeTab === "activity" || activeTab === "analytics") {
      const unsubActivities = subscribeToGlobalActivities((acts) => {
        setGlobalActivities(acts);
      }, 50);
      return () => unsubActivities();
    }
  }, [activeTab]);

  const handleSave = () => {
    const newLevel = parseInt(level) || 1;
    let calculatedXpNeeded = 500;
    for (let i = 1; i < newLevel; i++) {
      calculatedXpNeeded = Math.round(calculatedXpNeeded * 1.15);
    }
    
    onUpdateProgress({
      level: newLevel,
      dailyStreak: parseInt(streak) || 0,
      xp: parseInt(xp) || 0,
      xpToNextLevel: calculatedXpNeeded,
      totalFocusSeconds: parseInt(focusSeconds) || 0,
      completedStudiesCount: parseInt(studiesCount) || 0,
    });
    setTimeout(() => {
      forceUpdatePresence(user);
    }, 100);
    alert("Admin updates saved successfully!");
  };
  
  const handleUnlockAll = () => {
    if (window.confirm("Unlock all achievements?")) {
      const allAchievementIds = [
        "first_upload", "level_2", "level_5", "first_quiz", "perfect_quiz",
        "vocab_5", "vocab_15", "streak_3", "focus_1", "focus_4"
      ];
      onUpdateProgress({ unlockedAchievements: allAchievementIds });
      alert("All achievements unlocked!");
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all quiz history and heatmap data?")) {
      onUpdateProgress({ quizHistory: [] });
      localStorage.removeItem("ai_study_companion_simulated_dates");
      localStorage.removeItem("ai_study_companion_completed_focus_dates");
      alert("Study history cleared!");
      window.location.reload(); // Reload to refresh heatmap state
    }
  };
  
  const handleReset = () => {
    if (window.confirm("Are you sure you want to completely reset this user's progress to level 1?")) {
      onUpdateProgress({
        level: 1,
        dailyStreak: 0,
        xp: 0,
        xpToNextLevel: 500,
        totalFocusSeconds: 0,
        completedStudiesCount: 0,
        masteredTermsCount: 0,
        quizHistory: [],
        unlockedAchievements: ["first_upload", "focus_1"]
      });
      setLevel("1");
      setStreak("0");
      setXp("0");
      setFocusSeconds("0");
      setStudiesCount("0");
      setTimeout(() => {
        forceUpdatePresence(user);
      }, 100);
      alert("Progress reset to zero.");
    }
  }

  const handleBroadcast = () => {
    if (announcementMsg.trim()) {
      sendGlobalAnnouncement(announcementMsg, "System Admin");
      setAnnouncementMsg("");
      alert("Announcement broadcasted successfully!");
    }
  };

  const handleKickUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to kick ${userName}?`)) {
      kickUserFromLounge(userId);
    }
  };

  const handleBanUser = async (userId: string, userName: string) => {
    if (window.confirm(`Permanently ban ${userName}? They will no longer be able to log in.`)) {
      await banUser(userId);
      setBannedUsersList(prev => [...prev, userId]);
      kickUserFromLounge(userId);
    }
  };

  return (
    <div className="mb-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-3xl relative overflow-hidden transition-all duration-300 shadow-sm">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Settings className="w-32 h-32 text-black dark:text-white" />
      </div>
      <div className="relative z-10">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-full flex items-center justify-between p-6 cursor-pointer outline-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <h2 className="text-xl font-black text-black dark:text-white flex items-center gap-2 m-0">
            <Settings className="w-5 h-5 text-indigo-500" /> System Admin Control
          </h2>
          <div className="text-black dark:text-white p-2 bg-black/5 dark:bg-white/5 rounded-full">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>
        
        {isOpen && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-850 pb-2">
              <button
                onClick={() => setActiveTab("progress")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                  activeTab === "progress" 
                    ? "bg-black text-white dark:bg-white dark:text-black" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                Local Progress
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                  activeTab === "users" 
                    ? "bg-black text-white dark:bg-white dark:text-black" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                Live Users ({activeCount - 1})
              </button>
              <button
                onClick={() => setActiveTab("broadcast")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                  activeTab === "broadcast" 
                    ? "bg-black text-white dark:bg-white dark:text-black" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                Global Broadcast
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                  activeTab === "analytics" 
                    ? "bg-black text-white dark:bg-white dark:text-black" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                App Analytics
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                  activeTab === "activity" 
                    ? "bg-black text-white dark:bg-white dark:text-black" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                Admin Activity Log
              </button>
              <button
                onClick={() => setActiveTab("moderation")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "moderation" 
                    ? "bg-black text-white dark:bg-white dark:text-black" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                Content Moderation
              </button>
            </div>

            {activeTab === "progress" && (
              <div className="animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Override Level
                    </label>
                    <input
                      type="number"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Override Streak (Days)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={streak}
                      onChange={(e) => setStreak(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Override XP
                    </label>
                    <input
                      type="number"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={xp}
                      onChange={(e) => setXp(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Focus Time (Seconds)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={focusSeconds}
                      onChange={(e) => setFocusSeconds(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Completed Studies Count
                    </label>
                    <input
                      type="number"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={studiesCount}
                      onChange={(e) => setStudiesCount(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-850">
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <button
                      onClick={handleUnlockAll}
                      className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Unlock className="w-4 h-4" /> Unlock All Achievements
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Clear All History
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <button
                      onClick={handleReset}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                    >
                      <AlertOctagon className="w-4 h-4" /> Hard Reset Progress
                    </button>
                    <button
                      onClick={handleSave}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                      <Save className="w-4 h-4" /> Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="animate-in fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Connected Lounge Scholars
                  </h3>
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">
                    Total: {activeCount - 1} Online
                  </span>
                </div>
                
                {activeUsers.length === 0 ? (
                  <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/50">
                    <p className="text-sm text-zinc-500 font-medium">No other users currently connected.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                    {activeUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                            {u.avatarChar}
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-tight">{u.name}</p>
                            <p className="text-xs text-zinc-500 truncate max-w-[200px]">{u.mode}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const msg = window.prompt(`Enter direct warning message for ${u.name}:`);
                              if (msg) sendAdminWarning(u.id, msg);
                            }}
                            className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors group"
                            title="Warn User"
                          >
                            <MessageSquareWarning className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleKickUser(u.id, u.name)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                            title="Kick User"
                          >
                            <UserX className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleBanUser(u.id, u.name)}
                            className="p-2 text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors group"
                            title="Permanently Ban"
                          >
                            <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "broadcast" && (
              <div className="animate-in fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold">Global System Announcement</h3>
                </div>
                <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                    Broadcast a real-time message to all active users currently in the application. This will trigger a notification overlay on their screens.
                  </p>
                  <textarea
                    className="w-full h-24 bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none mb-3"
                    placeholder="Enter broadcast message (e.g., 'Server maintenance in 5 minutes')..."
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleBroadcast}
                      disabled={!announcementMsg.trim()}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                      <Megaphone className="w-4 h-4" /> Send Broadcast
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="animate-in fade-in">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold">Global Application Analytics</h3>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(isMaintenance ? "Disable Maintenance Mode and allow users back in?" : "Enable Maintenance Mode? All active users (except admins) will be locked out immediately.")) {
                        setMaintenanceMode(!isMaintenance);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isMaintenance 
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50" 
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {isMaintenance ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {isMaintenance ? "Maintenance Active" : "Maintenance Mode"}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Live Online</p>
                    <p className="text-2xl font-black text-emerald-500">{activeCount}</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Avg. Level</p>
                    <p className="text-2xl font-black">{
                      activeUsers.length > 0 
                        ? Math.round(activeUsers.reduce((sum, u) => sum + u.level, 0) / activeUsers.length) 
                        : progress.level
                    }</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Focusing</p>
                    <p className="text-2xl font-black">{
                      activeUsers.filter(u => u.mode.includes("Focus")).length
                    }</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Testing</p>
                    <p className="text-2xl font-black">{
                      activeUsers.filter(u => u.mode.includes("Assessment")).length
                    }</p>
                  </div>
                </div>
                
                <div className="mt-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-wider">7-Day Engagement & Generation Trends</p>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'Mon', DAU: 12, AI: 4 },
                        { name: 'Tue', DAU: 19, AI: 7 },
                        { name: 'Wed', DAU: 15, AI: 5 },
                        { name: 'Thu', DAU: 22, AI: 12 },
                        { name: 'Fri', DAU: 28, AI: 18 },
                        { name: 'Sat', DAU: 35, AI: 25 },
                        { name: 'Sun', DAU: Math.max(40, globalActivities.length), AI: Math.max(30, globalStats.totalDocuments) }
                      ]}>
                        <defs>
                          <linearGradient id="colorDAU" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="DAU" stroke="#10b981" fillOpacity={1} fill="url(#colorDAU)" />
                        <Area type="monotone" dataKey="AI" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAI)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Lifetime Platform Stats (Database)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Registered Users</p>
                      <p className="text-xl font-black text-indigo-500 mb-2">{globalStats.totalUsers}</p>
                      <div className="max-h-24 overflow-y-auto pr-1 no-scrollbar space-y-1">
                        {globalStats.registeredUsersList?.map((u, i) => (
                          <div key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded truncate">
                            {u.email || u.uid || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Guests</p>
                      <p className="text-xl font-black text-emerald-500 mb-2">{globalStats.totalGuests}</p>
                      <div className="max-h-24 overflow-y-auto pr-1 no-scrollbar space-y-1">
                        {globalStats.guestsList?.map((g, i) => (
                          <div key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded truncate">
                            {g.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Total AI Study Guides</p>
                        <p className="text-xl font-black text-amber-500">{globalStats.totalDocuments}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Estimated AI API Calls</p>
                        <p className="text-xl font-black text-purple-500">{globalStats.totalDocuments * 2}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Top Students (Leaderboard)</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                    {globalStats.registeredUsersList?.slice().sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10).map((u, i) => (
                      <div key={i} className="flex flex-col gap-2 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-black w-6 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-700' : 'text-zinc-500'}`}>#{i + 1}</span>
                            <div>
                              <p className="text-sm font-bold flex items-center gap-2">
                                {u.email?.split('@')[0] || "Scholar"}
                                {bannedUsersList.includes(u.uid) && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded-sm">BANNED</span>}
                              </p>
                              <p className="text-[10px] text-zinc-500">Level {u.level || 1} • {u.xp || 0} XP</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs font-bold text-indigo-500">{u.dailyStreak || 0} Day Streak</p>
                            </div>
                            <button
                              onClick={() => {
                                if (editingUserId === u.uid) {
                                  setEditingUserId(null);
                                } else {
                                  setEditingUserId(u.uid);
                                  setEditForm({ level: u.level || 1, xp: u.xp || 0, streak: u.dailyStreak || 0 });
                                }
                              }}
                              className="text-[10px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2 py-1 rounded"
                            >
                              Edit
                            </button>
                            {bannedUsersList.includes(u.uid) ? (
                              <button
                                onClick={async () => {
                                  await unbanUser(u.uid);
                                  setBannedUsersList(prev => prev.filter(id => id !== u.uid));
                                }}
                                className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 px-2 py-1 rounded hover:bg-emerald-200"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(u.uid, u.email || 'User')}
                                className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 px-2 py-1 rounded hover:bg-red-200"
                              >
                                Ban
                              </button>
                            )}
                          </div>
                        </div>
                        {editingUserId === u.uid && (
                          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                            <label className="text-[10px] text-zinc-500">Level</label>
                            <input 
                              type="number" 
                              value={editForm.level} 
                              onChange={e => setEditForm({ ...editForm, level: parseInt(e.target.value) || 1 })} 
                              className="w-12 text-xs bg-zinc-100 dark:bg-zinc-800 rounded px-1 py-0.5" 
                            />
                            <label className="text-[10px] text-zinc-500 ml-2">XP</label>
                            <input 
                              type="number" 
                              value={editForm.xp} 
                              onChange={e => setEditForm({ ...editForm, xp: parseInt(e.target.value) || 0 })} 
                              className="w-16 text-xs bg-zinc-100 dark:bg-zinc-800 rounded px-1 py-0.5" 
                            />
                            <label className="text-[10px] text-zinc-500 ml-2">Streak</label>
                            <input 
                              type="number" 
                              value={editForm.streak} 
                              onChange={e => setEditForm({ ...editForm, streak: parseInt(e.target.value) || 0 })} 
                              className="w-12 text-xs bg-zinc-100 dark:bg-zinc-800 rounded px-1 py-0.5" 
                            />
                            <button
                              onClick={async () => {
                                await updateUserProgressRemote(u.uid, {
                                  level: editForm.level,
                                  xp: editForm.xp,
                                  dailyStreak: editForm.streak
                                });
                                // update local list to reflect immediately
                                setGlobalStats(prev => ({
                                  ...prev,
                                  registeredUsersList: prev.registeredUsersList.map(user => 
                                    user.uid === u.uid ? { ...user, level: editForm.level, xp: editForm.xp, dailyStreak: editForm.streak } : user
                                  )
                                }));
                                setEditingUserId(null);
                              }}
                              className="ml-auto text-[10px] bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {globalStats.registeredUsersList?.length === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-4">No user data available.</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Currently Studied Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {activeUsers.map(u => u.subject).filter((v, i, a) => a.indexOf(v) === i && !v.includes("Preparing")).map((subject, idx) => (
                      <span key={idx} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-xs font-bold rounded-full">
                        {subject}
                      </span>
                    ))}
                    {activeUsers.filter(u => !u.subject.includes("Preparing")).length === 0 && (
                      <p className="text-xs text-zinc-400">No active topics being studied right now.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {activeTab === "activity" && (
              <div className="animate-in fade-in">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold">Admin Activity Log</h3>
                  </div>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ stats: globalStats, activities: globalActivities }, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", "admin_system_export.json");
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Export System Data (JSON)
                  </button>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Live System Events ({globalActivities.length})</p>
                    <div className="flex gap-2">
                      <select 
                        id="activityFilter"
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                        onChange={(e) => {
                          const val = e.target.value;
                          const container = document.getElementById('activity-list-container');
                          if (container) {
                            Array.from(container.children).forEach((child: any) => {
                              if (val === 'all') {
                                child.style.display = 'flex';
                              } else {
                                child.style.display = child.dataset.action === val || (val === 'auth' && (child.dataset.action === 'login' || child.dataset.action === 'guest_login')) ? 'flex' : 'none';
                              }
                            });
                          }
                        }}
                      >
                        <option value="all">All Events</option>
                        <option value="auth">Authentications</option>
                        <option value="generate_guide">Study Guides</option>
                        <option value="quiz_submitted">Quizzes</option>
                        <option value="focus_completed">Focus Sessions</option>
                      </select>
                    </div>
                  </div>
                  <div id="activity-list-container" className="space-y-2 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                    {globalActivities.length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-4">No recent activities logged.</p>
                    ) : (
                      globalActivities.map(act => (
                        <div key={act.id} data-action={act.action} className="flex flex-col gap-1 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/50 rounded-xl">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-black dark:text-white">
                              {act.action === "generate_guide" && "📚 Generated Guide"}
                              {act.action === "quiz_submitted" && "📝 Completed Quiz"}
                              {act.action === "focus_completed" && "⏱️ Finished Focus Session"}
                              {act.action === "login" && "👋 Logged In"}
                              {act.action === "guest_login" && "🕵️ Guest Logged In"}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleString() : "Just now"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">
                            <span className="font-semibold">{act.email || act.userId}</span>
                            {act.action === "generate_guide" && ` generated a guide for "${act.metadata?.fileName}"`}
                            {act.action === "quiz_submitted" && ` scored ${act.metadata?.score}/${act.metadata?.total} on "${act.metadata?.fileName}"`}
                            {act.action === "focus_completed" && ` focused for ${act.metadata?.minutes} minutes`}
                            {act.action === "login" && ` successfully authenticated`}
                            {act.action === "guest_login" && ` entered as a guest`}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "moderation" && (
              <div className="animate-in fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-bold">Content Moderation Queue</h3>
                  </div>
                  <button 
                    onClick={() => fetchAllPublicGuidesForModeration().then(setModerationGuides)}
                    className="text-xs text-zinc-500 hover:text-black dark:hover:text-white"
                  >
                    Refresh List
                  </button>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Recently Generated User Study Guides</p>
                  
                  {moderationGuides.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-xs">No study guides found across the platform.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                      {moderationGuides.map((guide) => {
                        const contentString = JSON.stringify(guide).toLowerCase();
                        const flaggedWords = ['hack', 'cheat', 'badword', 'illegal', 'spam', 'nsfw'];
                        const isFlagged = flaggedWords.some(w => contentString.includes(w));
                        
                        return (
                        <div key={guide.id} className={`flex flex-col gap-2 p-3 bg-white dark:bg-zinc-950 border ${isFlagged ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl hover:border-purple-300 dark:hover:border-purple-800 transition-colors`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold truncate text-black dark:text-white" title={guide.fileName}>
                                {guide.fileName || "Untitled Document"}
                                {isFlagged && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1 rounded-sm uppercase">Flagged</span>}
                              </h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5 font-medium truncate">
                                Created by user: <span className="text-zinc-700 dark:text-zinc-300">{guide.userId}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => {
                                  // Open guide viewer modal or new tab
                                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(guide, null, 2));
                                  const downloadAnchorNode = document.createElement('a');
                                  downloadAnchorNode.setAttribute("href", dataStr);
                                  downloadAnchorNode.setAttribute("download", `guide_${guide.id}.json`);
                                  document.body.appendChild(downloadAnchorNode);
                                  downloadAnchorNode.click();
                                  downloadAnchorNode.remove();
                                }}
                                className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                                title="Download JSON to inspect"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to completely delete "${guide.fileName}"? This action cannot be undone.`)) {
                                    await deleteUserGuide(guide.userId, guide.id);
                                    setModerationGuides(prev => prev.filter(g => g.id !== guide.id));
                                  }
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                title="Delete from platform"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Snippet of content */}
                          <div className="bg-zinc-100 dark:bg-zinc-900 rounded p-2 text-[10px] text-zinc-600 dark:text-zinc-400 max-h-16 overflow-hidden relative">
                            {guide.modules && guide.modules[0] ? (
                              <p className="line-clamp-2">{guide.modules[0].content}</p>
                            ) : (
                              <p className="italic">No content available to preview</p>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-zinc-100 dark:from-zinc-900 to-transparent"></div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
