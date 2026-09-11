const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /onPlay={\(\) => {\s*if \(isYoutubeTrack\) setMusicIsPlaying\(true\);\s*}}/g,
  '// onPlay={() => {}}'
);

code = code.replace(
  /onPause={\(\) => {\s*if \(isYoutubeTrack\) setMusicIsPlaying\(false\);\s*}}/g,
  '// onPause={() => {}}'
);

fs.writeFileSync('src/App.tsx', code);
