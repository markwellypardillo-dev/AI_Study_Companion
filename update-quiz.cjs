const fs = require('fs');
let content = fs.readFileSync('src/components/QuizView.tsx', 'utf8');

if (!content.includes('import ReactMarkdown from "react-markdown";')) {
  content = content.replace(
    /import \{ AssessmentQuestion, DifficultyTier \} from "\.\.\/types";/,
    'import { AssessmentQuestion, DifficultyTier } from "../types";\nimport ReactMarkdown from "react-markdown";'
  );
}

// question text
content = content.replace(
  /<h4 className="text-sm font-extrabold text-black dark:text-white leading-relaxed mb-4">\s*\{q\.question\}\s*<\/h4>/g,
  '<div className="text-sm font-extrabold text-black dark:text-white leading-relaxed mb-4"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{q.question}</ReactMarkdown></div>'
);

// explanation text
content = content.replace(
  /<strong className="text-black dark:text-white font-bold">Explanation:<\/strong> \{q\.explanation\}/g,
  '<strong className="text-black dark:text-white font-bold">Explanation:</strong> <div className="mt-1"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{q.explanation}</ReactMarkdown></div>'
);

// options
content = content.replace(
  /<span className="text-sm font-bold text-black\/85 dark:text-white\/90 leading-tight">\{opt\}<\/span>/g,
  '<span className="text-sm font-bold text-black/85 dark:text-white/90 leading-tight"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{opt}</ReactMarkdown></span>'
);

// sample answer text
content = content.replace(
  /<strong className="text-black dark:text-white font-bold block mb-1">Expert Answer Model:<\/strong>\s*<p className="text-zinc-600 dark:text-zinc-400">\{q\.sampleAnswer\}<\/p>/g,
  '<strong className="text-black dark:text-white font-bold block mb-1">Expert Answer Model:</strong><div className="text-zinc-600 dark:text-zinc-400"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{q.sampleAnswer}</ReactMarkdown></div>'
);

fs.writeFileSync('src/components/QuizView.tsx', content);
