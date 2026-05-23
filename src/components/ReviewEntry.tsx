import React, { useState } from "react";
import { JournalEntry, LifeEvent } from "../types";
import { ShieldAlert, CheckCircle2, X, Activity, MessageSquare, Flame, Lightbulb, Brain } from "lucide-react";
import { motion } from "motion/react";

interface ReviewEntryProps {
  analysis: any; // Raw analysis from Gemini backend
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
}

export const ReviewEntry: React.FC<ReviewEntryProps> = ({
  analysis,
  onSave,
  onCancel,
}) => {
  // Opt out states (default true, users toggle to false if they want to exclude it from dashboard charts)
  const [includeMood, setIncludeMood] = useState(true);
  const [includeStress, setIncludeStress] = useState(true);
  const [includeEnergy, setIncludeEnergy] = useState(true);
  const [includeSelfTalk, setIncludeSelfTalk] = useState(true);
  const [includeTriggersAndLifeEvents, setIncludeTriggersAndLifeEvents] = useState(true);

  // Editable/Correctable transcribing (to give ultimate user control over what gets indexed)
  const [transcript, setTranscript] = useState(analysis.transcript || "");

  const getSpiralRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const handleSave = () => {
    const entry: JournalEntry = {
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      transcript: transcript,
      mood: analysis.mood || "Neutral",
      moodIntensity: analysis.moodIntensity || 5,
      stressLevel: analysis.stressLevel || 5,
      energyLevel: analysis.energyLevel || 5,
      themes: analysis.themes || [],
      triggers: analysis.triggers || [],
      lifeEvents: analysis.lifeEvents || [],
      selfTalk: analysis.selfTalk || {
        positiveCount: 0,
        negativeCount: 0,
        positiveExamples: [],
        negativeExamples: [],
      },
      spiralRisk: analysis.spiralRisk || "low",
      wellbeingScore: analysis.wellbeingScore || 50,
      wellbeingTips: analysis.wellbeingTips || [],
      recommendedIntervention: analysis.recommendedIntervention || {
        type: "guided_grounding",
        reason: "Generic stabilization.",
        instructions: "Take 5 deep relaxing breaths.",
      },
      includeMood,
      includeStress,
      includeEnergy,
      includeSelfTalk,
      includeTriggersAndLifeEvents,
    };
    onSave(entry);
  };

  return (
    <div id="review-entry-container" className="bg-white rounded-[40px] border border-[#D1DFD6] shadow-sm overflow-hidden max-w-4xl mx-auto my-4 animate-fade-in">
      {/* Header banner */}
      <div className="bg-[#1E4631] text-white px-8 py-6 flex items-center justify-between border-b border-[#D1DFD6]">
        <div>
          <span className="text-[10px] font-extrabold text-[#F3F7F4]/80 uppercase tracking-widest block font-mono">
            Reflection Evaluation Complete
          </span>
          <h2 className="text-xl font-serif font-medium tracking-tight text-white mt-0.5">
            Review Extracted Cues & Signals
          </h2>
        </div>
        <button
          id="discard-analysis-head"
          onClick={onCancel}
          className="text-white/60 hover:text-white transition-colors p-1.5 hover:bg-[#12291C]/50 rounded-lg cursor-pointer"
          title="Discard Analysis"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto font-sans">
        {/* Intro */}
        <p className="text-xs text-[#4A6D58] leading-relaxed">
          Review what Gemini felt in your voice. You have <b>full control</b> over what metrics are synced with your long-term emotional charts below. Toggle off any signal if you prefer it kept private from the trends!
        </p>

        {/* Editable Transcript Section */}
        <div className="space-y-2 bg-[#F3F7F4] p-5 rounded-3xl border border-[#D1DFD6]">
          <label className="text-xs font-bold text-[#4A6D58] uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <MessageSquare className="h-4 w-4 text-[#4A6D58]" /> Spoken Reflection (Editable)
          </label>
          <textarea
            id="transcript-edit-area"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full min-h-[100px] text-xs text-[#21352A] bg-white border border-[#D1DFD6] rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-[#1E4631] focus:border-transparent leading-relaxed cursor-text select-text"
            placeholder="Edit spoken transcript if needed..."
          />
        </div>

        {/* Dashboard Sync Selectors (OPT OUT INTERFACE) */}
        <div className="bg-[#E8F0EA] p-6 rounded-3xl border border-[#D1DFD6]">
          <h3 className="text-xs font-bold text-[#1E4631] tracking-wider uppercase mb-3 flex items-center gap-1.5 font-serif">
            <Activity className="h-4 w-4" /> Final Dashboard Integration Settings
          </h3>
          <p className="text-xs text-[#4A6D58] mb-4 leading-relaxed">
            Uncheck any variables to exclude them from calculations in your permanent emotional journey charts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#D1DFD6] cursor-pointer shadow-sm hover:bg-slate-50 select-none">
              <input
                id="toggle-mood-dashboard"
                type="checkbox"
                checked={includeMood}
                onChange={(e) => setIncludeMood(e.target.checked)}
                className="rounded border-[#D1DFD6] text-[#1E4631] focus:ring-[#1E4631] h-4.5 w-4.5 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Include Mood Signal</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#D1DFD6] cursor-pointer shadow-sm hover:bg-slate-50 select-none">
              <input
                id="toggle-stress-dashboard"
                type="checkbox"
                checked={includeStress}
                onChange={(e) => setIncludeStress(e.target.checked)}
                className="rounded border-[#D1DFD6] text-[#1E4631] focus:ring-[#1E4631] h-4.5 w-4.5 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Include Stress Signal</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#D1DFD6] cursor-pointer shadow-sm hover:bg-slate-50 select-none">
              <input
                id="toggle-energy-dashboard"
                type="checkbox"
                checked={includeEnergy}
                onChange={(e) => setIncludeEnergy(e.target.checked)}
                className="rounded border-[#D1DFD6] text-[#1E4631] focus:ring-[#1E4631] h-4.5 w-4.5 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Include Energy Level</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#D1DFD6] cursor-pointer shadow-sm hover:bg-slate-50 select-none">
              <input
                id="toggle-selftalk-dashboard"
                type="checkbox"
                checked={includeSelfTalk}
                onChange={(e) => setIncludeSelfTalk(e.target.checked)}
                className="rounded border-[#D1DFD6] text-[#1E4631] focus:ring-[#1E4631] h-4.5 w-4.5 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Include Self-Talk Counts</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#D1DFD6] cursor-pointer shadow-sm hover:bg-slate-50 select-none">
              <input
                id="toggle-triggers-dashboard"
                type="checkbox"
                checked={includeTriggersAndLifeEvents}
                onChange={(e) => setIncludeTriggersAndLifeEvents(e.target.checked)}
                className="rounded border-[#D1DFD6] text-[#1E4631] focus:ring-[#1E4631] h-4.5 w-4.5 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Include Triggers & Events</span>
            </label>
          </div>
        </div>

        {/* Primary Analytical Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#F3F7F4]/50 rounded-3xl border border-[#D1DFD6] p-6 space-y-4">
            <h4 className="text-[11px] font-bold text-[#4A6D58] tracking-wider uppercase font-mono">
              Extracted Cues ({includeMood || includeStress || includeEnergy ? "Included" : "Excluded"})
            </h4>

            {/* Mood indicator */}
            <div className={`space-y-1 ${!includeMood ? "opacity-35" : ""}`}>
              <div className="flex justify-between text-xs font-medium text-[#21352A]">
                <span>Mood State: <b>{analysis.mood || "Neutral"}</b></span>
                <span>Intensity: {analysis.moodIntensity || 5}/10</span>
              </div>
              <div className="w-full bg-[#D1DFD6] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1E4631] h-full rounded-full"
                  style={{ width: `${(analysis.moodIntensity || 5) * 10}%` }}
                />
              </div>
            </div>

            {/* Stress level indicator */}
            <div className={`space-y-1 ${!includeStress ? "opacity-35" : ""}`}>
              <div className="flex justify-between text-xs font-medium text-[#21352A]">
                <span>Stress Level</span>
                <span className="font-semibold text-rose-500">{analysis.stressLevel || 5}/10</span>
              </div>
              <div className="w-full bg-[#D1DFD6] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${(analysis.stressLevel || 5) * 10}%` }}
                />
              </div>
            </div>

            {/* Energy level indicator */}
            <div className={`space-y-1 ${!includeEnergy ? "opacity-35" : ""}`}>
              <div className="flex justify-between text-xs font-medium text-[#21352A]">
                <span>Energy Level</span>
                <span className="font-semibold text-amber-500">{analysis.energyLevel || 5}/10</span>
              </div>
              <div className="w-full bg-[#D1DFD6] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(analysis.energyLevel || 5) * 10}%` }}
                />
              </div>
            </div>

            {/* Secondary stats split */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-3.5 rounded-2xl border border-[#D1DFD6] text-center">
                <span className="text-[10px] text-[#4A6D58] uppercase font-bold block font-mono">Well-being Score</span>
                <span className="text-2xl font-bold text-[#21352A]">{analysis.wellbeingScore || 50}%</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#D1DFD6] text-center">
                <span className="text-[10px] text-[#4A6D58] uppercase font-bold block font-mono">Spiral Risk</span>
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded border mt-1.5 ${getSpiralRiskColor(analysis.spiralRisk)}`}>
                  {analysis.spiralRisk ? analysis.spiralRisk.toUpperCase() : "LOW"}
                </span>
              </div>
            </div>
          </div>

          {/* Self-Talk Pattern Analysis */}
          <div className={`bg-[#F3F7F4]/50 rounded-3xl border border-[#D1DFD6] p-6 ${!includeSelfTalk ? "opacity-35" : ""}`}>
            <h4 className="text-[11px] font-bold text-[#4A6D58] tracking-wider uppercase mb-3 flex items-center justify-between font-mono">
              <span>Self-Talk Balance Indicator</span>
              <span className="text-xs text-[#4A6D58] font-normal">
                Pos: {analysis.selfTalk?.positiveCount || 0} | Neg: {analysis.selfTalk?.negativeCount || 0}
              </span>
            </h4>

            {/* Ratio visual */}
            <div className="h-6 w-full bg-[#E8F0EA] rounded-full flex overflow-hidden mb-4 border border-[#D1DFD6]">
              <div
                className="bg-[#1E4631] h-full transition-all duration-500 flex items-center justify-center text-[10px] font-extrabold text-white"
                style={{
                  width: `${
                    ((analysis.selfTalk?.positiveCount || 0) + (analysis.selfTalk?.negativeCount || 0)) === 0
                      ? 50
                      : ((analysis.selfTalk?.positiveCount || 0) /
                          ((analysis.selfTalk?.positiveCount || 0) + (analysis.selfTalk?.negativeCount || 0))) *
                        100
                  }%`,
                }}
              >
                {analysis.selfTalk?.positiveCount > 0 ? "Compassionate" : ""}
              </div>
              <div className="flex-1 h-full flex items-center justify-end pr-2 text-[10px] font-extrabold text-[#4A6D58]">
                {analysis.selfTalk?.negativeCount > 0 ? "Harsh" : ""}
              </div>
            </div>

            {/* Self-Talk Quotations */}
            <div className="space-y-3.5 max-h-[140px] overflow-y-auto pr-1">
              {analysis.selfTalk?.positiveExamples?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#1E4631] uppercase tracking-wider block font-mono">Positive Loop Examples:</span>
                  <ul className="text-xs text-slate-600 italic list-disc list-inside mt-0.5 space-y-0.5">
                    {analysis.selfTalk.positiveExamples.map((ex: string, idx: number) => (
                      <li key={idx}>&quot;{ex}&quot;</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.selfTalk?.negativeExamples?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block font-mono">Negative Loop Examples:</span>
                  <ul className="text-xs text-slate-600 italic list-disc list-inside mt-0.5 space-y-0.5">
                    {analysis.selfTalk.negativeExamples.map((ex: string, idx: number) => (
                      <li key={idx}>&quot;{ex}&quot;</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Triggers & Life Events Details */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!includeTriggersAndLifeEvents ? "opacity-35" : ""}`}>
          <div className="bg-[#F3F7F4]/50 rounded-3xl border border-[#D1DFD6] p-6">
            <h4 className="text-[11px] font-bold text-[#4A6D58] tracking-wider uppercase mb-3 flex items-center gap-1.5 align-middle font-mono">
              <ShieldAlert className="h-4 w-4 text-[#4A6D58]" /> Life Events & Emotion Triggers
            </h4>
            {analysis.lifeEvents?.length > 0 ? (
              <div className="space-y-2">
                {analysis.lifeEvents.map((ev: LifeEvent, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-[#D1DFD6] flex justify-between items-center text-xs border-dashed">
                    <span className="font-medium text-slate-700">{ev.event}</span>
                    <span className="px-2 py-0.5 rounded bg-[#E8F0EA] text-[#1E4631] font-semibold uppercase tracking-wide text-[10px] font-mono">
                      {ev.emotion}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No specific life events correlated with emotions identified.</p>
            )}
          </div>

          <div className="bg-[#F3F7F4]/50 rounded-3xl border border-[#D1DFD6] p-6">
            <h4 className="text-[11px] font-bold text-[#4A6D58] tracking-wider uppercase mb-3 flex items-center gap-1.5 font-mono">
              <Flame className="h-4 w-4 text-rose-500" /> Stress / Anxiety Triggers
            </h4>
            {analysis.triggers?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {analysis.triggers.map((trig: string, idx: number) => (
                  <span key={idx} className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-100 text-xs font-semibold">
                    {trig}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[#4A6D58]/75 text-xs italic">No stress triggers found in this reflection voice clip.</p>
            )}
          </div>
        </div>

        {/* Actionable Insights & Dynamic Grounding Recommended */}
        <div className="bg-[#1E4631] text-[#F3F7F4] rounded-3xl p-6 md:p-8 space-y-4 shadow-sm overflow-hidden relative">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-semibold text-white">Personalized Clinical Reflection & Advice</h4>
              <ul className="text-xs text-[#F3F7F4]/90 list-disc list-inside mt-2 space-y-1.5 leading-relaxed">
                {analysis.wellbeingTips?.map((tip: string, idx: number) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          {analysis.recommendedIntervention && (
            <div className="bg-[#12291C] rounded-2xl p-5 border border-none flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
              <div className="space-y-1 flex-1">
                <span className="bg-white/10 text-white/95 border border-white/20 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full inline-block font-mono">
                  Automatic Grounding Intervention Recommended
                </span>
                <h5 className="text-xs font-bold text-white flex items-center gap-1 font-serif">
                  <Brain className="h-4 w-4 text-[#F3F7F4]" />
                  Type: {analysis.recommendedIntervention.type ? analysis.recommendedIntervention.type.replace("_", " ").toUpperCase() : "BREATHING"}
                </h5>
                <p className="text-xs text-[#F3F7F4]/80 leading-relaxed italic mt-1">
                  &quot;{analysis.recommendedIntervention.reason}&quot;
                </p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl text-xs border border-white/5 text-[#F3F7F4]/95">
                <span className="font-semibold block mb-0.5 text-[10px] uppercase text-white/80 tracking-wide font-mono">Instructions Preview:</span>
                {analysis.recommendedIntervention.instructions}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="bg-[#F3F7F4] border-t border-[#D1DFD6] px-8 py-5 flex items-center justify-between">
        <button
          id="discard-analysis-btn"
          onClick={onCancel}
          className="px-5 py-2.5 text-xs font-bold text-[#4A6D58] hover:text-[#1E4631] transition-colors bg-white hover:bg-slate-100 border border-[#D1DFD6] rounded-xl cursor-pointer"
        >
          Discard Entry
        </button>

        <button
          id="commit-analysis-btn"
          onClick={handleSave}
          className="px-6 py-2.5 text-xs font-bold text-white bg-[#1E4631] hover:bg-[#2D6A4F] hover:shadow-lg transition-all rounded-xl flex items-center gap-1.5 cursor-pointer font-serif"
        >
          <CheckCircle2 className="h-4 w-4" /> Save Reflection & Align Charts
        </button>
      </div>
    </div>
  );
};
