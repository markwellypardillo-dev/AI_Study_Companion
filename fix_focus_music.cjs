const fs = require('fs');
let code = fs.readFileSync('src/components/FocusMusicPlayer.tsx', 'utf-8');

code = code.replace(
  'const [spotifyInput, setSpotifyInput] = useState("");',
  'const [spotifyInput, setSpotifyInput] = useState("");\n  const [errorMsg, setErrorMsg] = useState("");'
);

code = code.replace(
  'alert("Invalid Spotify URL. Please paste a valid link like https://open.spotify.com/playlist/... ");',
  'setErrorMsg("Invalid Spotify URL. Please paste a valid link.");\n      setTimeout(() => setErrorMsg(""), 4000);'
);

const renderTarget = '<div className="flex gap-2">';
const renderReplace = `{errorMsg && <p className="text-red-500 text-xs font-semibold mb-2">{errorMsg}</p>}
                <div className="flex gap-2">`;
code = code.replace(renderTarget, renderReplace);

fs.writeFileSync('src/components/FocusMusicPlayer.tsx', code);
