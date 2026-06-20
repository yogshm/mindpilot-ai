import { describe, it, expect } from "vitest";
import { 
  processStudyGoalsReport, 
  getCognitiveLoadRecommendation, 
  parseCompetitiveExamStressorKeywords, 
  calculateStressVariability 
} from "./academicCalculations";
import { DailyGoal, JournalEntry } from "../types";

describe("MindPilot Academic Calculations and Clinical Burnout Indices Unit Tests", () => {
  describe("processStudyGoalsReport", () => {
    it("should handle empty or fallback bounds gracefully", () => {
      const result = processStudyGoalsReport([]);
      expect(result.completionRate).toBe(0);
      expect(result.studyCount).toBe(0);
      expect(result.pacingRiskLevel).toBe("Low");
    });

    it("should calculate correct category distribution and overall completion rate", () => {
      const mockGoals: DailyGoal[] = [
        { id: "g1", text: "Revision Physics", category: "Study", completed: true, createdAt: "2026-06-20T00:00:00Z" },
        { id: "g2", text: "Revision Chemistry", category: "Study", completed: false, createdAt: "2026-06-20T00:00:00Z" },
        { id: "g3", text: "Active rest breathing", category: "Wellness", completed: true, createdAt: "2026-06-20T00:00:00Z" },
        { id: "g4", text: "Walk 15 mins", category: "Wellness", completed: false, createdAt: "2026-06-20T00:00:00Z" }
      ];

      const report = processStudyGoalsReport(mockGoals);
      expect(report.completionRate).toBe(50); // 2 out of 4 are complete
      expect(report.studyCount).toBe(2);
      expect(report.studyCompleted).toBe(1);
      expect(report.wellnessCount).toBe(2);
      expect(report.wellnessCompleted).toBe(1);
      expect(report.pacingRiskLevel).toBe("Medium"); // 1 incomplete study goal
    });

    it("should flag High pacing risk if multiple study goals remain incomplete", () => {
      const mockGoals: DailyGoal[] = [
        { id: "g1", text: "Math PYQs", category: "Study", completed: false, createdAt: "2026-06-20T00:00:00Z" },
        { id: "g2", text: "Aptitude Sectionals", category: "Study", completed: false, createdAt: "2026-06-20T00:00:00Z" },
        { id: "g3", text: "Mock Analysis", category: "Study", completed: false, createdAt: "2026-06-20T00:00:00Z" },
        { id: "g4", text: "Quiet nap session", category: "Wellness", completed: true, createdAt: "2026-06-20T00:00:00Z" }
      ];

      const report = processStudyGoalsReport(mockGoals);
      expect(report.pacingRiskLevel).toBe("High"); // 3 incomplete study goals
    });
  });

  describe("getCognitiveLoadRecommendation", () => {
    it("should advise short workload limit and no new topics under extremely high stress index", () => {
      const advice = getCognitiveLoadRecommendation(85, 40, 20);
      expect(advice.canTakeNewComplexTopic).toBe(false);
      expect(advice.workloadLimitMinutes).toBe(60);
      expect(advice.recommendedFocusRatio).toBe(0.3);
      expect(advice.pacingMessage).toContain("high-stress overload");
    });

    it("should advise cautious Pomodoro-based studying under moderate load levels", () => {
      const advice = getCognitiveLoadRecommendation(55, 60, 50);
      expect(advice.canTakeNewComplexTopic).toBe(false);
      expect(advice.workloadLimitMinutes).toBe(180);
      expect(advice.recommendedFocusRatio).toBe(0.6);
      expect(advice.pacingMessage).toContain("fatigue indicated");
    });

    it("should encourage deep studying under premium calm and focused indicators", () => {
      const advice = getCognitiveLoadRecommendation(20, 90, 85);
      expect(advice.canTakeNewComplexTopic).toBe(true);
      expect(advice.workloadLimitMinutes).toBe(480);
      expect(advice.recommendedFocusRatio).toBe(0.9);
      expect(advice.pacingMessage).toContain("Ideal psychological preparation");
    });

    it("should clamp inputs strictly within safe boundaries", () => {
      const adviceOver = getCognitiveLoadRecommendation(150, -20, 800);
      expect(adviceOver.canTakeNewComplexTopic).toBe(false);
      expect(adviceOver.workloadLimitMinutes).toBe(60);
    });
  });

  describe("parseCompetitiveExamStressorKeywords", () => {
    it("should identify NEET and JEE references and elevate anxiety multiplier", () => {
      const analysis = parseCompetitiveExamStressorKeywords("Feeling so lost with NEET and mock JEE papers.");
      expect(analysis.detectedExams).toContain("NEET");
      expect(analysis.detectedExams).toContain("JEE");
      expect(analysis.anxietyMultiplier).toBeGreaterThan(1.2);
    });

    it("should recognize UPSC and secondary fear-of-failure tags correctly", () => {
      const analysis = parseCompetitiveExamStressorKeywords("I fear I will fail to clear UPSC this year.");
      expect(analysis.detectedExams).toContain("UPSC");
      expect(analysis.anxietyMultiplier).toBe(1.44); // 1.25 * 1.15 = 1.4375 rounded to 1.44
    });

    it("should return standard flat baseline multi if no high-stakes exams are mentioned", () => {
      const analysis = parseCompetitiveExamStressorKeywords("Some standard homework assignment today.");
      expect(analysis.detectedExams).toEqual([]);
      expect(analysis.anxietyMultiplier).toBe(1.0);
    });

    it("should handle invalid inputs silently and safely", () => {
      // @ts-ignore
      const analysis = parseCompetitiveExamStressorKeywords(null);
      expect(analysis.detectedExams).toEqual([]);
      expect(analysis.anxietyMultiplier).toBe(1.0);
    });
  });

  describe("calculateStressVariability", () => {
    it("should return zero for fewer than two diary records", () => {
      expect(calculateStressVariability([])).toBe(0);
      expect(calculateStressVariability([{ id: "j1", date: "now", text: "hello", scores: { stress: 50, motivation: 50, focus: 50, confidence: 50, energy: 50 }, analysis: null }])).toBe(0);
    });

    it("should calculate exact mathematical standard deviation index for series", () => {
      const records: JournalEntry[] = [
        { id: "r1", date: "now-1", text: "text", analysis: null, scores: { stress: 40, motivation: 50, focus: 50, confidence: 50, energy: 50 } },
        { id: "r2", date: "now-2", text: "text", analysis: null, scores: { stress: 80, motivation: 50, focus: 50, confidence: 50, energy: 50 } }
      ];
      // Mean: 60. Deviations: -20, 20. Variance: (400 + 400)/2 = 400. StdDev: 20
      expect(calculateStressVariability(records)).toBe(20.0);
    });
  });
});
