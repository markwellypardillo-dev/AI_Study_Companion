const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'audio.onplay = () => setMusicIsPlaying(true);',
  '// audio.onplay = () => setMusicIsPlaying(true);'
);

code = code.replace(
  'audio.onpause = () => setMusicIsPlaying(false);',
  '// audio.onpause = () => setMusicIsPlaying(false);'
);

fs.writeFileSync('src/App.tsx', code);
