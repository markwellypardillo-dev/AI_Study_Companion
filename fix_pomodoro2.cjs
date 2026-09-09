const fs = require('fs');
let code = fs.readFileSync('src/components/PomodoroTimer.tsx', 'utf-8');

code = code.replace(
    /className="relative overflow-hidden backdrop-blur-xl bg-white\/40 dark:bg-\[#1a1c23\]\/60 border border-white\/40 dark:border-white\/10 /g,
    'className="relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#1a1c23]/60 border-none '
);

fs.writeFileSync('src/components/PomodoroTimer.tsx', code);
