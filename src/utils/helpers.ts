/**
 * MindPilot Domain Helper Functions and Metrics Synthesizer
 */

import { JournalEntry } from "../types";

/**
 * Safely calculates the average of a specific mental score metric across entries.
 */
export function calculateAverageScore(
  entries: JournalEntry[],
  key: "stress" | "motivation" | "focus" | "confidence" | "energy"
): number {
  if (!entries || entries.length === 0) return 0;
  const total = entries.reduce((sum, entry) => {
    const scores = entry.scores;
    return sum + (scores ? scores[key] || 0 : 0);
  }, 0);
  return Math.round(total / entries.length);
}

/**
 * Dynamically compares current mental parameters against preceding historical entries to determine trend indices.
 */
export function determineTrendDirection(
  recentAvg: number,
  historicalAvg: number,
  threshold = 3
): "up" | "down" | "stable" {
  const diff = recentAvg - historicalAvg;
  if (Math.abs(diff) <= threshold) {
    return "stable";
  }
  return diff > 0 ? "up" : "down";
}

/**
 * Evaluates the required academic recovery pause duration based on stress scores.
 */
export function getRecommendedBreakDuration(stressScore: number): number {
  if (stressScore > 80) return 30; // 30 minutes for acute stress
  if (stressScore > 50) return 15; // 15 minutes for moderate stress
  return 5; // 5 minutes standard pause
}

/**
 * Formats calendar dates to high-density user-friendly abbreviations.
 */
export function formatDateAbbreviation(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Today";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Today";
  }
}

/**
 * Validates email addresses using a strict, robust regex filter.
 */
export function isValidAcademicEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(trimmed);
}

/**
 * Maps the high-impact burnout risk levels to human-accessible semantic theme styling classes.
 */
export function getBurnoutBadgeStyle(risk: string | undefined): {
  bg: string;
  text: string;
  border: string;
} {
  const normalized = risk || "Low";
  switch (normalized) {
    case "High":
      return {
        bg: "bg-red-50/90",
        text: "text-red-700",
        border: "border-red-200"
      };
    case "Medium":
      return {
        bg: "bg-orange-50/90",
        text: "text-orange-700",
        border: "border-orange-200"
      };
    case "Low":
    default:
      return {
        bg: "bg-emerald-50/90",
        text: "text-emerald-700",
        border: "border-emerald-200"
      };
  }
}
