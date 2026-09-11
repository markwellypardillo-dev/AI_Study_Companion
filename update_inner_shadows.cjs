const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Fix the active users card hover effect
content = content.replace(
  /hover:border-zinc-300 dark:hover:border-zinc-700/g,
  'hover:shadow-lg dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
);

// Fix the Content Moderation guide card
content = content.replace(
  /border \$\{isFlagged \? 'border-red-500\/50 bg-red-50\/50 dark:bg-red-950\/20' : 'border-zinc-200 dark:border-zinc-800'\} rounded-xl hover:border-purple-300 dark:hover:border-purple-800/,
  `border-0 shadow-sm shadow-black/5 dark:shadow-black/20 \${isFlagged ? 'shadow-red-500/20 bg-red-50/50 dark:bg-red-950/20' : ''} rounded-xl hover:shadow-md hover:shadow-purple-500/20 dark:hover:shadow-purple-500/20`
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
