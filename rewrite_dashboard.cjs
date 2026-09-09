const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// The starting point
const gridStart = code.indexOf('<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">');
if (gridStart === -1) {
    console.error("Could not find grid start");
    process.exit(1);
}

// Replace the grid container
code = code.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">',
  '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">'
);

// Admin panel replacement
code = code.replace(
  '<div className="lg:col-span-3">\\n          <AdminPanel',
  '<div className="lg:col-span-12 order-first">\\n          <AdminPanel'
);

// Remove the column 1 & 2 wrapper
code = code.replace(
  '{/* Column 1 & 2: Level progress & Analytics */}\\n      <div className="lg:col-span-2 space-y-6">\\n        {activeTab === \\'overview\\' && (\\n          <>',
  '{/* OVERVIEW CONTENT */}'
);

// Level Card -> span 7
code = code.replace(
  '{/* Level Card */}\\n        <div className="bg-black',
  '<div className={`lg:col-span-7 flex flex-col order-1 ${activeTab === \\'overview\\' ? \\'flex\\' : \\'hidden\\'}`}>\\n        {/* Level Card */}\\n        <div className="bg-black w-full h-full'
);

// Daily Study Target -> span 5
code = code.replace(
  '{/* Daily Study Target */}\\n        <div className="bg-ios-light-secondary',
  '</div>\\n\\n        <div className={`lg:col-span-5 flex flex-col order-2 ${activeTab === \\'overview\\' ? \\'flex\\' : \\'hidden\\'}`}>\\n        {/* Daily Study Target */}\\n        <div className="bg-ios-light-secondary w-full h-full'
);

// End of Overview, Start of Analytics
code = code.replace(
  '</>\\n        )}\\n\\n        {activeTab === \\'analytics\\' && (\\n          <>\\n        {/* Bento Grid Analytics Metrics */}',
  '</div>\\n\\n        {/* ANALYTICS CONTENT */}\\n        <div className={`lg:col-span-8 flex flex-col order-1 ${activeTab === \\'analytics\\' ? \\'flex\\' : \\'hidden\\'}`}>\\n        {/* Bento Grid Analytics Metrics */}'
);

// Heatmap -> part of Analytics column 1?
code = code.replace(
  '{/* Study Consistency Heatmap Block */}\\n        <div className="space-y-3">',
  '</div>\\n        <div className={`lg:col-span-8 flex flex-col order-4 ${activeTab === \\'analytics\\' ? \\'flex\\' : \\'hidden\\'}`}>\\n        {/* Study Consistency Heatmap Block */}\\n        <div className="space-y-3 w-full h-full">'
);

// Quiz Grade History -> currently in analytics, but let's make it order-5
code = code.replace(
  '{/* Quiz Grade History Logs */}\\n        <div className="bg-ios-light-secondary',
  '</div>\\n        <div className={`lg:col-span-4 flex flex-col order-5 ${activeTab === \\'analytics\\' ? \\'flex\\' : \\'hidden\\'}`}>\\n        {/* Quiz Grade History Logs */}\\n        <div className="bg-ios-light-secondary w-full h-full'
);

// End of Analytics, Start of Journal
code = code.replace(
  '</>\\n        )}\\n\\n        {activeTab === \\'journal\\' && (\\n          <>\\n        {/* Dynamic Study Journal Notebook */}',
  '</div>\\n\\n        {/* JOURNAL CONTENT */}\\n        <div className={`lg:col-span-8 flex flex-col order-1 ${activeTab === \\'journal\\' ? \\'flex\\' : \\'hidden\\'}`}>\\n        {/* Dynamic Study Journal Notebook */}'
);

// Remove the end of the col 1 wrapper and start of col 3 wrapper
code = code.replace(
  '          </>\\n        )}\\n      </div>\\n\\n      {/* Column 3: Beautiful Built-in Pomodoro Space */}\\n      <div className="space-y-6">\\n        {(activeTab === \\'overview\\' || activeTab === \\'journal\\') && (\\n          <>\\n        <div className="hidden lg:block select-none">',
  '</div>\\n\\n      {/* SHARED COLUMN 3 WIDGETS */}\\n        <div className={`lg:col-span-4 flex flex-col w-full h-full ${activeTab === \\'overview\\' ? \\'order-3 flex\\' : activeTab === \\'journal\\' ? \\'order-2 flex\\' : \\'hidden\\'}`}>\\n        <div className="hidden lg:block select-none w-full">'
);

// Focus Music Player -> separate grid item
code = code.replace(
  '<FocusMusicPlayer',
  '</div>\\n\\n        <div className={`lg:col-span-4 flex flex-col w-full h-full ${activeTab === \\'overview\\' ? \\'order-5 flex\\' : activeTab === \\'journal\\' ? \\'order-3 flex\\' : \\'hidden\\'}`}>\\n        <FocusMusicPlayer'
);

// Student Oasis -> separate grid item
code = code.replace(
  '</>\\n        )}\\n        <StudentOasis',
  '</div>\\n\\n        <div className={`lg:col-span-4 flex flex-col w-full h-full ${activeTab === \\'overview\\' ? \\'order-4 flex\\' : activeTab === \\'analytics\\' ? \\'order-2 flex\\' : \\'hidden\\'}`}>\\n        <StudentOasis'
);

// Quiz Tips -> separate grid item
code = code.replace(
  '{/* Quick motivational cards */}\\n        <div className="flex flex-col gap-2">',
  '</div>\\n\\n        <div className={`lg:col-span-4 flex flex-col gap-2 w-full h-full ${activeTab === \\'overview\\' ? \\'order-6 flex\\' : activeTab === \\'analytics\\' ? \\'order-3 flex\\' : \\'hidden\\'}`}>\\n        {/* Quick motivational cards */}\\n        <div className="flex flex-col gap-2 w-full">'
);

// End of grid
// The old structure had a closing div for `<div className="space-y-6">`
// We need to replace the last two `</div>` with just one (for the grid) if we removed the wrapper.
// But wait, our replacements added `<div className="...">` wrappers for everything.
// Let's just append a closing div to Quiz Tips.
code = code.replace(
  '      </div>\\n      </div>\\n    </div>\\n  );\\n}',
  '      </div>\\n      </div>\\n    </div>\\n  );\\n}' // Actually we need to make sure the divs balance.
);

fs.writeFileSync('src/components/Dashboard.tsx.patched', code);
console.log("Patch generated. Please review Dashboard.tsx.patched");
