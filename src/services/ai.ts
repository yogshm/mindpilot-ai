/**
 * MindPilot AI Core Backend Service Router
 */

import { AnalysisResult, JournalEntry, MentalScores, PanicIntervention, WeeklyWellnessReport } from "../types";

/**
 * Handle HTTP response errors with descriptive message formatting
 */
async function handleHttpResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown HTTP transport error");
    throw new Error(`AI Service Error (${response.status}): ${errorText}`);
  }
  return response;
}

/**
 * Service class carrying isolated network calls to MindPilot's server backend
 */
export const aiService = {
  /**
   * Analyzes student text entry to extract 5-channel clinical telemetry
   */
  async analyzeJournalEntry(text: string): Promise<AnalysisResult> {
    if (!text || typeof text !== "string" || text.trim() === "") {
      throw new Error("Cannot analyze an empty or invalid text stream");
    }
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const verifiedResponse = await handleHttpResponse(response);
    return verifiedResponse.json();
  },

  /**
   * Evaluates student messages to generate adaptive 3-step coping logs and cognitive resets
   */
  async getCoachRoomAdvice(
    currentStateText: string,
    scores: MentalScores | null,
    userMessage: string
  ): Promise<{ advice: string; plan: string[]; exerciseTitle: string; exercise: string }> {
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStateText, scores, userMessage }),
    });
    const verifiedResponse = await handleHttpResponse(response);
    return verifiedResponse.json();
  },

  /**
   * Aggregates historical logs to evaluate trends, shifts, and weekly recovery guidelines
   */
  async generateWeeklyWellnessReport(entries: JournalEntry[]): Promise<WeeklyWellnessReport> {
    if (!entries || entries.length === 0) {
      throw new Error("Weekly report compilation requires at least one previous daily log");
    }
    const response = await fetch("/api/generate-weekly-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    const verifiedResponse = await handleHttpResponse(response);
    return verifiedResponse.json();
  },

  /**
   * Pulls high-level immediate box-breathing templates and grounding affirmations
   */
  async getEmergencyPanicIntervention(): Promise<PanicIntervention> {
    const response = await fetch("/api/emergency-panic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const verifiedResponse = await handleHttpResponse(response);
    return verifiedResponse.json();
  },

  /**
   * Computes holistic burnout indexes from historical journal contents
   */
  async predictBurnoutRisk(
    journals: JournalEntry[],
    moodLogs: Array<{ sleepHours: number; studyHours: number; stressScore: number }>
  ): Promise<{
    burnoutRisk: "Low" | "Medium" | "High";
    explanation: string;
    factors: {
      moodTrend: string;
      journalSentiment: string;
      sleepHoursAvg: number;
      studyHoursAvg: number;
      stressTrend: string;
    };
  }> {
    const response = await fetch("/api/burnout-risk-predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journals, moodLogs }),
    });
    const verifiedResponse = await handleHttpResponse(response);
    return verifiedResponse.json();
  },

  /**
   * Prompts Gemini to compose encouraging future-self support letters
   */
  async generateFutureSelfLetter(
    targetExam: string,
    displayName: string
  ): Promise<{ letterText: string }> {
    const response = await fetch("/api/generate-future-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetExam, displayName }),
    });
    const verifiedResponse = await handleHttpResponse(response);
    return verifiedResponse.json();
  },

  /**
   * Identifies emotional correlations such as pre-mock anxieties
   */
  async discoverEmotionalPatterns(
    entries: JournalEntry[],
    moodLogs?: any[]
  ): Promise<{
    patterns: Array<{
      pattern: string;
      confidence: number;
      details: string;
      recommendation: string;
    }>;
  }> {
    const response = await fetch("/api/pattern-discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, moodLogs: moodLogs || [] }),
    });
    const verifiedResponse = await handleHttpResponse(response);
    return verifiedResponse.json();
  },

  /**
   * Resolves premium ElevenLabs TTS or falls back to Web Speech Synthesis API
   */
  async getVoiceTTS(text: string): Promise<{ fallback: boolean; audioUrl?: string }> {
    if (!text || text.trim() === "") {
      throw new Error("Text parameter for TTS conversion is empty");
    }
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const verifiedResponse = await handleHttpResponse(response);
    const contentType = verifiedResponse.headers.get("Content-Type");

    if (contentType && contentType.includes("audio/mpeg")) {
      const blob = await verifiedResponse.blob();
      const audioUrl = URL.createObjectURL(blob);
      return { fallback: false, audioUrl };
    } else {
      const data = await verifiedResponse.json();
      return { fallback: data.fallback !== false, audioUrl: undefined };
    }
  }
};
