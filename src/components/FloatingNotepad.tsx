import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit3, X, Minimize2, Maximize2, Download } from "lucide-react";

const NOTEPAD_STORAGE_KEY = "ai_study_companion_notepad";

export default function FloatingNotepad() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes from local storage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(NOTEPAD_STORAGE_KEY);
    if (savedNotes !== null) {
      setNotes(savedNotes);
    }
  }, []);

  // Save notes to local storage when they change
  useEffect(() => {
    localStorage.setItem(NOTEPAD_STORAGE_KEY, notes);
  }, [notes]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, isExpanded]);

  const handleExport = () => {
    if (!notes.trim()) return;
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Study_Notes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed z-50 bottom-24 right-4 sm:right-6 backdrop-blur-[40px] backdrop-saturate-[1.5] bg-white/10 dark:bg-black/10 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5 border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/5 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded ? "w-[calc(100vw-32px)] sm:w-[600px] h-[70vh]" : "w-[calc(100vw-32px)] sm:w-[320px] h-[400px]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-black dark:text-white" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 drop-shadow-sm">Scratchpad</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 transition-colors"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editing Area */}
            <div className="flex-1 relative flex flex-col overflow-hidden">
              <div className="absolute inset-0 pointer-events-none rounded-b-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" />
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot down formulas, ideas, and study notes here..."
                className="flex-1 w-full flex-grow p-4 resize-none bg-transparent outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-500/80 dark:placeholder:text-zinc-400/70 leading-relaxed relative z-10"
                spellCheck="false"
              />
              
              {/* Count Footer */}
              <div className="relative z-20 flex items-center justify-between px-4 py-2.5 border-t border-white/30 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-b-2xl select-none">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
                    {notes.trim() === "" ? 0 : notes.trim().split(/\s+/).length} Word{notes.trim() === "" || notes.trim().split(/\s+/).length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
                    {notes.length} Char{notes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={handleExport}
                  disabled={notes.trim() === ""}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-300 transition-colors text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export to Text"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-40 bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
        title="Open Notepad"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
      </button>
    </>
  );
}
