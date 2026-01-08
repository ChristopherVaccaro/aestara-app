import { logger } from '../utils/logger';

const API_BASE = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_BASE : '') || '';

interface StyleAnalysisResult {
  styleDescription: string;
  prompt: string;
  success: boolean;
  error?: string;
}

/**
 * Analyzes a style reference image and generates a prompt to apply that style
 * to another image. This creates a detailed prompt based on visual analysis.
 */
export async function analyzeStyleImage(styleImageBase64: string): Promise<StyleAnalysisResult> {
  try {
    // For now, we'll create a generic custom style prompt
    // In the future, this could call a dedicated API endpoint for style analysis
    
    // Build the final prompt with identity preservation instructions
    const finalPrompt = `Apply the exact visual style from the reference image to this photo while preserving facial features and identity.

STYLE TRANSFER INSTRUCTIONS:
- Match the color palette, saturation, and color grading exactly
- Replicate the lighting style, shadows, and highlights
- Apply the same texture and detail level
- Use the same artistic technique and medium appearance
- Match the mood and atmosphere

CRITICAL IDENTITY PRESERVATION:
- Preserve exact facial structure, face shape, eye shape, nose shape, mouth shape
- Keep all facial proportions and body pose identical
- Only change the artistic rendering style, colors, textures, and lighting
- The person must remain 100% recognizable`;

    return {
      styleDescription: 'Custom style from uploaded reference image',
      prompt: finalPrompt,
      success: true,
    };
  } catch (error) {
    logger.error('Error analyzing style image:', error);
    return {
      styleDescription: '',
      prompt: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze style',
    };
  }
}

/**
 * Applies a custom style to an image using the style reference and target image.
 * Uses the existing apply-image-filter API endpoint.
 */
export async function applyCustomStyleWithReference(
  targetImageFile: File,
  styleImageBase64: string,
  userDescription?: string
): Promise<{ imageUrl: string; success: boolean; error?: string }> {
  try {
    // Build the prompt for custom style transfer
    const stylePrompt = `Apply the exact visual style from this reference to the target image.

${userDescription ? `USER STYLE DESCRIPTION: ${userDescription}\n\n` : ''}STYLE TRANSFER INSTRUCTIONS:
- Analyze the reference image's artistic style, colors, lighting, and textures
- Apply these exact visual characteristics to the target image
- Match the color palette, saturation levels, and color grading
- Replicate the lighting direction, quality, and mood
- Use the same artistic technique (painting style, brush strokes, etc.)
- Maintain the atmospheric quality and overall aesthetic

CRITICAL IDENTITY PRESERVATION:
- Preserve exact facial structure, face shape, all facial features
- Keep body pose, composition, and proportions identical
- Only change the artistic rendering style
- The person must remain 100% recognizable

Apply the style as a visual filter while keeping all structural elements identical.`;

    // Convert target image to base64
    const targetBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(targetImageFile);
    });

    // Call the existing API endpoint
    const res = await fetch(`${API_BASE}/api/apply-image-filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: targetBase64.split(',')[1],
        mimeType: targetImageFile.type || 'image/jpeg',
        prompt: stylePrompt,
        styleReference: styleImageBase64, // Include the style reference image
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Failed to apply custom style');
    }

    const data = await res.json();
    
    if (data.imageData) {
      return {
        imageUrl: `data:image/png;base64,${data.imageData}`,
        success: true,
      };
    }

    return {
      imageUrl: '',
      success: false,
      error: 'No image generated',
    };
  } catch (error) {
    logger.error('Error applying custom style:', error);
    return {
      imageUrl: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply style',
    };
  }
}

/**
 * Converts an image URL (blob or regular) to base64
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
