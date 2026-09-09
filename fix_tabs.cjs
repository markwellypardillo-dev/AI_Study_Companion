const fs = require('fs');
let code = fs.readFileSync('src/components/GuideView.tsx', 'utf-8');

code = code.replace(
  '<Lightbulb className="w-5 h-5 text-amber-500" />',
  '<Lightbulb className="w-5 h-5 text-black dark:text-white" />'
);

code = code.replace(
  '<div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 mb-6">',
  '<div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-5 mb-6">'
);

code = code.replace(
  '<h3 className="text-sm font-extrabold text-amber-800 dark:text-amber-500 mb-2">The Analogy</h3>',
  '<h3 className="text-sm font-extrabold text-black dark:text-white mb-2">The Analogy</h3>'
);

code = code.replace(
  '<span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/25">',
  '<span className="flex items-center gap-1 text-xs font-bold text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">'
);

code = code.replace(
  '<div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0 mt-1">',
  '<div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center shrink-0 mt-1">'
);

fs.writeFileSync('src/components/GuideView.tsx', code);
