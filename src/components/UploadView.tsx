import { useState, useRef, DragEvent, ChangeEvent, useEffect, useMemo } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Play, Sparkles, ChevronDown, HardDrive } from "lucide-react";
import { OfficeParser } from "officeparser";
import { PRELOADED_SUBJECTS } from "../data/preloadedSubjects";
import GoogleDrivePicker from "./GoogleDrivePicker";

interface UploadViewProps {
  onFileLoaded: (fileName: string, fileContent: string) => void;
  isLoading: boolean;
  user?: any;
}

export default function UploadView({ onFileLoaded, isLoading, user }: UploadViewProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<number>(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // -1 = idle
  const [parsingStep, setParsingStep] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [showAllSamples, setShowAllSamples] = useState<boolean>(false);
  const [longLoading, setLongLoading] = useState<boolean>(false);
  const [showDrivePicker, setShowDrivePicker] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef<boolean>(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (progressState > -1 && progressState < 4) {
      timeout = setTimeout(() => {
        setLongLoading(true);
      }, 10000);
    } else {
      setLongLoading(false);
    }
    return () => clearTimeout(timeout);
  }, [progressState]);

  const steps = [
    "Uploading document...",
    "Extracting text...",
    "Analyzing content...",
    "Preparing study guide..."
  ];

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setProgressState(-1);
    setLongLoading(false);
  };

  const executeParsingSimulation = (name: string, content: string) => {
    isCancelledRef.current = false;
    setErrorMessage(null);
    setFileName(name);
    setFileContent(content);
    setProgressState(0);
    setParsingStep(steps[0]);

    // Simulate realistic parsing steps
    let currentStep = 0;
    const interval = setInterval(() => {
      if (isCancelledRef.current) {
        clearInterval(interval);
        return;
      }
      currentStep++;
      if (currentStep < steps.length) {
        setProgressState(currentStep);
        setParsingStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        setProgressState(steps.length);
        setParsingStep("Extraction completed successfully!");
        setTimeout(() => {
          if (!isCancelledRef.current) onFileLoaded(name, content);
        }, 800);
      }
    }, 700);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "docx", "pptx", "txt", "xlsx", "png", "jpg", "jpeg", "webp"];

    if (!extension || !allowed.includes(extension)) {
      setErrorMessage("Invalid format! Accepted document formats are: .pdf, .docx, .pptx, .txt, .xlsx, .png, .jpg, .jpeg, .webp");
      return;
    }

    isCancelledRef.current = false;
    setFileName(file.name);
    setProgressState(0);
    setParsingStep(steps[0]); // "Reading file stream buffers..."

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        // Progress to step 1: Scanning document schema structures
        setProgressState(1);
        setParsingStep(steps[1]);

        let extractedText = "";
        let parsedSuccessfully = false;

        // Try client-side parsing first to bypass Vercel serverless request payload limit (4.5MB) and timeouts
        try {
          console.log("[Client Parser] Attempting client-side document extraction...");
          const uint8Array = new Uint8Array(arrayBuffer);
          if (extension === "txt") {
            const decoder = new TextDecoder("utf-8");
            extractedText = decoder.decode(uint8Array);
          } else if (["png", "jpg", "jpeg", "webp", "pdf"].includes(extension || "")) {
            throw new Error("Image/PDF parsing requires server-side Gemini processing to read photos.");
          } else {
            const ast = await OfficeParser.parseOffice(uint8Array, {
              pdfWorkerSrc: "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs"
            });
            const textResult = await ast.to("text");
            extractedText = textResult.value || "";
          }
          parsedSuccessfully = true;
          console.log(`[Client Parser] Extracted ${extractedText.length} characters successfully!`);
        } catch (browserErr) {
          console.warn("[Client Parser] Client-side extraction failed or is unsupported. Falling back to server-side extraction...", browserErr);
          
          // Fallback: Read file as Data URL for server-side parsing
          const fallbackReader = new FileReader();
          const serverPromise = new Promise<string>((resolve, reject) => {
            fallbackReader.onload = async (fallbackEvent) => {
              try {
                const dataUrl = fallbackEvent.target?.result as string || "";
                const response = await fetch("/api/extract-text", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ fileName: file.name, fileBase64: dataUrl }),
                });

                if (!response.ok) {
                  const errData = await response.json().catch(() => ({}));
                  throw new Error(errData.error || "Text extraction engine failed.");
                }

                const data = await response.json();
                resolve(data.text || "");
              } catch (err) {
                reject(err);
              }
            };
            fallbackReader.onerror = () => reject(new Error("File reading failed during fallback."));
            fallbackReader.readAsDataURL(file);
          });
          
          extractedText = await serverPromise;
          parsedSuccessfully = true;
        }

        if (isCancelledRef.current) return;
        // Step 2: Parsing metadata attributes & paragraphs
        setProgressState(2);
        setParsingStep(steps[2]);

        setTimeout(() => {
          if (isCancelledRef.current) return;
          // Step 3: Grounding context indices
          setProgressState(3);
          setParsingStep(steps[3]);
          
          setTimeout(() => {
            if (isCancelledRef.current) return;
            // Step 4: Assembling LLM study prompt payload
            setProgressState(4);
            setParsingStep(steps[4]);

            setTimeout(() => {
              if (isCancelledRef.current) return;
              // Final Step: Complete!
              setProgressState(5);
              setParsingStep("Extraction completed successfully!");
              
              setTimeout(() => {
                if (isCancelledRef.current) return;
                onFileLoaded(file.name, extractedText);
              }, 600);
            }, 500);
          }, 500);
        }, 500);

      } catch (err: any) {
        console.error("File processing failure:", err);
        setErrorMessage(`Extraction failure: ${err.message || "Unable to extract text. Please ensure the document is not corrupted or too large."}`);
        setProgressState(-1);
      }
    };

    reader.onerror = () => {
      setErrorMessage("Error reading file stream.");
      setProgressState(-1);
    };

    reader.readAsArrayBuffer(file);
  };

  const selectSample = (id: string) => {
    const sample = PRELOADED_SUBJECTS.find((p) => p.id === id);
    if (sample) {
      executeParsingSimulation(sample.title, sample.content);
    }
  };

  const visibleSamples = showAllSamples ? PRELOADED_SUBJECTS : PRELOADED_SUBJECTS.slice(0, 3);

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : "Student";

  const greetingText = useMemo(() => {
    const greetings = [
      `What do you want to study, ${firstName}?`,
      `What are we mastering today, ${firstName}?`,
      `Let's explore something new, ${firstName}!`,
      `Ready for a productive session, ${firstName}?`,
      `What's on your mind to learn today, ${firstName}?`,
      `Time to sharpen your mind, ${firstName}.`,
      `What topic are we conquering today, ${firstName}?`,
      `Knowledge awaits! What shall we learn, ${firstName}?`,
      `A fresh start! What do you want to study, ${firstName}?`,
      `Let's unlock some new knowledge, ${firstName}!`,
      `What's our focus for today, ${firstName}?`,
      `Ready to level up your brain power, ${firstName}?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [firstName]);

  return (
    <div id="upload-panel" className="max-w-3xl mx-auto py-8 px-4 relative">
      
       {/* Subtle Gemini-like background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-500/10 via-transparent to-transparent blur-3xl pointer-events-none -z-10 hidden dark:block" />

      <div className="text-center mb-10 relative z-10 pt-8">
        <h1 className="text-3xl sm:text-[34px] font-normal text-black dark:text-[#E3E3E3] mt-3 tracking-normal font-sans">
          {greetingText}
        </h1>
      </div>

      {progressState === -1 ? (
        <>
          <div className="relative group">
            {/* Ambient Brand-indigo-like background glows */}
            <div className="absolute -inset-3 bg-gradient-to-r from-[#5A4BFF]/40 via-violet-500/30 to-[#5A4BFF]/40 rounded-[32px] opacity-25 dark:opacity-45 blur-2xl group-hover:opacity-35 dark:group-hover:opacity-60 transition-all duration-700 pointer-events-none" />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#5A4BFF]/20 via-violet-500/15 to-[#5A4BFF]/20 rounded-[30px] opacity-15 dark:opacity-25 blur-md group-hover:opacity-25 dark:group-hover:opacity-40 transition-all duration-700 pointer-events-none" />

            {errorMessage && (
              <div className="absolute -top-16 left-0 right-0 z-20 flex justify-center animate-fade-in">
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errorMessage}
                </div>
              </div>
            )}
            {/* Drag & Drop Area */}
            <div
              id="drag-drop-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative z-10 cursor-pointer transition-all duration-300 rounded-3xl p-10 border-0 text-center flex flex-col items-center justify-center p-12 ${
                dragActive
                  ? "bg-zinc-100/70 dark:bg-[#18181b]/70 scale-98 shadow-inner"
                  : "bg-white/85 dark:bg-[#121215]/85 hover:bg-white/95 dark:hover:bg-[#121215]/95 hover:shadow-xl backdrop-blur-xl"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInput}
                accept=".pdf,.docx,.pptx,.txt,.xlsx,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />
              <div className="p-4 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl mb-4 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8 text-black dark:text-white" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white">
                Drag & Drop your materials
              </h3>
              <p className="text-xs text-ios-secondary-text mt-1">
                Supports PDF, DOCX, PPTX, TXT, XLSX, PNG, JPG, WEBP (Up to 25MB)
              </p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  id="btn-trigger-file-select"
                  className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Browse files
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent triggering drag-drop zone file select
                    setShowDrivePicker(true);
                  }}
                  className="px-5 py-2.5 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white border-0 text-xs font-bold rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  Google Drive
                </button>
              </div>
            </div>
          </div>

          {showDrivePicker && (
            <GoogleDrivePicker 
              onClose={() => setShowDrivePicker(false)}
              onFileSelected={(fileObj) => {
                setShowDrivePicker(false);
                handleFile(fileObj);
              }}
            />
          )}

        </>
      ) : (
        /* Visual Parsing Progress State Indicator */
        <div
          id="parsing-progress-box"
          className="bg-ios-light-secondary dark:bg-[#121215] border-0 rounded-3xl p-8 shadow-md flex flex-col items-center justify-center min-h-60"
        >
          <div className="relative w-16 h-16 mb-6">
            <span className="absolute inset-0 border-4 border-zinc-200 dark:border-zinc-800 rounded-full" />
            <span className="absolute inset-0 border-4 border-black dark:border-white rounded-full border-t-transparent animate-spin" />
            <FileText className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-black dark:text-white" />
          </div>

          <h3 className="text-xl font-bold text-black dark:text-white">
            {fileName}
          </h3>

          <div className="w-full max-w-md mt-8">
            <div className="flex justify-between text-xs text-ios-secondary-text mb-2 font-medium">
              <span className="animate-pulse text-black dark:text-white font-bold">{parsingStep}</span>
              <span>{Math.round((progressState / steps.length) * 100)}%</span>
            </div>
            {/* Visual double tier bar */}
            <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border-0">
              <div
                className="h-full bg-black dark:bg-white transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                style={{ width: `${(progressState / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Inline checklists */}
          <div className="mt-8 flex flex-col gap-2.5 w-full max-w-sm text-left">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                {progressState > idx ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : progressState === idx ? (
                  <span className="w-4 h-4 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-zinc-400 dark:border-zinc-600 flex-shrink-0" />
                )}
                <span
                  className={`${
                    progressState > idx
                      ? "text-ios-secondary-text/85 line-through font-normal"
                      : progressState === idx
                      ? "text-black dark:text-white font-bold"
                      : "text-ios-secondary-text"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>

          {(longLoading || progressState > -1) && (
            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              {longLoading && (
                <div className="flex animate-fade-in items-start gap-2 max-w-sm bg-orange-500/10 text-orange-600 dark:text-orange-400 p-3 rounded-xl text-xs text-left">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>This is taking a bit longer than usual!</strong> We might be processing a large document. You can keep waiting, or cancel and try again.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-ios-light dark:bg-ios-dark text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all text-xs font-bold"
              >
                Cancel / Go Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
