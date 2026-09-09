import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Sprout, 
  Droplet, 
  Wind, 
  CheckCircle, 
  Sparkles, 
  Smile, 
  Compass, 
  Volume2, 
  VolumeX, 
  Edit2, 
  Save, 
  Play, 
  Pause, 
  CheckSquare, 
  Gift, 
  Activity,
  Heart
} from "lucide-react";
import { UserProgress } from "../types";

interface StudentOasisProps {
  progress: UserProgress;
  onAddXp?: (amount: number) => void;
  journalCount: number;
}

export default function StudentOasis({ progress, onAddXp, journalCount }: StudentOasisProps) {
  // Storing Companion and Hydration states under localStorage keys
  const [plantName, setPlantName] = useState<string>(() => {
    return localStorage.getItem("ai_study_companion_plant_name") || "Phytos";
  });
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("");

  const [waterDrops, setWaterDrops] = useState<number>(() => {
    const saved = localStorage.getItem("ai_study_companion_water_drops");
    return saved ? parseInt(saved, 10) : 5;
  });

  const [growthPoints, setGrowthPoints] = useState<number>(() => {
    const saved = localStorage.getItem("ai_study_companion_growth_points");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [activeTab, setActiveTab] = useState<"garden" | "synth" | "quests">("garden");

  // Mindfulness Deep Breathing state
  const [isBreathing, setIsBreathing] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "completed">("inhale");
  const [breathingSecsLeft, setBreathingSecsLeft] = useState<number>(4);

  // Synthesizer Audio State
  const [synthRunning, setSynthRunning] = useState<boolean>(false);
  const [synthSound, setSynthSound] = useState<"binaural" | "pink_rain" | "cosmic_drone">("binaural");
  const [synthVolume, setSynthVolume] = useState<number>(0.3); // 0.0 to 1.0

  // Daily Quests states
  const [questBreathDone, setQuestBreathDone] = useState<boolean>(() => {
    return localStorage.getItem("ai_study_companion_quest_breath") === "true";
  });
  const [claimedQuests, setClaimedQuests] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ai_study_companion_claimed_quests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Web Audio Context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{
    gainNode: GainNode | null;
    oscLeft: OscillatorNode | null;
    oscRight: OscillatorNode | null;
    noiseNode: AudioWorkletNode | ScriptProcessorNode | null;
    filterNode: BiquadFilterNode | null;
  }>({
    gainNode: null,
    oscLeft: null,
    oscRight: null,
    noiseNode: null,
    filterNode: null
  });

  // Save Companion Garden info to localStorage on state modifications
  useEffect(() => {
    localStorage.setItem("ai_study_companion_water_drops", waterDrops.toString());
  }, [waterDrops]);

  useEffect(() => {
    localStorage.setItem("ai_study_companion_growth_points", growthPoints.toString());
  }, [growthPoints]);

  useEffect(() => {
    localStorage.setItem("ai_study_companion_plant_name", plantName);
  }, [plantName]);

  // Update Quest status locally
  useEffect(() => {
    localStorage.setItem("ai_study_companion_quest_breath", questBreathDone.toString());
  }, [questBreathDone]);

  useEffect(() => {
    localStorage.setItem("ai_study_companion_claimed_quests", JSON.stringify(claimedQuests));
  }, [claimedQuests]);

  // Track completed total focus metrics to grant droplets
  const prevFocusSecondsRef = useRef<number>(progress.totalFocusSeconds);
  useEffect(() => {
    const diff = progress.totalFocusSeconds - prevFocusSecondsRef.current;
    if (diff >= 60) {
      // For every accumulated focus minute, gain water droplets!
      const gainedDrops = Math.floor(diff / 60);
      setWaterDrops((prev) => prev + gainedDrops);
      prevFocusSecondsRef.current = progress.totalFocusSeconds;
    }
  }, [progress.totalFocusSeconds]);

  // 1. Interactive Plant Growth metrics
  const growthStage = useMemo(() => {
    if (growthPoints >= 25) return { stage: 4, name: "Cosmic Wisdom Tree", emoji: "🌳", nextTarget: "Max Level Reached" };
    if (growthPoints >= 15) return { stage: 3, name: "Neon Focus Bloom", emoji: "🌸", nextTarget: "25 pts to Tree" };
    if (growthPoints >= 8) return { stage: 2, name: "Climbing Star Ivy", emoji: "🌿", nextTarget: "15 pts to Bloom" };
    if (growthPoints >= 3) return { stage: 1, name: "Seedling Sprout", emoji: "🌱", nextTarget: "8 pts to Ivy" };
    return { stage: 0, name: "Sleeping Focus Seed", emoji: "🥔", nextTarget: "3 pts to Sprout" };
  }, [growthPoints]);

  // 2. Play Retro Haptic Bell or Bubble pop using browser FM Synthesizer
  const triggerHapticSynthSound = (soundType: "water" | "level_up" | "bell") => {
    try {
      // Ensure audio context is safe
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!ctx) return;
      
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      if (soundType === "water") {
        // High frequency soft bubble sound
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (soundType === "level_up") {
        // Magical upward arpeggio chord of 3 sine tones
        [300, 450, 600].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.3);
          osc.connect(gain);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
        });
      } else if (soundType === "bell") {
        // Warm Rich Tibetan Singing Bowl tone with partial ring frequencies
        const fundamental = 220; // A3 Foundation
        const partials = [1, 2.76, 5.4, 8.1]; // Acoustic bell partial proportions 
        const gains = [0.25, 0.12, 0.06, 0.03];

        partials.forEach((mult, idx) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(fundamental * mult, ctx.currentTime);
          
          const partGain = ctx.createGain();
          partGain.gain.setValueAtTime(gains[idx] * 0.8, ctx.currentTime);
          // Long slow relaxing decay
          partGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
          
          osc.connect(partGain);
          partGain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 3.2);
        });
      }
    } catch (e) {
      console.warn("Audio Synthesizer block blocked by user touch policy:", e);
    }
  };

  // 3. Mindfulness Breathing Logic Loop
  useEffect(() => {
    if (!isBreathing) return;

    let timer: NodeJS.Timeout;

    if (breathingSecsLeft > 0) {
      timer = setTimeout(() => {
        setBreathingSecsLeft((p) => p - 1);
      }, 1000);
    } else {
      // Transition through mindfulness states (Box breathing cycle: Inhale 4s -> Hold 4s -> Exhale 4s)
      if (breathingPhase === "inhale") {
        setBreathingPhase("hold");
        setBreathingSecsLeft(4);
      } else if (breathingPhase === "hold") {
        setBreathingPhase("exhale");
        setBreathingSecsLeft(4);
      } else if (breathingPhase === "exhale") {
        setBreathingPhase("completed");
        setIsBreathing(false);
        // Reward student with 2 rain drops for resting!
        setWaterDrops((prev) => prev + 2);
        setQuestBreathDone(true);
        triggerHapticSynthSound("level_up");
      }
    }

    return () => clearTimeout(timer);
  }, [isBreathing, breathingSecsLeft, breathingPhase]);

  const startBreathingLoop = () => {
    setIsBreathing(true);
    setBreathingPhase("inhale");
    setBreathingSecsLeft(4);
    triggerHapticSynthSound("water");
  };

  // 4. Synthesizer Atmospheric Audio Generator
  const toggleSynthMute = () => {
    if (synthRunning) {
      stopSynthEngine();
    } else {
      startSynthEngine();
    }
  };

  const startSynthEngine = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create primary Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(synthVolume * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);
      synthNodesRef.current.gainNode = masterGain;

      if (synthSound === "binaural") {
        // Binaural 40Hz focus frequencies (deep gamma waves stimulation)
        // 180Hz on Left Channel, 220Hz on Right Channel -> 40Hz offset
        const merger = ctx.createChannelMerger(2);

        const leftOsc = ctx.createOscillator();
        leftOsc.type = "sine";
        leftOsc.frequency.setValueAtTime(180, ctx.currentTime);

        const rightOsc = ctx.createOscillator();
        rightOsc.type = "sine";
        rightOsc.frequency.setValueAtTime(220, ctx.currentTime);

        // Individual gains to map to left/right merger safely
        const leftGain = ctx.createGain();
        leftGain.gain.setValueAtTime(0.5, ctx.currentTime);
        const rightGain = ctx.createGain();
        rightGain.gain.setValueAtTime(0.5, ctx.currentTime);

        leftOsc.connect(leftGain);
        rightOsc.connect(rightGain);

        leftGain.connect(merger, 0, 0); // connect leftGain to channel 0
        rightGain.connect(merger, 0, 1); // connect rightGain to channel 1

        merger.connect(masterGain);

        leftOsc.start();
        rightOsc.start();

        synthNodesRef.current.oscLeft = leftOsc;
        synthNodesRef.current.oscRight = rightOsc;

      } else if (synthSound === "pink_rain") {
        // Generates organic Cozy Rain rain sounds using a script processor or white noise source
        // Falling rain can be simulated with modulated pink noise + lowpass filters
        const bufferSize = 4 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink filter equations
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // normal balance
          b6 = white * 0.115926;
        }

        const whiteNoiseNode = ctx.createBufferSource();
        whiteNoiseNode.buffer = noiseBuffer;
        whiteNoiseNode.loop = true;

        // Biquad filter to make rain sound softer and warm
        const filterNode = ctx.createBiquadFilter();
        filterNode.type = "lowpass";
        filterNode.frequency.setValueAtTime(800, ctx.currentTime);

        whiteNoiseNode.connect(filterNode);
        filterNode.connect(masterGain);
        whiteNoiseNode.start();

        synthNodesRef.current.noiseNode = whiteNoiseNode as any;
        synthNodesRef.current.filterNode = filterNode;

      } else if (synthSound === "cosmic_drone") {
        // Deep Space drone sound synthesizer (detuned triangle oscillators + low frequency filter LFO sweep)
        const osc1 = ctx.createOscillator();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(65.4, ctx.currentTime); // C2

        const osc2 = ctx.createOscillator();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(65.8, ctx.currentTime); // slightly detuned

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200, ctx.currentTime);
        filter.Q.setValueAtTime(3.5, ctx.currentTime);

        // LFO to sweep filter frequency
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // very slow 8-second cycle

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(80, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency); // modulating cut-off frequency

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start();
        osc2.start();
        lfo.start();

        synthNodesRef.current.oscLeft = osc1;
        synthNodesRef.current.oscRight = osc2;
        synthNodesRef.current.noiseNode = lfo as any; // reference placeholder to clear
        synthNodesRef.current.filterNode = filter;
      }

      setSynthRunning(true);
    } catch (e) {
      console.error("Synthesizer failed to start. Browser policies block autoplay:", e);
    }
  };

  const stopSynthEngine = () => {
    try {
      const nodes = synthNodesRef.current;
      if (nodes.oscLeft) {
        nodes.oscLeft.stop();
        nodes.oscLeft.disconnect();
        nodes.oscLeft = null;
      }
      if (nodes.oscRight) {
        nodes.oscRight.stop();
        nodes.oscRight.disconnect();
        nodes.oscRight = null;
      }
      if (nodes.noiseNode) {
        try {
          (nodes.noiseNode as any).stop();
        } catch {}
        nodes.noiseNode.disconnect();
        nodes.noiseNode = null;
      }
      if (nodes.filterNode) {
        nodes.filterNode.disconnect();
        nodes.filterNode = null;
      }
      if (nodes.gainNode) {
        nodes.gainNode.disconnect();
        nodes.gainNode = null;
      }
      setSynthRunning(false);
    } catch (e) {
      console.warn(e);
    }
  };

  // Change soundscape node on active switches
  const handleSelectSoundType = (type: "binaural" | "pink_rain" | "cosmic_drone") => {
    setSynthSound(type);
    if (synthRunning) {
      stopSynthEngine();
      setTimeout(() => {
        // Quick hot swap
        setSynthSound(type);
        const originalVal = synthSound;
        // set immediately 
        synthSound === type; 
        startSynthEngine();
      }, 50);
    }
  };

  // Update real-time frequency volume gains
  useEffect(() => {
    if (synthRunning && synthNodesRef.current.gainNode && audioContextRef.current) {
      synthNodesRef.current.gainNode.gain.setValueAtTime(
        synthVolume * 0.4, 
        audioContextRef.current.currentTime
      );
    }
  }, [synthVolume, synthRunning]);

  // Cleanup synthesizer audio nodes on unmount
  useEffect(() => {
    return () => {
      stopSynthEngine();
    };
  }, []);

  // Compute daily quest logs
  const questWateredSprout = growthPoints > 0;
  const questJournalLogged = journalCount > 0;

  const handleClaimQuestXp = (questId: string) => {
    if (claimedQuests.includes(questId)) return;
    
    // Add 50 XP
    if (onAddXp) {
      onAddXp(50);
    }

    setClaimedQuests((prev) => [...prev, questId]);
    triggerHapticSynthSound("level_up");
  };

  const handleWaterSprout = () => {
    if (waterDrops < 3) return;
    const oldStage = growthStage.stage;
    const nextPoints = growthPoints + 1;
    
    setWaterDrops((prev) => prev - 3);
    setGrowthPoints(nextPoints);
    triggerHapticSynthSound("water");

    // Check level up stage
    const pointsToDoubleCheck = nextPoints;
    let nextStageNum = 0;
    if (pointsToDoubleCheck >= 25) nextStageNum = 4;
    else if (pointsToDoubleCheck >= 15) nextStageNum = 3;
    else if (pointsToDoubleCheck >= 8) nextStageNum = 2;
    else if (pointsToDoubleCheck >= 3) nextStageNum = 1;

    if (nextStageNum > oldStage) {
      triggerHapticSynthSound("level_up");
    }
  };

  const handleSavePlantName = () => {
    if (tempName.trim()) {
      setPlantName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Title block with sparkles */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-zinc-200/50 dark:border-zinc-800/40 pb-3">
        {/* Left column - Oasis Pill */}
        <div className="flex items-center justify-start">
          <div className="p-1 px-2 sm:px-2.5 bg-amber-500/10 text-amber-500 rounded-2xl text-[10px] sm:text-xs font-black uppercase flex items-center gap-1 font-mono shrink-0 select-none">
            💡 Oasis
          </div>
        </div>

        {/* Center column - Centered Title */}
        <div className="text-center px-1 shrink-0">
          <h3 className="font-extrabold text-[11px] sm:text-xs md:text-sm text-zinc-950 dark:text-white leading-tight block">
            Study Oasis
          </h3>
        </div>

        {/* Right column - Balanced Drops Pill */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 px-2 sm:px-2.5 rounded-2xl text-zinc-900 dark:text-zinc-100 font-black text-[10px] sm:text-xs uppercase font-mono shrink-0 select-none">
            <Droplet className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-zinc-900 dark:text-zinc-100" /> {waterDrops} Drops
          </div>
        </div>
      </div>

      {/* Tabs list inside local row */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-ios-light-bg dark:bg-ios-dark-bg border border-zinc-200/50 dark:border-zinc-950 rounded-xl">
        <button
          onClick={() => setActiveTab("garden")}
          className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all uppercase flex items-center justify-center gap-1 ${
            activeTab === "garden"
              ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <Sprout className="w-3 h-3 shrink-0" /> Garden
        </button>

        <button
          onClick={() => setActiveTab("synth")}
          className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all uppercase flex items-center justify-center gap-1 ${
            activeTab === "synth"
              ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <Wind className="w-3 h-3 shrink-0" /> Ambient
        </button>

        <button
          onClick={() => setActiveTab("quests")}
          className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all uppercase flex items-center justify-center gap-1 ${
            activeTab === "quests"
              ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        >
          <CheckSquare className="w-3 h-3 shrink-0" /> Quests
        </button>
      </div>

      {/* Tab 1: Sprout Garden */}
      {activeTab === "garden" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center bg-ios-light-bg dark:bg-zinc-950 p-4.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/60 relative overflow-hidden group min-h-[170px]">
            {/* Visual Sparkle decoration */}
            <span className="absolute top-2.5 right-2.5 text-xs text-amber-400 group-hover:scale-125 transition-transform animate-pulse">✨</span>

            {/* Large Plant Emoji Container */}
            <div className="relative flex items-center justify-center w-20 h-20 bg-emerald-500/10 dark:bg-emerald-950/20 rounded-full border border-emerald-500/20 mb-3 select-none">
              <span className="text-4xl animate-bounce" style={{ animationDuration: "3.5s" }}>
                {growthStage.emoji}
              </span>
              <span className="absolute -bottom-1 -right-1 bg-black dark:bg-white text-white dark:text-black text-[9px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center shadow">
                {growthStage.stage}
              </span>
            </div>

            {/* Editable Companion Name Tag */}
            {isEditingName ? (
              <div className="flex items-center gap-1.5 max-w-full font-sans">
                <input
                  type="text"
                  maxLength={16}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Companion Name"
                  className="px-2 py-0.5 max-w-[120px] text-xs font-extrabold text-black dark:text-white bg-white dark:bg-zinc-900 border border-black dark:border-white rounded focus:outline-none"
                  autoFocus
                />
                <button 
                  onClick={handleSavePlantName}
                  className="p-1 text-emerald-500 hover:opacity-80"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black text-black dark:text-white font-sans max-w-[140px] truncate">
                  {plantName}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setTempName(plantName);
                    setIsEditingName(true);
                  }}
                  className="p-0.5 text-ios-secondary-text hover:text-black dark:hover:text-white transition-colors"
                  title="Rename companion plant"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Subtitle Species indicator */}
            <span className="text-[10px] text-ios-secondary-text font-semibold uppercase tracking-wider block mt-0.5 font-sans">
              {growthStage.name}
            </span>

            {/* Growth bar container */}
            <div className="w-full mt-3.5 space-y-1">
              <div className="flex justify-between text-[8.5px] font-bold text-ios-secondary-text font-serif">
                <span>Growth Progress: {growthPoints} XP</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-sans">{growthStage.nextTarget}</span>
              </div>
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${Math.min((growthPoints / 25) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Cultivate interactive buttons */}
          <div className="grid grid-cols-2 gap-2 pb-0.5">
            {/* Action 1: Water plant */}
            <button
              onClick={handleWaterSprout}
              disabled={waterDrops < 3 || growthStage.stage >= 4}
              className="py-2 bg-emerald-500 dark:bg-emerald-600 hover:opacity-95 text-white font-bold text-[9.5px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 border border-emerald-600 dark:border-emerald-700 shadow-sm font-sans"
            >
              <Droplet className="w-3 h-3 fill-white shrink-0" /> Water (-3 Drops)
            </button>

            {/* Action 2: Mindfulness Breathing trigger */}
            <button
              onClick={startBreathingLoop}
              disabled={isBreathing}
              className="py-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold text-[9.5px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-75 flex items-center justify-center gap-1 shadow-sm font-sans"
            >
              <Compass className="w-3 h-3 shrink-0" /> Rest & Breathe
            </button>
          </div>

          {/* Breathing Loop visual overlays */}
          {isBreathing ? (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-center space-y-4 font-sans animate-fade-in relative z-20">
              <div className="flex items-center justify-center gap-1 text-xs text-black dark:text-white font-black uppercase">
                <Heart className="w-3.5 h-3.5 text-black dark:text-white animate-pulse" /> Respiration Rest Period
              </div>

              {/* Dynamic pulse circle */}
              <div className="flex items-center justify-center py-2 h-24">
                <div 
                  className={`w-20 h-20 rounded-full border-4 border-black/30 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-mono text-xl font-black shadow-lg transition-all duration-[4000ms] ${
                    breathingPhase === "inhale" ? "scale-[1.3] bg-black dark:bg-white" :
                    breathingPhase === "hold" ? "scale-[1.3] bg-amber-500 border-amber-500/30 text-white" :
                    "scale-[0.8] bg-zinc-600 border-zinc-600/30 text-white"
                  }`}
                >
                  {breathingSecsLeft}s
                </div>
              </div>

              <div>
                <p className="text-xs text-black dark:text-zinc-100 font-extrabold text-center tracking-wide uppercase font-sans">
                  {breathingPhase === "inhale" && "🌬️ Breathe In Slowly..."}
                  {breathingPhase === "hold" && "⏸️ Hold Air and Center..."}
                  {breathingPhase === "exhale" && "💨 Exhale Softly..."}
                </p>
                <span className="text-[10px] text-ios-secondary-text mt-1 block">
                  Follow the expanding circle. Rest eyes, breathe, and gather +2 💧 droplets!
                </span>
              </div>
            </div>
          ) : (
            questBreathDone && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold text-center font-sans">
                ✓ Mindfulness rest interval logged! Water droplets allocated.
              </p>
            )
          )}
        </div>
      )}

      {/* Tab 2: Synthesizer Space */}
      {activeTab === "synth" && (
        <div className="space-y-4 bg-ios-light-bg dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/60 font-sans">
          
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/40 dark:border-zinc-900/40">
            <div>
              <span className="text-[10px] text-ios-secondary-text uppercase tracking-wider block font-bold">Soundscape Source</span>
              <strong className="text-xs text-black dark:text-white uppercase font-sans">Active Synthesis Mixer</strong>
            </div>

            {/* Main Synth trigger */}
            <button
              onClick={toggleSynthMute}
              className={`p-2 rounded-xl transition-all border flex items-center justify-center gap-1.5 font-bold text-xs ${
                synthRunning
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-100"
              }`}
            >
              {synthRunning ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 animate-pulse" /> Stop Ambience
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Synthesize
                </>
              )}
            </button>
          </div>

          {/* Sound choice list */}
          <div className="space-y-2.5">
            {/* Wave 1: Brain stimulation */}
            <button
              onClick={() => handleSelectSoundType("binaural")}
              className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                synthSound === "binaural"
                  ? "border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                  : "border-zinc-200/60 dark:border-zinc-900 bg-white dark:bg-zinc-90 w-full"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black">⚡ Neural 40Hz Binaural Beats</span>
                {synthRunning && synthSound === "binaural" && <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-900 dark:text-zinc-100 animate-pulse">Running</span>}
              </div>
              <p className="text-[10px] sm:text-[11px] text-ios-secondary-text mt-0.5 leading-normal">
                Detuned structural frequencies to optimize deep concentration and memory.
              </p>
            </button>

            {/* Wave 2: Rain cracking noise */}
            <button
              onClick={() => handleSelectSoundType("pink_rain")}
              className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                synthSound === "pink_rain"
                  ? "border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                  : "border-zinc-200/60 dark:border-zinc-900 bg-white dark:bg-zinc-90 w-full"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black">🌧️ Synthetic Cozy Rain crackle</span>
                {synthRunning && synthSound === "pink_rain" && <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-900 dark:text-zinc-100 animate-pulse">Active</span>}
              </div>
              <p className="text-[10px] sm:text-[11px] text-ios-secondary-text mt-0.5 leading-normal">
                Modulated bandpassed pink noise to simulate a remote soft rainfall.
              </p>
            </button>

            {/* Wave 3: Space Drone */}
            <button
              onClick={() => handleSelectSoundType("cosmic_drone")}
              className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                synthSound === "cosmic_drone"
                  ? "border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                  : "border-zinc-200/60 dark:border-zinc-900 bg-white dark:bg-zinc-90 w-full"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black">🪐 Celestial Cosmic Focus Drone</span>
                {synthRunning && synthSound === "cosmic_drone" && <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-900 dark:text-zinc-100 animate-pulse">Active</span>}
              </div>
              <p className="text-[10px] sm:text-[11px] text-ios-secondary-text mt-0.5 leading-normal">
                Detuned sweeping oscillators to mask high-frequency distractions.
              </p>
            </button>
          </div>

          {/* Volume parameter slider */}
          <div className="space-y-1 pt-1.5">
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold text-ios-secondary-text uppercase tracking-wide">
              <span>Ambience Gain Level:</span>
              <span className="font-mono">{Math.round(synthVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={synthVolume}
              onChange={(e) => setSynthVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-black dark:accent-white focus:outline-none"
            />
          </div>

          {/* Interactive Gong resonance button */}
          <div className="pt-2 border-t border-zinc-200/40 dark:border-zinc-900/40">
            <button
              onClick={() => triggerHapticSynthSound("bell")}
              className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-amber-500/20 active:scale-95 transition-all"
            >
              🛎️ Ring Tibetan Singing Chalice
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Quests Deck */}
      {activeTab === "quests" && (
        <div className="space-y-3 font-sans">
          <p className="text-[11px] sm:text-xs text-ios-secondary-text leading-normal">
            Gain extra achievements! Complete daily learning milestones and unlock bonus XP to accelerate level gains.
          </p>

          <div className="space-y-2 bg-ios-light-bg dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/60">
            {/* Quest 1 */}
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-zinc-200/40 dark:border-zinc-900/45">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black text-zinc-900 dark:text-zinc-100 block uppercase">Mindfulness Rest</span>
                <h4 className="text-xs font-black text-black dark:text-white mt-0.5">🌿 Breath & Hydrate</h4>
                <p className="text-[10px] sm:text-[11px] text-ios-secondary-text leading-tight mt-0.5">Complete a 12-second Mindfulness box breathing session</p>
              </div>

              {questBreathDone ? (
                claimedQuests.includes("breath_quest") ? (
                  <span className="text-[10px] text-emerald-500 font-extrabold shrink-0 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Claimed
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaimQuestXp("breath_quest")}
                    className="px-2.5 py-1.5 bg-amber-500 hover:opacity-90 text-white text-[10px] font-black rounded-lg shrink-0 flex items-center gap-1 shadow"
                  >
                    <Gift className="w-3.5 h-3.5 text-white" /> Claim +50
                  </button>
                )
              ) : (
                <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg shrink-0">Incomplete</span>
              )}
            </div>

            {/* Quest 2 */}
            <div className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-200/40 dark:border-zinc-900/45">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black text-zinc-900 dark:text-zinc-100 block uppercase">Oasis Cultivation</span>
                <h4 className="text-xs font-black text-black dark:text-white mt-0.5">🌱 Sprout Keeper</h4>
                <p className="text-[10px] sm:text-[11px] text-ios-secondary-text leading-tight mt-0.5">Water your focus seedling to advance growth points</p>
              </div>

              {questWateredSprout ? (
                claimedQuests.includes("water_quest") ? (
                  <span className="text-[10px] text-emerald-500 font-extrabold shrink-0 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Claimed
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaimQuestXp("water_quest")}
                    className="px-2.5 py-1.5 bg-amber-500 hover:opacity-90 text-white text-[10px] font-black rounded-lg shrink-0 flex items-center gap-1 shadow"
                  >
                    <Gift className="w-3.5 h-3.5 text-white" /> Claim +50
                  </button>
                )
              ) : (
                <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg shrink-0">Incomplete</span>
              )}
            </div>

            {/* Quest 3 */}
            <div className="flex items-center justify-between gap-3 pt-2.5">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black text-zinc-900 dark:text-zinc-100 block uppercase">Cognitive Reflection</span>
                <h4 className="text-xs font-black text-black dark:text-white mt-0.5">📝 Thoughtful Scribe</h4>
                <p className="text-[10px] sm:text-[11px] text-ios-secondary-text leading-tight mt-0.5">Log at least one Study Reflection Note in your Journal</p>
              </div>

              {questJournalLogged ? (
                claimedQuests.includes("journal_quest") ? (
                  <span className="text-[10px] text-emerald-500 font-extrabold shrink-0 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Claimed
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaimQuestXp("journal_quest")}
                    className="px-2.5 py-1.5 bg-amber-500 hover:opacity-90 text-white text-[10px] font-black rounded-lg shrink-0 flex items-center gap-1 shadow"
                  >
                    <Gift className="w-3.5 h-3.5 text-white" /> Claim +50
                  </button>
                )
              ) : (
                <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg shrink-0">Incomplete</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
