const fs = require('fs');
let code = fs.readFileSync('src/components/StudentOasis.tsx', 'utf-8');

code = code.replace(
    /className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4"/g,
    'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border-none rounded-3xl p-5 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-4 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none"'
);

// Buttons and segmented controls wrapper
code = code.replace(
    /className="grid grid-cols-3 gap-1 p-1 bg-ios-light-bg dark:bg-ios-dark-bg border border-zinc-200\/50 dark:border-zinc-950 rounded-xl"/g,
    'className="grid grid-cols-3 gap-1 p-1 bg-white/50 dark:bg-zinc-900/50 shadow-inner rounded-xl border-none"'
);

// Internal boxes
code = code.replace(
    /className="flex flex-col items-center justify-center bg-ios-light-bg dark:bg-zinc-950 p-4\.5 rounded-2xl border border-zinc-200\/50 dark:border-zinc-900\/60 relative overflow-hidden group min-h-\[170px\]"/g,
    'className="flex flex-col items-center justify-center bg-white dark:bg-zinc-900 p-4.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-none relative overflow-hidden group min-h-[170px]"'
);

code = code.replace(
    /className="space-y-4 bg-ios-light-bg dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200\/50 dark:border-zinc-900\/60 font-sans"/g,
    'className="space-y-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] border-none font-sans"'
);

// Toggle buttons
code = code.replace(
    /className={`p-2 rounded-xl transition-all border flex items-center justify-center gap-1\.5 font-bold text-xs \${/g,
    'className={`p-2 rounded-xl transition-all shadow-sm border-none flex items-center justify-center gap-1.5 font-bold text-xs ${'
);
code = code.replace(
    / : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-100"/g,
    ' : "bg-white dark:bg-zinc-900 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-800"'
);

// Goal selection rows
code = code.replace(
    /className={`w-full p-2\.5 rounded-xl border text-left transition-all \${/g,
    'className={`w-full p-2.5 rounded-xl shadow-sm border-none text-left transition-all ${'
);
code = code.replace(
    / : "border-zinc-200\/60 dark:border-zinc-900 bg-white dark:bg-zinc-90 w-full"/g,
    ' : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 w-full"'
);

// Session config
code = code.replace(
    /className="w-full bg-ios-light-bg dark:bg-zinc-900 text-xs p-2\.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"/g,
    'className="w-full bg-white dark:bg-zinc-900 text-xs p-2.5 rounded-xl shadow-sm border-none text-black dark:text-white"'
);

// Audio select
code = code.replace(
    /className="w-full bg-ios-light-bg dark:bg-zinc-900 text-xs p-2\.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-black dark:text-white appearance-none"/g,
    'className="w-full bg-white dark:bg-zinc-900 text-xs p-2.5 rounded-xl shadow-sm border-none text-black dark:text-white appearance-none"'
);

fs.writeFileSync('src/components/StudentOasis.tsx', code);
