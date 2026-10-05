import { DifficultyLevel, AnswerEvaluation, FinalAssessmentReport } from './types';

interface FallbackQuestionItem {
  skill: string;
  difficulty: DifficultyLevel;
  text: string;
  intent: string;
  keyConcepts: string[];
}

const QUESTION_BANK: FallbackQuestionItem[] = [
  // Data Structures
  {
    skill: 'Data Structures',
    difficulty: 'beginner',
    text: 'Can you explain the key differences between an Array and a Linked List, specifically highlighting memory allocation and element access times?',
    intent: 'Assess understanding of basic memory layout and Big-O access complexity.',
    keyConcepts: ['contiguous memory', 'pointer overhead', 'O(1) access', 'O(n) search']
  },
  {
    skill: 'Data Structures',
    difficulty: 'intermediate',
    text: 'How does a Hash Table handle collisions, and what is the difference between Separate Chaining and Open Addressing?',
    intent: 'Evaluate collision resolution strategies and load factor impact on amortized O(1) performance.',
    keyConcepts: ['hash collisions', 'separate chaining', 'linear probing', 'load factor', 'rehashing']
  },
  {
    skill: 'Data Structures',
    difficulty: 'advanced',
    text: 'Explain the self-balancing mechanism in an AVL Tree or Red-Black Tree. In what scenarios would you prefer a Red-Black Tree over an AVL Tree in production systems?',
    intent: 'Assess self-balancing binary search trees, rotation costs, and read-heavy vs write-heavy trade-offs.',
    keyConcepts: ['tree rotations', 'balance factor', 'coloring rules', 'lookup speed vs insertion cost']
  },

  // Algorithms
  {
    skill: 'Algorithms',
    difficulty: 'beginner',
    text: 'What is the difference between Linear Search and Binary Search? What precondition must be met for Binary Search to work?',
    intent: 'Test basic searching algorithms, prerequisite conditions, and logarithmic vs linear scaling.',
    keyConcepts: ['sorted array', 'O(log n)', 'O(n)', 'divide and conquer']
  },
  {
    skill: 'Algorithms',
    difficulty: 'intermediate',
    text: 'Explain the concept of Dynamic Programming and how memoization differs from tabulation with a concrete example (like Fibonacci or Coin Change).',
    intent: 'Assess overlapping subproblems, optimal substructure, and top-down vs bottom-up space/time trade-offs.',
    keyConcepts: ['overlapping subproblems', 'optimal substructure', 'memoization top-down', 'tabulation bottom-up']
  },
  {
    skill: 'Algorithms',
    difficulty: 'advanced',
    text: 'Describe Dijkstra’s Algorithm for finding the shortest path in a weighted graph. Why does it fail when negative weight edges exist, and what algorithm would you use instead?',
    intent: 'Evaluate graph traversal mechanics, greedy assumptions, Bellman-Ford alternative, and min-heap efficiency.',
    keyConcepts: ['greedy choice', 'priority queue', 'negative edge cycles', 'Bellman-Ford', 'relaxation']
  },

  // DBMS / SQL
  {
    skill: 'DBMS',
    difficulty: 'beginner',
    text: 'What are the ACID properties in database management systems? Explain what each letter stands for with a simple real-world banking example.',
    intent: 'Assess core transaction integrity principles.',
    keyConcepts: ['atomicity', 'consistency', 'isolation', 'durability', 'commit rollback']
  },
  {
    skill: 'SQL',
    difficulty: 'intermediate',
    text: 'Explain the difference between Clustered and Non-Clustered Indexes in a relational database. How does a B+ Tree structure accelerate query execution?',
    intent: 'Assess storage page layout, physical ordering, pointer lookups, and range query efficiency.',
    keyConcepts: ['physical order', 'leaf nodes', 'secondary index', 'B+ tree depth', 'index seek vs scan']
  },
  {
    skill: 'DBMS',
    difficulty: 'advanced',
    text: 'What are the four SQL transaction isolation levels? Explain what Dirty Reads, Non-Repeatable Reads, and Phantom Reads are, and how each level prevents them.',
    intent: 'Evaluate concurrency anomalies, locks, MVCC (Multi-Version Concurrency Control), and throughput trade-offs.',
    keyConcepts: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable', 'MVCC', 'phantom reads']
  },

  // Operating Systems
  {
    skill: 'Operating Systems',
    difficulty: 'beginner',
    text: 'What is the primary difference between a Process and a Thread? How do they differ in terms of memory space and context switching overhead?',
    intent: 'Assess OS execution units, PCB vs TCB, and shared memory versus isolated address space.',
    keyConcepts: ['address space isolation', 'shared heap', 'thread stack', 'context switch cost']
  },
  {
    skill: 'Operating Systems',
    difficulty: 'intermediate',
    text: 'What is a Deadlock, what are the four Coffman conditions necessary for a deadlock to occur, and how can an OS prevent or avoid it?',
    intent: 'Assess mutual exclusion, hold and wait, no preemption, circular wait, and Banker’s Algorithm.',
    keyConcepts: ['mutual exclusion', 'hold and wait', 'circular wait', 'Bankers algorithm', 'resource allocation graph']
  },
  {
    skill: 'Operating Systems',
    difficulty: 'advanced',
    text: 'Explain Virtual Memory management. How do the MMU, Page Tables, TLB (Translation Lookaside Buffer), and Page Fault handling work together during an address translation?',
    intent: 'Evaluate hardware-OS interaction, physical frame mapping, TLB miss handling, and demand paging.',
    keyConcepts: ['MMU', 'TLB cache hit/miss', 'page table walk', 'page fault interrupt', 'swapping']
  },

  // Computer Networks
  {
    skill: 'Computer Networks',
    difficulty: 'beginner',
    text: 'Explain the difference between TCP and UDP protocols. When would a software engineer choose UDP over TCP?',
    intent: 'Assess transport layer fundamentals: connection-oriented vs connectionless, reliability vs latency.',
    keyConcepts: ['three-way handshake', 'acknowledgment and retransmission', 'packet ordering', 'UDP speed/streaming']
  },
  {
    skill: 'Computer Networks',
    difficulty: 'intermediate',
    text: 'Walk me through what happens under the hood when a user types "https://example.com" into a web browser and presses Enter until the webpage renders.',
    intent: 'Assess holistic networking stack: DNS lookup, TCP handshake, TLS negotiation, HTTP request/response, DOM rendering.',
    keyConcepts: ['DNS resolution', 'TLS certificate verification', 'HTTP/2 / HTTP/3', 'browser rendering engine']
  },

  // OOP
  {
    skill: 'OOP',
    difficulty: 'beginner',
    text: 'What are the four pillars of Object-Oriented Programming? Give a brief code example or concept illustration for Polymorphism.',
    intent: 'Evaluate fundamental OO abstractions, encapsulation, inheritance, polymorphism.',
    keyConcepts: ['encapsulation', 'abstraction', 'inheritance', 'polymorphism', 'method overriding/overloading']
  },
  {
    skill: 'OOP',
    difficulty: 'intermediate',
    text: 'Explain the SOLID principles of object-oriented design. Pick the Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP) to explain in detail.',
    intent: 'Assess clean code architecture, loose coupling, interfaces, and maintainable software engineering practices.',
    keyConcepts: ['single responsibility', 'open closed', 'liskov substitution', 'interface segregation', 'dependency inversion']
  },

  // Python
  {
    skill: 'Python',
    difficulty: 'beginner',
    text: 'Explain the difference between mutable and immutable data types in Python. Give two examples of each, and explain what happens when passing them to functions.',
    intent: 'Assess Python memory model, pass-by-object-reference, and common mutation pitfalls.',
    keyConcepts: ['lists vs tuples', 'strings are immutable', 'object id', 'default mutable arguments']
  },
  {
    skill: 'Python',
    difficulty: 'beginner',
    text: 'What are list comprehensions in Python, and how do they differ in syntax, performance, and readability from traditional for-loops?',
    intent: 'Assess basic Pythonic syntax, bytecode optimization, and readability best practices.',
    keyConcepts: ['list comprehension', 'syntax brevity', 'C-level loop speed', 'readability vs complexity']
  },
  {
    skill: 'Python',
    difficulty: 'intermediate',
    text: 'What is the Global Interpreter Lock (GIL) in CPython, and how does it impact multi-threaded CPU-bound versus I/O-bound Python programs?',
    intent: 'Evaluate Python concurrency limitations, multiprocessing vs threading vs asyncio.',
    keyConcepts: ['GIL mutex', 'single core execution for bytecode', 'multiprocessing bypass', 'asyncio event loop']
  },
  {
    skill: 'Python',
    difficulty: 'intermediate',
    text: 'Explain how Python decorators work under the hood. How would you write a decorator that measures and logs the execution time of a function?',
    intent: 'Assess higher-order functions, closures, functools.wraps, and wrapper execution.',
    keyConcepts: ['closures', 'first-class functions', 'functools wraps', 'wrapper function arguments']
  },
  {
    skill: 'Python',
    difficulty: 'advanced',
    text: 'How does CPython manage memory under the hood? Explain Reference Counting, Cyclic Garbage Collection (generations 0, 1, 2), and how `__slots__` reduces memory overhead.',
    intent: 'Evaluate deep Python internals, memory allocation, circular references, and micro-optimizations.',
    keyConcepts: ['PyObject reference count', 'cyclic garbage collector', 'tri-color generation', '__slots__ dict avoidance']
  },
  {
    skill: 'Python',
    difficulty: 'advanced',
    text: 'Explain asynchronous programming in Python using `asyncio`. How does the event loop schedule coroutines, and how do `await`, `asyncio.gather()`, and `asyncio.create_task()` prevent blocking?',
    intent: 'Assess asynchronous concurrency, cooperative multitasking, task futures, and event loop scheduling.',
    keyConcepts: ['event loop', 'coroutine generator', 'cooperative multitasking', 'asyncio.create_task', 'non-blocking IO']
  },

  // Problem Solving
  {
    skill: 'Problem Solving',
    difficulty: 'intermediate',
    text: 'Tell me about a challenging technical bug or project hurdle you faced during your MCA/degree projects. How did you diagnose it, what trade-offs did you consider, and what was the outcome?',
    intent: 'STAR method situational evaluation: Situation, Task, Action, Result, and problem-solving methodology.',
    keyConcepts: ['root cause analysis', 'systematic debugging', 'trade-offs', 'measurable outcome']
  }
];

export function getFallbackQuestion(params: {
  skills: string[];
  currentDifficulty: DifficultyLevel;
  questionNumber: number;
  askedQuestions: string[];
  weakSkills: string[];
  interviewType: string;
}): {
  id: string;
  questionNumber: number;
  text: string;
  skill: string;
  difficulty: DifficultyLevel;
  intent: string;
} {
  const normalizedCandidateSkills = params.skills.map(s => s.toLowerCase().trim());
  
  let targetSkillCandidates = QUESTION_BANK.filter(q => {
    const qSkill = q.skill.toLowerCase();
    const matchesSkill = normalizedCandidateSkills.some(s => s.includes(qSkill) || qSkill.includes(s));
    const alreadyAsked = params.askedQuestions.some(prev => prev.toLowerCase().includes(q.text.toLowerCase().slice(0, 25)));
    return matchesSkill && !alreadyAsked;
  });

  if (params.weakSkills && params.weakSkills.length > 0) {
    const weakCandidates = targetSkillCandidates.filter(q =>
      params.weakSkills.some(ws => ws.toLowerCase() === q.skill.toLowerCase())
    );
    if (weakCandidates.length > 0) {
      targetSkillCandidates = weakCandidates;
    }
  }

  if (targetSkillCandidates.length === 0) {
    targetSkillCandidates = QUESTION_BANK.filter(q => 
      !params.askedQuestions.some(prev => prev.toLowerCase().includes(q.text.toLowerCase().slice(0, 25)))
    );
  }

  let selected = targetSkillCandidates.find(q => q.difficulty === params.currentDifficulty);
  if (!selected && targetSkillCandidates.length > 0) {
    selected = targetSkillCandidates[0];
  }

  if (!selected) {
    const chosenSkill = params.skills[params.questionNumber % params.skills.length] || 'Problem Solving';
    selected = {
      skill: chosenSkill,
      difficulty: params.currentDifficulty,
      text: `In the context of ${chosenSkill}, how would you approach architecting a scalable, fault-tolerant solution when designing a high-traffic system?`,
      intent: `Assess engineering design principles, bottlenecks, and error handling in ${chosenSkill}.`,
      keyConcepts: ['scalability', 'fault tolerance', 'modularity', 'monitoring']
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

export function evaluateFallbackAnswer(params: {
  question: { text: string; skill: string; difficulty: DifficultyLevel; intent?: string };
  candidateAnswer: string;
}): AnswerEvaluation {
  const answer = params.candidateAnswer.trim();
  const wordCount = answer ? answer.split(/\s+/).length : 0;
  
  let correctness = 6;
  let technicalDepth = 6;
  let communication = 6;
  let relevance = 6;

  const lowerAnswer = answer.toLowerCase();
  const isPoorPhrasing = lowerAnswer.includes("don't know") ||
    lowerAnswer.includes("not sure") ||
    lowerAnswer.includes("no idea") ||
    lowerAnswer.includes("forget") ||
    lowerAnswer.includes("skip");

  if (wordCount < 18 || isPoorPhrasing) {
    correctness = 3.5;
    technicalDepth = 2.5;
    communication = 3.5;
    relevance = 4.0;
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

  const overallScore = Number(((correctness * 0.35) + (technicalDepth * 0.35) + (communication * 0.15) + (relevance * 0.15)).toFixed(1));

  let difficultyRecommendation: 'increase' | 'maintain' | 'reduce' = 'maintain';
  if (overallScore >= 8) {
    difficultyRecommendation = 'increase';
  } else if (overallScore < 5) {
    difficultyRecommendation = 'reduce';
  }

  let nextAction = `Continue probing ${params.question.skill} or pivot to related architectural foundations.`;
  if (difficultyRecommendation === 'increase') {
    nextAction = `Candidate demonstrated mastery in ${params.question.skill}. Escalate to complex edge-cases and distributed trade-offs.`;
  } else if (difficultyRecommendation === 'reduce') {
    nextAction = `Candidate struggled with core concepts in ${params.question.skill}. Step down to fundamental primitives and baseline terminology.`;
  }

  return {
    score: overallScore,
    correctness,
    technicalDepth,
    communication,
    relevance,
    feedback: wordCount < 20 
      ? `Your answer was brief and missed core engineering details for ${params.question.skill}. Elaborate more on technical mechanisms and trade-offs.`
      : `Solid response explaining ${params.question.skill}. You clearly communicated the core principles; adding concrete code syntax or edge-case handling would elevate it even further.`,
    skill: params.question.skill,
    difficultyRecommendation,
    nextAction,
    strengths: wordCount >= 30 ? ['Clear conceptual definition', 'Good communication structure'] : ['Attempted the question'],
    weaknesses: wordCount < 40 ? ['Lacked detailed algorithmic/architectural depth', 'Omitted time/space complexity'] : ['Could discuss production corner cases'],
    keyMissedPoints: ['Underlying memory allocations', 'Practical boundary condition handling'],
    modelAnswerSnippet: `An optimal answer clearly highlights the fundamental definitions, time/space complexities, real-world trade-offs, and boundary considerations for ${params.question.skill}.`
  };
}

export function generateFallbackReport(params: {
  candidateName: string;
  targetRole: string;
  skills: string[];
  history: {
    questionNumber: number;
    questionText: string;
    skill: string;
    difficulty: DifficultyLevel;
    candidateAnswer: string;
    score: number;
    feedback: string;
  }[];
  skillScores: Record<string, { averageScore: number; attempts: number }>;
}): FinalAssessmentReport {
  const scores = params.history.map(h => h.score);
  const avgScore10 = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 7;
  const overallScore = Math.min(100, Math.max(0, Math.round(avgScore10 * 10)));

  const technicalKnowledgeScore = Math.min(100, Math.round(overallScore * 0.95 + 3));
  const communicationScore = Math.min(100, Math.round(overallScore * 0.92 + 6));
  const problemSolvingScore = Math.min(100, Math.round(overallScore * 0.9 + 5));

  const skillScores: Record<string, number> = {};
  for (const [skill, data] of Object.entries(params.skillScores)) {
    skillScores[skill] = Math.min(100, Math.round(data.averageScore * 10));
  }

  let finalRecommendation: 'Strong Hire' | 'Hire' | 'Borderline' | 'Needs Improvement' = 'Hire';
  if (overallScore >= 85) finalRecommendation = 'Strong Hire';
  else if (overallScore >= 70) finalRecommendation = 'Hire';
  else if (overallScore >= 55) finalRecommendation = 'Borderline';
  else finalRecommendation = 'Needs Improvement';

  const weakSkillsList: string[] = [];
  const strongSkillsList: string[] = [];
  for (const [skill, data] of Object.entries(params.skillScores)) {
    if (data.averageScore < 6) weakSkillsList.push(skill);
    else if (data.averageScore >= 8) strongSkillsList.push(skill);
  }

  const dynamicWeaknesses: string[] = [];
  if (weakSkillsList.length > 0) {
    dynamicWeaknesses.push(
      `Identified conceptual gaps in ${weakSkillsList.join(' and ')} fundamentals (requires focused revision).`
    );
  }
  dynamicWeaknesses.push('Needs deeper familiarity with production edge cases and error handling.');
  dynamicWeaknesses.push('Could provide more concrete code examples and time/space complexity analysis.');

  const dynamicStrengths: string[] = [];
  if (strongSkillsList.length > 0) {
    dynamicStrengths.push(
      `Demonstrated strong grasp and clear articulation in ${strongSkillsList.join(' and ')}.`
    );
  }
  dynamicStrengths.push('Articulate communication with structured answers.');
  dynamicStrengths.push('Capable of breaking down multi-step technical questions.');

  const improvementPlan = [
    ...(weakSkillsList.map(ws => ({
      area: `${ws} Domain Fundamentals`,
      recommendation: `Deep dive into ${ws} core architecture, practical syntax, and common interview patterns.`,
      suggestedAction: `Build a dedicated mini-project and solve foundational problems in ${ws}.`,
      priority: 'High' as const
    }))),
    {
      area: 'Core Fundamentals & Edge Cases',
      recommendation: 'Practice explaining internal data structure layouts on a whiteboard or out loud.',
      suggestedAction: 'Implement custom hash tables with separate chaining and open addressing in code.',
      priority: 'Medium' as const
    },
    {
      area: 'System Design & Trade-Offs',
      recommendation: 'Deepen understanding of horizontal vs vertical scaling and caching layers.',
      suggestedAction: 'Study real-world case studies of URL shorteners and notification services.',
      priority: 'Medium' as const
    }
  ];

  return {
    candidateName: params.candidateName,
    targetRole: params.targetRole,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    overallScore,
    technicalKnowledgeScore,
    communicationScore,
    problemSolvingScore,
    skillScores,
    strengths: dynamicStrengths,
    weaknesses: dynamicWeaknesses,
    questionEvaluations: params.history.map(h => ({
      questionNumber: h.questionNumber,
      questionText: h.questionText,
      skill: h.skill,
      difficulty: h.difficulty,
      candidateAnswer: h.candidateAnswer,
      score: h.score,
      feedback: h.feedback,
      keyMissedPoints: ['Underlying memory implications', 'Edge case boundary conditions']
    })),
    recommendedTopics: [
      'Database Indexing internals (B+ Trees & Hash Indexes)',
      'Concurrency, Race Conditions, and Mutex Locks in OS',
      'Dynamic Programming & Greedy Algorithm optimizations',
      'System Design fundamentals: Caching, Load Balancing, and Sharding'
    ],
    personalizedImprovementPlan: improvementPlan,
    finalRecommendation,
    executiveSummary: `${params.candidateName} displayed strong potential for the ${params.targetRole} position, demonstrating solid foundational competencies across core computer science domains with professional technical articulation.`
  };
}
