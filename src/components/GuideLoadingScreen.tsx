import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export default function GuideLoadingScreen({ onCancel }: { onCancel: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 3000); // 3 seconds
    const timer2 = setTimeout(() => setPhase(2), 6000); // 6 seconds
    const timer3 = setTimeout(() => setPhase(3), 8500); // 8.5 seconds
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const aiSteps = [
    "Analyzing document structure...",
    "Extracting key concepts & terminology...",
    "Applying prompt-chain scaffolding...",
    "Synthesizing study outline..."
  ];

  return (
    <div className="w-full max-w-5xl mx-auto pt-6">
      
      {/* Loading Status Header */}
      <div className="text-center mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4">
          <Sparkles className="w-6 h-6 text-black dark:text-white animate-pulse" />
        </div>
        <h3 className="text-lg font-black text-black dark:text-white mb-2">
          {aiSteps[phase]}
        </h3>
        <div className="flex justify-center items-center gap-2 text-xs text-ios-secondary-text font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-bounce" />
          <span className="uppercase">Processing AI algorithms</span>
        </div>
      </div>

      {/* Skeleton Body */}
      <div className="animate-pulse space-y-8">
        <div className="flex flex-col gap-4 mb-10">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
          <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
        </div>

        <div className="flex gap-2 mb-8 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-32 shrink-0"></div>
          ))}
        </div>

        <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-[90%]"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-[95%]"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-[80%]"></div>
          </div>
          
          <div className="pt-6 space-y-4">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-[85%]"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-[92%]"></div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-ios-light dark:bg-ios-dark text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all text-xs font-bold"
            >
              Cancel / Go Back
            </button>
        </div>
      </div>
    </div>
  );
}
