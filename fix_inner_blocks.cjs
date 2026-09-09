const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// The internal blocks like stats have border-white/40. I will remove border from them too to make it truly clean.
code = code.replace(
    /className="relative overflow-hidden backdrop-blur-xl bg-white\/40 dark:bg-\[#1a1c23\]\/60 border border-white\/40 dark:border-white\/10 rounded-2xl p-3\.5 sm:p-5 shadow-\[0_8px_32px_rgba\(31,38,135,0\.07\)\] dark:shadow-\[0_8px_32px_rgba\(0,0,0,0\.4\)\] hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-2\.5 sm:gap-4 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400\/10 dark:before:from-zinc-600\/10 before:to-transparent before:opacity-50 before:pointer-events-none"/g,
    'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border-none rounded-2xl p-3.5 sm:p-5 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none"'
);

// Tooltip
code = code.replace(
    /className="pointer-events-none absolute bottom-full left-1\/2 -translate-x-1\/2 mb-1\.5 hidden group-hover:flex flex-col items-center z-30 min-w-\[180px\] bg-zinc-950\/95 dark:bg-neutral-900 border border-zinc-800 rounded-xl px-2\.5 py-1\.5 shadow-xl text-\[9px\] leading-relaxed text-center text-white font-sans"/g,
    'className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 min-w-[180px] bg-zinc-950/95 dark:bg-neutral-900 border-none rounded-xl px-2.5 py-1.5 shadow-xl text-[9px] leading-relaxed text-center text-white font-sans"'
);

// Empty states
code = code.replace(
    /className="text-center py-8 text-ios-secondary-text text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl"/g,
    'className="text-center py-8 bg-white dark:bg-zinc-900 text-ios-secondary-text text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-none rounded-2xl"'
);

code = code.replace(
    /className="text-center py-6 text-ios-secondary-text text-xxs font-medium border border-dashed border-zinc-300 dark:border-zinc-805 rounded-2xl"/g,
    'className="text-center py-6 bg-white dark:bg-zinc-900 text-ios-secondary-text text-xxs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-none rounded-2xl"'
);

// Also remove border-white/40 from the outer main containers we added earlier
code = code.replace(
    /className="relative overflow-hidden backdrop-blur-xl bg-white\/40 dark:bg-\[#1a1c23\]\/60 border border-white\/40 dark:border-white\/10 /g,
    'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border-none '
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Done.");
