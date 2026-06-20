import React, { useState, useEffect } from "react";
import { Sparkles, Brain, RefreshCw, AlertCircle, TrendingUp, Compass, CheckCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { aiService } from "../services/ai";

interface PatternDiscoveryProps {
  entries: any[];
  moodLogs?: any[];
}

interface DiscoveredPattern {
  pattern: string;
  confidence: number;
  details: string;
  recommendation: string;
}

export default function PatternDiscovery({ entries, moodLogs = [] }: PatternDiscoveryProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [discovered, setDiscovered] = useState<DiscoveredPattern[]>([]);

  const handlePatternDiscovery = async () => {
    if (entries.length === 0) {
      setErrorMsg("Please submit at least one daily journal log before discovering preparation patterns.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const data = await aiService.discoverEmotionalPatterns(entries, moodLogs);
      setDiscovered(data.patterns || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Pattern scanner returned an error. Loading clinical defaults instead.");
      setDiscovered([
        {
          pattern: "Stress levels spike before mock test schedules",
          confidence: 88,
          details: "Self-criticism tags and high workload metrics cluster aggressively on mock test preparation cycles.",
          recommendation: "Dedicate the final 2 hours before mock tests strictly to formula visualization or light walkouts."
        },
        {
          pattern: "Subject Confidence shifts based on bed sleep limits",
          confidence: 76,
          details: "Logging restricted sleep hours directly cascades into performance memory deficits inside subsequent journals.",
          recommendation: "Adopt a strict 7-hour minimum sleep policy to secure maximum daytime retrieval stamina."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Visual Header card */}
      <div className="p-8 rounded-[2rem] bg-indigo-950 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-900">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/10">
            <Lightbulb className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-light font-serif text-slate-100">Emotional Pattern Diagnostics</h3>
            <p className="text-slate-300 text-xs mt-1 max-w-lg leading-relaxed font-sans">
              MindPilot parses your historical journal logs to pinpoint hidden correlations between sleep habits, test dates, pre-exam nervousness, and core confidence levels.
            </p>
          </div>
        </div>

        <button
          onClick={handlePatternDiscovery}
          disabled={loading || entries.length === 0}
          className="px-6 py-3.5 bg-indigo-650 hover:bg-slate-900 duration-150 font-bold uppercase text-[10px] tracking-wider font-mono rounded-full cursor-pointer flex items-center gap-2 text-white shrink-0 disabled:opacity-50 shadow-md"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning Historical Logs...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              <span>Map Behavioral Patterns</span>
            </>
          )}
        </button>
      </div>

      {entries.length === 0 && (
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-700 text-xs flex items-center gap-2 max-w-xl mx-auto font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Note: You must record daily journals first before diagnostic intelligence can evaluate preparation trends.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-mono max-w-xl mx-auto">
          {errorMsg}
        </div>
      )}

      <AnimatePresence mode="wait">
        {discovered && discovered.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {discovered.map((ptn, idx) => (
              <div
                key={idx}
                className="p-8 rounded-[2rem] bg-white border border-slate-150 shadow-sm flex flex-col justify-between space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 font-mono">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Trend Index #{idx + 1}</span>
                    <span className="px-2.5 py-0.5 rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-650 text-[9px] font-bold">
                      🔥 Confidence {ptn.confidence}%
                    </span>
                  </div>

                  <h4 className="text-md font-semibold text-slate-800 font-sans leading-snug">
                    {ptn.pattern}
                  </h4>
                  <p className="text-slate-500 text-xs mt-2.5 font-sans leading-relaxed font-light">
                    {ptn.details}
                  </p>
                </div>

                <div className="p-4 bg-[#F9FAFB] border border-slate-200/50 rounded-2xl">
                  <h5 className="text-[10px] uppercase font-mono text-[#4f46e5] tracking-widest font-bold mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-550" />
                    <span>Preventative Counsel</span>
                  </h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-light">
                    {ptn.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="min-h-[280px] border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col justify-center items-center p-8 text-center bg-transparent">
            <Brain className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
            <h4 className="text-slate-500 font-light text-sm font-sans">Pattern Core Empty</h4>
            <p className="text-xs text-slate-300 max-w-xs mt-2 leading-relaxed">
              Click **Map Behavioral Patterns** to let the Counselor agent analyze the sleep/motivation dockets of your historical preparation diaries and return exact insights.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
