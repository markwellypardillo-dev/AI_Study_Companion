const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  /const ai = new GoogleGenAI\(\{\n\s*apiKey: process\.env\.GEMINI_API_KEY,\n\s*httpOptions: \{\n\s*headers: \{\n\s*"User-Agent": "aistudio-build",\n\s*\},\n\s*\},\n\}\);/g,
  `let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}`
);

// We also need to replace `ai.models.generateContent` with `getAI().models.generateContent`
serverContent = serverContent.replace(
  /const response = await ai\.models\.generateContent/g,
  'const response = await getAI().models.generateContent'
);

fs.writeFileSync('server.ts', serverContent);
