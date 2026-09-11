import { useState, useEffect } from "react";
import appLogo from "../assets/images/app_logo.png";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, BrainCircuit, Users, Focus, ArrowRight, CheckCircle2, X, Moon, MessageCircle } from "lucide-react";

export default function WelcomeTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if the user has already seen the tour
    const hasSeenTour = localStorage.getItem("hasSeenWelcomeTour_v3");
    if (!hasSeenTour) {
      // Small delay to let the app load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenWelcomeTour_v3", "true");
  };

  const steps = [
    {
      title: "Welcome to AI Study Companion",
      description: "Your personalized learning workspace. Let's take a quick tour to help you get the most out of your study sessions.",
      icon: <img src={appLogo} alt="App Logo" className="w-16 h-16 rounded-2xl object-cover shadow-sm" />,
      color: "bg-transparent border-transparent p-0"
    },
    {
      title: "Smart Upload & Flashcards",
      description: "Upload your PDFs or notes. We'll automatically generate a structured study guide, interactive quizzes, and flashcards with Smart Review (SRS) to boost your memory.",
      icon: <BrainCircuit className="w-10 h-10 text-emerald-500" />,
      color: "bg-emerald-500/10 border-emerald-500/20 p-4"
    },
    {
      title: "Feynman Technique & Mnemonics",
      description: "Struggling with complex topics? Let AI break them down using the Feynman Technique (Explain Like I'm 5), and generate catchy mnemonics to lock them in your memory.",
      icon: <Sparkles className="w-10 h-10 text-indigo-500" />,
      color: "bg-indigo-500/10 border-indigo-500/20 p-4"
    },
    {
      title: "Discussion & Essay Prompts",
      description: "Prepare for your exams by tackling AI-generated open-ended questions designed to test your critical thinking and deepen your understanding of the material.",
      icon: <MessageCircle className="w-10 h-10 text-blue-500" />,
      color: "bg-blue-500/10 border-blue-500/20 p-4"
    },
    {
      title: "Focus & Ambient Oasis",
      description: "Stay in the zone with our built-in Pomodoro timer and lo-fi focus music. Grow your virtual 'Study Oasis' tree by maintaining your study streaks.",
      icon: <Focus className="w-10 h-10 text-amber-500" />,
      color: "bg-amber-500/10 border-amber-500/20 p-4"
    },
    {
      title: "Personalized Aesthetics",
      description: "Switch seamlessly between Light and Dark modes. Match your study environment and reduce eye strain for those late-night study sessions.",
      icon: <Moon className="w-10 h-10 text-slate-500 dark:text-slate-400" />,
      color: "bg-slate-500/10 border-slate-500/20 p-4"
    },
    {
      title: "Study Lounge & Co-working",
      description: "Join the Live Study Lounge to study alongside your peers, or chat with students, your AI tutor, for any questions you have along the way.",
      icon: <Users className="w-10 h-10 text-rose-500" />,
      color: "bg-rose-500/10 border-rose-500/20 p-4"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1e1f22] rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-10 flex flex-col items-center text-center">
              <div className={`rounded-2xl border mb-6 flex items-center justify-center ${steps[currentStep].color}`}>
                {steps[currentStep].icon}
              </div>

              <h2 className="text-2xl font-bold text-black dark:text-white mb-3">
                {steps[currentStep].title}
              </h2>
              
              <p className="text-sm text-ios-secondary-text leading-relaxed mb-8">
                {steps[currentStep].description}
              </p>

              {/* Progress dots */}
              <div className="flex items-center gap-2 mb-8">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? "w-6 bg-black dark:bg-white"
                        : "w-1.5 bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="w-full flex gap-3">
                {currentStep < steps.length - 1 ? (
                  <>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-ios-secondary-text hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Skip Tour
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleClose}
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                  >
                    Get Started <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
