import { useState, useEffect } from "react";
import { AudioRecorder } from "./components/AudioRecorder";
import { ReviewEntry } from "./components/ReviewEntry";
import { Interventions } from "./components/Interventions";
import { JournalInsights } from "./components/JournalInsights";
import { StateAuditTable } from "./components/StateAuditTable";
import { JournalEntry } from "./types";
import { Mic, Heart, TrendingUp, Sparkles, AlertCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"insights" | "grounding" | "audit">("insights");
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);

  // State for active Gemini raw analysis awaiting user review/opt-out configuration
  const [stagedAnalysis, setStagedAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Intervention Trigger State (for real-time spiral intervention alert)
  const [smartInterventionAlert, setSmartInterventionAlert] = useState<{
    type: "breathing" | "ambient_music" | "guided_grounding" | "physical_movement";
    reason: string;
    instructions: string;
  } | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const raw = localStorage.getItem("voicesmartjournal_entries");
    if (raw) {
      try {
        setEntries(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to load archived entries.", e);
      }
    }
  }, []);

  // Sync entries to local storage
  const saveEntriesToStorage = (updatedEntries: JournalEntry[]) => {
    setEntries(updatedEntries);
    localStorage.setItem("voicesmartjournal_entries", JSON.stringify(updatedEntries));
  };

  const handleSaveEntry = (newEntry: JournalEntry) => {
    const updated = [newEntry, ...entries];
    saveEntriesToStorage(updated);
    setStagedAnalysis(null);

    // Dynamic spiral risk intervention system: Check if high stress or high spiral risk is detected
    if (newEntry.spiralRisk === "high" || newEntry.stressLevel >= 7) {
      // Trigger real-time support modal recommendation
      setSmartInterventionAlert({
        type: newEntry.recommendedIntervention.type || "breathing",
        reason: newEntry.recommendedIntervention.reason || "High physiological stress and core circular self-talk recognized.",
        instructions: newEntry.recommendedIntervention.instructions || "Pace your breaths inside the circle stabilizer.",
      });
    } else {
      // Pivot to analytics dashboard if satisfied
      setActiveTab("insights");
    }
  };

  const handleDeleteEntry = (id: string) => {
    const filtered = entries.filter((e) => e.id !== id);
    saveEntriesToStorage(filtered);
  };

  const handleClearAll = () => {
    saveEntriesToStorage([]);
  };

  const handleCancelReview = () => {
    setStagedAnalysis(null);
  };

  const launchIntervention = () => {
    if (smartInterventionAlert) {
      // Pivot directly to grounding studio with specific recommended intervention type
      setSmartInterventionAlert(null);
      setActiveTab("grounding");
    }
  };

  const handleUpdateFeedback = (
    entryId: string,
    worked: "yes" | "no" | "unrated",
    notes: string
  ) => {
    const updated = entries.map((entry) => {
      if (entry.id === entryId) {
        return {
          ...entry,
          interventionFeedback: {
            worked,
            userNotes: notes,
            updatedAt: new Date().toISOString(),
          },
        };
      }
      return entry;
    });
    saveEntriesToStorage(updated);
  };

  const handleAddDemoEntry = (demoEntry: JournalEntry) => {
    const updated = [demoEntry, ...entries];
    saveEntriesToStorage(updated);
  };

  return (
    <div className="min-h-screen bg-[#F3F7F4] text-[#21352A] font-sans tracking-tight flex flex-col justify-between relative pb-28">
      {/* Dynamic Header with New Botanical Palette */}
      <header className="bg-white border-b border-[#D1DFD6] py-4.5 px-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E4631] rounded-full flex items-center justify-center text-white shadow-md">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-semibold tracking-tight text-[#1C3224] flex items-center gap-1.5">
                Aura Voice Smart Journal <Sparkles className="h-4.5 w-4.5 text-[#2D6A4F] animate-pulse" />
              </h1>
              <p className="text-[10px] text-[#4A6D58] font-mono tracking-wide uppercase font-semibold">
                Multimodal Vocal Cue Analysis & Emotion Equilibrium
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-1.5 bg-[#E2EBE5] p-1.5 rounded-2xl border border-[#D1DFD6]">
            <button
              id="tab-insights-btn"
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "insights"
                  ? "bg-[#1E4631] text-white shadow-xs"
                  : "text-[#4A6D58] hover:text-[#1c3224]"
              }`}
            >
              📊 Journeys & Charts
            </button>

            <button
              id="tab-ground-btn"
              onClick={() => setActiveTab("grounding")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "grounding"
                  ? "bg-[#1E4631] text-white shadow-xs"
                  : "text-[#4A6D58] hover:text-[#1c3224]"
              }`}
            >
              🌸 Grounding Center
            </button>

            <button
              id="tab-audit-btn"
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "audit"
                  ? "bg-[#1E4631] text-white shadow-xs"
                  : "text-[#4A6D58] hover:text-[#1c3224]"
              }`}
            >
              📋 State Audit & Inputs
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Real-time SMART INTERVENTION WARNING overlay/card */}
        <AnimatePresence>
          {smartInterventionAlert && (
            <motion.div
              id="spiral-intervention-alert"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-[#E8F0EA] border border-[#2D6A4F]/30 rounded-[40px] p-6 md:p-8 shadow-lg max-w-xl mx-auto flex flex-col gap-4 relative z-50 text-center md:text-left"
            >
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-[#1E4631] shrink-0 shadow-sm animate-pulse">
                  <AlertTriangle className="h-7 w-7 text-amber-500" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-extrabold text-[#2D6A4F] uppercase tracking-widest block">
                    Cognitive Overload / Downward Spiral Detected
                  </span>
                  <h3 className="text-base font-serif font-semibold text-[#1C3224]">
                    Nervous System Stabilization Recommended
                  </h3>
                  <p className="text-xs text-[#4A6D58] leading-relaxed italic pr-2">
                    &quot;{smartInterventionAlert.reason}&quot;
                  </p>
                  <div className="bg-white p-4 rounded-[20px] border border-[#D1DFD6] mt-3 text-xs text-[#21352A]">
                    <span className="font-extrabold text-[10px] text-[#2D6A4F] block uppercase tracking-wide mb-0.5">Scheduled Intervention:</span>
                    {smartInterventionAlert.instructions}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#D1DFD6]">
                <button
                  id="dismiss-intervention-btn"
                  onClick={() => setSmartInterventionAlert(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#2D6A4F] opacity-70 hover:opacity-100 transition-opacity w-full sm:w-auto cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  id="accept-intervention-btn"
                  onClick={launchIntervention}
                  className="px-5 py-2.5 bg-[#1E4631] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer font-serif"
                >
                  Start Now <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Tabs */}
        {!stagedAnalysis ? (
          <div>
            {activeTab === "insights" && (
              <div className="space-y-6 animate-fade-in">
                {/* Introduction Banner card */}
                <div className="bg-white rounded-[40px] border border-[#D1DFD6] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl text-center md:text-left">
                    <span className="inline-block px-3 py-1 bg-[#F3F7F4] rounded-full text-[10px] uppercase tracking-widest mb-1 font-bold text-[#2D6A4F]">
                      Aura Gemini Multimodal Engine
                    </span>
                    <h2 className="text-2xl font-serif text-[#1C3224] leading-tight font-medium">
                      Let Gemini analyze your spoken daily journey natively.
                    </h2>
                    <p className="text-xs text-[#4A6D58] leading-relaxed">
                      Your voice holds sub-verbal cues of stress, tone equilibrium, sentiment, and self-talk ratios. We process these natively for offline-configured reflection.
                    </p>
                    <p className="text-xs font-serif text-[#2D6A4F] font-semibold">
                      ✨ Click the floating microphone at the bottom of your screen anytime to record.
                    </p>
                  </div>
                  <div className="bg-[#E8F0EA] border border-[#D1DFD6] p-5 rounded-3xl shrink-0 flex items-center gap-3">
                    <Heart className="h-8 w-8 text-[#1E4631] animate-pulse shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-[#1C3224] block">Compassion Tuning</span>
                      <p className="text-[10px] text-[#4A6D58] max-w-[145px]">
                        Our engine highlights critical language loops to help nourish self-care.
                      </p>
                    </div>
                  </div>
                </div>

                <JournalInsights
                  entries={entries}
                  onDeleteEntry={handleDeleteEntry}
                  onClearAll={handleClearAll}
                />
              </div>
            )}

            {activeTab === "grounding" && (
              <Interventions
                onComplete={() => setActiveTab("insights")}
              />
            )}

            {activeTab === "audit" && (
              <StateAuditTable
                entries={entries}
                onUpdateFeedback={handleUpdateFeedback}
                onAddDemoEntry={handleAddDemoEntry}
              />
            )}
          </div>
        ) : (
          /* Staged Evaluation / Review Panel */
          <ReviewEntry
            analysis={stagedAnalysis}
            onSave={handleSaveEntry}
            onCancel={handleCancelReview}
          />
        )}
      </main>

      {/* Floating Centered Microphone Session Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <motion.button
          id="floating-mic-trigger"
          onClick={() => setIsRecorderOpen(true)}
          className="flex items-center gap-2.5 px-6.5 py-4 bg-[#1E4631] hover:bg-[#2D6A4F] text-white font-serif font-extrabold text-sm rounded-full shadow-2xl transition-all cursor-pointer border-2 border-white group relative overflow-hidden shrink-0"
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.96 }}
          animate={{
            boxShadow: ["0px 10px 30px rgba(30, 70, 49, 0.25)", "0px 15px 35px rgba(30, 70, 49, 0.45)", "0px 10px 30px rgba(30, 70, 49, 0.25)"]
          }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          {/* Pulsing ring */}
          <span className="absolute -inset-1 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full animate-ping pointer-events-none" />
          <Mic className="h-5 w-5 text-white shrink-0" />
          <span className="tracking-wide">Speak Reflection</span>
        </motion.button>
      </div>

      {/* Floating Always-Centered Voice Recorder Modal */}
      <AnimatePresence>
        {isRecorderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden relative border border-[#D1DFD6] p-1"
            >
              {/* Nice dismiss button */}
              <button
                id="close-floating-recorder-btn"
                onClick={() => setIsRecorderOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-[#1E4631] hover:bg-[#F3F7F4] p-2.5 rounded-full transition-all cursor-pointer z-10 font-bold"
                title="Dismiss Recorder"
              >
                ✕
              </button>

              <div className="p-3">
                <AudioRecorder
                  onAnalysisStart={() => {
                    setIsAnalyzing(true);
                    setStagedAnalysis(null);
                  }}
                  onAnalysisSuccess={(result) => {
                    setStagedAnalysis(result);
                    setIsAnalyzing(false);
                    setIsRecorderOpen(false); // smoothly exit recorder to focus on ReviewEntry
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Centered Analysis Status Screen */}
      <AnimatePresence>
        {isAnalyzing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[32px] p-8 max-w-sm text-center shadow-2xl border border-[#D1DFD6] space-y-4 flex flex-col items-center justify-center"
            >
              <div className="h-12 w-12 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
              <h3 className="text-sm font-serif font-bold text-[#1C3224]">Natively Translating Voice Cues...</h3>
              <p className="text-xs text-[#4A6D58] leading-relaxed">
                Gemini is parsing pitch variations, emotional indicators, compassion metrics, and stress counts. This takes just a moment!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footing note */}
      <footer className="mt-8 bg-[#1E4631]/5 py-5 text-center text-[#4A6D58] text-[10px] font-semibold border-t border-[#D1DFD6] rounded-t-[32px]">
        <p>Aura Voice Smart Journal — Empowering clinical emotional equilibrium with native multimodal intelligence. All cues stored securely in local state.</p>
      </footer>
    </div>
  );
}
