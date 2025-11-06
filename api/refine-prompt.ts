import { GoogleGenAI } from '@google/genai';

function cors(res: any, req: any) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const origin = req.headers.origin;
  const isAllowed = allowedOrigin === '*' || origin === allowedOrigin;
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? (origin || allowedOrigin) : allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: any, res: any) {
  cors(res, req);

  const sendJson = (code: number, obj: any) => {
    res.statusCode = code;
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(JSON.stringify(obj));
  };

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(405, { error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return sendJson(500, { error: 'Server misconfiguration: missing GEMINI_API_KEY' });
    }

    // Parse JSON body if not already parsed
    let body: any = req.body;
    if (!body) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const raw = Buffer.concat(chunks).toString('utf8');
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
    }

    const { filterName, originalPrompt, thumbsUpCount, thumbsDownCount, feedbackContext } = body || {};

    if (!filterName || typeof filterName !== 'string') {
      return sendJson(400, { error: 'Missing filterName' });
    }
    if (!originalPrompt || typeof originalPrompt !== 'string') {
      return sendJson(400, { error: 'Missing originalPrompt' });
    }

    const negativeRatio = (() => {
      const up = Number(thumbsUpCount || 0);
      const down = Number(thumbsDownCount || 0);
      const total = up + down;
      return total > 0 ? ((down / total) * 100).toFixed(1) : '0.0';
    })();

    const refinementPrompt = `You are an expert at crafting prompts for Gemini's image generation API.

A user has been using this art style prompt but it has received negative feedback:

FILTER NAME: ${filterName}
CURRENT PROMPT: ${originalPrompt}

FEEDBACK STATS:
- Thumbs Up: ${thumbsUpCount ?? 0}
- Thumbs Down: ${thumbsDownCount ?? 0}
- Negative Ratio: ${negativeRatio}%
${feedbackContext || ''}

Your task is to refine this prompt to produce better, more consistent results. Consider:
1. Is the prompt too complex or vague?
2. Does it contain words that might trigger safety filters?
3. Could the style description be more specific and clear?
4. Are there conflicting instructions?
5. Would simpler, more direct language work better?
${feedbackContext ? '6. Address the specific user-reported issues listed above' : ''}

Provide ONLY the improved prompt text. Do not include explanations or meta-commentary. The prompt should:
- Be clear and specific about the desired art style
- Avoid potentially triggering words (people, person, face, body, transform, convert)
- Use positive descriptions (what TO include) rather than negative (what to avoid)
- Be concise but descriptive
- Work well with the Gemini image generation API
${feedbackContext ? '- Specifically address the user-reported issues' : ''}

REFINED PROMPT:`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [{ text: refinementPrompt }] },
    });

    const refinedPrompt = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!refinedPrompt) {
      return sendJson(422, { error: 'AI did not return a refined prompt' });
    }

    return sendJson(200, { prompt: refinedPrompt });
  } catch (err: any) {
    console.error('Server error in /api/refine-prompt:', err);
    return sendJson(500, { error: err?.message || 'Internal Server Error' });
  }
}
