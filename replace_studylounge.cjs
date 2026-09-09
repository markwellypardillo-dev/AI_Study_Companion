const fs = require('fs');
let code = fs.readFileSync('src/components/StudyLounge.tsx', 'utf-8');

code = code.replace(
    /className="p-0\.5 px-2 bg-zinc-200\/50 dark:bg-zinc-800\/80 backdrop-blur-md text-zinc-900 dark:text-zinc-100 rounded-lg text-\[10px\] font-black uppercase flex items-center gap-1\.5 font-sans border border-zinc-300 dark:border-zinc-700"/g,
    'className="p-0.5 px-2 bg-white dark:bg-zinc-800 backdrop-blur-md text-zinc-900 dark:text-zinc-100 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 font-sans shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none border-none"'
);

code = code.replace(
    /className="text-\[9px\] font-mono text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider backdrop-blur bg-white\/30 dark:bg-black\/30 px-2 py-0\.5 rounded-full border border-white\/20 dark:border-white\/10"/g,
    'className="text-[9px] font-mono text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider backdrop-blur bg-white dark:bg-zinc-800/80 px-2 py-0.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-none"'
);

code = code.replace(
    /className="relative z-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-2\.5 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-\[10px\] font-sans backdrop-blur-md"/g,
    'className="relative z-10 bg-white dark:bg-zinc-900 rounded-xl p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-none flex items-center justify-between text-[10px] font-sans backdrop-blur-md"'
);

fs.writeFileSync('src/components/StudyLounge.tsx', code);
