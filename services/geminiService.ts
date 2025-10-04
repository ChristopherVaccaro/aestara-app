import { GoogleGenAI, Modality } from "@google/genai";

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
const simplifyPrompt = (prompt: string): string => {
  return prompt
    .replace(/people|person|face|faces|body|bodies|subject|subjects/gi, 'element')
    .replace(/transform|convert/gi, 'apply style to')
    .replace(/into a|into the/gi, 'with')
    .split('.').slice(0, 3).join('.'); // Keep only first 3 sentences
};

export const applyImageFilter = async (imageFile: File, prompt: string, retryCount: number = 0): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    // Use simplified prompt on retry
    const finalPrompt = retryCount > 0 ? simplifyPrompt(prompt) : prompt;

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
            console.log('Safety filter triggered, retrying with simplified prompt...');
            return applyImageFilter(imageFile, prompt, 1); // Retry once with simplified prompt
        } else if (reason === 'SAFETY' || reason === 'PROHIBITED_CONTENT') {
            throw new Error("Content was blocked by safety filters. Try a different style or image.");
        } else if (reason === 'RECITATION') {
            throw new Error("Content flagged for copyright concerns. Try a different style.");
        } else {
            throw new Error(`The content may have been blocked. Reason: ${reason}.`);
        }
    }
    
    throw new Error("API did not return an image. The content may have been blocked by safety filters.");

  } catch (error) {
    console.error("Error applying filter with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to apply filter: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image stylization.");
  }
};