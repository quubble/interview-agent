import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Brain,
  Cpu,
  Target,
  BarChart3,
  Award,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const SUPPORTED_SKILLS = [
  'Python', 'Java', 'C', 'C++', 'JavaScript', 'SQL', 'DBMS',
  'Data Structures', 'Algorithms', 'Machine Learning', 'Computer Networks',
  'Operating Systems', 'OOP', 'Problem Solving'
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
}) => {
  return (
    <div className="relative overflow-hidden py-12 md:py-20">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-brand-500/30 text-brand-300 text-xs sm:text-sm font-medium mb-8 shadow-sm">
            <Sparkles className="h-4 w-4 text-brand-400 animate-pulse" />
            <span>AI-Powered Adaptive Technical Interview Agent</span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-brand-400"></span>
            <span className="hidden sm:inline-block text-slate-400">Tailored for MCA Students & Freshers</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 font-['Plus_Jakarta_Sans']">
            INTERVIEWPILOT <span className="text-gradient-primary">AI</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl font-semibold text-slate-200 mb-6 tracking-wide">
            "Your AI Interviewer — <span className="text-indigo-400">Ask.</span> <span className="text-brand-400">Evaluate.</span> <span className="text-violet-400">Adapt.</span> <span className="text-emerald-400">Improve.</span>"
          </p>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience real-time technical interviews powered by Google Gemini. Our agentic interviewer evaluates your technical depth, adapts question difficulty dynamically, targets weak spots, and generates actionable hiring scorecards.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-base sm:text-lg shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 group"
            >
              <span>Start Interview</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl glass-card mb-16 text-left">
            <div className="p-3">
              <div className="flex items-center space-x-2 text-indigo-400 mb-1">
                <Brain className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Adaptive Agent</span>
              </div>
              <p className="text-sm font-medium text-slate-200">Difficulty shifts dynamically based on score</p>
            </div>
            <div className="p-3">
              <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">4-Pillar Rubric</span>
              </div>
              <p className="text-sm font-medium text-slate-200">Depth, Correctness, Communication & Relevance</p>
            </div>
            <div className="p-3">
              <div className="flex items-center space-x-2 text-brand-400 mb-1">
                <Layers className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Persistent Memory</span>
              </div>
              <p className="text-sm font-medium text-slate-200">Zero repeats, isolates and reinforces weak skills</p>
            </div>
            <div className="p-3">
              <div className="flex items-center space-x-2 text-purple-400 mb-1">
                <Award className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Hiring Scorecard</span>
              </div>
              <p className="text-sm font-medium text-slate-200">100-pt assessment & personalized roadmap</p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card rounded-2xl p-6 glass-card-hover">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Agentic Decision Logic</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unlike static chatbots, InterviewPilot AI tracks your response quality. Scoring <strong className="text-emerald-400">≥8</strong> escalates complexity, while scores <strong className="text-amber-400">&lt;5</strong> shift focus back to foundational computer science principles.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 glass-card-hover">
            <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Designed for MCA & Freshers</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Curated to crack software developer, full-stack, and graduate trainee placement interviews. Tests Data Structures, Algorithms, DBMS, Operating Systems, Networks, and language internals.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 glass-card-hover">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Actionable Final Report</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Receive a hiring recommendation (Strong Hire, Hire, Borderline, Needs Improvement) accompanied by question-level audits, key missed points, and an explicit study roadmap.
            </p>
          </div>
        </div>

        {/* Skills Covered Pill Cloud */}
        <div className="glass-card rounded-2xl p-8 text-center">
          <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-4">
            Comprehensive Skills & Topic Coverage
          </h4>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {SUPPORTED_SKILLS.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:border-brand-500/50 hover:text-white transition-all"
              >
                {skill}
              </span>
            ))}
            <span className="px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-xs font-medium text-brand-300">
              + Custom Domain Skills
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
