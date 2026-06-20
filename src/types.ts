export interface MentalScores {
  stress: number;      // 0 - 100 (high is more stressed)
  motivation: number;  // 0 - 100
  focus: number;       // 0 - 100
  confidence: number;  // 0 - 100
  energy: number;      // 0 - 100
}

export type BurnoutRiskLevel = 'Low' | 'Medium' | 'High';

export interface StressTrigger {
  trigger: string;       // e.g., "Comparison Anxiety", "Family Pressure"
  score: number;         // 0 - 100
  description: string;   // Short context
  action: string;        // Recommended coping action
}

export interface AnalysisResult {
  scores: MentalScores;
  burnoutRisk: BurnoutRiskLevel;
  detectedPatterns: string[];
  stressTriggers: StressTrigger[];
  mentorMessage: string;
  recoveryActions: string[];
  sleepConcerns: string;
  procrastinationTriggers: string;
}

export interface JournalEntry {
  id: string;
  userId?: string;
  date: string; // ISO string
  text: string;
  analysis: AnalysisResult | null;
  scores: MentalScores;
}

export interface WeeklyWellnessReport {
  startDate: string;
  endDate: string;
  stressTrend: 'up' | 'down' | 'stable';
  stressChangePercentage: number;
  confidenceTrend: 'up' | 'down' | 'stable';
  confidenceChangePercentage: number;
  focusTrend: 'up' | 'down' | 'stable';
  focusChangePercentage: number;
  burnoutRiskTrend: BurnoutRiskLevel;
  executiveSummary: string;
  recoveryRecommendation: string;
}

export interface PanicIntervention {
  breathingGuide: {
    title: string;
    description: string;
    steps: string[];
  };
  affirmations: string[];
  immediateActions: string[];
  shortTermMessage: string;
}

export interface DailyGoal {
  id: string;
  userId?: string;
  text: string;
  category: "Study" | "Wellness";
  metric?: string; // e.g. "2 hours", "1 session"
  completed: boolean;
  createdAt: string; // ISO string
}

