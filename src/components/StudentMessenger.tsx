import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, Reply, CornerUpLeft } from "lucide-react";
import { CompanionStudent, subscribeToMessages, sendDirectMessage, DirectMessage, getClientUid, sendTypingStatus, subscribeToTyping, sessionMessageHistory, getUserIdentity } from "../lib/socketPresence";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, or, orderBy, limit, onSnapshot } from "firebase/firestore";

const getOriginalMessageText = (message: string) => {
  if (message.startsWith("↳ Replying to ")) {
    const parts = message.split("\n\n");
    if (parts.length > 1) {
      return parts.slice(1).join("\n\n");
    }
  }
  return message;
};

const parseMessage = (text: string) => {
  if (text.startsWith("↳ Replying to ")) {
    const parts = text.split("\n\n");
    if (parts.length > 1) {
      const header = parts[0]; 
      const lines = header.split("\n");
      const replyingToName = lines[0].replace("↳ Replying to ", "").replace(":", "");
      const snippet = lines.slice(1).join("\n").replace(/^"|"$/g, '');
      const actualMessage = parts.slice(1).join("\n\n");
      return { isReply: true, replyingToName, snippet, actualMessage };
    }
  }
  return { isReply: false, actualMessage: text };
};

interface StudentMessengerProps {
  companion: CompanionStudent;
  onClose: () => void;
}

export default function StudentMessenger({ companion, onClose }: StudentMessengerProps) {
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    return sessionMessageHistory.filter(msg => msg.fromId === companion.id || msg.toId === companion.id).sort((a, b) => a.timestamp - b.timestamp);
  });
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const loadMessages = () => {
      const myId = getClientUid();
      // Create a consistent conversation ID by sorting the two IDs
      const conversationId = [myId, companion.id].sort().join('_');

      const q = query(
        collection(db, "direct_messages"),
        where("conversationId", "==", conversationId)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        // Start with local session history that might not be saved yet
        const localMsgs = sessionMessageHistory
          .filter(msg => msg.fromId === companion.id || msg.toId === companion.id)
          .sort((a, b) => a.timestamp - b.timestamp);
          
        if (!snapshot.empty) {
          const loadedMessages: DirectMessage[] = snapshot.docs.map(doc => ({
            id: doc.id,
            fromId: doc.data().fromId,
            toId: doc.data().toId,
            fromName: doc.data().fromName,
            message: doc.data().message,
            timestamp: doc.data().timestamp
          }));
          
          const merged = [...loadedMessages];
          localMsgs.forEach(lm => {
            if (!merged.find(m => m.timestamp === lm.timestamp && m.message === lm.message)) {
              merged.push(lm);
            }
          });
          setMessages(merged.sort((a, b) => a.timestamp - b.timestamp));
        } else {
          setMessages(localMsgs);
        }
      }, (err) => {
        console.error("Error loading messages:", err);
      });
    };

    loadMessages();

    const unsubMessages = subscribeToMessages((msg) => {
      // If we receive a message from the currently active companion or sent by us
      if (msg.fromId === companion.id || msg.toId === companion.id) {
        setMessages(prev => {
          // Check for dupes
          if (prev.find(m => m.timestamp === msg.timestamp && m.message === msg.message)) return prev;
          return [...prev, msg].sort((a, b) => a.timestamp - b.timestamp);
        });
      }
    });

    const unsubTyping = subscribeToTyping((data) => {
      if (data.fromId === companion.id) {
        setIsCompanionTyping(data.isTyping);
      }
    });

    return () => {
      unsubscribe();
      unsubMessages();
      unsubTyping();
    };
  }, [companion.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isCompanionTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // Emit typing start
    sendTypingStatus(companion.id, true);

    // Debounce typing stop
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(companion.id, false);
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(companion.id, false);

    const myId = getClientUid();
    
    // Optimistic local add
    const myName = getUserIdentity();
    
    let finalMessageText = inputValue.trim();
    if (replyingTo) {
      let originalText = getOriginalMessageText(replyingTo.message);
      let snippet = originalText.length > 50 ? originalText.substring(0, 50) + "..." : originalText;
      snippet = snippet.replace(/\n/g, " ");
      finalMessageText = `↳ Replying to ${replyingTo.fromName}:\n"${snippet}"\n\n${finalMessageText}`;
    }

    const newMsg: DirectMessage = {
      id: Math.random().toString(36).substring(2, 9),
      fromId: myId,
      toId: companion.id,
      fromName: myName || "You",
      message: finalMessageText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newMsg]);
    sendDirectMessage(companion.id, finalMessageText, newMsg.timestamp, newMsg.id);
    setInputValue("");
    setReplyingTo(null);

    const conversationId = [myId, companion.id].sort().join('_');

    try {
      addDoc(collection(db, "direct_messages"), {
        conversationId,
        fromId: myId,
        toId: companion.id,
        fromName: myName || "You",
        message: newMsg.message,
        timestamp: newMsg.timestamp
      });
    } catch (err) {
      console.error("Error saving message", err);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-[300px] sm:w-[320px] bg-white dark:bg-[#1a1c23] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col font-sans overflow-hidden z-[99999] h-[400px] md:h-[450px] origin-bottom-right animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-indigo to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-[#1a1c23]">
                {companion.avatarChar}
             </div>
             <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#1a1c23] rounded-full z-10" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-zinc-900 dark:text-white truncate max-w-[160px] drop-shadow-sm">
              {companion.name}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Active Now</span>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer z-50 shrink-0"
          aria-label="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroller-hidden bg-zinc-50/50 dark:bg-black/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-2">
            <MessageSquare className="w-8 h-8 text-brand-indigo" />
            <p className="text-xs font-medium text-black dark:text-white">Say hi to {companion.name}!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.fromId === getClientUid();
            const { isReply, replyingToName, snippet, actualMessage } = parseMessage(msg.message);

            return (
              <div key={msg.id || i} className={`group flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                
                {isReply && (
                  <div className={`flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold mb-0.5 px-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <CornerUpLeft className={`w-3 h-3 ${isMe ? "" : "-scale-x-100"}`} />
                    <span>{isMe ? `You replied to ${replyingToName}` : `${msg.fromName} replied to you`}</span>
                  </div>
                )}
                
                <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex flex-col max-w-full ${isMe ? "items-end" : "items-start"}`}>
                    {isReply && (
                      <div 
                        className={`px-3 py-1.5 rounded-2xl text-[11px] opacity-75 backdrop-blur-md border whitespace-pre-wrap translate-y-1.5 pb-2.5 z-0 relative ${
                          isMe 
                            ? "bg-brand-indigo/60 text-white border-brand-indigo/30 rounded-b-sm" 
                            : "bg-black/10 dark:bg-white/10 text-black dark:text-white border-transparent rounded-b-sm"
                        }`}
                      >
                        {snippet}
                      </div>
                    )}
                    
                    <div 
                      className={`px-3 py-2 rounded-2xl text-xs shadow-sm backdrop-blur-md border whitespace-pre-wrap z-10 relative ${
                        isMe 
                          ? `bg-brand-indigo/90 text-white border-brand-indigo/50 ${isReply ? "rounded-tr-sm" : ""} rounded-br-sm` 
                          : `bg-white/80 dark:bg-zinc-800/80 text-black dark:text-white border-white/50 dark:border-white/10 ${isReply ? "rounded-tl-sm" : ""} rounded-bl-sm`
                      }`}
                    >
                      {actualMessage}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setReplyingTo(msg)}
                    className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 shrink-0 shadow-sm border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 bg-white/50 dark:bg-zinc-800/50 mb-2"
                    title="Reply"
                  >
                    <Reply className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[9px] text-zinc-500 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        {isCompanionTyping && (
          <div className="flex flex-col max-w-[85%] mr-auto items-start">
            <div className="px-3 py-2 rounded-2xl text-xs shadow-sm backdrop-blur-md border bg-white/80 dark:bg-zinc-800/80 text-black dark:text-white border-white/50 dark:border-white/10 rounded-bl-sm flex items-center gap-1 h-8">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex flex-col bg-zinc-100/80 dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/10 shrink-0">
        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200/50 dark:border-zinc-700/50 transition-all animate-in slide-in-from-bottom-2">
            <div className="flex items-start flex-col overflow-hidden max-w-[85%]">
               <span className="text-[10px] font-bold text-brand-indigo flex items-center gap-1.5 mb-0.5">
                 <Reply className="w-3 h-3.5" /> Replying to {replyingTo.fromName}
               </span>
               <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate w-full pl-4 border-l-[3px] border-brand-indigo/30">
                 {getOriginalMessageText(replyingTo.message)}
               </span>
            </div>
            <button 
              onClick={() => setReplyingTo(null)} 
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white bg-zinc-200/50 dark:bg-zinc-700/50 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
               <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="p-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Write a message..."
            className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-zinc-900 dark:text-white placeholder:text-zinc-500 transition-all font-medium shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim()}
            className="w-9 h-9 rounded-full bg-brand-indigo text-white flex items-center justify-center disabled:opacity-50 transition-opacity flex-shrink-0 shadow-md"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
