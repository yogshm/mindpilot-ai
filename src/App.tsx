/**
 * MindPilot AI Core Application Wrapper
 * Implements route-based code splitting, lazy-loading, and decoupled state management hooks.
 */

import React, { useState, Suspense } from "react";
import { JournalEntry, MentalScores, AnalysisResult, DailyGoal } from "./types";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useJournal } from "./hooks/useJournal";
import { useGoals } from "./hooks/useGoals";
import { 
  Brain, 
  LogOut, 
  RefreshCw, 
  ShieldAlert, 
  Trash2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Lazy-loaded subcomponents for optimized initial bundle sizes and performance metrics
const LandingPage = React.lazy(() => import("./components/LandingPage"));
const DashboardOverview = React.lazy(() => import("./components/DashboardOverview"));
const DailyJournal = React.lazy(() => import("./components/DailyJournal"));
const StressTriggers = React.lazy(() => import("./components/StressTriggers"));
const TrendsDashboard = React.lazy(() => import("./components/TrendsDashboard"));
const CoachRoom = React.lazy(() => import("./components/CoachRoom"));
const WeeklyReport = React.lazy(() => import("./components/WeeklyReport"));
const DailyGoals = React.lazy(() => import("./components/DailyGoals"));
const PanicMode = React.lazy(() => import("./components/PanicMode"));
const AuthPage = React.lazy(() => import("./components/AuthPage"));
const VoiceJournal = React.lazy(() => import("./components/VoiceJournal"));
const FutureLetter = React.lazy(() => import("./components/FutureLetter"));
const PatternDiscovery = React.lazy(() => import("./components/PatternDiscovery"));

/**
 * Premium skeleton component displayed during asynchronous lazy loading transitions
 */
function TabLoadingSkeleton() {
  return (
    <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6 animate-pulse">
      <div className="h-6 bg-slate-100 rounded w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-50/60 rounded" />
        <div className="h-4 bg-slate-50/60 rounded w-5/6" />
        <div className="h-4 bg-slate-50/60 rounded w-2/3" />
      </div>
      <div className="h-32 bg-slate-50/60 rounded-2xl" />
    </div>
  );
}

/**
 * Primary authenticated dashboard container layout
 */
function MainAppContent() {
  const { user, authChecking, handleLogout } = useAuth();
  const { entries, saveEntry, clearLogs, loading: journalLoading } = useJournal();
  const { goals, updateGoals, loading: goalsLoading } = useGoals();

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<JournalEntry | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);

  // Fallback loading check for authentications
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-mono text-xs">Synchronizing mental telemetry...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated landings
  if (!user) {
    if (showAuth) {
      return (
        <Suspense fallback={<TabLoadingSkeleton />}>
          <AuthPage onSuccess={() => setShowAuth(false)} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<TabLoadingSkeleton />}>
        <LandingPage onStart={() => setShowAuth(true)} />
      </Suspense>
    );
  }

  const handleUpdateGoals = async (updatedGoals: DailyGoal[]) => {
    await updateGoals(updatedGoals);
  };

  const handleSaveNewEntry = async (text: string, scores: MentalScores, analysis: AnalysisResult) => {
    try {
      const entry = await saveEntry(text, scores, analysis);
      setSelectedEntryDetail(entry);
      setActiveTab("journal");
    } catch (err) {
      console.error("Save new entry failed execution:", err);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to delete all daily logs? This action is irreversible and your progress tracker will reset.")) {
      try {
        await clearLogs();
        setSelectedEntryDetail(null);
        setActiveTab("overview");
      } catch (err) {
        console.error("Clear database logs exception:", err);
      }
    }
  };

  const handleSelectEntryForDetail = (entry: JournalEntry) => {
    setSelectedEntryDetail(entry);
    setActiveTab("journal");
  };

  const handleClearSelectedDetail = () => {
    setSelectedEntryDetail(null);
  };

  const handleTriggerPanicTab = () => {
    setSelectedEntryDetail(null);
    setActiveTab("panic");
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-brand-50 selection:text-brand-900 pb-16 relative overflow-x-hidden">
      {/* Dynamic ambient lights */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-brand-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />

      {/* Main Top Header Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <button 
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("overview");
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white transition-transform group-hover:scale-105">
              <Brain className="w-4 h-4" />
            </div>
            <span className="text-md font-extrabold font-display text-slate-900 tracking-tight">MindPilot</span>
            <span className="text-[10px] font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
              AI Copilot
            </span>
          </button>

          {/* Action options */}
          <div className="flex items-center gap-3">
            {/* User profile identifier block */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[120px] truncate">
                {user.displayName || user.email}
              </span>
            </div>

            {/* Quick emergency relief lever */}
            <button
              id="header-btn-panic"
              onClick={handleTriggerPanicTab}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 cursor-pointer transition-all border
                ${activeTab === "panic" 
                  ? "bg-red-600 text-white border-transparent w-[140px] justify-center" 
                  : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100/80 w-[140px] justify-center"}`}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Emergency Calm</span>
            </button>

            {/* Clear database log */}
            {entries.length > 0 && (
              <button
                id="header-btn-clear"
                onClick={handleClearLogs}
                title="Reset local journal metrics"
                className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer shrink-0"
              title="Sign out from companion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Primary Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Navigation Sidebar */}
        <nav id="dashboard-sidebar" className="md:col-span-3 space-y-2 bg-white/70 p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-row md:flex-col overflow-x-auto pr-4 md:pr-4 overflow-y-hidden gap-1.5 scrollbar-none">
          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("overview");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "overview" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Dashboard Overview
          </button>
          
          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("journal");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "journal" && !selectedEntryDetail ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Daily Journal Log
          </button>

          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("voice-journal");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "voice-journal" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            🎙️ Voice Journaling
          </button>

          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("triggers");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "triggers" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Stress Trigger Detector
          </button>

          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("trends");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "trends" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Emotional Heatmap
          </button>

          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("pattern-discovery");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "pattern-discovery" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            💡 Active Patterns
          </button>

          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("coach");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "coach" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            AI Wellness Coach
          </button>

          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("weekly");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "weekly" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Weekly Wellness Report
          </button>

          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("future-letter");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "future-letter" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            ✉️ Future Self Letter
          </button>

          <button
            onClick={() => {
              setSelectedEntryDetail(null);
              setActiveTab("goals");
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "goals" ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Daily Goals & Alarms
          </button>

          <button
            onClick={handleTriggerPanicTab}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase font-mono tracking-wider transition-all block shrink-0
              ${activeTab === "panic" ? "bg-red-600 text-white shadow-md" : "text-red-700 bg-red-50 hover:bg-red-100"}`}
          >
            🚨 Panic Mode relief
          </button>
        </nav>

        {/* Content Area panel */}
        <section id="dashboard-content-panel" className="md:col-span-9 w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedEntryDetail ? "_detail" : "")}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {/* Suspense context enables lazy chunk resolution with skeleton UI preservation */}
              <Suspense fallback={<TabLoadingSkeleton />}>
                {activeTab === "overview" && (
                  <DashboardOverview 
                    entries={entries} 
                    onNavigateTab={(tab) => {
                      setSelectedEntryDetail(null);
                      setActiveTab(tab);
                    }}
                    onSelectEntry={handleSelectEntryForDetail}
                  />
                )}
                {activeTab === "journal" && (
                  <DailyJournal
                    onSaveNewEntry={handleSaveNewEntry}
                    selectedEntryDetail={selectedEntryDetail}
                    onClearSelectedDetail={handleClearSelectedDetail}
                    isLoadingAnalysis={isLoadingAnalysis}
                    setIsLoadingAnalysis={setIsLoadingAnalysis}
                  />
                )}
                {activeTab === "voice-journal" && (
                  <VoiceJournal />
                )}
                {activeTab === "triggers" && (
                  <StressTriggers latestEntry={entries[0] || null} />
                )}
                {activeTab === "trends" && (
                  <TrendsDashboard entries={entries} />
                )}
                {activeTab === "pattern-discovery" && (
                  <PatternDiscovery entries={entries} />
                )}
                {activeTab === "coach" && (
                  <CoachRoom latestEntry={entries[0] || null} />
                )}
                {activeTab === "weekly" && (
                  <WeeklyReport entries={entries} />
                )}
                {activeTab === "future-letter" && (
                  <FutureLetter />
                )}
                {activeTab === "goals" && (
                  <DailyGoals 
                    goals={goals} 
                    onUpdateGoals={handleUpdateGoals}
                    entriesCountForToday={
                      entries.filter((e) => {
                        const entryDate = new Date(e.date);
                        const today = new Date();
                        return entryDate.getDate() === today.getDate() &&
                               entryDate.getMonth() === today.getMonth() &&
                               entryDate.getFullYear() === today.getFullYear();
                      }).length
                    }
                  />
                )}
                {activeTab === "panic" && <PanicMode />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </section>

      </main>
    </div>
  );
}

/**
 * Root context wrapper of the application
 */
export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
