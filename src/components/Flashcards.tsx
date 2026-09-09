import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Rotate3d, CheckCircle2, Bookmark, Award, BrainCircuit, XCircle, ArrowRight } from "lucide-react";
import { FlashcardItem } from "../types";
import { triggerConfettiWithSound as confetti } from "../lib/sounds";
import { motion } from "motion/react";

interface FlashcardsProps {
  cards: FlashcardItem[];
  onMasterTerm: () => void;
}

interface SRSRecord {
  nextReviewTurn: number;
  interval: number;
  streak: number;
}

export default function Flashcards({ cards, onMasterTerm }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredIndices, setMasteredIndices] = useState<number[]>([]);
  
  // SRS States
  const [isSrsMode, setIsSrsMode] = useState<boolean>(false);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [srsData, setSrsData] = useState<Record<number, SRSRecord>>({});

  useEffect(() => {
    // Initialize SRS data when cards change
    if (cards && cards.length > 0) {
      const initialSrs: Record<number, SRSRecord> = {};
      cards.forEach((_, idx) => {
        initialSrs[idx] = { nextReviewTurn: 0, interval: 1, streak: 0 };
      });
      setSrsData(initialSrs);
      setCurrentTurn(0);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [cards]);

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center bg-ios-light-secondary dark:bg-ios-dark-secondary rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-ios-secondary-text">
        No flashcards generated yet. Please upload a study document to get started.
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const markMastered = (index: number) => {
    if (!masteredIndices.includes(index)) {
      setMasteredIndices([...masteredIndices, index]);
      onMasterTerm();

      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 }
      });
    }
  };

  // SRS Logic
  const getNextSrsCardIndex = (currentSrsData: Record<number, SRSRecord>, nextTurn: number) => {
    // Find cards that are due
    const dueCards = Object.entries(currentSrsData)
      .filter(([_, data]) => data.nextReviewTurn <= nextTurn && !masteredIndices.includes(Number(_)))
      .map(([idx, _]) => Number(idx));

    if (dueCards.length > 0) {
      // Pick the one that is most overdue
      dueCards.sort((a, b) => currentSrsData[a].nextReviewTurn - currentSrsData[b].nextReviewTurn);
      return dueCards[0];
    }

    // If no cards due, but not all mastered, pick the one with the lowest nextReviewTurn
    const unmastered = Object.entries(currentSrsData)
      .filter(([idx, _]) => !masteredIndices.includes(Number(idx)))
      .map(([idx, _]) => Number(idx));
      
    if (unmastered.length > 0) {
      unmastered.sort((a, b) => currentSrsData[a].nextReviewTurn - currentSrsData[b].nextReviewTurn);
      return unmastered[0];
    }

    return 0; // All mastered
  };

  const handleSrsRating = (rating: 'hard' | 'good' | 'easy') => {
    const nextTurn = currentTurn + 1;
    const currentRecord = srsData[currentIndex] || { nextReviewTurn: 0, interval: 1, streak: 0 };
    
    let newInterval = currentRecord.interval;
    let newStreak = currentRecord.streak;

    if (rating === 'hard') {
      newInterval = 1;
      newStreak = 0;
    } else if (rating === 'good') {
      newInterval = Math.max(2, currentRecord.interval * 2);
      newStreak += 1;
    } else if (rating === 'easy') {
      newInterval = Math.max(4, currentRecord.interval * 3);
      newStreak += 2;
    }

    const nextReviewTurn = nextTurn + newInterval;
    
    const newSrsData = {
      ...srsData,
      [currentIndex]: {
        nextReviewTurn,
        interval: newInterval,
        streak: newStreak
      }
    };

    setSrsData(newSrsData);
    setCurrentTurn(nextTurn);
    
    if (rating === 'easy' || newStreak >= 3) {
      markMastered(currentIndex);
    }

    setIsFlipped(false);
    setTimeout(() => {
      const nextIndex = getNextSrsCardIndex(newSrsData, nextTurn);
      setCurrentIndex(nextIndex);
    }, 150);
  };

  const isMastered = masteredIndices.includes(currentIndex);
  const completionPercentage = ((masteredIndices.length) / cards.length) * 100;

  return (
    <div id="flashcards-view" className="max-w-xl mx-auto flex flex-col items-center py-6 px-4">
      <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white">
            Interactive Flashcards
          </h2>
          <p className="text-xs text-ios-secondary-text mt-0.5">
            {isSrsMode 
              ? "Cards adapt to how well you know them" 
              : "Toggle to retrieve key terms from memory"}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={() => setIsSrsMode(!isSrsMode)}
            className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold transition-colors border ${
              isSrsMode 
                ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border-zinc-200 dark:border-zinc-700" 
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-transparent"
            }`}
          >
            {isSrsMode ? "Smart Review Active" : "Enable Smart Review"}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-ios-secondary-text bg-ios-light-secondary dark:bg-ios-dark-secondary px-3 py-1 rounded-full font-medium">
            <Award className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>{masteredIndices.length} / {cards.length} Got it!</span>
          </div>
        </div>
      </div>

      {/* Progress visual line */}
      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-900 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-black dark:bg-white transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* 3D Flippable card frame */}
      <div
        id={`flashcard-wrapper-${currentIndex}`}
        className="w-full h-80 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: "1000px" }}
      >
        <motion.div
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          className="relative w-full h-full transform-style-3d"
        >
          {/* Front of Card */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-zinc-200/20 to-ios-light-secondary dark:from-ios-dark-secondary dark:to-black border-2 border-zinc-300 dark:border-zinc-800 rounded-3xl p-8 flex flex-col justify-between shadow-md hover:border-zinc-400 dark:hover:border-zinc-700 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2.5 py-1 rounded-lg font-semibold tracking-wider">
                Question / Concept
              </span>
              <Bookmark className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            </div>

            <div className="my-auto text-center px-4">
              <p className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-snug">
                {currentCard.front}
              </p>
            </div>

            <div className="flex justify-between items-center text-xs text-ios-secondary-text font-medium">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span className="flex items-center gap-1 text-zinc-900 dark:text-zinc-100 font-semibold animate-pulse">
                <Rotate3d className="w-4 h-4" /> Tap to reveal answer
              </span>
            </div>
          </div>

          {/* Back of Card */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-black dark:to-ios-dark-secondary border-2 border-zinc-800 rounded-3xl p-8 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase bg-zinc-800 text-zinc-100 px-2.5 py-1 rounded-lg font-semibold tracking-wider">
                Explanation / Answer
              </span>
              {isMastered ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <BrainCircuit className="w-5 h-5 text-black dark:text-white" />
              )}
            </div>

            <div className="my-auto px-2 overflow-y-auto max-h-40">
              <p className="text-base leading-relaxed text-zinc-250 text-center font-medium text-white">
                {currentCard.back}
              </p>
            </div>

            <div className="flex flex-col mt-4 gap-3">
              {isSrsMode && !isMastered ? (
                <div className="flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-4" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleSrsRating('hard')}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    Hard
                  </button>
                  <button
                    onClick={() => handleSrsRating('good')}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 border-0 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Good
                  </button>
                  <button
                    onClick={() => handleSrsRating('easy')}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 hover:bg-emerald-500/20 transition-colors"
                  >
                    Easy
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center border-t border-zinc-800/80 pt-4">
                  <span className="text-xs text-ios-secondary-text">Card {currentIndex + 1} of {cards.length}</span>
                  <button
                    id={`btn-master-${currentIndex}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      markMastered(currentIndex);
                    }}
                    disabled={isMastered}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                      isMastered
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-100 text-zinc-900 hover:scale-105 active:scale-95 border-0"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isMastered ? "Mastered!" : "Mark Got It (+25 XP)"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation and Actions */}
      {!isSrsMode && (
        <div className="flex items-center justify-between w-full mt-8 gap-4">
          <button
            id="btn-flashcard-prev"
            onClick={handlePrev}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-ios-light-secondary dark:bg-ios-dark-secondary text-black dark:text-white hover:opacity-85 font-semibold text-sm active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <span className="text-xs font-semibold text-ios-secondary-text uppercase tracking-widest text-center my-auto">
            Drag / Click anywhere to flip
          </span>

          <button
            id="btn-flashcard-next"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-ios-light-secondary dark:bg-ios-dark-secondary text-black dark:text-white hover:opacity-85 font-semibold text-sm active:scale-95 transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {isSrsMode && (
         <div className="mt-8 text-center text-xs text-ios-secondary-text">
           Cards are automatically queued based on your recall strength.
         </div>
      )}

      {masteredIndices.length === cards.length && (
        <div className="mt-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-black dark:text-white">🎉 Flashcard Pro Achievement Unlocked!</p>
          <p className="text-xxs text-zinc-500 mt-1">You mastered all concepts from this study guide!</p>
        </div>
      )}
    </div>
  );
}
