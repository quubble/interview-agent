import React from 'react';
import { DifficultyLevel } from '../types/interview';
import { Zap, Activity } from 'lucide-react';

interface ProgressBarProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  currentDifficulty: DifficultyLevel;
  currentSkill?: string;
  adaptiveMessage?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentQuestionIndex,
  totalQuestions,
  currentDifficulty,
  currentSkill,
  adaptiveMessage,
}) => {
  const progressPercent = Math.min(100, Math.round(((currentQuestionIndex - 1) / totalQuestions) * 100));

  const getDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'beginner':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Beginner (Fundamentals)</span>
          </span>
        );
      case 'intermediate':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
            <span>Intermediate (Depth & Trade-offs)</span>
          </span>
        );
      case 'advanced':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Advanced (Architecture & Scale)</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full glass-card rounded-2xl p-4 sm:p-5 mb-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        {/* Left: Progress info */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            <Activity className="h-3.5 w-3.5 text-brand-400" />
            <span>Interview Trajectory</span>
          </div>
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
              Question {currentQuestionIndex} of {totalQuestions}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({progressPercent}% Completed)
            </span>
          </div>
        </div>

        {/* Right: Difficulty & Skill */}
        <div className="flex items-center space-x-2">
          {currentSkill && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300">
              {currentSkill}
            </span>
          )}
          {getDifficultyBadge(currentDifficulty)}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, progressPercent)}%` }}
        />
      </div>

      {/* Adaptive Agent Status Banner */}
      {adaptiveMessage && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
          <Zap className="h-3.5 w-3.5 text-brand-400 shrink-0" />
          <span className="truncate">{adaptiveMessage}</span>
        </div>
      )}
    </div>
  );
};
