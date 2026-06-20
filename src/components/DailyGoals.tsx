import React, { useState, useEffect } from "react";
import { DailyGoal } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  BookOpen, 
  Heart, 
  Flame, 
  Sparkles, 
  Trash2, 
  Check, 
  ClipboardCheck, 
  AlertCircle,
  HelpCircle,
  Bell,
  BellOff,
  BellRing,
  Send,
  Sparkle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DailyGoalsProps {
  goals: DailyGoal[];
  onUpdateGoals: (updatedGoals: DailyGoal[]) => void;
  entriesCountForToday: number; // to check if finished diary today
}

const TEMPLATE_GOALS = [
  { text: "Solve 10 CAT/UPSC previous year questions", category: "Study", metric: "10 MCQs" },
  { text: "Complete 2 hours of signals and systems revision", category: "Study", metric: "120 mins" },
  { text: "Do three 60-second box breathing cycles", category: "Wellness", metric: "3 sessions" },
  { text: "Refuse to check career forums for 3 hours", category: "Wellness", metric: "180 mins" },
  { text: "Walk outdoors without screen for 15 minutes", category: "Wellness", metric: "15 mins" },
  { text: "List 5 concepts I master completely", category: "Wellness", metric: "5 items" },
];

export default function DailyGoals({ goals, onUpdateGoals, entriesCountForToday }: DailyGoalsProps) {
  const [goalText, setGoalText] = useState("");
  const [category, setCategory] = useState<"Study" | "Wellness">("Study");
  const [metric, setMetric] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"All" | "Study" | "Wellness">("All");
  
  // Dual layout sub-tab
  const [activeSubSection, setActiveSubSection] = useState<"goals" | "alerts">("goals");

  // Notification API States
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [isAlertActive, setIsAlertActive] = useState(true);
  const [recentBackupNotification, setRecentBackupNotification] = useState<string | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // background checker schedule simulation to trigger push if they haven't logged today
  useEffect(() => {
    const storedAlert = localStorage.getItem("mindpilot_reminders_enabled");
    if (storedAlert) {
      setIsAlertActive(JSON.parse(storedAlert));
    }
  }, []);

  const handleUpdateAlertStatus = (status: boolean) => {
    setIsAlertActive(status);
    localStorage.setItem("mindpilot_reminders_enabled", JSON.stringify(status));
  };

  const handleRequestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      showBackupToast("This browser context does not support high-fidelity system push logs.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        new Notification("MindPilot AI • Reminders Configured", {
          body: "Push alerts successfully linked! We'll prompt you when it's time to log.",
          icon: "/favicon.ico"
        });
      }
    } catch (err) {
      console.error(err);
      showBackupToast("Permission request blocked by browser security sandboxing.");
    }
  };

  const showBackupToast = (msg: string) => {
    setRecentBackupNotification(msg);
    setTimeout(() => {
      setRecentBackupNotification(null);
    }, 5000);
  };

  const triggerSimulatedReminder = () => {
    if (notificationPermission === "granted" && isAlertActive) {
      try {
        new Notification("MindPilot AI • Daily Mental Check", {
          body: "Your daily exam preparation is wrapping up. Spend 2 minutes recording your progress to map stress thresholds.",
          icon: "/favicon.ico"
        });
        showBackupToast("System native notification emitted!");
      } catch (err) {
        showBackupToast("Preparing sync alarm: 'Your daily prep is wrapping up. Spend 2 minutes recording your logs!'");
      }
    } else {
      // Elegant in-app toast simulation
      showBackupToast("⚠️ Daily Check: High-stakes preparation is wrapping up. Take 2 minutes to summarize today's logs!");
    }
  };

  // Filter goals
  const filteredGoals = goals.filter((g) => {
    if (activeCategoryFilter === "All") return true;
    return g.category === activeCategoryFilter;
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) {
      setErrorMsg("Goal text cannot be blank.");
      return;
    }
    setErrorMsg("");

    const newGoal: DailyGoal = {
      id: "goal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      text: goalText.trim(),
      category,
      metric: metric.trim() || undefined,
      completed: false,
      createdAt: new Date().toISOString()
    };

    onUpdateGoals([newGoal, ...goals]);
    setGoalText("");
    setMetric("");
  };

  const toggleGoal = (id: string) => {
    const updated = goals.map((g) => {
      if (g.id === id) {
        return { ...g, completed: !g.completed };
      }
      return g;
    });
    onUpdateGoals(updated);
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    onUpdateGoals(updated);
  };

  const applyTemplate = (tpl: typeof TEMPLATE_GOALS[0]) => {
    setErrorMsg("");
    const newGoal: DailyGoal = {
      id: "goal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      text: tpl.text,
      category: tpl.category as "Study" | "Wellness",
      metric: tpl.metric,
      completed: false,
      createdAt: new Date().toISOString()
    };
    onUpdateGoals([newGoal, ...goals]);
  };

  const clearAllGoals = () => {
    if (window.confirm("Are you sure you want to delete all daily goals?")) {
      onUpdateGoals([]);
    }
  };

  // Calculate completion statistics
  const totalCount = goals.length;
  const completedCount = goals.filter((g) => g.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const studyGoals = goals.filter(g => g.category === "Study");
  const wellnessGoals = goals.filter(g => g.category === "Wellness");
  const studyCompleted = studyGoals.filter(g => g.completed).length;
  const wellnessCompleted = wellnessGoals.filter(g => g.completed).length;

  return (
    <div id="daily-goals-container" className="space-y-8 animate-fadeIn">
      
      {/* Floating toast notification backup */}
      <AnimatePresence>
        {recentBackupNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div className="text-xs">
              <p className="font-semibold font-mono tracking-wide text-indigo-300">SYSTEM NOTIFICATION TEST</p>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{recentBackupNotification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Header card with Progress Index */}
      <div className="p-8 rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-3">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-indigo-400">Tactical Focus Engine</span>
            <h3 className="text-3xl font-light font-serif text-slate-100">Daily Study & Wellness Slate</h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-md">
              Synchronize core concept preparation with deep biological wind-down locks. Tracking wellness daily keeps study stamina high.
            </p>
          </div>
          
          <div className="md:col-span-5 flex items-center justify-center md:justify-end gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
            <div className="text-center md:text-right space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-300 block">Today's Ratio</span>
              <span className="text-3xl font-light text-slate-100 font-serif">
                {completedCount} <span className="text-sm text-slate-500 font-sans">/</span> {totalCount} Completed
              </span>
              <div className="text-[10px] font-mono text-indigo-300 font-bold tracking-wide">
                {progressPercent}% Absolute Success Rate
              </div>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle 
                  cx="32" 
                  cy="32" 
                  r="26" 
                  className="text-slate-800" 
                  strokeWidth="3.5" 
                  stroke="currentColor" 
                  fill="transparent" 
                />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="26" 
                  className="text-indigo-400 transition-all duration-500 ease-in-out" 
                  strokeWidth="3.5" 
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 * (1 - progressPercent / 100)}
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-slate-100">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Mini progress stats bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Study: <strong className="text-slate-200">{studyCompleted}/{studyGoals.length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Wellness: <strong className="text-slate-200">{wellnessCompleted}/{wellnessGoals.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Sub menu controls to swap between Goals list and Alerts configurator */}
      <div className="flex border-b border-slate-100 gap-4 pb-0.5">
        <button
          onClick={() => setActiveSubSection("goals")}
          className={`pb-3 font-mono text-[10px] uppercase font-bold tracking-widest relative cursor-pointer
            ${activeSubSection === "goals" ? "text-indigo-600 border-b-2 border-indigo-600 font-extrabold" : "text-slate-500 hover:text-slate-700"}`}
        >
          📝 Goal Slate Checklist
        </button>
        <button
          onClick={() => setActiveSubSection("alerts")}
          className={`pb-3 font-mono text-[10px] uppercase font-bold tracking-widest relative cursor-pointer
            ${activeSubSection === "alerts" ? "text-indigo-600 border-b-2 border-indigo-600 font-extrabold" : "text-slate-500 hover:text-slate-700"}`}
        >
          🔔 AI Journal Reminders Hub
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubSection === "goals" ? (
          <motion.div
            key="goals-subsection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left column: Add goal forms */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-xs font-bold tracking-widest text-[#4f46e5] uppercase font-mono">Create New Focal Goal</h4>
                
                <form onSubmit={handleAddGoal} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 block">What is your task or focus?</label>
                    <input 
                      type="text"
                      value={goalText}
                      onChange={(e) => setGoalText(e.target.value)}
                      placeholder="e.g. Solve GATE maths linear algebra"
                      className="w-full px-4 py-3 text-sm text-slate-600 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    />
                  </div>

                  {/* Category picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 block">Category Focus</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCategory("Study")}
                        className={`py-2 px-4 text-xs font-bold uppercase tracking-wider font-mono rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2
                          ${category === "Study" 
                            ? "bg-slate-900 border-slate-900 text-white font-semibold" 
                            : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"}`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Study Goal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategory("Wellness")}
                        className={`py-2 px-4 text-xs font-bold uppercase tracking-wider font-mono rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2
                          ${category === "Wellness" 
                            ? "bg-slate-900 border-slate-900 text-white font-semibold" 
                            : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"}`}
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>Wellness Goal</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional metric tag */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 block flex items-center gap-1">
                      <span>Target Value / Metric</span>
                      <span className="text-[10px] text-slate-500 font-medium">(Optional)</span>
                    </label>
                    <input 
                      type="text"
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      placeholder="e.g. 2 hours, 20 MCQs, 5 reps"
                      className="w-full px-4 py-3 text-sm text-slate-600 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-mono">{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full px-6 py-3.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs uppercase tracking-widest font-mono shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Engrave Goal</span>
                  </button>
                </form>
              </div>

              {/* suggested template goals */}
              <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase font-mono">Instant Suggestions</h4>
                  <p className="text-[11px] text-slate-500 font-sans font-medium mt-0.5">Quickly select clinically recommended high-yield prep activities.</p>
                </div>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {TEMPLATE_GOALS.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => applyTemplate(tpl)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100/50 transition-all text-xs font-sans text-slate-600 flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-0.5 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <span className={`w-1.5 h-1.5 rounded-full ${tpl.category === "Study" ? "bg-indigo-400" : "bg-emerald-400"}`} />
                          <span>{tpl.text}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-150 px-2 py-0.5 rounded-md group-hover:text-indigo-600 group-hover:border-indigo-100 shrink-0">
                        +{tpl.metric}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: Goals lists with filters */}
            <div className="lg:col-span-7 space-y-6">
              {/* List panel */}
              <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm min-h-[400px] flex flex-col justify-between">
                <div>
                  {/* Filter controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
                    <div>
                      <h4 className="text-md font-medium text-slate-800">Your Daily Slate</h4>
                      <p className="text-xs text-slate-600 font-sans font-medium">Active objectives log for this interval</p>
                    </div>

                    <div className="flex gap-1 bg-slate-50 rounded-full p-1 border border-slate-100 self-start sm:self-center">
                      {(["All", "Study", "Wellness"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setActiveCategoryFilter(f)}
                          className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono transition-colors cursor-pointer
                            ${activeCategoryFilter === f 
                              ? "bg-slate-900 text-white font-semibold" 
                              : "text-slate-500 hover:text-slate-800"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goals list */}
                  {filteredGoals.length === 0 ? (
                    <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-[2rem]">
                      <ClipboardCheck className="w-10 h-10 text-slate-200 mb-3" />
                      <p className="text-xs text-slate-500 font-semibold font-sans">Focus matrix currently pristine</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-normal font-medium">
                        You haven't defined any {activeCategoryFilter.toLowerCase() === "all" ? "" : activeCategoryFilter.toLowerCase() + " "} goals. Check suggestions or use the creator.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                      <AnimatePresence initial={false}>
                        {filteredGoals.map((g) => (
                          <motion.div
                            key={g.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`p-4 rounded-2xl flex items-center justify-between border transition-colors group
                              ${g.completed 
                                ? "bg-slate-50/50 border-slate-100 text-slate-500" 
                                : "bg-[#F9FAFB] border-slate-100 text-slate-700 hover:border-slate-200"}`}
                          >
                            <div className="flex items-center gap-3.5 flex-1 select-none cursor-pointer" onClick={() => toggleGoal(g.id)}>
                              <span className="shrink-0 transition-transform group-hover:scale-110">
                                {g.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-indigo-500 fill-indigo-50" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-455" />
                                )}
                              </span>
                              
                              <div className="space-y-0.5">
                                <span className={`text-xs leading-relaxed break-words font-sans
                                  ${g.completed ? "line-through text-slate-500 decoration-slate-300" : "font-medium"}`}
                                >
                                  {g.text}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-md font-bold
                                    ${g.category === "Study" ? "bg-indigo-50 text-indigo-500" : "bg-emerald-50 text-emerald-500"}`}
                                  >
                                    {g.category}
                                  </span>
                                  {g.metric && (
                                    <span className="text-[10px] font-mono text-slate-400 font-semibold">• {g.metric}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => deleteGoal(g.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 focus:opacity-100 cursor-pointer"
                              title="Erase goal record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Clear footer controls */}
                {goals.length > 0 && (
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-xs mt-6">
                    <span className="text-slate-500 font-mono font-medium">
                      {completedCount} goal{completedCount !== 1 && "s"} completed today
                    </span>
                    <button
                      onClick={clearAllGoals}
                      className="text-slate-500 hover:text-red-500 font-mono tracking-wide text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset Goal Slate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="alerts-subsection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-md font-semibold text-slate-800">Browser Alarms Configuration</h4>
                <p className="text-xs text-slate-500 font-sans font-medium">Automated reminders to prompt diary syncing.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Notification permission state:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] border
                  ${notificationPermission === "granted" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : notificationPermission === "denied"
                      ? "bg-red-50 text-red-700 border-red-100"
                      : "bg-orange-50 text-orange-700 border-orange-100"}`}
                >
                  {notificationPermission === "granted" ? "🟢 Authorized" : notificationPermission === "denied" ? "🔴 Blocked" : "⚠️ Undecided"}
                </span>
              </div>

              {notificationPermission !== "granted" && (
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    Authorize native chrome notifications to allow MindPilot to send quiet reminders to your toolbar even if you're reviewing formula sheets in off-tab portals.
                  </p>
                  <button
                    onClick={handleRequestNotificationPermission}
                    className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 duration-150 text-white font-mono text-[10px] uppercase font-bold tracking-widest rounded-full cursor-pointer flex items-center gap-1"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Authorize Alerts</span>
                  </button>
                </div>
              )}
            </div>

            {/* Simulated Alarm Trigger Toggle */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 max-w-sm">
                  <p className="text-xs font-semibold text-slate-700">Send Daily Reminders</p>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    Check journal completion state at 9:00 PM daily. If still empty, send clinical recovery prompts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateAlertStatus(!isAlertActive)}
                  className={`w-12 h-6 rounded-full flex items-center p-0.5 transition-colors cursor-pointer
                    ${isAlertActive ? "bg-indigo-600 justify-end" : "bg-slate-200 justify-start"}`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700">Instant Test Bed</p>
                  <p className="text-[10px] text-slate-400 font-sans">Safely test notification rendering layout right now.</p>
                </div>
                <button
                  onClick={triggerSimulatedReminder}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-[10px] text-white font-mono uppercase font-bold tracking-wider rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Test Reminder Trigger</span>
                </button>
              </div>
            </div>

            {/* Bedtime logging status indicator block */}
            <div className="p-4 rounded-xl bg-indigo-50/20 border border-indigo-100 flex items-center gap-3 text-xs leading-relaxed">
              <ClipboardCheck className="w-5 h-5 text-indigo-500 shrink-0" />
              <div className="text-slate-600">
                <span>Today's Log status: </span>
                {entriesCountForToday > 0 ? (
                  <strong className="text-emerald-600">✅ COMPLETED.</strong>
                ) : (
                  <strong className="text-indigo-600">⏳ PENDING. We will prompt you at 9:00 PM if still empty.</strong>
                )}
                <span> Continuous, daily diary expression minimizes diagnostic blindspots by 40%.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
