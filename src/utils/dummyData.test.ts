import { describe, it, expect } from "vitest";
import { getInitialEntries } from "./dummyData";

describe("MindPilot initial data structures unit test suite", () => {
  it("should output exactly 3 high-fidelity initial preparation logs", () => {
    const seeds = getInitialEntries();
    expect(seeds).toBeDefined();
    expect(Array.isArray(seeds)).toBe(true);
    expect(seeds.length).toBe(3);
  });

  it("should verify pre-analyzed stress, motivation, and focus parameters are sound", () => {
    const seeds = getInitialEntries();
    
    seeds.forEach((entry) => {
      expect(entry.id).toBeDefined();
      expect(entry.text.length).toBeGreaterThan(20);
      
      // Validate logical mental scores bounds
      const s = entry.scores;
      expect(s.stress).toBeGreaterThanOrEqual(0);
      expect(s.stress).toBeLessThanOrEqual(100);
      expect(s.motivation).toBeGreaterThanOrEqual(0);
      expect(s.motivation).toBeLessThanOrEqual(100);
      expect(s.focus).toBeGreaterThanOrEqual(0);
      expect(s.focus).toBeLessThanOrEqual(100);
      
      // Ensure analysis outcomes exist
      expect(entry.analysis).not.toBeNull();
      if (entry.analysis) {
        expect(["Low", "Medium", "High"]).toContain(entry.analysis.burnoutRisk);
        expect(Array.isArray(entry.analysis.detectedPatterns)).toBe(true);
        expect(Array.isArray(entry.analysis.stressTriggers)).toBe(true);
        expect(entry.analysis.stressTriggers.length).toBeGreaterThan(0);
      }
    });
  });
});
