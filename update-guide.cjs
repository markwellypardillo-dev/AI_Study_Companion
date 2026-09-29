const fs = require('fs');
let content = fs.readFileSync('src/components/GuideView.tsx', 'utf8');

if (!content.includes('import ReactMarkdown from "react-markdown";')) {
  content = content.replace(
    /import \{ StudyGuideData \} from "\.\.\/types";/,
    'import { StudyGuideData } from "../types";\nimport ReactMarkdown from "react-markdown";'
  );
}

// Update summary
content = content.replace(
  /\{\(guide\.summary \|\| ""\)\.split\("\\n\\n"\)\.map\(\(para, idx\) => \(\s*<p key=\{idx\} className="indent-2">\s*\{para\}\s*<\/p>\s*\)\)\}/,
  '<ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-100 dark:[&>pre]:bg-zinc-900 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-100 dark:[&>code]:bg-zinc-900 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{guide.summary}</ReactMarkdown>'
);

// Update section content
content = content.replace(
  /<p className="text-sm text-black\/85 dark:text-zinc-300 leading-relaxed">\s*\{sec\.content\}\s*<\/p>/g,
  '<div className="text-sm text-black/85 dark:text-zinc-300 leading-relaxed"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{sec.content}</ReactMarkdown></div>'
);

// Update key concepts explanation
content = content.replace(
  /<p className="text-sm text-ios-secondary-text leading-relaxed mt-3">\s*\{item\.explanation\}\s*<\/p>/g,
  '<div className="text-sm text-ios-secondary-text leading-relaxed mt-3"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-100 dark:[&>pre]:bg-zinc-900 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-100 dark:[&>code]:bg-zinc-900 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{item.explanation}</ReactMarkdown></div>'
);

// Update vocabulary definition
content = content.replace(
  /<div className="md:w-3\/4 text-sm text-black\/85 dark:text-white\/85 font-normal leading-relaxed">\s*\{item\.definition\}\s*<\/div>/g,
  '<div className="md:w-3/4 text-sm text-black/85 dark:text-white/85 font-normal leading-relaxed"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-100 dark:[&>pre]:bg-zinc-900 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-100 dark:[&>code]:bg-zinc-900 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{item.definition}</ReactMarkdown></div>'
);

// Update feynman breakdown
content = content.replace(
  /<p className="text-black\/85 dark:text-zinc-300 text-sm leading-relaxed">\{guide\.feynman\.explanation\}<\/p>/g,
  '<div className="text-black/85 dark:text-zinc-300 text-sm leading-relaxed"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{guide.feynman.explanation}</ReactMarkdown></div>'
);

// Update discussion prompts guidance
content = content.replace(
  /<p className="text-black\/85 dark:text-zinc-300 leading-relaxed">\{item\.guidance\}<\/p>/g,
  '<div className="text-black/85 dark:text-zinc-300 leading-relaxed"><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>pre]:bg-zinc-200 dark:[&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-zinc-200 dark:[&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono">{item.guidance}</ReactMarkdown></div>'
);

fs.writeFileSync('src/components/GuideView.tsx', content);
