const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

appContent = appContent.replace(
  /\{isGuestMode \? "Guest User" : user\?\.email \|\| "User"\}/,
  `{isGuestMode ? "Guest User" : user?.username || user?.displayName || user?.email || "User"}`
);

fs.writeFileSync('src/App.tsx', appContent);
