const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// For Study Guide
content = content.replace(
  /Focus on high-yield information\./g,
  'Focus on high-yield information. IMPORTANT FORMATTING: You must use Markdown (including Markdown code blocks like ```python ... ```, inline code `...`, bolding, and italics) for all text fields (like summary, explanations, flashcards, etc.) to heavily improve readability. If the document contains coding, scripts, or technical algorithms, explicitly feature syntax-highlighted markdown code blocks in your explanations.'
);

// For Assessment (Quizzes)
content = content.replace(
  /Return a list of strictly grounded questions in a JSON array\./g,
  'Return a list of strictly grounded questions in a JSON array. IMPORTANT FORMATTING: You must use Markdown (including Markdown code blocks like ```python ... ```, inline code `...`, bolding, and italics) in your questions, sample answers, and explanations to heavily improve readability. If the source material is coding-related, ensure syntax-highlighted code blocks are used.'
);

fs.writeFileSync('server.ts', content);
