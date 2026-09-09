const fs = require('fs');
let code = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');

code = code.replace(
    /className={`p-1\.5 rounded-lg transition-all border cursor-pointer relative z-10 \${/g,
    'className={`p-1.5 rounded-lg transition-all shadow-sm border-none cursor-pointer relative z-10 ${'
);

code = code.replace(
    / : "text-ios-secondary-text hover:text-black dark:hover:text-white border-transparent"/g,
    ' : "text-ios-secondary-text hover:text-black dark:hover:text-white shadow-none bg-transparent"'
);

code = code.replace(
    / : "bg-zinc-150 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700"/g,
    ' : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"'
);

code = code.replace(
    /className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm transition-all duration-300"/g,
    'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border-none rounded-3xl p-6 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none"'
);

code = code.replace(
    /className="absolute top-2 right-2 text-\[8px\] font-mono bg-emerald-500\/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500\/20 px-1\.5 py-0\.5 rounded-full font-bold"/g,
    'className="absolute top-2 right-2 text-[8px] font-mono bg-white dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_2px_8px_rgba(16,185,129,0.15)] dark:shadow-none border-none px-1.5 py-0.5 rounded-full font-bold"'
);

code = code.replace(
    /className={`flex items-center justify-between p-2\.5 rounded-xl text-xs cursor-pointer border select-none transition-all \${/g,
    'className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer shadow-sm border-none select-none transition-all ${'
);

code = code.replace(
    / : "bg-ios-light-bg hover:bg-zinc-100\/80 dark:bg-ios-dark-bg dark:hover:bg-zinc-900\/80 border-zinc-200\/50 dark:border-zinc-900 text-black dark:text-zinc-300"/g,
    ' : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-zinc-300"'
);

code = code.replace(
    / : "bg-zinc-100 dark:bg-zinc-800 border-black dark:border-white text-zinc-900 dark:text-zinc-100 font-black"/g,
    ' : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-black"'
);

code = code.replace(
    /className={`px-2\.5 py-1 text-xxs font-black rounded-lg transition-all border \${/g,
    'className={`px-2.5 py-1 text-xxs font-black rounded-lg transition-all shadow-sm border-none ${'
);

code = code.replace(
    / : "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-sm"/g,
    ' : "bg-black dark:bg-white text-white dark:text-black"'
);

code = code.replace(
    / : "bg-ios-light-bg dark:bg-ios-dark-bg border-zinc-200\/50 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100"/g,
    ' : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"'
);

fs.writeFileSync('src/components/FocusMusicPlayer.tsx', code);
