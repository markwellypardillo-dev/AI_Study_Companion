const fs = require('fs');
let code = fs.readFileSync('src/components/GuideView.tsx', 'utf-8');

const regex = /: "bg-ios-light-secondary dark:bg-ios-dark-secondary text-ios-secondary-text hover:text-black dark:hover:text-white border border-transparent"/g;
const replace = ': "text-ios-secondary-text hover:text-black dark:hover:text-white"';

code = code.replace(regex, replace);
fs.writeFileSync('src/components/GuideView.tsx', code);
