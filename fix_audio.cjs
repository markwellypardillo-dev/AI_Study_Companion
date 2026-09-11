const fs = require('fs');

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(
    /const audio = new Audio\(\);/g,
    'const audio = new Audio();\n      audio.crossOrigin = "use-credentials";'
);
fs.writeFileSync('src/App.tsx', appCode);

// Fix sounds.ts
let soundsCode = fs.readFileSync('src/lib/sounds.ts', 'utf-8');
soundsCode = soundsCode.replace(
    /notificationAudio = new Audio\("\/new-notification-sound\.mp3"\);/g,
    'notificationAudio = new Audio("/new-notification-sound.mp3");\n      notificationAudio.crossOrigin = "use-credentials";'
);
soundsCode = soundsCode.replace(
    /confettiAudio = new Audio\("\/confetti\.mp3"\);/g,
    'confettiAudio = new Audio("/confetti.mp3");\n      confettiAudio.crossOrigin = "use-credentials";'
);
fs.writeFileSync('src/lib/sounds.ts', soundsCode);
