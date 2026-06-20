/**
 * MindPilot Authentication Context & Session Controller
 */

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from "firebase/auth";
import { auth } from "../firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  authChecking: boolean;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Global provider of active authentications, managing loading checkpoints
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Auth Service Exception: Google login failed:", err);
      throw err;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Auth Service Exception: Sign-out failed:", err);
      throw err;
    }
  }, []);

  return (
    <React.Fragment>
      <AuthContext.Provider value={{ user, authChecking, handleLogin, handleLogout }}>
        {children}
      </AuthContext.Provider>
    </React.Fragment>
  );
}

/**
 * Custom hook to safely grab auth state within children nodes
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be invoked inside a verified <AuthProvider> wrap");
  }
  return context;
}
export default AuthContext;
