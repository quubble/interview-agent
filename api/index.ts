import { geminiService } from './lib/gemini';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const headerKey = req.headers ? req.headers['x-gemini-key'] : undefined;
  const hasEnvKey = geminiService.hasApiKey(headerKey);

  return res.status(200).json({
    status: 'ok',
    service: 'InterviewPilot AI Engine (Vercel Serverless)',
    hasGeminiKey: hasEnvKey,
    model: 'gemini-1.5-flash',
    timestamp: new Date().toISOString(),
  });
}
