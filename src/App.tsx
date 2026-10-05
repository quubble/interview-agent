import React, { useState, useEffect, useCallback } from 'react';
import {
  InterviewState,
  CandidateSetup,
  InterviewTurn,
  DifficultyLevel,
  SkillPerformance,
} from './types/interview';
import { storageService } from './services/storage';
import { apiService } from './services/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SetupModal } from './components/SetupModal';
import { InterviewSession } from './components/InterviewSession';
import { AnswerEvaluationCard } from './components/AnswerEvaluationCard';
import { FinalReport } from './components/FinalReport';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ToastContainer, ToastMessage } from './components/Toast';

const INITIAL_STATE: InterviewState = {
  stage: 'landing',
  candidate: null,
  currentQuestion: null,
  history: [],
  skillPerformance: {},
  currentDifficulty: 'beginner',
  weakSkills: [],
  strongSkills: [],
  finalReport: null,
  isLoading: false,
  error: null,
};

export const App: React.FC = () => {
  const [state, setState] = useState<InterviewState>(() => {
    const saved = storageService.loadState();
    return saved || INITIAL_STATE;
  });

  const [hasApiKey, setHasApiKey] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(() => storageService.getVoiceSettings().speechEnabled);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [adaptiveMessage, setAdaptiveMessage] = useState<string>('Interview calibrated to candidate role and skills.');

  // Check backend health & key status
  const checkKeyStatus = useCallback(async () => {
    try {
      const res = await apiService.checkHealth();
      setHasApiKey(res.hasGeminiKey || Boolean(storageService.getApiKey()));
    } catch {
      setHasApiKey(Boolean(storageService.getApiKey()));
    }
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  // Persist state to localStorage
  useEffect(() => {
    storageService.saveState(state);
  }, [state]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    storageService.saveVoiceSettings({ speechEnabled: next, recognitionEnabled: true });
    addToast('info', next ? 'AI voice narration enabled' : 'AI voice muted');
  };

  const handleResetInterview = (skipConfirm = false) => {
    if (!skipConfirm && state.stage !== 'landing' && state.stage !== 'report') {
      const confirmed = window.confirm('Are you sure you want to restart? Your current interview progress will be reset.');
      if (!confirmed) return;
    }
    storageService.clearState();
    setState(INITIAL_STATE);
    setAdaptiveMessage('Interview calibrated to candidate role and skills.');
    addToast('info', 'Interview reset to starting point.');
  };

  // Step 1 -> 2: Start Setup
  const handleStartSetup = () => {
    setState(prev => ({
      ...prev,
      stage: 'setup',
      error: null,
    }));
  };

  // Step 2 -> 3: Candidate Setup submitted -> Generate First Question
  const handleStartInterview = async (candidate: CandidateSetup) => {
    setState(prev => ({
      ...prev,
      candidate,
      stage: 'interviewing',
      isLoading: true,
      error: null,
      history: [],
      skillPerformance: {},
      currentDifficulty: 'beginner',
      weakSkills: [],
      strongSkills: [],
      finalReport: null,
    }));

    try {
      const result = await apiService.generateQuestion({
        candidateName: candidate.name,
        targetRole: candidate.targetRole,
        experienceLevel: candidate.experienceLevel,
        interviewType: candidate.interviewType,
        skills: candidate.skills,
        questionNumber: 1,
        totalQuestions: candidate.numberOfQuestions,
        currentDifficulty: 'beginner',
        previousQuestions: [],
        weakSkills: [],
      });

      setState(prev => ({
        ...prev,
        currentQuestion: result.question,
        isLoading: false,
      }));

      setAdaptiveMessage(`Question 1 generated (${result.question.skill}). Starting with core foundations.`);
      addToast('success', `Interview initiated! First question ready.`);
    } catch (err: any) {
      console.error('Failed to generate initial question:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to generate question. Please check connection.',
      }));
      addToast('error', 'Could not connect to AI engine. Please verify server is running.');
    }
  };

  // Step 3: Candidate submits an answer -> Evaluate & Adapt
  const handleSubmitAnswer = async (candidateAnswer: string) => {
    if (!state.currentQuestion || !state.candidate) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const evalResult = await apiService.evaluateAnswer({
        candidateName: state.candidate.name,
        targetRole: state.candidate.targetRole,
        experienceLevel: state.candidate.experienceLevel,
        question: state.currentQuestion,
        candidateAnswer,
        previousWeakSkills: state.weakSkills,
      });

      const evaluation = evalResult.evaluation;
      const currentSkill = state.currentQuestion.skill;

      // Update skill performance
      const updatedSkillPerf: Record<string, SkillPerformance> = { ...state.skillPerformance };
      const currentPerf = updatedSkillPerf[currentSkill] || {
        skill: currentSkill,
        attempts: 0,
        scores: [],
        averageScore: 0,
        status: 'satisfactory',
      };

      const newScores = [...currentPerf.scores, evaluation.score];
      const newAverage = Number((newScores.reduce((a, b) => a + b, 0) / newScores.length).toFixed(1));
      let status: 'strength' | 'satisfactory' | 'weakness' = 'satisfactory';
      if (newAverage >= 8) status = 'strength';
      else if (newAverage < 5.5) status = 'weakness';

      updatedSkillPerf[currentSkill] = {
        skill: currentSkill,
        attempts: currentPerf.attempts + 1,
        scores: newScores,
        averageScore: newAverage,
        status,
      };

      // Update weak and strong skills arrays
      const weakSkills = Object.values(updatedSkillPerf)
        .filter(s => s.status === 'weakness')
        .map(s => s.skill);

      const strongSkills = Object.values(updatedSkillPerf)
        .filter(s => s.status === 'strength')
        .map(s => s.skill);

      // Determine next difficulty based on decision logic:
      // Score >= 8: increase difficulty
      // Score 5-7: maintain difficulty
      // Score < 5: reduce difficulty & test fundamentals
      let nextDifficulty: DifficultyLevel = state.currentDifficulty;
      let adaptationNote = '';

      if (evaluation.difficultyRecommendation === 'increase' || evaluation.score >= 8) {
        if (state.currentDifficulty === 'beginner') nextDifficulty = 'intermediate';
        else if (state.currentDifficulty === 'intermediate') nextDifficulty = 'advanced';
        adaptationNote = `Score ${evaluation.score}/10: Difficulty elevated to ${nextDifficulty}.`;
      } else if (evaluation.difficultyRecommendation === 'reduce' || evaluation.score < 5) {
        if (state.currentDifficulty === 'advanced') nextDifficulty = 'intermediate';
        else if (state.currentDifficulty === 'intermediate') nextDifficulty = 'beginner';
        adaptationNote = `Score ${evaluation.score}/10: Difficulty reduced to ${nextDifficulty} to test core fundamentals.`;
      } else {
        adaptationNote = `Score ${evaluation.score}/10: Difficulty maintained at ${state.currentDifficulty}.`;
      }

      if (weakSkills.includes(currentSkill)) {
        adaptationNote += ` Domain "${currentSkill}" flagged as focus area.`;
      }

      const turn: InterviewTurn = {
        question: state.currentQuestion,
        candidateAnswer,
        evaluation,
        timestamp: new Date().toISOString(),
      };

      const newHistory = [...state.history, turn];

      setAdaptiveMessage(adaptationNote);

      // Transition to feedback review stage so candidate sees their real-time evaluation
      setState(prev => ({
        ...prev,
        isLoading: false,
        history: newHistory,
        skillPerformance: updatedSkillPerf,
        currentDifficulty: nextDifficulty,
        weakSkills,
        strongSkills,
        stage: 'feedback_review',
      }));

    } catch (err: any) {
      console.error('Answer evaluation failed:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to evaluate answer. Please try again.',
      }));
      addToast('error', 'Answer evaluation failed. Please check backend connection and retry.');
    }
  };

  // Continue from feedback review to next question or final report
  const handleContinueAfterReview = async () => {
    if (!state.candidate) return;

    const answeredCount = state.history.length;
    const isCompleted = answeredCount >= state.candidate.numberOfQuestions;

    if (isCompleted) {
      // Generate Final Report
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      addToast('info', 'Interview complete! Generating comprehensive evaluation dossier...');

      try {
        const reportResult = await apiService.generateReport({
          candidateName: state.candidate.name,
          targetRole: state.candidate.targetRole,
          experienceLevel: state.candidate.experienceLevel,
          interviewType: state.candidate.interviewType,
          skills: state.candidate.skills,
          history: state.history.map(h => ({
            questionNumber: h.question.questionNumber,
            questionText: h.question.text,
            skill: h.question.skill,
            difficulty: h.question.difficulty,
            candidateAnswer: h.candidateAnswer,
            score: h.evaluation.score,
            feedback: h.evaluation.feedback,
            strengths: h.evaluation.strengths,
            weaknesses: h.evaluation.weaknesses,
          })),
          skillScores: Object.fromEntries(
            Object.entries(state.skillPerformance).map(([k, v]) => [
              k,
              { averageScore: v.averageScore, attempts: v.attempts },
            ])
          ),
        });

        setState(prev => ({
          ...prev,
          finalReport: reportResult.report,
          stage: 'report',
          isLoading: false,
        }));

        addToast('success', 'Final assessment dossier generated!');
      } catch (err: any) {
        console.error('Failed to generate final report:', err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err?.message || 'Report generation failed.',
        }));
        addToast('error', 'Could not generate report. Please retry.');
      }
    } else {
      // Generate Next Question
      const nextQuestionNumber = answeredCount + 1;
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if we should prioritize a weak skill
      const focusSkill = state.weakSkills.length > 0
        ? state.weakSkills[nextQuestionNumber % state.weakSkills.length]
        : undefined;

      try {
        const result = await apiService.generateQuestion({
          candidateName: state.candidate.name,
          targetRole: state.candidate.targetRole,
          experienceLevel: state.candidate.experienceLevel,
          interviewType: state.candidate.interviewType,
          skills: state.candidate.skills,
          questionNumber: nextQuestionNumber,
          totalQuestions: state.candidate.numberOfQuestions,
          currentDifficulty: state.currentDifficulty,
          previousQuestions: state.history.map(h => ({
            questionText: h.question.text,
            skill: h.question.skill,
            score: h.evaluation.score,
          })),
          weakSkills: state.weakSkills,
          focusSkill,
        });

        setState(prev => ({
          ...prev,
          currentQuestion: result.question,
          stage: 'interviewing',
          isLoading: false,
        }));
      } catch (err: any) {
        console.error('Failed to fetch next question:', err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err?.message || 'Could not load next question.',
        }));
        addToast('error', 'Error generating next question. Please check backend.');
      }
    }
  };

  const handleCopySummary = () => {
    if (!state.finalReport) return;
    const summaryText = `INTERVIEWPILOT AI ASSESSMENT REPORT
Candidate: ${state.finalReport.candidateName}
Role: ${state.finalReport.targetRole}
Date: ${state.finalReport.date}
Overall Score: ${state.finalReport.overallScore}/100
Hiring Recommendation: ${state.finalReport.finalRecommendation}

Core Pillars:
- Technical Knowledge: ${state.finalReport.technicalKnowledgeScore}%
- Communication: ${state.finalReport.communicationScore}%
- Problem Solving: ${state.finalReport.problemSolvingScore}%

Strengths:
${state.finalReport.strengths.map(s => `- ${s}`).join('\n')}

Weaknesses:
${state.finalReport.weaknesses.map(w => `- ${w}`).join('\n')}

Executive Summary:
${state.finalReport.executiveSummary}`;

    navigator.clipboard.writeText(summaryText);
    addToast('success', 'Summary copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation */}
      <Navbar
        stage={state.stage}
        currentQuestionIndex={state.history.length + (state.stage === 'interviewing' ? 1 : 0)}
        totalQuestions={state.candidate?.numberOfQuestions || 0}
        hasApiKey={hasApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onResetInterview={() => handleResetInterview()}
        speechEnabled={speechEnabled}
        onToggleSpeech={handleToggleSpeech}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {state.stage === 'landing' && (
          <LandingPage
            onStart={handleStartSetup}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            hasApiKey={hasApiKey}
          />
        )}

        {state.stage === 'setup' && (
          <SetupModal
            onStartInterview={handleStartInterview}
            onCancel={() => setState(prev => ({ ...prev, stage: 'landing' }))}
          />
        )}

        {state.stage === 'interviewing' && state.currentQuestion && state.candidate && (
          <InterviewSession
            candidate={state.candidate}
            currentQuestion={state.currentQuestion}
            questionNumber={state.history.length + 1}
            totalQuestions={state.candidate.numberOfQuestions}
            currentDifficulty={state.currentDifficulty}
            onSubmitAnswer={handleSubmitAnswer}
            isLoading={state.isLoading}
            adaptiveMessage={adaptiveMessage}
            speechEnabled={speechEnabled}
          />
        )}

        {state.stage === 'feedback_review' && state.history.length > 0 && state.candidate && (
          <AnswerEvaluationCard
            evaluation={state.history[state.history.length - 1].evaluation}
            questionNumber={state.history.length}
            totalQuestions={state.candidate.numberOfQuestions}
            currentDifficulty={state.currentDifficulty}
            onContinue={handleContinueAfterReview}
            isLastQuestion={state.history.length >= state.candidate.numberOfQuestions}
            isLoading={state.isLoading}
          />
        )}

        {state.stage === 'report' && state.finalReport && (
          <FinalReport
            report={state.finalReport}
            onRetake={() => handleResetInterview(true)}
            onCopySummary={handleCopySummary}
          />
        )}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        hasEnvKey={hasApiKey}
        onKeyUpdated={checkKeyStatus}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default App;
