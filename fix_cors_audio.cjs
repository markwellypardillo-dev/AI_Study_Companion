const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

appCode = appCode.replace(
    /const audio = new Audio\(\);\n\s*audio\.crossOrigin = "use-credentials";/,
    'const audio = new Audio();'
);

// We need to set crossOrigin right before setting src, depending on the domain.
const target = `
        if (audioRef.current.src !== pathUrl) {
          audioRef.current.src = pathUrl;
        }`;

const replacement = `
        if (audioRef.current.src !== pathUrl) {
          if (pathUrl.includes(window.location.origin) || pathUrl.startsWith('/')) {
            audioRef.current.crossOrigin = "use-credentials";
          } else {
            audioRef.current.removeAttribute("crossOrigin");
          }
          audioRef.current.src = pathUrl;
        }`;

if(appCode.includes(target)) {
    appCode = appCode.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log("App.tsx fixed");
} else {
    console.log("App.tsx target not found");
}

