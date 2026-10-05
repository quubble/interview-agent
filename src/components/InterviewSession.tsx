import React, { useState, useEffect, useRef } from 'react';
import {
  Question,
  DifficultyLevel,
  CandidateSetup,
} from '../types/interview';
import { ProgressBar } from './ProgressBar';
import {
  Send,
  Volume2,
  Mic,
  MicOff,
  Clock,
  Terminal,
  Loader2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { speechService } from '../services/speech';

interface InterviewSessionProps {
  candidate: CandidateSetup;
  currentQuestion: Question;
  questionNumber: number;
  totalQuestions: number;
  currentDifficulty: DifficultyLevel;
  onSubmitAnswer: (answer: string) => Promise<void>;
  isLoading: boolean;
  adaptiveMessage?: string;
  speechEnabled: boolean;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({
  candidate,
  currentQuestion,
  questionNumber,
  totalQuestions,
  currentDifficulty,
  onSubmitAnswer,
  isLoading,
  adaptiveMessage,
  speechEnabled,
}) => {
  const [answer, setAnswer] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Question timer
  useEffect(() => {
    setSecondsElapsed(0);
    timerRef.current = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion.id]);

  // Read question automatically if speech is enabled
  useEffect(() => {
    if (speechEnabled && currentQuestion?.text) {
      setIsSpeaking(true);
      speechService.speak(currentQuestion.text, () => {
        setIsSpeaking(false);
      });
    }

    return () => {
      speechService.stopSpeaking();
      setIsSpeaking(false);
    };
  }, [currentQuestion.id, speechEnabled]);

  // Clean answer on new question
  useEffect(() => {
    setAnswer('');
    setValidationError(null);
  }, [currentQuestion.id]);

  // Handle manual question read-out
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speechService.speak(currentQuestion.text, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Handle speech-to-text voice dictation
  const handleToggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!speechService.isSttSupported()) {
      setValidationError('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    const recognition = speechService.createRecognition(
      (transcript) => {
        setAnswer(prev => (prev ? prev + ' ' + transcript : transcript));
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
        setValidationError(null);
      } catch (e) {
        console.warn('Failed to start speech recognition:', e);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setValidationError('Please provide an answer before submitting. Even a partial or foundational explanation helps the interviewer evaluate your thinking.');
      return;
    }
    if (answer.trim().length < 10) {
      setValidationError('Your answer is quite short (less than 10 characters). Please provide a more detailed response to demonstrate your technical depth.');
      return;
    }

    setValidationError(null);
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    onSubmitAnswer(answer.trim());
  };

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 animate-fade-in">
      {/* Trajectory Progress Bar */}
      <ProgressBar
        currentQuestionIndex={questionNumber}
        totalQuestions={totalQuestions}
        currentDifficulty={currentDifficulty}
        currentSkill={currentQuestion.skill}
        adaptiveMessage={adaptiveMessage}
      />

      {/* Main Question Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl mb-6 relative overflow-hidden">
        {/* Subtle background highlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Question Header meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-brand-600/20 text-brand-300 border border-brand-500/30">
              Q{questionNumber}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Domain: <strong className="text-slate-200">{currentQuestion.skill}</strong>
            </span>
            {currentQuestion.intent && (
              <span className="hidden sm:inline-flex items-center text-[11px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Focus: {currentQuestion.intent}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>{timeFormatted}</span>
            </div>

            {/* Read aloud TTS button */}
            <button
              type="button"
              onClick={handleToggleSpeak}
              className={`p-1.5 rounded-lg border transition-colors flex items-center space-x-1 ${
                isSpeaking
                  ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={isSpeaking ? 'Stop voice reading' : 'Read question aloud'}
            >
              <Volume2 className={`h-3.5 w-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
              <span className="text-[11px] hidden sm:inline">
                {isSpeaking ? 'Speaking...' : 'Listen'}
              </span>
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-relaxed font-['Plus_Jakarta_Sans']">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Code Snippet if question has one */}
        {currentQuestion.codeSnippet && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs sm:text-sm text-brand-300 overflow-x-auto">
            <pre>{currentQuestion.codeSnippet}</pre>
          </div>
        )}

        {/* Interview Guidance Hint */}
        <div className="flex items-start space-x-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
          <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Interviewer Tip:</strong> Structure your answer clearly. Explain the theoretical fundamentals, time and space complexity if applicable, trade-offs, and real-world edge cases.
          </span>
        </div>
      </div>

      {/* Answer Input Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Terminal className="h-4 w-4 text-brand-400" />
            <span>Candidate Response</span>
          </label>

          {/* Voice Dictation Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center space-x-1.5 ${
              isListening
                ? 'border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title={isListening ? 'Stop recording voice' : 'Dictate response via microphone'}
          >
            {isListening ? (
              <>
                <MicOff className="h-3.5 w-3.5 text-rose-400" />
                <span>Recording Voice... (Click to stop)</span>
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5 text-brand-400" />
                <span>Voice Input</span>
              </>
            )}
          </button>
        </div>

        {/* Text Area */}
        <div className="relative mb-3">
          <textarea
            rows={8}
            value={answer}
            disabled={isLoading}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Type your detailed answer here... Feel free to write code examples, explain time/space complexities, or discuss system trade-offs."
            className="w-full p-4 bg-slate-900/90 border border-slate-700 rounded-xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-sans leading-relaxed resize-y min-h-[180px] disabled:opacity-50"
          />
        </div>

        {/* Word count & Helper bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mb-5">
          <div className="flex items-center space-x-3">
            <span>
              Words: <strong className="text-slate-300 font-mono">{wordCount}</strong>
            </span>
            <span>
              Characters: <strong className="text-slate-300 font-mono">{answer.length}</strong>
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            Target role: <span className="text-slate-300 font-medium">{candidate.targetRole}</span>
          </div>
        </div>

        {/* Error notice */}
        {validationError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit Button & States */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Once submitted, your answer is evaluated by Gemini AI against technical accuracy and depth.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-xl transition-all flex items-center justify-center space-x-2 ${
              isLoading
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:via-indigo-500 hover:to-violet-500 shadow-brand-500/25 hover:shadow-brand-500/40 transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                <span>Evaluating Answer with AI...</span>
              </>
            ) : (
              <>
                <span>Submit Answer</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
