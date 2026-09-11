const fs = require('fs');
let authContent = fs.readFileSync('src/lib/customAuth.ts', 'utf8');

authContent = authContent.replace(
  /const user = \{ uid: finalUid, email: accountData\.email, isCustom: true \};/,
  `const user = { uid: finalUid, email: accountData.email, username: accountData.username, isCustom: true };`
);

fs.writeFileSync('src/lib/customAuth.ts', authContent);
