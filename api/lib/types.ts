export type ExperienceLevel = 'Fresher / MCA Student' | '0-1 Year' | '1-3 Years' | '3+ Years';
export type InterviewType = 'Technical' | 'HR' | 'Mixed';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type RecommendationType = 'Strong Hire' | 'Hire' | 'Borderline' | 'Needs Improvement';

export interface Question {
  id: string;
  questionNumber: number;
  text: string;
  skill: string;
  difficulty: DifficultyLevel;
  intent?: string;
  codeSnippet?: string;
}

export interface AnswerEvaluation {
  score: number;
  correctness: number;
  technicalDepth: number;
  communication: number;
  relevance: number;
  feedback: string;
  skill: string;
  difficultyRecommendation: 'increase' | 'maintain' | 'reduce';
  nextAction: string;
  strengths?: string[];
  weaknesses?: string[];
  keyMissedPoints?: string[];
  modelAnswerSnippet?: string;
}

export interface ImprovementStep {
  area: string;
  recommendation: string;
  suggestedAction: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface FinalAssessmentReport {
  candidateName: string;
  targetRole: string;
  date: string;
  overallScore: number;
  technicalKnowledgeScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  skillScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  questionEvaluations: {
    questionNumber: number;
    questionText: string;
    skill: string;
    difficulty: DifficultyLevel;
    candidateAnswer: string;
    score: number;
    feedback: string;
    keyMissedPoints?: string[];
  }[];
  recommendedTopics: string[];
  personalizedImprovementPlan: ImprovementStep[];
  finalRecommendation: RecommendationType;
  executiveSummary: string;
}
