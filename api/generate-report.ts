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
      history,
      skillScores,
    } = body;

    if (!candidateName || !history || !Array.isArray(history)) {
      return res.status(400).json({ error: 'Candidate name and history are required for report generation.' });
    }

    const result = await geminiService.generateReport({
      candidateName,
      targetRole: targetRole || 'Software Engineer',
      experienceLevel: experienceLevel || 'Fresher',
      interviewType: interviewType || 'Technical',
      skills: skills || ['General Computer Science'],
      history,
      skillScores: skillScores || {},
      customApiKey,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in /api/generate-report:', error);
    return res.status(500).json({
      error: 'Failed to generate final report',
      message: error?.message || 'Internal server error',
    });
  }
}
