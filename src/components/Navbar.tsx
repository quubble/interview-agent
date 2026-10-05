import React from 'react';
import { Sparkles, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { InterviewStage } from '../types/interview';

interface NavbarProps {
  stage: InterviewStage;
  currentQuestionIndex: number;
  totalQuestions: number;
  onResetInterview: () => void;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stage,
  currentQuestionIndex,
  totalQuestions,
  onResetInterview,
  speechEnabled,
  onToggleSpeech,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => {
          if (stage === 'landing' || stage === 'report') {
            onResetInterview();
          }
        }}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-violet-400 p-0.5 shadow-lg shadow-brand-500/25 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-brand-400 animate-pulse-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                INTERVIEWPILOT<span className="text-brand-400"> AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
              Ask. Evaluate. Adapt. Improve.
            </p>
          </div>
        </div>

        {/* Center: Stage Indicator */}
        {stage === 'interviewing' && totalQuestions > 0 && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Session: Question <strong>{currentQuestionIndex}</strong> of <strong>{totalQuestions}</strong></span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* TTS Audio toggle */}
          <button
            onClick={onToggleSpeech}
            title={speechEnabled ? 'Mute AI voice' : 'Enable AI voice narration'}
            className={`p-2 rounded-lg border transition-colors ${
              speechEnabled
                ? 'border-brand-500/40 text-brand-400 bg-brand-500/10 hover:bg-brand-500/20'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Reset / New Interview */}
          {stage !== 'landing' && (
            <button
              onClick={onResetInterview}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
              title="Reset and start new interview"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
