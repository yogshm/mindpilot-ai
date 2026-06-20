import React from "react";
import { JournalEntry, MentalScores } from "../types";
import { AlertCircle, Flame, BookOpen } from "lucide-react";

interface DashboardOverviewProps {
  entries: JournalEntry[];
  onNavigateTab: (tab: string) => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

export default function DashboardOverview({ entries, onNavigateTab, onSelectEntry }: DashboardOverviewProps) {
  const latestEntry = entries[0] || null;

  // React state for logging history filters
  const [selectedRisk, setSelectedRisk] = React.useState<string>("All");
  const [selectedPattern, setSelectedPattern] = React.useState<string>("All");

  // Dynamically compile any unique AI patterns detected across all entries in local state
  const dynamicPatterns = React.useMemo(() => {
    const setOfPatterns = new Set<string>();
    entries.forEach((item) => {
      if (item.analysis?.detectedPatterns) {
        item.analysis.detectedPatterns.forEach((p) => setOfPatterns.add(p));
      }
    });
    return Array.from(setOfPatterns);
  }, [entries]);

  // Compute filtered log items
  const filteredEntries = React.useMemo(() => {
    return entries.filter((item) => {
      // Risk level checking
      if (selectedRisk !== "All") {
        const riskVal = item.analysis?.burnoutRisk || "Low";
        if (riskVal !== selectedRisk) return false;
      }
      // AI Mood Pattern checking
      if (selectedPattern !== "All") {
        const patterns = item.analysis?.detectedPatterns || [];
        if (!patterns.includes(selectedPattern)) return false;
      }
      return true;
    });
  }, [entries, selectedRisk, selectedPattern]);

  // Use values from latest entry, fallback to balanced scores if none exists
  const currentScores: MentalScores = latestEntry?.scores || {
    stress: 0,
    motivation: 0,
    focus: 0,
    confidence: 0,
    energy: 50
  };

  const currentRisk = latestEntry?.analysis?.burnoutRisk || "None Detected";
  const mentorMessage = latestEntry?.analysis?.mentorMessage || 
    "You haven't logged any entries yet today. Take 2 minutes to summarize your preparation day in the Daily Journal. The AI will immediately analyze your burnout probability metrics.";

  const recentlyDetectedTriggers = latestEntry?.analysis?.stressTriggers || [];

  return (
    <div id="dashboard-overview" className="space-y-4 animate-fadeIn text-slate-800">
      {/* Editorial Welcome Header Section - Compact */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3.5 border-b border-slate-100">
        <div>
          <h1 className="text-[10px] font-bold tracking-[0.15em] text-indigo-500 uppercase font-mono">MindPilot AI Companion</h1>
          <h2 className="text-xl font-light text-slate-850 font-serif">
            Aspirant <span className="font-semibold italic text-slate-900">Workspace</span>
          </h2>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => onNavigateTab("panic")}
            className="px-4 py-1.5 bg-red-50 text-red-650 rounded-full text-[10px] font-bold border border-red-100 hover:bg-red-100/70 transition-colors uppercase tracking-wider font-mono cursor-pointer"
          >
            I need help now
          </button>
          <button
            id="tab-btn-journal"
            onClick={() => onNavigateTab("journal")}
            className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-full text-[10px] font-bold hover:shadow-md transition-all uppercase tracking-wider font-mono cursor-pointer"
          >
            Daily Sync
          </button>
        </div>
      </header>

      {/* Wellness Dashboard Core Metrics Row - Redesigned ultra-compact horizontal strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1 - Stress Score */}
        <div id="metric-card-stress" className="bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-20">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">STRESS SCALE</span>
            <span className={`w-1.5 h-1.5 rounded-full ${currentScores.stress > 70 ? 'bg-red-500' : currentScores.stress > 48 ? 'bg-orange-400' : 'bg-emerald-400 animate-pulse'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-serif text-slate-850">
              {latestEntry ? currentScores.stress : '──'}
            </span>
            {latestEntry && (
              <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded ${currentScores.stress > 60 ? 'bg-red-50 text-red-650' : 'bg-emerald-50 text-emerald-600'}`}>
                {currentScores.stress > 60 ? 'LOAD' : 'SAFE'}
              </span>
            )}
          </div>
        </div>

        {/* Metric 2 - Motivation Score */}
        <div id="metric-card-motivation" className="bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-20">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">MOTIVATION</span>
            <span className="text-indigo-400 text-[10px] font-mono">★</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-serif text-slate-850">
              {latestEntry ? `${currentScores.motivation}%` : '──'}
            </span>
            <span className="text-[8px] font-mono text-slate-450 uppercase">DRIVE</span>
          </div>
        </div>

        {/* Metric 3 - Focus Score */}
        <div id="metric-card-focus" className="bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-20">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">FOCUS RANGE</span>
            <span className="text-indigo-500 text-[8px] italic font-serif">Peak</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-serif text-slate-850">
              {latestEntry ? `${currentScores.focus}%` : '──'}
            </span>
            <span className="text-[8px] font-mono text-slate-450 uppercase">ATTN</span>
          </div>
        </div>

        {/* Metric 4 - Confidence Score */}
        <div id="metric-card-confidence" className="bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-20">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">CONFIDENCE</span>
            <span className="text-emerald-500 text-[10px] font-mono">▲</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-serif text-slate-850">
              {latestEntry ? `${currentScores.confidence}%` : '──'}
            </span>
            <span className="text-[8px] font-mono text-slate-455 uppercase">RECALL</span>
          </div>
        </div>

        {/* Metric 5 - Burnout Risk level card */}
        <div id="metric-card-burnout" className="bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-20 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">BURNOUT RISK</span>
            <Flame className={`w-3 h-3 ${currentRisk === "High" ? "text-red-500 fill-red-100 animate-pulse" : currentRisk === "Medium" ? "text-orange-400" : "text-emerald-400"}`} />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-xl font-serif font-bold ${currentRisk === "High" ? "text-red-650 animate-pulse" : currentRisk === "Medium" ? "text-orange-500" : "text-emerald-600"}`}>
              {latestEntry ? currentRisk : '──'}
            </span>
            <span className="text-[8px] font-mono text-slate-410 uppercase">PROB</span>
          </div>
        </div>
      </div>

      {/* Main Split Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Left Column: Diagnostics and Triggers (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Adaptive AI Companion Card Column - Sleeker & High Contrast */}
          <div id="mentor-companion-panel" className="bg-gradient-to-br from-[#4f46e5]/95 to-indigo-705 rounded-xl p-5 text-white shadow relative overflow-hidden flex flex-col justify-between h-[155px]">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
            <div className="space-y-1.5">
              <span className="text-[8px] font-bold tracking-[0.15em] uppercase opacity-80 font-mono block">DIAGNOSTIC ADVICE SUMMARY</span>
              <p className="text-xs leading-relaxed font-serif font-light italic">
                "{mentorMessage}"
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[9px] font-mono opacity-80">
              <span>
                {latestEntry ? `Last Sync: ${new Date(latestEntry.date).toLocaleDateString()}` : "No telemetry logs found"}
              </span>
              <button
                onClick={() => onNavigateTab("coach")}
                className="font-bold uppercase hover:underline flex items-center gap-0.5 cursor-pointer text-indigo-100 text-[10px]"
              >
                Inquire Coach →
              </button>
            </div>
          </div>

          {/* Recently Discovered Stress Triggers Panel - High Density with low max-height */}
          <div id="triggers-summary-panel" className="bg-white rounded-xl p-4.5 border border-slate-100 shadow-sm flex flex-col h-[180px]">
            <div className="mb-2.5 flex justify-between items-center">
              <div>
                <h4 className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">PSYCHOLOGICAL IMPEDANCES</h4>
                <p className="text-[10px] text-slate-400">Active stress channels flagged by Gemini.</p>
              </div>
              <span className="text-[9px] font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                {recentlyDetectedTriggers.length} Blockers
              </span>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[125px] pr-1">
              {recentlyDetectedTriggers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">No telemetry indicators available. Try recording a journal first.</span>
                </div>
              ) : (
                recentlyDetectedTriggers.map((t, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100/60 hover:bg-slate-100/40 transition-all">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-xs font-semibold text-slate-700">{t.trigger}</p>
                      <p className="text-[9px] text-slate-400 truncate max-w-[280px]">{t.description}</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded-md">{t.score}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry History Logs Feed (col-span-5) - REDESIGNED FIXED MAX SCROLL */}
        <div className="lg:col-span-5 bg-white rounded-xl p-4.5 border border-slate-100 shadow-sm flex flex-col justify-between h-[350px]">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
              <div>
                <h3 className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">STUDENT CHRONOLOGY</h3>
                <p className="text-[10px] text-slate-400">Archived daily logs & telemetry records.</p>
              </div>
              <span className="text-[9px] font-bold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                {entries.length} Logs
              </span>
            </div>

            {entries.length > 0 && (
              <div className="space-y-1.5 mb-2 pb-2.5 border-b border-slate-50">
                {/* Risk profile filters - Condensed */}
                <div className="flex items-center gap-1 text-[9px]">
                  <span className="text-[8px] font-mono uppercase text-slate-400 tracking-wider w-14 text-left shrink-0">Pacing Risk:</span>
                  <div className="flex flex-wrap gap-1 items-center">
                    <button
                      onClick={() => setSelectedRisk("All")}
                      className={`px-1.5 py-0.2 text-[8px] font-mono rounded border transition-all cursor-pointer
                        ${selectedRisk === "All" 
                          ? "bg-slate-900 border-slate-900 text-white font-bold" 
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-850"}`}
                    >
                      All
                    </button>
                    {(["High", "Medium", "Low"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedRisk(r)}
                        className={`px-1.5 py-0.2 text-[8px] font-mono rounded border transition-all cursor-pointer flex items-center gap-0.5
                          ${selectedRisk === r 
                            ? "bg-indigo-600 border-indigo-600 text-white font-bold" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:text-indigo-650"}`}
                      >
                        {r === "High" ? "🔥 H" : r === "Medium" ? "⚡ M" : "🟢 L"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic AI detected pattern filters - Condensed */}
                {dynamicPatterns.length > 0 && (
                  <div className="flex items-center gap-1 text-[9px]">
                    <span className="text-[8px] font-mono uppercase text-slate-400 tracking-wider w-14 text-left shrink-0">Mood Tag:</span>
                    <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto pr-1">
                      <button
                        onClick={() => setSelectedPattern("All")}
                        className={`px-1.5 py-0.2 text-[8px] font-mono rounded border transition-all cursor-pointer
                          ${selectedPattern === "All" 
                            ? "bg-slate-900 border-slate-900 text-white font-bold" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-850"}`}
                      >
                        All
                      </button>
                      {dynamicPatterns.slice(0, 3).map((pat) => (
                        <button
                          key={pat}
                          onClick={() => setSelectedPattern(pat)}
                          className={`px-1.5 py-0.2 text-[8px] font-mono rounded border transition-all cursor-pointer
                            ${selectedPattern === pat 
                              ? "bg-indigo-600 border-indigo-600 text-white font-bold" 
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-850"}`}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-100 flex-1 flex flex-col justify-center items-center">
              <BookOpen className="w-5 h-5 text-slate-300 mb-1" />
              <p className="text-[10px] text-slate-400 font-mono">Archive Empty</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center p-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 flex-1 flex flex-col justify-center">
              <AlertCircle className="w-4 h-4 text-slate-300 mx-auto mb-1" />
              <p className="text-[9px] text-slate-450 font-mono">No matching telemetry diaries.</p>
              <button
                onClick={() => {
                  setSelectedRisk("All");
                  setSelectedPattern("All");
                }}
                className="mt-2.5 self-center px-2 py-0.5 bg-slate-150 hover:bg-slate-200 text-[8px] font-mono font-bold uppercase rounded cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            /* SCROLLABLE FEED - FIXED MAX HEIGHT PREVENTS ENHANCED SCROLLING */
            <div className="divide-y divide-slate-100 max-h-[175px] overflow-y-auto pr-1 flex-1">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-1.5 group">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-700 font-mono">
                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`inline-block px-1 py-0.2 rounded text-[7px] font-bold font-mono uppercase
                        ${entry.analysis?.burnoutRisk === "High" ? "bg-red-50 text-red-700" : entry.analysis?.burnoutRisk === "Medium" ? "bg-orange-50 text-orange-700" : "bg-emerald-55 text-emerald-705"}`}
                      >
                        {entry.analysis?.burnoutRisk || "Low"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-455 truncate">
                      {entry.text}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 block uppercase font-bold">STRESS</span>
                      <span className="text-[9px] font-bold text-slate-700">{entry.scores.stress}%</span>
                    </div>
                    <div className="w-px h-4 bg-slate-100" />
                    <button
                      onClick={() => onSelectEntry(entry)}
                      className="px-2 py-0.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 text-[9px] font-bold text-indigo-650 hover:text-indigo-700 rounded transition-all uppercase cursor-pointer"
                    >
                      Inquire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
