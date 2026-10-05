import React, { useState } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Layers,
  HelpCircle,
  Hash,
  Plus,
  X,
  ArrowRight,
  Code2,
  Users,
  Compass,
  Check
} from 'lucide-react';
import {
  CandidateSetup,
  ExperienceLevel,
  InterviewType,
} from '../types/interview';

interface SetupModalProps {
  onStartInterview: (setup: CandidateSetup) => void;
  onCancel: () => void;
}

const DEFAULT_SKILLS = [
  'Python',
  'Java',
  'C',
  'C++',
  'JavaScript',
  'SQL',
  'DBMS',
  'Data Structures',
  'Algorithms',
  'Machine Learning',
  'Computer Networks',
  'Operating Systems',
  'OOP',
  'Problem Solving'
];

const PRESET_ROLES = [
  'Software Development Engineer (Fresher)',
  'Full Stack Developer',
  'Backend Engineer (Java / Spring)',
  'Backend Engineer (Python / Django)',
  'Frontend Engineer (React / TypeScript)',
  'MCA Campus Placement Candidate'
];

export const SetupModal: React.FC<SetupModalProps> = ({
  onStartInterview,
  onCancel,
}) => {
  const [name, setName] = useState('Piyush Kumar');
  const [targetRole, setTargetRole] = useState('Software Development Engineer (Fresher)');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Fresher / MCA Student');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Python',
    'Data Structures',
    'Algorithms',
    'DBMS',
    'Operating Systems',
    'OOP'
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      if (selectedSkills.length === 1) {
        setError('Please keep at least one skill selected.');
        return;
      }
      setError(null);
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setError(null);
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (
      DEFAULT_SKILLS.some(s => s.toLowerCase() === trimmed.toLowerCase()) ||
      customSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError('Skill is already in the list.');
      return;
    }
    setCustomSkills([...customSkills, trimmed]);
    setSelectedSkills([...selectedSkills, trimmed]);
    setCustomSkillInput('');
    setError(null);
  };

  const handleRemoveCustomSkill = (skill: string) => {
    setCustomSkills(customSkills.filter(s => s !== skill));
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleSelectAllCore = () => {
    setSelectedSkills(Array.from(new Set([...selectedSkills, ...DEFAULT_SKILLS])));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide candidate name.');
      return;
    }
    if (!targetRole.trim()) {
      setError('Please select or specify a target job role.');
      return;
    }
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill to evaluate.');
      return;
    }

    onStartInterview({
      name: name.trim(),
      targetRole: targetRole.trim(),
      experienceLevel,
      skills: selectedSkills,
      interviewType,
      numberOfQuestions,
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 animate-fade-in">
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-brand-400 mb-1">
            <GraduationCap className="h-4 w-4" />
            <span>Interview Calibration Profile</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Plus_Jakarta_Sans']">
            Candidate Setup & Configuration
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure your interview parameters. The AI agent will dynamically tune difficulty and focus areas to your profile.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Candidate Name & Experience Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <User className="h-3.5 w-3.5 text-brand-400" />
                <span>Candidate Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-brand-400" />
                <span>Experience Level</span>
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option value="Fresher / MCA Student">Fresher / MCA Student</option>
                <option value="0-1 Year">0 - 1 Year (Junior Engineer)</option>
                <option value="1-3 Years">1 - 3 Years (Mid-Level Developer)</option>
                <option value="3+ Years">3+ Years (Senior Track)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Target Job Role */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Briefcase className="h-3.5 w-3.5 text-brand-400" />
              <span>Target Job Role</span>
            </label>
            <input
              type="text"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Full Stack Developer, SDE 1"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 mb-2"
            />
            {/* Quick role suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setTargetRole(role)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-all ${
                    targetRole === role
                      ? 'bg-brand-600 text-white font-medium'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Interview Type */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-2">
              <HelpCircle className="h-3.5 w-3.5 text-brand-400" />
              <span>Interview Type</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  type: 'Technical' as InterviewType,
                  title: 'Technical Interview',
                  desc: 'Deep CS fundamentals, DS/Algo, architecture, and coding concepts.',
                  icon: Code2
                },
                {
                  type: 'HR' as InterviewType,
                  title: 'HR / Behavioral',
                  desc: 'STAR scenarios, cultural fit, teamwork, handling challenges.',
                  icon: Users
                },
                {
                  type: 'Mixed' as InterviewType,
                  title: 'Mixed (Tech + HR)',
                  desc: 'Balanced interview evaluating technical chops & communication.',
                  icon: Compass
                }
              ].map(({ type, title, desc, icon: Icon }) => (
                <div
                  key={type}
                  onClick={() => setInterviewType(type)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    interviewType === type
                      ? 'border-brand-500 bg-brand-500/10 text-white shadow-md shadow-brand-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${interviewType === type ? 'text-brand-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-white">{title}</span>
                    </div>
                    {interviewType === type && <Check className="h-3.5 w-3.5 text-brand-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: Skills Selector & Custom Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                <Layers className="h-3.5 w-3.5 text-brand-400" />
                <span>Target Skills to Evaluate ({selectedSkills.length} selected)</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllCore}
                className="text-[11px] text-brand-400 hover:text-brand-300 underline"
              >
                Select all core skills
              </button>
            </div>

            {/* Standard Skill Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30 border border-brand-500'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{skill}</span>
                  </button>
                );
              })}

              {/* Custom Skills Chips */}
              {customSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <div
                    key={skill}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium space-x-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border border-indigo-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}
                  >
                    <span onClick={() => toggleSkill(skill)} className="cursor-pointer">{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomSkill(skill)}
                      className="text-white/60 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder="Add custom skill (e.g. React, Docker, Redis, Kubernetes)..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center space-x-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Row 5: Number of Questions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                <Hash className="h-3.5 w-3.5 text-brand-400" />
                <span>Number of Questions</span>
              </label>
              <span className="text-xs font-bold text-brand-400">
                {numberOfQuestions} Questions ({numberOfQuestions * 3} mins estimated)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 8, 10].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setNumberOfQuestions(num)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    numberOfQuestions === num
                      ? 'border-brand-500 bg-brand-500/15 text-brand-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {num} Questions {num === 5 ? '(Standard)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Back to Overview
            </button>
            <button
              type="submit"
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition-all flex items-center space-x-2"
            >
              <span>Begin Technical Interview</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
