const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');
content = content.replace('@import "tailwindcss";', '@import "tailwindcss";\n@plugin "@tailwindcss/typography";');
fs.writeFileSync('src/index.css', content);
