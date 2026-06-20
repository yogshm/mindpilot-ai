/**
 * Hook managing Firestore synchronization of individual student study goals and coping alerts
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
import { DailyGoal } from "../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  GET = 'get',
  WRITE = 'write',
}

function logGoalsError(error: unknown, operationType: OperationType, goalId: string | null, userId: string | null) {
  console.error(`useGoals Error: Op:${operationType} for ID:${goalId} of User:${userId}. Message:`, error instanceof Error ? error.message : String(error));
}

/**
 * Accesses and synchronizes target student milestones with Cloud database
 */
export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      prevUserId.current = null;
      return;
    }

    if (prevUserId.current === user.uid) {
      return;
    }
    prevUserId.current = user.uid;
    setLoading(true);

    const goalsQuery = query(
      collection(db, "goals"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      goalsQuery,
      (snapshot) => {
        try {
          const fetched = snapshot.docs.map(doc => doc.data() as DailyGoal);
          // chronologically stable stacking by creation timestamp
          fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setGoals(fetched);
          setError(null);
        } catch (err) {
          logGoalsError(err, OperationType.GET, null, user.uid);
          setError("Failed to compile goals histories");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        logGoalsError(err, OperationType.GET, null, user.uid);
        setError("Missing or insufficient permissions for goals schema");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  /**
   * Synchronizes list of daily goals with Google Firestore, performing incremental deletes/writes
   */
  const updateGoals = useCallback(async (updatedGoals: DailyGoal[]) => {
    if (!user) return;

    try {
      // Find and delete goals no longer present in updated list
      const existingIds = new Set(updatedGoals.map(g => g.id));
      const deletedGoals = goals.filter(g => !existingIds.has(g.id));

      for (const dg of deletedGoals) {
        try {
          await deleteDoc(doc(db, "goals", dg.id));
        } catch (err) {
          logGoalsError(err, OperationType.DELETE, dg.id, user.uid);
        }
      }

      // Upsert modified or new creations
      for (const g of updatedGoals) {
        try {
          const userScopedGoal: DailyGoal = {
            ...g,
            userId: user.uid,
          };
          await setDoc(doc(db, "goals", g.id), userScopedGoal);
        } catch (err) {
          logGoalsError(err, OperationType.WRITE, g.id, user.uid);
        }
      }
    } catch (err) {
      console.error("useGoals: Global synchronization exception raised:", err);
    }
  }, [user, goals]);

  return {
    goals,
    loading,
    error,
    updateGoals,
  };
}
export default useGoals;
