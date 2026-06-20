/**
 * Core AI Services Integration & Edge Cases Test Suite
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiService } from "./ai";
import { JournalEntry, MentalScores } from "../types";

// Mock global fetch
const globalFetchMock = vi.fn();
global.fetch = globalFetchMock;

describe("aiService Client Services Module Tests", () => {
  beforeEach(() => {
    globalFetchMock.mockReset();
  });

  describe("analyzeJournalEntry", () => {
    it("should safely validate that empty or invalid narratives fail fast without network requests", async () => {
      await expect(aiService.analyzeJournalEntry("")).rejects.toThrow(
        "Cannot analyze an empty"
      );
      await expect(aiService.analyzeJournalEntry("   ")).rejects.toThrow(
        "Cannot analyze an empty"
      );
      expect(globalFetchMock).not.toHaveBeenCalled();
    });

    it("should map valid analyzed parameters on successful standard server responses", async () => {
      const mockResult = {
        scores: { stress: 40, motivation: 80, focus: 75, confidence: 60, energy: 70 },
        summary: "Solid day of studies.",
        burnoutRisk: "Low",
        stressTriggers: [],
        healthyHabitDirectives: []
      };

      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const result = await aiService.analyzeJournalEntry("Worked on JEE physics mechanics.");
      expect(result).toEqual(mockResult);
      expect(globalFetchMock).toHaveBeenCalledWith(
        "/api/analyze",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ text: "Worked on JEE physics mechanics." }),
        })
      );
    });

    it("should bubble descriptive transport error logs under broken HTTP states", async () => {
      globalFetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded. Try again in 60 seconds."
      } as Response);

      await expect(
        aiService.analyzeJournalEntry("Trying to analyze under extreme stress.")
      ).rejects.toThrow("AI Service Error (429): Rate limit exceeded.");
    });
  });

  describe("getCoachRoomAdvice", () => {
    it("should fetch customized coaching recommendations based on journal history", async () => {
      const mockAdvice = {
        advice: "Take a walking pause.",
        plan: ["Breath", "Relax"],
        exerciseTitle: "Deep Breathing",
        exercise: "Box cycle"
      };

      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdvice
      } as Response);

      const scores: MentalScores = { stress: 50, motivation: 70, focus: 60, confidence: 65, energy: 60 };
      const response = await aiService.getCoachRoomAdvice(
        "Feeling slightly tired.",
        scores,
        "How do I study organically?"
      );

      expect(response).toEqual(mockAdvice);
      expect(globalFetchMock).toHaveBeenCalledWith(
        "/api/coach",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            currentStateText: "Feeling slightly tired.",
            scores,
            userMessage: "How do I study organically?"
          })
        })
      );
    });
  });

  describe("predictBurnoutRisk", () => {
    it("should resolve burnout index forecasts on valid historical data points", async () => {
      const mockSummary = {
        burnoutRisk: "Medium" as const,
        explanation: "Risk is medium due to moderate rest limits.",
        factors: {
          moodTrend: "Declining",
          journalSentiment: "Positive",
          sleepHoursAvg: 6,
          studyHoursAvg: 8,
          stressTrend: "Stable"
        }
      };

      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary
      } as Response);

      const sampleEntry: JournalEntry = {
        id: "test",
        userId: "user-123",
        date: "2026-06-20T00:00:00Z",
        text: "Studied very hard",
        scores: { stress: 40, motivation: 80, focus: 85, confidence: 70, energy: 75 },
        analysis: null
      };

      const result = await aiService.predictBurnoutRisk([sampleEntry], []);
      expect(result.burnoutRisk).toBe("Medium");
      expect(result.factors.sleepHoursAvg).toBe(6);
    });
  });

  describe("generateWeeklyWellnessReport", () => {
    it("should fail validation if student has no prior entries", async () => {
      await expect(aiService.generateWeeklyWellnessReport([])).rejects.toThrow(
        "Weekly report compilation requires at least one previous daily log"
      );
      expect(globalFetchMock).not.toHaveBeenCalled();
    });

    it("should issue proper requests to weekly report builder under valid entries count", async () => {
      const mockResult = {
        startDate: "Jun 14",
        endDate: "Jun 20",
        stressTrend: "down",
        stressChangePercentage: 10,
        confidenceTrend: "up",
        confidenceChangePercentage: 20,
        focusTrend: "stable",
        focusChangePercentage: 5,
        burnoutRiskTrend: "Low",
        executiveSummary: "Your scores look fantastic.",
        recoveryRecommendation: "Maintain your schedule."
      };

      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      } as Response);

      const sampleEntry: JournalEntry = {
        id: "test",
        userId: "user-123",
        date: "2026-06-20T00:00:00Z",
        text: "Reviewed mock papers",
        scores: { stress: 30, motivation: 90, focus: 95, confidence: 80, energy: 85 },
        analysis: null
      };

      const report = await aiService.generateWeeklyWellnessReport([sampleEntry]);
      expect(report.burnoutRiskTrend).toBe("Low");
      expect(globalFetchMock).toHaveBeenCalled();
    });
  });
});
