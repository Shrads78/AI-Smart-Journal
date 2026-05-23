import React, { useState, useEffect, useRef } from "react";
import { Music, Play, Square, Wind, Eye, Compass, PenTool, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ambientSynthInstance } from "../utils/audioSynth";

interface InterventionsProps {
  initialType?: "breathing" | "ambient_music" | "guided_grounding" | "physical_movement";
  customInstructions?: string;
  onComplete?: () => void;
}

export const Interventions: React.FC<InterventionsProps> = ({
  initialType = "breathing",
  customInstructions = "",
  onComplete,
}) => {
  const [activeTab, setActiveTab] = useState<"breathing" | "ambient_music" | "guided_grounding" | "physical_movement" | "journal_prompt">(
    initialType === "ambient_music" ? "ambient_music" : initialType
  );

  // 1. Synth Music state
  const [musicPlaying, setMusicPlaying] = useState(ambientSynthInstance.isActive());

  const handleToggleMusic = () => {
    if (musicPlaying) {
      ambientSynthInstance.stop();
      setMusicPlaying(false);
    } else {
      ambientSynthInstance.start();
      setMusicPlaying(true);
    }
  };

  useEffect(() => {
    // If user opens music tab manually or via recommendation, start playing automatically!
    if (activeTab === "ambient_music" && !musicPlaying) {
      ambientSynthInstance.start();
      setMusicPlaying(true);
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      // Sound cleanup handled by instance
    };
  }, []);

  // 2. Breathing state
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Hold Out">("Inhale");
  const [breathCounter, setBreathCounter] = useState(4);
  const [breathTimer, setBreathTimer] = useState(60); // 1 minute session
  const [breathSessionActive, setBreathSessionActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (breathSessionActive && breathTimer > 0) {
      interval = setInterval(() => {
        setBreathTimer((prev) => prev - 1);
        setBreathCounter((prev) => {
          if (prev <= 1) {
            // cycle box breathing phase
            setBreathPhase((curr) => {
              switch (curr) {
                case "Inhale":
                  return "Hold";
                case "Hold":
                  return "Exhale";
                case "Exhale":
                  return "Hold Out";
                case "Hold Out":
                  return "Inhale";
              }
            });
            return 4; // Reset to 4 seconds box interval
          }
          return prev - 1;
        });
      }, 1000);
    } else if (breathTimer === 0) {
      setBreathSessionActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breathSessionActive, breathTimer]);

  const handleStartBreathing = () => {
    setBreathTimer(60);
    setBreathCounter(4);
    setBreathPhase("Inhale");
    setBreathSessionActive(true);
  };

  // 3. 5-4-3-2-1 Sensory Grounding State
  const [groundingStep, setGroundingStep] = useState(0);
  const groundingSteps = [
    { title: "Look Around (5 Visuals)", desc: "Spot 5 independent physical objects in your immediate surroundings. Pay attention to their specific colors, textures, and lines.", count: 5 },
    { title: "Touch Feeling (4 Somatic Feels)", desc: "Notice 4 physical contacts against your skin (e.g. the weight of your shoes, the texture of the desk, chair backing, clothes on arms).", count: 4 },
    { title: "Listen Closely (3 Sounds)", desc: "Listen carefully to find 3 distinct sounds. It could be distant bird whistles, hum of an AC, computer fan, or car passing.", count: 3 },
    { title: "Smell Analysis (2 Scents)", desc: "Inhale deeply. Can you distinguish two unique scents? E.g., coffee beans, wood dust, the scent of fresh soap.", count: 2 },
    { title: "Taste Recognition (1 Taste)", desc: "Focus on one simple flavor inside your mouth. A lingering taste of toothpaste, water, mint, or tea.", count: 1 },
  ];

  // 4. Somatic Stretch State
  const [stretchIdx, setStretchIdx] = useState(0);
  const stretches = [
    { name: "Somatic Hand Shakeout", instructions: "Hold your hands in front and shake them vigorously for 15 seconds. Let your wrists go completely loose. Shaking stimulates the nervous system to release stored cortisol and metabolic stress.", duration: 15 },
    { name: "Progressive Shoulder Squeezes", instructions: "Inhale deeply and shrug both shoulders high towards your ears. Hold with tension for 4 seconds, then drop them with a forceful exhale. Repeat 3 times to unblock heavy posture stress.", duration: 15 },
    { name: "Relaxing Neck Semi-Circles", instructions: "Slowly drop your left ear towards your left shoulder, roll your chin downward to your collarbone, and over to your right shoulder. Breathe deeply. Never pull or strain.", duration: 20 },
    { name: "Empathetic Chest Opening", instructions: "Sit straight, lace your fingers behind your lower back, and pull your shoulder blades tightly together as you lift your chin slightly. Open your heart space to restore lung capacity.", duration: 15 },
  ];
  const [stretchTimer, setStretchTimer] = useState(stretches[0].duration);
  const [stretchActive, setStretchActive] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (stretchActive && stretchTimer > 0) {
      timer = setInterval(() => {
        setStretchTimer((prev) => prev - 1);
      }, 1000);
    } else if (stretchTimer === 0 && stretchActive) {
      setStretchActive(false);
      if (stretchIdx < stretches.length - 1) {
        const next = stretchIdx + 1;
        setStretchIdx(next);
        setStretchTimer(stretches[next].duration);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stretchActive, stretchTimer, stretchIdx]);

  // 5. Custom Scribble prompt state
  const [scribbleText, setScribbleText] = useState("");
  const [savedScribbles, setSavedScribbles] = useState<string[]>([]);
  const tempTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSaveScribble = () => {
    if (scribbleText.trim()) {
      setSavedScribbles((prev) => [scribbleText.trim(), ...prev]);
      setScribbleText("");
    }
  };

  const getBreathSize = () => {
    if (!breathSessionActive) return "scale-100";
    switch (breathPhase) {
      case "Inhale":
        return "scale-[1.6]"; // Grow slowly
      case "Hold":
        return "scale-[1.65]"; // stay large
      case "Exhale":
        return "scale-95"; // shrink
      case "Hold Out":
        return "scale-90"; // stay small
    }
  };

  const getBreathColor = () => {
    switch (breathPhase) {
      case "Inhale":
        return "bg-[#2E5C44]";
      case "Hold":
        return "bg-[#627D6F] shadow-lg shadow-[#627D6F]/20";
      case "Exhale":
        return "bg-[#1C3224]";
      case "Hold Out":
        return "bg-[#E2EBE5]";
    }
  };

  return (
    <div id="intervention-root" className="bg-white rounded-[40px] border border-[#DFE8E2] p-6 md:p-8 shadow-sm max-w-4xl mx-auto my-6 animate-fade-in">
      {/* Upper context block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DFE8E2] pb-5 mb-6">
        <div>
          <span className="text-[10px] bg-[#E2EBE5] border border-[#DFE8E2] text-[#2E5C44] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block">
            Real-time Nervous System Stabilization
          </span>
          <h2 className="text-xl font-serif font-medium tracking-tight text-[#1C3224] mt-1">
            Grounding & Anti-Spiral Interventions
          </h2>
        </div>
        {customInstructions && (
          <div className="bg-[#ECF2EE] border border-[#DFE8E2] rounded-2xl p-4 max-w-xs mt-3 md:mt-0 text-[11px] text-[#627D6F] leading-relaxed italic">
            💡 <b>Gemini Recommends:</b> {customInstructions}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 scrollbar-thin border-b border-[#DFE8E2] mb-6">
        <button
          id="btn-tab-breath"
          onClick={() => setActiveTab("breathing")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "breathing"
              ? "bg-[#2E5C44] text-white shadow"
              : "bg-[#F1F5F2] text-[#23382C] hover:bg-[#E2EBE5]/50"
          }`}
        >
          <Wind className="h-4 w-4" /> Resilient Breath
        </button>

        <button
          id="btn-tab-music"
          onClick={() => setActiveTab("ambient_music")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "ambient_music"
              ? "bg-[#2E5C44] text-white shadow"
              : "bg-[#F1F5F2] text-[#23382C] hover:bg-[#E2EBE5]/50"
          }`}
        >
          <Music className="h-4 w-4" /> Ambient Solace Sound
        </button>

        <button
          id="btn-tab-ground"
          onClick={() => setActiveTab("guided_grounding")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "guided_grounding"
              ? "bg-[#2E5C44] text-white shadow"
              : "bg-[#F1F5F2] text-[#23382C] hover:bg-[#E2EBE5]/50"
          }`}
        >
          <Eye className="h-4 w-4" /> 5-4-3-2-1 Grounding
        </button>

        <button
          id="btn-tab-stretch"
          onClick={() => setActiveTab("physical_movement")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "physical_movement"
              ? "bg-[#2E5C44] text-white shadow"
              : "bg-[#F1F5F2] text-[#23382C] hover:bg-[#E2EBE5]/50"
          }`}
        >
          <Compass className="h-4 w-4" /> Somatic Stretching
        </button>

        <button
          id="btn-tab-scribble"
          onClick={() => setActiveTab("journal_prompt")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "journal_prompt"
              ? "bg-[#2E5C44] text-white shadow"
              : "bg-[#F1F5F2] text-[#23382C] hover:bg-[#E2EBE5]/50"
          }`}
        >
          <PenTool className="h-4 w-4" /> Clear out Scribbles
        </button>
      </div>

      {/* Frame content */}
      <div className="bg-[#F1F5F2]/50 rounded-[32px] border border-[#DFE8E2] p-6 md:p-8 min-h-[300px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* TAB 1: Breathing */}
          {activeTab === "breathing" && (
            <motion.div
              key="breathing-content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col items-center text-center justify-center space-y-6 flex-1"
            >
              <div className="max-w-sm space-y-1.5">
                <h3 className="text-base font-serif font-bold text-[#1C3224]">Therapeutic Box Breathing</h3>
                <p className="text-xs text-[#627D6F] leading-relaxed">
                  Used by clinical groups and athletes to lower heart rates. Inhale, Hold, Exhale, Hold out — 4 seconds each.
                </p>
              </div>

              {/* Animated bubble container */}
              <div className="relative h-44 w-full flex items-center justify-center">
                <div
                  className={`h-16 w-16 rounded-full transition-all duration-[3900ms] ease-in-out flex items-center justify-center text-white text-xs font-bold ${getBreathColor()} ${getBreathSize()}`}
                >
                  <Wind className="h-5 w-5 opacity-90 animate-pulse" />
                </div>

                {breathSessionActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[#1C3224] font-serif font-extrabold text-lg uppercase tracking-widest mt-16 bg-white/85 backdrop-blur-md px-4 py-1.5 rounded-3xl border border-[#DFE8E2]">
                      {breathPhase}
                    </span>
                    <span className="text-[#627D6F] text-xs mt-1.5">
                      Cycle counts remaining: {breathCounter}s
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 w-full max-w-xs">
                {breathSessionActive ? (
                  <>
                    <div className="flex justify-between items-center text-[#627D6F] text-xs px-2">
                      <span>Time Remaining:</span>
                      <span className="font-mono font-bold text-[#1C3224]">{breathTimer}s</span>
                    </div>
                    <div className="w-full bg-[#E2EBE5] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E5C44] transition-all duration-1000" style={{ width: `${(breathTimer / 60) * 105}%` }} />
                    </div>
                    <button
                      id="stop-breath-btn"
                      onClick={() => setBreathSessionActive(false)}
                      className="w-full py-2.5 bg-[#1C3224] hover:bg-[#1C3224]/90 text-white rounded-xl text-xs font-bold hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Square className="h-3.5 w-3.5" /> Force Settle Cycle
                    </button>
                  </>
                ) : (
                  <button
                    id="start-breath-btn"
                    onClick={handleStartBreathing}
                    className="w-full py-3 bg-[#2E5C44] hover:bg-[#2E5C44]/90 text-white rounded-2xl text-xs font-extrabold tracking-wider uppercase shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="h-4 w-4" /> Start Grounding Breath Session
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: Synth Ambient Music */}
          {activeTab === "ambient_music" && (
            <motion.div
              key="music-content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col items-center text-center justify-center space-y-6 flex-1"
            >
              <div className="max-w-sm space-y-1.5">
                <h3 className="text-base font-serif font-bold text-[#1C3224]">Procedural Pentatonic Tuning</h3>
                <p className="text-xs text-[#627D6F] leading-relaxed">
                  A pure, infinite therapeutic pad chord generated dynamically inside your browser. Conforms with neural regulation sync patterns.
                </p>
              </div>

              {/* Dynamic waveform visualizer */}
              <div className="h-20 w-48 flex items-center justify-between gap-1">
                {[...Array(12)].map((_, idx) => (
                  <motion.div
                    key={idx}
                    animate={musicPlaying ? { height: [12, Math.random() * 55 + 15, 12] } : { height: 10 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8 + idx * 0.15,
                      ease: "easeInOut",
                    }}
                    style={{ originY: 0.5 }}
                    className={`w-2.5 rounded-full transition-colors ${musicPlaying ? "bg-[#2E5C44]" : "bg-[#CFDED5]"}`}
                  />
                ))}
              </div>

              <div className="space-y-4 w-full max-w-xs">
                <button
                  id="music-play-toggle"
                  onClick={handleToggleMusic}
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wider uppercase shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    musicPlaying
                      ? "bg-[#B25E5E]"
                      : "bg-[#2E5C44]"
                  } text-white hover:opacity-95`}
                >
                  {musicPlaying ? (
                    <>
                      <Square className="h-4 w-4 fill-white text-white" /> Pause Soundscape
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white text-white" /> Activate Synth Ocean
                    </>
                  )}
                </button>
                <p className="text-[10px] text-[#627D6F]">
                  Tip: You can enable the music and switch to other tabs (Scribbling, Breathing) to read guidelines while listening.
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 3: 5-4-3-2-1 Grounding */}
          {activeTab === "guided_grounding" && (
            <motion.div
              key="grounding-content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col justify-between flex-1 py-4 space-y-6"
            >
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-base font-serif font-bold text-[#1C3224]">5-4-3-2-1 Cognitive Reset</h3>
                <p className="text-xs text-[#627D6F] leading-relaxed max-w-xl">
                  Stabilize escalating anxiety loops by actively naming files of sensory feedback. Each item demands brain visual cortex load, shutting down spiral processors.
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="grid grid-cols-5 gap-2 max-w-md mx-auto w-full">
                {groundingSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-colors ${
                      idx === groundingStep
                        ? "bg-[#2E5C44] border border-[#2E5C44]"
                        : idx < groundingStep
                        ? "bg-[#627D6F]"
                        : "bg-[#E2EBE5]"
                    }`}
                  />
                ))}
              </div>

              {/* Step Detail */}
              <div className="bg-white p-6 rounded-[24px] border border-[#DFE8E2] max-w-lg mx-auto w-full shadow-xs text-center">
                <span className="text-2xl font-black text-[#2E5C44] mr-2">
                  {groundingSteps[groundingStep].count}
                </span>
                <h4 className="text-sm font-serif font-bold text-[#1C3224] inline-block mt-0.5">
                  {groundingSteps[groundingStep].title}
                </h4>
                <p className="text-xs text-[#23382C] mt-2 leading-relaxed">
                  {groundingSteps[groundingStep].desc}
                </p>
              </div>

              <div className="flex justify-between max-w-md mx-auto w-full">
                <button
                  id="btn-ground-prev"
                  onClick={() => setGroundingStep((p) => Math.max(0, p - 1))}
                  disabled={groundingStep === 0}
                  className="px-4 py-1.5 bg-[#E2EBE5] hover:bg-[#E2EBE5]/90 text-[#1C3224] font-medium text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  Previous
                </button>

                {groundingStep < groundingSteps.length - 1 ? (
                  <button
                    id="btn-ground-next"
                    onClick={() => setGroundingStep((p) => p + 1)}
                    className="px-5 py-2 bg-[#2E5C44] hover:bg-[#2E5C44]/90 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Acknowledge & Continue
                  </button>
                ) : (
                  <button
                    id="btn-ground-done"
                    onClick={() => {
                      setGroundingStep(0);
                      onComplete?.();
                    }}
                    className="px-5 py-2 bg-[#2E5C44] hover:bg-[#2E5C44]/90 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Settle Grounding Complete
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: Somatic Stretches */}
          {activeTab === "physical_movement" && (
            <motion.div
              key="stretch-content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col justify-between flex-1 py-4 space-y-6"
            >
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-base font-serif font-bold text-[#1C3224]">Rapid Somatic Trauma Reset</h3>
                <p className="text-xs text-[#627D6F] leading-relaxed">
                  Stress stores physical energy in muscle fascia (shoulders, hands, chest joints). Walk through these physical triggers to decompress stress receptors.
                </p>
              </div>

              {/* Active Stretch Display */}
              <div className="bg-white rounded-[24px] border border-[#DFE8E2] p-6 shadow-xs max-w-lg mx-auto w-full">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase font-extrabold text-[#2E5C44] tracking-wider">
                    Somatic Trigger {stretchIdx + 1} of {stretches.length}
                  </span>
                  <span className="font-mono text-sm font-black text-rose-500">
                    {stretchTimer}s remaining
                  </span>
                </div>
                <h4 className="text-sm font-serif font-extrabold text-[#1C3224]">{stretches[stretchIdx].name}</h4>
                <p className="text-xs text-[#23382C] mt-2 leading-relaxed">
                  {stretches[stretchIdx].instructions}
                </p>
              </div>

              {/* Control buttons */}
              <div className="flex justify-between items-center max-w-md mx-auto w-full">
                <div className="flex gap-2">
                  <button
                    id="btn-stretch-prev"
                    disabled={stretchIdx === 0}
                    onClick={() => {
                      setStretchActive(false);
                      const idx = stretchIdx - 1;
                      setStretchIdx(idx);
                      setStretchTimer(stretches[idx].duration);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-[#E2EBE5] hover:bg-[#E2EBE5]/90 rounded-lg text-[#1C3224] cursor-pointer transition-colors disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button
                    id="btn-stretch-next"
                    disabled={stretchIdx === stretches.length - 1}
                    onClick={() => {
                      setStretchActive(false);
                      const idx = stretchIdx + 1;
                      setStretchIdx(idx);
                      setStretchTimer(stretches[idx].duration);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-[#E2EBE5] hover:bg-[#E2EBE5]/90 rounded-lg text-[#1C3224] cursor-pointer transition-colors disabled:opacity-40"
                  >
                    Skip
                  </button>
                </div>

                {stretchActive ? (
                  <button
                    id="btn-stretch-pause"
                    onClick={() => setStretchActive(false)}
                    className="px-4 py-2 bg-[#1C3224] text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    Pause Stretch Timer
                  </button>
                ) : (
                  <button
                    id="btn-stretch-play"
                    onClick={() => setStretchActive(true)}
                    className="px-5 py-2.5 bg-[#2E5C44] hover:bg-[#2E5C44]/90 text-white font-extrabold text-xs rounded-lg hover:shadow-md cursor-pointer transition-all shadow flex items-center gap-1"
                  >
                    <Play className="h-3.5 w-3.5" /> Start Somatic Stretch
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 5: Clear out Scribbles */}
          {activeTab === "journal_prompt" && (
            <motion.div
              key="scribble-content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col justify-between flex-1 py-4 space-y-6"
            >
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-base font-serif font-bold text-[#1C3224]">Cognitive &quot;Brain-Dump&quot; Catharsis</h3>
                <p className="text-xs text-[#627D6F] leading-relaxed">
                  Type without filter. Write out your raw frustrations, anxieties, or circular worries. This text block does not go to the server — it is your local immediate draft space to spill out heavy thoughts and instantly empty them.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <textarea
                    ref={tempTextareaRef}
                    value={scribbleText}
                    onChange={(e) => setScribbleText(e.target.value)}
                    placeholder="Type raw loops or what is stuck in your mind... When done, click 'Evacuate Thought' to erase, or save to temporary local draft log."
                    className="w-full min-h-[140px] text-xs leading-relaxed text-[#23382C] bg-white border border-[#DFE8E2] rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-[#2E5C44] focus:border-transparent cursor-text select-text"
                  />
                  <div className="flex gap-2">
                    <button
                      id="save-scribble-btn"
                      onClick={handleSaveScribble}
                      className="px-4 py-2 bg-[#2E5C44] hover:bg-[#2E5C44]/90 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                    >
                      Log to Local Active Draft
                    </button>
                    <button
                      id="dump-scribble-btn"
                      onClick={() => setScribbleText("")}
                      className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100/75 text-rose-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                    >
                      Evacuate Thought (Erase)
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#DFE8E2] max-h-[200px] overflow-y-auto space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-[#627D6F] block tracking-wider">
                    Scribbled Journal Drafts
                  </span>
                  {savedScribbles.length > 0 ? (
                    savedScribbles.map((sc, idx) => (
                      <div key={idx} className="bg-[#F1F5F2] border border-[#DFE8E2] p-3 rounded-xl relative group">
                        <p className="text-[11px] text-[#23382C] leading-relaxed italic pr-4">{sc}</p>
                        <button
                          id={`del-scribble-${idx}`}
                          onClick={() => setSavedScribbles((p) => p.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 h-4 w-4 bg-[#E2EBE5] hover:bg-rose-100 hover:text-rose-600 text-[#627D6F] rounded flex items-center justify-center text-[10px] border border-transparent transition-colors shadow-2xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-[#627D6F]/75 italic">Saved Local scribble text is empty. Type in the draft space to relieve pressure.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onComplete && (
        <div className="flex justify-end mt-5">
          <button
            id="finish-interventions-btn"
            onClick={onComplete}
            className="px-5 py-2.5 bg-[#1C3224] hover:bg-[#1C3224]/90 text-white font-serif font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Return to Core Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
