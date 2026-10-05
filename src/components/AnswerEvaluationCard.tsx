import React from 'react';
import {
  AnswerEvaluation,
  DifficultyLevel,
} from '../types/interview';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface AnswerEvaluationCardProps {
  evaluation: AnswerEvaluation;
  questionNumber: number;
  totalQuestions: number;
  currentDifficulty: DifficultyLevel;
  onContinue: () => void;
  isLastQuestion: boolean;
  isLoading?: boolean;
}

export const AnswerEvaluationCard: React.FC<AnswerEvaluationCardProps> = ({
  evaluation,
  questionNumber,
  totalQuestions,
  currentDifficulty,
  onContinue,
  isLastQuestion,
  isLoading = false,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 5) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  const getAdaptiveBanner = () => {
    if (evaluation.difficultyRecommendation === 'increase') {
      return (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2.5">
          <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <strong>Adaptive Shift (Score ≥ 8): Difficulty Increased.</strong>
            <span className="block text-emerald-400/80 text-[11px] mt-0.5">
              Outstanding technical grasp! The agent is escalating question complexity for subsequent turns.
            </span>
          </div>
        </div>
      );
    }
    if (evaluation.difficultyRecommendation === 'reduce') {
      return (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2.5">
          <TrendingDown className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <strong>Adaptive Calibration (Score &lt; 5): Testing Fundamentals.</strong>
            <span className="block text-amber-400/80 text-[11px] mt-0.5">
              Identified knowledge gap. The agent will reinforce core primitives and fundamentals to assess baseline skills.
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center space-x-2.5">
        <Minus className="h-4 w-4 text-indigo-400 shrink-0" />
        <div>
          <strong>Adaptive Stability (Score 5-7): Difficulty Maintained.</strong>
          <span className="block text-indigo-400/80 text-[11px] mt-0.5">
            Satisfactory baseline demonstrated. Maintaining current level to evaluate consistency.
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-2xl animate-slide-up max-w-4xl mx-auto mb-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span>AI Evaluation Engine • Q{questionNumber} Audit</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
            Answer Assessment & Performance Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated skill: <span className="text-slate-200 font-semibold">{evaluation.skill}</span>
          </p>
        </div>

        {/* Big Overall Score Badge */}
        <div className={`px-5 py-3 rounded-2xl border flex items-center space-x-3 self-start sm:self-center ${getScoreColor(evaluation.score)}`}>
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider opacity-80">
              Answer Score
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold font-mono">{evaluation.score}</span>
              <span className="text-xs font-medium opacity-60">/ 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive Decision Alert */}
      <div className="mb-6">
        {getAdaptiveBanner()}
      </div>

      {/* 4 Rubric Metric Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Correctness', val: evaluation.correctness, desc: 'Conceptual accuracy' },
          { label: 'Tech Depth', val: evaluation.technicalDepth, desc: 'Internals & trade-offs' },
          { label: 'Communication', val: evaluation.communication, desc: 'Clarity & terminology' },
          { label: 'Relevance', val: evaluation.relevance, desc: 'Directness of answer' }
        ].map((rubric) => (
          <div key={rubric.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">{rubric.label}</span>
            <div className="flex items-baseline space-x-1 my-1">
              <span className="text-xl font-bold font-mono text-white">{rubric.val}</span>
              <span className="text-[10px] text-slate-500">/ 10</span>
            </div>
            <span className="text-[10px] text-slate-500 block truncate">{rubric.desc}</span>
          </div>
        ))}
      </div>

      {/* Evaluator Feedback */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-brand-400" />
          <span>Interviewer Feedback</span>
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed">
          {evaluation.feedback}
        </p>
      </div>

      {/* Strengths & Weaknesses / Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Strengths */}
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <h5 className="text-xs font-semibold text-emerald-400 mb-2.5 flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Demonstrated Strengths</span>
            </h5>
            <ul className="space-y-1.5">
              {evaluation.strengths.map((s, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses / Gaps */}
        {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <h5 className="text-xs font-semibold text-rose-400 mb-2.5 flex items-center space-x-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Areas for Improvement</span>
            </h5>
            <ul className="space-y-1.5">
              {evaluation.weaknesses.map((w, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Key Missed Points */}
      {evaluation.keyMissedPoints && evaluation.keyMissedPoints.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <h5 className="text-xs font-semibold text-amber-400 mb-2 flex items-center space-x-1.5">
            <Lightbulb className="h-4 w-4" />
            <span>Key Missed Concepts / Senior Nuances</span>
          </h5>
          <div className="flex flex-wrap gap-2">
            {evaluation.keyMissedPoints.map((point, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Model Answer Tip */}
      {evaluation.modelAnswerSnippet && (
        <div className="mb-6 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
          <strong className="block text-indigo-300 mb-1">Model Answer Highlight:</strong>
          {evaluation.modelAnswerSnippet}
        </div>
      )}

      {/* Continue Action Button */}
      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={onContinue}
          disabled={isLoading}
          className={`px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center space-x-2 group ${
            isLoading
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:via-indigo-500 hover:to-violet-500 text-white shadow-brand-500/25'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
              <span>{isLastQuestion ? 'Synthesizing Final Dossier...' : 'Calibrating Next Question...'}</span>
            </>
          ) : (
            <>
              <span>
                {isLastQuestion
                  ? 'Complete Interview & View Final Report'
                  : `Proceed to Question ${questionNumber + 1}`}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
