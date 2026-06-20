import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Brain, Mail, Lock, Sparkles, LogIn, ArrowRight, UserPlus, RefreshCw, Check, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface AuthPageProps {
  onSuccess: () => void;
}

const SUPPORTED_EXAMS = [
  "NEET (Medical)",
  "JEE (Engineering)",
  "GATE (Engineering/Science)",
  "UPSC (Civil Services)",
  "CAT (Management)",
  "CUET (Central Universities)",
  "Other Competitive Exams"
];

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [targetExam, setTargetExam] = useState("JEE (Engineering)");
  const [forgotMode, setForgotMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign Up Flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save profile metadata in Firestore under 'users' collection
        await setDoc(doc(db, "users", user.uid), {
          userId: user.uid,
          email: user.email,
          displayName: displayName,
          targetExam: targetExam,
          createdAt: new Date().toISOString()
        });
        
        setSuccessMsg("Account successfully registered! Signing in...");
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        // Sign In Flow
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let cleanMessage = err.message;
      if (err.code === "auth/email-already-in-use") {
        cleanMessage = "This email is already registered.";
      } else if (err.code === "auth/invalid-credential") {
        cleanMessage = "Incorrect email or password.";
      } else if (err.code === "auth/weak-password") {
        cleanMessage = "Password must be at least 6 characters long.";
      }
      setErrorMsg(cleanMessage || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const user = userCredential.user;

      // Save/Update profile metadata in users collection
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || displayName || "Aspirant",
        targetExam: targetExam, // defaults to current choice or updates if selected
        createdAt: new Date().toISOString()
      }, { merge: true });

      onSuccess();
    } catch (err: any) {
      console.error("Google authentication error:", err);
      setErrorMsg(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your email to request a reset link.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Reset link dispatched to your email address!");
    } catch (err: any) {
      console.error("Reset link error:", err);
      setErrorMsg(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-15 text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <Brain className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="mt-6 text-3xl font-light font-serif tracking-tight text-slate-800">
          MindPilot <span className="font-semibold italic text-indigo-600">Secure Access</span>
        </h2>
        <p className="mt-2 text-xs text-slate-400 font-mono tracking-wider uppercase">
          Empowering competitive preparation wellness
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-15">
        <div className="bg-white py-10 px-6 sm:px-10 border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-100/50 space-y-6">
          
          {forgotMode ? (
            // FORGOT PASSWORD SCREEN
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-slate-800 mb-1">Reset Password</h3>
                <p className="text-xs text-slate-400 mb-4">
                  We'll email you a secure link to reset your password and reclaim access.
                </p>
              </div>

              <div>
                <label htmlFor="reset-email" className="block text-[11px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                  Academic Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-300">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@institute.com"
                    className="pl-9 w-full p-3 rounded-2xl border border-slate-200 outline-none text-sm text-slate-700 bg-slate-50/50 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {errorMsg && (
                <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs flex gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-mono">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex gap-2.5">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-mono">{successMsg}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Request Secure Reset"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 text-center font-medium py-1 cursor-pointer transition-colors"
                >
                  Return to Login
                </button>
              </div>
            </form>
          ) : (
            // LOG IN & REGISTER SCREEN
            <>
              <form onSubmit={handleEmailAuth} className="space-y-5">
                {isSignUp && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label htmlFor="reg-name" className="block text-[11px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Yogesh Mishra"
                        className="w-full p-3 rounded-2xl border border-slate-200 outline-none text-sm text-slate-700 bg-slate-50/50 focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label htmlFor="exam-select" className="block text-[11px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                        Select Target Exam
                      </label>
                      <select
                        id="exam-select"
                        value={targetExam}
                        onChange={(e) => setTargetExam(e.target.value)}
                        className="w-full p-3 rounded-2xl border border-slate-200 outline-none text-sm text-slate-700 bg-slate-50/50 focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                      >
                        {SUPPORTED_EXAMS.map((exam) => (
                          <option key={exam} value={exam}>{exam}</option>
                        ))}
                      </select>
                    </motion.div>
                  </>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-[11px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                    Academic Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-300">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@institute.com"
                      className="pl-9 w-full p-3 rounded-2xl border border-slate-200 outline-none text-sm text-slate-700 bg-slate-50/50 focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="auth-pw" className="block text-[11px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(true);
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-[11px] font-medium text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-300">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="auth-pw"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 w-full p-3 rounded-2xl border border-slate-200 outline-none text-sm text-slate-700 bg-slate-50/50 focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs flex gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-mono">{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex gap-2.5">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-mono">{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 transition-all text-white font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Complete Registration</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6 select-none pointer-events-none">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs font-mono uppercase tracking-widest text-slate-400">
                  <span className="bg-white px-3">or credentials bypass</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
              >
                {/* Custom modern Google stylized icon path */}
                <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.67 0 3.14.58 4.29 1.69l3.19-3.19C17.51 1.66 14.95 1 12 1 7.35 1 3.39 3.65 1.51 7.5l3.77 2.92C6.18 7.37 8.87 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.44-1.1 2.66-2.33 3.48l3.63 2.82c2.13-1.97 3.75-4.87 3.75-8.4z" />
                  <path fill="#FBBC05" d="M5.28 10.42c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.51 2.9C.55 4.83 0 7.02 0 9.32s.55 4.49 1.51 6.42l3.77-2.92z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.63-2.82c-.99.66-2.23 1.07-3.75 1.07-3.13 0-5.82-2.33-6.72-5.38L2.09 16.1c1.88 3.85 5.84 6.9 10.42 6.9z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-slate-500 hover:text-indigo-600 transition-colors font-medium cursor-pointer"
                >
                  {isSignUp ? "Already registered? Sign In here" : "Need an account? Sign Up for free"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
