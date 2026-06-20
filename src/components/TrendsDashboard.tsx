import React from "react";
import { JournalEntry, MentalScores } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Activity, Flame, TrendingUp, AlertCircle, Compass, ShieldCheck } from "lucide-react";

interface TrendsDashboardProps {
  entries: JournalEntry[];
}

export default function TrendsDashboard({ entries }: TrendsDashboardProps) {
  // Format entries for Recharts. Note: we reverse so dates are chronologically ascending (left to right)
  const chartData = [...entries].reverse().map((entry) => {
    const d = new Date(entry.date);
    return {
      dateStr: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      stress: entry.scores.stress,
      motivation: entry.scores.motivation,
      focus: entry.scores.focus,
      confidence: entry.scores.confidence,
      energy: entry.scores.energy || 50
    };
  });

  // Calculate overall averages
  const calculateAverage = (key: keyof MentalScores): number => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, curr) => acc + (curr.scores[key] || 0), 0);
    return Math.round(sum / entries.length);
  };

  const averages = {
    stress: calculateAverage("stress"),
    motivation: calculateAverage("motivation"),
    focus: calculateAverage("focus"),
    confidence: calculateAverage("confidence"),
    energy: calculateAverage("energy")
  };

  // Format today's latest comparison vs historical averages for Radar
  const latestEntry = entries[0] || null;
  const latestScores = latestEntry?.scores || {
    stress: 0,
    motivation: 0,
    focus: 0,
    confidence: 0,
    energy: 50
  };

  const radarData = [
    { subject: "Stress Level", latest: latestScores.stress, average: averages.stress },
    { subject: "Motivation", latest: latestScores.motivation, average: averages.motivation },
    { subject: "Focus", latest: latestScores.focus, average: averages.focus },
    { subject: "Confidence", latest: latestScores.confidence, average: averages.confidence },
    { subject: "Energy", latest: latestScores.energy || 50, average: averages.energy }
  ];

  return (
    <div id="trends-dashboard-view" className="space-y-8 animate-fadeIn">
      <div className="space-y-2">
        <h3 className="text-2xl font-light font-serif text-slate-800">Telemetry & Preparation Trends</h3>
        <p className="text-slate-400 text-xs font-sans">
          A modular view of your exam-wellness progress index indicators mapped chronologically over prior preparation logs.
        </p>
      </div>

      {chartData.length < 2 ? (
        <div className="p-12 text-center bg-transparent border border-slate-200 border-dashed rounded-[2.5rem] min-h-[400px] flex flex-col justify-center items-center space-y-4">
          <Activity className="w-10 h-10 text-slate-300 animate-pulse" />
          <h4 className="text-slate-600 font-light text-sm font-sans">Awaiting Metric Accumulations</h4>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Please log at least 2 daily entries in the Daily Journal panel to start compiling linear emotional trends, stress fluctuations, and preparation maps.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main linear chronological trend chart */}
          <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono">Pacing Chronology Index</h4>
                <p className="text-slate-400 text-xs mt-1">Correlation of daily subjective stress, mental focus stability, and confidence.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-mono bg-slate-100/80 px-3.5 py-1.5 rounded-full text-slate-500 font-bold border border-slate-200">
                <TrendingUp className="w-3 h-3 text-[#4f46e5]" />
                <span>Active Trend Line Graph</span>
              </div>
            </div>

            {/* Recharts chart */}
            <div className="w-full h-80 pt-4 text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dateStr" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(255, 255, 255, 0.98)", 
                      borderRadius: "16px", 
                      border: "1px solid #e1e8ed",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.03)"
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#1e293b", fontFamily: "sans-serif" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" name="Stress (lower is better)" dataKey="stress" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Motivation" dataKey="motivation" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" name="Focus Stability" dataKey="focus" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" name="Confidence" dataKey="confidence" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Cognitive Balance radar comparison chart */}
          <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm lg:col-span-4 flex flex-col justify-between space-y-6">
            <div>
              <h4 className="text-xs font-bold tracking-widest text-[#4f46e5] uppercase font-mono">Active Contrast</h4>
              <h3 className="text-md text-slate-700 italic font-serif mt-1">Today vs. Historical Ideal</h3>
              <p className="text-slate-400 text-xs mt-1">Direct map of your newest logged parameters versus overall study norms.</p>
            </div>

            <div className="w-full h-64 flex items-center justify-center font-mono text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(255, 255, 255, 0.98)", 
                      borderRadius: "16px", 
                      border: "1px solid #e1e8ed"
                    }}
                  />
                  <Radar name="Active Day Latest" dataKey="latest" stroke="#6366f1" fill="#818cf8" fillOpacity={0.25} />
                  <Radar name="Aspirational Average" dataKey="average" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.1} />
                  <Legend verticalAlign="bottom" height={24} iconType="square" />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed bg-[#F9FAFB] p-4 rounded-2xl border border-slate-200 font-sans font-light">
              🌟 **Directive**: Ideal state maintains high **Focus & Confidence** while keeping **Stress** lower than 55%. If stress peaks, use active retrieving or meditation loops.
            </p>
          </div>

        </div>
      )}

      {/* Numerical Metrics Summary Block Grid */}
      <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
        <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono mb-6">Historical Telemetry Overview</h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Avg Prep Stress</span>
            <span className="text-3xl font-light text-slate-800 font-sans block mt-1">{averages.stress}%</span>
            <p className="text-[9px] text-red-400 font-mono">Deflection: ±12%</p>
          </div>
          <div className="space-y-1 border-l border-slate-100 pl-4 md:pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Avg Motivation</span>
            <span className="text-3xl font-light text-slate-800 font-sans block mt-1">{averages.motivation}%</span>
            <p className="text-[9px] text-emerald-500 font-mono">Deflection: ±9%</p>
          </div>
          <div className="space-y-1 border-l border-slate-100 pl-4 md:pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Avg Focus Stability</span>
            <span className="text-3xl font-light text-slate-800 font-sans block mt-1">{averages.focus}%</span>
            <p className="text-[9px] text-indigo-500 font-mono">Optimal logging active</p>
          </div>
          <div className="space-y-1 border-l border-slate-100 pl-4 md:pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Avg Prep Confidence</span>
            <span className="text-3xl font-light text-slate-800 font-sans block mt-1">{averages.confidence}%</span>
            <p className="text-[9px] text-slate-400 font-mono">Target: &gt;70%</p>
          </div>
          <div className="space-y-1 border-l border-slate-100 pl-4 md:pl-6 col-span-2 lg:col-span-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Energy Index</span>
            <span className="text-3xl font-light text-slate-800 font-sans block mt-1">{averages.energy || 50}%</span>
            <p className="text-[9px] text-slate-400 font-mono">Rest indicators synchronized</p>
          </div>
        </div>
      </div>
    </div>
  );
}
