const fs = require('fs');
let content = fs.readFileSync('src/lib/socketPresence.ts', 'utf8');

content = content.replace(
  `import { auth, db } from './firebase';`,
  `import { auth, db } from './firebase';\nimport { getCustomUser } from './customAuth';`
);

content = content.replace(
  `  if (auth.currentUser) {\n    return auth.currentUser.uid;\n  }`,
  `  const currentUser = auth.currentUser || getCustomUser();\n  if (currentUser) {\n    return currentUser.uid;\n  }`
);

fs.writeFileSync('src/lib/socketPresence.ts', content);
