import { geminiService } from '../server/gemini';

function getHeaderApiKey(headers: any): string | undefined {
  const headerKey = headers['x-gemini-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  return undefined;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    body = body || {};

    const customApiKey = getHeaderApiKey(req.headers || {});
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
      focusSkill,
    } = body;

    if (!candidateName || !targetRole || !skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Missing candidate details or skills list.' });
    }

    const result = await geminiService.generateQuestion({
      candidateName,
      targetRole,
      experienceLevel: experienceLevel || 'Fresher / MCA Student',
      interviewType: interviewType || 'Technical',
      skills,
      questionNumber: Number(questionNumber) || 1,
      totalQuestions: Number(totalQuestions) || 5,
      currentDifficulty: currentDifficulty || 'beginner',
      previousQuestions: previousQuestions || [],
      weakSkills: weakSkills || [],
      focusSkill,
      customApiKey,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in /api/generate-question:', error);
    return res.status(500).json({
      error: 'Failed to generate question',
      message: error?.message || 'Internal server error',
    });
  }
}
