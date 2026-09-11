const fs = require('fs');
let code = fs.readFileSync('src/lib/sounds.ts', 'utf-8');

code = code.replace(
  /export const playNotificationSound = \(\) => {[\s\S]*?};/,
  `export const playNotificationSound = () => {
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio();
      fetch("/new-notification-sound.mp3")
        .then(res => res.blob())
        .then(blob => {
          if(notificationAudio) {
             notificationAudio.src = URL.createObjectURL(blob);
             notificationAudio.play().catch(e => { if (e.name !== "AbortError") console.warn("Failed to play notification sound", e); });
          }
        });
    } else {
      notificationAudio.pause();
      notificationAudio.currentTime = 0;
      notificationAudio.play().catch(e => { if (e.name !== "AbortError") console.warn("Failed to play notification sound", e); });
    }
  } catch (e) {
    console.warn("Audio not supported");
  }
};`
);

code = code.replace(
  /export const playConfettiSound = \(\) => {[\s\S]*?};/,
  `export const playConfettiSound = () => {
  try {
    if (!confettiAudio) {
      confettiAudio = new Audio();
      fetch("/confetti.mp3")
        .then(res => res.blob())
        .then(blob => {
          if(confettiAudio) {
             confettiAudio.src = URL.createObjectURL(blob);
             confettiAudio.play().catch(e => { if (e.name !== "AbortError") console.warn("Failed to play confetti sound", e); });
          }
        });
    } else {
      confettiAudio.pause();
      confettiAudio.currentTime = 0;
      confettiAudio.play().catch(e => { if (e.name !== "AbortError") console.warn("Failed to play confetti sound", e); });
    }
  } catch (e) {
    console.warn("Audio not supported");
  }
};`
);

fs.writeFileSync('src/lib/sounds.ts', code);
