import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

function parseDotEnv(contents) {
  const out = {};
  const lines = contents.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function loadEnvFallback() {
  const candidates = ['.env.local', '.env'];
  for (const rel of candidates) {
    const full = path.join(PROJECT_ROOT, rel);
    try {
      const contents = await fs.readFile(full, 'utf8');
      const parsed = parseDotEnv(contents);
      for (const [k, v] of Object.entries(parsed)) {
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      // ignore
    }
  }
}

function getArgValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (!hit) return null;
  return hit.slice(prefix.length);
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function pickInlineImageBase64(response) {
  const candidate = response?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  for (const part of parts) {
    if (part?.inlineData?.data) return part.inlineData.data;
  }
  return null;
}

function decodeBase64ToBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

async function generateBaseImage(ai, outBasePath) {
  const basePrompt =
    'Create a clean, high-end, studio portrait photograph of a single person (NOT a celebrity). ' +
    'Framing: shoulders-up, centered, facing camera, neutral expression. ' +
    'Lighting: soft diffused key light, subtle fill, natural skin tones, no harsh shadows. ' +
    'Background: simple neutral gray seamless backdrop. ' +
    'Wardrobe: simple solid-color shirt, no logos, no text. ' +
    'Quality: extremely sharp, professional camera, realistic photography, no artistic filters.';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: basePrompt }] },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
  });

  const base64 = pickInlineImageBase64(response);
  if (!base64) {
    throw new Error('Base image generation returned no image data.');
  }

  await fs.writeFile(outBasePath, decodeBase64ToBuffer(base64));
}

async function stylizeFromBase(ai, baseImageBase64, mimeType, prompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: baseImageBase64, mimeType } },
        { text: prompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
  });

  const outBase64 = pickInlineImageBase64(response);
  if (!outBase64) {
    throw new Error('Stylization returned no image data (possibly blocked).');
  }
  return outBase64;
}

async function main() {
  await loadEnvFallback();

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!apiKey) throw new Error('Missing GEMINI_API_KEY (or VITE_GEMINI_API_KEY)');
  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL');
  if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

  const limitArg = getArgValue('limit');
  const limit = limitArg ? Number(limitArg) : null;
  const force = hasFlag('force');

  const baseInputPathArg = getArgValue('base');
  const basePromptOverride = getArgValue('basePrompt');
  const modelOverride = getArgValue('model');
  const outExt = 'png';

  const outDir = path.join(PROJECT_ROOT, 'public', 'style-examples');
  await ensureDir(outDir);

  const sourceDir = path.join(PROJECT_ROOT, 'public', 'style-examples-source');
  await ensureDir(sourceDir);

  const basePath = path.join(outDir, `base.${outExt}`);
  const sourceBasePath = path.join(sourceDir, `base.${outExt}`);

  const ai = new GoogleGenAI({ apiKey });

  const model = modelOverride || 'gemini-2.5-flash-image';

  const defaultBasePrompt =
    'Create a clean, high-end studio photograph of a single person (NOT a celebrity) designed for a WIDE UI THUMBNAIL. ' +
    'COMPOSITION: ultra-wide banner framing with a 2:1 aspect ratio look (wide rectangle). ' +
    'SUBJECT PLACEMENT: subject centered with generous left/right padding; keep the entire head and shoulders comfortably inside a safe area (no cropping at top/sides). ' +
    'POSE: facing camera, neutral expression. ' +
    'LIGHTING: soft diffused key light, subtle fill, natural skin tones, no harsh shadows. ' +
    'BACKGROUND: simple neutral gray seamless backdrop, uncluttered. ' +
    'WARDROBE: simple solid-color shirt, no logos, no text. ' +
    'QUALITY: extremely sharp, professional camera, realistic photography, no artistic filters, no added text.';

  async function writeBaseFromUserPath(userPath) {
    const resolved = path.isAbsolute(userPath) ? userPath : path.join(PROJECT_ROOT, userPath);
    const buf = await fs.readFile(resolved);
    await fs.writeFile(basePath, buf);
    await fs.writeFile(sourceBasePath, buf);
  }

  if (baseInputPathArg) {
    console.log('Using provided base image:', baseInputPathArg);
    await writeBaseFromUserPath(baseInputPathArg);
    console.log('Base image written:', basePath);
    console.log('Source base image written:', sourceBasePath);
  } else if (!force && (await fileExists(sourceBasePath))) {
    console.log('Using existing source base image:', sourceBasePath);
    const buf = await fs.readFile(sourceBasePath);
    await fs.writeFile(basePath, buf);
    console.log('Base image written:', basePath);
  } else if (force || !(await fileExists(basePath))) {
    console.log('Generating base image...');

    const promptToUse = basePromptOverride || defaultBasePrompt;

    const r = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: promptToUse }] },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const base64 = pickInlineImageBase64(r);
    if (!base64) throw new Error('Base image generation returned no image data.');
    const buf = decodeBase64ToBuffer(base64);
    await fs.writeFile(basePath, buf);
    await fs.writeFile(sourceBasePath, buf);

    console.log('Base image written:', basePath);
    console.log('Source base image written:', sourceBasePath);
  } else {
    console.log('Base image already exists, skipping:', basePath);
  }

  const baseBuf = await fs.readFile(basePath);
  const baseImageBase64 = baseBuf.toString('base64');
  const mimeType = 'image/png';

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('style_prompts')
    .select('filter_id, filter_name, current_prompt')
    .order('filter_id', { ascending: true });

  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  const selectedRows = typeof limit === 'number' && Number.isFinite(limit) ? rows.slice(0, limit) : rows;

  const manifest = {
    base: `/style-examples/base.${outExt}`,
    styles: {},
  };

  for (const row of selectedRows) {
    const filterId = row.filter_id;
    const filterName = row.filter_name;
    const stylePrompt = row.current_prompt;

    const outAfterPath = path.join(outDir, `${filterId}-after.${outExt}`);

    if (!force && (await fileExists(outAfterPath))) {
      console.log(`Skipping ${filterId} (exists)`);
      manifest.styles[filterId] = {
        name: filterName,
        after: `/style-examples/${filterId}-after.${outExt}`,
      };
      continue;
    }

    console.log(`Generating: ${filterId} (${filterName})`);

    const composedPrompt =
      'You are generating a small UI thumbnail for a style preview.\n' +
      'CRITICAL CONSISTENCY RULES (do not break):\n' +
      '- Keep EXACT same person identity, face geometry, age, pose, framing, camera angle, background layout.\n' +
      '- Do NOT add text, logos, watermarks, frames, stickers, borders.\n' +
      '- Do NOT change hairstyle length, facial hair, or clothing silhouette; only change rendering/materials consistent with the style.\n' +
      '- No extra props or scene changes; keep background simple.\n' +
      '- Output ONE image.\n\n' +
      `STYLE TO APPLY:\n${stylePrompt}`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: baseImageBase64, mimeType } },
            { text: composedPrompt },
          ],
        },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      const outBase64 = pickInlineImageBase64(response);
      if (!outBase64) {
        throw new Error('Stylization returned no image data (possibly blocked).');
      }
      await fs.writeFile(outAfterPath, decodeBase64ToBuffer(outBase64));

      manifest.styles[filterId] = {
        name: filterName,
        after: `/style-examples/${filterId}-after.${outExt}`,
      };

      console.log(`Wrote: ${outAfterPath}`);
    } catch (e) {
      console.error(`Failed ${filterId}:`, e?.message || e);
    }
  }

  const manifestPath = path.join(outDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Manifest written:', manifestPath);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
