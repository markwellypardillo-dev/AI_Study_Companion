const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  /\{u\.email \|\| u\.uid \|\| 'Unknown'\}/,
  `{u.username || u.email || u.uid || 'Unknown'}`
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
