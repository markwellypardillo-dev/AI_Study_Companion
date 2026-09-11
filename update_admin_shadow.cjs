const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Replace the main container border
content = content.replace(
  /className="mb-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-3xl relative overflow-hidden transition-all duration-300 shadow-sm"/,
  'className="mb-8 bg-white dark:bg-zinc-900/50 border-0 rounded-3xl relative overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"'
);

// We should also replace inner card borders to be consistent if there are any.
content = content.replace(
  /border border-zinc-200 dark:border-zinc-800(\/50)?/g,
  'border-0 shadow-md shadow-black/5 dark:shadow-black/20'
);

content = content.replace(
  /border border-zinc-200 dark:border-zinc-800/g,
  'border-0 shadow-md shadow-black/5 dark:shadow-black/20'
);

// Let's just do a global replace for the solid borders in AdminPanel
content = content.replace(/border border-zinc-200 dark:border-zinc-850/g, 'border-0 shadow-md shadow-black/5 dark:shadow-black/20');
content = content.replace(/border border-zinc-200 dark:border-zinc-700/g, 'border-0 shadow-md shadow-black/5 dark:shadow-black/20');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
