// server/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// server/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// server/prompts.ts
function buildQuestionPrompt(params) {
  const previousList = params.previousQuestions.length > 0 ? params.previousQuestions.map((q, idx) => `Q${idx + 1} (${q.skill}, Score: ${q.score ?? "N/A"}): "${q.questionText}"`).join("\n") : "None (this is the first question)";
  const weakSkillsText = params.weakSkills.length > 0 ? params.weakSkills.join(", ") : "None identified yet";
  return `
You are an expert Senior Technical Interviewer and Engineering Manager conducting a live job interview for:
- Candidate Name: ${params.candidateName}
- Target Role: ${params.targetRole}
- Experience Level: ${params.experienceLevel}
- Interview Format: ${params.interviewType}
- Target Skills: ${params.skills.join(", ")}

CURRENT INTERVIEW STATUS:
- Current Question: ${params.questionNumber} of ${params.totalQuestions}
- Current Difficulty Target: ${params.currentDifficulty.toUpperCase()}
- Previously Asked Questions (DO NOT REPEAT ANY OF THESE):
${previousList}
- Identified Weak Skills to test or reinforce: ${weakSkillsText}
${params.focusSkill ? `- Prioritized Skill for this turn: ${params.focusSkill}` : ""}

AGENTIC INSTRUCTIONS:
1. Act as a realistic, professional tech interviewer. Ask ONE targeted, clear question.
2. Select a skill from the candidate's skills list (${params.skills.join(", ")}).
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
function buildEvaluationPrompt(params) {
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
- Evaluation Intent: "${params.question.intent || "Assess technical depth and correctness"}"

CANDIDATE'S SUBMITTED ANSWER:
"""
${params.candidateAnswer.trim() || "[No Answer Provided]"}
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
function buildFinalReportPrompt(params) {
  const historyText = params.history.map((h) => `
Question ${h.questionNumber} [Skill: ${h.skill}, Difficulty: ${h.difficulty}]:
Q: "${h.questionText}"
Candidate Answer: "${h.candidateAnswer}"
Score: ${h.score}/10
Feedback: ${h.feedback}
Strengths: ${(h.strengths || []).join(", ")}
Weaknesses: ${(h.weaknesses || []).join(", ")}
`).join("\n---\n");
  return `
You are the Lead Hiring Committee Chair and Principal Technical Assessor.
Generate a comprehensive, executive-level technical interview assessment report for:
- Candidate: ${params.candidateName}
- Target Role: ${params.targetRole}
- Experience: ${params.experienceLevel}
- Interview Type: ${params.interviewType}
- Target Skill Set: ${params.skills.join(", ")}

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
  "date": "${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}",
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

// server/mockFallback.ts
var QUESTION_BANK = [
  // Data Structures
  {
    skill: "Data Structures",
    difficulty: "beginner",
    text: "Can you explain the key differences between an Array and a Linked List, specifically highlighting memory allocation and element access times?",
    intent: "Assess understanding of basic memory layout and Big-O access complexity.",
    keyConcepts: ["contiguous memory", "pointer overhead", "O(1) access", "O(n) search"]
  },
  {
    skill: "Data Structures",
    difficulty: "intermediate",
    text: "How does a Hash Table handle collisions, and what is the difference between Separate Chaining and Open Addressing?",
    intent: "Evaluate collision resolution strategies and load factor impact on amortized O(1) performance.",
    keyConcepts: ["hash collisions", "separate chaining", "linear probing", "load factor", "rehashing"]
  },
  {
    skill: "Data Structures",
    difficulty: "advanced",
    text: "Explain the self-balancing mechanism in an AVL Tree or Red-Black Tree. In what scenarios would you prefer a Red-Black Tree over an AVL Tree in production systems?",
    intent: "Assess self-balancing binary search trees, rotation costs, and read-heavy vs write-heavy trade-offs.",
    keyConcepts: ["tree rotations", "balance factor", "coloring rules", "lookup speed vs insertion cost"]
  },
  // Algorithms
  {
    skill: "Algorithms",
    difficulty: "beginner",
    text: "What is the difference between Linear Search and Binary Search? What precondition must be met for Binary Search to work?",
    intent: "Test basic searching algorithms, prerequisite conditions, and logarithmic vs linear scaling.",
    keyConcepts: ["sorted array", "O(log n)", "O(n)", "divide and conquer"]
  },
  {
    skill: "Algorithms",
    difficulty: "intermediate",
    text: "Explain the concept of Dynamic Programming and how memoization differs from tabulation with a concrete example (like Fibonacci or Coin Change).",
    intent: "Assess overlapping subproblems, optimal substructure, and top-down vs bottom-up space/time trade-offs.",
    keyConcepts: ["overlapping subproblems", "optimal substructure", "memoization top-down", "tabulation bottom-up"]
  },
  {
    skill: "Algorithms",
    difficulty: "advanced",
    text: "Describe Dijkstra\u2019s Algorithm for finding the shortest path in a weighted graph. Why does it fail when negative weight edges exist, and what algorithm would you use instead?",
    intent: "Evaluate graph traversal mechanics, greedy assumptions, Bellman-Ford alternative, and min-heap efficiency.",
    keyConcepts: ["greedy choice", "priority queue", "negative edge cycles", "Bellman-Ford", "relaxation"]
  },
  // DBMS / SQL
  {
    skill: "DBMS",
    difficulty: "beginner",
    text: "What are the ACID properties in database management systems? Explain what each letter stands for with a simple real-world banking example.",
    intent: "Assess core transaction integrity principles.",
    keyConcepts: ["atomicity", "consistency", "isolation", "durability", "commit rollback"]
  },
  {
    skill: "SQL",
    difficulty: "intermediate",
    text: "Explain the difference between Clustered and Non-Clustered Indexes in a relational database. How does a B+ Tree structure accelerate query execution?",
    intent: "Assess storage page layout, physical ordering, pointer lookups, and range query efficiency.",
    keyConcepts: ["physical order", "leaf nodes", "secondary index", "B+ tree depth", "index seek vs scan"]
  },
  {
    skill: "DBMS",
    difficulty: "advanced",
    text: "What are the four SQL transaction isolation levels? Explain what Dirty Reads, Non-Repeatable Reads, and Phantom Reads are, and how each level prevents them.",
    intent: "Evaluate concurrency anomalies, locks, MVCC (Multi-Version Concurrency Control), and throughput trade-offs.",
    keyConcepts: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable", "MVCC", "phantom reads"]
  },
  // Operating Systems
  {
    skill: "Operating Systems",
    difficulty: "beginner",
    text: "What is the primary difference between a Process and a Thread? How do they differ in terms of memory space and context switching overhead?",
    intent: "Assess OS execution units, PCB vs TCB, and shared memory versus isolated address space.",
    keyConcepts: ["address space isolation", "shared heap", "thread stack", "context switch cost"]
  },
  {
    skill: "Operating Systems",
    difficulty: "intermediate",
    text: "What is a Deadlock, what are the four Coffman conditions necessary for a deadlock to occur, and how can an OS prevent or avoid it?",
    intent: "Assess mutual exclusion, hold and wait, no preemption, circular wait, and Banker\u2019s Algorithm.",
    keyConcepts: ["mutual exclusion", "hold and wait", "circular wait", "Bankers algorithm", "resource allocation graph"]
  },
  {
    skill: "Operating Systems",
    difficulty: "advanced",
    text: "Explain Virtual Memory management. How do the MMU, Page Tables, TLB (Translation Lookaside Buffer), and Page Fault handling work together during an address translation?",
    intent: "Evaluate hardware-OS interaction, physical frame mapping, TLB miss handling, and demand paging.",
    keyConcepts: ["MMU", "TLB cache hit/miss", "page table walk", "page fault interrupt", "swapping"]
  },
  // Computer Networks
  {
    skill: "Computer Networks",
    difficulty: "beginner",
    text: "Explain the difference between TCP and UDP protocols. When would a software engineer choose UDP over TCP?",
    intent: "Assess transport layer fundamentals: connection-oriented vs connectionless, reliability vs latency.",
    keyConcepts: ["three-way handshake", "acknowledgment and retransmission", "packet ordering", "UDP speed/streaming"]
  },
  {
    skill: "Computer Networks",
    difficulty: "intermediate",
    text: 'Walk me through what happens under the hood when a user types "https://example.com" into a web browser and presses Enter until the webpage renders.',
    intent: "Assess holistic networking stack: DNS lookup, TCP handshake, TLS negotiation, HTTP request/response, DOM rendering.",
    keyConcepts: ["DNS resolution", "TLS certificate verification", "HTTP/2 / HTTP/3", "browser rendering engine"]
  },
  // OOP
  {
    skill: "OOP",
    difficulty: "beginner",
    text: "What are the four pillars of Object-Oriented Programming? Give a brief code example or concept illustration for Polymorphism.",
    intent: "Evaluate fundamental OO abstractions, encapsulation, inheritance, polymorphism.",
    keyConcepts: ["encapsulation", "abstraction", "inheritance", "polymorphism", "method overriding/overloading"]
  },
  {
    skill: "OOP",
    difficulty: "intermediate",
    text: "Explain the SOLID principles of object-oriented design. Pick the Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP) to explain in detail.",
    intent: "Assess clean code architecture, loose coupling, interfaces, and maintainable software engineering practices.",
    keyConcepts: ["single responsibility", "open closed", "liskov substitution", "interface segregation", "dependency inversion"]
  },
  // Python
  {
    skill: "Python",
    difficulty: "beginner",
    text: "Explain the difference between mutable and immutable data types in Python. Give two examples of each, and explain what happens when passing them to functions.",
    intent: "Assess Python memory model, pass-by-object-reference, and common mutation pitfalls.",
    keyConcepts: ["lists vs tuples", "strings are immutable", "object id", "default mutable arguments"]
  },
  {
    skill: "Python",
    difficulty: "beginner",
    text: "What are list comprehensions in Python, and how do they differ in syntax, performance, and readability from traditional for-loops?",
    intent: "Assess basic Pythonic syntax, bytecode optimization, and readability best practices.",
    keyConcepts: ["list comprehension", "syntax brevity", "C-level loop speed", "readability vs complexity"]
  },
  {
    skill: "Python",
    difficulty: "intermediate",
    text: "What is the Global Interpreter Lock (GIL) in CPython, and how does it impact multi-threaded CPU-bound versus I/O-bound Python programs?",
    intent: "Evaluate Python concurrency limitations, multiprocessing vs threading vs asyncio.",
    keyConcepts: ["GIL mutex", "single core execution for bytecode", "multiprocessing bypass", "asyncio event loop"]
  },
  {
    skill: "Python",
    difficulty: "intermediate",
    text: "Explain how Python decorators work under the hood. How would you write a decorator that measures and logs the execution time of a function?",
    intent: "Assess higher-order functions, closures, functools.wraps, and wrapper execution.",
    keyConcepts: ["closures", "first-class functions", "functools wraps", "wrapper function arguments"]
  },
  {
    skill: "Python",
    difficulty: "advanced",
    text: "How does CPython manage memory under the hood? Explain Reference Counting, Cyclic Garbage Collection (generations 0, 1, 2), and how `__slots__` reduces memory overhead.",
    intent: "Evaluate deep Python internals, memory allocation, circular references, and micro-optimizations.",
    keyConcepts: ["PyObject reference count", "cyclic garbage collector", "tri-color generation", "__slots__ dict avoidance"]
  },
  {
    skill: "Python",
    difficulty: "advanced",
    text: "Explain asynchronous programming in Python using `asyncio`. How does the event loop schedule coroutines, and how do `await`, `asyncio.gather()`, and `asyncio.create_task()` prevent blocking?",
    intent: "Assess asynchronous concurrency, cooperative multitasking, task futures, and event loop scheduling.",
    keyConcepts: ["event loop", "coroutine generator", "cooperative multitasking", "asyncio.create_task", "non-blocking IO"]
  },
  // Java
  {
    skill: "Java",
    difficulty: "beginner",
    text: 'What is the difference between JDK, JRE, and JVM? How does Java achieve platform independence ("Write Once, Run Anywhere")?',
    intent: "Test Java architecture fundamentals, bytecode execution, and runtime environments.",
    keyConcepts: ["JVM bytecode execution", "platform specific JRE", "compiler javac", "just-in-time compiler JIT"]
  },
  {
    skill: "Java",
    difficulty: "intermediate",
    text: "How does Garbage Collection work in Java? Explain the difference between Young Generation (Eden, Survivor) and Old Generation memory pools.",
    intent: "Assess Java memory layout, GC generational hypothesis, minor GC vs major GC.",
    keyConcepts: ["heap memory", "Eden and Survivor spaces", "stop-the-world pauses", "mark-and-sweep"]
  },
  // JavaScript
  {
    skill: "JavaScript",
    difficulty: "beginner",
    text: "What is the difference between `var`, `let`, and `const` in JavaScript? Explain scope (function vs block) and hoisting.",
    intent: "Assess modern ES6 scoping rules, temporal dead zone, and variable declarations.",
    keyConcepts: ["block scope", "function scope", "hoisting", "temporal dead zone TDZ"]
  },
  {
    skill: "JavaScript",
    difficulty: "intermediate",
    text: "Explain the JavaScript Event Loop, Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout). In what order are they processed?",
    intent: "Assess asynchronous concurrency model in single-threaded JavaScript engines.",
    keyConcepts: ["call stack", "microtask priority", "macrotask queue", "event loop tick"]
  },
  // Machine Learning
  {
    skill: "Machine Learning",
    difficulty: "beginner",
    text: "What is the difference between Supervised and Unsupervised Learning? Give one practical example and algorithm for each.",
    intent: "Test core ML paradigms, classification vs clustering.",
    keyConcepts: ["labeled data", "unlabeled clusters", "linear regression/random forest", "k-means"]
  },
  // HR / Mixed
  {
    skill: "Problem Solving",
    difficulty: "intermediate",
    text: "Tell me about a challenging technical bug or project hurdle you faced during your MCA/degree projects. How did you diagnose it, what trade-offs did you consider, and what was the outcome?",
    intent: "STAR method situational evaluation: Situation, Task, Action, Result, and problem-solving methodology.",
    keyConcepts: ["root cause analysis", "systematic debugging", "trade-offs", "measurable outcome"]
  }
];
function getFallbackQuestion(params) {
  const normalizedCandidateSkills = params.skills.map((s) => s.toLowerCase().trim());
  let targetSkillCandidates = QUESTION_BANK.filter((q) => {
    const qSkill = q.skill.toLowerCase();
    const matchesSkill = normalizedCandidateSkills.some((s) => s.includes(qSkill) || qSkill.includes(s));
    const alreadyAsked = params.askedQuestions.some((prev) => prev.toLowerCase().includes(q.text.toLowerCase().slice(0, 25)));
    return matchesSkill && !alreadyAsked;
  });
  if (params.weakSkills && params.weakSkills.length > 0) {
    const weakCandidates = targetSkillCandidates.filter(
      (q) => params.weakSkills.some((ws) => ws.toLowerCase() === q.skill.toLowerCase())
    );
    if (weakCandidates.length > 0) {
      targetSkillCandidates = weakCandidates;
    }
  }
  if (targetSkillCandidates.length === 0) {
    targetSkillCandidates = QUESTION_BANK.filter(
      (q) => !params.askedQuestions.some((prev) => prev.toLowerCase().includes(q.text.toLowerCase().slice(0, 25)))
    );
  }
  let selected = targetSkillCandidates.find((q) => q.difficulty === params.currentDifficulty);
  if (!selected && targetSkillCandidates.length > 0) {
    selected = targetSkillCandidates[0];
  }
  if (!selected) {
    const chosenSkill = params.skills[params.questionNumber % params.skills.length] || "Problem Solving";
    selected = {
      skill: chosenSkill,
      difficulty: params.currentDifficulty,
      text: `In the context of ${chosenSkill}, how would you approach architecting a scalable, fault-tolerant solution when designing a high-traffic system?`,
      intent: `Assess engineering design principles, bottlenecks, and error handling in ${chosenSkill}.`,
      keyConcepts: ["scalability", "fault tolerance", "modularity", "monitoring"]
    };
  }
  return {
    id: `q-fallback-${params.questionNumber}-${Date.now()}`,
    questionNumber: params.questionNumber,
    text: selected.text,
    skill: selected.skill,
    difficulty: params.currentDifficulty,
    intent: selected.intent
  };
}
function evaluateFallbackAnswer(params) {
  const answer = params.candidateAnswer.trim();
  const wordCount = answer ? answer.split(/\s+/).length : 0;
  let correctness = 6;
  let technicalDepth = 6;
  let communication = 6;
  let relevance = 6;
  const lowerAnswer = answer.toLowerCase();
  const isPoorPhrasing = lowerAnswer.includes("don't know") || lowerAnswer.includes("not sure") || lowerAnswer.includes("no idea") || lowerAnswer.includes("forget") || lowerAnswer.includes("skip");
  if (wordCount < 18 || isPoorPhrasing) {
    correctness = 3.5;
    technicalDepth = 2.5;
    communication = 3.5;
    relevance = 4;
  } else if (wordCount >= 55) {
    correctness = 8.5;
    technicalDepth = 8.2;
    communication = 8.5;
    relevance = 8.5;
  } else {
    correctness = 6.2;
    technicalDepth = 5.8;
    communication = 6.5;
    relevance = 6.5;
  }
  const overallScore = Number((correctness * 0.35 + technicalDepth * 0.35 + communication * 0.15 + relevance * 0.15).toFixed(1));
  let difficultyRecommendation = "maintain";
  if (overallScore >= 8) {
    difficultyRecommendation = "increase";
  } else if (overallScore < 5) {
    difficultyRecommendation = "reduce";
  }
  let nextAction = `Continue probing ${params.question.skill} or pivot to related architectural foundations.`;
  if (difficultyRecommendation === "increase") {
    nextAction = `Candidate demonstrated mastery in ${params.question.skill}. Escalate to complex edge-cases and distributed trade-offs.`;
  } else if (difficultyRecommendation === "reduce") {
    nextAction = `Candidate struggled with core concepts in ${params.question.skill}. Step down to fundamental primitives and baseline terminology.`;
  }
  return {
    score: overallScore,
    correctness,
    technicalDepth,
    communication,
    relevance,
    feedback: wordCount < 20 ? `Your answer was brief and missed core engineering details for ${params.question.skill}. Elaborate more on technical mechanisms and trade-offs.` : `Solid response explaining ${params.question.skill}. You clearly communicated the core principles; adding concrete code syntax or edge-case handling would elevate it even further.`,
    skill: params.question.skill,
    difficultyRecommendation,
    nextAction,
    strengths: wordCount >= 30 ? ["Clear conceptual definition", "Good communication structure"] : ["Attempted the question"],
    weaknesses: wordCount < 40 ? ["Lacked detailed algorithmic/architectural depth", "Omitted time/space complexity"] : ["Could discuss production corner cases"],
    keyMissedPoints: ["Underlying memory allocations", "Practical boundary condition handling"],
    modelAnswerSnippet: `An optimal answer clearly highlights the fundamental definitions, time/space complexities, real-world trade-offs, and boundary considerations for ${params.question.skill}.`
  };
}
function generateFallbackReport(params) {
  const scores = params.history.map((h) => h.score);
  const avgScore10 = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 7;
  const overallScore = Math.min(100, Math.max(0, Math.round(avgScore10 * 10)));
  const technicalKnowledgeScore = Math.min(100, Math.round(overallScore * 0.95 + 3));
  const communicationScore = Math.min(100, Math.round(overallScore * 0.92 + 6));
  const problemSolvingScore = Math.min(100, Math.round(overallScore * 0.9 + 5));
  const skillScores = {};
  for (const [skill, data] of Object.entries(params.skillScores)) {
    skillScores[skill] = Math.min(100, Math.round(data.averageScore * 10));
  }
  let finalRecommendation = "Hire";
  if (overallScore >= 85) finalRecommendation = "Strong Hire";
  else if (overallScore >= 70) finalRecommendation = "Hire";
  else if (overallScore >= 55) finalRecommendation = "Borderline";
  else finalRecommendation = "Needs Improvement";
  const weakSkillsList = [];
  const strongSkillsList = [];
  for (const [skill, data] of Object.entries(params.skillScores)) {
    if (data.averageScore < 6) weakSkillsList.push(skill);
    else if (data.averageScore >= 8) strongSkillsList.push(skill);
  }
  const dynamicWeaknesses = [];
  if (weakSkillsList.length > 0) {
    dynamicWeaknesses.push(
      `Identified conceptual gaps in ${weakSkillsList.join(" and ")} fundamentals (requires focused revision).`
    );
  }
  dynamicWeaknesses.push("Needs deeper familiarity with production edge cases and error handling.");
  dynamicWeaknesses.push("Could provide more concrete code examples and time/space complexity analysis.");
  const dynamicStrengths = [];
  if (strongSkillsList.length > 0) {
    dynamicStrengths.push(
      `Demonstrated strong grasp and clear articulation in ${strongSkillsList.join(" and ")}.`
    );
  }
  dynamicStrengths.push("Articulate communication with structured answers.");
  dynamicStrengths.push("Capable of breaking down multi-step technical questions.");
  const improvementPlan = [
    ...weakSkillsList.map((ws) => ({
      area: `${ws} Domain Fundamentals`,
      recommendation: `Deep dive into ${ws} core architecture, practical syntax, and common interview patterns.`,
      suggestedAction: `Build a dedicated mini-project and solve foundational problems in ${ws}.`,
      priority: "High"
    })),
    {
      area: "Core Fundamentals & Edge Cases",
      recommendation: "Practice explaining internal data structure layouts on a whiteboard or out loud.",
      suggestedAction: "Implement custom hash tables with separate chaining and open addressing in code.",
      priority: "Medium"
    },
    {
      area: "System Design & Trade-Offs",
      recommendation: "Deepen understanding of horizontal vs vertical scaling and caching layers.",
      suggestedAction: "Study real-world case studies of URL shorteners and notification services.",
      priority: "Medium"
    }
  ];
  return {
    candidateName: params.candidateName,
    targetRole: params.targetRole,
    date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    overallScore,
    technicalKnowledgeScore,
    communicationScore,
    problemSolvingScore,
    skillScores,
    strengths: dynamicStrengths,
    weaknesses: dynamicWeaknesses,
    questionEvaluations: params.history.map((h) => ({
      questionNumber: h.questionNumber,
      questionText: h.questionText,
      skill: h.skill,
      difficulty: h.difficulty,
      candidateAnswer: h.candidateAnswer,
      score: h.score,
      feedback: h.feedback,
      keyMissedPoints: ["Underlying memory implications", "Edge case boundary conditions"]
    })),
    recommendedTopics: [
      "Database Indexing internals (B+ Trees & Hash Indexes)",
      "Concurrency, Race Conditions, and Mutex Locks in OS",
      "Dynamic Programming & Greedy Algorithm optimizations",
      "System Design fundamentals: Caching, Load Balancing, and Sharding"
    ],
    personalizedImprovementPlan: improvementPlan,
    finalRecommendation,
    executiveSummary: `${params.candidateName} displayed strong potential for the ${params.targetRole} position, demonstrating solid foundational competencies across core computer science domains with professional technical articulation.`
  };
}

// server/gemini.ts
function parseGeminiJson(rawText, fallbackGenerator) {
  try {
    let clean = rawText.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return JSON.parse(clean);
  } catch (error) {
    console.error("Failed to parse Gemini response as JSON. Raw text:", rawText, error);
    return fallbackGenerator();
  }
}
var GeminiInterviewService = class {
  getClient(customKey) {
    const key = customKey || process.env.GEMINI_API_KEY;
    if (!key || key.trim() === "" || key.includes("YOUR_GEMINI_API_KEY")) {
      return null;
    }
    return new GoogleGenerativeAI(key.trim());
  }
  hasApiKey(customKey) {
    const key = customKey || process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim() !== "" && !key.includes("YOUR_GEMINI_API_KEY"));
  }
  async verifyConnection(customKey) {
    const client = this.getClient(customKey);
    if (!client) {
      return {
        success: false,
        model: "gemini-1.5-flash",
        message: "No GEMINI_API_KEY found in .env or request header."
      };
    }
    try {
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = 'You are InterviewPilot AI. Confirm connection with JSON: {"status":"connected","engine":"Gemini 1.5 Flash","ready":true}';
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return {
        success: true,
        model: "gemini-1.5-flash",
        message: "Gemini API connection established successfully.",
        sampleResponse: text.trim()
      };
    } catch (err) {
      return {
        success: false,
        model: "gemini-1.5-flash",
        message: "Gemini API call encountered an error.",
        error: err?.message || String(err)
      };
    }
  }
  async generateQuestion(params) {
    const client = this.getClient(params.customApiKey);
    if (!client) {
      console.log("No Gemini API key available. Using intelligent adaptive fallback engine.");
      const fallback = getFallbackQuestion({
        skills: params.skills,
        currentDifficulty: params.currentDifficulty,
        questionNumber: params.questionNumber,
        askedQuestions: params.previousQuestions.map((q) => q.questionText),
        weakSkills: params.weakSkills,
        interviewType: params.interviewType
      });
      return { question: fallback, source: "fallback" };
    }
    try {
      const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      const prompt = buildQuestionPrompt(params);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = parseGeminiJson(
        text,
        () => getFallbackQuestion({
          skills: params.skills,
          currentDifficulty: params.currentDifficulty,
          questionNumber: params.questionNumber,
          askedQuestions: params.previousQuestions.map((q) => q.questionText),
          weakSkills: params.weakSkills,
          interviewType: params.interviewType
        })
      );
      const finalQuestion = {
        id: parsed.id || `q-${params.questionNumber}-${Date.now()}`,
        questionNumber: params.questionNumber,
        text: parsed.text || "Could you explain your approach to writing modular, maintainable code?",
        skill: parsed.skill || params.skills[0] || "Problem Solving",
        difficulty: params.currentDifficulty,
        intent: parsed.intent || "Assess technical problem solving and code structure."
      };
      return { question: finalQuestion, source: "gemini" };
    } catch (err) {
      console.warn("Gemini API call failed for question generation, falling back gracefully:", err?.message || err);
      const fallback = getFallbackQuestion({
        skills: params.skills,
        currentDifficulty: params.currentDifficulty,
        questionNumber: params.questionNumber,
        askedQuestions: params.previousQuestions.map((q) => q.questionText),
        weakSkills: params.weakSkills,
        interviewType: params.interviewType
      });
      return { question: fallback, source: "fallback" };
    }
  }
  async evaluateAnswer(params) {
    const client = this.getClient(params.customApiKey);
    if (!client) {
      console.log("No Gemini API key available. Using intelligent fallback evaluator.");
      const fallback = evaluateFallbackAnswer({
        question: params.question,
        candidateAnswer: params.candidateAnswer
      });
      return { evaluation: fallback, source: "fallback" };
    }
    try {
      const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3
          // Lower temperature for consistent, objective scoring
        }
      });
      const prompt = buildEvaluationPrompt(params);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = parseGeminiJson(
        text,
        () => evaluateFallbackAnswer({
          question: params.question,
          candidateAnswer: params.candidateAnswer
        })
      );
      const score = Math.max(0, Math.min(10, Number(parsed.score) || 6));
      let rec = parsed.difficultyRecommendation;
      if (!["increase", "maintain", "reduce"].includes(rec)) {
        if (score >= 8) rec = "increase";
        else if (score < 5) rec = "reduce";
        else rec = "maintain";
      }
      const evaluation = {
        score,
        correctness: Math.max(0, Math.min(10, Number(parsed.correctness) || score)),
        technicalDepth: Math.max(0, Math.min(10, Number(parsed.technicalDepth) || score)),
        communication: Math.max(0, Math.min(10, Number(parsed.communication) || score)),
        relevance: Math.max(0, Math.min(10, Number(parsed.relevance) || score)),
        feedback: parsed.feedback || "Good explanation of the topic.",
        skill: parsed.skill || params.question.skill,
        difficultyRecommendation: rec,
        nextAction: parsed.nextAction || "Proceed to next question",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Clear answer structure"],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ["Could expand on edge cases"],
        keyMissedPoints: Array.isArray(parsed.keyMissedPoints) ? parsed.keyMissedPoints : [],
        modelAnswerSnippet: parsed.modelAnswerSnippet || ""
      };
      return { evaluation, source: "gemini" };
    } catch (err) {
      console.warn("Gemini API call failed for evaluation, falling back gracefully:", err?.message || err);
      const fallback = evaluateFallbackAnswer({
        question: params.question,
        candidateAnswer: params.candidateAnswer
      });
      return { evaluation: fallback, source: "fallback" };
    }
  }
  async generateReport(params) {
    const client = this.getClient(params.customApiKey);
    if (!client) {
      const fallback = generateFallbackReport({
        candidateName: params.candidateName,
        targetRole: params.targetRole,
        skills: params.skills,
        history: params.history,
        skillScores: params.skillScores
      });
      return { report: fallback, source: "fallback" };
    }
    try {
      const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4
        }
      });
      const prompt = buildFinalReportPrompt(params);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = parseGeminiJson(
        text,
        () => generateFallbackReport({
          candidateName: params.candidateName,
          targetRole: params.targetRole,
          skills: params.skills,
          history: params.history,
          skillScores: params.skillScores
        })
      );
      const validRecs = ["Strong Hire", "Hire", "Borderline", "Needs Improvement"];
      const finalRecommendation = validRecs.includes(parsed.finalRecommendation) ? parsed.finalRecommendation : parsed.overallScore >= 80 ? "Hire" : "Borderline";
      const finalReport = {
        candidateName: parsed.candidateName || params.candidateName,
        targetRole: parsed.targetRole || params.targetRole,
        date: parsed.date || (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        overallScore: Math.min(100, Math.max(0, Math.round(Number(parsed.overallScore) || 75))),
        technicalKnowledgeScore: Math.min(100, Math.max(0, Math.round(Number(parsed.technicalKnowledgeScore) || 75))),
        communicationScore: Math.min(100, Math.max(0, Math.round(Number(parsed.communicationScore) || 75))),
        problemSolvingScore: Math.min(100, Math.max(0, Math.round(Number(parsed.problemSolvingScore) || 75))),
        skillScores: parsed.skillScores || {},
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Solid foundational skills"],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ["Needs deeper practice with edge cases"],
        questionEvaluations: Array.isArray(parsed.questionEvaluations) && parsed.questionEvaluations.length > 0 ? parsed.questionEvaluations : params.history.map((h) => ({
          questionNumber: h.questionNumber,
          questionText: h.questionText,
          skill: h.skill,
          difficulty: h.difficulty,
          candidateAnswer: h.candidateAnswer,
          score: h.score,
          feedback: h.feedback
        })),
        recommendedTopics: Array.isArray(parsed.recommendedTopics) ? parsed.recommendedTopics : ["Core Computer Science Concepts"],
        personalizedImprovementPlan: Array.isArray(parsed.personalizedImprovementPlan) ? parsed.personalizedImprovementPlan : [],
        finalRecommendation,
        executiveSummary: parsed.executiveSummary || `${params.candidateName} completed the interview session with commendable effort.`
      };
      return { report: finalReport, source: "gemini" };
    } catch (err) {
      console.warn("Gemini API call failed for final report, falling back gracefully:", err?.message || err);
      const fallback = generateFallbackReport({
        candidateName: params.candidateName,
        targetRole: params.targetRole,
        skills: params.skills,
        history: params.history,
        skillScores: params.skillScores
      });
      return { report: fallback, source: "fallback" };
    }
  }
};
var geminiService = new GeminiInterviewService();

// server/index.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: "10mb" }));
function getHeaderApiKey(req) {
  const headerKey = req.headers["x-gemini-key"];
  if (typeof headerKey === "string" && headerKey.trim()) {
    return headerKey.trim();
  }
  return void 0;
}
var apiRouter = express.Router();
apiRouter.get("/health", (req, res) => {
  const headerKey = getHeaderApiKey(req);
  const hasEnvKey = geminiService.hasApiKey(headerKey);
  res.json({
    status: "ok",
    service: "InterviewPilot AI Engine",
    hasGeminiKey: hasEnvKey,
    model: "gemini-1.5-flash",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.post("/verify-gemini", async (req, res) => {
  try {
    const customKey = getHeaderApiKey(req) || req.body?.apiKey;
    const result = await geminiService.verifyConnection(customKey);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected error verifying Gemini API",
      error: error?.message || String(error)
    });
  }
});
apiRouter.post("/generate-question", async (req, res) => {
  try {
    const customApiKey = getHeaderApiKey(req);
    const {
      candidateName,
      targetRole,
      experienceLevel,
      interviewType,
      skills,
      questionNumber,
      totalQuestions,
      currentDifficulty,
      previousQuestions,
      weakSkills,
      focusSkill
    } = req.body;
    if (!candidateName || !targetRole || !skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: "Missing candidate details or skills list." });
    }
    const result = await geminiService.generateQuestion({
      candidateName,
      targetRole,
      experienceLevel: experienceLevel || "Fresher / MCA Student",
      interviewType: interviewType || "Technical",
      skills,
      questionNumber: Number(questionNumber) || 1,
      totalQuestions: Number(totalQuestions) || 5,
      currentDifficulty: currentDifficulty || "beginner",
      previousQuestions: previousQuestions || [],
      weakSkills: weakSkills || [],
      focusSkill,
      customApiKey
    });
    return res.json(result);
  } catch (error) {
    console.error("Error generating question:", error);
    return res.status(500).json({
      error: "Failed to generate question",
      message: error?.message || "Internal server error"
    });
  }
});
apiRouter.post("/evaluate-answer", async (req, res) => {
  try {
    const customApiKey = getHeaderApiKey(req);
    const {
      candidateName,
      targetRole,
      experienceLevel,
      question,
      candidateAnswer,
      previousWeakSkills
    } = req.body;
    if (!question || !question.text) {
      return res.status(400).json({ error: "Question data is required for evaluation." });
    }
    const result = await geminiService.evaluateAnswer({
      candidateName: candidateName || "Candidate",
      targetRole: targetRole || "Software Engineer",
      experienceLevel: experienceLevel || "Fresher",
      question,
      candidateAnswer: candidateAnswer || "",
      previousWeakSkills: previousWeakSkills || [],
      customApiKey
    });
    return res.json(result);
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return res.status(500).json({
      error: "Failed to evaluate answer",
      message: error?.message || "Internal server error"
    });
  }
});
apiRouter.post("/generate-report", async (req, res) => {
  try {
    const customApiKey = getHeaderApiKey(req);
    const {
      candidateName,
      targetRole,
      experienceLevel,
      interviewType,
      skills,
      history,
      skillScores
    } = req.body;
    if (!candidateName || !history || !Array.isArray(history)) {
      return res.status(400).json({ error: "Candidate name and history are required for report generation." });
    }
    const result = await geminiService.generateReport({
      candidateName,
      targetRole: targetRole || "Software Engineer",
      experienceLevel: experienceLevel || "Fresher",
      interviewType: interviewType || "Technical",
      skills: skills || ["General Computer Science"],
      history,
      skillScores: skillScores || {},
      customApiKey
    });
    return res.json(result);
  } catch (error) {
    console.error("Error generating final report:", error);
    return res.status(500).json({
      error: "Failed to generate final report",
      message: error?.message || "Internal server error"
    });
  }
});
app.use("/api", apiRouter);
app.use("/", apiRouter);
if (process.env.VERCEL !== "1") {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log(` InterviewPilot AI Server running on port ${PORT}`);
    console.log(` Gemini API Key status: ${geminiService.hasApiKey() ? "CONFIGURED (Live Gemini Active)" : "NOT FOUND (Using Adaptive Fallback Engine)"}`);
  });
}
var index_default = app;
export {
  index_default as default
};
