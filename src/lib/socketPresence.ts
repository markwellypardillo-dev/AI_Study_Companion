import { getCustomUser } from './customAuth';
import { io, Socket } from "socket.io-client";
import { auth } from "./firebase";

export interface CompanionStudent {
  id: string;
  name: string;
  subject: string;
  mode: string;
  isOnline?: boolean;
  streak: number;
  level: number;
  minutesStudied?: number;
  avatarChar: string;
  socketId?: string;
  lastSeen?: number;
  photoURL?: string;
  deviceId?: string;
}

export const getActiveStudyMetadata = () => {
  let activeSubject = "Preparing to study...";
  
  // Use actual active filename from App.tsx
  const activeFile = localStorage.getItem("ai_study_companion_active_file");
  if (activeFile && activeFile.trim() !== "") {
    activeSubject = activeFile;
  } else {
    const rawProgress = localStorage.getItem("ai_study_companion_progress");
    if (rawProgress) {
      try {
        const parsed = JSON.parse(rawProgress);
        if (parsed.quizHistory && parsed.quizHistory.length > 0 && parsed.quizHistory[parsed.quizHistory.length - 1].fileName) {
          activeSubject = parsed.quizHistory[parsed.quizHistory.length - 1].fileName;
        }
      } catch (err) {}
    }
  }

  let activeMode = "Taking a Break ☕";
  const isTimerRunning = localStorage.getItem("ai_study_companion_timer_running") === "true";
  const timerMode = localStorage.getItem("ai_study_companion_timer_mode");
  const activeTab = localStorage.getItem("ai_study_companion_active_tab");
  
  if (isTimerRunning) {
    activeMode = timerMode === "focus" ? "Deep Focus Session 🎧" : "Taking a short rest ☕";
  } else {
    // Determine mode based on the actual tab
    if (activeTab === "quiz") {
      activeMode = "Taking an Assessment 📝";
    } else if (activeTab === "guide") {
      activeMode = "Reviewing Study Guide 📖";
    } else if (activeTab === "dashboard") {
      activeMode = "In Dashboard 📊";
    } else if (activeTab === "upload") {
      activeMode = "Preparing to study 📚";
    } else {
      if (activeSubject !== "Preparing to study...") {
          activeMode = "Reviewing material 📖";
      }
    }
  }

  const musicPlaying = localStorage.getItem("ai_study_companion_music_playing") === "true";
  if (musicPlaying) {
    const trackName = localStorage.getItem("ai_study_companion_track_name") || "Music";
    activeMode = `${activeMode} • Listening to ${trackName} 🎵`;
  }

  return { subject: activeSubject, mode: activeMode };
};

export const getProgressInfo = () => {
  const raw = localStorage.getItem("ai_study_companion_progress");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return { level: parsed.level || 1, streak: parsed.dailyStreak || 0 };
    } catch (err) {}
  }
  return { level: 1, streak: 0 };
};

export const getPhotoURL = () => {
  const cached = localStorage.getItem("ai_study_companion_photo_url");
  if (cached) return cached;
  
  const raw = localStorage.getItem("ai_study_companion_progress");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed.photoURL || "";
    } catch (err) {}
  }
  return "";
};

export const getDeviceId = () => {
  let cached = localStorage.getItem("ai_study_companion_device_id");
  if (!cached) {
    cached = "dev_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("ai_study_companion_device_id", cached);
  }
  return cached;
};

export const getClientUid = () => {
  const currentUser = auth.currentUser || getCustomUser();
  if (currentUser) {
    return currentUser.uid;
  }
  let cached = localStorage.getItem("ai_study_companion_client_uid");
  if (!cached) {
    cached = "u_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("ai_study_companion_client_uid", cached);
  }
  return cached;
};

export const getUserIdentity = (user?: any) => {
  let cached = localStorage.getItem("ai_study_companion_user_identity");
  let isManual = localStorage.getItem("ai_study_companion_identity_is_manual") === "true";
  
  if (user && !isManual) {
    const derivedName = user.username || user.displayName || user.email?.split('@')[0];
    if (derivedName) {
      localStorage.setItem("ai_study_companion_user_identity", derivedName);
      return derivedName;
    }
  }

  if (cached) return cached;
  
  const generated = `Scholar_student${Math.floor(Math.random() * 900) + 100}`;
  localStorage.setItem("ai_study_companion_user_identity", generated);
  return generated;
};

let globalSocket: Socket | null = null;
let listeners: Array<(companions: CompanionStudent[], count: number, connected: boolean) => void> = [];
let heartbeatInterval: any = null;
let currentCompanions: CompanionStudent[] = [];
let currentIsConnected = false;

export const initGlobalPresence = (user?: any) => {
  if (globalSocket) {
      if (globalSocket.connected) {
          // Force an immediate update with current stats if called again
          const clientUid = getClientUid();
          const userIdentity = getUserIdentity(user);
          const metadata = getActiveStudyMetadata();
          const info = getProgressInfo();
          
          globalSocket.emit("update-presence", {
            id: clientUid,
            name: userIdentity,
            subject: metadata.subject,
            mode: metadata.mode,
            streak: info.streak,
            level: info.level,
            avatarChar: userIdentity.charAt(userIdentity.indexOf("_") + 1) || userIdentity.charAt(0) || "S",
            photoURL: getPhotoURL(),
            deviceId: getDeviceId()
          });
      }
      return globalSocket;
  }

  globalSocket = io();

  const handleUpdate = () => {
    listeners.forEach(l => l(currentCompanions, currentCompanions.length + 1, currentIsConnected));
  };

  globalSocket.on("connect", () => {
    currentIsConnected = true;
    handleUpdate();

    const clientUid = getClientUid();
    const userIdentity = getUserIdentity(user);
    const metadata = getActiveStudyMetadata();
    const info = getProgressInfo();
    
    globalSocket?.emit("join-lounge", {
      id: clientUid,
      name: userIdentity,
      subject: metadata.subject,
      mode: metadata.mode,
      streak: info.streak,
      level: info.level,
      avatarChar: userIdentity.charAt(userIdentity.indexOf("_") + 1) || userIdentity.charAt(0) || "S",
      photoURL: getPhotoURL(),
      deviceId: getDeviceId()
    });
  });

  globalSocket.on("lounge-update", (allActivePresence: CompanionStudent[]) => {
    const clientUid = getClientUid();
    const deviceId = getDeviceId();
    currentCompanions = allActivePresence.filter(p => p.id !== clientUid && p.deviceId !== deviceId);
    handleUpdate();
  });

  globalSocket.on("direct-message", (msg: any) => {
    sessionMessageHistory.push(msg);
    messageListeners.forEach(l => l(msg));
  });

  globalSocket.on("user-typing", (data: any) => {
    typingListeners.forEach(l => l(data));
  });

  globalSocket.on("global-announcement", (data: any) => {
    announcementListeners.forEach(l => l(data));
  });

  globalSocket.on("kicked", (data: any) => {
    alert(data.reason || "You were kicked.");
    window.location.reload();
  });

  globalSocket.on("admin-warning", (data: any) => {
    alert(`⚠️ SYSTEM WARNING:\n\n${data.message}`);
  });

  globalSocket.on("disconnect", () => {
    currentIsConnected = false;
    currentCompanions = [];
    handleUpdate();
  });

  heartbeatInterval = setInterval(() => {
    if (!globalSocket?.connected) return;
    const clientUid = getClientUid();
    const userIdentity = getUserIdentity(user);
    const metadata = getActiveStudyMetadata();
    const info = getProgressInfo();
    
    globalSocket.emit("update-presence", {
      id: clientUid,
      name: userIdentity,
      subject: metadata.subject,
      mode: metadata.mode,
      streak: info.streak,
      level: info.level,
      avatarChar: userIdentity.charAt(userIdentity.indexOf("_") + 1) || userIdentity.charAt(0) || "S",
      photoURL: getPhotoURL(),
      deviceId: getDeviceId()
    });
  }, 10000);

  return globalSocket;
};

export const subscribeToPresence = (listener: (companions: CompanionStudent[], count: number, connected: boolean) => void) => {
  listeners.push(listener);
  // Initial call
  listener(currentCompanions, currentCompanions.length + 1, currentIsConnected);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const forceUpdatePresence = (user?: any) => {
    if (globalSocket && globalSocket.connected) {
        const clientUid = getClientUid();
        const userIdentity = getUserIdentity(user);
        const metadata = getActiveStudyMetadata();
        const info = getProgressInfo();
        
        globalSocket.emit("update-presence", {
          id: clientUid,
          name: userIdentity,
          subject: metadata.subject,
          mode: metadata.mode,
          streak: info.streak,
          level: info.level,
          avatarChar: userIdentity.charAt(userIdentity.indexOf("_") + 1) || userIdentity.charAt(0) || "S",
          photoURL: getPhotoURL(),
          deviceId: getDeviceId()
        });
    }
};

export const renameUserIdentity = (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed) {
      localStorage.setItem("ai_study_companion_user_identity", trimmed);
      localStorage.setItem("ai_study_companion_identity_is_manual", "true");
      forceUpdatePresence();
    }
};

export const rerollIdentity = () => {
    const num = Math.floor(Math.random() * 90) + 10;
    const newIdentity = `Scholar_student${num}`;
    localStorage.setItem("ai_study_companion_user_identity", newIdentity);
    localStorage.setItem("ai_study_companion_identity_is_manual", "true");
    forceUpdatePresence();
    return newIdentity;
};

export interface DirectMessage {
  id: string;
  fromId: string;
  toId?: string;
  fromName: string;
  message: string;
  timestamp: number;
}

export const sessionMessageHistory: DirectMessage[] = [];
let messageListeners: Array<(msg: DirectMessage) => void> = [];
let typingListeners: Array<(data: { fromId: string, isTyping: boolean }) => void> = [];
let announcementListeners: Array<(data: { id: string, message: string, fromName: string, timestamp: number }) => void> = [];

export const subscribeToAnnouncements = (listener: (data: { id: string, message: string, fromName: string, timestamp: number }) => void) => {
  announcementListeners.push(listener);
  return () => {
    announcementListeners = announcementListeners.filter(l => l !== listener);
  };
};

export const sendGlobalAnnouncement = (message: string, fromName?: string) => {
  if (globalSocket && globalSocket.connected) {
    globalSocket.emit("send-global-announcement", { message, fromName: fromName || "System Admin" });
  }
};

export const kickUserFromLounge = (targetId: string) => {
  if (globalSocket && globalSocket.connected) {
    globalSocket.emit("kick-user", { targetId });
  }
};

export const sendAdminWarning = (targetId: string, message: string) => {
  if (globalSocket && globalSocket.connected) {
    globalSocket.emit("send-admin-warning", { targetId, message });
  }
};

export const subscribeToMessages = (listener: (msg: DirectMessage) => void) => {
  messageListeners.push(listener);
  return () => {
    messageListeners = messageListeners.filter(l => l !== listener);
  };
};

export const subscribeToTyping = (listener: (data: { fromId: string, isTyping: boolean }) => void) => {
  typingListeners.push(listener);
  return () => {
    typingListeners = typingListeners.filter(l => l !== listener);
  };
};

export const sendDirectMessage = (toId: string, message: string, existingTimestamp?: number, existingId?: string) => {
  if (globalSocket && globalSocket.connected) {
    const clientUid = getClientUid();
    const userIdentity = getUserIdentity();
    const msgObj = {
      id: existingId || Math.random().toString(36).substring(2, 9),
      toId,
      fromId: clientUid,
      fromName: userIdentity,
      message,
      timestamp: existingTimestamp || Date.now()
    };
    sessionMessageHistory.push(msgObj as DirectMessage);
    globalSocket.emit("send-direct-message", {
      toId,
      fromId: clientUid,
      fromName: userIdentity,
      message,
      timestamp: msgObj.timestamp,
      id: msgObj.id
    });
  }
};

export const sendTypingStatus = (toId: string, isTyping: boolean) => {
  if (globalSocket && globalSocket.connected) {
    globalSocket.emit("user-typing", {
      toId,
      fromId: getClientUid(),
      isTyping
    });
  }
};

