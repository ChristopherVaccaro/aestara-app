import { GoogleGenAI, Modality } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

export interface ManipulationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Manipulates an image based on a custom text prompt using Gemini 2.5 Flash Image
 * @param imageUrl - The current generated image URL
 * @param prompt - User's custom manipulation prompt
 * @returns Promise with the manipulated image URL or error
 */
export async function manipulateImage(
  imageUrl: string,
  prompt: string
): Promise<ManipulationResult> {
  try {
    // Fetch the image as a blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Convert blob to base64
    const base64Image = await blobToBase64(blob);
    
    // Get MIME type
    let mimeType = blob.type;
    if (!mimeType || !mimeType.startsWith('image/')) {
      mimeType = 'image/jpeg';
    }

    // Create the manipulation prompt
    const fullPrompt = `You are an expert image editor. The user wants to modify this image with the following instruction:

"${prompt}"

Please generate a new version of this image that incorporates the requested changes while maintaining the overall style and quality of the original image. Make the changes as natural and seamless as possible.`;

    // Generate the manipulated image using the same API structure as geminiService
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType
            }
          },
          { text: fullPrompt }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT]
      }
    });

    // Extract image from response
    const candidate = result?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          const manipulatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          return {
            success: true,
            imageUrl: manipulatedImageUrl
          };
        }
      }
    }

    // If no image was generated, return error
    return {
      success: false,
      error: 'No image was generated. Please try a different prompt.'
    };

  } catch (error: any) {
    console.error('Image manipulation error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('SAFETY') || error.message?.includes('BLOCKED')) {
      return {
        success: false,
        error: 'The manipulation request was blocked by safety filters. Please try a different prompt.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to manipulate image. Please try again.'
    };
  }
}

/**
 * Convert blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
