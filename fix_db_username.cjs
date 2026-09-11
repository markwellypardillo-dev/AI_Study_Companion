const fs = require('fs');
let dbContent = fs.readFileSync('src/lib/db.ts', 'utf8');

dbContent = dbContent.replace(
  /email: currentUser\.email \|\| "",\n\s*level:/,
  `email: currentUser.email || "",\n      username: currentUser.username || currentUser.displayName || currentUser.email?.split('@')[0] || "",\n      level:`
);

dbContent = dbContent.replace(
  /let userId = "guest";\n  let email = "Guest User";/,
  `let userId = "guest";\n  let email = "Guest User";\n  let username = "Guest User";`
);

dbContent = dbContent.replace(
  /userId = currentUser\.uid;\n    email = currentUser\.email \|\| "";/,
  `userId = currentUser.uid;\n    email = currentUser.email || "";\n    username = currentUser.username || currentUser.displayName || currentUser.email?.split('@')[0] || "";`
);

dbContent = dbContent.replace(
  /userId = metadata\.guestId \|\| "guest";\n    email = metadata\.guestName \|\| "Guest User";/,
  `userId = metadata.guestId || "guest";\n    email = metadata.guestName || "Guest User";\n    username = metadata.guestName || "Guest User";`
);

dbContent = dbContent.replace(
  /userId,\n      email,\n      action,/,
  `userId,\n      email,\n      username,\n      action,`
);

fs.writeFileSync('src/lib/db.ts', dbContent);
