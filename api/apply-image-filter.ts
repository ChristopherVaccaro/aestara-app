import { GoogleGenAI, Modality } from '@google/genai';

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

    const { imageBase64, mimeType, prompt } = body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return sendJson(400, { error: 'Missing imageBase64' });
    }
    if (!prompt || typeof prompt !== 'string') {
      return sendJson(400, { error: 'Missing prompt' });
    }
    if (!mimeType || typeof mimeType !== 'string' || !mimeType.startsWith('image/')) {
      return sendJson(400, { error: 'Invalid or missing mimeType' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Use Gemini 2.5 Flash Image model (Nano Banana) for image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return sendJson(200, { imageBase64: part.inlineData.data });
        }
      }
    }

    let errorMessage = 'API did not return an image. The content may have been blocked.';
    if (candidate?.finishReason) {
      errorMessage += ` Reason: ${candidate.finishReason}.`;
    }
    return sendJson(422, { error: errorMessage });
  } catch (err: any) {
    console.error('Server error in /api/apply-image-filter:', err);
    return sendJson(500, { error: err?.message || 'Internal Server Error' });
  }
}
