 

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

    // Call serverless API to avoid exposing API keys on the client
    const res = await fetch('/api/apply-image-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Image.split(',')[1],
        mimeType,
        prompt: fullPrompt,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error || 'Failed to manipulate image.'
      };
    }

    const data = await res.json();
    const base64Out: string | undefined = data?.imageBase64;
    if (!base64Out) {
      return { success: false, error: 'No image was generated. Please try a different prompt.' };
    }

    const manipulatedImageUrl = `data:${mimeType};base64,${base64Out}`;
    return { success: true, imageUrl: manipulatedImageUrl };

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
