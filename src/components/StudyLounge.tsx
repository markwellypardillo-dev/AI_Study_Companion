import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Users, Shuffle, Sparkles, User, Flame, GraduationCap, Edit2, Check, X, Wifi } from "lucide-react";
import { 
  CompanionStudent, 
  subscribeToPresence, 
  getUserIdentity, 
  renameUserIdentity, 
  rerollIdentity
} from "../lib/socketPresence";

import StudentMessenger from "./StudentMessenger";

const FIRST_NAMES = [
  "Silas", "Evelyn", "Kaelen", "Maeve", "Cyrus", "Aria", "Julian", "Clara", "Félix", "Nico", 
  "Iris", "Atlas", "Aurelia", "Orion", "Zelda", "Vesper", "Sienna", "Elias", "Gideon", "Lyra"
];

const SUBJECTS = [
  "Cellular Biology 🧬",
  "Organic Chemistry 🧪",
  "World Lit Poetry 📖",
  "Quantum Hardware ⚡",
  "Microeconomics 📈",
  "Advanced Calculus 📐",
  "Cognitive Psychology 🧠",
  "Astroparticle Physics 🪐",
  "Ancient History 📜",
  "Deep Learning Architectures 🤖"
];

export default function StudyLounge({ user }: { user?: any }) {
  const [userIdentity, setUserIdentity] = useState<string>(() => getUserIdentity(user));
  const [companions, setCompanions] = useState<CompanionStudent[]>([]);
  const [activeCount, setActiveCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeChatCompanion, setActiveChatCompanion] = useState<CompanionStudent | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    import("../lib/socketPresence").then(({ subscribeToMessages, getClientUid }) => {
      unsub = subscribeToMessages((msg) => {
        const myId = getClientUid();
        // Only trigger if it's sent to me, and I'm not actively chatting with the sender
        if (msg.fromId !== myId && (!activeChatCompanion || activeChatCompanion.id !== msg.fromId)) {
          window.dispatchEvent(
            new CustomEvent("add-notification", {
              detail: {
                title: `New message from ${msg.fromName}`,
                description: msg.message,
                type: "reminder",
                badge: "💬 Chat",
                action: "open-chat",
                actionPayload: { companionId: msg.fromId, companionName: msg.fromName }
              }
            })
          );
        }
      });
    });
    return () => {
      if (unsub) unsub();
    };
  }, [activeChatCompanion]);

  useEffect(() => {
    const unsub = subscribeToPresence((newCompanions, newCount, newIsConnected) => {
      setCompanions(newCompanions);
      setActiveCount(newCount);
      setIsConnected(newIsConnected);
    });
    return unsub;
  }, []);

  // Update local userIdentity whenever user logs in or re-syncs
  useEffect(() => {
    const currentId = getUserIdentity(user);
    if (currentId !== userIdentity) {
      setUserIdentity(currentId);
    }
  }, [user]);

  useEffect(() => {
    const handleOpenChatAction = (e: any) => {
      const { companionId, companionName } = e.detail;
      const comp = companions.find((c) => c.id === companionId);
      if (comp) {
        setActiveChatCompanion(comp);
      } else {
        setActiveChatCompanion({
          id: companionId,
          name: companionName || "Unknown",
          subject: "Unknown",
          mode: "focus",
          streak: 0,
          level: 1,
          avatarChar: (companionName || "?").charAt(0).toUpperCase(),
          isOnline: true
        });
      }
    };
    window.addEventListener("open-chat-action", handleOpenChatAction);
    return () => window.removeEventListener("open-chat-action", handleOpenChatAction);
  }, [companions]);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editInputValue, setEditInputValue] = useState<string>("");

  const startEditing = () => {
    setEditInputValue(userIdentity);
    setIsEditing(true);
  };

  const saveIdentity = () => {
    const trimmed = editInputValue.trim();
    if (trimmed) {
      setUserIdentity(trimmed);
      renameUserIdentity(trimmed);
    }
    setIsEditing(false);
  };

  const cancelEditing = () => setIsEditing(false);

  const handleRerollIdentity = () => {
    const newIdentity = rerollIdentity();
    setUserIdentity(newIdentity);
    setIsEditing(false);
  };

  return (
    <div 
      id="study-lounge-card" 
      className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border border-white/40 dark:border-white/10 rounded-3xl p-4.5 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-3.5 before:absolute before:inset-0 before:bg-gradient-to-br before:from-brand-indigo/10 before:to-transparent before:opacity-50 before:pointer-events-none"
    >
      {/* Title Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="p-0.5 px-2 bg-brand-indigo/20 backdrop-blur-md text-brand-indigo dark:text-brand-indigo-light rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 font-sans border border-brand-indigo/20">
            <Users className="w-3 h-3" /> Live Study Lounge
          </div>
          {isConnected ? (
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Connected via WebSockets" />
          ) : (
             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" title="Reconnecting..." />
          )}
        </div>
        <span className="text-[9px] font-mono text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider backdrop-blur bg-white/30 dark:bg-black/30 px-2 py-0.5 rounded-full border border-white/20 dark:border-white/10">
          {activeCount} Active
        </span>
      </div>

      <p className="text-[10px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans relative z-10 font-medium">
        Meet fellow scholars co-working and cracking materials with you in real-time.
      </p>

      {/* Your Identity Block - Glassmorphism */}
      <div className="relative z-10 p-2.5 bg-white/50 dark:bg-black/30 backdrop-blur-lg border border-white/40 dark:border-white/10 shadow-inner rounded-xl flex items-center justify-between gap-2.5 font-sans min-h-[46px]">
        {isEditing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); saveIdentity(); }}
            className="flex-1 flex items-center gap-2 min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-indigo to-violet-500 text-white flex items-center justify-center font-bold text-xxs shrink-0 shadow-lg border border-white/20">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-1">
              <input
                id="input-edit-lobby-nickname"
                type="text"
                value={editInputValue}
                onChange={(e) => setEditInputValue(e.target.value)}
                maxLength={22}
                className="flex-grow min-w-0 bg-transparent border-b border-brand-indigo/50 focus:border-brand-indigo focus:outline-none text-[11px] font-extrabold text-zinc-900 dark:text-white p-0 h-5"
                placeholder="New nickname..."
                autoFocus
              />
              <button type="submit" className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors" title="Save"><Check className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={cancelEditing} className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/20 rounded-md transition-colors" title="Cancel"><X className="w-3.5 h-3.5" /></button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button onClick={startEditing} className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-indigo to-violet-600 hover:brightness-110 text-white flex items-center justify-center font-bold text-xxs shrink-0 shadow-lg border border-white/20 transition-all cursor-pointer">
                <User className="w-4 h-4 text-white drop-shadow-sm" />
              </button>
              <div 
                className="min-w-0 cursor-pointer flex-1 group" 
                onClick={startEditing} 
              >
                <span className="text-[9px] font-black uppercase text-brand-indigo dark:text-brand-indigo-light block leading-none mb-1 flex items-center gap-1 opacity-80">
                  Your Lobby Alias <Edit2 className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <div className="font-extrabold text-[12px] text-zinc-900 dark:text-white truncate flex items-center gap-1.5 leading-none">
                  {userIdentity}
                </div>
              </div>
            </div>

            <button
              onClick={handleRerollIdentity}
              className="p-1.5 hover:bg-white/50 dark:hover:bg-black/50 text-brand-indigo dark:text-brand-indigo-light rounded-md transition-all border border-brand-indigo/0 hover:border-brand-indigo/20 cursor-pointer shrink-0"
              title="Roll New Random Identity"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Companions List */}
      <div className="space-y-2 relative z-10">
        <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-sans">
          Live Connection Network
        </span>

        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-0.5 scroller-hidden">
          {companions.length > 0 ? (
            companions.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveChatCompanion(c)}
                className="p-3 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10 flex items-start gap-3 relative transition-all duration-300 hover:bg-white/60 dark:hover:bg-black/40 hover:scale-[1.01] hover:shadow-md font-sans cursor-pointer group"
              >
                {/* Avatar Initial with Status Dot */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 text-zinc-700 dark:text-zinc-200 border border-white/60 dark:border-white/5 flex items-center justify-center font-black text-xs font-mono shadow-inner shadow-black/5 select-none">
                    {c.avatarChar}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#1a1c23] rounded-full shadow-sm" />
                </div>

                {/* Informational stack */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="font-bold text-[12px] text-black dark:text-white truncate leading-none drop-shadow-sm">
                      {c.name}
                    </h4>
                    <div className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-md font-mono shrink-0 backdrop-blur-[2px]">
                      <Flame className="w-2.5 h-2.5 fill-amber-500/80" /> {c.streak}d
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-600 dark:text-zinc-300 mt-1 truncate leading-tight font-medium opacity-90">
                    {c.mode}
                  </p>
                  
                  <div className="flex items-center justify-between gap-1 mt-1.5 border-t border-black/5 dark:border-white/10 pt-1.5 text-[9px] text-zinc-500 dark:text-zinc-400 font-medium leading-none">
                    <span className="truncate">{c.subject}</span>
                    <span className="shrink-0 font-mono text-zinc-400 dark:text-zinc-500">Lv {c.level}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-5 bg-white/30 dark:bg-black/20 backdrop-blur-sm rounded-2xl border border-dashed border-white/60 dark:border-white/10 text-center font-sans space-y-2">
              <div className="w-8 h-8 rounded-full bg-brand-indigo/10 flex items-center justify-center mx-auto mb-2">
                <Wifi className="w-4 h-4 text-brand-indigo animate-pulse" />
              </div>
              <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                You're the master node here! ⚡
              </p>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                Wait for peers to connect or share your study session. You are currently studying solo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Group dynamic stats */}
      <div className="relative z-10 bg-gradient-to-r from-brand-indigo/10 to-transparent dark:from-brand-indigo/20 rounded-xl p-2.5 border border-white/40 dark:border-brand-indigo/20 flex items-center justify-between text-[10px] font-sans backdrop-blur-md">
        <span className="text-brand-indigo dark:text-brand-indigo-light font-bold flex items-center gap-1.5 shrink-0 drop-shadow-sm">
          <GraduationCap className="w-3.5 h-3.5" /> Study Spark Active
        </span>
        <span className="text-zinc-600 dark:text-zinc-300 truncate ml-2 font-medium">
          Live sync enabled!
        </span>
      </div>

      {activeChatCompanion && createPortal(
        <StudentMessenger
          companion={activeChatCompanion}
          onClose={() => setActiveChatCompanion(null)}
        />,
        document.body
      )}
    </div>
  );
}
