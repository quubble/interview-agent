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

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    body = body || {};

    const customKey = getHeaderApiKey(req.headers || {}) || body.apiKey;
    const result = await geminiService.verifyConnection(customKey);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Unexpected error verifying Gemini API',
      error: error?.message || String(error),
    });
  }
}
