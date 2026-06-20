import React, { useState, useEffect } from "react";
import { Mail, Sparkles, RefreshCw, AlertCircle, History, BookOpen, Clock, Heart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

export default function FutureLetter() {
  const [targetExam, setTargetExam] = useState("JEE (Engineering)");
  const [timelineYears, setTimelineYears] = useState("5 Years");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [letterText, setLetterText] = useState("");
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [historicalLetters, setHistoricalLetters] = useState<any[]>([]);

  // Fetch past letters from Firestore for the active user
  const fetchPastLetters = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "future_letters"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => doc.data());
      // sort client-side descending
      docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistoricalLetters(docs);
    } catch (err) {
      console.error("Failed to query historical letters:", err);
    }
  };

  useEffect(() => {
    fetchPastLetters();
  }, []);

  const summonFutureLetter = async () => {
    setErrorMsg("");
    setLoading(true);
    setLetterText("");
    setIsEnvelopeOpen(false);

    try {
      const user = auth.currentUser;
      const displayName = user?.displayName || "Future Champion";

      const response = await fetch("/api/generate-future-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetExam, displayName })
      });

      if (!response.ok) {
        throw new Error("Failed to summon future letter. Try again.");
      }

      const data = await response.json();
      setLetterText(data.letterText);
      setIsEnvelopeOpen(true);

      // Save to Firebase under 'future_letters'
      if (user) {
        const payload = {
          id: "letter_" + Date.now(),
          userId: user.uid,
          createdAt: new Date().toISOString(),
          targetExam: targetExam,
          letterText: data.letterText
        };
        await addDoc(collection(db, "future_letters"), payload);
        fetchPastLetters(); // Refresh list immediately
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate correspondence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Visual top banner */}
      <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-650 flex items-center justify-center shrink-0 border border-pink-100">
            <Mail className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-light font-serif text-slate-800">Future Self Correspondence</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-lg leading-relaxed font-sans">
              Request a supportive and emotionally reassuring letter sent back from your future self after successfully passing and ranking on your targeted competitive exams.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left column: Request custom letters */}
        <div className="md:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-xs font-bold tracking-widest text-pink-600 uppercase font-mono">Letter Parameters</h4>

          <div className="space-y-4">
            <div>
              <label htmlFor="exam-select-opt" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5 animate-pulse">
                Your Dream Goal / Exam Target
              </label>
              <select
                id="exam-select-opt"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 outline-none text-xs text-slate-700 bg-slate-50/50 focus:border-pink-500 focus:bg-white transition-all appearance-none"
              >
                <option value="JEE (Engineering)">JEE (Engineering)</option>
                <option value="NEET (Medical)">NEET (Medical)</option>
                <option value="GATE (Engineering/Science)">GATE (Engineering/Science)</option>
                <option value="UPSC (Civil Services)">UPSC (Civil Services)</option>
                <option value="CAT (Management)">CAT (Management)</option>
                <option value="CUET (Central Universities)">CUET (Central Universities)</option>
                <option value="Other Career Exams">Other Career Exams</option>
              </select>
            </div>

            <div>
              <label htmlFor="timeline-select" className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                Timeline Gap of Dispatch
              </label>
              <select
                id="timeline-select"
                value={timelineYears}
                onChange={(e) => setTimelineYears(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 outline-none text-xs text-slate-700 bg-slate-50/50 focus:border-pink-500 focus:bg-white transition-all appearance-none"
              >
                <option value="3 Years">3 Years from now</option>
                <option value="5 Years">5 Years from now</option>
                <option value="10 Years">10 Years from now</option>
              </select>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 text-red-650 rounded-2xl border border-red-100 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <button
              onClick={summonFutureLetter}
              disabled={loading}
              className="w-full py-3.5 bg-[#4f46e5] text-white font-mono text-[11px] uppercase tracking-wider font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-md hover:bg-slate-900 duration-150 shadow-indigo-100"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Summoning Letter...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  <span>Summon Future Self Letter</span>
                </>
              )}
            </button>
          </div>

          {/* Historical archived letters drafts */}
          {historicalLetters.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h5 className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center gap-1.5 mb-3">
                <History className="w-3.5 h-3.5 text-pink-500" />
                <span>Archive Letters</span>
              </h5>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {historicalLetters.map((ltr, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLetterText(ltr.letterText);
                      setIsEnvelopeOpen(true);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-pink-50/20 border border-slate-100 hover:border-pink-100 transition-all text-xs font-sans text-slate-650 flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate max-w-[150px] font-medium">{ltr.targetExam} Success</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      {new Date(ltr.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Interactive parchment output paper/envelope display */}
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            {isEnvelopeOpen && letterText ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-[#FCFBF7] border border-[#E9E4DB] rounded-[2.5rem] p-10 md:p-12 shadow-md relative overflow-hidden ring-4 ring-[#FCFBF7] ring-offset-2 ring-offset-[#FCFBF7]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {/* Vintage Letterhead watermark logo */}
                <div className="absolute top-10 right-10 opacity-15 pointer-events-none select-none">
                  <Mail className="w-24 h-24 text-[#8A7968]" />
                </div>

                <div className="space-y-6 text-[#4F453B] leading-relaxed text-sm max-w-2xl mx-auto font-light selection:bg-pink-100">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#B5A595] pb-4 border-b border-[#EAE2D5] flex items-center justify-between">
                    <span>DISPATCH YEAR: {new Date().getFullYear() + Number(timelineYears.split(" ")[0])} CE</span>
                    <span>ORIGIN: COMPLETED {targetExam.toUpperCase()} METRICS</span>
                  </div>

                  <p className="whitespace-pre-line text-sm md:text-base font-serif italic text-slate-800 leading-relaxed font-light">
                    {letterText}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="min-h-[420px] border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col justify-center items-center p-8 text-center bg-transparent">
                <div className="relative w-20 h-20 flex items-center justify-center bg-white border border-slate-100 shadow-sm rounded-full mb-4">
                  <Mail className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-slate-500 font-light text-sm font-sans">Correspondence Seal Intact</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed font-sans">
                  Summon a draft using parameters on the left. Frame positive goals, revision timelines, and deep success affirmations inside an artistic vintage parchment card instantly.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
