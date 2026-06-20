import React, { useState, useEffect } from "react";
import { AlertOctagon, Heart, Music, Check, Compass, Shield, Wind, Sparkles, AlertTriangle, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PanicIntervention } from "../types";

export default function PanicMode() {
  const [panicIntervention, setPanicIntervention] = useState<PanicIntervention | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActiveCycle, setIsActiveCycle] = useState(false);
  const [speakingText, setSpeakingText] = useState(false);

  // Breathing timer states
  const [cyclePhase, setCyclePhase] = useState<"Inhale" | "Hold (Full)" | "Exhale" | "Hold (Empty)">("Inhale");
  const [secondsRemaining, setSecondsRemaining] = useState(4);

  const speakReassurance = async (text: string) => {
    if (speakingText) {
      window.speechSynthesis.cancel();
      setSpeakingText(false);
      return;
    }

    setSpeakingText(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      if (data && !data.fallback) {
        const audioRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        const blob = await audioRes.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setSpeakingText(false);
        audio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setSpeakingText(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingText(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const triggerPanicRelief = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/emergency-panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      setPanicIntervention(data);
    } catch (err) {
      console.error("Failed to query custom panic intervention, setting client local defaults:", err);
      // Resilience fallback
      setPanicIntervention({
        breathingGuide: {
          title: "60-Second Box Resettlement",
          description: "A clinical box breathing standard used to quickly lower heart rate and reduce cortisol spikes.",
          steps: [
            "Inhale quietly through your nose for 4 seconds.",
            "Hold your lungs full of air for 4 seconds.",
            "Exhale gently through your mouth, parting your lips, for 4 seconds.",
            "Hold your lungs completely empty for 4 seconds before the next repetition."
          ]
        },
        affirmations: [
          "This moment is tough, but I am tougher than this single page or test.",
          "My worth as a human is entirely independent of my mock test scores.",
          "Panic is just an energy rush. I can let it step through me and dissolve slowly.",
          "I have worked hard and I am safe right now."
        ],
        immediateActions: [
          "Push your chair back and place both feet flat on the floor.",
          "Take a glass of cool water and sip it slowly, focusing on the temperature.",
          "Gently look around you and name 5 things you can physically see, 4 things you can touch, and 3 things you can hear."
        ],
        shortTermMessage: "You are experiencing high exam-anxiety. Please remember: No single test determines the ultimate flow of your life. Take this evening entirely off. Your cognitive health is your absolute greatest exam asset."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Immediate cycle executor
  useEffect(() => {
    if (!isActiveCycle) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Switch phase
          setCyclePhase((currPhase) => {
            if (currPhase === "Inhale") return "Hold (Full)";
            if (currPhase === "Hold (Full)") return "Exhale";
            if (currPhase === "Exhale") return "Hold (Empty)";
            return "Inhale";
          });
          return 4; // Reset to 4 seconds box standard
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActiveCycle]);

  const toggleBreathingExercise = () => {
    if (!isActiveCycle) {
      setSecondsRemaining(4);
      setCyclePhase("Inhale");
    }
    setIsActiveCycle(!isActiveCycle);
  };

  return (
    <div id="panic-mode-container" className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Alert Header Cover */}
      <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100/60 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6 shrink-0 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-light font-serif text-red-955">Academic Stress or Panic?</h3>
            <p className="text-red-700 text-xs mt-1 max-w-lg leading-relaxed">
              If your heart rate is racing, mock tests have triggered doubt, or syllabus backlog is causing chest tightness, take a dynamic reset.
            </p>
          </div>
        </div>

        <button
          id="trigger-panic-mode-btn"
          disabled={isLoading}
          onClick={triggerPanicRelief}
          className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-widest font-mono shadow-lg transition-all shrink-0 cursor-pointer self-center md:self-auto"
        >
          {isLoading ? "Preparing Relief..." : "I Need Help Now"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {panicIntervention && (
          <motion.div
            key="relief-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
          >
            {/* Box Breathing Visualizer Panel */}
            <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm md:col-span-6 flex flex-col items-center justify-center text-center space-y-6">
              <div>
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block">Respiratory Pacer</span>
                <h4 className="text-lg font-light text-slate-800 font-serif mt-1">{panicIntervention.breathingGuide.title}</h4>
              </div>

              {/* Animated scaling ring circle simulation */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Visual pulsating circles */}
                <motion.div
                  animate={{
                    scale: cyclePhase === "Inhale" ? [1, 1.25] : cyclePhase === "Hold (Full)" ? 1.25 : cyclePhase === "Exhale" ? [1.25, 1] : 1,
                    opacity: cyclePhase === "Inhale" ? [0.2, 0.4] : cyclePhase === "Hold (Full)" ? 0.45 : cyclePhase === "Exhale" ? [0.45, 0.2] : 0.15
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-indigo-500/20 pointer-events-none"
                />
                
                <div className="absolute w-36 h-36 rounded-full bg-white border border-slate-100 shadow-lg flex flex-col items-center justify-center z-10 p-3">
                  <Wind className="w-6 h-6 text-indigo-500 mb-1" />
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold mb-0.5">
                    {secondsRemaining}s
                  </span>
                  <span className="text-xs font-semibold text-slate-800 transition-all uppercase tracking-wider font-mono">
                    {isActiveCycle ? cyclePhase : "Awaiting"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 w-full">
                <button
                  id="toggle-breathing-pacer"
                  onClick={toggleBreathingExercise}
                  className={`w-full py-3.5 rounded-full text-xs font-semibold uppercase font-mono tracking-widest transition-all border
                    ${isActiveCycle ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-950 text-white border-transparent shadow shadow-slate-900/30"}`}
                >
                  {isActiveCycle ? "Pause Guided Pacer" : "Start Box Breathing"}
                </button>

                <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto font-sans">
                  {panicIntervention.breathingGuide.description}
                </p>
              </div>

              {/* Steps display list */}
              <div className="w-full text-left bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-xs space-y-3 font-sans text-slate-600 font-light">
                {panicIntervention.breathingGuide.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-[#f4f7fb] text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reassurances, Affirmations and Steps Panel */}
            <div className="space-y-6 md:col-span-6">
              
              {/* Short message bar */}
              <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-xl pointer-events-none" />
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-[9px] font-mono uppercase text-slate-300 tracking-widest block font-bold">Academic Reassurance</h5>
                  <button
                    onClick={() => speakReassurance(panicIntervention.shortTermMessage)}
                    className="p-1 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 duration-100"
                  >
                    <Volume2 className={`w-3 h-3 ${speakingText ? 'animate-bounce' : ''}`} />
                    <span>{speakingText ? 'Silence' : 'Sooth'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-light font-sans">
                  {panicIntervention.shortTermMessage}
                </p>
              </div>

              {/* Grounding physical actions list */}
              <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                <h4 className="text-xs font-bold tracking-widest text-[#4f46e5] uppercase mb-4 font-mono">Immediate Grounding Steps</h4>
                <div className="space-y-3 font-sans">
                  {panicIntervention.immediateActions.map((action, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs text-slate-500 font-light tracking-wide leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restorative Affirmations Cards */}
              <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4 font-mono">Cognitive Assertions</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {panicIntervention.affirmations.map((affirmation, i) => (
                    <div key={i} className="text-xs p-4 rounded-2xl bg-pink-50/20 border border-pink-100/30 text-slate-600 italic font-serif leading-relaxed">
                      "{affirmation}"
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
