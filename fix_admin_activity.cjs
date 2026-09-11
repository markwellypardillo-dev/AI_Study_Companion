const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  /<span className="font-semibold">\{act\.email \|\| act\.userId\}<\/span>/,
  `<span className="font-semibold">{act.username || act.email || act.userId}</span>`
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
