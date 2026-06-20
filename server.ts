import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API successfully initialized on server.");
  } catch (err) {
    console.error("Failed to initialize Gemini API Client:", err);
  }
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Resilient mock fallbacks will be used.");
}

// -------------------------------------------------------------
// SECURE SERVER-SIDE API ROUTES FIRST
// -------------------------------------------------------------

// 1. Analyze Journal Entry Action
app.post("/api/analyze", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Journal entry text is empty or invalid" });
    return;
  }

  // Fallback Mock Engine in case API Key is missing or invalid
  const getMockAnalysis = (input: string) => {
    const lower = input.toLowerCase();
    
    // Default score levels
    let stress = 45;
    let motivation = 70;
    let focus = 65;
    let confidence = 60;
    let energy = 75;
    
    const triggers = [];
    const patterns = [];
    const actions = [];
    
    // Keyword Analysis
    if (lower.includes("behind") || lower.includes("fail") || lower.includes("study") && lower.includes("not enough")) {
      stress += 25;
      confidence -= 20;
      triggers.push({
        trigger: "Comparison & Performance Anxiety",
        score: 85,
        description: "Feeling behind compared to prep schedules or other peers.",
        action: "Focus on your individual progress chart. Redefine today's goal to a bite-sized topic."
      });
      patterns.push("Self-doubt patterns", "Negative self-talk");
    }
    
    if (lower.includes("sleep") || lower.includes("tired") || lower.includes("exhausted") || lower.includes("night")) {
      stress += 15;
      energy -= 30;
      focus -= 15;
      triggers.push({
        trigger: "Sleep Concerns & Fatigue",
        score: 80,
        description: "Reduced sleep levels disrupting cognitive recall.",
        action: "Establish a hard stop-time for studying at 10:30 PM. Complete 15 minutes of wind-down relaxation."
      });
      patterns.push("Sleep issues", "Burnout patterns");
    }
    
    if (lower.includes("procrastinate") || lower.includes("waste") || lower.includes("phone") || lower.includes("focus")) {
      focus -= 25;
      motivation -= 15;
      triggers.push({
        trigger: "Procrastination Triggers",
        score: 75,
        description: "Difficulty maintaining attention span due to task-avoidance.",
        action: "Use the 5-minute rule: commit to studying for just 5 minutes with all notifications off."
      });
      patterns.push("Procrastination triggers");
    }
    
    if (lower.includes("parent") || lower.includes("family") || lower.includes("expect") || lower.includes("pressure")) {
      stress += 20;
      triggers.push({
        trigger: "Family & Social Pressure",
        score: 78,
        description: "Anxiety arising from external expectations and family standards.",
        action: "Remind yourself that this exam preparation is a learning journey for yourself, not a validation tool for others."
      });
      patterns.push("Exam anxiety");
    }

    if (triggers.length === 0) {
      triggers.push({
        trigger: "Routine Preparation Stress",
        score: 40,
        description: "Standard daily workload and academic fatigue.",
        action: "Ensure you take structured 10-minute micro-breaks for every 50 minutes of focused studying."
      });
    }

    // Default responses based on scores
    const risk: "Low" | "Medium" | "High" = stress > 70 ? "High" : stress > 48 ? "Medium" : "Low";
    
    return {
      scores: {
        stress: Math.min(100, Math.max(0, stress)),
        motivation: Math.min(100, Math.max(0, motivation)),
        focus: Math.min(100, Math.max(0, focus)),
        confidence: Math.min(100, Math.max(0, confidence)),
        energy: Math.min(100, Math.max(0, energy))
      },
      burnoutRisk: risk,
      detectedPatterns: patterns.length ? patterns : ["Routine fatigue", "Exam anxiety"],
      stressTriggers: triggers,
      mentorMessage: stress > 70 
        ? "Today you seem quite mentally exhausted. High-stakes prep is a marathon, not a sprint. We highly recommend shifting your attention today to light review or revision instead of forcing yourself to learn new, dense topics."
        : "You are doing incredibly well pushing through today. Remember that taking short recovery blocks actually makes your brain retain concepts faster.",
      recoveryActions: [
        "Take a silent 15-minute screen-free walk.",
        "Drink at least 3 liters of water and practice 4-7-8 breathing on critical concepts.",
        "Acknowledge 3 topics you fully understand today and write them in your log."
      ],
      sleepConcerns: lower.includes("sleep") ? "Late night study session is causing sleep deficit. High cortisol levels detected from text expression." : "No critical sleep deficit patterns detected.",
      procrastinationTriggers: lower.includes("waste") || lower.includes("phone") ? "Distractions and high friction in starting complex chemistry / physics modules." : "Normal focus rhythm with mild academic tiredness."
    };
  };

  if (!ai) {
    // Return processed fallback instantly
    res.json(getMockAnalysis(text));
    return;
  }

  try {
    const prompt = `You are MindPilot AI, an expert, objective and deeply empathetic clinical-psychologist and exam wellness copilot for students preparing for competitive, high-stakes exams (like NEET, JEE, CAT, UPSC, GATE, and CUET) in India and globally.

Analyze the student's daily preparation journal or response:
"${text}"

Your goal is to detect underlying mental burnout patterns, procrastination, performance anxieties, self-doubts, sleep issues, parent pressure, and peer comparison triggers.

Return your exact analysis conforming to the requested JSON layout. Ensure scores are numbers 0-100.
Burnout risk must be either "Low", "Medium", or "High".
Ensure 'mentorMessage' is comforting, professional, objective, and provides concrete learning pacing tips (e.g., "suggest light review instead of learning heavy topics" when stress is high).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scores: {
              type: Type.OBJECT,
              properties: {
                stress: { type: Type.INTEGER, description: "Intensity of stress from 0 to 100 based on word patterns" },
                motivation: { type: Type.INTEGER, description: "Motivation/energy level from 0 to 100" },
                focus: { type: Type.INTEGER, description: "Focus or concentration index from 0 to 100" },
                confidence: { type: Type.INTEGER, description: "Subject confidence or preparedness score from 0 to 100" },
                energy: { type: Type.INTEGER, description: "Energy/Vigor indicator from 0 to 100" }
              },
              required: ["stress", "motivation", "focus", "confidence", "energy"]
            },
            burnoutRisk: { type: Type.STRING, description: "Burnout Risk Assessment: Low, Medium, or High" },
            detectedPatterns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of detected issues, e.g. Burnout patterns, Self-doubt patterns, Procrastination triggers, Sleep issues, Motivation decline, Exam anxiety, Negative self-talk"
            },
            stressTriggers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trigger: { type: Type.STRING, description: "Specific trigger label (e.g. Comparison, Sleep Deprivation, Family Expectations, Mock test dread)" },
                  score: { type: Type.INTEGER, description: "Trigger force or load 0-100" },
                  description: { type: Type.STRING, description: "A one sentence reason why this trigger was flag-raised" },
                  action: { type: Type.STRING, description: "A custom actionable recovery step for this particular trigger" }
                },
                required: ["trigger", "score", "description", "action"]
              }
            },
            mentorMessage: { type: Type.STRING, description: "Empathetic, clear recommendation message as an adaptive mentor. Use no markdown formatting inside" },
            recoveryActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 highly actionable daily physical or mental recovery actions tailored to this entry"
            },
            sleepConcerns: { type: Type.STRING, description: "Explicit summary of sleep concerns, or 'None detected'" },
            procrastinationTriggers: { type: Type.STRING, description: "Explicit summary of procrastination triggers, or 'None detected'" }
          },
          required: ["scores", "burnoutRisk", "detectedPatterns", "stressTriggers", "mentorMessage", "recoveryActions", "sleepConcerns", "procrastinationTriggers"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      res.json(JSON.parse(resultText.trim()));
    } else {
      res.json(getMockAnalysis(text));
    }
  } catch (err: any) {
    console.error("Gemini API direct error on /api/analyze:", err);
    res.json(getMockAnalysis(text));
  }
});

// 2. Adaptive Coping Mentor / Chat Advice
app.post("/api/coach", async (req, res) => {
  const { currentStateText, scores, userMessage } = req.body;
  
  const formattedState = scores 
    ? `Current Student Health Matrix - Stress: ${scores.stress}%, Motivation: ${scores.motivation}%, Focus: ${scores.focus}%, Confidence: ${scores.confidence}%, Energy: ${scores.energy}%`
    : `Unknown preparation state`;

  const getFallbackCoachResponse = () => {
    return {
      advice: "Remember, daily consistency is a marathon, not an overnight sprint. Breaks are not 'wasted time' — they are the cognitive glue that cements concepts in your long-term memory.",
      plan: [
        "Take a 5-minute mindful breathing break right now.",
        "Divide your study goal for the next 2 hours into exactly one single problem or concept.",
        "Declutter your immediate physical study desk to give your brain absolute structural focus."
      ],
      exerciseTitle: "Rapid Academic Reset (3-Minute De-shackle)",
      exercise: "Inhale slowly for 4 seconds, block your breath for 4 seconds, exhale fully for 6 seconds. Repeat 3 times while visualization of looking at a calm sunset. Write down one single formula or concept you are confident with."
    };
  };

  if (!ai) {
    res.json(getFallbackCoachResponse());
    return;
  }

  try {
    const prompt = `You are the MindPilot AI Wellness Specialist, an elite mental coach for students prepping for highly demanding exams.
    
Student Context:
- Student Journal Summary / State: "${currentStateText || "Routine prep logs"}"
- ${formattedState}
- User Question / Thought: "${userMessage || "I feel overwhelmed by my backlog modules."}"

Provide:
1. Empathetic, direct, practical, and action-oriented specialist advice (no educational generic filler).
2. A 3-step rapid recovery micro-plan for today.
3. A 2-minute actionable wellness or cognitive reset exercise suited to their current mental scores.

Output your exact coaching feedback in JSON layout adhering STRICTLY to this format:
{
  "advice": "empathetic text of advice (no markdown)",
  "plan": ["step 1", "step 2", "step 3"],
  "exerciseTitle": "Exercise name",
  "exercise": "Specific step-by-step description of the physical or mental exercise"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            plan: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            exerciseTitle: { type: Type.STRING },
            exercise: { type: Type.STRING }
          },
          required: ["advice", "plan", "exerciseTitle", "exercise"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      res.json(JSON.parse(resultText.trim()));
    } else {
      res.json(getFallbackCoachResponse());
    }
  } catch (err) {
    console.error("Gemini API Error on /api/coach:", err);
    res.json(getFallbackCoachResponse());
  }
});

// 3. Weekly Report Generator Integration
app.post("/api/generate-weekly-report", async (req, res) => {
  const { entries } = req.body;
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    res.status(400).json({ error: "No past entry metrics available to compile a reports overview." });
    return;
  }

  const formattedLog = entries.map((e: any, idx: number) => {
    return `Day ${idx + 1} (${e.date || "Unknown Date"}) | Journal: "${e.text}" | Stress: ${e.scores?.stress}%, Motivation: ${e.scores?.motivation}%, Focus: ${e.scores?.focus}%, Confidence: ${e.scores?.confidence}%`;
  }).join("\n");

  const getFallbackReport = () => {
    return {
      startDate: "Last 7 Days",
      endDate: "Today",
      stressTrend: "stable",
      stressChangePercentage: 2,
      confidenceTrend: "up",
      confidenceChangePercentage: 5,
      focusTrend: "up",
      focusChangePercentage: 8,
      burnoutRiskTrend: "Medium",
      executiveSummary: "Your focus and study continuity are steady, though small cumulative late-night fatigue points have built up in your stress index. Keep taking structural 10-minute micro-breaks during long problem-solving sessions.",
      recoveryRecommendation: "Schedule one completely study-free evening block. Spend this block eating your favorite food or talking with a trusted friend to lower cortisol."
    };
  };

  if (!ai) {
    res.json(getFallbackReport());
    return;
  }

  try {
    const prompt = `You are a chief clinical-student counselor evaluating a full week of logged entries:
${formattedLog}

Based on these sequential entries, detect underlying trends. Compute:
1. Stress Trend: either "up", "down", or "stable".
2. Stress Change Percentage (approximate relative change, positive integer).
3. Confidence Trend: either "up", "down", or "stable".
4. Confidence Change Percentage (positive integer).
5. Focus Trend: either "up", "down", or "stable".
6. Focus Change Percentage (positive integer).
7. Predicted Burnout Risk level trend: "Low", "Medium", or "High".
8. A comprehensive executive summary of their mental status.
9. An official Weekly Recovery Directive.

Your output must be returned STRICTLY as a JSON matching the following schema:
{
  "startDate": "Start date label",
  "endDate": "End date label",
  "stressTrend": "up/down/stable",
  "stressChangePercentage": 15,
  "confidenceTrend": "up/down/stable",
  "confidenceChangePercentage": 10,
  "focusTrend": "up/down/stable",
  "focusChangePercentage": 22,
  "burnoutRiskTrend": "Low/Medium/High",
  "executiveSummary": "Paragraph summary details",
  "recoveryRecommendation": "Actionable weekly task directive"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            startDate: { type: Type.STRING },
            endDate: { type: Type.STRING },
            stressTrend: { type: Type.STRING },
            stressChangePercentage: { type: Type.INTEGER },
            confidenceTrend: { type: Type.STRING },
            confidenceChangePercentage: { type: Type.INTEGER },
            focusTrend: { type: Type.STRING },
            focusChangePercentage: { type: Type.INTEGER },
            burnoutRiskTrend: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            recoveryRecommendation: { type: Type.STRING }
          },
          required: ["startDate", "endDate", "stressTrend", "stressChangePercentage", "confidenceTrend", "confidenceChangePercentage", "focusTrend", "focusChangePercentage", "burnoutRiskTrend", "executiveSummary", "recoveryRecommendation"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      res.json(JSON.parse(resultText.trim()));
    } else {
      res.json(getFallbackReport());
    }
  } catch (err) {
    console.error("Gemini API Error on weekly summary generation:", err);
    res.json(getFallbackReport());
  }
});

// 4. Emergency Calm / Panic Mode
app.post("/api/emergency-panic", async (req, res) => {
  const getPanicIntervention = () => {
    return {
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
  };

  if (!ai) {
    res.json(getPanicIntervention());
    return;
  }

  try {
    const prompt = `A student preparing for NEET/JEE/UPSC has clicked the emergency 'I am panicking / Need Help Now' trigger.
    Generate a highly immediate, calming, clinical box-breathing guide, soothing affirmations, immediate steps to stop physiological panic, and an empathetic short-term action plan.

    Return the details EXACTLY as this JSON:
    {
      "breathingGuide": {
        "title": "Breathing guide name",
        "description": "Short explanation",
        "steps": ["Step 1 info", "Step 2 info", "Step 3 info", "Step 4 info"]
      },
      "affirmations": ["Affirmation 1", "Affirmation 2", "Affirmation 3"],
      "immediateActions": ["Action 1", "Action 2", "Action 3"],
      "shortTermMessage": "A direct, comforting, and authoritative reassurances block (no markdown/bold markers please)."
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breathingGuide: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "description", "steps"]
            },
            affirmations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            immediateActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            shortTermMessage: { type: Type.STRING }
          },
          required: ["breathingGuide", "affirmations", "immediateActions", "shortTermMessage"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      res.json(JSON.parse(resultText.trim()));
    } else {
      res.json(getPanicIntervention());
    }
  } catch (err) {
    console.error("Gemini API Error on panic emergency:", err);
    res.json(getPanicIntervention());
  }
});

// 5. Burnout Risk Predictor Action
app.post("/api/burnout-risk-predict", async (req, res) => {
  const { journals, moodLogs } = req.body;

  const currentLogSummary = `
  Journals Count: ${journals?.length || 0}
  Mood Logs Count: ${moodLogs?.length || 0}
  Recent Sleep Metrics: ${JSON.stringify(moodLogs?.map((m: any) => m.sleepHours) || [])}
  Recent Study Metrics: ${JSON.stringify(moodLogs?.map((m: any) => m.studyHours) || [])}
  Recent Stress Indicators: ${JSON.stringify(moodLogs?.map((m: any) => m.stressScore) || [])}
  `;

  const getFallbackBurnoutPrediction = () => {
    return {
      burnoutRisk: "Medium",
      explanation: "You have persistent academic pressure with slight sleep anomalies in your recent check-ins. Taking regular active recovery blocks is advised to avoid cognitive saturation.",
      factors: {
        moodTrend: "Fluctuating with study blocks",
        journalSentiment: "Mildly self-critical",
        sleepHoursAvg: 6.2,
        studyHoursAvg: 7.8,
        stressTrend: "Gradually climbing before mocks"
      }
    };
  };

  if (!ai) {
    res.json(getFallbackBurnoutPrediction());
    return;
  }

  try {
    const prompt = `You are MindPilot Burnout Diagnostic Agent, an expert in clinical academic performance tracking.
    Analyze the student's historical preparation logs:
    ${currentLogSummary}

    Evaluate the burnout risk carefully. Your output must be returned STRICTLY as a JSON conforming to this schema:
    {
      "burnoutRisk": "Low" | "Medium" | "High",
      "explanation": "Expert evaluation message detailing exactly why and how the current mood trends, journal sentiments, sleep hours, study hours, and stress trends lead to this risk score.",
      "factors": {
        "moodTrend": "Brief descriptive label of mood direction",
        "journalSentiment": "Sentiment details e.g. Critical / Safe / Overwhelmed",
        "sleepHoursAvg": 6.5,
        "studyHoursAvg": 8.5,
        "stressTrend": "Label of stress direction"
      }
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            burnoutRisk: { type: Type.STRING, description: "Low, Medium, or High" },
            explanation: { type: Type.STRING },
            factors: {
              type: Type.OBJECT,
              properties: {
                moodTrend: { type: Type.STRING },
                journalSentiment: { type: Type.STRING },
                sleepHoursAvg: { type: Type.NUMBER },
                studyHoursAvg: { type: Type.NUMBER },
                stressTrend: { type: Type.STRING }
              },
              required: ["moodTrend", "journalSentiment", "sleepHoursAvg", "studyHoursAvg", "stressTrend"]
            }
          },
          required: ["burnoutRisk", "explanation", "factors"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      res.json(JSON.parse(resultText.trim()));
    } else {
      res.json(getFallbackBurnoutPrediction());
    }
  } catch (err) {
    console.error("Gemini API Error on burnout predict:", err);
    res.json(getFallbackBurnoutPrediction());
  }
});

// 6. Future Self Letter Generation
app.post("/api/generate-future-letter", async (req, res) => {
  const { targetExam, displayName } = req.body;
  const examLabel = targetExam || "your dream exam";
  const nameLabel = displayName || "Future Champion";

  const getFallbackLetter = () => {
    return {
      letterText: `My Dear Self,

I am writing this to you from a place of absolute peace and immense gratitude. Today, we did it. We cleared ${examLabel} with spectacular outcomes, and everyone is celebrating.

I know how hard those late nights in 2026 felt. I remember the doubt, the tiredness, and the fear that you weren't doing enough while taking mock tests. But I want to tell you: every single tear, every focused study slot, and every deep breath you took was building a stronger, more resilient mind. 

You was enough. You are enough. Keep moving, stay steady, trust in your daily consistency, and remember that we are already there waiting for you.

Deepest love,
Your Future Self`
    };
  };

  if (!ai) {
    res.json(getFallbackLetter());
    return;
  }

  try {
    const prompt = `You are the Future Self of ${nameLabel}, writing from a secure future year, shortly after successfully passing and placing with elite rankings on the exceptionally competitive ${examLabel} exam in India/globally.
    Write a highly supportive, deeply moving, warm, and comforting letters from the future.
    Acknowledge their current late-night battles, doubts, tiredness, and mock test anxieties, but reassure them that their effort was fully worth it. Tell them what the future looks like now that the target has been successfully achieved.
    Keep the letter professional, highly artistic, and intimate. Give specific wisdom suited to clearing ${examLabel} (e.g. revision consistency, mental stamina). Focus on keeping them grounded and inspired.
    Format your output strictly in JSON format as:
    {
      "letterText": "Complete text of the letter with paragraphs. Use clean newlines instead of markdown tags."
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            letterText: { type: Type.STRING }
          },
          required: ["letterText"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      res.json(JSON.parse(resultText.trim()));
    } else {
      res.json(getFallbackLetter());
    }
  } catch (err) {
    console.error("Gemini API Error on future letter:", err);
    res.json(getFallbackLetter());
  }
});

// 7. Emotional Pattern Discovery Action
app.post("/api/pattern-discovery", async (req, res) => {
  const { entries, moodLogs } = req.body;
  
  const payload = `
  Journals: ${JSON.stringify(entries?.map((e: any) => ({ text: e.text, date: e.date })) || [])}
  Mood Logs: ${JSON.stringify(moodLogs || [])}
  `;

  const getFallbackPatterns = () => {
    return {
      patterns: [
        {
          pattern: "Stress increases before scheduled Mock Tests",
          confidence: 88,
          details: "We detected high cortisol semantics and critical self-doubt spikes on Fridays and Saturdays in your logged logs.",
          recommendation: "Shift focus on Friday nights from active mock problem solving to simple visual formula mapping and warm-up exercises."
        },
        {
          pattern: "Confidence drops following restricted Sleep Duration",
          confidence: 76,
          details: "A sleep log of less than 6 hours directly aligns with the self-isolation and memory retention deficit noted inside text journals.",
          recommendation: "Commit to a non-negotiable 7-hour bedtime structure. Consistency is far more impactful than midnight fatigue cramming."
        }
      ]
    };
  };

  if (!ai) {
    res.json(getFallbackPatterns());
    return;
  }

  try {
    const prompt = `You are senior research student counselor and behavioral systems analyst.
    Analyze the student's logged preparation metrics:
    ${payload}

    Your goal is to find core non-obvious emotional patterns. E.g.
    - Stress increases before mock tests
    - Confidence drops after poor sleep
    - Motivation improves after exercise
    - Anxiety spikes on Sundays
    
    Synthesize exactly 2 or 3 high-confidence discovered pattern details. Return the output STRICTLY as a JSON conforming to this schema:
    {
      "patterns": [
        {
          "pattern": "Brief pattern summary statement (e.g., Confidence drops following restricted Sleep duration)",
          "confidence": 85,
          "details": "Explanation with scientific alignment to logged diaries",
          "recommendation": "Tailored actionable preventative advice for this particular behavior"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pattern: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  details: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                },
                required: ["pattern", "confidence", "details", "recommendation"]
              }
            }
          },
          required: ["patterns"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      res.json(JSON.parse(resultText.trim()));
    } else {
      res.json(getFallbackPatterns());
    }
  } catch (err) {
    console.error("Gemini API Error on pattern discovery:", err);
    res.json(getFallbackPatterns());
  }
});

// 8. ElevenLabs TTS API Route
app.post("/api/tts", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: "Text is empty or invalid" });
    return;
  }

  const elApiKey = process.env.ELEVENLABS_API_KEY;
  if (!elApiKey || elApiKey === "MY_ELEVENLABS_API_KEY") {
    // Return flag indicating to use browser speech synthesis directly
    res.json({ fallback: true });
    return;
  }

  try {
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Standard premium warm female voice (Rachel)
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elApiKey
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Elevenlabs failure status:", response.status, errText);
      res.json({ fallback: true, error: errText });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length
    });
    res.send(buffer);
  } catch (err: any) {
    console.error("Failed to fetch speech conversion from Elevenlabs:", err);
    res.json({ fallback: true, error: err.message });
  }
});


// -------------------------------------------------------------
// VITE DEV / PRODUCTION DIRECTIVES
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindPilot AI backend running on http://localhost:${PORT}`);
  });
}

startServer();
