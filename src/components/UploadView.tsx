import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Play, Sparkles, ChevronDown, HardDrive } from "lucide-react";
import { OfficeParser } from "officeparser";
import { PRELOADED_SUBJECTS } from "../data/preloadedSubjects";
import GoogleDrivePicker from "./GoogleDrivePicker";

interface UploadViewProps {
  onFileLoaded: (fileName: string, fileContent: string) => void;
  isLoading: boolean;
}

export default function UploadView({ onFileLoaded, isLoading }: UploadViewProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<number>(-1); // -1 = idle
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
      alert("Invalid format! Accepted document formats are: .pdf, .docx, .pptx, .txt, .xlsx, .png, .jpg, .jpeg, .webp");
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
        alert(`Extraction failure: ${err.message || "Unable to extract text. Please ensure the document is not corrupted or too large."}`);
        setProgressState(-1);
      }
    };

    reader.onerror = () => {
      alert("Error reading file stream.");
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

  return (
    <div id="upload-panel" className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-black dark:text-white mt-3 tracking-tight">
          Supercharge Your Study Sessions
        </h1>
        <p className="text-sm text-ios-secondary-text mt-2 max-w-lg mx-auto">
          Drop any notes, syllabus slides, textbook PDFs, or spreadsheets or select one of our preloaded examples to generate study guides instantly.
        </p>
      </div>

      {progressState === -1 ? (
        <>
          {/* Drag & Drop Area */}
          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer transition-all duration-300 rounded-3xl p-10 border-2 border-dashed text-center flex flex-col items-center justify-center p-12 ${
              dragActive
                ? "border-brand-indigo bg-brand-indigo/10 scale-98"
                : "border-zinc-200 dark:border-zinc-800 hover:border-brand-indigo bg-ios-light-secondary dark:bg-ios-dark-secondary shadow-sm"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              accept=".pdf,.docx,.pptx,.txt,.xlsx,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
            <div className="p-4 bg-brand-indigo/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-brand-indigo" />
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
                className="px-5 py-2.5 bg-brand-indigo text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(90,75,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Browse files
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent triggering drag-drop zone file select
                  setShowDrivePicker(true);
                }}
                className="px-5 py-2.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs font-bold rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5" />
                Google Drive
              </button>
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

          {/* Quick Preload Examples */}
          <div className="mt-10">
            <h4 className="text-xs font-bold text-ios-secondary-text uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span>OR CHOOSE A PRELOADED SUBJECT FOR INSTANT TRIAL:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleSamples.map((doc) => (
                <div
                  key={doc.id}
                  id={`sample-doc-${doc.id}`}
                  onClick={() => selectSample(doc.id)}
                  className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 hover:border-brand-indigo p-5 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all flex flex-col justify-between group shadow-sm active:scale-95"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <FileText className="w-4 h-4 text-brand-indigo" />
                      <span className="text-xxs font-bold text-brand-indigo uppercase bg-brand-indigo/10 px-2 py-0.5 rounded-md">
                        {doc.title.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                    <h5 className="text-sm font-extrabold text-black dark:text-white line-clamp-1 group-hover:text-brand-indigo">
                      {doc.title.replace(/\.[^/.]+$/, "")}
                    </h5>
                    <p className="text-xs text-ios-secondary-text mt-1.5 line-clamp-2 leading-relaxed">
                      {doc.short}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-brand-indigo font-bold">
                    <span>Try Subject</span>
                    <Play className="w-3 h-3 fill-brand-indigo" />
                  </div>
                </div>
              ))}
            </div>

            {PRELOADED_SUBJECTS.length > 3 && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  id="btn-toggle-show-all-samples"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllSamples(!showAllSamples);
                  }}
                  className="px-6 py-2.5 rounded-full border-2 border-brand-indigo bg-brand-indigo/5 text-brand-indigo hover:bg-brand-indigo/10 active:scale-95 transition-all text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>{showAllSamples ? "Show Less" : "Show More Subjects (Instant Trial)"}</span>
                  <ChevronDown className={`w-4.5 h-4.5 transition-transform duration-305 ${showAllSamples ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Visual Parsing Progress State Indicator */
        <div
          id="parsing-progress-box"
          className="bg-ios-light-secondary dark:bg-ios-dark-secondary border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-md flex flex-col items-center justify-center min-h-60"
        >
          <div className="relative w-16 h-16 mb-6">
            <span className="absolute inset-0 border-4 border-brand-indigo/15 rounded-full" />
            <span className="absolute inset-0 border-4 border-brand-indigo rounded-full border-t-transparent animate-spin" />
            <FileText className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-brand-indigo" />
          </div>

          <h3 className="text-xl font-bold text-black dark:text-white">
            {fileName}
          </h3>

          <div className="w-full max-w-md mt-8">
            <div className="flex justify-between text-xs text-ios-secondary-text mb-2 font-medium">
              <span className="animate-pulse text-brand-indigo font-bold">{parsingStep}</span>
              <span>{Math.round((progressState / steps.length) * 100)}%</span>
            </div>
            {/* Visual double tier bar */}
            <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200/40 dark:border-zinc-850">
              <div
                className="h-full bg-brand-indigo transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(90,75,255,0.4)]"
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
                  <span className="w-4 h-4 rounded-full border-2 border-brand-indigo border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-zinc-400 dark:border-zinc-600 flex-shrink-0" />
                )}
                <span
                  className={`${
                    progressState > idx
                      ? "text-ios-secondary-text/85 line-through font-normal"
                      : progressState === idx
                      ? "text-brand-indigo font-bold"
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
