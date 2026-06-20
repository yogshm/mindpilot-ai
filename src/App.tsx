import React, { useState, useEffect } from "react";
import { JournalEntry, MentalScores, AnalysisResult, DailyGoal } from "./types";
import { getInitialEntries } from "./utils/dummyData";
import LandingPage from "./components/LandingPage";
import DashboardOverview from "./components/DashboardOverview";
import DailyJournal from "./components/DailyJournal";
import StressTriggers from "./components/StressTriggers";
import TrendsDashboard from "./components/TrendsDashboard";
import CoachRoom from "./components/CoachRoom";
import WeeklyReport from "./components/WeeklyReport";
import DailyGoals from "./components/DailyGoals";
import PanicMode from "./components/PanicMode";
import AuthPage from "./components/AuthPage";
import VoiceJournal from "./components/VoiceJournal";
import FutureLetter from "./components/FutureLetter";
import PatternDiscovery from "./components/PatternDiscovery";
import { Brain, Sparkles, User, RefreshCw, LogOut, Flame, Heart, AlertCircle, ShieldAlert, Trash2, ClipboardCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "./firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [isDashboardActive, setIsDashboardActive] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "journal" | "triggers" | "trends" | "coach" | "weekly" | "panic" | "goals" | "voice-journal" | "future-letter" | "pattern-discovery"
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<JournalEntry | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  // 1. Listen to authentication state shifts
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
      if (firebaseUser) {
        setIsDashboardActive(true);
      } else {
        setIsDashboardActive(false);
        setEntries([]);
        setGoals([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time synchronization of journal entries and daily focus goals with Firestore (only when authenticated)
  useEffect(() => {
    if (!user) return;

    // 1. Listen to journal entries in real time for this authenticated user
    const entriesQuery = query(
      collection(db, "journal_entries"),
      where("userId", "==", user.uid)
    );

    const unsubscribeEntries = onSnapshot(
      entriesQuery,
      async (snapshot) => {
        try {
          if (snapshot.empty) {
            // Seed Firestore with initial user-scoped mock data if empty so the user has immediate historical telemetry
            const seeds = getInitialEntries();
            for (const seed of seeds) {
              try {
                const userScopedSeed = {
                  ...seed,
                  userId: user.uid
                };
                await setDoc(doc(db, "journal_entries", seed.id), userScopedSeed);
              } catch (writeErr) {
                handleFirestoreError(writeErr, OperationType.WRITE, `journal_entries/${seed.id}`);
              }
            }
          } else {
            const fetchedEntries = snapshot.docs.map(doc => doc.data() as JournalEntry);
            // Client-side sort by date descending to ensure robust ordering
            fetchedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setEntries(fetchedEntries);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, "journal_entries");
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "journal_entries");
      }
    );

    // 2. Listen to goals in real time for this authenticated user
    const goalsQuery = query(
      collection(db, "goals"),
      where("userId", "==", user.uid)
    );

    const unsubscribeGoals = onSnapshot(
      goalsQuery,
      (snapshot) => {
        const fetchedGoals = snapshot.docs.map(doc => doc.data() as DailyGoal);
        // Client-side sort by creation time descending to preserve stack order
        fetchedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setGoals(fetchedGoals);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "goals");
      }
    );

    return () => {
      unsubscribeEntries();
      unsubscribeGoals();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Error performing Google Sign-In:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error performing Sign-Out:", err);
    }
  };

  const handleUpdateGoals = async (updatedGoals: DailyGoal[]) => {
    if (!user) return;
    try {
      // Find deleted goals by comparing against active memory cache
      const existingIds = new Set(updatedGoals.map(g => g.id));
      const deletedGoals = goals.filter(g => !existingIds.has(g.id));

      // Execute deletions in Firestore
      for (const dg of deletedGoals) {
        try {
          await deleteDoc(doc(db, "goals", dg.id));
        } catch (delErr) {
          handleFirestoreError(delErr, OperationType.DELETE, `goals/${dg.id}`);
        }
      }

      // Upsert updated/new goals in Firestore
      for (const g of updatedGoals) {
        try {
          const userScopedGoal = {
            ...g,
            userId: user.uid
          };
          await setDoc(doc(db, "goals", g.id), userScopedGoal);
        } catch (setErr) {
          handleFirestoreError(setErr, OperationType.WRITE, `goals/${g.id}`);
        }
      }
    } catch (err) {
      console.error("Error synchronizing goals with Firestore:", err);
    }
  };

  // Create a new analyzed entry inside Firestore
  const handleSaveNewEntry = async (text: string, scores: MentalScores, analysis: AnalysisResult) => {
    if (!user) return;
    const newEntry: JournalEntry = {
      id: "entry_" + Date.now(),
      userId: user.uid,
      date: new Date().toISOString(),
      text,
      scores,
      analysis
    };

    try {
      await setDoc(doc(db, "journal_entries", newEntry.id), newEntry);
      
      // Set active detail immediately so they can see the newly generated analysis
      setSelectedEntryDetail(newEntry);
      setActiveTab("journal");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `journal_entries/${newEntry.id}`);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to delete all daily logs? This action is irreversible and your progress tracker will reset.")) {
      try {
        // Delete all documents in our current cache from Firestore
        for (const entry of entries) {
          try {
            await deleteDoc(doc(db, "journal_entries", entry.id));
          } catch (delErr) {
            handleFirestoreError(delErr, OperationType.DELETE, `journal_entries/${entry.id}`);
          }
        }
        setSelectedEntryDetail(null);
        setActiveTab("overview");
      } catch (err) {
        console.error("Error clearing logs from Firestore:", err);
      }
    }
  };

  // Inspect past card detail logic
  const handleSelectEntryForDetail = (entry: JournalEntry) => {
    setSelectedEntryDetail(entry);
    setActiveTab("journal");
  };

  const handleClearSelectedDetail = () => {
    setSelectedEntryDetail(null);
  };

  // Floating Emergency Panic toggle
  const handleTriggerPanicTab = () => {
    setSelectedEntryDetail(null);
    setActiveTab("panic");
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-mono text-xs">Synchronizing mental telemetry...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthPage onSuccess={() => setShowAuth(false)} />;
    }
    return <LandingPage onStart={() => setShowAuth(true)} />;
  }

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
                  ? "bg-red-600 text-white border-transparent" 
                  : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"}`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Emergency Calm</span>
            </button>

            {/* Clear database log */}
            {entries.length > 0 && (
              <button
                id="header-btn-clear"
                onClick={handleClearLogs}
                title="Reset local journal metrics"
                className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
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
              ${activeTab === "panic" ? "bg-red-600 text-white shadow-md" : "text-red-600 bg-red-50/50 hover:bg-red-50"}`}
          >
            🚨 Panic Mode relief
          </button>
        </nav>

        {/* Content Area panel */}
        <section id="dashboard-content-panel" className="md:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedEntryDetail ? "_detail" : "")}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
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
            </motion.div>
          </AnimatePresence>
        </section>

      </main>
    </div>
  );
}
