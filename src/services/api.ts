import {
  Question,
  AnswerEvaluation,
  FinalAssessmentReport,
  DifficultyLevel,
} from '../types/interview';

// Use relative API path (works both with Vite proxy in dev and same-origin in prod)
const API_BASE = '/api';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

export const apiService = {
  async checkHealth(): Promise<{ status: string; hasGeminiKey: boolean; model: string }> {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        headers: defaultHeaders,
      });
      if (!response.ok) throw new Error('Health check failed');
      return await response.json();
    } catch (err) {
      console.warn('API health check error:', err);
      return { status: 'offline', hasGeminiKey: false, model: 'local' };
    }
  },

  async generateQuestion(params: {
    candidateName: string;
    targetRole: string;
    experienceLevel: string;
    interviewType: string;
    skills: string[];
    questionNumber: number;
    totalQuestions: number;
    currentDifficulty: DifficultyLevel;
    previousQuestions: { questionText: string; skill: string; score?: number }[];
    weakSkills: string[];
    focusSkill?: string;
  }): Promise<{ question: Question; source: 'gemini' | 'fallback' }> {
    const response = await fetch(`${API_BASE}/generate-question`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Question generation failed with status ${response.status}`);
    }

    return await response.json();
  },

  async evaluateAnswer(params: {
    candidateName: string;
    targetRole: string;
    experienceLevel: string;
    question: {
      text: string;
      skill: string;
      difficulty: DifficultyLevel;
      intent?: string;
    };
    candidateAnswer: string;
    previousWeakSkills: string[];
  }): Promise<{ evaluation: AnswerEvaluation; source: 'gemini' | 'fallback' }> {
    const response = await fetch(`${API_BASE}/evaluate-answer`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Answer evaluation failed with status ${response.status}`);
    }

    return await response.json();
  },

  async generateReport(params: {
    candidateName: string;
    targetRole: string;
    experienceLevel: string;
    interviewType: string;
    skills: string[];
    history: {
      questionNumber: number;
      questionText: string;
      skill: string;
      difficulty: DifficultyLevel;
      candidateAnswer: string;
      score: number;
      feedback: string;
      strengths?: string[];
      weaknesses?: string[];
    }[];
    skillScores: Record<string, { averageScore: number; attempts: number }>;
  }): Promise<{ report: FinalAssessmentReport; source: 'gemini' | 'fallback' }> {
    const response = await fetch(`${API_BASE}/generate-report`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Report generation failed with status ${response.status}`);
    }

    return await response.json();
  },
};
