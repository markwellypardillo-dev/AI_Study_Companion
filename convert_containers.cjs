const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// The class patterns to replace
const targetClasses = [
    // Hero container
    {
        regex: /className="bg-ios-light-secondary h-full w-full dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 (rounded-3xl p-5 sm:p-6) shadow-sm (flex flex-col md:flex-row items-start md:items-center gap-5 justify-between select-none)"/g,
        replacement: 'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border border-white/40 dark:border-white/10 $1 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] $2 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none h-full w-full"'
    },
    // Sub-items (stats/priorities)
    {
        regex: /className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200\/80 dark:border-zinc-800\/80 (rounded-2xl p-3\.5 sm:p-5) shadow-sm hover:shadow-md transition-shadow (flex flex-col sm:flex-row items-start sm:items-center gap-2\.5 sm:gap-4)"/g,
        replacement: 'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border border-white/40 dark:border-white/10 $1 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-md transition-shadow $2 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none"'
    },
    // Main content blocks (Consistency Grid, Journal)
    {
        regex: /className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 (rounded-3xl p-6) shadow-sm space-y-4"/g,
        replacement: 'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border border-white/40 dark:border-white/10 $1 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-4 before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none"'
    },
    // Other generic main block
    {
        regex: /className="bg-ios-light-secondary h-full w-full dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 (rounded-3xl p-6) shadow-sm"/g,
        replacement: 'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border border-white/40 dark:border-white/10 $1 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-full w-full before:absolute before:inset-0 before:bg-gradient-to-br before:from-zinc-400/10 dark:before:from-zinc-600/10 before:to-transparent before:opacity-50 before:pointer-events-none"'
    }
];

let replaced = 0;
targetClasses.forEach(tc => {
    const matches = code.match(tc.regex);
    if (matches) {
        replaced += matches.length;
        code = code.replace(tc.regex, tc.replacement);
    }
});

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log(`Replaced ${replaced} container styles in Dashboard.tsx.`);
