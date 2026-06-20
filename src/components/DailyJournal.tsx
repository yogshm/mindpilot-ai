import React, { useState } from "react";
import { JournalEntry, AnalysisResult, MentalScores } from "../types";
import { Save, Brain, Sparkles, AlertCircle, RefreshCw, Clipboard, ShieldCheck, HeartPulse, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { aiService } from "../services/ai";

interface DailyJournalProps {
  onSaveNewEntry: (text: string, scores: MentalScores, analysis: AnalysisResult) => void;
  selectedEntryDetail: JournalEntry | null;
  onClearSelectedDetail: () => void;
  isLoadingAnalysis: boolean;
  setIsLoadingAnalysis: (val: boolean) => void;
}

const LOADING_PHASES = [
  "Structuring neural syntax patterns...",
  "Analyzing stress and burnout cortisol markers in vocabulary...",
  "Isolating pacing, peer, and exam-syllabus triggers...",
  "Calibrating focus stability and motivation metrics...",
  "Drafting personalized action recovery directives..."
];

export default function DailyJournal({
  onSaveNewEntry,
  selectedEntryDetail,
  onClearSelectedDetail,
  isLoadingAnalysis,
  setIsLoadingAnalysis
}: DailyJournalProps) {
  const [journalText, setJournalText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);

  // Manual rating block state to supplement AI, or let AI autodetect
  const [useManualScores, setUseManualScores] = useState(false);
  const [manualScores, setManualScores] = useState<MentalScores>({
    stress: 50,
    motivation: 65,
    focus: 60,
    confidence: 55,
    energy: 60
  });

  const runAnalysis = async () => {
    if (!journalText.trim()) {
      setErrorMsg("Please write about your day. Let us know how your study preparation was.");
      return;
    }
    setErrorMsg("");
    setIsLoadingAnalysis(true);
    setLoadingPhaseIndex(0);

    // Rotate loading phases for sleek visual feedback
    const interval = setInterval(() => {
      setLoadingPhaseIndex((prev) => (prev < LOADING_PHASES.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const parsedAnalysis = await aiService.analyzeJournalEntry(journalText);

      // Determine starting scores (weighted with manual sliders if checked)
      const finalScores = useManualScores ? manualScores : parsedAnalysis.scores;

      onSaveNewEntry(journalText, finalScores, {
        ...parsedAnalysis,
        scores: finalScores
      });
      setJournalText("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred while communicating with the AI Copilot.");
    } finally {
      clearInterval(interval);
      setIsLoadingAnalysis(false);
    }
  };

  const handleManualScoreChange = (key: keyof MentalScores, val: number) => {
    setManualScores((prev) => ({
      ...prev,
      [key]: val
    }));
  };

  // Render detail overlay/view if student clicks past logs
  const activeDetail = selectedEntryDetail;

  return (
    <div id="journal-view" className="space-y-8 animate-fadeIn">
      <AnimatePresence mode="wait">
        {activeDetail ? (
          /* PAST LOG ANALYSIS RESULTS DETAILS PANEL */
          <motion.div
            key="past-detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  onClick={onClearSelectedDetail}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-mono uppercase bg-slate-100/80 px-4 py-2 rounded-full transition-colors border border-slate-200"
                >
                  ← Return to Journal Main
                </button>
                <h3 className="text-2xl font-light font-serif text-slate-800 mt-3">
                  Telemetry Record for <span className="font-semibold italic text-slate-900">{new Date(activeDetail.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </h3>
              </div>
              <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest self-start sm:self-center
                ${activeDetail.analysis?.burnoutRisk === "High" ? "bg-red-50 text-red-700 border border-red-200" : activeDetail.analysis?.burnoutRisk === "Medium" ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
              >
                Burnout Level: {activeDetail.analysis?.burnoutRisk || "Low"}
              </span>
            </div>

            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-bold font-mono uppercase text-slate-500 tracking-wider">Historical Context</h4>
              <p className="text-slate-700 text-sm leading-relaxed italic font-serif bg-slate-50 p-6 rounded-2xl border border-slate-100">
                "{activeDetail.text}"
              </p>
            </div>

            {/* Performance Metrics Dial Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
              {Object.entries(activeDetail.scores).map(([key, val]) => (
                <div key={key} className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1">{key}</span>
                  <span className="text-3xl font-light text-slate-800 font-sans mt-2">{val}%</span>
                  <div className="mt-3 w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${key === "stress" ? "bg-red-400" : key === "motivation" ? "bg-orange-400" : key === "focus" ? "bg-indigo-400" : key === "confidence" ? "bg-emerald-400" : "bg-indigo-500"}`} 
                      style={{ width: `${val}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Structured Insights Column */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Mentoring & Recoveries */}
              <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm md:col-span-7 space-y-8">
                <div>
                  <h4 className="text-xs font-bold tracking-widest text-[#4f46e5] uppercase mb-4 font-mono">Advisor Assessment</h4>
                  <p className="text-slate-700 text-sm leading-relaxed font-sans font-light">
                    {activeDetail.analysis?.mentorMessage}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4 font-mono">Action Recovery Directives</h4>
                  <div className="space-y-3">
                    {activeDetail.analysis?.recoveryActions.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-slate-600 font-sans">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-xs font-light leading-relaxed">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stress Triggers & Concerns details */}
              <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm md:col-span-5 space-y-8">
                <div>
                  <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4 font-mono font-bold">Strain Trigger Analysis</h4>
                  <div className="space-y-3">
                    {activeDetail.analysis?.stressTriggers.map((t, idx) => (
                      <div key={idx} className="p-4 bg-[#F9FAFB] rounded-2xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800">{t.trigger}</span>
                          <span className="font-mono text-red-500 font-bold uppercase text-[9px] tracking-wider">{t.score}% Force</span>
                        </div>
                        <p className="text-slate-500 italic font-serif">"{t.description}"</p>
                        <p className="mt-2 text-indigo-600 font-medium font-mono text-[10px]">⚠️ Directive: {t.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div>
                    <h5 className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 font-mono">Sleep Assessment</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sans font-light">
                      {activeDetail.analysis?.sleepConcerns || "None detected on this date."}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold tracking-widest uppercase text-orange-500 font-mono">Procrastination Drivers</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sans font-light">
                      {activeDetail.analysis?.procrastinationTriggers || "Neutral study drive mapped."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          /* GENERAL JOURNAL LOG FORM WRAPPER */
          <motion.div
            key="journal-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Journaling form area */}
            <div className="space-y-6 lg:col-span-7">
              <div className="space-y-2">
                <h3 className="text-2xl font-light font-serif text-slate-800">Study Journal Logging</h3>
                <p className="text-slate-500 text-xs font-sans font-medium">
                  MindPilot AI isolates hidden emotional blocks, peer comparison anxiety, and fatigue pacing based on natural language keywords.
                </p>
              </div>

              <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-6">
                <div>
                  <label className="text-[13px] font-bold text-slate-700 tracking-wider block font-mono uppercase mb-1">
                    What happened today during your preparation?
                  </label>
                  <p className="text-xs text-slate-500 font-sans leading-normal font-medium">
                    Describe studied topics, hours invested, test outcomes, peer comparison speed, expectations pressure, and fatigue or physical energy levels.
                  </p>
                </div>

                <textarea
                  id="journal-textarea"
                  disabled={isLoadingAnalysis}
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="I studied 8 hours of organic chemistry but still feel like I'm behind CAT / GATE levels. Checked simulator test cutoffs and now I am doubting if I will make it. Sleep was only 5 hours..."
                  className="w-full h-56 p-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-600 leading-relaxed outline-none resize-none transition-all placeholder:text-slate-500 bg-slate-50/50"
                />

                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-mono">{errorMsg}</span>
                  </div>
                )}

                {/* Optional manually tuning card */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="toggle-manual-scale"
                      checked={useManualScores}
                      onChange={(e) => setUseManualScores(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <label htmlFor="toggle-manual-scale" className="text-xs font-semibold text-slate-500 tracking-wide cursor-pointer font-sans select-none">
                      Supplement with manual scale ratings
                    </label>
                  </div>

                  <AnimatePresence>
                    {useManualScores && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-3.5 mt-4"
                      >
                        <div className="p-6 bg-[#F9FAFB] border border-slate-100 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {Object.entries(manualScores).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                <span>{key} scale</span>
                                <span className="font-bold text-slate-700">{value}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={value}
                                onChange={(e) => handleManualScoreChange(key as keyof MentalScores, parseInt(e.target.value))}
                                className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="submit-journal-analysis"
                    disabled={isLoadingAnalysis}
                    onClick={runAnalysis}
                    className="px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all uppercase tracking-widest font-mono flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Synchronize & Analyze</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Guide sidebar instructions while loading or idle */}
            <div className="lg:col-span-5 space-y-6">
              <AnimatePresence mode="wait">
                {isLoadingAnalysis ? (
                  <motion.div
                    key="analyzing-loader"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-8 rounded-[2.5rem] bg-slate-900 text-white text-center shadow-lg relative min-h-[420px] flex flex-col justify-center items-center overflow-hidden"
                  >
                    {/* Decorative elegant background circle */}
                    <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/[0.03] rounded-full pointer-events-none" />
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-6" />
                    <h4 className="text-lg font-light font-serif tracking-tight">Consulting AI Copilot</h4>
                    
                    <p className="text-slate-300 text-[10px] font-mono uppercase tracking-widest mt-6 max-w-xs leading-relaxed">
                      {LOADING_PHASES[loadingPhaseIndex]}
                    </p>

                    <div className="absolute bottom-8 flex gap-1.5 justify-center items-center">
                      {LOADING_PHASES.map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-350 ${i === loadingPhaseIndex ? "bg-indigo-400 scale-125" : "bg-white/10"}`}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="instruction-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6"
                  >
                    <div>
                      <h4 className="text-xs font-bold tracking-widest text-[#4f46e5] uppercase mb-1.5 font-mono">Academic Telemetry</h4>
                      <h3 className="text-lg font-light text-slate-800 font-serif">Why daily logging?</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                        Standard mood trackers fail to notice critical preparation stresses like peer velocity comparisons, backlog pressure, mock test fears, or sleep duration trade-offs.
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs text-slate-600 font-sans space-y-4">
                      <div className="flex gap-3 pt-4">
                        <div className="w-5 h-5 rounded-full bg-[#f4f7fb] text-indigo-600 flex items-center justify-center font-bold font-mono text-[10px]">1</div>
                        <div>
                          <p className="font-semibold text-slate-800">Trigger Isolation</p>
                          <p className="mt-0.5 text-slate-500 leading-normal font-medium">Separates expectations panic from master pacing struggles automatically.</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <div className="w-5 h-5 rounded-full bg-[#f4f7fb] text-orange-600 flex items-center justify-center font-bold font-mono text-[10px]">2</div>
                        <div>
                          <p className="font-semibold text-slate-800">Fatigue Pacing</p>
                          <p className="mt-0.5 text-slate-500 leading-normal font-medium">Tracks cognitive stamina index to notify student when revision should replace high-stress tests.</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <div className="w-5 h-5 rounded-full bg-[#f4f7fb] text-pink-600 flex items-center justify-center font-bold font-mono text-[10px]">3</div>
                        <div>
                          <p className="font-semibold text-slate-800">Recovery Directive</p>
                          <p className="mt-0.5 text-slate-500 leading-normal font-medium">Gives solid 2-minute actionable habits to lower system stress safely.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 bg-[#F9FAFB] p-5 rounded-2xl border border-slate-200 text-[10px] font-mono text-slate-500 flex items-start gap-2 leading-normal">
                      <Clipboard className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Submitting a descriptive log unlocks higher-fidelity reports and stress isolates inside the trends panel.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
