const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const target1 = `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">`;
const replacement1 = `<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 grid-flow-row">`;
code = code.replace(target1, replacement1);

const targetAdmin = `<div className="lg:col-span-3">
          <AdminPanel`;
const repAdmin = `<div className="lg:col-span-12 order-first">
          <AdminPanel`;
code = code.replace(targetAdmin, repAdmin);

const targetCol1 = `{/* Column 1 & 2: Level progress & Analytics */}
      <div className="lg:col-span-2 space-y-6">
        {activeTab === 'overview' && (
          <>
        
        {/* Level Card */}`;
const repCol1 = `{/* OVERVIEW CONTENT */}
        <div className={\`lg:col-span-7 flex flex-col order-1 \${activeTab === 'overview' ? 'flex' : 'hidden'}\`}>
        {/* Level Card */}`;
code = code.replace(targetCol1, repCol1);

const targetDaily = `{/* Daily Study Target */}
        <div className="bg-ios-light-secondary`;
const repDaily = `</div>
        
        <div className={\`lg:col-span-5 flex flex-col order-2 \${activeTab === 'overview' ? 'flex' : 'hidden'}\`}>
        {/* Daily Study Target */}
        <div className="bg-ios-light-secondary h-full w-full`;
code = code.replace(targetDaily, repDaily);

const targetAnalyticsEnd = `</>
        )}

        {activeTab === 'analytics' && (
          <>
        {/* Bento Grid Analytics Metrics */}`;
const repAnalyticsEnd = `</div>

        {/* ANALYTICS CONTENT */}
        <div className={\`lg:col-span-8 flex flex-col order-1 \${activeTab === 'analytics' ? 'flex' : 'hidden'}\`}>
        {/* Bento Grid Analytics Metrics */}`;
code = code.replace(targetAnalyticsEnd, repAnalyticsEnd);

const targetHeatmap = `{/* Study Consistency Heatmap Block */}
        <div className="space-y-3">`;
const repHeatmap = `</div>
        <div className={\`lg:col-span-8 flex flex-col order-4 \${activeTab === 'analytics' ? 'flex' : 'hidden'}\`}>
        {/* Study Consistency Heatmap Block */}
        <div className="space-y-3 h-full w-full">`;
code = code.replace(targetHeatmap, repHeatmap);

const targetQuiz = `{/* Quiz Grade History Logs */}
        <div className="bg-ios-light-secondary`;
const repQuiz = `</div>
        <div className={\`lg:col-span-4 flex flex-col order-5 \${activeTab === 'analytics' ? 'flex' : 'hidden'}\`}>
        {/* Quiz Grade History Logs */}
        <div className="bg-ios-light-secondary h-full w-full`;
code = code.replace(targetQuiz, repQuiz);

const targetJournalEnd = `</>
        )}

        {activeTab === 'journal' && (
          <>
        {/* Dynamic Study Journal Notebook */}`;
const repJournalEnd = `</div>

        {/* JOURNAL CONTENT */}
        <div className={\`lg:col-span-8 flex flex-col order-1 \${activeTab === 'journal' ? 'flex' : 'hidden'}\`}>
        {/* Dynamic Study Journal Notebook */}`;
code = code.replace(targetJournalEnd, repJournalEnd);

const targetCol3 = `          </>
        )}
      </div>

      {/* Column 3: Beautiful Built-in Pomodoro Space */}
      <div className="space-y-6">
        {(activeTab === 'overview' || activeTab === 'journal') && (
          <>
        <div className="hidden lg:block select-none">`;
const repCol3 = `</div>

      {/* SHARED COLUMN 3 WIDGETS */}
        <div className={\`lg:col-span-4 flex flex-col \${activeTab === 'overview' ? 'order-3 flex' : activeTab === 'journal' ? 'order-2 flex' : 'hidden'}\`}>
        <div className="hidden lg:block select-none w-full h-full">`;
code = code.replace(targetCol3, repCol3);

const targetMusic = `<FocusMusicPlayer`;
const repMusic = `</div>
        
        <div className={\`lg:col-span-4 flex flex-col \${activeTab === 'overview' ? 'order-5 flex' : activeTab === 'journal' ? 'order-3 flex' : 'hidden'}\`}>
        <FocusMusicPlayer`;
code = code.replace(targetMusic, repMusic);

const targetOasis = `</>
        )}
        <StudentOasis`;
const repOasis = `</div>
        
        <div className={\`lg:col-span-4 flex flex-col \${activeTab === 'overview' ? 'order-4 flex' : activeTab === 'analytics' ? 'order-2 flex' : 'hidden'}\`}>
        <StudentOasis`;
code = code.replace(targetOasis, repOasis);

const targetMotivational = `{/* Quick motivational cards */}
        <div className="flex flex-col gap-2">`;
const repMotivational = `</div>

        <div className={\`lg:col-span-4 flex flex-col gap-2 \${activeTab === 'overview' ? 'order-6 flex' : activeTab === 'analytics' ? 'order-3 flex' : 'hidden'}\`}>
        {/* Quick motivational cards */}
        <div className="flex flex-col gap-2 w-full h-full">`;
code = code.replace(targetMotivational, repMotivational);

const targetGridEnd = `      </div>
      </div>
    </div>
  );`;
const repGridEnd = `      </div>
      </div>
    </div>
  );`; // Same, just validating it exists. 

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Rewrote dashboard layout!");
