const fs = require('fs');

let code = `import confetti from "canvas-confetti";
let notificationAudio: HTMLAudioElement | null = null;
let confettiAudio: HTMLAudioElement | null = null;

const playSafe = (audio: HTMLAudioElement) => {
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      const msg = e.message || String(e);
      if (e.name !== "AbortError" && !msg.includes('interrupted')) {
        console.warn("Failed to play sound", e);
      }
    });
  }
};

export const playNotificationSound = () => {
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio("/new-notification-sound.mp3");
    }
    notificationAudio.pause();
    notificationAudio.currentTime = 0;
    playSafe(notificationAudio);
  } catch (e) {
    console.warn("Audio not supported");
  }
};

export const playConfettiSound = () => {
  try {
    if (!confettiAudio) {
      confettiAudio = new Audio("/confetti.mp3");
    }
    confettiAudio.pause();
    confettiAudio.currentTime = 0;
    playSafe(confettiAudio);
  } catch (e) {
    console.warn("Audio not supported");
  }
};

export const triggerConfettiWithSound = (options?: confetti.Options) => {
  playConfettiSound();
  return confetti(options);
};
`;

fs.writeFileSync('src/lib/sounds.ts', code);
