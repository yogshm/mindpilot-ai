import { describe, it, expect } from "vitest";
import { 
  calculateAverageScore, 
  determineTrendDirection, 
  getRecommendedBreakDuration, 
  formatDateAbbreviation, 
  isValidAcademicEmail, 
  getBurnoutBadgeStyle 
} from "./helpers";
import { JournalEntry } from "../types";

describe("MindPilot Logic Helpers and Metrics Synthesizer Unit Tests", () => {
  const dummyEntries: JournalEntry[] = [
    {
      id: "test-1",
      date: "2026-06-18T00:00:00.000Z",
      text: "Had a highly stressful mock exam today. Feeling slightly exhausted.",
      analysis: null,
      scores: {
        stress: 85,
        motivation: 40,
        focus: 50,
        confidence: 30,
        energy: 45
      }
    },
    {
      id: "test-2",
      date: "2026-06-19T00:00:00.000Z",
      text: "Much better day, focused on light formulas revision in the library.",
      analysis: null,
      scores: {
        stress: 45,
        motivation: 80,
        focus: 85,
        confidence: 70,
        energy: 75
      }
    }
  ];

  describe("calculateAverageScore", () => {
    it("should calculate safe rounded averages of key metrics", () => {
      const avgStress = calculateAverageScore(dummyEntries, "stress");
      expect(avgStress).toBe(65); // (85 + 45) / 2 = 65

      const avgFocus = calculateAverageScore(dummyEntries, "focus");
      expect(avgFocus).toBe(68); // (50 + 85) / 2 = 67.5 -> rounded to 68
    });

    it("should return 0 when entries are empty", () => {
      expect(calculateAverageScore([], "stress")).toBe(0);
    });
  });

  describe("determineTrendDirection", () => {
    it("should identify positive or negative trends outside standard thresholds", () => {
      expect(determineTrendDirection(80, 70)).toBe("up");
      expect(determineTrendDirection(50, 70)).toBe("down");
    });

    it("should recognize stable states if difference inside threshold bounds", () => {
      expect(determineTrendDirection(62, 60, 3)).toBe("stable");
      expect(determineTrendDirection(59, 60, 3)).toBe("stable");
    });
  });

  describe("getRecommendedBreakDuration", () => {
    it("should allocate customized recovery periods based on user load levels", () => {
      expect(getRecommendedBreakDuration(85)).toBe(30);
      expect(getRecommendedBreakDuration(65)).toBe(15);
      expect(getRecommendedBreakDuration(30)).toBe(5);
    });
  });

  describe("formatDateAbbreviation", () => {
    it("should parse standard dates to local abbreviations", () => {
      const formatted = formatDateAbbreviation("2026-06-18T00:00:00.000Z");
      expect(formatted).toContain("Jun");
      expect(formatted).toContain("18");
    });

    it("should safely handle fallback results for bad signatures", () => {
      expect(formatDateAbbreviation("non-valid-date")).toBe("Today");
    });
  });

  describe("isValidAcademicEmail", () => {
    it("should confirm valid academic emails", () => {
      expect(isValidAcademicEmail("aspirant@institute.edu")).toBe(true);
      expect(isValidAcademicEmail("my.name.63@example.com")).toBe(true);
    });

    it("should filter out broken or un-formatted email types", () => {
      expect(isValidAcademicEmail("broken-email")).toBe(false);
      expect(isValidAcademicEmail("@domain.com")).toBe(false);
      expect(isValidAcademicEmail("")).toBe(false);
    });
  });

  describe("getBurnoutBadgeStyle", () => {
    it("should resolve correct color styles for each risk category", () => {
      expect(getBurnoutBadgeStyle("High").text).toContain("red");
      expect(getBurnoutBadgeStyle("Medium").text).toContain("orange");
      expect(getBurnoutBadgeStyle("Low").text).toContain("emerald");
      expect(getBurnoutBadgeStyle(undefined).text).toContain("emerald");
    });
  });
});
