import React from "react";
import { JournalEntry, MentalScores } from "../types";
import { AlertCircle, Flame, Calendar, BookOpen, Quote, ShieldAlert, Sparkles, Smile, ArrowUpRight, ArrowBigRight } from "lucide-react";
import { motion } from "motion/react";

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
    <div id="dashboard-overview" className="space-y-8 animate-fadeIn">
      {/* Editorial Welcome Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-xs font-bold tracking-[0.15em] text-indigo-500 uppercase mb-1.5 font-mono">MindPilot AI Companion</h1>
          <h2 className="text-3xl font-light text-slate-800 font-serif">
            Aspirant <span className="font-semibold italic text-slate-900">Workspace</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Strategic Wellness Journey • <span className="text-indigo-600 font-medium">Active Copilot Enabled</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigateTab("panic")}
            className="px-6 py-2.5 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100 hover:bg-red-150 transition-colors uppercase tracking-widest font-mono"
          >
            I need help now
          </button>
          <button
            id="tab-btn-journal"
            onClick={() => onNavigateTab("journal")}
            className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-full text-xs font-semibold hover:shadow-lg hover:shadow-indigo-100 transition-all uppercase tracking-widest font-mono"
          >
            Daily Sync
          </button>
        </div>
      </header>

      {/* Wellness Dashboard Core Metrics Grid with rounded-[2rem] */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Metric 1 - Stress Score */}
        <div id="metric-card-stress" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Stress score</span>
              <span className={`w-2.5 h-2.5 rounded-full ${currentScores.stress > 70 ? 'bg-red-500' : currentScores.stress > 48 ? 'bg-orange-400' : 'bg-emerald-400 animate-pulse'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-slate-800">
                {latestEntry ? currentScores.stress : '──'}
              </span>
              {latestEntry && (
                <span className={`text-xs ${currentScores.stress > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {currentScores.stress > 50 ? '↑ Load' : '↓ Safe'}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
              <div 
                style={{ width: latestEntry ? `${currentScores.stress}%` : '0%' }}
                className={`h-full rounded-full transition-all duration-500 ${currentScores.stress > 70 ? 'bg-red-500' : currentScores.stress > 48 ? 'bg-orange-400' : 'bg-emerald-400'}`}
              />
            </div>
            <p className="mt-2 text-[9px] text-slate-400 uppercase tracking-tight font-mono">Fatigue accumulation status</p>
          </div>
        </div>

        {/* Metric 2 - Motivation Score */}
        <div id="metric-card-motivation" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Motivation</span>
              <span className="text-indigo-400 text-xs font-mono">★</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-slate-800">
                {latestEntry ? `${currentScores.motivation}%` : '──'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-50 h-1 text-slate-800 rounded-full overflow-hidden">
              <div 
                style={{ width: latestEntry ? `${currentScores.motivation}%` : '0%' }}
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              />
            </div>
            <p className="mt-2 text-[9px] text-slate-400 uppercase tracking-tight font-mono">Academic drive momentum</p>
          </div>
        </div>

        {/* Metric 3 - Focus Score */}
        <div id="metric-card-focus" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Focus Level</span>
              <span className="text-indigo-500 text-[10px] italic font-serif">Peak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-slate-800">
                {latestEntry ? `${currentScores.focus}%` : '──'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
              <div 
                style={{ width: latestEntry ? `${currentScores.focus}%` : '0%' }}
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              />
            </div>
            <p className="mt-2 text-[9px] text-slate-400 uppercase tracking-tight font-mono">Attentiveness stability index</p>
          </div>
        </div>

        {/* Metric 4 - Confidence Score */}
        <div id="metric-card-confidence" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Confidence</span>
              <span className="text-emerald-500 text-xs font-mono">▲</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-slate-800">
                {latestEntry ? `${currentScores.confidence}%` : '──'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
              <div 
                style={{ width: latestEntry ? `${currentScores.confidence}%` : '0%' }}
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              />
            </div>
            <p className="mt-2 text-[9px] text-slate-400 uppercase tracking-tight font-mono">Recall capacity trust</p>
          </div>
        </div>

        {/* Metric 5 - Burnout Risk level card */}
        <div id="metric-card-burnout" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Burnout Risk</span>
              <Flame className={`w-4 h-4 ${currentRisk === "High" ? "text-red-500 fill-red-100 animate-pulse" : currentRisk === "Medium" ? "text-orange-400" : "text-emerald-400"}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-light ${currentRisk === "High" ? "text-red-600" : currentRisk === "Medium" ? "text-orange-500" : "text-emerald-600"}`}>
                {latestEntry ? currentRisk : '──'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider
              ${currentRisk === "High" ? "bg-red-50 text-red-700" : currentRisk === "Medium" ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}
            >
              ● {latestEntry ? currentRisk : 'Awaiting Data'}
            </span>
            <p className="mt-2 text-[9px] text-slate-400 uppercase tracking-tight font-mono">Fatigue threshold probability</p>
          </div>
        </div>
      </div>

      {/* Adaptive AI Mentor Card & Discovered Triggers split with rounded-[2.5rem] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Adaptive AI Companion Card Column */}
        <div id="mentor-companion-panel" className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden col-span-1 lg:col-span-7 flex flex-col justify-between">
          {/* Background ambient decorative coin */}
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 font-mono">Diagnostic Companion</span>
            </div>
            
            <p className="text-lg leading-snug font-serif italic font-light">
              "{mentorMessage}"
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between">
            {latestEntry ? (
              <span className="text-[10px] font-mono opacity-60">
                Last synchronized: {new Date(latestEntry.date).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-[10px] font-mono opacity-60">
                No telemetry logs detected in storage
              </span>
            )}
            <button
              onClick={() => onNavigateTab("coach")}
              className="text-[10px] font-bold tracking-widest text-white uppercase hover:underline flex items-center gap-1 font-mono"
            >
              Consult Mentor Panel →
            </button>
          </div>
        </div>

        {/* Recently Discovered Stress Triggers Panel */}
        <div id="triggers-summary-panel" className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm col-span-1 lg:col-span-5 flex flex-col">
          <div className="mb-6">
            <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Detected Mental Triggers</h4>
            <p className="text-slate-400 text-xs font-sans">Active psychological blocks found across logged cycles.</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[280px]">
            {recentlyDetectedTriggers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                <AlertCircle className="w-5 h-5 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-medium font-sans">Isolation matrix quiet</p>
                <p className="text-[10px] text-slate-400 mt-1">Daily journals trigger real-time mapping.</p>
              </div>
            ) : (
              recentlyDetectedTriggers.map((t, idx) => (
                <div key={idx} className="p-4 bg-[#F9FAFB] rounded-2xl flex items-center justify-between border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-700">{t.trigger}</p>
                    <p className="text-[10px] text-slate-400">{t.description}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{t.score}%</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Previous logs of daily records */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-150 mb-6">
          <div>
            <h3 className="text-lg font-medium text-slate-800">Telemetry History Logs</h3>
            <p className="text-slate-400 text-xs mt-1">Analytical records of previous preparation cycles.</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 self-start lg:self-auto">
            {filteredEntries.length === entries.length ? `${entries.length} Logs` : `Found ${filteredEntries.length} of ${entries.length} Logs`}
          </span>
        </div>

        {entries.length > 0 && (
          <div className="space-y-4 mb-6">
            {/* Risk profile filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 items-start text-xs border-b border-dashed border-slate-100 pb-3">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-400 w-28 text-left shrink-0">Pacing Risk:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRisk("All")}
                  className={`px-3 py-1 text-[10px] font-bold uppercase font-mono rounded-full border transition-all cursor-pointer
                    ${selectedRisk === "All" 
                      ? "bg-slate-900 border-slate-900 text-white font-semibold" 
                      : "bg-[#F9FAFB] border-slate-200 text-slate-500 hover:text-slate-800"}`}
                >
                  All Risks
                </button>
                {(["High", "Medium", "Low"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRisk(r)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase font-mono rounded-full border transition-all cursor-pointer flex items-center gap-1
                      ${selectedRisk === r 
                        ? "bg-indigo-600 border-indigo-600 text-white font-semibold" 
                        : "bg-[#F9FAFB] border-slate-200 text-slate-500 hover:text-slate-800"}`}
                  >
                    <span>{r === "High" ? "🔥 High" : r === "Medium" ? "⚡ Medium" : "🟢 Low"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic AI detected pattern filters */}
            {dynamicPatterns.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 items-start text-xs pb-1">
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-400 w-28 text-left shrink-0">AI Mood Label:</span>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                  <button
                    onClick={() => setSelectedPattern("All")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase font-mono rounded-full border transition-all cursor-pointer
                      ${selectedPattern === "All" 
                        ? "bg-slate-900 border-slate-900 text-white font-semibold" 
                        : "bg-[#F9FAFB] border-slate-200 text-slate-500 hover:text-slate-800"}`}
                  >
                    All AI Moods
                  </button>
                  {dynamicPatterns.map((pat) => (
                    <button
                      key={pat}
                      onClick={() => setSelectedPattern(pat)}
                      className={`px-3 py-1 text-[10px] font-mono rounded-full border transition-all cursor-pointer flex items-center gap-1
                        ${selectedPattern === pat 
                          ? "bg-indigo-600 border-indigo-600 text-white font-semibold" 
                          : "bg-[#F9FAFB] border-slate-200 text-slate-500 hover:text-indigo-600"}`}
                    >
                      <span>🧠 {pat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {entries.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h4 className="text-slate-500 font-medium text-sm">Quiet Archive</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Your previous daily logs and emotional mappings are stored here. Begin logging entries to populate database archives.
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center p-12 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 min-h-[200px] flex flex-col justify-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-slate-500 font-mono uppercase">No Matching Historical Logs</h4>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
              No entries in the local directory match current filters. Try resetting the stress risk profile or mood label.
            </p>
            <button
              onClick={() => {
                setSelectedRisk("All");
                setSelectedPattern("All");
              }}
              className="mt-4 self-center px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] uppercase font-bold tracking-wider font-mono rounded-full transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-2">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 group">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-700 font-mono">
                      {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                      ${entry.analysis?.burnoutRisk === "High" ? "bg-red-50 text-red-700" : entry.analysis?.burnoutRisk === "Medium" ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      ● Risk: {entry.analysis?.burnoutRisk || "Low"}
                    </span>
                    
                    {/* Tiny badges for dynamic patterns */}
                    <div className="hidden sm:flex flex-wrap gap-1">
                      {entry.analysis?.detectedPatterns?.slice(0, 2).map((p, idx) => (
                        <span key={idx} className="bg-slate-50 text-slate-500 border border-slate-100 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {entry.text}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 justify-between md:justify-end">
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="text-[9px] uppercase font-bold tracking-widest font-mono text-slate-400">Stress</div>
                      <div className="text-xs font-bold text-slate-700 font-mono mt-0.5">{entry.scores.stress}%</div>
                    </div>
                    <div className="text-right border-l border-slate-100 pl-4">
                      <div className="text-[9px] uppercase font-bold tracking-widest font-mono text-slate-400">Focus</div>
                      <div className="text-xs font-bold text-slate-700 font-mono mt-0.5">{entry.scores.focus}%</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectEntry(entry)}
                    className="px-4 py-2 bg-[#F9FAFB] hover:bg-slate-100 text-[10px] uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-700 rounded-full transition-colors border border-slate-100 cursor-pointer"
                  >
                    Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
