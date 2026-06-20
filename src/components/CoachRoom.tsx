import React, { useState } from "react";
import { JournalEntry, MentalScores } from "../types";
import { Compass, Sparkles, Send, Award, Smile, BookOpen, AlertCircle, RefreshCw, Zap, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CoachRoomProps {
  latestEntry: JournalEntry | null;
}

interface CoachResponse {
  advice: string;
  plan: string[];
  exerciseTitle: string;
  exercise: string;
}

export default function CoachRoom({ latestEntry }: CoachRoomProps) {
  const [userQuery, setUserQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [coachResponse, setCoachResponse] = useState<CoachResponse | null>(null);
  const [playingTTS, setPlayingTTS] = useState(false);

  const triggerSpeechSynthesis = async (speechText: string) => {
    if (playingTTS) {
      window.speechSynthesis.cancel();
      setPlayingTTS(false);
      return;
    }

    setPlayingTTS(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: speechText })
      });
      const data = await response.json();
      if (data && !data.fallback) {
        const audioRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: speechText })
        });
        const blob = await audioRes.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setPlayingTTS(false);
        audio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.onend = () => setPlayingTTS(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.onend = () => setPlayingTTS(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const defaultScores: MentalScores = latestEntry?.scores || {
    stress: 30,
    motivation: 80,
    focus: 85,
    confidence: 70,
    energy: 75
  };

  const currentJournalText = latestEntry?.text || "No recent study logs found yet. Log some files inside the Daily Journal tab first.";

  const requestWellnessDirections = async () => {
    if (!userQuery.trim()) {
      setErrorMsg("Please formulate your query about your study stress, burnout, or backlog anxieties.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStateText: currentJournalText,
          scores: defaultScores,
          userMessage: userQuery
        })
      });

      if (!response.ok) {
        throw new Error("Failed to receive coaching directive. Please try again.");
      }

      const parsed: CoachResponse = await response.json();
      setCoachResponse(parsed);
      setUserQuery("");
    } catch (err: any) {
      setErrorMsg("Failed to query the AI Coach Specialist. Returning default coping guidelines.");
      setCoachResponse({
        advice: "Consistency in NEET/JEE preparation is a slow marathon. Allocate a 10-minute quiet environment walking session to reduce cognitive exhaustion.",
        plan: [
          "Establish focus by removing phone distraction apps during physical blocks.",
          "Write down exactly one formula you solved without notes today.",
          "Shut down screens completely by 11:00 PM today to safeguard memory consolidations."
        ],
        exerciseTitle: "Rapid Context De-Cluttering (3-Min Breathing)",
        exercise: "Close your eyes. Inhale gently for 4s, pause for 4s, and exhale comfortably for 6s. Repeat twice. Now focus solely on today's single task."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="coach-room-container" className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* State Badge indicator */}
      <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">Preparation Telemetry</span>
          <h4 className="text-sm font-medium text-slate-800 mt-1.5 flex items-center gap-2">
            <span>MindPilot Copilot is Synchronized</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          </h4>
        </div>
        
        <div className="flex gap-5 self-start md:self-auto">
          <div className="text-right font-mono">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">STRESS LOAD</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">{defaultScores.stress}%</span>
          </div>
          <div className="text-right border-l border-slate-100 pl-5 font-mono">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">MOTIVATION</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">{defaultScores.motivation}%</span>
          </div>
          <div className="text-right border-l border-slate-100 pl-5 font-mono">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">FOCUS INDEX</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">{defaultScores.focus}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Ask your companion search query bar console */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm lg:col-span-6 flex flex-col space-y-6">
          <div>
            <h4 className="text-xs font-bold tracking-widest text-[#4f46e5] uppercase mb-1.5 font-mono">Consultative Specialist</h4>
            <h3 className="text-2xl font-light text-slate-800 font-serif">Academic Companion</h3>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Formulate real-time concerns about study fatigue, peer testing acceleration, low motivation, or parental expectations.
            </p>
          </div>

          <div className="space-y-4">
            <textarea
              id="coach-input-textarea"
              disabled={isLoading}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="I feel extremely anxious about my mock-test schedule tomorrow. I haven't mastered CAT/JEE thermodynamics chapters and I'm shaking..."
              className="w-full h-32 p-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-600 leading-relaxed outline-none resize-none transition-all placeholder:text-slate-400 bg-slate-50/50"
            />

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-600 text-xs rounded-2xl flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-mono">{errorMsg}</span>
              </div>
            )}

            <button
              id="submit-coach-query"
              disabled={isLoading}
              onClick={requestWellnessDirections}
              className="w-full py-3.5 rounded-full bg-slate-900 text-white font-semibold text-xs tracking-widest uppercase font-mono hover:bg-slate-800 transition-colors shadow-lg shadow-indigo-50/50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Drafting Specialist Remedies...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Coping Directions</span>
                </>
              )}
            </button>
          </div>

          <div className="p-5 bg-[#F9FAFB] border border-slate-100 rounded-2xl space-y-3">
            <h5 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 font-mono">Suggested Inquiries</h5>
            <div className="space-y-2.5 text-xs text-indigo-600">
              <button
                onClick={() => setUserQuery("Organic chemistry is taking too long study-wise, and I feel super tired. How do I cope?")}
                className="text-left w-full hover:underline font-light block truncate cursor-pointer"
              >
                "Organic chemistry is taking too long to master... how to cope?"
              </button>
              <button
                onClick={() => setUserQuery("My mock test mock cutoff registers low. Parents expect immediate success. How to stop shaking?")}
                className="text-left w-full hover:underline font-light block truncate cursor-pointer"
              >
                "My mock test cutoff registers low. Help me manage parental expectations..."
              </button>
              <button
                onClick={() => setUserQuery("I procrastinated 3 hours checking forum syllabus charts on YouTube out of raw self-doubt.")}
                className="text-left w-full hover:underline font-light block truncate cursor-pointer"
              >
                "I procrastinated 3 hours checking forum syllabus charts due to self-doubt..."
              </button>
            </div>
          </div>
        </div>

        {/* Coach Output Panel */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            {coachResponse ? (
              <motion.div
                key="coach-active-feedback"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </span>
                    <p className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono">Advisor Custom Directive</p>
                  </div>

                  <button
                    onClick={() => triggerSpeechSynthesis(coachResponse.advice)}
                    className="p-2 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-full cursor-pointer flex items-center justify-center"
                    title="Audio guidance narration"
                  >
                    <Volume2 className={`w-4 h-4 ${playingTTS ? 'animate-bounce text-indigo-650' : 'text-slate-500'}`} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Empathetic Analysis</h5>
                    <p className="text-slate-800 text-lg leading-snug font-serif italic pl-1 border-l-2 border-indigo-500/30">
                      "{coachResponse.advice}"
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-4">Strategic Correction Plan</h5>
                    <div className="space-y-3 font-sans">
                      {coachResponse.plan.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-slate-600 leading-relaxed font-light text-xs">
                          <span className="w-5 h-5 rounded-full bg-[#f4f7fb] text-slate-700 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold font-mono">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 bg-[#F9FAFB] p-5 rounded-2xl border border-slate-200">
                    <h5 className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{coachResponse.exerciseTitle}</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-light mt-1 font-sans">
                      {coachResponse.exercise}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="coach-idle-feedback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center bg-transparent border border-slate-200 border-dashed rounded-[2.5rem] min-h-[460px] flex flex-col justify-center items-center"
              >
                <Award className="w-10 h-10 text-slate-300 mb-4" />
                <h3 className="text-slate-500 font-light text-sm font-sans">Coping Diagnostics Panel</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs font-sans leading-relaxed">
                  Enter a state query or backlog feeling in the companion terminal. The coach will compile a structural 3-step coping action instantly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
