const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

// Add import
content = content.replace(
  `import { auth, db } from './firebase';`,
  `import { auth, db } from './firebase';\nimport { getCustomUser } from './customAuth';`
);

// We need to replace all instances of:
// if (!auth.currentUser) return; -> const currentUser = auth.currentUser || getCustomUser(); if (!currentUser) return;
// auth.currentUser.uid -> currentUser.uid

content = content.replace(/if \(!auth\.currentUser\) return;/g, `const currentUser = auth.currentUser || getCustomUser();\n  if (!currentUser) return;`);
content = content.replace(/if \(!auth\.currentUser\) return null;/g, `const currentUser = auth.currentUser || getCustomUser();\n  if (!currentUser) return null;`);
content = content.replace(/if \(!auth\.currentUser\) return \(\) => \{\};/g, `const currentUser = auth.currentUser || getCustomUser();\n  if (!currentUser) return () => {};`);

content = content.replace(/auth\.currentUser\.uid/g, `currentUser.uid`);
content = content.replace(/auth\.currentUser\.email/g, `currentUser.email`);

content = content.replace(/if \(auth\.currentUser\) \{/g, `const currentUser = auth.currentUser || getCustomUser();\n  if (currentUser) {`);

fs.writeFileSync('src/lib/db.ts', content);
