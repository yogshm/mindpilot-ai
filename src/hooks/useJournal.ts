/**
 * Hook managing Firestore-backed clinical Journal entry histories
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./useAuth";
import { JournalEntry, MentalScores, AnalysisResult } from "../types";

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
  userId: string | null;
}

function logFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    userId,
    operationType,
    path
  };
  console.error('useJournal: Firestore Error Info:', JSON.stringify(errInfo));
}

/**
 * Custom hook tracking real-time client-to-server sync of journal entries
 */
export function useJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize cache to prevent redundant hook dependency refreshes
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      prevUserId.current = null;
      return;
    }

    // Skip re-subscription if userId hasn't shifted
    if (prevUserId.current === user.uid) {
      return;
    }
    prevUserId.current = user.uid;
    setLoading(true);

    const entriesQuery = query(
      collection(db, "journal_entries"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      entriesQuery,
      (snapshot) => {
        try {
          if (snapshot.empty) {
            setEntries([]);
          } else {
            const fetched = snapshot.docs.map(d => d.data() as JournalEntry);
            // Dynamic chronological arrangement descending
            fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setEntries(fetched);
          }
          setError(null);
        } catch (err) {
          logFirestoreError(err, OperationType.GET, "journal_entries", user.uid);
          setError("Failed to process journal histories schema");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        logFirestoreError(err, OperationType.GET, "journal_entries", user.uid);
        setError("Missing or insufficient permissions for entries database");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  /**
   * Generates a new analyzed entry inside Firestore
   */
  const saveEntry = useCallback(async (
    text: string, 
    scores: MentalScores, 
    analysis: AnalysisResult
  ): Promise<JournalEntry> => {
    if (!user) {
      throw new Error("Authentication wrapper is required to save historical logs");
    }
    
    // Quick sanitization and input validation
    if (!text || text.trim() === "") {
      throw new Error("Journal narrative text cannot be blank");
    }

    const newEntry: JournalEntry = {
      id: "entry_" + Date.now(),
      userId: user.uid,
      date: new Date().toISOString(),
      text: text.trim(),
      scores,
      analysis
    };

    try {
      await setDoc(doc(db, "journal_entries", newEntry.id), newEntry);
      return newEntry;
    } catch (err) {
      logFirestoreError(err, OperationType.WRITE, `journal_entries/${newEntry.id}`, user.uid);
      throw new Error("Failed to write daily log into cloud storage");
    }
  }, [user]);

  /**
   * Deletes all journal listings belonging to this authenticated user
   */
  const clearLogs = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    // Loop deletions sequentially for security
    const failureIds: string[] = [];
    for (const entry of entries) {
      try {
        await deleteDoc(doc(db, "journal_entries", entry.id));
      } catch (err) {
        logFirestoreError(err, OperationType.DELETE, `journal_entries/${entry.id}`, user.uid);
        failureIds.push(entry.id);
      }
    }

    if (failureIds.length > 0) {
      throw new Error(`Failed to delete some record resources (${failureIds.length} failed)`);
    }
  }, [user, entries]);

  return {
    entries,
    loading,
    error,
    saveEntry,
    clearLogs
  };
}
