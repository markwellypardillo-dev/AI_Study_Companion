import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { OfficeParser } from "officeparser";

dotenv.config({ override: true });

const app = express();
app.use(express.json({ limit: "50mb" }));

// Initialize Google GenAI on the server
// User-Agent: 'aistudio-build' is required for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// A robust helper to execute generateContent calls with exponential backoff retries and model fallback switches
async function generateContentWithRetryAndFallback(params: {
  contents: string;
  config?: any;
}): Promise<any> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = 1200;
    const maxRetries = 2; // Up to 2 retries (total 3 attempts) per model

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Querying model "${model}" (attempt ${attempt + 1}/${maxRetries + 1})...`);
        
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          console.log(`[Gemini API] Successfully generated output using "${model}"`);
          return response;
        }
        
        throw new Error("No text response was yielded by the model.");
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || "";
        const status = err.status || 0;
        
        console.warn(`[Gemini API] Attempt ${attempt + 1} with model "${model}" failed. Error: ${errMsg}`);

        // Match transient error signatures (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED)
        const isTransient =
          status === 503 ||
          status === 429 ||
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("unavailable") ||
          errMsg.toLowerCase().includes("high demand") ||
          errMsg.toLowerCase().includes("exhausted");

        if (isTransient && attempt < maxRetries) {
          console.log(`[Gemini API] Error is transient. Backing off for ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff scaling
        } else {
          // Break backoff loop to proceed with next fallback model if available
          break;
        }
      }
    }
    
    console.warn(`[Gemini API] Model "${model}" was exhausted or failed permanently. Moving to fallback option...`);
  }

  // All fallback options exhausted
  throw lastError || new Error("All designated Gemini models are currently unavailable.");
}

// Helper function to extract text securely based on file format
async function extractTextFromBase64(fileName: string, base64Data: string): Promise<string> {
  const extension = fileName.split(".").pop()?.toLowerCase();
  
  // Strip light metadata headers (data:application/pdf;base64, etc.)
  let rawBase64 = base64Data;
  if (base64Data.includes(";base64,")) {
    rawBase64 = base64Data.split(";base64,")[1];
  }
  
  const buffer = Buffer.from(rawBase64, "base64");
  
  if (extension === "txt") {
    return buffer.toString("utf-8");
  } else if (["jpg", "jpeg", "png", "webp"].includes(extension || "")) {
    let mimeType = "image/jpeg";
    if (extension === "png") mimeType = "image/png";
    if (extension === "webp") mimeType = "image/webp";

    const prompt = "Please transcribe all text from this image accurately. If there are diagrams, charts, or visual information, write a detailed description of them. Structure the transcription logically.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: rawBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    });
    
    if (response && response.text) {
      return response.text;
    } else {
      throw new Error("Could not extract text from image.");
    }
  } else if (extension === "pdf") {
    const prompt = "Please transcribe all text from this document accurately. Treat any diagrams, charts, or embedded photos as visual information and write a detailed description of them inline. Structure the transcription logically to retain flow.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: rawBase64,
                mimeType: "application/pdf"
              }
            }
          ]
        }
      ]
    });
    
    if (response && response.text) {
      return response.text;
    } else {
      throw new Error("Could not extract text from PDF using vision models.");
    }
  } else if (["docx", "pptx", "xlsx"].includes(extension || "")) {
    const ast = await OfficeParser.parseOffice(buffer);
    return ast.toText();
  }
  
  return buffer.toString("utf-8"); // Fallback to raw buffer stringification
}

// --- API Routes ---

interface ScholarPresence {
  id: string;
  name: string;
  subject: string;
  mode: string;
  streak: number;
  level: number;
  avatarChar: string;
  lastSeen: number;
  socketId?: string;
}

const activePresenceMap = new Map<string, ScholarPresence>();

app.post("/api/study-lounge/presence", (req, res) => {
  try {
    const { id, name, subject, mode, streak, level, avatarChar } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "id and name are required" });
    }

    // Record presence with latest details from active user
    activePresenceMap.set(id, {
      id,
      name,
      subject: subject || "Study Session 📚",
      mode: mode || "Deep Focus Session 🎧",
      streak: Number(streak) || 1,
      level: Number(level) || 1,
      avatarChar: avatarChar || name[0] || "S",
      lastSeen: Date.now()
    });

    // Clean stale presences (such as closed browsers or disconnected users inactive for > 15 seconds)
    const cutoff = Date.now() - 15000;
    for (const [key, val] of activePresenceMap.entries()) {
      if (val.lastSeen < cutoff) {
        activePresenceMap.delete(key);
      }
    }

    // Filter to obtain real other active scholars (excluding the user themselves)
    const liveCompanions = Array.from(activePresenceMap.values()).filter(p => p.id !== id);

    res.json({
      activeCount: activePresenceMap.size,
      companions: liveCompanions
    });
  } catch (err: any) {
    console.error("Presence exception:", err);
    res.status(500).json({ error: "Failed to record active study state" });
  }
});

app.get("/40-hz-study-music.mp3", (req, res) => {
  res.sendFile(path.join(process.cwd(), "40 Hz Study Music_spotdown.org.mp3"));
});

  // Raw Text Extraction API Route
  app.post("/api/extract-text", async (req, res) => {
    try {
      const { fileName, fileBase64 } = req.body;

      if (!fileBase64) {
        return res.status(400).json({ error: "File base64 data is required" });
      }

      console.log(`[Parser] Extracting text for: ${fileName}`);
      const extractedText = await extractTextFromBase64(fileName, fileBase64);
      
      // Post-process the extracted texts by normalizing newlines and formatting
      let cleanedText = extractedText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

      if (!cleanedText) {
        cleanedText = `Empty document details. Extracted file text layout is empty. File name: ${fileName}`;
      }

      console.log(`[Parser] Successfully extracted ${cleanedText.length} characters for: ${fileName}`);
      res.json({ text: cleanedText });
    } catch (e: any) {
      console.error("Text extraction failure:", e);
      res.status(500).json({ error: e.message || "Failed to parse document text" });
    }
  });

  // Generate Study Guide Mode
  app.post("/api/generate-study-guide", async (req, res) => {
    try {
      const { fileName, fileContent } = req.body;

      if (!fileContent) {
        return res.status(400).json({ error: "File content is required" });
      }

      const prompt = `
You are an expert EdTech tutor. Your job is to generate a comprehensive, highly engaging, and structured Study Guide based STRICTLY on the document content provided below. 
You are strictly forbidden from fabricating or using outside knowledge (no hallucinations). All facts, summaries, key terms, and definitions must be grounded in the source text.

Document Title: ${fileName || "Untitled Document"}
Document Text:
"""
${fileContent}
"""

Generate a complete, beautiful study guide structured precisely as follows in JSON output format.
Provide:
1. "summary": A high-level, clear, Gen-Z friendly summary of the text (2-3 paragraphs).
2. "chapters" / "sections": A structured list of main visual sections, with "title", "content" (bullet notes), and "relevance".
3. "keyConcepts": Key concepts extracted of size 4-8. Each concept must have a "concept" name, "explanation" (very comprehensive yet clear), and "importance".
4. "vocabulary": A glossary/mapping of important vocabulary containing 5-10 terms with "term" and "definition".
5. "flashcards": list of 6-12 interactive flashcard pairs containing "front" (question or concept to recall) and "back" (detailed direct recall answer/definition).

Return your response strictly as a JSON object matching this structural schema.
`;

      const response = await generateContentWithRetryAndFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    relevance: { type: Type.STRING }
                  },
                  required: ["title", "content"]
                }
              },
              keyConcepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    importance: { type: Type.STRING }
                  },
                  required: ["concept", "explanation"]
                }
              },
              vocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  },
                  required: ["term", "definition"]
                }
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING }
                  },
                  required: ["front", "back"]
                }
              }
            },
            required: ["summary", "sections", "keyConcepts", "vocabulary", "flashcards"]
          }
        }
      });

      const extractedText = response.text;
      if (!extractedText) {
        throw new Error("No response generated by the AI model.");
      }

      res.json(JSON.parse(extractedText.trim()));
    } catch (error: any) {
      console.error("Study guide generation failure:", error);
      res.status(500).json({ error: error.message || "Failed to generate study guide" });
    }
  });

  // Generate Quizzes in Assessment Mode (Basic, Medium, Hard)
  app.post("/api/generate-assessment", async (req, res) => {
    try {
      const { fileName, fileContent, difficulty } = req.body;

      if (!fileContent) {
        return res.status(400).json({ error: "File content is required" });
      }

      const diff = difficulty || "basic";

      let formatInstructions = "";
      let expectedSchemaProperties: any = {};
      let requiredFields: string[] = ["id", "type", "question", "explanation"];

      if (diff === "basic") {
        formatInstructions = `
Generate 5-8 questions of type "mcq" (Multiple Choice) or "tf" (True/False). 
Focus on direct recall, basic details, and clear facts from the text.
Each question must include a "question" field, "options" array, and a "correctAnswer" representing the exact correct string.
`;
        expectedSchemaProperties = {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be 'mcq' or 'tf'" },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        };
        requiredFields = ["id", "type", "question", "options", "correctAnswer", "explanation"];
      } else if (diff === "medium") {
        formatInstructions = `
Generate 5-8 questions of type "fib" (Fill-in-the-blanks with blank as '__' or placeholder text) or "short" (Conceptual understanding).
Each question must include the "question" field, "correctAnswer" representing the correct blank word or direct brief answer, and any hint/context.
`;
        expectedSchemaProperties = {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be 'fib' or 'short'" },
          question: { type: Type.STRING },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        };
        requiredFields = ["id", "type", "question", "correctAnswer", "explanation"];
      } else {
        // Hard
        formatInstructions = `
Generate 3-5 comprehensive questions of type "essay" (Critical reasoning) or "scenario" (Scenario-based application of parameters).
Include detail-rich scenario text.
Each question must include the "question" field, "sampleAnswer" (a model high-quality answer) and "gradingCriteria" (bulleted critical points required to get full credit).
`;
        expectedSchemaProperties = {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be 'essay' or 'scenario'" },
          question: { type: Type.STRING },
          sampleAnswer: { type: Type.STRING },
          gradingCriteria: { type: Type.STRING },
          explanation: { type: Type.STRING }
        };
        requiredFields = ["id", "type", "question", "sampleAnswer", "gradingCriteria", "explanation"];
      }

      const prompt = `
You are an advanced academic evaluator. Your job is to generate high-quality assessment questions strictly grounded in the material provided below.
Do not evaluate external facts. Do not deviate from the core material definitions.

Document Title: ${fileName || "Untitled Document"}
Difficulty Tier Chosen: ${diff.toUpperCase()}
Document Text:
"""
${fileContent}
"""

Format Requirements:
${formatInstructions}

Return a list of strictly grounded questions in a JSON array.
`;

      const response = await generateContentWithRetryAndFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: expectedSchemaProperties,
              required: requiredFields
            }
          }
        }
      });

      const extractedText = response.text;
      if (!extractedText) {
        throw new Error("No response generated by the AI evaluator.");
      }

      res.json(JSON.parse(extractedText.trim()));
    } catch (error: any) {
      console.error("Assessment generation failure:", error);
      res.status(500).json({ error: error.message || "Failed to generate assessment" });
    }
  });

  // --- Vite Asset Pipeline / Dev Server Static Setup ---

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  
  const http = await import("http");
  const httpServer = http.createServer(app);
  
  const { Server } = await import("socket.io");
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on("join-lounge", (data) => {
      const { id, name, subject, mode, streak, level, avatarChar } = data;
      if (!id) return;
      
      activePresenceMap.set(id, {
        id,
        name: name || "Scholar",
        subject: subject || "Study Session 📚",
        mode: mode || "Deep Focus Session 🎧",
        streak: Number(streak) || 1,
        level: Number(level) || 1,
        avatarChar: avatarChar || "S",
        lastSeen: Date.now(),
        socketId: socket.id
      });

      socket.join("lounge");
      const companions = Array.from(activePresenceMap.values()).filter(p => p.id !== id);
      io.to("lounge").emit("lounge-update", Array.from(activePresenceMap.values()));
    });

    socket.on("update-presence", (data) => {
      const { id, name, subject, mode, streak, level, avatarChar } = data;
      if (!id) return;
      
      const existing = activePresenceMap.get(id);
      if (existing) {
        existing.subject = subject || existing.subject;
        existing.mode = mode || existing.mode;
        existing.lastSeen = Date.now();
        existing.socketId = socket.id;
        
        io.to("lounge").emit("lounge-update", Array.from(activePresenceMap.values()));
      }
    });

    socket.on("disconnect", () => {
      let disconnectedId = null;
      for (const [key, val] of activePresenceMap.entries()) {
        if (val.socketId === socket.id) {
          disconnectedId = key;
          activePresenceMap.delete(key);
          break;
        }
      }
      
      if (disconnectedId) {
        io.to("lounge").emit("lounge-update", Array.from(activePresenceMap.values()));
      }
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Background cleanup task for stale connections
  setInterval(() => {
    const cutoff = Date.now() - 30000;
    let changed = false;
    for (const [key, val] of activePresenceMap.entries()) {
      if (val.lastSeen < cutoff && !val.socketId) {
        activePresenceMap.delete(key);
        changed = true;
      }
    }
    if (changed) {
      io.to("lounge").emit("lounge-update", Array.from(activePresenceMap.values()));
    }
  }, 15000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT} with WebSocket supported`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
