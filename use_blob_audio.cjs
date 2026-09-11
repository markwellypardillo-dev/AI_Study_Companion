const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `
        if (audioRef.current.src !== pathUrl) {
          if (pathUrl.includes(window.location.origin) || pathUrl.startsWith('/')) {
            audioRef.current.crossOrigin = "use-credentials";
          } else {
            audioRef.current.removeAttribute("crossOrigin");
          }
          audioRef.current.src = pathUrl;
        }
        const playPromise = audioRef.current.play();
`;

const replacement = `
        if (audioRef.current.src !== pathUrl) {
          if (pathUrl.includes(window.location.origin) || pathUrl.startsWith('/')) {
            // Use fetch to bypass iframe cookie partitioning issues in some browsers
            fetch(pathUrl)
              .then(res => res.blob())
              .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                if (audioRef.current) {
                  audioRef.current.src = blobUrl;
                  const playPromise = audioRef.current.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(e => {
                      if (e.name !== 'AbortError' && !String(e).includes('interrupted')) {
                         console.error("Audio Blob Playback aborted:", e);
                      }
                    });
                  }
                }
              })
              .catch(e => {
                console.error("Failed to fetch audio:", e);
                setMusicError("Unable to stream audio track.");
                setMusicIsPlaying(false);
              });
              
             // We do an early return because play is handled async
             return;
          } else {
            audioRef.current.removeAttribute("crossOrigin");
            audioRef.current.src = pathUrl;
          }
        }
        
        const playPromise = audioRef.current.play();
`;

if(appCode.includes(target)) {
    appCode = appCode.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log("App.tsx fixed with blob");
} else {
    console.log("App.tsx target not found");
}
