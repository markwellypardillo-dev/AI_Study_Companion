const fs = require('fs');

let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// Replace imports
content = content.replace(
  `import { googleSignIn, auth, emailPasswordSignIn, emailPasswordSignUp } from '../lib/firebase';`, 
  `import { googleSignIn, auth } from '../lib/firebase';\nimport { customEmailSignIn, customEmailSignUp } from '../lib/customAuth';`
);

// Replace the call inside handleEmailAuth
content = content.replace(/await emailPasswordSignUp\(email, password\);/g, `await customEmailSignUp(email, password);`);
content = content.replace(/await emailPasswordSignIn\(email, password\);/g, `await customEmailSignIn(email, password);`);

fs.writeFileSync('src/components/LoginView.tsx', content);
