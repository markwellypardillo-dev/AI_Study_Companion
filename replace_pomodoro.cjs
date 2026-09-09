const fs = require('fs');
let code = fs.readFileSync('src/components/PomodoroTimer.tsx', 'utf-8');

code = code.replace(
    /className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center transition-all duration-300"/g,
    'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none"'
);

code = code.replace(
    /className="mt-4 flex items-center gap-1\.5 text-xs font-bold text-amber-500 bg-amber-500\/10 px-3 py-1\.5 rounded-xl border border-amber-200\/30 animate-bounce"/g,
    'className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-white dark:bg-amber-500/10 px-3 py-1.5 rounded-xl shadow-[0_2px_8px_rgba(245,158,11,0.15)] dark:shadow-none border-none animate-bounce"'
);

fs.writeFileSync('src/components/PomodoroTimer.tsx', code);
