const fs = require('fs');
let content = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');

if (!content.includes('import ReactMarkdown from "react-markdown";')) {
  content = content.replace(
    /import \{ Flashcard \} from "\.\.\/types";/,
    'import { Flashcard } from "../types";\nimport ReactMarkdown from "react-markdown";'
  );
}

content = content.replace(
  /<p className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-snug">\s*\{currentCard\.front\}\s*<\/p>/g,
  '<div className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-snug"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{currentCard.front}</ReactMarkdown></div>'
);

content = content.replace(
  /<p className="text-base leading-relaxed text-zinc-250 text-center font-medium text-white">\s*\{currentCard\.back\}\s*<\/p>/g,
  '<div className="text-base leading-relaxed text-zinc-250 text-center font-medium text-white"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none text-left [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{currentCard.back}</ReactMarkdown></div>'
);

fs.writeFileSync('src/components/Flashcards.tsx', content);
