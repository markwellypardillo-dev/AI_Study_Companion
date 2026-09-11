const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
    /const playPromise = audioRef\.current\.play\(\);/,
    `console.log("Playing audio with src:", audioRef.current.src, "pathUrl:", pathUrl);\n        const playPromise = audioRef.current.play();`
);

fs.writeFileSync('src/App.tsx', code);
