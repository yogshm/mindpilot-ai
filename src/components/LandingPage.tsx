import React from "react";
import { Brain, Flame, Activity, ShieldAlert, FileText, Sparkles, TrendingUp, Compass } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div id="landing-page" className="min-h-screen bg-[#F9FAFB] text-slate-900 selection:bg-brand-50 selection:text-brand-900 overflow-x-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-slate-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />

      {/* Hero section */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-24 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 text-slate-500 text-[10px] font-bold font-mono tracking-widest uppercase mb-8 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          <span>SUPPORTING NEET, JEE, CAT, GATE, UPSC & CUET</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-[3.5rem] font-light tracking-tight text-slate-800 font-serif leading-[1.12] max-w-4xl mx-auto"
        >
          Your AI <span className="font-semibold italic text-indigo-600">Wellness Companion</span> for High-Stakes Exam Success
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-md md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-sans"
        >
          Identify hidden stress triggers, predict burnout levels, and build resilient study habits. Don't let high-stakes exam pressure compromise your mental wellness.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            id="cta-start-tracking text-xs font-semibold"
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900 text-white font-semibold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2 cursor-pointer border border-transparent"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Sign In with Google</span>
          </button>
          <a
            href="#features-section"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-slate-600 font-semibold text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Learn More
          </a>
        </motion.div>
      </div>

      {/* Feature Grid */}
      <div id="features-section" className="bg-white border-t border-slate-100 py-28 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Engineered for Aspirants</h2>
            <h3 className="text-3xl font-light text-slate-800 font-serif">
              Specifically Crafted for Competitive Preparation
            </h3>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Unlike generic mood logs, MindPilot AI translates daily preparation stress into actionable cognitive recovery directives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div id="feature-burnout" className="p-8 rounded-[2rem] border border-slate-100 bg-[#F9FAFB] hover:bg-white hover:border-slate-200 transition-all hover:shadow-xl hover:shadow-indigo-100/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans mb-2">Burnout Detection</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Calculate low, medium, and high burnout probabilities based on sleep hours, study load, and daily emotional language logs.
              </p>
              <div className="mt-auto pt-2 text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest">
                ● Risk Predictor
              </div>
            </div>

            {/* Feature 2 */}
            <div id="feature-triggers" className="p-8 rounded-[2rem] border border-slate-100 bg-[#F9FAFB] hover:bg-white hover:border-slate-200 transition-all hover:shadow-xl hover:shadow-indigo-100/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans mb-2">Stress Trigger Analysis</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Identifies peer comparison, family expectations, mock test anxieties, and exam syllabus dread with recommended micro-actions.
              </p>
              <div className="mt-auto pt-2 text-[10px] font-mono text-orange-500 font-bold uppercase tracking-widest">
                ● Trigger Isolation
              </div>
            </div>

            {/* Feature 3 */}
            <div id="feature-companion" className="p-8 rounded-[2rem] border border-slate-100 bg-[#F9FAFB] hover:bg-white hover:border-slate-200 transition-all hover:shadow-xl hover:shadow-indigo-100/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans mb-2">AI Companion</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                An empathetic mentor companion that details when to shift from heavy topic mastery to light retrieval practice and active revision.
              </p>
              <div className="mt-auto pt-2 text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-widest">
                ● Personalized Mentor
              </div>
            </div>

            {/* Feature 4 */}
            <div id="feature-heatmaps" className="p-8 rounded-[2rem] border border-slate-100 bg-[#F9FAFB] hover:bg-white hover:border-slate-200 transition-all hover:shadow-xl hover:shadow-indigo-100/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/50 text-indigo-700 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans mb-2">Emotional Heatmaps</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Visualize motivation, fatigue, stress levels, confidence, and focus indices over time. Uncover cognitive performance patterns.
              </p>
              <div className="mt-auto pt-2 text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-widest">
                ● Trend Visualization
              </div>
            </div>

            {/* Feature 5 */}
            <div id="feature-calm" className="p-8 rounded-[2rem] border border-slate-100 bg-[#F9FAFB] hover:bg-white hover:border-slate-200 transition-all hover:shadow-xl hover:shadow-indigo-100/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans mb-2">Emergency Calm Mode</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Instant physiological distress handler with 60s guided breath metrics, positive affirmations list, and sudden anxiety reduction loops.
              </p>
              <div className="mt-auto pt-2 text-[10px] font-mono text-red-600 font-bold uppercase tracking-widest">
                ● Emergency Support
              </div>
            </div>

            {/* Feature 6 */}
            <div id="feature-weekly" className="p-8 rounded-[2rem] border border-slate-100 bg-[#F9FAFB] hover:bg-white hover:border-slate-200 transition-all hover:shadow-xl hover:shadow-indigo-100/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans mb-2">Weekly Wellness Reports</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Compile weekly logs to review stress percentage differences, motivation gains, and personalized weekend rest recommendations.
              </p>
              <div className="mt-auto pt-2 text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-widest">
                ● Summary Analytics
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-16 text-center text-[10px] font-mono text-slate-400 tracking-widest uppercase relative z-10">
        <p>© 2026 MindPilot AI Companion. Dedicated to Student Exam Wellness.</p>
        <p className="mt-2 text-slate-400">All student journaling history is persisted securely inside local offline memory.</p>
      </footer>
    </div>
  );
}
