# InterviewPilot AI 🚀

> **"Your AI Interviewer — Ask. Evaluate. Adapt. Improve."**

An AI-powered adaptive technical interview agent built for **MCA students, freshers, and software engineering job seekers**. Powered by Google Gemini, InterviewPilot AI conducts realistic, interactive technical interviews that dynamically adapt difficulty based on performance, zero-in on weak skill areas, and produce comprehensive hiring dossiers with actionable roadmaps.

---

## 🌟 Key Features

### 1. Agentic Adaptive Interviewer
- **Stateful Memory**: Tracks every question asked, response submitted, and skill score to ensure zero duplicate questions.
- **Dynamic Difficulty Adaptation**:
  - **Score ≥ 8**: Escalates difficulty (*Beginner → Intermediate → Advanced*) to test architectural boundaries and trade-offs.
  - **Score 5–7**: Maintains difficulty to gauge conceptual consistency.
  - **Score < 5**: Calibrates difficulty down to core fundamentals to identify knowledge gaps.
- **Weak Skill Prioritization**: Continuously analyzes performance across domains (e.g., DBMS, OS, Data Structures); repeatedly struggling in a domain marks it as a focus area for subsequent questions.

### 2. Multi-Pillar Evaluation Rubric
Every candidate answer is evaluated across four core dimensions:
- **Correctness** (Accuracy of syntax, definitions, and logic)
- **Technical Depth** (Understanding of internal mechanisms, trade-offs, and complexities)
- **Communication** (Clarity, structure, and professional terminology)
- **Relevance** (Directness and completeness of the response)

### 3. Voice & Accessibility Integration
- **Text-to-Speech (TTS)**: Listens to the interviewer speak questions aloud using the Web Speech API.
- **Speech-to-Text (STT)**: Dictates answers verbally using microphone voice recognition.

### 4. Executive Hiring Assessment Dossier
- **Overall Score** (0–100 scale)
- **Hiring Committee Recommendation**: *Strong Hire*, *Hire*, *Borderline*, or *Needs Improvement*
- **Pillar Breakdown**: Technical Knowledge, Communication, Problem Solving
- **Skill Proficiency Matrix**: Progress bars and performance tags for each tested skill
- **Strengths & Knowledge Gaps**: Concrete highlights and missed concepts
- **Question-by-Question Audit Trail**: Review every question, candidate response, evaluator feedback, and model answer highlights
- **Placement Improvement Roadmap**: Prioritized milestones (*High*, *Medium*, *Low*) tailored for MCA students and freshers
- **Print & PDF Export**: Clean print styling for sharing with mentors or recruiters

### 5. Zero-Exposure Security
- **Secure Server Architecture**: The Gemini API key is **never exposed** in client-side code or bundled assets.
- **Local Proxy & Serverless Ready**: Handled via Express backend (`server/index.ts`) and Vercel serverless functions (`api/index.ts`).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express, TypeScript (`tsx`) |
| **AI Model** | Google Gemini API (`@google/generative-ai`, `gemini-1.5-flash`) |
| **Speech** | Web Speech API (SpeechSynthesis & SpeechRecognition) |
| **Deployment** | Vercel Serverless / Node Server |

---

## 📂 Project Structure

```text
interview-agent/
├── api/                    # Vercel serverless function entry
│   └── index.ts
├── server/                 # Express backend server
│   ├── index.ts            # API routes (/api/generate-question, /api/evaluate-answer, etc.)
│   ├── gemini.ts           # Gemini API client & structured JSON parsing
│   ├── prompts.ts          # Agentic prompts for question, evaluation, and reporting
│   └── mockFallback.ts     # Offline adaptive fallback engine for testing without keys
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── LandingPage.tsx
│   │   ├── SetupModal.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── InterviewSession.tsx
│   │   ├── AnswerEvaluationCard.tsx
│   │   ├── FinalReport.tsx
│   │   ├── ApiKeyModal.tsx
│   │   └── Toast.tsx
│   ├── services/           # Client services
│   │   ├── api.ts          # Backend API client
│   │   ├── storage.ts      # LocalStorage persistence
│   │   └── speech.ts       # Text-to-speech & speech recognition
│   ├── types/              # TypeScript interfaces
│   │   └── interview.ts
│   ├── App.tsx             # Main state machine & orchestrator
│   ├── main.tsx            # React root
│   └── index.css           # Tailwind directives & glassmorphic styling
├── .env.example            # Environment variable template
├── vercel.json             # Vercel deployment routing configuration
├── vite.config.ts          # Vite configuration with API proxy
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+ or higher

### 1. Installation
Clone or navigate to the repository and install dependencies:
```bash
cd interview-agent
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```
> **Get a free Gemini API key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
> *(Note: If no API key is provided, InterviewPilot AI automatically activates its built-in adaptive mock engine, allowing full offline testing without crashing!)*

### 3. Run Development Server
Run the client and backend concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

*(Vite automatically proxies any `/api` requests to the backend server)*

---

## 🏗️ Production Build

To verify and create the production bundle:
```bash
npm run build
```
This runs the TypeScript compiler (`tsc`) and Vite bundler (`vite build`). The optimized assets will be generated in `dist/`.

To test the production build locally:
```bash
npm start
```

---

## ☁️ Deployment Instructions

### Deploy to Vercel (Recommended)
1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"New Project"**.
3. Import your GitHub repository.
4. Set the Framework Preset to **Vite**.
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key.
6. Click **Deploy**. Vercel will build the frontend and deploy the serverless API routes located in `api/index.ts`.

---

## 🛡️ Security Best Practices
- **No Client-Side Leaks**: `process.env.GEMINI_API_KEY` is loaded exclusively inside `server/gemini.ts`.
- **Git Protection**: `.gitignore` ensures that `.env` and local environment secrets are never committed.
- **Client Key Option**: If an end-user provides their own key in the UI settings, it is transmitted solely via request headers (`x-gemini-key`) to the backend server and never written to repository files.

---

## 📄 License
MIT License. Built for students, freshers, and engineering job seekers worldwide.
