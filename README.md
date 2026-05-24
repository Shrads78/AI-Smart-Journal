# Voice-First Smart Journal

A voice-first mental wellness app where you simply speak about your day — no typing, no forms. Using Gemini's native multimodal audio capabilities, the app listens to your raw voice and extracts deep emotional signals directly from speech, without converting to text first.

---

## Features

- **Voice-native journaling** — speak naturally, Gemini processes audio directly via multimodal inference
- **Emotional signal extraction** — mood, stress level, energy level, recurring themes, and spiral risk scored per entry
- **Self-talk analysis** — tracks frequency of positive vs. negative self-talk with specific examples and identified triggers
- **Life event mapping** — links specific emotions to the events that triggered them
- **Real-time spiral intervention** — detects when a user is heading toward an emotional spiral and intervenes with breathing exercises, guided grounding, ambient music, physical movement prompts, or journaling suggestions
- **Apple Watch integration** — enriches analysis with HRV, sleep, resting heart rate, steps, and activity data for clinically-grounded insights
- **Opt-out control** — users review extracted signals and remove anything they don't want reflected in their dashboard
- **Longitudinal dashboard** — visual charts and trend analysis to track emotional well-being across days, weeks, months, and years

---

## Tech Stack

- **Frontend** — React 19, Vite, Tailwind CSS, Framer Motion
- **Backend** — Express (dev) / Vercel Serverless Functions (prod)
- **AI** — Google Gemini multimodal API (`@google/genai`)
- **Health data** — Apple Health XML export parser (no third-party service)
- **Deployment** — Vercel

---

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your-key-here
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. (Optional) Export your Apple Health data from the Health app on iPhone → drop `export.xml` into the `data/` folder for wearable-enriched analysis.

---

## Deploy to Vercel

```bash
vercel --prod
```

Set `GEMINI_API_KEY` as an environment variable in your Vercel project settings or via:

```bash
vercel env add GEMINI_API_KEY production
```

---

## How It Works

1. Tap record and speak freely about your day
2. Gemini processes the raw audio — no speech-to-text step
3. The app extracts mood, stress, energy, themes, self-talk patterns, life events, spiral risk, and a well-being score
4. If spiral risk is elevated, a real-time intervention is triggered (breathing, grounding, music, movement)
5. Insights land on your dashboard — review, opt out of anything, and track your emotional journey over time
