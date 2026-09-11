const fs = require('fs');

// Fix db.ts
let dbContent = fs.readFileSync('src/lib/db.ts', 'utf8');
if (!dbContent.includes('import { getCustomUser }')) {
  dbContent = `import { getCustomUser } from './customAuth';\n` + dbContent;
  fs.writeFileSync('src/lib/db.ts', dbContent);
}

// Fix socketPresence.ts
let socketContent = fs.readFileSync('src/lib/socketPresence.ts', 'utf8');
if (!socketContent.includes('import { getCustomUser }')) {
  socketContent = `import { getCustomUser } from './customAuth';\n` + socketContent;
  fs.writeFileSync('src/lib/socketPresence.ts', socketContent);
}
