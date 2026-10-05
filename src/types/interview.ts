export type ExperienceLevel = 'Fresher / MCA Student' | '0-1 Year' | '1-3 Years' | '3+ Years';

export type InterviewType = 'Technical' | 'HR' | 'Mixed';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type RecommendationType = 'Strong Hire' | 'Hire' | 'Borderline' | 'Needs Improvement';

export interface CandidateSetup {
  name: string;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  skills: string[];
  interviewType: InterviewType;
  numberOfQuestions: number;
}

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
  score: number; // 0 - 10
  correctness: number; // 0 - 10
  technicalDepth: number; // 0 - 10
  communication: number; // 0 - 10
  relevance: number; // 0 - 10
  feedback: string;
  skill: string;
  difficultyRecommendation: 'increase' | 'maintain' | 'reduce';
  nextAction: string;
  strengths?: string[];
  weaknesses?: string[];
  keyMissedPoints?: string[];
  modelAnswerSnippet?: string;
}

export interface InterviewTurn {
  question: Question;
  candidateAnswer: string;
  evaluation: AnswerEvaluation;
  timestamp: string;
  durationSeconds?: number;
}

export interface SkillPerformance {
  skill: string;
  attempts: number;
  scores: number[];
  averageScore: number;
  status: 'strength' | 'satisfactory' | 'weakness';
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
  overallScore: number; // 0 - 100
  technicalKnowledgeScore: number; // 0 - 100
  communicationScore: number; // 0 - 100
  problemSolvingScore: number; // 0 - 100
  skillScores: Record<string, number>; // 0 - 100
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

export type InterviewStage = 'landing' | 'setup' | 'interviewing' | 'feedback_review' | 'report';

export interface InterviewState {
  stage: InterviewStage;
  candidate: CandidateSetup | null;
  currentQuestion: Question | null;
  history: InterviewTurn[];
  skillPerformance: Record<string, SkillPerformance>;
  currentDifficulty: DifficultyLevel;
  weakSkills: string[];
  strongSkills: string[];
  finalReport: FinalAssessmentReport | null;
  isLoading: boolean;
  error: string | null;
}
