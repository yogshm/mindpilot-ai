/**
 * MindPilot High-Precision Academic Calculations and Clinical Burnout Indices
 */

import { DailyGoal, JournalEntry } from "../types";

export interface StudyMetricsReport {
  completionRate: number; // 0 to 100
  studyCount: number;
  studyCompleted: number;
  wellnessCount: number;
  wellnessCompleted: number;
  pacingRiskLevel: "Low" | "Medium" | "High";
}

/**
 * Calculates unified study and wellness goal ratio completions.
 */
export function processStudyGoalsReport(goals: DailyGoal[]): StudyMetricsReport {
  if (!goals || goals.length === 0) {
    return {
      completionRate: 0,
      studyCount: 0,
      studyCompleted: 0,
      wellnessCount: 0,
      wellnessCompleted: 0,
      pacingRiskLevel: "Low"
    };
  }

  const study = goals.filter(g => g.category === "Study");
  const wellness = goals.filter(g => g.category === "Wellness");

  const studyCompleted = study.filter(g => g.completed).length;
  const wellnessCompleted = wellness.filter(g => g.completed).length;

  const totalCompleted = goals.filter(g => g.completed).length;
  const completionRate = Math.round((totalCompleted / goals.length) * 100);

  // Evaluate pacing risk based on remaining study goals and high ratio failures
  const incompleteStudyGoals = study.length - studyCompleted;
  let pacingRiskLevel: "Low" | "Medium" | "High" = "Low";

  if (incompleteStudyGoals >= 3) {
    pacingRiskLevel = "High";
  } else if (incompleteStudyGoals >= 1) {
    pacingRiskLevel = "Medium";
  }

  return {
    completionRate,
    studyCount: study.length,
    studyCompleted,
    wellnessCount: wellness.length,
    wellnessCompleted,
    pacingRiskLevel
  };
}

/**
 * Dynamically computes an empathetic Cognitive Load Recommendation based on current stress, focus, and energy.
 */
export function getCognitiveLoadRecommendation(
  stress: number,
  focus: number,
  energy: number
): {
  workloadLimitMinutes: number;
  canTakeNewComplexTopic: boolean;
  recommendedFocusRatio: number; // 0.0 to 1.0
  pacingMessage: string;
} {
  const normalizedStress = Math.max(0, Math.min(100, stress));
  const normalizedFocus = Math.max(0, Math.min(100, focus));
  const normalizedEnergy = Math.max(0, Math.min(100, energy));

  if (normalizedStress > 75) {
    return {
      workloadLimitMinutes: 60,
      canTakeNewComplexTopic: false,
      recommendedFocusRatio: 0.3,
      pacingMessage: "Immediate high-stress overload detected. Limit high-stakes study. Focus on mild active recall or take a mandatory recovery break."
    };
  }

  if (normalizedStress > 50 || normalizedEnergy < 40) {
    return {
      workloadLimitMinutes: 180,
      canTakeNewComplexTopic: false,
      recommendedFocusRatio: 0.6,
      pacingMessage: "Moderate academic fatigue indicated. Study in bite-sized Pomodoro chunks. Defer complex new chapters until rested."
    };
  }

  return {
    workloadLimitMinutes: 480,
    canTakeNewComplexTopic: true,
    recommendedFocusRatio: 0.9,
    pacingMessage: "Ideal psychological preparation rhythm. Keep target study goals active and utilize deep-focus focus blocks."
  };
}

/**
 * Parses user text entries to detect high-stress competitive exam keywords.
 */
export function parseCompetitiveExamStressorKeywords(text: string): {
  detectedExams: string[];
  anxietyMultiplier: number;
} {
  if (!text || typeof text !== "string") {
    return { detectedExams: [], anxietyMultiplier: 1.0 };
  }

  const query = text.toLowerCase();
  const exams: string[] = [];
  let multiplier = 1.0;

  if (query.includes("neet")) exams.push("NEET");
  if (query.includes("jee")) exams.push("JEE");
  if (query.includes("cat")) exams.push("CAT");
  if (query.includes("upsc")) exams.push("UPSC");
  if (query.includes("gate")) exams.push("GATE");

  if (exams.length > 0) {
    multiplier = 1.25; // 25% stress factor amplification from high-stakes exam references
  }

  if (query.includes("fail") || query.includes("behind") || query.includes("drop")) {
    multiplier *= 1.15; // secondary drop scenario multiplier
  }

  return {
    detectedExams: exams,
    anxietyMultiplier: parseFloat(multiplier.toFixed(2))
  };
}

/**
 * Calculates historical standard deviation stress variability index to evaluate if mental state is fluctuating wildly.
 */
export function calculateStressVariability(entries: JournalEntry[]): number {
  if (!entries || entries.length < 2) return 0;

  const scores = entries.map(e => e.scores?.stress || 0);
  const mean = scores.reduce((sum, val) => sum + val, 0) / scores.length;
  const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;

  return parseFloat(Math.sqrt(variance).toFixed(2));
}
