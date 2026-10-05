import { geminiService } from './lib/gemini';

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
      question,
      candidateAnswer,
      previousWeakSkills,
    } = body;

    if (!question || !question.text) {
      return res.status(400).json({ error: 'Question data is required for evaluation.' });
    }

    const result = await geminiService.evaluateAnswer({
      candidateName: candidateName || 'Candidate',
      targetRole: targetRole || 'Software Engineer',
      experienceLevel: experienceLevel || 'Fresher',
      question,
      candidateAnswer: candidateAnswer || '',
      previousWeakSkills: previousWeakSkills || [],
      customApiKey,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in /api/evaluate-answer:', error);
    return res.status(500).json({
      error: 'Failed to evaluate answer',
      message: error?.message || 'Internal server error',
    });
  }
}
