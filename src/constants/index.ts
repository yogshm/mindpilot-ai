/**
 * MindPilot Centrally Managed System Constants
 */

import { MentalScores, PanicIntervention } from "../types";

export const DEFAULT_MENTAL_SCORES: MentalScores = {
  stress: 45,
  motivation: 70,
  focus: 65,
  confidence: 60,
  energy: 75,
};

export const BREATHING_BOX_DURATION_SECONDS = 4;

export const DEFAULT_PANIC_INTERVENTION: PanicIntervention = {
  breathingGuide: {
    title: "60-Second Box Resettlement",
    description: "A clinical box breathing standard used to quickly lower heart rate and reduce cortisol spikes.",
    steps: [
      "Inhale quietly through your nose for 4 seconds.",
      "Hold your lungs full of air for 4 seconds.",
      "Exhale gently through your mouth, parting your lips, for 4 seconds.",
      "Hold your lungs completely empty for 4 seconds before the next repetition."
    ]
  },
  affirmations: [
    "This moment is tough, but I am tougher than this single page or test.",
    "My worth as a human is entirely independent of my mock test scores.",
    "Panic is just an energy rush. I can let it step through me and dissolve slowly.",
    "I have worked hard and I am safe right now."
  ],
  immediateActions: [
    "Push your chair back and place both feet flat on the floor.",
    "Take a glass of cool water and sip it slowly, focusing on the temperature.",
    "Gently look around you and name 5 things you can physically see, 4 things you can touch, and 3 things you can hear."
  ],
  shortTermMessage: "You are experiencing high exam-anxiety. Please remember: No single test determines the ultimate flow of your life. Take this evening entirely off. Your cognitive health is your absolute greatest exam asset."
};

export const HIGH_STRESS_THRESHOLD = 75;
export const MEDIUM_STRESS_THRESHOLD = 48;

export const SUGGESTED_INQUIRIES = [
  "Organic chemistry is taking too long study-wise, and I feel super tired. How do I cope?",
  "I failed today's JEE physics mock simulator. The mechanics concepts was very difficult. Advice?",
  "I am experiencing severe pressure from my parents about my mock percentiles.",
  "I study 12 hours a day but my mock test grades are not improving. I feel like quitting."
];

export const COPING_DIAGNOSTICS_HINT = "Enter a state query or backlog feeling in the companion terminal. The coach will compile a structural 3-step coping action instantly.";

export const ELITE_EXAMS = [
  "JEE (Engineering)",
  "NEET (Medical)",
  "UPSC (Civil Services)",
  "CAT (Business)",
  "GATE (Graduate Engineering)",
  "UGC NET (Lectureship)",
  "GRE / GMAT"
];
