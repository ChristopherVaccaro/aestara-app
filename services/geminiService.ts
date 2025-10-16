import { GoogleGenAI, Modality } from "@google/genai";
import { logger } from "../utils/logger";

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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

export const applyImageFilter = async (imageFile: File, prompt: string, retryCount: number = 0): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    // Use simplified prompt on retry
    const finalPrompt = retryCount > 0 ? simplifyPrompt(prompt) : prompt;
    
    if (retryCount > 0) {
      logger.log('Using simplified prompt due to safety filter:', finalPrompt);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          imagePart,
          { text: finalPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidate = response?.candidates?.[0];

    // Safely access parts and check for image data
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data; // Return base64 image data
        }
      }
    }

    // If no image is returned, check if we should retry
    if (candidate?.finishReason) {
        const reason = candidate.finishReason;
        if ((reason === 'SAFETY' || reason === 'PROHIBITED_CONTENT') && retryCount === 0) {
            logger.warn('⚠️ Safety filter triggered on first attempt. Retrying with simplified prompt...');
            return applyImageFilter(imageFile, prompt, 1); // Retry once with simplified prompt
        } else if (reason === 'SAFETY' || reason === 'PROHIBITED_CONTENT') {
            throw new Error("This image cannot be styled with the selected filter due to content restrictions. Try: 1) A different art style, 2) A different image, or 3) A simpler photo without people.");
        } else if (reason === 'RECITATION') {
            throw new Error("Content flagged for copyright concerns. Try a different style.");
        } else if (reason === 'OTHER') {
            throw new Error("The AI was unable to transform this image. Try a different photo or style.");
        } else {
            throw new Error(`Image transformation failed. Reason: ${reason}. Try a different image or style.`);
        }
    }
    
    logger.warn('⚠️ API returned no image data - content may have been silently blocked');
    throw new Error("The style could not be applied to this image. This may happen with: 1) Images containing people/faces for certain styles, 2) Low quality images, 3) Complex compositions. Try a different image or simpler style.");

  } catch (error) {
    logger.error("Error applying filter with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to apply filter: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image stylization.");
  }
};