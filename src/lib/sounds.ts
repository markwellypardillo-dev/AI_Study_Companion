import confetti from "canvas-confetti";

let notificationAudio: HTMLAudioElement | null = null;
let confettiAudio: HTMLAudioElement | null = null;

export const playNotificationSound = () => {
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio("/new-notification-sound.mp3");
    }
    notificationAudio.pause();
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(e => { if (e.name !== "AbortError") console.warn("Failed to play notification sound", e); });
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
    confettiAudio.play().catch(e => { if (e.name !== "AbortError") console.warn("Failed to play confetti sound", e); });
  } catch (e) {
    console.warn("Audio not supported");
  }
};

export const triggerConfettiWithSound = (options?: confetti.Options) => {
  playConfettiSound();
  return confetti(options);
};
