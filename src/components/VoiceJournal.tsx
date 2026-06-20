import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, RefreshCw, AlertCircle, Play, Square, FileText, Check, Music, HelpCircle, AudioLines, Volume2, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { aiService } from "../services/ai";

interface VoiceJournalProps {
  onAnalyzeSuccess?: () => void;
}

export default function VoiceJournal({ onAnalyzeSuccess }: VoiceJournalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [playingTTS, setPlayingTTS] = useState(false);
  const [historicalVoices, setHistoricalVoices] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);

  const fetchPastVoices = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "voice_journals"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => doc.data());
      docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistoricalVoices(docs);
    } catch (err) {
      console.error("Failed to query historical voices:", err);
    }
  };

  useEffect(() => {
    fetchPastVoices();

    // Check for browser speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript((prev) => prev + final);
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMsg("Microphone permission denied. Please allow microphone access.");
        } else {
          setErrorMsg(`Voice engine error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = () => {
    setErrorMsg("");
    setInterimTranscript("");
    if (!recognitionRef.current) {
      // Inline Typing simulate if browser doesn't support Web Speech API
      setErrorMsg("Web Speech API is not fully active in this context. You may type into the box below to test.");
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to start voice recognition engine.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    setAnalysisResult(null);
    setErrorMsg("");
  };

  const handleSpeechSynthesis = async (speechText: string) => {
    if (playingTTS) {
      window.speechSynthesis.cancel();
      setPlayingTTS(false);
      return;
    }

    setPlayingTTS(true);
    try {
      const result = await aiService.getVoiceTTS(speechText);
      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.onended = () => setPlayingTTS(false);
        audio.play();
      } else {
        // Fallback browser speech
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.onend = () => setPlayingTTS(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      // Fallback directly
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.onend = () => setPlayingTTS(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const analyzeVoiceNotes = async () => {
    if (!transcript.trim()) {
      setErrorMsg("Prompt transcript is empty. Speak or type some content first.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      const data = await aiService.analyzeJournalEntry(transcript);
      setAnalysisResult(data);

      // Save to voice_journals Firestore collection per User
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "voice_journals"), {
          id: "voice_" + Date.now(),
          userId: user.uid,
          createdAt: new Date().toISOString(),
          transcript: transcript,
          insights: data
        });
        fetchPastVoices(); // Refresh list immediately
      }

      if (onAnalyzeSuccess) {
        onAnalyzeSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Cognitive extraction stalled with server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Visual top banner */}
      <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-150 shadow-inner">
            <AudioLines className={`w-5 h-5 ${isRecording ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h3 className="text-2xl font-light font-serif text-slate-800">Voice-to-Helix Journaling</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-lg leading-relaxed font-sans font-medium">
              Speak freely about backlog anxious feelings, parent pressure details, and mock targets. Gemini decodes oral narratives into cognitive telemetry instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs tracking-widest font-mono uppercase shadow-md flex items-center gap-2 cursor-pointer"
            >
              <MicOff className="w-4 h-4 animate-pulse" />
              <span>Stop Logging</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="px-6 py-3.5 rounded-full bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs tracking-widest font-mono uppercase shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Record Notes</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Recording workspace */}
        <div className="md:col-span-7 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <div>
            <h4 className="text-xs font-bold tracking-widest text-[#4f46e5] uppercase mb-1.5 font-mono">Live Vocal Slate</h4>
            <span className="text-xs text-slate-500 font-medium">Speak into your mic or edit transcription outcomes in real time.</span>
          </div>

          {/* Equalizer animation when recording */}
          {isRecording && (
            <div className="h-10 bg-slate-55 flex items-center justify-center gap-1 rounded-2xl border border-slate-100/50 p-2">
              <span className="w-1 h-6 bg-indigo-500 rounded animate-pulse" />
              <span className="w-1 h-3 bg-indigo-400 rounded animate-bounce" />
              <span className="w-1 h-7 bg-indigo-600 rounded animate-pulse" />
              <span className="w-1 h-4 bg-indigo-300 rounded animate-bounce" />
              <span className="w-1 h-8 bg-indigo-500 rounded animate-pulse" />
              <span className="w-1 h-2 bg-indigo-200 rounded animate-bounce" />
              <p className="text-[10px] font-mono text-indigo-600 font-extrabold uppercase tracking-widest pl-3">Listening & Transcribing...</p>
            </div>
          )}

          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Start speaking by hitting the 'Record Notes' button... (Or directly write down notes if microphone permissions are disabled)"
              className="w-full h-44 p-5 rounded-2xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-550 leading-relaxed bg-slate-50/50 resize-none"
            />
            {interimTranscript && (
              <p className="absolute bottom-3 left-4 right-4 text-xs italic text-indigo-400 bg-white/95 p-2 rounded-lg border border-indigo-50">
                💭 {interimTranscript}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-mono">{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={analyzeVoiceNotes}
              disabled={loading || !transcript.trim()}
              className="flex-1 py-3.5 bg-slate-900 border border-transparent hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Extracting Cognitive Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span>Transmit to Gemini</span>
                </>
              )}
            </button>

            {transcript && (
              <button
                onClick={clearTranscript}
                className="px-6 py-3.5 hover:bg-slate-50 border border-slate-200 text-slate-500 font-mono text-xs font-bold uppercase tracking-widest rounded-full cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Analysis Outcome */}
        <div className="md:col-span-5">
          <AnimatePresence mode="wait">
            {analysisResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono">Decoded Insights</span>
                  </div>
                  
                  <button
                    onClick={() => handleSpeechSynthesis(analysisResult.counselorAdvice)}
                    className="p-2 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full cursor-pointer"
                    title="Audio guidance lecture"
                  >
                    <Volume2 className={`w-4 h-4 ${playingTTS ? 'animate-bounce' : ''}`} />
                  </button>
                </div>

                {/* Score Meters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-widest font-bold">STRESS DETECTED</span>
                    <span className="text-xl font-light text-slate-700 block mt-1">{analysisResult.scores.stress}%</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-widest font-bold">CONFIDENCE GAP</span>
                    <span className="text-xl font-light text-slate-700 block mt-1">{analysisResult.scores.confidence}%</span>
                  </div>
                </div>

                {/* Core diagnostic insights */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <h5 className="text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-1 font-bold">Primary Concern:</h5>
                    <p className="text-slate-650 font-sans leading-relaxed">{analysisResult.cognitiveReconstruction.triggerDetected}</p>
                  </div>

                  <div>
                    <h5 className="text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-1 font-bold">Empathetic Wisdom:</h5>
                    <p className="text-slate-650 italic font-serif leading-relaxed text-indigo-950">"{analysisResult.counselorAdvice}"</p>
                  </div>

                  <div className="bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100">
                    <h5 className="text-[10px] uppercase font-mono text-emerald-800 tracking-wider mb-1 font-bold">Actionable Recovery:</h5>
                    <p className="text-slate-600 leading-relaxed">{analysisResult.cognitiveReconstruction.reframingGuideline}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="min-h-[360px] border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col justify-center items-center p-8 text-center bg-transparent">
                <FileText className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
                <h4 className="text-slate-500 font-light text-sm font-sans">Insights Sandbox Empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed font-medium">
                  Press **Transmit to Gemini** after talking. Oral inputs will generate interactive telemetry stats, custom scoring vectors, and recovery guidelines.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Historical voice entries section */}
      {historicalVoices.length > 0 && (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm mt-8 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Your Vocal Archives ({historicalVoices.length})</h4>
              <p className="text-[11px] text-slate-500 font-medium">Review and reload your previous voice journaling notes and AI telemetry insights.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2">
            {historicalVoices.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setTranscript(item.transcript);
                  setAnalysisResult(item.insights);
                  setErrorMsg("");
                }}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-150 text-left cursor-pointer transition-all hover:scale-[1.01] duration-150 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-2">
                    {new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-xs text-slate-650 line-clamp-3 leading-relaxed mb-4 italic">
                    "{item.transcript}"
                  </p>
                </div>
                {item.insights?.scores && (
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-200/50 w-full text-center">
                    <div className="flex-1">
                      <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold">STRESS</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">{item.insights.scores.stress}%</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex-1">
                      <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold">CONFIDENCE</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">{item.insights.scores.confidence}%</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
