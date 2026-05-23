import { GoogleGenAI, Type } from "@google/genai";
import { parseHealthData, buildHealthContext } from "../../src/utils/healthParser";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { audioData, mimeType } = await req.json();

  if (!audioData) {
    return Response.json({ error: "No audio data provided." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Gemini API key is not configured." }, { status: 500 });
  }

  let healthContextStr = "";
  try {
    const snapshot = parseHealthData();
    healthContextStr = "\n\n" + buildHealthContext(snapshot);
  } catch {
    // health data optional
  }

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
7. Predict potential spiral risk (low, medium, high). A spiral risk is high if there is repetitive compounding negative self-talk, worsening stress, and a lack of adaptive coping mechanisms. Also elevate risk if wearable data shows poor sleep or low HRV.
8. Assess an overall Mental Well-being Score (1-100) based on their self-talk, mood, coping thoughts, and wearable context.
9. Provide actionable, personalized tips to steer them toward positive self-talk and better mental well-being. Reference wearable data where relevant (e.g. sleep hygiene if sleep is low).
10. Recommend a real-time intervention based on their emotional AND physical state (particularly if stress is high, HRV is low, or spiral risk is medium/high). Choose the most appropriate: 'breathing', 'ambient_music', 'guided_grounding', or 'physical_movement' and explain why. If HRV is low, avoid recommending physical_movement.
${healthContextStr}

Provide the response in structured JSON format matching the schema exactly.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      { inlineData: { mimeType: mimeType || "audio/webm", data: audioData } },
      { text: "Analyze this spoken journal audio and extract all metrics. Be clinically empathetic, supportive, and highly insightful. Ensure the transcription captures the user's reflection precisely." },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING, description: "The complete, highly accurate transcribed text from the audio." },
          mood: { type: Type.STRING, description: "The primary identified emotional mood state (e.g., Calm, Anxious, Sad, Angry, Excited, Exhausted, Neutral)." },
          moodIntensity: { type: Type.INTEGER, description: "Intensity of the mood state on a scale from 1 (very mild) to 10 (extremely intense)." },
          stressLevel: { type: Type.INTEGER, description: "Stress/anxiety level of the user on a scale from 1 (no stress at all) to 10 (crisis levels)." },
          energyLevel: { type: Type.INTEGER, description: "Energy levels on a scale from 1 (lethargic, completely drained) to 10 (radiating high energy)." },
          themes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific overall themes or topics present in the reflection." },
          triggers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Identified triggers for stress, anxiety, or emotional drops in the speech." },
          lifeEvents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                event: { type: Type.STRING, description: "The specific life event or action stated." },
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
              positiveExamples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific phrases spoken that count as positive self-talk." },
              negativeExamples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific phrases spoken that count as negative self-talk." },
            },
            required: ["positiveCount", "negativeCount", "positiveExamples", "negativeExamples"],
          },
          spiralRisk: { type: Type.STRING, description: "Risk prediction of the user entering an emotional spiral. Must be one of: 'low', 'medium', or 'high'." },
          wellbeingScore: { type: Type.INTEGER, description: "A calculated overall mental wellbeing metric between 1 and 100." },
          wellbeingTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Concrete, actionable tips to shift negative patterns, manage stress, or support ongoing wellness." },
          recommendedIntervention: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "The optimized real-time intervention type. Must be 'breathing', 'ambient_music', 'guided_grounding', or 'physical_movement'." },
              reason: { type: Type.STRING, description: "Clinical or supportive rationale for recommending this specific treatment strategy." },
              instructions: { type: Type.STRING, description: "Specific, bite-sized direct instructions or exercises to guide them in this session." },
            },
            required: ["type", "reason", "instructions"],
          },
        },
        required: ["transcript", "mood", "moodIntensity", "stressLevel", "energyLevel", "themes", "triggers", "lifeEvents", "selfTalk", "spiralRisk", "wellbeingScore", "wellbeingTips", "recommendedIntervention"],
      },
    },
  });

  const responseText = response.text;
  if (!responseText) throw new Error("Empty response from Gemini.");

  const cleanJson = responseText.trim().replace(/^```json\s*/, "").replace(/```$/, "");
  return Response.json(JSON.parse(cleanJson));
}
