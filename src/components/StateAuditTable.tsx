import React, { useState } from "react";
import { JournalEntry, RecommendedIntervention } from "../types";
import { 
  Activity, 
  Flame, 
  Zap, 
  Heart, 
  Check, 
  Sparkles, 
  Info,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Brain,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Award,
  Smile,
  Frown,
  PlusCircle
} from "lucide-react";

interface StateAuditTableProps {
  entries: JournalEntry[];
  onUpdateFeedback: (entryId: string, worked: "yes" | "no" | "unrated", notes: string) => void;
  onAddDemoEntry?: (entry: JournalEntry) => void;
}

export const StateAuditTable: React.FC<StateAuditTableProps> = ({ 
  entries, 
  onUpdateFeedback,
  onAddDemoEntry 
}) => {
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "unrated">("all");
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [saveFeedback, setSaveFeedback] = useState<Record<string, boolean>>({});

  // 1. Calculate Efficacy Analytics (used by the app to collect what works and what doesn't)
  const totalInterventions = entries.length;
  const interventionsWithFeedback = entries.filter(e => e.interventionFeedback && e.interventionFeedback.worked !== "unrated");
  const ratedCount = interventionsWithFeedback.length;
  
  const workedEntries = entries.filter(e => e.interventionFeedback?.worked === "yes");
  const failedEntries = entries.filter(e => e.interventionFeedback?.worked === "no");
  
  const overallSuccessRate = ratedCount > 0 
    ? Math.round((workedEntries.length / ratedCount) * 100) 
    : 0;

  // Breakdown by intervention types
  const types: Array<RecommendedIntervention["type"]> = ["breathing", "ambient_music", "guided_grounding", "physical_movement"];
  
  const efficacyByType = types.map(type => {
    const entriesOfThisType = entries.filter(e => e.recommendedIntervention?.type === type);
    const ratedOfThisType = entriesOfThisType.filter(e => e.interventionFeedback && e.interventionFeedback.worked !== "unrated");
    const workedOfThisType = entriesOfThisType.filter(e => e.interventionFeedback?.worked === "yes");
    
    const count = entriesOfThisType.length;
    const successRate = ratedOfThisType.length > 0 
      ? Math.round((workedOfThisType.length / ratedOfThisType.length) * 100)
      : null;

    return {
      type,
      count,
      ratedCount: ratedOfThisType.length,
      workedCount: workedOfThisType.length,
      successRate,
    };
  });

  const getInterventionName = (type: RecommendedIntervention["type"]) => {
    switch (type) {
      case "breathing": return "Rhythmic Guided Breathing";
      case "ambient_music": return "Harmonic Sound Frequencies";
      case "guided_grounding": return "Cognitive Grounding Anchor";
      case "physical_movement": return "Somatic Movement Alignment";
    }
  };

  const getInterventionIcon = (type: RecommendedIntervention["type"]) => {
    switch (type) {
      case "breathing": return <Activity className="h-4.5 w-4.5 text-[#1E4631]" />;
      case "ambient_music": return <Zap className="h-4.5 w-4.5 text-amber-500" />;
      case "guided_grounding": return <Brain className="h-4.5 w-4.5 text-indigo-500" />;
      case "physical_movement": return <Flame className="h-4.5 w-4.5 text-rose-500" />;
    }
  };

  const handleFeedbackToggle = (entryId: string, worked: "yes" | "no", currentNotes: string) => {
    onUpdateFeedback(entryId, worked, currentNotes);
    triggerSaveFeedback(entryId);
  };

  const handleNotesChange = (entryId: string, text: string) => {
    setEditingNotes(prev => ({ ...prev, [entryId]: text }));
  };

  const handleSaveNotes = (entryId: string, worked: "yes" | "no" | "unrated", text: string) => {
    onUpdateFeedback(entryId, worked, text);
    triggerSaveFeedback(entryId);
  };

  const triggerSaveFeedback = (entryId: string) => {
    setSaveFeedback(prev => ({ ...prev, [entryId]: true }));
    setTimeout(() => {
      setSaveFeedback(prev => ({ ...prev, [entryId]: false }));
    }, 1500);
  };

  const filteredEntries = entries.filter(e => {
    if (filter === "all") return true;
    if (filter === "yes") return e.interventionFeedback?.worked === "yes";
    if (filter === "no") return e.interventionFeedback?.worked === "no";
    if (filter === "unrated") return !e.interventionFeedback || e.interventionFeedback.worked === "unrated";
    return true;
  });

  // Demo generator helper
  const triggerDemo = () => {
    if (onAddDemoEntry) {
      const demo: JournalEntry = {
        id: "demo-" + Date.now(),
        createdAt: new Date().toISOString(),
        transcript: "I can't take this constant rush anymore, my hands are vibrating and I feel totally anxious about everything.",
        mood: "Anxious & High Somatic Rush",
        moodIntensity: 8,
        stressLevel: 9,
        energyLevel: 4,
        themes: ["anxiety", "rush", "overwhelmed"],
        triggers: ["sensory overload", "physical tension"],
        lifeEvents: [{ event: "Tight Project Deadline", emotion: "Apprehension" }],
        selfTalk: {
          positiveCount: 1,
          negativeCount: 4,
          positiveExamples: ["I can only do one thing at a time"],
          negativeExamples: ["I'm failing at deadlines", "My stress index is overflowing"],
        },
        spiralRisk: "high",
        wellbeingScore: 35,
        wellbeingTips: [
          "Engage in box breathing to reduce physiological tremor cues",
          "Isolate high-frequency noises with high-contrast audio static"
        ],
        recommendedIntervention: {
          type: "breathing",
          reason: "Anxious somatic patterns were parsed in your vocal speed and critical self-talk ratio.",
          instructions: "Open the Grounding Center and pace your deep breaths 4s in, 4s hold, 4s out, 4s hold.",
        },
        includeMood: true,
        includeStress: true,
        includeEnergy: true,
        includeSelfTalk: true,
        includeTriggersAndLifeEvents: true,
      };
      onAddDemoEntry(demo);
    }
  };

  return (
    <div id="state-audit-container" className="space-y-8 animate-fade-in font-sans">
      
      {/* Dynamic Botanical Header Banner */}
      <div className="bg-white rounded-[40px] border border-[#D1DFD6] p-8 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <span className="inline-block px-3 py-1 bg-[#E8F0EA] rounded-full text-[10px] uppercase tracking-widest font-bold text-[#1E4631] font-mono">
            📋 Tab 3: State Audit & Efficacy Tracking
          </span>
          <h2 className="text-2xl font-serif text-[#1C3224] leading-tight font-medium">
            Measure what actually heals your Downward Spiral.
          </h2>
          <p className="text-xs text-[#4A6D58] leading-relaxed">
            Whenever Gemini detects stress, circular patterns or anxiety, the app suggests a customized exercise in the <b>Grounding Center</b>. 
            Use this table to audit whether the advised exercise was successful or missed the mark. This data calms your nervous system path recursively.
          </p>
        </div>

        {/* Action Button for Demo */}
        {onAddDemoEntry && (
          <button
            onClick={triggerDemo}
            className="flex items-center gap-2 px-4.5 py-3.5 bg-[#1E4631]/10 hover:bg-[#1E4631]/20 text-[#1E4631] text-xs font-bold rounded-2xl border border-[#D1DFD6] transition-all cursor-pointer whitespace-nowrap shrink-0 hover:shadow-xs font-mono"
          >
            <PlusCircle className="h-4 w-4" /> Simulate Anxious State
          </button>
        )}
      </div>

      {/* Intelligence & Data-Collection Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[32px] p-6 border border-[#D1DFD6] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#4A6D58] font-bold uppercase tracking-wider font-mono">Total Evaluations</span>
            <span className="p-1.5 bg-[#E8F0EA] rounded-lg"><CheckCircle2 className="h-5 w-5 text-[#1E4631]" /></span>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-[#1C3224]">{totalInterventions}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Recorded voice journals</p>
          </div>
          <div className="pt-2 border-t border-[#D1DFD6]/60 flex justify-between text-[11px] text-[#4A6D58]">
            <span>Feedback Rate:</span>
            <span className="font-bold">{totalInterventions > 0 ? Math.round((ratedCount/totalInterventions)*100) : 0}% ({ratedCount} rated)</span>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 border border-[#D1DFD6] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#4A6D58] font-bold uppercase tracking-wider font-mono">Intervention Efficacy</span>
            <span className="p-1.5 bg-emerald-50 rounded-lg"><Smile className="h-5 w-5 text-emerald-600" /></span>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-emerald-700">{overallSuccessRate}%</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Success frequency across rated items</p>
          </div>
          <div className="pt-2 border-t border-[#D1DFD6]/60 flex justify-between text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Worked: {workedEntries.length}</span>
            <span className="text-rose-600 font-semibold flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Failed: {failedEntries.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 border border-[#D1DFD6] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#4A6D58] font-bold uppercase tracking-wider font-mono">Efficacy Leaderboard</span>
            <span className="p-1.5 bg-amber-50 rounded-lg"><Award className="h-5 w-5 text-amber-600" /></span>
          </div>
          <div className="space-y-1">
            {efficacyByType.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px]">
                <span className="text-[#1C3224] flex items-center gap-1 font-medium truncate">
                  {getInterventionIcon(item.type)} 
                  <span className="truncate max-w-[120px]">{getInterventionName(item.type)}</span>
                </span>
                <span className="font-mono text-slate-600 shrink-0 font-bold">
                  {item.successRate !== null ? `${item.successRate}%` : "No data"}
                  <span className="text-[9px] text-slate-400 font-normal ml-0.5">({item.workedCount}/{item.ratedCount})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visual Tracking Table Panel */}
      <div className="bg-white rounded-[40px] border border-[#D1DFD6] shadow-sm overflow-hidden">
        
        {/* Table Title Block & Filtering controls */}
        <div className="bg-[#1E4631] text-white px-8 py-5.5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#D1DFD6]">
          <div className="flex items-center gap-2">
            <Activity className="h-5.5 w-5.5 text-[#E8F0EA]" />
            <div>
              <h3 className="text-base font-serif font-medium leading-tight">Historical Intervention Audit Trail</h3>
              <p className="text-[10px] text-white/70 font-mono">Cross-referencing felt state & clinician outcomes</p>
            </div>
          </div>
          
          {/* Quick Filter Pill Switches */}
          <div className="flex bg-[#12291C] p-1 rounded-xl border border-white/10 text-xs font-mono font-bold">
            <button 
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filter === "all" ? "bg-[#1E4631] text-white" : "text-white/60 hover:text-white"}`}
            >
              All [{entries.length}]
            </button>
            <button 
              onClick={() => setFilter("yes")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filter === "yes" ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white"}`}
            >
              Worked [{workedEntries.length}]
            </button>
            <button 
              onClick={() => setFilter("no")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filter === "no" ? "bg-rose-500 text-white" : "text-white/60 hover:text-white"}`}
            >
              Failed [{failedEntries.length}]
            </button>
            <button 
              onClick={() => setFilter("unrated")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filter === "unrated" ? "bg-amber-600 text-white" : "text-white/60 hover:text-white"}`}
            >
              Pending [{entries.filter(e => !e.interventionFeedback || e.interventionFeedback.worked === "unrated").length}]
            </button>
          </div>
        </div>

        {/* Scrollable table viewport */}
        <div className="overflow-x-auto">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-20 px-8 text-slate-500 max-w-md mx-auto space-y-4">
              <div className="h-12 w-12 rounded-full bg-[#E8F0EA] flex items-center justify-center text-[#1E4631] mx-auto">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-serif font-bold text-[#1C3224]">No reflections found matching filter</h4>
              <p className="text-xs text-slate-400">
                Ensure you speak a vocal reflection first, save the analysis, and try the recommended exercises. You can also click <b>"Simulate Anxious State"</b> above to populate demo test records instantly.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
              <thead className="bg-[#F3F7F4] border-b border-[#D1DFD6]">
                <tr>
                  {/* Column 1 */}
                  <th className="w-1/6 p-4 pl-8 text-xs font-bold text-[#4A6D58] uppercase tracking-wider font-mono">
                    1. Analysis Timestamp
                  </th>
                  {/* Column 2 */}
                  <th className="w-1/4 p-4 text-xs font-bold text-[#4A6D58] uppercase tracking-wider font-mono">
                    2. Emotion & Stress State
                  </th>
                  {/* Column 3 */}
                  <th className="w-1/3 p-4 text-xs font-bold text-[#4A6D58] uppercase tracking-wider font-mono">
                    3. Recommended App Intervention
                  </th>
                  {/* Column 4 */}
                  <th className="w-[28%] p-4 pr-8 text-xs font-bold text-[#4A6D58] uppercase tracking-wider font-mono bg-[#E8F0EA]/30">
                    4. Efficacy Feedback (Did it work?)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1DFD6]/60">
                {filteredEntries.map((entry) => {
                  const hasFeedback = !!entry.interventionFeedback;
                  const workedStatus = entry.interventionFeedback?.worked || "unrated";
                  const storedNotes = entry.interventionFeedback?.userNotes || "";
                  const editingText = editingNotes[entry.id] !== undefined ? editingNotes[entry.id] : storedNotes;
                  const saved = saveFeedback[entry.id];

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/40 transition-colors">
                      
                      {/* Column 1: Timestamp */}
                      <td className="p-4 pl-8 align-top py-5 space-y-1">
                        <span className="text-xs font-bold text-slate-700 block font-mono">
                          {new Date(entry.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {new Date(entry.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Column 2: Emotion & Stress State */}
                      <td className="p-4 align-top space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif font-bold text-[#1C3224] text-xs">
                            {entry.mood}
                          </span>
                        </div>
                        
                        {/* Metrics Tags in Column 2 */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-600">
                            Mood: {entry.moodIntensity}/10
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-[9px] font-mono font-bold text-rose-600">
                            Stress: {entry.stressLevel}/10
                          </span>
                          {entry.spiralRisk === "high" && (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-mono font-bold uppercase animate-pulse">
                              Spiral Risk: HIGH
                            </span>
                          )}
                        </div>

                        {/* Transcript Extract */}
                        <p className="text-[10px] text-slate-500 italic line-clamp-2 leading-relaxed" title={entry.transcript}>
                          &quot;{entry.transcript}&quot;
                        </p>
                      </td>

                      {/* Column 3: Recommended App Intervention */}
                      <td className="p-4 align-top space-y-2">
                        <div className="flex items-center gap-2">
                          {getInterventionIcon(entry.recommendedIntervention.type)}
                          <span className="text-xs font-bold text-[#1C3224]">
                            {getInterventionName(entry.recommendedIntervention.type)}
                          </span>
                        </div>

                        <p className="text-[10px] text-[#4A6D58] leading-normal font-mono bg-[#F3F7F4] p-2 rounded-xl border border-[#D1DFD6]">
                          <span className="font-bold text-[9px] text-[#1E4631] block uppercase mb-0.5">Vocal Prompt:</span>
                          &quot;{entry.recommendedIntervention.reason}&quot;
                        </p>

                        <div className="text-[10px] text-slate-600 ml-1 leading-relaxed">
                          <span className="font-bold text-[9px] text-slate-500 uppercase block tracking-wider">Clinician Guide:</span>
                          {entry.recommendedIntervention.instructions}
                        </div>
                      </td>

                      {/* Column 4: Feedback - (Worked or Not) */}
                      <td className="p-4 pr-8 align-top bg-[#E8F0EA]/10 space-y-3">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-extrabold text-[#4A6D58] uppercase tracking-wider block font-mono">
                            Did this grounding suggestion help?
                          </span>
                          
                          {/* Toggle Options: Yes / No */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleFeedbackToggle(entry.id, "yes", editingText)}
                              className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-xl transition-all border cursor-pointer ${
                                workedStatus === "yes"
                                  ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" /> Worked
                            </button>

                            <button
                              onClick={() => handleFeedbackToggle(entry.id, "no", editingText)}
                              className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-xl transition-all border cursor-pointer ${
                                workedStatus === "no"
                                  ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" /> Failed
                            </button>
                          </div>
                        </div>

                        {/* Qualitative user feedback notes */}
                        <div className="space-y-1.5 relative">
                          <label htmlFor={`notes-textarea-${entry.id}`} className="text-[9px] font-bold text-slate-500 block">
                            How did you feel afterwards?
                          </label>
                          <textarea
                            id={`notes-textarea-${entry.id}`}
                            className="w-full min-h-[44px] text-[10px] text-[#21352A] placeholder-slate-400/80 bg-white border border-[#D1DFD6] rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-[#1E4631] focus:border-transparent leading-relaxed cursor-text select-text block"
                            placeholder="Write qualitative feedback to self-document..."
                            value={editingText}
                            onChange={(e) => handleNotesChange(entry.id, e.target.value)}
                            onBlur={() => handleSaveNotes(entry.id, workedStatus, editingText)}
                          />

                          {/* Trigger Update Feedback on Enter / Blur */}
                          <div className="flex items-center justify-between mt-1 text-[9px] text-[#4A6D58] font-mono">
                            <span>* Auto-saves on click or unfocus</span>
                            {saved && (
                              <span className="flex items-center gap-0.5 text-emerald-600 font-bold bg-[#E8F0EA] px-1.5 py-0.2 rounded border border-emerald-200">
                                <Check className="w-3 h-3 stroke-3" /> Updated
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Informative Disclaimer footer */}
        <div className="bg-[#F3F7F4] border-t border-[#D1DFD6] px-8 py-5.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-2 max-w-xl text-[#4A6D58]">
            <Info className="h-4.5 w-4.5 mt-0.5 text-[#1E4631] shrink-0" />
            <p className="text-[10px] leading-relaxed">
              <b>Recursive Smart Calibration:</b> When you mark app interventions as positive (Worked), Aura refines recommendation values server-side for similar vocal triggers in upcoming sessions. Keep records comprehensive to perfect your equilibrium parameters.
            </p>
          </div>
          
          <button
            onClick={() => {
              if (confirm("Reset all intervention feedback flags and remove self-audit qualitative notes? This is irreversible.")) {
                entries.forEach(e => {
                  onUpdateFeedback(e.id, "unrated", "");
                });
                setEditingNotes({});
              }
            }}
            className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-[10px] font-bold rounded-xl border border-rose-200 shadow-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear Feedback Archives
          </button>
        </div>

      </div>

    </div>
  );
};
