import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Sparkles, AlertCircle, FileAudio, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AudioRecorderProps {
  onAnalysisSuccess: (analysis: any) => void;
  onAnalysisStart: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAnalysisSuccess,
  onAnalysisStart,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localAudioBlob, setLocalAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // For Real-time Web Audio API waveform visualization
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer effect for recording length
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Handle canvas rendering of mic frequencies / sine waves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const fillBackground = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, width, height);
    };

    const drawPulse = () => {
      fillBackground();
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(30, 70, 49, 0.25)"; // Calming deep forest green leaf wave

      // Standard ambient pulsing center line when idle
      const now = Date.now() * 0.003;
      ctx.moveTo(0, height / 2);
      for (let x = 0; x < width; x++) {
        const amplitude = 3;
        const frequency = 0.012;
        const y = height / 2 + Math.sin(x * frequency + now) * amplitude;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (!isRecording) {
        animationFrameRef.current = requestAnimationFrame(drawPulse);
      }
    };

    const drawFreqWave = () => {
      if (!analyserRef.current || !ctx) return;

      fillBackground();

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.beginPath();
      ctx.lineWidth = 3;
      // Beautiful warm natural tones organic gradient wave with emerald-sage botanical colors
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#1E4631"); // Spruce Deep Forest
      gradient.addColorStop(0.5, "#4A6D58"); // Comfort Gentle Sage
      gradient.addColorStop(1, "#12291C"); // Pure deep pine
      ctx.strokeStyle = gradient;

      const sliceWidth = width / bufferLength;
      let x = 0;

      ctx.moveTo(0, height / 2);
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // Normalized between 0 and 2
        // Scale vertical expansion based on actual recording
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(drawFreqWave);
      }
    };

    if (isRecording && analyserRef.current) {
      drawFreqWave();
    } else {
      drawPulse();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio setup for mic visualization
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // Determine supported browser format prefering basic container
      let options = {};
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        options = { mimeType: "audio/ogg" };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        setLocalAudioBlob(audioBlob);
        cleanupAudioNodes();
      };

      mediaRecorder.start(200); // chunk every 200ms
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access failed", err);
      setErrorMsg(
        "Could not access your microphone. If you are inside an iframe, security restrictions may block live mic. Please use the 'Upload Audio File' alternative below to proceed!"
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cleanupAudioNodes = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  // Convert blob to base64 and process
  const processAudio = async (blobToProcess: Blob) => {
    setIsProcessing(true);
    setErrorMsg(null);
    onAnalysisStart();

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blobToProcess);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Split meta headers off the base64 string (e.g. "data:audio/webm;base64,")
        const base64Data = base64String.split(",")[1];

        // Send to Express Backend proxy
        const response = await fetch("/api/journal/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audioData: base64Data,
            mimeType: blobToProcess.type,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Server failed to analyze key cues.");
        }

        const data = await response.json();
        onAnalysisSuccess(data);
        setIsProcessing(false);
        setLocalAudioBlob(null); // Clear active
      };
    } catch (err: any) {
      console.error("Processing failed", err);
      setErrorMsg(err.message || "An error occurred during voice analysis. Let's try again.");
      setIsProcessing(false);
    }
  };

  // Handle direct file uploads as dynamic fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMsg(null);
      if (!file.type.startsWith("audio/")) {
        setErrorMsg("Please select a valid audio file (mp3, wav, webm, m4a, etc).");
        return;
      }
      processAudio(file);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div id="audio-recorder-section" className="bg-white rounded-[40px] p-8 border border-[#D1DFD6] shadow-sm">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-[#1E4631]/15 flex items-center justify-center text-[#2D6A4F] mb-2">
          <Mic id="record-header-icon" className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-serif font-semibold tracking-tight text-[#1C3224]">Daily Reflection Voice Captain</h2>
        <p className="text-sm text-[#4A6D58] mt-1.5 max-w-sm">
          Express your feelings, life events, self-reflections, or stress issues aloud.
          Let Gemini digest your signals natively.
        </p>
      </div>

      {/* Waveform Visualizer Screen */}
      <div className="relative my-6 h-28 bg-[#F3F7F4] rounded-3xl overflow-hidden border border-[#D1DFD6] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={112}
          className="w-full h-full block cursor-pointer"
        />

        {isRecording && (
          <div className="absolute top-3 left-3 bg-[#1E4631]/90 text-white text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white block" />
            <span>RECORDING: {formatTimer(recordingTime)}</span>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {isProcessing && (
            <div className="bg-white/95 px-4 py-2.5 rounded-2xl border border-[#D1DFD6] shadow-sm flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-4 h-4 border-2 border-[#1E4631] border-t-transparent rounded-full"
              />
              <span className="text-xs font-semibold text-[#1C3224] flex items-center gap-1">
                Gemini Native Audio Engine active... <Sparkles className="h-3.5 w-3.5 text-[#2D6A4F] animate-pulse" />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Rec Buttons */}
        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {!isRecording && !localAudioBlob && (
              <motion.button
                id="start-rec-btn"
                onClick={startRecording}
                disabled={isProcessing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-16 w-16 rounded-full bg-[#1E4631] hover:bg-[#2D6A4F] focus:outline-none focus:ring-4 focus:ring-[#1E4631]/25 transition-colors flex items-center justify-center text-white shadow-lg disabled:opacity-50 cursor-pointer"
              >
                <Mic className="h-8 w-8" />
              </motion.button>
            )}

            {isRecording && (
              <motion.button
                id="stop-rec-btn"
                onClick={stopRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-16 w-16 rounded-full bg-[#12291C] hover:bg-[#1E4631] transition-colors flex items-center justify-center text-white shadow-lg border border-[#D1DFD6] cursor-pointer"
              >
                <Square className="h-6 w-6" />
              </motion.button>
            )}
          </AnimatePresence>

          {localAudioBlob && !isProcessing && (
            <div className="flex items-center gap-3">
              <button
                id="retry-rec-btn"
                onClick={() => setLocalAudioBlob(null)}
                className="px-4 py-2 text-sm font-medium text-[#21352A] bg-[#E8F0EA] hover:bg-[#D1DFD6] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button
                id="analyze-rec-btn"
                onClick={() => processAudio(localAudioBlob)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#1E4631] hover:bg-[#2D6A4F] rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer font-serif"
              >
                <Sparkles className="h-4 w-4" /> Extract Insights
              </button>
            </div>
          )}
        </div>

        {isRecording && (
          <p className="text-xs text-[#4A6D58]">
            Tap the button when you are done speaking.
          </p>
        )}

        {!isRecording && !localAudioBlob && !isProcessing && (
          <p className="text-xs text-[#4A6D58]">
            Click the forest green button to start recording. Detects: Tone, Cadence, Sentiment.
          </p>
        )}

        {/* Fallback Audio Uploader */}
        {!isRecording && !localAudioBlob && !isProcessing && (
          <div className="mt-4 pt-4 border-t border-[#D1DFD6] w-full flex flex-col items-center">
            <span className="text-[11px] font-semibold text-[#4A6D58] tracking-wider uppercase mb-2">
              Or Use Alternate File Upload
            </span>
            <label
              id="file-upload-label"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D1DFD6] bg-[#F3F7F4] hover:bg-[#E8F0EA] cursor-pointer transition-colors text-xs font-semibold text-[#1E4631] shadow-xs animate-none"
            >
              <FileAudio className="h-3.5 w-3.5 text-[#4A6D58]" />
              <span>Select recorded audio clip</span>
              <input
                id="audio-file-input"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Errors section */}
        {errorMsg && (
          <motion.div
            id="rec-err-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-amber-50/60 border border-amber-200/50 text-xs text-amber-800 flex items-start gap-2 max-w-sm"
          >
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Note on Microphones:</span>
              <span>{errorMsg}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
