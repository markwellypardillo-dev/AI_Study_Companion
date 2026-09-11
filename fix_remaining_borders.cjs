const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Line 409:
content = content.replace(
  /className="bg-amber-500\/10 dark:bg-amber-500\/5 border border-amber-500\/20 rounded-2xl p-4"/g,
  'className="bg-amber-500/10 dark:bg-amber-500/5 shadow-sm shadow-amber-500/20 rounded-2xl p-4"'
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
