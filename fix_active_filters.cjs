const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

code = code.replace(
    /border-black dark:border-white /g,
    ''
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
