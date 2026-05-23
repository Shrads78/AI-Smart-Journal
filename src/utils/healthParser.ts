import fs from "fs";
import path from "path";
import { DailyHealthSummary, HealthSnapshot, HealthInsight } from "../../src/types";

const DATA_PATH = path.join(process.cwd(), "data", "export.xml");

// ─── Lightweight streaming XML parser (no external deps) ─────────────────────
// Apple Health XML has millions of attributes; we parse line by line to avoid
// loading the full DOM into memory.

interface RawRecord {
  type: string;
  value: string;
  unit: string;
  startDate: string;
  endDate: string;
}

function parseRecords(xml: string): RawRecord[] {
  const records: RawRecord[] = [];
  // Match <Record ...> tags with attributes
  const recordRegex = /<Record\s([^/]*?)\/>/gs;
  let match: RegExpExecArray | null;
  while ((match = recordRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const get = (name: string) => {
      const m = attrs.match(new RegExp(`${name}="([^"]*)"`));
      return m ? m[1] : "";
    };
    records.push({
      type: get("type"),
      value: get("value"),
      unit: get("unit"),
      startDate: get("startDate"),
      endDate: get("endDate"),
    });
  }
  return records;
}

function toDateStr(dateStr: string): string {
  // e.g. "2025-06-10 09:19:23 -0700" → "2025-06-10"
  return dateStr.substring(0, 10);
}

function parseSleepValue(value: string): number {
  // HKCategoryValueSleepAnalysisAsleep / InBed → count as asleep
  if (value.includes("Asleep") || value === "HKCategoryValueSleepAnalysisAsleepUnspecified") return 1;
  return 0;
}

function computeSleepQuality(hours: number): DailyHealthSummary["sleepQuality"] {
  if (hours >= 7.5) return "excellent";
  if (hours >= 6.5) return "good";
  if (hours >= 5) return "fair";
  return "poor";
}

function computeTrend(values: (number | null)[], higher = true): "improving" | "declining" | "stable" {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 3) return "stable";
  const first = valid.slice(0, Math.ceil(valid.length / 2));
  const last = valid.slice(Math.floor(valid.length / 2));
  const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
  const lastAvg = last.reduce((a, b) => a + b, 0) / last.length;
  const diff = lastAvg - firstAvg;
  const threshold = firstAvg * 0.03; // 3% change
  if (Math.abs(diff) < threshold) return "stable";
  if (higher) return diff > 0 ? "improving" : "declining";
  else return diff < 0 ? "improving" : "declining"; // lower HR/stress = improving
}

// ─── Main parsing function ───────────────────────────────────────────────────

let _cachedSnapshot: HealthSnapshot | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 min

export function parseHealthData(): HealthSnapshot {
  const now = Date.now();
  if (_cachedSnapshot && now - _cacheTime < CACHE_TTL) return _cachedSnapshot;

  const xml = fs.readFileSync(DATA_PATH, "utf8");
  const records = parseRecords(xml);

  // Group by type and date
  type DayMap = Record<string, number[]>;
  const steps: DayMap = {};
  const heartRates: DayMap = {};
  const restingHR: DayMap = {};
  const hrv: DayMap = {};
  const calories: DayMap = {};
  const exercise: DayMap = {};
  // Sleep: accumulate minutes by day
  const sleepMinutes: Record<string, number> = {};

  for (const r of records) {
    const day = toDateStr(r.startDate);
    if (!day) continue;
    const val = parseFloat(r.value);

    switch (r.type) {
      case "HKQuantityTypeIdentifierStepCount":
        (steps[day] ||= []).push(val);
        break;
      case "HKQuantityTypeIdentifierHeartRate":
        (heartRates[day] ||= []).push(val);
        break;
      case "HKQuantityTypeIdentifierRestingHeartRate":
        (restingHR[day] ||= []).push(val);
        break;
      case "HKQuantityTypeIdentifierHeartRateVariabilitySDNN":
        (hrv[day] ||= []).push(val);
        break;
      case "HKQuantityTypeIdentifierActiveEnergyBurned":
        (calories[day] ||= []).push(val);
        break;
      case "HKQuantityTypeIdentifierAppleExerciseTime":
        (exercise[day] ||= []).push(val);
        break;
      case "HKCategoryTypeIdentifierSleepAnalysis": {
        if (parseSleepValue(r.value)) {
          const start = new Date(r.startDate).getTime();
          const end = new Date(r.endDate).getTime();
          const mins = Math.max(0, (end - start) / 60000);
          sleepMinutes[day] = (sleepMinutes[day] || 0) + mins;
        }
        break;
      }
    }
  }

  // Build daily summaries
  const allDays = new Set([
    ...Object.keys(steps),
    ...Object.keys(heartRates),
    ...Object.keys(sleepMinutes),
  ]);

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const dailyMap: Record<string, DailyHealthSummary> = {};
  for (const day of allDays) {
    const sleepH = (sleepMinutes[day] || 0) / 60;
    const avgHR = avg(heartRates[day] || []);
    const restHR = avg(restingHR[day] || []);
    const hrvVal = avg(hrv[day] || []);
    const stepsVal = sum(steps[day] || []);
    const calsVal = sum(calories[day] || []);
    const exVal = sum(exercise[day] || []);

    dailyMap[day] = {
      date: day,
      sleepHours: Math.round(sleepH * 10) / 10,
      sleepQuality: computeSleepQuality(sleepH),
      avgHeartRate: avgHR ? Math.round(avgHR) : null,
      restingHeartRate: restHR ? Math.round(restHR) : null,
      hrv: hrvVal ? Math.round(hrvVal * 10) / 10 : null,
      steps: Math.round(stepsVal),
      activeCalories: Math.round(calsVal),
      exerciseMinutes: Math.round(exVal),
    };
  }

  // Sort all days and get last 30
  const sortedDays = Object.keys(dailyMap).sort().reverse();
  const last30 = sortedDays.slice(0, 30).map((d) => dailyMap[d]);
  const last7 = last30.slice(0, 7);

  // Determine "today" — use most recent day with actual data
  const today = last30[0] || {
    date: new Date().toISOString().substring(0, 10),
    sleepHours: 0,
    sleepQuality: "fair" as const,
    avgHeartRate: null,
    restingHeartRate: null,
    hrv: null,
    steps: 0,
    activeCalories: 0,
    exerciseMinutes: 0,
  };

  const avgLast7 = {
    sleepHours: Math.round((last7.reduce((a, b) => a + b.sleepHours, 0) / last7.length) * 10) / 10,
    steps: Math.round(last7.reduce((a, b) => a + b.steps, 0) / last7.length),
    avgHeartRate: avg(last7.map((d) => d.avgHeartRate).filter((v): v is number => v !== null)),
    hrv: avg(last7.map((d) => d.hrv).filter((v): v is number => v !== null)),
  };

  const trends = {
    sleep: computeTrend(last7.map((d) => d.sleepHours), true),
    heartRate: computeTrend(last7.map((d) => d.avgHeartRate), false), // lower HR = improving
    hrv: computeTrend(last7.map((d) => d.hrv), true), // higher HRV = improving
    activity: computeTrend(last7.map((d) => d.steps), true),
  };

  _cachedSnapshot = { today, last7Days: last7, trends, avgLast7 };
  _cacheTime = now;
  return _cachedSnapshot;
}

// ─── Cross-signal Insight Engine ─────────────────────────────────────────────

export function generateHealthInsights(snapshot: HealthSnapshot): HealthInsight[] {
  const insights: HealthInsight[] = [];
  const { today, last7Days, avgLast7 } = snapshot;

  const poorSleepNights = last7Days.filter((d) => d.sleepHours < 6 && d.sleepHours > 0).length;
  const avgSleep = avgLast7.sleepHours;
  const avgHRV = avgLast7.hrv;
  const todaySteps = today.steps;
  const todayHRV = today.hrv;
  const todaySleep = today.sleepHours;

  // Sleep debt alert
  if (poorSleepNights >= 3) {
    insights.push({
      severity: "alert",
      icon: "😴",
      title: "Sleep Debt Building",
      description: `You've had fewer than 6 hours of sleep on ${poorSleepNights} of the last 7 nights (avg ${avgSleep.toFixed(1)}h). Sleep deprivation elevates cortisol and emotional reactivity — you may feel more irritable than usual.`,
      suggestedIntervention: "ambient_music",
    });
  } else if (todaySleep > 0 && todaySleep < 6) {
    insights.push({
      severity: "warning",
      icon: "🌙",
      title: "Low Sleep Last Night",
      description: `You slept ${todaySleep.toFixed(1)}h last night (below the 7h goal). Short sleep is linked to elevated stress responses and reduced emotional regulation.`,
      suggestedIntervention: "breathing",
    });
  }

  // HRV stress signal
  if (todayHRV !== null && todayHRV < 30) {
    insights.push({
      severity: "warning",
      icon: "🫀",
      title: "Low HRV — Recovery Needed",
      description: `Your HRV today is ${todayHRV}ms (low). HRV reflects your nervous system's flexibility — a low value suggests your body is under stress and needs recovery, not exertion.`,
      suggestedIntervention: "breathing",
    });
  } else if (avgHRV !== null && avgHRV > 50) {
    insights.push({
      severity: "info",
      icon: "💚",
      title: "Strong Recovery Signals",
      description: `Your 7-day average HRV is ${avgHRV?.toFixed(0)}ms — indicating good nervous system resilience. You're handling stress well physiologically.`,
      suggestedIntervention: null,
    });
  }

  // Low activity + potential mood impact
  if (todaySteps < 2000 && todaySteps > 0) {
    insights.push({
      severity: "info",
      icon: "👟",
      title: "Low Movement Day",
      description: `Only ${todaySteps.toLocaleString()} steps so far today. Physical movement is one of the fastest natural mood elevators — even a 10-minute walk can shift emotional state.`,
      suggestedIntervention: "physical_movement",
    });
  }

  // Correlated sleep + mood risk
  if (poorSleepNights >= 2 && todayHRV !== null && todayHRV < 35) {
    insights.push({
      severity: "alert",
      icon: "⚡",
      title: "Body & Mind Both Signaling Distress",
      description: `Poor sleep pattern + low HRV is a powerful combination. Your nervous system is running in overdrive. When you journal today, your emotional responses may feel amplified.`,
      suggestedIntervention: "guided_grounding",
    });
  }

  return insights;
}

// ─── Health context string for Gemini prompt injection ───────────────────────

export function buildHealthContext(snapshot: HealthSnapshot): string {
  const { today, avgLast7, trends } = snapshot;
  const lines: string[] = [
    "=== WEARABLE HEALTH CONTEXT (Apple Watch) ===",
    `Date of data: ${today.date}`,
    "",
    "TODAY'S BIOMETRICS:",
    `• Sleep last night: ${today.sleepHours > 0 ? today.sleepHours + "h (" + today.sleepQuality + ")" : "No data"}`,
    `• Resting Heart Rate: ${today.restingHeartRate ? today.restingHeartRate + " bpm" : "No data"}`,
    `• HRV (SDNN): ${today.hrv ? today.hrv + "ms" : "No data"} ${today.hrv && today.hrv < 30 ? "(LOW — elevated stress)" : today.hrv && today.hrv > 50 ? "(GOOD — resilient)" : ""}`,
    `• Steps today: ${today.steps.toLocaleString()}`,
    `• Active calories: ${today.activeCalories} kcal`,
    "",
    "7-DAY AVERAGES:",
    `• Avg sleep: ${avgLast7.sleepHours}h/night`,
    `• Avg steps: ${avgLast7.steps.toLocaleString()}/day`,
    `• Avg HRV: ${avgLast7.hrv ? avgLast7.hrv.toFixed(0) + "ms" : "No data"}`,
    "",
    "TRENDS:",
    `• Sleep: ${trends.sleep}`,
    `• HRV: ${trends.hrv}`,
    `• Activity: ${trends.activity}`,
    "",
    "INSTRUCTIONS: Use this wearable context to enrich your analysis:",
    "- If sleep < 6h or HRV is low, elevate spiralRisk accordingly",
    "- Reference specific biometrics when explaining emotional states (e.g. low HRV aligns with reported fatigue)",
    "- Tailor intervention recommendations to physical state (low HRV → rest-based, not physical_movement)",
    "- In wellbeingTips, include sleep/recovery suggestions if indicated",
    "===========================================",
  ];
  return lines.join("\n");
}
