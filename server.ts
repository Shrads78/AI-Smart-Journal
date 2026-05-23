import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

// Safely resolve __dirname and __filename for CJS and ESM compatibility
const __filename = typeof import.meta?.url !== "undefined" ? fileURLToPath(import.meta.url) : ((globalThis as any).__filename || "");
const __dirname = typeof (globalThis as any).__dirname !== "undefined" ? (globalThis as any).__dirname : (__filename ? path.dirname(__filename) : process.cwd());

// Initialize the Gemini SDK server-side
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3001");

  // Set limits to handle larger audio base64 uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint to analyze spoken journal entry
  app.post("/api/journal/analyze", async (req, res) => {
    try {
      const { audioData, mimeType } = req.body;

      if (!audioData) {
        return res.status(400).json({ error: "No audio data provided." });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: "Gemini API key is missing. Please configure it in Settings > Secrets.",
        });
      }

      // Convert frontend recording base64 to parts chunk for Gemini multimodal input
      const audioPart = {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audioData,
        },
      };

      const systemInstruction = `You are a voice-first smart journaling clinical therapist assistant.
Your goal is to analyze the audio representation of the user speaking about their day, feelings, and events.
Listen carefully to the voice content (both literal transcription and vocal features and context if present, but focus heavily on semantic and clinical indicators).

Perform the following:
1. Generate an accurate transcription of the user's spoken words.
2. Formulate emotional signals: mood category, mood intensity (1-10), stress level (1-10), and energy level (1-10).
3. Identify general recurring themes in what they reflect.
4. Extract specific triggers for stress or anxiety mentioned.
5. Track specific life events and the corresponding emotions triggered by them.
6. Analyze self-talk: count instances of Positive vs Negative self-talk, and extract specific examples.
   - Positive Self-Talk definitions: Encouraging, kind, self-accepting, optimistic, resilient phrases.
   - Negative Self-Talk definitions: Self-critical, catastrophic, pessimistic, harsh, defeating phrases.
7. Predict potential spiral risk (low, medium, high). A spiral risk is high if there is repetitive compounding negative self-talk, worsening stress, and a lack of adaptive coping mechanisms.
8. Assess an overall Mental Well-being Score (1-100) based on their self-talk, mood, and coping thoughts.
9. Provide actionable, personalized tips to steer them toward positive self-talk and better mental well-being.
10. Recommend a real-time intervention based on their emotional state (particularly if stress is high or spiral risk is medium/high). Choose the most appropriate: 'breathing', 'ambient_music', 'guided_grounding', or 'physical_movement' and explain why.

Provide the response in structured JSON format matching the schema exactly.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          audioPart,
          {
            text: "Analyze this spoken journal audio and extract all metrics. Be clinically empathetic, supportive, and highly insightful. Ensure the transcription captures the user's reflection precisely.",
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: {
                type: Type.STRING,
                description: "The complete, highly accurate transcribed text from the audio.",
              },
              mood: {
                type: Type.STRING,
                description: "The primary identified emotional mood state (e.g., Calm, Anxious, Sad, Angry, Excited, Exhausted, Neutral).",
              },
              moodIntensity: {
                type: Type.INTEGER,
                description: "Intensity of the mood state on a scale from 1 (very mild) to 10 (extremely intense).",
              },
              stressLevel: {
                type: Type.INTEGER,
                description: "Stress/anxiety level of the user on a scale from 1 (no stress at all) to 10 (crisis levels).",
              },
              energyLevel: {
                type: Type.INTEGER,
                description: "Energy levels on a scale from 1 (lethargic, completely drained) to 10 (radiating high energy).",
              },
              themes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Specific overall themes or topics present in the reflection.",
              },
              triggers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Identified trigger triggers for stress, anxiety, or emotional drops in the speech.",
              },
              lifeEvents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    event: { type: Type.STRING, description: "The specific life event or action stated (e.g., speaking to manager, traffic jam, completed a drawing)." },
                    emotion: { type: Type.STRING, description: "The direct emotion triggered by this event." },
                  },
                  required: ["event", "emotion"],
                },
                description: "A mapping of specific events described and the emotions associated to them.",
              },
              selfTalk: {
                type: Type.OBJECT,
                properties: {
                  positiveCount: { type: Type.INTEGER, description: "Count of positive, encouraging, or constructive self-talk statements." },
                  negativeCount: { type: Type.INTEGER, description: "Count of self-deprecating, harsh, or defeatist self-talk statements." },
                  positiveExamples: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Specific phrases spoken that count as positive, optimistic, or compassionate self-talk.",
                  },
                  negativeExamples: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Specific phrases spoken that count as negative, critical, or catastrophic self-talk.",
                  },
                },
                required: ["positiveCount", "negativeCount", "positiveExamples", "negativeExamples"],
              },
              spiralRisk: {
                type: Type.STRING,
                description: "Risk prediction of the user entering an emotional spiral. Must be one of: 'low', 'medium', or 'high'.",
              },
              wellbeingScore: {
                type: Type.INTEGER,
                description: "A calculated overall mental wellbeing metric between 1 and 100 based on their coping, self-talk, and emotional state.",
              },
              wellbeingTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Concrete, actionable tips to shift negative patterns, manage stress, or support ongoing wellness.",
              },
              recommendedIntervention: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "The optimized real-time intervention type. Must be 'breathing', 'ambient_music', 'guided_grounding', or 'physical_movement'.",
                  },
                  reason: {
                    type: Type.STRING,
                    description: "Clinical or supportive rationale for recommending this specific treatment strategy.",
                  },
                  instructions: {
                    type: Type.STRING,
                    description: "Specific, bite-sized direct instructions or exercises to guide them in this session (e.g. custom grounding thoughts).",
                  },
                },
                required: ["type", "reason", "instructions"],
              },
            },
            required: [
              "transcript",
              "mood",
              "moodIntensity",
              "stressLevel",
              "energyLevel",
              "themes",
              "triggers",
              "lifeEvents",
              "selfTalk",
              "spiralRisk",
              "wellbeingScore",
              "wellbeingTips",
              "recommendedIntervention",
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from the Gemini model.");
      }

      const cleanJson = responseText.trim().replace(/^```json\s*/, "").replace(/```$/, "");
      const analysisResult = JSON.parse(cleanJson);

      return res.json(analysisResult);
    } catch (error: any) {
      console.error("Analysis API failed:", error);
      return res.status(500).json({ error: error.message || "Failed to analyze your spoken reflection." });
    }
  });

  // Serve static files in production or delegate to Vite in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Voice Smart Journal server online at http://localhost:${PORT}`);
  });
}

startServer();
