const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// The Welcome greeting pill
code = code.replace(
    /className="flex items-center justify-between gap-5 bg-ios-light-bg dark:bg-ios-dark-bg px-4 py-2\.5 rounded-2xl border border-zinc-200\/50 dark:border-zinc-950 w-full md:w-auto shrink-0 uppercase font-bold text-\[10px\]"/g,
    'className="flex items-center justify-between gap-5 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border-none w-full md:w-auto shrink-0 uppercase font-bold text-[10px]"'
);

// Pomodoro empty state texts
code = code.replace(
    /bg-zinc-50 dark:bg-zinc-900\/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/g,
    'bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-none'
);

// Built-in pomodoro space nested module
code = code.replace(
    /className="border border-zinc-200\/50 dark:border-zinc-900\/60 p-4\.5 rounded-2xl bg-ios-light-bg dark:bg-ios-dark-bg space-y-3"/g,
    'className="shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] border-none p-4.5 rounded-2xl bg-white dark:bg-zinc-900 space-y-3"'
);

// Upcoming event rows
code = code.replace(
    /className="flex items-center justify-between p-3\.5 bg-ios-light-bg dark:bg-ios-dark-bg rounded-xl border border-zinc-200\/50 dark:border-zinc-900\/50"/g,
    'className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-none"'
);

// Journal add form
code = code.replace(
    /className="space-y-4 bg-ios-light-bg dark:bg-ios-dark-bg p-4 sm:p-5 rounded-2xl border border-zinc-200\/50 dark:border-zinc-950"/g,
    'className="space-y-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] border-none"'
);

// Journal textarea
code = code.replace(
    /className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/g,
    'className="w-full text-xs p-3 rounded-xl shadow-inner dark:shadow-none bg-zinc-50 dark:bg-zinc-950/50 border-none'
);

// Journal filter buttons
code = code.replace(
    /className={`py-2 rounded-xl text-\[10px\] font-black transition-all flex items-center justify-center border font-sans \${/g,
    'className={`py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center shadow-sm font-sans ${'
);
code = code.replace(
    /: "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"/g,
    ': "bg-white dark:bg-zinc-900 border-transparent text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white"'
);
code = code.replace(
    /className={`py-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1\.5 border font-sans \${/g,
    'className={`py-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 shadow-sm font-sans ${'
);

// Journal entries list items
code = code.replace(
    /className="p-3 bg-ios-light-bg dark:bg-ios-dark-bg rounded-xl border border-zinc-200\/40 dark:border-zinc-900\/40 space-y-1\.5 relative group"/g,
    'className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-none space-y-1.5 relative group"'
);

// Sync alert
code = code.replace(
    /className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4\.5 flex gap-3 text-zinc-900 dark:text-zinc-100 animate-in fade-in slide-in-from-top-1 duration-200"/g,
    'className="bg-white dark:bg-zinc-800 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-none rounded-2xl p-4.5 flex gap-3 text-zinc-900 dark:text-zinc-100 animate-in fade-in slide-in-from-top-1 duration-200"'
);


fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('Done replacement.');
