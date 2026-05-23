export interface LifeEvent {
  event: string;
  emotion: string;
}

export interface SelfTalkData {
  positiveCount: number;
  negativeCount: number;
  positiveExamples: string[];
  negativeExamples: string[];
}

export interface RecommendedIntervention {
  type: "breathing" | "ambient_music" | "guided_grounding" | "physical_movement";
  reason: string;
  instructions: string;
}

export interface InterventionFeedback {
  worked: "yes" | "no" | "unrated";
  userNotes?: string;
  updatedAt?: string;
}

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO string timestamps
  transcript: string;
  mood: string;
  moodIntensity: number; // 1 to 10
  stressLevel: number; // 1 to 10
  energyLevel: number; // 1 to 10
  themes: string[];
  triggers: string[];
  lifeEvents: LifeEvent[];
  selfTalk: SelfTalkData;
  spiralRisk: "low" | "medium" | "high";
  wellbeingScore: number; // 1 to 100
  wellbeingTips: string[];
  recommendedIntervention: RecommendedIntervention;
  interventionFeedback?: InterventionFeedback; // Option feedback to audit what works and what does not

  // Granular opt-in/opt-out toggles for dashboard calculations
  includeMood: boolean;
  includeStress: boolean;
  includeEnergy: boolean;
  includeSelfTalk: boolean;
  includeTriggersAndLifeEvents: boolean;
}
