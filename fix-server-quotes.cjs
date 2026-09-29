const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Replace the unescaped backticks with escaped backticks or just standard single quotes for the example.
// Actually, I can just replace ```python with \`\`\`python and ``` with \`\`\` and `...` with \`...\`
content = content.replace(/```python/g, '\\`\\`\\`python');
content = content.replace(/```,/g, '\\`\\`\\`,');
content = content.replace(/`\.\.\.`/g, '\\`...\\`');

fs.writeFileSync('server.ts', content);
