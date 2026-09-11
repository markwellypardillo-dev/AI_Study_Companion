const fs = require('fs');
let content = fs.readFileSync('src/lib/socketPresence.ts', 'utf8');

content = content.replace(
  /const derivedName = user\.displayName \|\| user\.email\?\.split\('@'\)\[0\];/,
  `const derivedName = user.username || user.displayName || user.email?.split('@')[0];`
);

fs.writeFileSync('src/lib/socketPresence.ts', content);
