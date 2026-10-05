import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { geminiService } from './gemini';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to extract key if supplied via header
function getHeaderApiKey(req: Request): string | undefined {
  const headerKey = req.headers['x-gemini-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  return undefined;
}

// Health & Status check
app.get('/api/health', (req: Request, res: Response) => {
  const headerKey = getHeaderApiKey(req);
  const hasEnvKey = geminiService.hasApiKey(headerKey);
  res.json({
    status: 'ok',
    service: 'InterviewPilot AI Engine',
    hasGeminiKey: hasEnvKey,
    model: 'gemini-1.5-flash',
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Generate Next Question
app.post('/api/generate-question', async (req: Request, res: Response) => {
  try {
    const customApiKey = getHeaderApiKey(req);
    const {
      candidateName,
      targetRole,
      experienceLevel,
      interviewType,
      skills,
      questionNumber,
      totalQuestions,
      currentDifficulty,
      previousQuestions,
      weakSkills,
      focusSkill,
    } = req.body;

    if (!candidateName || !targetRole || !skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Missing candidate details or skills list.' });
    }

    const result = await geminiService.generateQuestion({
      candidateName,
      targetRole,
      experienceLevel: experienceLevel || 'Fresher / MCA Student',
      interviewType: interviewType || 'Technical',
      skills,
      questionNumber: Number(questionNumber) || 1,
      totalQuestions: Number(totalQuestions) || 5,
      currentDifficulty: currentDifficulty || 'beginner',
      previousQuestions: previousQuestions || [],
      weakSkills: weakSkills || [],
      focusSkill,
      customApiKey,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error generating question:', error);
    return res.status(500).json({
      error: 'Failed to generate question',
      message: error?.message || 'Internal server error',
    });
  }
});

// Endpoint: Evaluate Candidate Answer
app.post('/api/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const customApiKey = getHeaderApiKey(req);
    const {
      candidateName,
      targetRole,
      experienceLevel,
      question,
      candidateAnswer,
      previousWeakSkills,
    } = req.body;

    if (!question || !question.text) {
      return res.status(400).json({ error: 'Question data is required for evaluation.' });
    }

    const result = await geminiService.evaluateAnswer({
      candidateName: candidateName || 'Candidate',
      targetRole: targetRole || 'Software Engineer',
      experienceLevel: experienceLevel || 'Fresher',
      question,
      candidateAnswer: candidateAnswer || '',
      previousWeakSkills: previousWeakSkills || [],
      customApiKey,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error evaluating answer:', error);
    return res.status(500).json({
      error: 'Failed to evaluate answer',
      message: error?.message || 'Internal server error',
    });
  }
});

// Endpoint: Generate Comprehensive Final Assessment Report
app.post('/api/generate-report', async (req: Request, res: Response) => {
  try {
    const customApiKey = getHeaderApiKey(req);
    const {
      candidateName,
      targetRole,
      experienceLevel,
      interviewType,
      skills,
      history,
      skillScores,
    } = req.body;

    if (!candidateName || !history || !Array.isArray(history)) {
      return res.status(400).json({ error: 'Candidate name and history are required for report generation.' });
    }

    const result = await geminiService.generateReport({
      candidateName,
      targetRole: targetRole || 'Software Engineer',
      experienceLevel: experienceLevel || 'Fresher',
      interviewType: interviewType || 'Technical',
      skills: skills || ['General Computer Science'],
      history,
      skillScores: skillScores || {},
      customApiKey,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error generating final report:', error);
    return res.status(500).json({
      error: 'Failed to generate final report',
      message: error?.message || 'Internal server error',
    });
  }
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(` InterviewPilot AI Server running on port ${PORT}`);
  console.log(` Gemini API Key status: ${geminiService.hasApiKey() ? 'CONFIGURED (Live Gemini Active)' : 'NOT FOUND (Using Adaptive Fallback Engine)'}`);
});

export default app;
