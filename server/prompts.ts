export function buildQuestionPrompt(params: {
  candidateName: string;
  targetRole: string;
  experienceLevel: string;
  interviewType: string;
  skills: string[];
  questionNumber: number;
  totalQuestions: number;
  currentDifficulty: string;
  previousQuestions: { questionText: string; skill: string; score?: number }[];
  weakSkills: string[];
  focusSkill?: string;
}): string {
  const previousList = params.previousQuestions.length > 0
    ? params.previousQuestions.map((q, idx) => `Q${idx + 1} (${q.skill}, Score: ${q.score ?? 'N/A'}): "${q.questionText}"`).join('\n')
    : "None (this is the first question)";

  const weakSkillsText = params.weakSkills.length > 0
    ? params.weakSkills.join(', ')
    : "None identified yet";

  return `
You are an expert Senior Technical Interviewer and Engineering Manager conducting a live job interview for:
- Candidate Name: ${params.candidateName}
- Target Role: ${params.targetRole}
- Experience Level: ${params.experienceLevel}
- Interview Format: ${params.interviewType}
- Target Skills: ${params.skills.join(', ')}

CURRENT INTERVIEW STATUS:
- Current Question: ${params.questionNumber} of ${params.totalQuestions}
- Current Difficulty Target: ${params.currentDifficulty.toUpperCase()}
- Previously Asked Questions (DO NOT REPEAT ANY OF THESE):
${previousList}
- Identified Weak Skills to test or reinforce: ${weakSkillsText}
${params.focusSkill ? `- Prioritized Skill for this turn: ${params.focusSkill}` : ''}

AGENTIC INSTRUCTIONS:
1. Act as a realistic, professional tech interviewer. Ask ONE targeted, clear question.
2. Select a skill from the candidate's skills list (${params.skills.join(', ')}).
   - If weak skills exist (${weakSkillsText}), prioritize testing fundamentals in that weak skill or a related core concept.
   - Otherwise, rotate across untested skills or probe deeper if previous performance was strong.
3. Align the question difficulty strictly with "${params.currentDifficulty}":
   - "beginner": Core fundamentals, definitions with practical code syntax, primary use-cases, basic data structures.
   - "intermediate": Trade-offs, internal mechanisms, time/space complexity, real-world bug fixing, indexing, lifecycle.
   - "advanced": Architecture trade-offs, concurrency/edge cases, scale, memory optimization, deep internals, system design.
4. If interview type is "Technical", focus purely on computer science, coding, and role skills.
   If "HR", focus on behavioral, situational (STAR method), teamwork, conflict resolution.
   If "Mixed", balance technical depth with communication and scenario-based questions.
5. NEVER ask multi-part barrage questions. Ask a concise, high-signal question that a candidate can type out or explain clearly.

Respond ONLY with a valid JSON object matching this schema:
{
  "id": "q-${params.questionNumber}-${Date.now()}",
  "questionNumber": ${params.questionNumber},
  "text": "The exact question text here",
  "skill": "The specific skill being tested (e.g. Data Structures, Python, DBMS, etc.)",
  "difficulty": "${params.currentDifficulty}",
  "intent": "Brief explanation of what engineering competency or fundamental concept you are evaluating"
}
`;
}

export function buildEvaluationPrompt(params: {
  candidateName: string;
  targetRole: string;
  experienceLevel: string;
  question: {
    text: string;
    skill: string;
    difficulty: string;
    intent?: string;
  };
  candidateAnswer: string;
  previousWeakSkills: string[];
}): string {
  return `
You are an expert Technical Interviewer evaluating a candidate's response in real-time.

CANDIDATE CONTEXT:
- Name: ${params.candidateName}
- Target Role: ${params.targetRole}
- Experience: ${params.experienceLevel}

INTERVIEW QUESTION:
- Skill: ${params.question.skill}
- Difficulty: ${params.question.difficulty}
- Question: "${params.question.text}"
- Evaluation Intent: "${params.question.intent || 'Assess technical depth and correctness'}"

CANDIDATE'S SUBMITTED ANSWER:
"""
${params.candidateAnswer.trim() || '[No Answer Provided]'}
"""

EVALUATION RUBRIC:
1. Correctness (0 to 10): Accuracy of technical concepts, algorithms, syntax, or theoretical definitions.
2. Technical Depth (0 to 10): Understanding of underlying mechanisms, complexity, trade-offs, edge cases.
3. Communication (0 to 10): Clarity, structure, professional terminology, and conciseness.
4. Relevance (0 to 10): Did the candidate directly answer what was asked without dodging?
5. Overall Score (0 to 10): Balanced aggregate rating of the answer quality.

ADAPTIVE AGENTIC LOGIC:
- If Overall Score >= 8: difficultyRecommendation should be "increase" (candidate demonstrated mastery).
- If Overall Score is 5, 6, or 7: difficultyRecommendation should be "maintain" (satisfactory understanding).
- If Overall Score < 5: difficultyRecommendation should be "reduce" (struggled; test core fundamentals).

Identify concrete strengths, weaknesses, and key points the candidate omitted.
Provide a concise, encouraging yet rigorous feedback summary (2-3 sentences), plus a brief 1-2 sentence model answer snippet showing what an ideal senior answer would include.
Suggest a tactical "nextAction" for the interviewer (e.g., "Probe transaction isolation anomalies in SQL" or "Reinforce basic linked list pointer manipulation").

Respond ONLY with a valid JSON object matching this schema:
{
  "score": 7.5,
  "correctness": 8.0,
  "technicalDepth": 7.0,
  "communication": 8.0,
  "relevance": 7.0,
  "feedback": "Constructive 2-3 sentence review of their response.",
  "skill": "${params.question.skill}",
  "difficultyRecommendation": "maintain",
  "nextAction": "Brief instruction on what to probe next",
  "strengths": ["Clear definition of...", "Good code example"],
  "weaknesses": ["Missed time complexity of...", "Didn't address edge cases"],
  "keyMissedPoints": ["Concept X", "Trade-off Y"],
  "modelAnswerSnippet": "An ideal answer would mention..."
}
`;
}

export function buildFinalReportPrompt(params: {
  candidateName: string;
  targetRole: string;
  experienceLevel: string;
  interviewType: string;
  skills: string[];
  history: {
    questionNumber: number;
    questionText: string;
    skill: string;
    difficulty: string;
    candidateAnswer: string;
    score: number;
    feedback: string;
    strengths?: string[];
    weaknesses?: string[];
  }[];
  skillScores: Record<string, { averageScore: number; attempts: number }>;
}): string {
  const historyText = params.history.map(h => `
Question ${h.questionNumber} [Skill: ${h.skill}, Difficulty: ${h.difficulty}]:
Q: "${h.questionText}"
Candidate Answer: "${h.candidateAnswer}"
Score: ${h.score}/10
Feedback: ${h.feedback}
Strengths: ${(h.strengths || []).join(', ')}
Weaknesses: ${(h.weaknesses || []).join(', ')}
`).join('\n---\n');

  return `
You are the Lead Hiring Committee Chair and Principal Technical Assessor.
Generate a comprehensive, executive-level technical interview assessment report for:
- Candidate: ${params.candidateName}
- Target Role: ${params.targetRole}
- Experience: ${params.experienceLevel}
- Interview Type: ${params.interviewType}
- Target Skill Set: ${params.skills.join(', ')}

INTERVIEW AUDIT TRAIL:
${historyText}

CALCULATED SKILL PERFORMANCE SUMMARY:
${JSON.stringify(params.skillScores, null, 2)}

REPORT REQUIREMENTS:
1. Overall Score: 0 to 100 scale (weighted aggregate).
2. Pillar Scores (0 to 100):
   - technicalKnowledgeScore: Mastery of theory, frameworks, and architecture.
   - communicationScore: Articulation, structure, terminology.
   - problemSolvingScore: Analytical decomposition, edge-case consideration, trade-off analysis.
3. Skill-wise Scores: Map each tested skill to a 0-100 score.
4. Strengths: 3 to 5 distinct highlights of what the candidate did well.
5. Weaknesses: 2 to 4 concrete gaps identified during the session.
6. Recommended Topics: 4 to 6 specific CS or industry topics to study next.
7. Personalized Improvement Plan: 3 to 4 actionable milestones with Priority ('High' | 'Medium' | 'Low'), Area, Recommendation, and SuggestedAction (specifically tailored for MCA students / freshers / job seekers).
8. Final Recommendation: EXACTLY ONE OF:
   - "Strong Hire" (Overall >= 85 and no critical blindspots)
   - "Hire" (Overall 70-84 with solid baseline)
   - "Borderline" (Overall 55-69, shows potential but needs coaching)
   - "Needs Improvement" (Overall < 55, fundamental gaps)
9. Executive Summary: 3-4 sentence professional summary of candidate's interview readiness and hiring recommendation rationale.

Respond ONLY with a valid JSON object matching this schema:
{
  "candidateName": "${params.candidateName}",
  "targetRole": "${params.targetRole}",
  "date": "${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}",
  "overallScore": 82,
  "technicalKnowledgeScore": 80,
  "communicationScore": 85,
  "problemSolvingScore": 81,
  "skillScores": {
    "Python": 85,
    "Data Structures": 78
  },
  "strengths": ["Demonstrates strong understanding of...", "Articulates trade-offs well"],
  "weaknesses": ["Struggled with internal memory layout of...", "Skipped corner cases"],
  "recommendedTopics": ["B-Tree indexing in DBMS", "Concurrency & GIL in Python", "Dynamic Programming memoization"],
  "personalizedImprovementPlan": [
    {
      "area": "Operating Systems & Concurrency",
      "recommendation": "Review race condition handling and mutex locks.",
      "suggestedAction": "Implement producer-consumer problem using semaphores.",
      "priority": "High"
    }
  ],
  "finalRecommendation": "Hire",
  "executiveSummary": "Candidate displayed strong foundational knowledge with clear communication..."
}
`;
}
