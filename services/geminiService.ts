import { logger } from "../utils/logger";
const API_BASE = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_BASE : '') || '';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (result && result.includes(',')) {
        resolve(result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file data correctly."));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file."));
    reader.readAsDataURL(file);
  });

  // Ensure we have a valid MIME type for the API
  let mimeType = file.type;
  if (!mimeType || !mimeType.startsWith('image/')) {
    // Default to JPEG if MIME type is missing or invalid
    mimeType = 'image/jpeg';
  }

  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType },
  };
};

// Helper function to simplify prompt by removing potentially triggering phrases
// while preserving structured prompt content
const simplifyPrompt = (prompt: string): string => {
  // Replace potentially triggering words but keep structure
  let simplified = prompt
    .replace(/people|person|face|faces|body|bodies|subject|subjects/gi, 'element')
    .replace(/transform|convert|recreate|redraw/gi, 'apply style to')
    .replace(/into a|into the/gi, 'with');
  
  // For structured prompts (with ASPECT - descriptions), keep key aspects
  // Extract and keep main style aspects while removing detailed descriptions
  if (simplified.includes('AVOID') || simplified.includes('AIM FOR')) {
    // Keep structure but simplify descriptions
    simplified = simplified
      .replace(/\([^)]*\)/g, '') // Remove parenthetical references
      .split('AVOID')[0] // Remove AVOID and AIM FOR sections on retry
      .split('.')
      .filter(s => s.trim().length > 0)
      .slice(0, 8) // Keep more key aspects (up to 8 instead of 3)
      .join('. ') + '.';
  } else {
    // For simple prompts, keep first 3 sentences
    simplified = simplified.split('.').slice(0, 3).join('.');
  }
  
  return simplified;
};

/**
 * Refine a prompt that has received negative feedback
 * Uses Gemini to analyze and improve the prompt based on common issues
 * Now includes specific user-reported issues from feedback tags
 */
export const refinePrompt = async (
  filterName: string,
  originalPrompt: string,
  thumbsUpCount: number,
  thumbsDownCount: number,
  feedbackContext: string = ''
): Promise<string> => {
  try {
    const res = await fetch(`${API_BASE}/api/refine-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterName,
        originalPrompt,
        thumbsUpCount,
        thumbsDownCount,
        feedbackContext,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Failed to refine prompt');
    }
    const data = await res.json();
    const refinedPrompt = (data?.prompt || '').trim();
    if (!refinedPrompt) {
      throw new Error('No refined prompt received');
    }
    logger.log(`✨ Prompt refined for ${filterName}:`, {
      original: originalPrompt.substring(0, 100) + '...',
      refined: refinedPrompt.substring(0, 100) + '...',
    });
    return refinedPrompt;
  } catch (error) {
    logger.error('Error refining prompt:', error);
    throw error;
  }
};

export const applyImageFilter = async (
  imageFile: File,
  prompt: string,
  options?: { retryCount?: number }
): Promise<string> => {
  try {
    const retryCount = options?.retryCount ?? 0;

    const imagePart = await fileToGenerativePart(imageFile);
    // Use simplified prompt on retry
    const finalPrompt = retryCount > 0 ? simplifyPrompt(prompt) : prompt;
    
    if (retryCount > 0) {
      logger.log('Using simplified prompt due to safety filter:', finalPrompt);
    }

    const res = await fetch(`${API_BASE}/api/apply-image-filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: (imagePart.inlineData as any).data,
        mimeType: (imagePart.inlineData as any).mimeType,
        prompt: finalPrompt,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Retry path on safety/prohibited errors is handled server-side; here we only surface message
      throw new Error(err?.error || 'Failed to apply filter');
    }

    const data = await res.json();
    const out = data?.imageBase64 as string | undefined;
    if (!out) {
      logger.warn('⚠️ API returned no image data');
      throw new Error("The style could not be applied to this image. This may happen with: 1) Images containing people/faces for certain styles, 2) Low quality images, 3) Complex compositions.");
    }
    return out;

  } catch (error) {
    logger.error("Error applying filter with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to apply filter: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image stylization.");
  }
};