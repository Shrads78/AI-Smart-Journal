import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DailyHealthSummary, HealthSnapshot, HealthInsight } from "../types";
import { Moon, Heart, Activity, Footprints, Flame, TrendingUp, TrendingDown, Minus, Watch, RefreshCw, ChevronRight } from "lucide-react";

interface Props {
  onLaunchIntervention: (type: "breathing" | "ambient_music" | "guided_grounding" | "physical_movement") => void;
}

const METRIC_GOALS = {
  sleep: 7,
  steps: 8000,
  hrv: 50,
  restingHR: 65,
};

function TrendIcon({ trend }: { trend: "improving" | "declining" | "stable" }) {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trend === "declining") return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />;
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
}

function SleepQualityBadge({ quality }: { quality: DailyHealthSummary["sleepQuality"] }) {
  const map = {
    excellent: "bg-emerald-100 text-emerald-700",
    good: "bg-blue-100 text-blue-700",
    fair: "bg-amber-100 text-amber-700",
    poor: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${map[quality]}`}>
      {quality}
    </span>
  );
}

function ProgressRing({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2EBE5" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

function MiniBarChart({ data, goal, color }: { data: number[]; goal?: number; color: string }) {
  const max = Math.max(...data, goal || 0) * 1.1 || 1;
  return (
    <div className="flex items-end gap-1 h-16 w-full">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
          <div
            className="w-full rounded-t-sm transition-all duration-700"
            style={{ height: `${(v / max) * 100}%`, backgroundColor: color, opacity: i === 0 ? 1 : 0.5 + (i / data.length) * 0.3 }}
          />
        </div>
      ))}
      {/* Goal line overlay would need absolute positioning — simplified here */}
    </div>
  );
}

function InsightCard({ insight, onAction }: { insight: HealthInsight; onAction: () => void }) {
  const colors = {
    alert: { bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400" },
    info: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400" },
  };
  const c = colors[insight.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${c.bg} ${c.border} border rounded-2xl p-4 flex items-start gap-3`}
    >
      <span className="text-2xl shrink-0 mt-0.5">{insight.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
          <h4 className="text-xs font-bold text-[#1C3224]">{insight.title}</h4>
        </div>
        <p className="text-[11px] text-[#4A6D58] leading-relaxed">{insight.description}</p>
        {insight.suggestedIntervention && (
          <button
            onClick={onAction}
            className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#1E4631] hover:text-[#2D6A4F] transition-colors"
          >
            Try an intervention <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function WearablesDashboard({ onLaunchIntervention }: Props) {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [snapRes, insRes] = await Promise.all([
        fetch("/api/health/summary"),
        fetch("/api/health/insights"),
      ]);
      if (!snapRes.ok || !insRes.ok) throw new Error("Failed to load health data");
      const snapData = await snapRes.json();
      const insData = await insRes.json();
      setSnapshot(snapData);
      setInsights(insData.insights || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-[#4A6D58]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
          <Watch className="h-10 w-10 text-[#2D6A4F]" />
        </motion.div>
        <p className="text-sm font-semibold">Parsing Apple Health data…</p>
        <p className="text-xs opacity-70">Reading 46MB of biometric history</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
        <p className="font-bold text-sm">Failed to load wearable data</p>
        <p className="text-xs mt-1 mb-3">{error}</p>
        <button onClick={fetchData} className="text-xs font-bold flex items-center gap-1 mx-auto hover:underline">
          <RefreshCw className="h-3 w-3" /> Try again
        </button>
      </div>
    );
  }

  const { today, last7Days, trends, avgLast7 } = snapshot;

  // Prepare chart data (oldest → newest for readability)
  const sleepData = [...last7Days].reverse().map((d) => d.sleepHours);
  const stepsData = [...last7Days].reverse().map((d) => d.steps);
  const hrData = [...last7Days].reverse().map((d) => d.avgHeartRate || 0);
  const hrvData = [...last7Days].reverse().map((d) => d.hrv || 0);
  const dayLabels = [...last7Days].reverse().map((d) => {
    const date = new Date(d.date + "T12:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-semibold text-[#1C3224] flex items-center gap-2">
            <Watch className="h-5 w-5 text-[#2D6A4F]" />
            Wearables Dashboard
          </h2>
          <p className="text-xs text-[#4A6D58] mt-0.5">Apple Watch · Last synced: {today.date}</p>
        </div>
        <button
          onClick={fetchData}
          id="refresh-health-btn"
          className="p-2 rounded-xl hover:bg-[#E2EBE5] text-[#4A6D58] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Smart AI Insight Banner (top alerts) */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-extrabold text-[#2D6A4F] uppercase tracking-widest">
            ⚡ Smart Health Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <InsightCard
                key={i}
                insight={insight}
                onAction={() => insight.suggestedIntervention && onLaunchIntervention(insight.suggestedIntervention)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's Vitals — metric cards */}
      <div>
        <h3 className="text-[10px] font-extrabold text-[#2D6A4F] uppercase tracking-widest mb-3">
          📅 Today's Vitals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Sleep */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className="bg-white border border-[#D1DFD6] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm"
          >
            <div className="relative">
              <ProgressRing value={today.sleepHours} max={METRIC_GOALS.sleep} color="#6366f1" />
              <Moon className="absolute inset-0 m-auto h-5 w-5 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#1C3224]">{today.sleepHours > 0 ? today.sleepHours + "h" : "—"}</p>
              <p className="text-[10px] text-[#4A6D58] font-medium">Sleep</p>
              {today.sleepHours > 0 && <SleepQualityBadge quality={today.sleepQuality} />}
            </div>
          </motion.div>

          {/* Resting HR */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            className="bg-white border border-[#D1DFD6] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm"
          >
            <div className="relative">
              <ProgressRing value={today.restingHeartRate || 0} max={100} color="#f43f5e" />
              <Heart className="absolute inset-0 m-auto h-5 w-5 text-rose-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#1C3224]">{today.restingHeartRate ? today.restingHeartRate + " bpm" : "—"}</p>
              <p className="text-[10px] text-[#4A6D58] font-medium">Resting HR</p>
            </div>
          </motion.div>

          {/* HRV */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="bg-white border border-[#D1DFD6] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm"
          >
            <div className="relative">
              <ProgressRing value={today.hrv || 0} max={100} color="#10b981" />
              <Activity className="absolute inset-0 m-auto h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#1C3224]">{today.hrv ? today.hrv + " ms" : "—"}</p>
              <p className="text-[10px] text-[#4A6D58] font-medium">HRV</p>
              {today.hrv && (
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${today.hrv < 30 ? "bg-rose-100 text-rose-700" : today.hrv > 50 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {today.hrv < 30 ? "Low" : today.hrv > 50 ? "Good" : "Fair"}
                </span>
              )}
            </div>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
            className="bg-white border border-[#D1DFD6] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm"
          >
            <div className="relative">
              <ProgressRing value={today.steps} max={METRIC_GOALS.steps} color="#3b82f6" />
              <Footprints className="absolute inset-0 m-auto h-5 w-5 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#1C3224]">{today.steps > 0 ? today.steps.toLocaleString() : "—"}</p>
              <p className="text-[10px] text-[#4A6D58] font-medium">Steps</p>
              <p className="text-[9px] text-slate-400">Goal: {METRIC_GOALS.steps.toLocaleString()}</p>
            </div>
          </motion.div>

          {/* Active Calories */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="bg-white border border-[#D1DFD6] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm"
          >
            <div className="relative">
              <ProgressRing value={today.activeCalories} max={500} color="#f59e0b" />
              <Flame className="absolute inset-0 m-auto h-5 w-5 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#1C3224]">{today.activeCalories > 0 ? today.activeCalories + " kcal" : "—"}</p>
              <p className="text-[10px] text-[#4A6D58] font-medium">Active Cal</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 7-Day Trend Charts */}
      <div>
        <h3 className="text-[10px] font-extrabold text-[#2D6A4F] uppercase tracking-widest mb-3">
          📈 7-Day Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Sleep Chart */}
          <div className="bg-white border border-[#D1DFD6] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-[#1C3224]">Sleep Duration</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon trend={trends.sleep} />
                <span className="text-[10px] text-[#4A6D58] font-medium capitalize">{trends.sleep}</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-20 w-full mb-2">
              {sleepData.map((v, i) => {
                const pct = Math.min(v / 10, 1);
                const isGoal = v >= METRIC_GOALS.sleep;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div
                      className="w-full rounded-t-lg transition-all duration-700"
                      style={{
                        height: `${pct * 100}%`,
                        backgroundColor: isGoal ? "#6366f1" : "#e0e7ff",
                        minHeight: v > 0 ? "4px" : "0px",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {dayLabels.map((d, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-slate-400 font-medium">{d}</div>
              ))}
            </div>
            <p className="text-[10px] text-[#4A6D58] mt-2">7-day avg: <strong>{avgLast7.sleepHours}h</strong> · Goal: {METRIC_GOALS.sleep}h</p>
          </div>

          {/* Steps Chart */}
          <div className="bg-white border border-[#D1DFD6] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-[#1C3224]">Daily Steps</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon trend={trends.activity} />
                <span className="text-[10px] text-[#4A6D58] font-medium capitalize">{trends.activity}</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-20 w-full mb-2">
              {stepsData.map((v, i) => {
                const maxV = Math.max(...stepsData, METRIC_GOALS.steps) * 1.1;
                const pct = maxV > 0 ? v / maxV : 0;
                const isGoal = v >= METRIC_GOALS.steps;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div
                      className="w-full rounded-t-lg transition-all duration-700"
                      style={{
                        height: `${pct * 100}%`,
                        backgroundColor: isGoal ? "#3b82f6" : "#dbeafe",
                        minHeight: v > 0 ? "4px" : "0px",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {dayLabels.map((d, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-slate-400 font-medium">{d}</div>
              ))}
            </div>
            <p className="text-[10px] text-[#4A6D58] mt-2">7-day avg: <strong>{avgLast7.steps.toLocaleString()}</strong> · Goal: {METRIC_GOALS.steps.toLocaleString()}</p>
          </div>

          {/* HRV Chart */}
          <div className="bg-white border border-[#D1DFD6] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-[#1C3224]">HRV (Recovery)</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon trend={trends.hrv} />
                <span className="text-[10px] text-[#4A6D58] font-medium capitalize">{trends.hrv}</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-20 w-full mb-2">
              {hrvData.map((v, i) => {
                const maxV = Math.max(...hrvData) * 1.2 || 100;
                const pct = maxV > 0 ? v / maxV : 0;
                const isGood = v > 40;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-700"
                      style={{
                        height: `${pct * 100}%`,
                        backgroundColor: isGood ? "#10b981" : v > 0 ? "#fcd34d" : "#e5e7eb",
                        minHeight: v > 0 ? "4px" : "0px",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {dayLabels.map((d, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-slate-400 font-medium">{d}</div>
              ))}
            </div>
            <p className="text-[10px] text-[#4A6D58] mt-2">7-day avg: <strong>{avgLast7.hrv ? avgLast7.hrv.toFixed(0) + "ms" : "—"}</strong> · Higher = better recovery</p>
          </div>

          {/* Heart Rate Chart */}
          <div className="bg-white border border-[#D1DFD6] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-bold text-[#1C3224]">Avg Heart Rate</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon trend={trends.heartRate} />
                <span className="text-[10px] text-[#4A6D58] font-medium capitalize">{trends.heartRate}</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-20 w-full mb-2">
              {hrData.map((v, i) => {
                const maxV = Math.max(...hrData) * 1.2 || 100;
                const pct = maxV > 0 ? v / maxV : 0;
                const isElevated = v > 85;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-700"
                      style={{
                        height: `${pct * 100}%`,
                        backgroundColor: isElevated ? "#f43f5e" : v > 0 ? "#fda4af" : "#e5e7eb",
                        minHeight: v > 0 ? "4px" : "0px",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {dayLabels.map((d, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-slate-400 font-medium">{d}</div>
              ))}
            </div>
            <p className="text-[10px] text-[#4A6D58] mt-2">7-day avg: <strong>{avgLast7.avgHeartRate ? avgLast7.avgHeartRate.toFixed(0) + " bpm" : "—"}</strong></p>
          </div>
        </div>
      </div>

      {/* Wearable connection hint */}
      <div className="bg-[#1E4631]/5 border border-[#D1DFD6] rounded-2xl p-4 flex items-center gap-3">
        <Watch className="h-5 w-5 text-[#2D6A4F] shrink-0" />
        <div>
          <p className="text-xs font-bold text-[#1C3224]">Data Source: Apple Health Export</p>
          <p className="text-[10px] text-[#4A6D58]">
            Currently using your exported Apple Watch data. Live wearable integrations (Fitbit, Oura, Garmin) coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
