const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  /const fs = await import\("fs"\);\n  const isProduction = process\.env\.NODE_ENV === "production" \|\| fs\.existsSync\(path\.join\(process\.cwd\(\), "dist", "index\.html"\)\);\n  if \(\!isProduction\) \{/,
  'if (process.env.NODE_ENV !== "production") {'
);

fs.writeFileSync('server.ts', serverContent);
