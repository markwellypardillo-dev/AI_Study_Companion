import React, { useState } from "react";
import {
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  HelpCircle,
  Plus,
  Info,
  Keyboard
} from "lucide-react";
import { Track } from "../types";

interface FocusMusicPlayerProps {
  tracks: Track[];
  selectedTrackId: string;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  synthType: "40hz" | "pink" | null;
  audioError: string | null;
  onSelectTrack: (id: string, updatedTracks?: Track[]) => void;
  onTogglePlay: () => void;
  onSetVolume: (v: number) => void;
  onSetIsMuted: (m: boolean) => void;
  onAddCustomTrack: (track: Track) => void;
  onRemoveCustomTrack: (id: string) => void;
  
  // Sleep Timer Enhancements
  sleepTimerMinutes: number | null;
  sleepTimerSecondsLeft: number;
  onSetSleepTimerMinutes: (min: number | null) => void;
}

export default function FocusMusicPlayer({
  tracks,
  selectedTrackId,
  isPlaying,
  volume,
  isMuted,
  synthType,
  audioError,
  onSelectTrack,
  onTogglePlay,
  onSetVolume,
  onSetIsMuted,
  onAddCustomTrack,
  onRemoveCustomTrack,
  sleepTimerMinutes,
  sleepTimerSecondsLeft,
  onSetSleepTimerMinutes
}: FocusMusicPlayerProps) {
  const [customTrackName, setCustomTrackName] = useState<string>("");
  const [customTrackUrl, setCustomTrackUrl] = useState<string>("");
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);
  const [showHostingGuide, setShowHostingGuide] = useState<boolean>(false);
  const [showHotkeysGuide, setShowHotkeysGuide] = useState<boolean>(false);

  const [activePlayer, setActivePlayer] = useState<"internal" | "spotify">(() => (localStorage.getItem("ai_study_player_type") as "internal" | "spotify") || "internal");
  const [spotifyInput, setSpotifyInput] = useState("");
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState(() => localStorage.getItem("ai_study_spotify_embed") || "");
  const [showSpotifyHelp, setShowSpotifyHelp] = useState<boolean>(false);

  const switchPlayer = (mode: "internal" | "spotify") => {
    setActivePlayer(mode);
    localStorage.setItem("ai_study_player_type", mode);
    if (mode === "spotify" && isPlaying) {
      onTogglePlay(); // Pause internal music
    }
  };

  const parseSpotifyUrlToEmbed = (url: string) => {
    if (!url) return null;
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname !== "open.spotify.com") return null;
      
      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const type = parts[0];
        const id = parts[1];
        if (["track", "album", "playlist", "episode", "show"].includes(type)) {
          return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
        }
      }
    } catch (e) {
      // Ignore valid parsing errors on text input
    }
    return null;
  };

  const handleSpotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const embedUrl = parseSpotifyUrlToEmbed(spotifyInput.trim());
    if (embedUrl) {
      setSpotifyEmbedUrl(embedUrl);
      localStorage.setItem("ai_study_spotify_embed", embedUrl);
      setSpotifyInput("");
    } else {
      alert("Invalid Spotify URL. Please paste a valid link like https://open.spotify.com/playlist/... ");
    }
  };

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  const handleAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTrackName || !customTrackUrl) return;

    let formattedUrl = customTrackUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const newTrack: Track = {
      id: "custom-" + Date.now(),
      name: customTrackName,
      type: "stream",
      src: formattedUrl,
      description: "Custom stream track linked externally."
    };

    onAddCustomTrack(newTrack);
    setCustomTrackName("");
    setCustomTrackUrl("");
    setShowAddCustom(false);
  };

  const handleRemoveCustomTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveCustomTrack(id);
  };

  return (
    <div id="focus-music-card" className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm transition-all duration-300">
      
      <div className="flex items-center justify-between mb-4 border-b border-zinc-200/50 dark:border-zinc-800 pb-3">
        <h4 className="text-xs font-black text-black dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
          <Music className="w-4 h-4 text-brand-indigo shrink-0" />
          Focus Soundscapes
        </h4>

        <div className="flex items-center gap-1.5">
          {/* Keyboard shortcuts tracker */}
          <button
            onClick={() => setShowHotkeysGuide(!showHotkeysGuide)}
            className={`p-1.5 rounded-lg transition-all border ${
              showHotkeysGuide
                ? "bg-brand-indigo/15 text-brand-indigo border-brand-indigo/30"
                : "text-ios-secondary-text hover:text-black dark:hover:text-white border-transparent"
            }`}
            title="Interactive tactile hotkeys desk"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Help toggle */}
          <button
            onClick={() => {
              setShowHostingGuide(!showHostingGuide);
              setShowHotkeysGuide(false);
            }}
            className={`p-1.5 rounded-lg transition-all border ${
              showHostingGuide
                ? "bg-brand-indigo/15 text-brand-indigo border-brand-indigo/30"
                : "text-ios-secondary-text hover:text-black dark:hover:text-white border-transparent"
            }`}
            title="How to get free links guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-xl">
        <button
          onClick={() => switchPlayer("internal")}
          className={`flex-1 text-xs py-1.5 rounded-lg font-bold transition-all ${
            activePlayer === "internal"
              ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm"
              : "text-ios-secondary-text hover:text-black dark:hover:text-white"
          }`}
        >
          App Player
        </button>
        <button
          onClick={() => switchPlayer("spotify")}
          className={`flex-1 text-xs py-1.5 rounded-lg font-bold transition-all ${
            activePlayer === "spotify"
              ? "bg-[#1DB954] text-white shadow-sm"
              : "text-ios-secondary-text hover:text-black dark:hover:text-white"
          }`}
        >
          Spotify
        </button>
      </div>

      {activePlayer === "spotify" ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <form onSubmit={handleSpotifySubmit} className="mb-4">
            <label className="text-[10px] font-extrabold text-ios-secondary-text uppercase tracking-wider block mb-1.5 pl-0.5">
              Connect Spotify Playlist/Track
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={spotifyInput}
                onChange={(e) => setSpotifyInput(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="flex-1 text-xs px-3 py-2 bg-ios-light-bg dark:bg-ios-dark-bg border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-[#1DB954]/50 focus:ring-1 focus:ring-[#1DB954]/50 text-black dark:text-white placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={!spotifyInput.trim()}
                className="px-3 py-2 bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Embed
              </button>
            </div>
          </form>

          {spotifyEmbedUrl ? (
            <div className="flex flex-col gap-2">
              <div className="rounded-2xl overflow-hidden min-h-[352px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative group">
                <iframe
                  src={spotifyEmbedUrl}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Spotify Embed View"
                  className="block"
                ></iframe>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowSpotifyHelp(!showSpotifyHelp)}
                  className="text-[10px] w-fit sm:text-[11px] font-semibold text-blue-500/80 hover:text-blue-500 flex items-center gap-1 transition-colors bg-blue-500/5 px-2 py-1 rounded-full"
                >
                  <Info className="w-3.5 h-3.5" />
                  Spotify Preview Issues?
                </button>
                {showSpotifyHelp && (
                  <div className="text-[10px] text-ios-secondary-text leading-tight bg-blue-500/10 text-blue-500 dark:text-blue-400 p-2 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                    <strong>Seeing a "Preview" badge?</strong> Spotify only plays full tracks if you're logged in. Because this app is in a preview window, your browser might be blocking Spotify's login cookie. To hear the full songs, click the "Open in new tab" icon (top right of the AI Studio window), and ensure you are logged into Spotify in your browser.
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  setSpotifyEmbedUrl("");
                  localStorage.removeItem("ai_study_spotify_embed");
                }}
                className="text-xs text-ios-secondary-text hover:text-black dark:hover:text-white mt-1 underline"
              >
                Clear Spotify Link
              </button>
            </div>
          ) : (
            <div className="bg-ios-light-bg dark:bg-ios-dark-bg border border-zinc-200/60 dark:border-zinc-900 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[352px] font-sans border-dashed">
              <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 text-[#1DB954] flex items-center justify-center mb-3">
                <Music className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-black dark:text-white mb-2">Connect Spotify</h5>
              <p className="text-xs text-ios-secondary-text max-w-[200px] leading-relaxed">
                Paste a public Spotify playlist, album, or track URL above to listen while you focus.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Pulsing Visual Wave Area */}
      <div className="bg-ios-light-bg dark:bg-ios-dark-bg border border-zinc-200/60 dark:border-zinc-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden h-28 shrink-0 mb-4 font-sans">
        {/* Dynamic Wave Simulator */}
        {isPlaying ? (
          <div className="flex items-end gap-1.5 h-10 mb-2">
            {[...Array(9)].map((_, i) => {
              const heights = ["h-4", "h-7", "h-9", "h-6", "h-8", "h-10", "h-5", "h-7", "h-4"];
              const durations = ["duration-[0.6s]", "duration-[0.45s]", "duration-[0.5s]", "duration-[0.7s]", "duration-[0.4s]", "duration-[0.55s]", "duration-[0.65s]", "duration-[0.5s]", "duration-[0.45s]"];
              return (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-brand-indigo animate-pulse ${heights[i]} ${durations[i]}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-1 mb-2">
            {[...Array(9)].map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            ))}
          </div>
        )}

        <h5 className="text-xs font-bold text-black dark:text-white mt-1.5 uppercase px-2 py-0.5 rounded leading-tight line-clamp-1">
          {selectedTrack.name}
        </h5>
        <p className="text-[10px] text-ios-secondary-text max-w-xs mt-1 leading-tight line-clamp-1">
          {selectedTrack.description}
        </p>

        {synthType && (
          <span className="absolute top-2 right-2 text-[8px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">
            ⚡ Web-Synth Live
          </span>
        )}
      </div>

      {/* Control Actions (Play, Volume, Mute) */}
      <div className="flex flex-col gap-3.5 px-1 py-1.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Main Toggle Button */}
          <button
            onClick={onTogglePlay}
            className={`px-5 py-3 rounded-2xl font-black text-xs text-white shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all w-28 shrink-0 ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-brand-indigo hover:bg-brand-indigo/90"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Play
              </>
            )}
          </button>

          {/* Volume bars slider */}
          <div className="flex items-center gap-2 flex-grow">
            <button
              onClick={() => onSetIsMuted(!isMuted)}
              className="p-1 rounded text-ios-secondary-text hover:text-black dark:hover:text-white shadow-none bg-transparent border-none"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-brand-indigo" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className="w-full accent-brand-indigo h-1 rounded-full cursor-pointer bg-zinc-250 dark:bg-zinc-800"
              title="Adjust Volume"
            />
          </div>
        </div>

        {/* Display streaming link loading issues if any */}
        {audioError && (
          <div className="p-2 text-[10px] bg-red-500/15 text-red-600 rounded-xl leading-normal border border-red-500/20">
            {audioError}
          </div>
        )}
      </div>

      {/* Track Selection list */}
      <div className="mt-4 space-y-1.5">
        <span className="text-[10px] font-extrabold text-ios-secondary-text uppercase tracking-wider block mb-1">
          Select Sound Channel
        </span>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {tracks.map((track) => (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer border select-none transition-all ${
                selectedTrackId === track.id
                  ? "bg-brand-indigo/10 border-brand-indigo text-brand-indigo font-black"
                  : "bg-ios-light-bg hover:bg-zinc-100/80 dark:bg-ios-dark-bg dark:hover:bg-zinc-900/80 border-zinc-200/50 dark:border-zinc-900 text-black dark:text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden font-sans">
                <span className="text-sm shrink-0">
                  {track.id.includes("40hz") ? "🧠" : track.id === "pink-noise" ? "🌊" : "🎵"}
                </span>
                <span className="truncate leading-tight block">{track.name}</span>
              </div>

              {/* Remove button for user custom tracks */}
              {track.id.startsWith("custom-") ? (
                <button
                  onClick={(e) => handleRemoveCustomTrack(track.id, e)}
                  className="p-1 text-xxs font-bold text-red-500 hover:text-red-700 bg-red-400/10 px-1.5 rounded-lg border-none"
                  title="Delete Track link"
                >
                  Clear
                </button>
              ) : (
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest px-1 py-0.5">
                  {track.type === "synth" ? "Local" : "Cloud"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Stream adding trigger panel */}
      <div className="mt-4">
        {!showAddCustom ? (
          <button
            onClick={() => setShowAddCustom(true)}
            className="w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-800 text-ios-secondary-text hover:text-black dark:hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 bg-ios-light-bg/50 dark:bg-ios-dark-bg/50 hover:bg-zinc-200/50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom URL
          </button>
        ) : (
          <form
            onSubmit={handleAddCustomTrack}
            className="bg-ios-light-bg dark:bg-ios-dark-bg p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 font-sans text-left"
          >
            <h5 className="text-[11px] font-black uppercase text-black dark:text-white font-sans">
              Link Your Focus Music Track
            </h5>
            
            <div className="space-y-2">
              <input
                type="text"
                required
                placeholder="Track Name (e.g. My Study Playlist)"
                value={customTrackName}
                onChange={(e) => setCustomTrackName(e.target.value)}
                className="w-full bg-ios-light-secondary dark:bg-ios-dark-secondary text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
              />
              <input
                type="text"
                required
                placeholder="Direct MP3 Link (https://example.com/audio.mp3)"
                value={customTrackUrl}
                onChange={(e) => setCustomTrackUrl(e.target.value)}
                className="w-full bg-ios-light-secondary dark:bg-ios-dark-secondary text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="px-3 py-1.5 text-xxs text-ios-secondary-text hover:text-black dark:hover:text-white font-semibold border-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xxs text-white bg-brand-indigo rounded-lg font-bold border-none"
              >
                Save Channel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sleep Timer Section */}
      <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800 space-y-1.5 font-sans scroll-smooth">
        <span className="text-[10px] font-extrabold text-ios-secondary-text uppercase tracking-wider block">
          Music Sleep Snooze Timer
        </span>
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            {([null, 10, 25, 45] as const).map((mins) => (
              <button
                key={mins === null ? "off" : mins}
                type="button"
                onClick={() => onSetSleepTimerMinutes(mins)}
                className={`px-2.5 py-1 text-xxs font-black rounded-lg transition-all border ${
                  sleepTimerMinutes === mins
                    ? "bg-brand-indigo border-brand-indigo text-white shadow-sm"
                    : "bg-ios-light-bg dark:bg-ios-dark-bg border-zinc-200/50 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                {mins === null ? "Off" : `${mins}m`}
              </button>
            ))}
          </div>
          
          {sleepTimerMinutes !== null && isPlaying && (
            <span className="text-[10px] font-mono text-brand-indigo font-bold bg-brand-indigo/10 px-2 py-0.5 rounded-lg animate-pulse shrink-0">
              💤 {Math.floor(sleepTimerSecondsLeft / 60)}:{(sleepTimerSecondsLeft % 60).toString().padStart(2, "0")} left
            </span>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts visual guide */}
      {showHotkeysGuide && (
        <div className="mt-4 bg-brand-indigo/5 border border-brand-indigo/15 rounded-2xl p-4 space-y-3.5 text-xs text-black dark:text-zinc-200 select-none text-left font-sans">
          <div className="flex items-center gap-1.5 border-b border-brand-indigo/10 pb-1.5">
            <Keyboard className="w-4 h-4 text-brand-indigo" />
            <h4 className="font-extrabold text-brand-indigo">Interactive Study Tactile Hotkeys</h4>
          </div>

          <p className="text-[10px] text-ios-secondary-text leading-snug">
            Trigger actions globally from anywhere in the app! Keep your hands on the keyboard and remain hyper-focused.
          </p>

          <div className="grid grid-cols-1 gap-2 text-[10px]">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-200/30 dark:border-zinc-800">
              <span className="text-ios-secondary-text">Play/Pause focus music:</span>
              <kbd className="px-2 py-0.5 font-bold font-mono text-[10px] bg-white dark:bg-zinc-800 border border-zinc-305 dark:border-zinc-700 rounded shadow-xs text-black dark:text-white uppercase">K</kbd>
            </div>
            
            <div className="flex items-center justify-between pb-1 border-b border-zinc-200/30 dark:border-zinc-800">
              <span className="text-ios-secondary-text">Play/Pause Pomodoro study countdown:</span>
              <kbd className="px-2 py-0.5 font-bold font-mono text-[10px] bg-white dark:bg-zinc-800 border border-zinc-305 dark:border-zinc-700 rounded shadow-xs text-black dark:text-white uppercase">P</kbd>
            </div>

            <div className="flex items-center justify-between pb-1 border-b border-zinc-200/30 dark:border-zinc-800">
              <span className="text-ios-secondary-text">Mute/Unmute sound volume:</span>
              <kbd className="px-2 py-0.5 font-bold font-mono text-[10px] bg-white dark:bg-zinc-800 border border-zinc-305 dark:border-zinc-700 rounded shadow-xs text-black dark:text-white uppercase">V</kbd>
            </div>

            <div className="flex items-center justify-between pb-1 border-b border-zinc-200/30 dark:border-zinc-800">
              <span className="text-ios-secondary-text">Switch to previous track:</span>
              <kbd className="px-2 py-0.5 font-bold font-mono text-[10px] bg-white dark:bg-zinc-800 border border-zinc-305 dark:border-zinc-700 rounded shadow-xs text-black dark:text-white uppercase">[</kbd>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ios-secondary-text">Switch to next focus track:</span>
              <kbd className="px-2 py-0.5 font-bold font-mono text-[10px] bg-white dark:bg-zinc-800 border border-zinc-305 dark:border-zinc-700 rounded shadow-xs text-black dark:text-white uppercase">]</kbd>
            </div>
          </div>
        </div>
      )}

      {/* Free Hosting Guide modal accordion */}
      {showHostingGuide && (
        <div className="mt-4 bg-brand-indigo/5 border border-brand-indigo/15 rounded-2xl p-4 space-y-3 text-xs leading-relaxed text-black dark:text-zinc-200 select-text text-left font-sans">
          <div className="flex items-center gap-1.5 border-b border-brand-indigo/10 pb-1.5">
            <Info className="w-4 h-4 text-brand-indigo" />
            <h4 className="font-extrabold text-brand-indigo">Direct 100% Free Hosting Guide</h4>
          </div>
          
          <p className="text-[11px] text-ios-secondary-text leading-snug">
            To use a custom focus track in this player, you need a <strong>Direct Link / Raw Stream URL</strong> that ends in <code>.mp3</code> or <code>.wav</code>. You can get these 100% free using these platforms:
          </p>

          <div className="space-y-2.5 pt-1 text-[11px]">
            {/* Guide 1: Github */}
            <div>
              <h5 className="font-bold flex items-center gap-1 text-black dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
                1. GitHub Pages / Repos (Highly Recommended)
              </h5>
              <p className="text-ios-secondary-text mt-0.5 leading-normal pl-3">
                Upload your MP3 to a public GitHub repo. Copy its URL, then click "Raw" — or change the URL to starts with <code>https://raw.githubusercontent.com/...</code>. These files load instantly with CORS support.
              </p>
            </div>

            {/* Guide 2: Archive.org */}
            <div>
              <h5 className="font-bold flex items-center gap-1 text-black dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
                2. Internet Archive (Archive.org)
              </h5>
              <p className="text-ios-secondary-text mt-0.5 leading-normal pl-3">
                Completely free, unlimited public file storage. Upload any audio files, and Archive.org will automatically host direct links. Under "Download Options" on your page, copy the direct link ending in <code>.mp3</code>.
              </p>
            </div>

            {/* Guide 3: Dropbox */}
            <div>
              <h5 className="font-bold flex items-center gap-1 text-black dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
                3. Dropbox Link Suffix Hack
              </h5>
              <p className="text-ios-secondary-text mt-0.5 leading-normal pl-3">
                Upload your MP3, click "Share" and copy the link. At the very end of the link, change <code>dl=0</code> to <code>raw=1</code>. For example: <code>https://www.dropbox.com/.../file.mp3?raw=1</code>.
              </p>
            </div>

            {/* Guide 4: Google Drive */}
            <div>
              <h5 className="font-bold flex items-center gap-1 text-black dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
                4. Google Drive Link Converter
              </h5>
              <p className="text-ios-secondary-text mt-0.5 leading-normal pl-3">
                Share your file to "Anyone with link". Copy the link, copy its file ID (the long string of letters and numbers), and paste it into this URL pattern: <code>https://docs.google.com/uc?export=download&id=YOUR_FILE_ID</code>.
              </p>
            </div>
          </div>

          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-xl text-[10px] mt-2 font-bold leading-normal">
            💡 Chrome / Safari security blocks raw iframe audio streams from un-secured or non-SSL web layouts. Ensure your links always start with <code>https://</code>!
          </div>
        </div>
      )}
      </div>
      )}

    </div>
  );
}
