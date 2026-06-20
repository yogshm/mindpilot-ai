/**
 * MindPilot React Auths Hook
 */

import { useAuth as useAuthFromContext } from "../contexts/AuthContext";

/**
 * Accesses active Firebase Authentication state and triggers
 */
export function useAuth() {
  return useAuthFromContext();
}
