const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  /const isProduction = process\.env\.NODE_ENV === "production" \|\| require\("fs"\)\.existsSync\(require\("path"\)\.join\(process\.cwd\(\), "dist", "index\.html"\)\);/g,
  'const fs = await import("fs");\n  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist", "index.html"));'
);

fs.writeFileSync('server.ts', serverContent);
