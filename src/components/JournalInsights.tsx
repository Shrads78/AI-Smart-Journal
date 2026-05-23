import React, { useState } from "react";
import { JournalEntry } from "../types";
import { TrendingUp, Flame, Calendar, MessageSquare, Trash2, ShieldAlert, Heart, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface JournalInsightsProps {
  entries: JournalEntry[];
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export const JournalInsights: React.FC<JournalInsightsProps> = ({
  entries,
  onDeleteEntry,
  onClearAll,
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Filter entries that have active data in compliance with user opt-out settings
  const entriesWithStress = entries.filter((e) => e.includeStress !== false);
  const entriesWithEnergy = entries.filter((e) => e.includeEnergy !== false);
  const entriesWithSelfTalk = entries.filter((e) => e.includeSelfTalk !== false);
  const entriesWithTriggers = entries.filter((e) => e.includeTriggersAndLifeEvents !== false);

  // 1. Calculations for Stress & Energy averages
  const avgStress =
    entriesWithStress.length > 0
      ? (entriesWithStress.reduce((acc, curr) => acc + curr.stressLevel, 0) / entriesWithStress.length).toFixed(1)
      : "0";

  const avgEnergy =
    entriesWithEnergy.length > 0
      ? (entriesWithEnergy.reduce((acc, curr) => acc + curr.energyLevel, 0) / entriesWithEnergy.length).toFixed(1)
      : "0";

  // 2. Calculations for self talk
  let totalPositiveSelfTalk = 0;
  let totalNegativeSelfTalk = 0;
  entriesWithSelfTalk.forEach((e) => {
    totalPositiveSelfTalk += e.selfTalk?.positiveCount || 0;
    totalNegativeSelfTalk += e.selfTalk?.negativeCount || 0;
  });
  const totalSelfTalkCount = totalPositiveSelfTalk + totalNegativeSelfTalk;
  const positiveRatioPercent =
    totalSelfTalkCount > 0 ? Math.round((totalPositiveSelfTalk / totalSelfTalkCount) * 105) : 50; // scaled nicely or default 50%

  // 3. Dynamic aggregates for stress triggers
  const triggerMap: { [key: string]: number } = {};
  entriesWithTriggers.forEach((e) => {
    if (e.triggers && Array.isArray(e.triggers)) {
      e.triggers.forEach((trig) => {
        const clean = trig.trim().toLowerCase();
        triggerMap[clean] = (triggerMap[clean] || 0) + 1;
      });
    }
  });
  // Sort triggers by frequency
  const sortedTriggers = Object.entries(triggerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 4. Life Events & associated emotional mapping
  const activeLifeEvents: { event: string; emotion: string; date: string }[] = [];
  entriesWithTriggers.forEach((e) => {
    if (e.lifeEvents && Array.isArray(e.lifeEvents)) {
      e.lifeEvents.forEach((lf) => {
        activeLifeEvents.push({
          event: lf.event,
          emotion: lf.emotion,
          date: new Date(e.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
        });
      });
    }
  });

  // Helper: Format date cleanly
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render pristine SVG visual charts dynamically
  const renderSVGChart = () => {
    // We need at least 2 coordinate entries to plot a trend line cleanly.
    // If they have less, we can show a supportive placeholder state.
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (sortedEntries.length < 2) {
      return (
        <div className="h-48 border border-dashed border-[#DFE8E2] rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-[#F1F5F2]/65">
          <TrendingUp className="h-8 w-8 text-[#627D6F] mb-2" />
          <span className="text-xs font-serif font-semibold text-[#1C3224]">Generating Emotional Timeline...</span>
          <p className="text-[10px] text-[#627D6F] max-w-[240px] mt-1 text-center">
            Once you save 2 or more spoken reflections, Gemini will plot your Stress vs Energy timeline charts dynamically here!
          </p>
        </div>
      );
    }

    const padding = 30;
    const chartWidth = 560;
    const chartHeight = 200;
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 2;

    const maxItems = sortedEntries.length;

    // Generate Cartesian coordinates for Stress, Energy, and Wellbeing Index line points
    const pointsStress: string[] = [];
    const pointsEnergy: string[] = [];

    sortedEntries.forEach((entry, idx) => {
      const x = padding + (idx / (maxItems - 1)) * plotWidth;

      // Y maps inversely (0 value has highest height, 10 value has lowest height)
      // Check opt outs: if user excluded stress, plot the point in the middle or offset safely.
      const stressY = entry.includeStress !== false ? entry.stressLevel : 5;
      const energyY = entry.includeEnergy !== false ? entry.energyLevel : 5;

      const yStress = padding + plotHeight - (stressY / 10) * plotHeight;
      const yEnergy = padding + plotHeight - (energyY / 10) * plotHeight;

      pointsStress.push(`${x},${yStress}`);
      pointsEnergy.push(`${x},${yEnergy}`);
    });

    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none">
          {/* Chart grids */}
          {[...Array(5)].map((_, idx) => {
            const gridY = padding + (idx / 4) * plotHeight;
            const rank = 10 - idx * 2.5;
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={padding}
                  y1={gridY}
                  x2={chartWidth - padding}
                  y2={gridY}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={padding - 6}
                  y={gridY + 3}
                  className="text-[9px] font-mono fill-slate-400 text-right font-medium"
                >
                  {rank}
                </text>
              </g>
            );
          })}

          {/* Chronological Label anchors */}
          {sortedEntries.map((entry, idx) => {
            if (idx === 0 || idx === maxItems - 1 || maxItems <= 5 || idx === Math.round(maxItems / 2)) {
              const labelX = padding + (idx / (maxItems - 1)) * plotWidth;
              const dateObj = new Date(entry.createdAt);
              const formatted = dateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <text
                  key={idx}
                  x={labelX}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-slate-400 font-semibold"
                >
                  {formatted}
                </text>
              );
            }
            return null;
          })}

          {/* Plot Stress Lines (Rose Color) */}
          <polyline
            fill="none"
            stroke="#f43f5e"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsStress.join(" ")}
            className="drop-shadow-sm"
          />

          {/* Plot Energy Lines (Amber Color) */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsEnergy.join(" ")}
            className="drop-shadow-sm"
          />

          {/* Circle markers */}
          {sortedEntries.map((entry, idx) => {
            const x = padding + (idx / (maxItems - 1)) * plotWidth;
            const stressVal = entry.includeStress !== false ? entry.stressLevel : 5;
            const energyVal = entry.includeEnergy !== false ? entry.energyLevel : 5;

            const yStress = padding + plotHeight - (stressVal / 10) * plotHeight;
            const yEnergy = padding + plotHeight - (energyVal / 10) * plotHeight;

            return (
              <g key={idx}>
                {entry.includeStress !== false && (
                  <circle
                    cx={x}
                    cy={yStress}
                    r={3.5}
                    className="fill-rose-500 stroke-white stroke-1.5 cursor-pointer hover:r-5 focus:outline-none"
                    title={`Stress: ${stressVal}`}
                  />
                )}
                {entry.includeEnergy !== false && (
                  <circle
                    cx={x}
                    cy={yEnergy}
                    r={3.5}
                    className="fill-amber-500 stroke-white stroke-1.5 cursor-pointer hover:r-5 focus:outline-none"
                    title={`Energy: ${energyVal}`}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div id="journal-insights-section" className="space-y-8">
      {/* Dynamic Key Info Banner cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-[24px] border border-[#DFE8E2] p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#627D6F] block tracking-wider">
              Mean Stress Level
            </span>
            <span className="text-3xl font-extrabold text-rose-500 tracking-tight">{avgStress}<span className="text-xs font-semibold text-[#627D6F]">/10</span></span>
            <p className="text-[10px] text-[#627D6F]">Includes {entriesWithStress.length} active sessions</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <Flame className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-[24px] border border-[#DFE8E2] p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#627D6F] block tracking-wider">
              Mean Energy Level
            </span>
            <span className="text-3xl font-extrabold text-amber-500 tracking-tight">{avgEnergy}<span className="text-xs font-semibold text-[#627D6F]">/10</span></span>
            <p className="text-[10px] text-[#627D6F]">Includes {entriesWithEnergy.length} active sessions</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-[24px] border border-[#DFE8E2] p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#627D6F] block tracking-wider">
              Self-Talk Support Index
            </span>
            <span className="text-3xl font-extrabold text-[#2E5C44] tracking-tight">
              {entriesWithSelfTalk.length > 0 ? `${positiveRatioPercent}%` : "--"}
            </span>
            <p className="text-[10px] relative top-0.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${positiveRatioPercent >= 65 ? "bg-[#2E5C44]/10 text-[#2E5C44]" : "bg-orange-100 text-orange-950"}`}>
                {positiveRatioPercent >= 65 ? "Compassionate Loop" : "Needs Self-Kindness"}
              </span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-[#2E5C44]/10 flex items-center justify-center text-[#2E5C44]">
            <Heart className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: timeline charts & self talk trigger analyzers */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Card A: Timeline */}
        <div className="bg-white rounded-[32px] border border-[#DFE8E2] p-6 shadow-sm md:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#DFE8E2] pb-3">
            <div>
              <h3 className="text-sm font-serif font-semibold text-[#1C3224] flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#2E5C44]" /> Long-Term Emotional Timeline Journey
              </h3>
              <span className="text-[10px] text-[#627D6F] block mt-0.5">
                Stress (red line) and Energy coordinates mapped sequentially
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] block" />
                <span className="text-[10px] font-medium text-[#627D6F]">Stress</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] block" />
                <span className="text-[10px] font-medium text-[#627D6F]">Energy</span>
              </div>
            </div>
          </div>

          <div>{renderSVGChart()}</div>
        </div>

        {/* Card B: Self-Talk and Anxiety triggers */}
        <div className="bg-white rounded-[32px] border border-[#DFE8E2] p-6 shadow-sm md:col-span-4 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-[#DFE8E2] pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#1C3224] flex items-center gap-1.5">
                <Flame className="h-4.5 w-4.5 text-[#2E5C44]" /> Daily Stress Triggers
              </h3>
              <span className="text-[10px] text-[#627D6F] block mt-0.5">
                Relative trigger counts found in reflections
              </span>
            </div>

            {sortedTriggers.length > 0 ? (
              <div className="space-y-2.5">
                {sortedTriggers.map(([trig, count], idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-[#23382C]">
                      <span className="font-semibold capitalize truncate max-w-[150px]">{trig}</span>
                      <span className="font-mono text-[#627D6F] text-[10px]">{count}x occurrence</span>
                    </div>
                    {/* customized tiny bar */}
                    <div className="w-full bg-[#E2EBE5] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2E5C44] h-full rounded-full"
                        style={{
                          width: `${(count / Math.max(...sortedTriggers.map((t) => t[1]))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#627D6F]/70 italic">
                No active stress triggers logged yet.
              </div>
            )}
          </div>

          {/* Simple steering suggestion */}
          <div className="p-4 bg-[#ECF2EE] border border-[#DFE8E2] rounded-2xl">
            <span className="text-[9px] font-extrabold text-[#2E5C44] uppercase tracking-widest block">Well-being steering goal</span>
            <p className="text-[11px] text-[#627D6F] mt-1 leading-relaxed">
              Focus on swapping critical phrases during stressful logs. Try incorporating reassuring words like <i>&quot;I am paced / I can adapt&quot;</i> to boost Compassion loop indexes.
            </p>
          </div>
        </div>
      </div>

      {/* Bento Block 2: Life Events & emotion triggered mapping */}
      <div className="bg-white rounded-[32px] border border-[#DFE8E2] p-6 shadow-sm">
        <div className="border-b border-[#DFE8E2] pb-3 mb-4">
          <h3 className="text-sm font-serif font-semibold text-[#1C3224] flex items-center gap-1.5">
            <ShieldAlert className="h-4.5 w-4.5 text-orange-500 animate-pulse" /> Life Event & Emotion Correlation Map
          </h3>
          <span className="text-[10px] text-[#627D6F] block mt-0.5">
            Specific memories spoken of, paired directly with immediate trigger reactions inside the clinical engine.
          </span>
        </div>

        {activeLifeEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {activeLifeEvents.map((ev, idx) => (
              <div key={idx} className="bg-[#F1F5F2] border border-[#DFE8E2] rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs hover:bg-[#E2EBE5]/40 transition-all">
                <p className="text-xs font-bold text-[#1C3224] line-clamp-2">&quot;{ev.event}&quot;</p>
                <div className="flex justify-between items-center pt-2 border-t border-[#DFE8E2]/60">
                  <span className="text-[9px] text-[#627D6F] font-mono font-semibold">{ev.date}</span>
                  <span className="bg-white px-2.5 py-0.5 rounded-full border border-[#DFE8E2] text-[9px] font-bold uppercase text-[#2E5C44] tracking-wide">
                    {ev.emotion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#627D6F]/75 italic">
            No specific life events correlated yet. Speak about an event (e.g. &apos;I had a tough talk with my team&apos;) in your reflections!
          </div>
        )}
      </div>

      {/* Historic list block */}
      <div className="bg-white rounded-[32px] border border-[#DFE8E2] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#DFE8E2] pb-3">
          <div>
            <h3 className="text-sm font-serif font-semibold text-[#1C3224] flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-[#2E5C44]" /> Spoken Reflection Archives ({entries.length})
            </h3>
            <span className="text-[10px] text-[#627D6F] block mt-0.5">
              Detailed retrospective logs stored locally in your browser.
            </span>
          </div>
          {entries.length > 0 && (
            <button
              id="clear-all-logs-btn"
              onClick={() => {
                if (confirm("Are you sure you want to delete all local history logs? This is irreversible.")) {
                  onClearAll();
                }
              }}
              className="text-[11px] font-semibold text-[#B25E5E] hover:text-rose-700 transition-colors hover:underline cursor-pointer"
            >
              Exterminate All History
            </button>
          )}
        </div>

        {entries.length > 0 ? (
          <div className="space-y-3.5">
            {entries.map((entry) => {
              const isSelected = selectedEntryId === entry.id;
              return (
                <div
                  id={`history-${entry.id}`}
                  key={entry.id}
                  className="border border-[#DFE8E2] rounded-[24px] overflow-hidden transition-all bg-white hover:shadow-2xs"
                >
                  {/* Summary row */}
                  <div
                    onClick={() => setSelectedEntryId(isSelected ? null : entry.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 cursor-pointer bg-[#F1F5F2]/50 hover:bg-[#E2EBE5]/45 transition-colors gap-3 select-none"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#627D6F] block font-semibold">
                        {formatDate(entry.createdAt)}
                      </span>
                      <p className="text-xs text-[#23382C] line-clamp-1 italic max-w-lg leading-relaxed">
                        &quot;{entry.transcript}&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-xs bg-white text-[#1C3224] border border-[#DFE8E2] px-2.5 py-0.5 rounded-lg font-bold">
                        {entry.mood}
                      </span>
                      <span className="text-xs text-rose-500 font-semibold flex items-center gap-0.5">
                        <Flame className="h-3.5 w-3.5 shrink-0" /> {entry.stressLevel}/10
                      </span>
                      <button
                        id={`del-entry-btn-${entry.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this reflection entry?")) {
                            onDeleteEntry(entry.id);
                          }
                        }}
                        className="text-[#627D6F]/60 hover:text-rose-600 p-1.5 hover:bg-white/85 rounded transition-colors cursor-pointer"
                        title="Delete log permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        id={`expanded-content-${entry.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[#DFE8E2] p-6 space-y-4 bg-white"
                      >
                        {/* full speech transcript */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#627D6F] uppercase tracking-wide flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" /> Full Speech Text
                          </span>
                          <p className="text-xs text-[#23382C] leading-relaxed bg-[#F1F5F2] p-4 rounded-2xl italic select-text">
                            &quot;{entry.transcript}&quot;
                          </p>
                        </div>

                        {/* Theme badges */}
                        {entry.themes?.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] font-bold text-[#627D6F] uppercase tracking-wide mr-1 flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5" /> Core subjects:
                            </span>
                            {entry.themes.map((th, tid) => (
                              <span key={tid} className="bg-[#E2EBE5] text-[#2E5C44] px-2.5 py-0.5 text-[10px] rounded-full font-semibold whitespace-nowrap">
                                {th}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Well being Tips */}
                        {entry.wellbeingTips?.length > 0 && (
                          <div className="bg-[#2E5C44] text-[#F1F5F2] rounded-2xl p-5 space-y-2">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider block font-serif">
                              Personalized Mental Well-being tips
                            </span>
                            <ul className="text-xs text-[#F1F5F2]/90 list-disc list-inside space-y-1 bg-transparent border-none">
                              {entry.wellbeingTips.map((tip, tipId) => (
                                <li key={tipId}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#627D6F]/70 italic">
            No reflections stored in the database. Use the voice session recorder below to add your first reflection!
          </div>
        )}
      </div>
    </div>
  );
};
