import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildQuestionPrompt, buildEvaluationPrompt, buildFinalReportPrompt } from './prompts';
import { getFallbackQuestion, evaluateFallbackAnswer, generateFallbackReport } from './mockFallback';
import { Question, AnswerEvaluation, FinalAssessmentReport, DifficultyLevel } from '../src/types/interview';

// Clean markdown code blocks from Gemini response if present
function parseGeminiJson<T>(rawText: string, fallbackGenerator: () => T): T {
  try {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean) as T;
  } catch (error) {
    console.error('Failed to parse Gemini response as JSON. Raw text:', rawText, error);
    return fallbackGenerator();
  }
}

export class GeminiInterviewService {
  private getClient(customKey?: string): GoogleGenerativeAI | null {
    const key = customKey || process.env.GEMINI_API_KEY;
    if (!key || key.trim() === '' || key.includes('YOUR_GEMINI_API_KEY')) {
      return null;
    }
    return new GoogleGenerativeAI(key.trim());
  }

  public hasApiKey(customKey?: string): boolean {
    const key = customKey || process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim() !== '' && !key.includes('YOUR_GEMINI_API_KEY'));
  }

  public async generateQuestion(params: {
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
    customApiKey?: string;
  }): Promise<{ question: Question; source: 'gemini' | 'fallback' }> {
    const client = this.getClient(params.customApiKey);

    if (!client) {
      console.log('No Gemini API key available. Using intelligent adaptive fallback engine.');
      const fallback = getFallbackQuestion({
        skills: params.skills,
        currentDifficulty: params.currentDifficulty,
        questionNumber: params.questionNumber,
        askedQuestions: params.previousQuestions.map(q => q.questionText),
        weakSkills: params.weakSkills,
        interviewType: params.interviewType,
      });
      return { question: fallback, source: 'fallback' };
    }

    try {
      // Use gemini-1.5-flash or gemini-2.0-flash
      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const prompt = buildQuestionPrompt(params);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = parseGeminiJson<Question>(text, () =>
        getFallbackQuestion({
          skills: params.skills,
          currentDifficulty: params.currentDifficulty,
          questionNumber: params.questionNumber,
          askedQuestions: params.previousQuestions.map(q => q.questionText),
          weakSkills: params.weakSkills,
          interviewType: params.interviewType,
        })
      );

      // Ensure valid structure
      const finalQuestion: Question = {
        id: parsed.id || `q-${params.questionNumber}-${Date.now()}`,
        questionNumber: params.questionNumber,
        text: parsed.text || 'Could you explain your approach to writing modular, maintainable code?',
        skill: parsed.skill || params.skills[0] || 'Problem Solving',
        difficulty: params.currentDifficulty,
        intent: parsed.intent || 'Assess technical problem solving and code structure.',
      };

      return { question: finalQuestion, source: 'gemini' };
    } catch (err: any) {
      console.warn('Gemini API call failed for question generation, falling back gracefully:', err?.message || err);
      const fallback = getFallbackQuestion({
        skills: params.skills,
        currentDifficulty: params.currentDifficulty,
        questionNumber: params.questionNumber,
        askedQuestions: params.previousQuestions.map(q => q.questionText),
        weakSkills: params.weakSkills,
        interviewType: params.interviewType,
      });
      return { question: fallback, source: 'fallback' };
    }
  }

  public async evaluateAnswer(params: {
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
    customApiKey?: string;
  }): Promise<{ evaluation: AnswerEvaluation; source: 'gemini' | 'fallback' }> {
    const client = this.getClient(params.customApiKey);

    if (!client) {
      console.log('No Gemini API key available. Using intelligent fallback evaluator.');
      const fallback = evaluateFallbackAnswer({
        question: params.question,
        candidateAnswer: params.candidateAnswer,
      });
      return { evaluation: fallback, source: 'fallback' };
    }

    try {
      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3, // Lower temperature for consistent, objective scoring
        },
      });

      const prompt = buildEvaluationPrompt(params);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = parseGeminiJson<AnswerEvaluation>(text, () =>
        evaluateFallbackAnswer({
          question: params.question,
          candidateAnswer: params.candidateAnswer,
        })
      );

      // Sanitize score ranges 0 - 10
      const score = Math.max(0, Math.min(10, Number(parsed.score) || 6));
      let rec: 'increase' | 'maintain' | 'reduce' = parsed.difficultyRecommendation;
      if (!['increase', 'maintain', 'reduce'].includes(rec)) {
        if (score >= 8) rec = 'increase';
        else if (score < 5) rec = 'reduce';
        else rec = 'maintain';
      }

      const evaluation: AnswerEvaluation = {
        score,
        correctness: Math.max(0, Math.min(10, Number(parsed.correctness) || score)),
        technicalDepth: Math.max(0, Math.min(10, Number(parsed.technicalDepth) || score)),
        communication: Math.max(0, Math.min(10, Number(parsed.communication) || score)),
        relevance: Math.max(0, Math.min(10, Number(parsed.relevance) || score)),
        feedback: parsed.feedback || 'Good explanation of the topic.',
        skill: parsed.skill || params.question.skill,
        difficultyRecommendation: rec,
        nextAction: parsed.nextAction || 'Proceed to next question',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear answer structure'],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Could expand on edge cases'],
        keyMissedPoints: Array.isArray(parsed.keyMissedPoints) ? parsed.keyMissedPoints : [],
        modelAnswerSnippet: parsed.modelAnswerSnippet || '',
      };

      return { evaluation, source: 'gemini' };
    } catch (err: any) {
      console.warn('Gemini API call failed for evaluation, falling back gracefully:', err?.message || err);
      const fallback = evaluateFallbackAnswer({
        question: params.question,
        candidateAnswer: params.candidateAnswer,
      });
      return { evaluation: fallback, source: 'fallback' };
    }
  }

  public async generateReport(params: {
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
    customApiKey?: string;
  }): Promise<{ report: FinalAssessmentReport; source: 'gemini' | 'fallback' }> {
    const client = this.getClient(params.customApiKey);

    if (!client) {
      const fallback = generateFallbackReport({
        candidateName: params.candidateName,
        targetRole: params.targetRole,
        skills: params.skills,
        history: params.history,
        skillScores: params.skillScores,
      });
      return { report: fallback, source: 'fallback' };
    }

    try {
      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const prompt = buildFinalReportPrompt(params);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = parseGeminiJson<FinalAssessmentReport>(text, () =>
        generateFallbackReport({
          candidateName: params.candidateName,
          targetRole: params.targetRole,
          skills: params.skills,
          history: params.history,
          skillScores: params.skillScores,
        })
      );

      // Validate recommendation
      const validRecs = ['Strong Hire', 'Hire', 'Borderline', 'Needs Improvement'];
      const finalRecommendation = validRecs.includes(parsed.finalRecommendation)
        ? parsed.finalRecommendation
        : parsed.overallScore >= 80 ? 'Hire' : 'Borderline';

      const finalReport: FinalAssessmentReport = {
        candidateName: parsed.candidateName || params.candidateName,
        targetRole: parsed.targetRole || params.targetRole,
        date: parsed.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        overallScore: Math.min(100, Math.max(0, Math.round(Number(parsed.overallScore) || 75))),
        technicalKnowledgeScore: Math.min(100, Math.max(0, Math.round(Number(parsed.technicalKnowledgeScore) || 75))),
        communicationScore: Math.min(100, Math.max(0, Math.round(Number(parsed.communicationScore) || 75))),
        problemSolvingScore: Math.min(100, Math.max(0, Math.round(Number(parsed.problemSolvingScore) || 75))),
        skillScores: parsed.skillScores || {},
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Solid foundational skills'],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Needs deeper practice with edge cases'],
        questionEvaluations: Array.isArray(parsed.questionEvaluations) && parsed.questionEvaluations.length > 0
          ? parsed.questionEvaluations
          : params.history.map(h => ({
              questionNumber: h.questionNumber,
              questionText: h.questionText,
              skill: h.skill,
              difficulty: h.difficulty,
              candidateAnswer: h.candidateAnswer,
              score: h.score,
              feedback: h.feedback,
            })),
        recommendedTopics: Array.isArray(parsed.recommendedTopics) ? parsed.recommendedTopics : ['Core Computer Science Concepts'],
        personalizedImprovementPlan: Array.isArray(parsed.personalizedImprovementPlan) ? parsed.personalizedImprovementPlan : [],
        finalRecommendation: finalRecommendation as any,
        executiveSummary: parsed.executiveSummary || `${params.candidateName} completed the interview session with commendable effort.`,
      };

      return { report: finalReport, source: 'gemini' };
    } catch (err: any) {
      console.warn('Gemini API call failed for final report, falling back gracefully:', err?.message || err);
      const fallback = generateFallbackReport({
        candidateName: params.candidateName,
        targetRole: params.targetRole,
        skills: params.skills,
        history: params.history,
        skillScores: params.skillScores,
      });
      return { report: fallback, source: 'fallback' };
    }
  }
}

export const geminiService = new GeminiInterviewService();
