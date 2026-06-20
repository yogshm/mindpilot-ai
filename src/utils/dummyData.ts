import { JournalEntry } from "../types";

export const getInitialEntries = (): JournalEntry[] => {
  return [
    {
      id: "initial-1",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      text: "Studied 10 hours for GATE today. Attempted a simulated test but made several silly algebraic mistakes. I feel extremely anxious that my preparation is falling behind. My revision modules are piling up and there's not enough time to master all the control systems chapters.",
      scores: {
        stress: 72,
        motivation: 65,
        focus: 58,
        confidence: 45,
        energy: 60
      },
      analysis: {
        scores: {
          stress: 72,
          motivation: 65,
          focus: 58,
          confidence: 45,
          energy: 60
        },
        burnoutRisk: "Medium",
        detectedPatterns: [
          "Exam anxiety",
          "Self-doubt patterns"
        ],
        stressTriggers: [
          {
            trigger: "Comparison & Pace Anxiety",
            score: 75,
            description: "Feeling like the syllabus pace is out-running the revision schedule.",
            action: "Focus entirely on today's single formula booklet. Do not evaluate entire mock backlogs."
          },
          {
            trigger: "Silly Errors on Practice Tests",
            score: 65,
            description: "Exhaustion is leading to careless cognitive lapses during calculations.",
            action: "Do 5 rounds of Box Breathing before starting a new practice block to stabilize focus."
          }
        ],
        mentorMessage: "Today you seem moderately fatigued. Standard preparation involves small technical cycles. We recommend shifting your focus tomorrow from rigorous new topic study to passive card review or formula listing.",
        recoveryActions: [
          "Establish a strict screen-shutdown schedule 30 minutes before sleep.",
          "Complete a short 2-minute posture-reset walk in raw sunlight.",
          "Write down exactly 3 simple formulas you solved perfectly today."
        ],
        sleepConcerns: "Mild sleep disruptions flagged due to late-night screen revision schedules.",
        procrastinationTriggers: "Task avoidance on control systems due to fear of complex calculations."
      }
    },
    {
      id: "initial-2",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      text: "Woke up with a bad headache. Took 2 hours to get out of bed. Only studied about 4 hours. Checked cutoff ranks for GATE on forums and compared myself to people who already finished the syllabus twice. Felt terribly discouraged and guilty. Total waste of a day.",
      scores: {
        stress: 85,
        motivation: 35,
        focus: 40,
        confidence: 30,
        energy: 42
      },
      analysis: {
        scores: {
          stress: 85,
          motivation: 35,
          focus: 40,
          confidence: 30,
          energy: 42
        },
        burnoutRisk: "High",
        detectedPatterns: [
          "Burnout patterns",
          "Self-doubt patterns",
          "Procrastination triggers",
          "Negative self-talk"
        ],
        stressTriggers: [
          {
            trigger: "Peer Comparison Discord",
            score: 90,
            description: "Comparing personal phase 1 schedule with idealized peer completion claims.",
            action: "Mute forum threads for the next 48 hours. Your exam prep is highly individual."
          },
          {
            trigger: "Negative Self-Criticism Block",
            score: 80,
            description: "Describing standard fatigue blocks as a 'total waste of a day.'",
            action: "Take a compassionate evening. The brain needs rest blocks to solidify memory structures."
          }
        ],
        mentorMessage: "Your stress levels are very high today. This is an explicit exhaustion pattern. Do not force dense chapters tomorrow. Prioritize basic active retrieval cards or resting.",
        recoveryActions: [
          "Stop reading competitive forum posts for 48 hours.",
          "Drink 3 liters of water and walk outdoors for 15 minutes without your phone.",
          "Do a 10-minute micro-nap after lunch to address headache cycles."
        ],
        sleepConcerns: "Poor morning wakefulness and headache signals strongly suggest sleep quality deficit.",
        procrastinationTriggers: "Social-comparison avoidance is causing total motivational drag on core topics."
      }
    },
    {
      id: "initial-3",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      text: "I took a recovery morning. Slept 8 hours. Studied in a quiet Library during the afternoon. Finished a dense chapter on signal processing and felt really stable. Focus was clear. Still nervous but feeling more like myself.",
      scores: {
        stress: 45,
        motivation: 75,
        focus: 78,
        confidence: 62,
        energy: 70
      },
      analysis: {
        scores: {
          stress: 45,
          motivation: 75,
          focus: 78,
          confidence: 62,
          energy: 70
        },
        burnoutRisk: "Low",
        detectedPatterns: [
          "Motivation rebound"
        ],
        stressTriggers: [
          {
            trigger: "Mild Exam Nerves",
            score: 40,
            description: "Normal background tension regarding final scores.",
            action: "Continue leveraging structured libraries to preserve environmental focus."
          }
        ],
        mentorMessage: "This is a great recovery cycle! You proved that allocating sleep and changing environment can fully restore focus. This proves that rest is a productive strategy.",
        recoveryActions: [
          "Do a 10-minute active recall review of the signal chapter tomorrow morning.",
          "Keep study sessions to 50-minute blocks with 10-minute active rests.",
          "Continue maintaining 8 hours of sleep. It clearly boosts recall."
        ],
        sleepConcerns: "Sleep quality restored to 8 hours. High alert levels have subsided.",
        procrastinationTriggers: "None detected. Environmental shift (Library) resolved task-avoidance triggers."
      }
    }
  ];
};
