import { geminiService } from './server/gemini';
import { DifficultyLevel, InterviewTurn, AnswerEvaluation } from './src/types/interview';

async function runQATest() {
  console.log('====================================================');
  console.log('  INTERVIEWPILOT AI — QA AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  const candidate = {
    candidateName: 'Piyush Kumar (QA Test)',
    targetRole: 'Python Developer',
    experienceLevel: 'Fresher / MCA Student',
    interviewType: 'Technical',
    skills: ['Python', 'Data Structures', 'Algorithms', 'OOP', 'SQL'],
    numberOfQuestions: 5,
  };

  let currentDifficulty: DifficultyLevel = 'beginner';
  const history: InterviewTurn[] = [];
  const askedQuestions: string[] = [];
  const skillScores: Record<string, { attempts: number; scores: number[]; averageScore: number }> = {};
  let weakSkills: string[] = [];

  function updateSkillScores(skill: string, score: number) {
    if (!skillScores[skill]) {
      skillScores[skill] = { attempts: 0, scores: [], averageScore: 0 };
    }
    skillScores[skill].attempts += 1;
    skillScores[skill].scores.push(score);
    skillScores[skill].averageScore = Number(
      (skillScores[skill].scores.reduce((a, b) => a + b, 0) / skillScores[skill].scores.length).toFixed(1)
    );

    weakSkills = Object.entries(skillScores)
      .filter(([_, data]) => data.averageScore < 6)
      .map(([s]) => s);
  }

  // --- QUESTION 1: Excellent Answer ---
  console.log('🔹 [TURN 1/5] Testing Question 1 (Expect Beginner -> Excellent Answer -> Escalation)');
  const q1Result = await geminiService.generateQuestion({
    ...candidate,
    questionNumber: 1,
    totalQuestions: 5,
    currentDifficulty,
    previousQuestions: [],
    weakSkills: [],
  });

  const q1 = q1Result.question;
  askedQuestions.push(q1.text);
  console.log(`  Question 1 (${q1.skill}, Diff: ${q1.difficulty}): "${q1.text}"`);

  if (q1.difficulty !== 'beginner') {
    throw new Error(`FAIL: Initial question expected difficulty "beginner", got "${q1.difficulty}"`);
  }

  const ans1 = `In Python, mutable objects (like lists, dictionaries, and sets) can have their in-place content modified after creation without changing their memory address (id). Immutable objects (like integers, floats, strings, and tuples) cannot be altered in-place; any modification produces a brand new object in memory with a distinct id(). When passed to functions, Python utilizes "call-by-object-reference" or call-by-sharing. If you mutate a mutable object inside a function (e.g., list.append()), the change persists in the caller scope. Conversely, rebinding or mutating an immutable type creates a local reference without modifying the caller. A classic pitfall is using mutable default arguments like def foo(item, target=[]): because the default list is evaluated only once at function definition time, accumulating state across successive calls.`;
  
  const eval1Result = await geminiService.evaluateAnswer({
    candidateName: candidate.candidateName,
    targetRole: candidate.targetRole,
    experienceLevel: candidate.experienceLevel,
    question: q1,
    candidateAnswer: ans1,
    previousWeakSkills: [],
  });

  const eval1 = eval1Result.evaluation;
  console.log(`  Score: ${eval1.score}/10 | Correctness: ${eval1.correctness} | Tech Depth: ${eval1.technicalDepth}`);
  console.log(`  Difficulty Recommendation: "${eval1.difficultyRecommendation}"`);

  if (eval1.score < 8) {
    throw new Error(`FAIL: Excellent answer was expected to score >= 8.0, got ${eval1.score}`);
  }
  if (eval1.difficultyRecommendation !== 'increase') {
    throw new Error(`FAIL: Expected difficulty recommendation "increase", got "${eval1.difficultyRecommendation}"`);
  }

  updateSkillScores(q1.skill, eval1.score);
  currentDifficulty = 'intermediate'; // Adapted from beginner
  history.push({
    question: q1,
    candidateAnswer: ans1,
    evaluation: eval1,
    timestamp: new Date().toISOString(),
  });
  console.log(`  ✅ Turn 1 PASSED: Difficulty escalated to "${currentDifficulty}"\n`);

  // --- QUESTION 2: Average Answer ---
  console.log('🔹 [TURN 2/5] Testing Question 2 (Expect Intermediate -> Average Answer -> Maintain)');
  const q2Result = await geminiService.generateQuestion({
    ...candidate,
    questionNumber: 2,
    totalQuestions: 5,
    currentDifficulty,
    previousQuestions: history.map(h => ({
      questionText: h.question.text,
      skill: h.question.skill,
      score: h.evaluation.score,
    })),
    weakSkills,
  });

  const q2 = q2Result.question;
  console.log(`  Question 2 (${q2.skill}, Diff: ${q2.difficulty}): "${q2.text}"`);

  if (askedQuestions.includes(q2.text)) {
    throw new Error(`FAIL: Question repeated! "${q2.text}" was already asked.`);
  }
  askedQuestions.push(q2.text);

  if (q2.difficulty !== 'intermediate') {
    throw new Error(`FAIL: Turn 2 expected difficulty "intermediate", got "${q2.difficulty}"`);
  }

  const ans2 = `The Global Interpreter Lock (GIL) is a mutex lock in CPython that prevents multiple native threads from executing Python bytecodes simultaneously. It limits CPU-bound multi-threading to one core, but I/O-bound tasks work fine because the GIL is released during I/O operations.`;
  
  const eval2Result = await geminiService.evaluateAnswer({
    candidateName: candidate.candidateName,
    targetRole: candidate.targetRole,
    experienceLevel: candidate.experienceLevel,
    question: q2,
    candidateAnswer: ans2,
    previousWeakSkills: weakSkills,
  });

  const eval2 = eval2Result.evaluation;
  console.log(`  Score: ${eval2.score}/10 | Correctness: ${eval2.correctness} | Tech Depth: ${eval2.technicalDepth}`);
  console.log(`  Difficulty Recommendation: "${eval2.difficultyRecommendation}"`);

  if (eval2.score < 5 || eval2.score >= 8) {
    throw new Error(`FAIL: Average answer expected score between 5.0 and 7.9, got ${eval2.score}`);
  }
  if (eval2.difficultyRecommendation !== 'maintain') {
    throw new Error(`FAIL: Expected difficulty recommendation "maintain", got "${eval2.difficultyRecommendation}"`);
  }

  updateSkillScores(q2.skill, eval2.score);
  // Difficulty maintained
  history.push({
    question: q2,
    candidateAnswer: ans2,
    evaluation: eval2,
    timestamp: new Date().toISOString(),
  });
  console.log(`  ✅ Turn 2 PASSED: Difficulty maintained at "${currentDifficulty}"\n`);

  // --- QUESTION 3: Poor Answer ---
  console.log('🔹 [TURN 3/5] Testing Question 3 (Expect Intermediate -> Poor Answer -> Reduce Difficulty)');
  const q3Result = await geminiService.generateQuestion({
    ...candidate,
    questionNumber: 3,
    totalQuestions: 5,
    currentDifficulty,
    previousQuestions: history.map(h => ({
      questionText: h.question.text,
      skill: h.question.skill,
      score: h.evaluation.score,
    })),
    weakSkills,
  });

  const q3 = q3Result.question;
  console.log(`  Question 3 (${q3.skill}, Diff: ${q3.difficulty}): "${q3.text}"`);

  if (askedQuestions.includes(q3.text)) {
    throw new Error(`FAIL: Question repeated! "${q3.text}" was already asked.`);
  }
  askedQuestions.push(q3.text);

  const ans3 = `I don't know this concept in detail, sorry. I forget the implementation.`;
  
  const eval3Result = await geminiService.evaluateAnswer({
    candidateName: candidate.candidateName,
    targetRole: candidate.targetRole,
    experienceLevel: candidate.experienceLevel,
    question: q3,
    candidateAnswer: ans3,
    previousWeakSkills: weakSkills,
  });

  const eval3 = eval3Result.evaluation;
  console.log(`  Score: ${eval3.score}/10 | Correctness: ${eval3.correctness} | Tech Depth: ${eval3.technicalDepth}`);
  console.log(`  Difficulty Recommendation: "${eval3.difficultyRecommendation}"`);

  if (eval3.score >= 5.0) {
    throw new Error(`FAIL: Poor answer was expected to score < 5.0, got ${eval3.score}`);
  }
  if (eval3.difficultyRecommendation !== 'reduce') {
    throw new Error(`FAIL: Expected difficulty recommendation "reduce", got "${eval3.difficultyRecommendation}"`);
  }

  updateSkillScores(q3.skill, eval3.score);
  currentDifficulty = 'beginner'; // Calibrated down from intermediate to beginner
  history.push({
    question: q3,
    candidateAnswer: ans3,
    evaluation: eval3,
    timestamp: new Date().toISOString(),
  });

  console.log(`  Tracked Weak Skills: [${weakSkills.join(', ')}]`);
  if (!weakSkills.includes(q3.skill)) {
    throw new Error(`FAIL: Weak skill "${q3.skill}" was not added to weakSkills array!`);
  }
  console.log(`  ✅ Turn 3 PASSED: Difficulty reduced to "${currentDifficulty}" and weak skill "${q3.skill}" identified\n`);

  // --- QUESTION 4: Excellent Answer (Testing Fundamentals / Weak Skill) ---
  console.log(`🔹 [TURN 4/5] Testing Question 4 (Expect Beginner testing fundamentals -> Excellent Answer -> Escalation)`);
  const q4Result = await geminiService.generateQuestion({
    ...candidate,
    questionNumber: 4,
    totalQuestions: 5,
    currentDifficulty,
    previousQuestions: history.map(h => ({
      questionText: h.question.text,
      skill: h.question.skill,
      score: h.evaluation.score,
    })),
    weakSkills,
    focusSkill: weakSkills[0],
  });

  const q4 = q4Result.question;
  console.log(`  Question 4 (${q4.skill}, Diff: ${q4.difficulty}): "${q4.text}"`);

  if (askedQuestions.includes(q4.text)) {
    throw new Error(`FAIL: Question repeated! "${q4.text}" was already asked.`);
  }
  askedQuestions.push(q4.text);

  if (q4.difficulty !== 'beginner') {
    throw new Error(`FAIL: Expected difficulty "beginner" after reduction, got "${q4.difficulty}"`);
  }

  const ans4 = `List comprehensions provide a concise syntax for creating new lists from iterables. Under the hood in CPython, list comprehensions execute at C speed using the LIST_APPEND bytecode instruction rather than repeatedly looking up the append method in Python bytecode like a standard for-loop does. For instance, [x**2 for x in range(10) if x % 2 == 0] is much faster and cleaner. However, if transformation logic requires multiple nested loops or complex exception handling, traditional for-loops are preferred to preserve readability and maintainability. For massive datasets, generator expressions (x**2 for x in range(1000000)) are superior because they stream values lazily with O(1) memory instead of allocating the entire list eagerly in RAM.`;

  const eval4Result = await geminiService.evaluateAnswer({
    candidateName: candidate.candidateName,
    targetRole: candidate.targetRole,
    experienceLevel: candidate.experienceLevel,
    question: q4,
    candidateAnswer: ans4,
    previousWeakSkills: weakSkills,
  });

  const eval4 = eval4Result.evaluation;
  console.log(`  Score: ${eval4.score}/10 | Correctness: ${eval4.correctness} | Tech Depth: ${eval4.technicalDepth}`);
  console.log(`  Difficulty Recommendation: "${eval4.difficultyRecommendation}"`);

  if (eval4.score < 8.0) {
    throw new Error(`FAIL: Excellent answer expected score >= 8.0, got ${eval4.score}`);
  }
  if (eval4.difficultyRecommendation !== 'increase') {
    throw new Error(`FAIL: Expected difficulty recommendation "increase", got "${eval4.difficultyRecommendation}"`);
  }

  updateSkillScores(q4.skill, eval4.score);
  currentDifficulty = 'intermediate'; // Re-escalated
  history.push({
    question: q4,
    candidateAnswer: ans4,
    evaluation: eval4,
    timestamp: new Date().toISOString(),
  });
  console.log(`  ✅ Turn 4 PASSED: Difficulty re-escalated to "${currentDifficulty}"\n`);

  // --- QUESTION 5: Poor Answer ---
  console.log(`🔹 [TURN 5/5] Testing Question 5 (Expect Intermediate -> Poor Answer)`);
  const q5Result = await geminiService.generateQuestion({
    ...candidate,
    questionNumber: 5,
    totalQuestions: 5,
    currentDifficulty,
    previousQuestions: history.map(h => ({
      questionText: h.question.text,
      skill: h.question.skill,
      score: h.evaluation.score,
    })),
    weakSkills,
  });

  const q5 = q5Result.question;
  console.log(`  Question 5 (${q5.skill}, Diff: ${q5.difficulty}): "${q5.text}"`);

  if (askedQuestions.includes(q5.text)) {
    throw new Error(`FAIL: Question repeated! "${q5.text}" was already asked.`);
  }
  askedQuestions.push(q5.text);

  const ans5 = `Skip this question, I do not remember.`;
  const eval5Result = await geminiService.evaluateAnswer({
    candidateName: candidate.candidateName,
    targetRole: candidate.targetRole,
    experienceLevel: candidate.experienceLevel,
    question: q5,
    candidateAnswer: ans5,
    previousWeakSkills: weakSkills,
  });

  const eval5 = eval5Result.evaluation;
  console.log(`  Score: ${eval5.score}/10 | Correctness: ${eval5.correctness} | Tech Depth: ${eval5.technicalDepth}`);
  console.log(`  Difficulty Recommendation: "${eval5.difficultyRecommendation}"`);

  if (eval5.score >= 5.0) {
    throw new Error(`FAIL: Poor answer expected score < 5.0, got ${eval5.score}`);
  }

  updateSkillScores(q5.skill, eval5.score);
  history.push({
    question: q5,
    candidateAnswer: ans5,
    evaluation: eval5,
    timestamp: new Date().toISOString(),
  });
  console.log(`  ✅ Turn 5 PASSED\n`);

  // --- FINAL REPORT GENERATION ---
  console.log('🔹 [FINAL ASSESSMENT REPORT] Generating Hiring Dossier...');
  const reportResult = await geminiService.generateReport({
    candidateName: candidate.candidateName,
    targetRole: candidate.targetRole,
    experienceLevel: candidate.experienceLevel,
    interviewType: candidate.interviewType,
    skills: candidate.skills,
    history: history.map(h => ({
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
      Object.entries(skillScores).map(([k, v]) => [
        k,
        { averageScore: v.averageScore, attempts: v.attempts },
      ])
    ),
  });

  const report = reportResult.report;
  console.log('----------------------------------------------------');
  console.log(`  Candidate: ${report.candidateName}`);
  console.log(`  Overall Score: ${report.overallScore}/100`);
  console.log(`  Recommendation: "${report.finalRecommendation}"`);
  console.log(`  Technical Knowledge Score: ${report.technicalKnowledgeScore}%`);
  console.log(`  Communication Score: ${report.communicationScore}%`);
  console.log(`  Problem Solving Score: ${report.problemSolvingScore}%`);
  console.log(`  Skill-by-Skill Scores:`, report.skillScores);
  console.log(`  Strengths (${report.strengths.length}):`, report.strengths);
  console.log(`  Weaknesses (${report.weaknesses.length}):`, report.weaknesses);
  console.log(`  Personalized Improvement Plan (${report.personalizedImprovementPlan.length} milestones):`);
  report.personalizedImprovementPlan.forEach((step, idx) => {
    console.log(`    ${idx + 1}. [${step.priority} Priority] ${step.area}: ${step.recommendation}`);
  });
  console.log(`  Question Audit Log (${report.questionEvaluations.length} records):`);
  report.questionEvaluations.forEach(q => {
    console.log(`    Q${q.questionNumber} [${q.skill} - ${q.difficulty}]: Score ${q.score}/10`);
  });
  console.log('----------------------------------------------------');

  // Assertions
  if (report.overallScore <= 0 || report.overallScore > 100) {
    throw new Error(`FAIL: Overall score ${report.overallScore} out of valid range (0-100)`);
  }
  if (!['Strong Hire', 'Hire', 'Borderline', 'Needs Improvement'].includes(report.finalRecommendation)) {
    throw new Error(`FAIL: Invalid recommendation "${report.finalRecommendation}"`);
  }
  if (report.questionEvaluations.length !== 5) {
    throw new Error(`FAIL: Expected 5 question evaluations in report, got ${report.questionEvaluations.length}`);
  }
  const uniqueQuestions = new Set(askedQuestions);
  if (uniqueQuestions.size !== 5) {
    throw new Error(`FAIL: Questions repeated! Only ${uniqueQuestions.size} unique questions out of 5.`);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL QA TESTS PASSED SUCCESSFULLY!');
  console.log('- Scores changed appropriately across all answers');
  console.log('- Difficulty adapted dynamically (Beginner -> Intermediate -> Beginner -> Intermediate)');
  console.log('- Weak skills identified and tracked');
  console.log('- All 5 questions were 100% unique (zero repeats)');
  console.log('- Comprehensive Final Report synthesized with all rubric scores');
  console.log('====================================================');
}

runQATest().catch(err => {
  console.error('\n❌ QA TEST FAILED:', err);
  process.exit(1);
});
