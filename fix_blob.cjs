const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `
        if (audioRef.current.src !== pathUrl) {
          audioRef.current.src = pathUrl;
        }
        const playPromise = audioRef.current.play();`;

const replacement = `
        if (audioRef.current.getAttribute("data-original-src") !== pathUrl) {
          audioRef.current.setAttribute("data-original-src", pathUrl);
          if (pathUrl.includes(window.location.origin) || pathUrl.startsWith('/')) {
            fetch(pathUrl)
              .then(res => res.blob())
              .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                if (audioRef.current) {
                  audioRef.current.src = blobUrl;
                  const p = audioRef.current.play();
                  if (p !== undefined) {
                    p.catch(e => {
                      if (e.name !== 'AbortError' && !String(e).includes('interrupted')) {
                         console.error("Audio Blob Playback aborted:", e);
                         setMusicError("Autoplay blocked or stream error.");
                         setMusicIsPlaying(false);
                      }
                    });
                  }
                }
              })
              .catch(e => {
                console.error("Failed to fetch audio:", e);
                setMusicError("Failed to fetch audio file.");
                setMusicIsPlaying(false);
              });
            return;
          } else {
            audioRef.current.src = pathUrl;
          }
        }
        
        const playPromise = audioRef.current.play();`;

if(appCode.includes(target)) {
    appCode = appCode.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log("App.tsx fixed with blob");
} else {
    console.log("App.tsx target not found");
}
