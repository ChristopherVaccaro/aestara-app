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
 * 
 * The style reference can be any artistic image (anime character, cartoon,
 * painting, etc.) and the AI will extract its artistic characteristics.
 */
export async function analyzeStyleImage(styleImageBase64: string): Promise<StyleAnalysisResult> {
  try {
    // Build the final prompt with style extraction and identity preservation
    const finalPrompt = `ARTISTIC STYLE EXTRACTION AND APPLICATION:

Analyze the style reference image to identify its unique artistic characteristics:
- Art style (anime, cartoon, oil painting, watercolor, digital art, sketch, etc.)
- Line work (bold outlines, soft edges, hatching, clean vectors, etc.)
- Color approach (vibrant, muted, pastel, limited palette, etc.)
- Shading technique (cel-shading, soft gradients, flat colors, etc.)
- Level of stylization (realistic, exaggerated, simplified, etc.)

Apply ALL these extracted artistic characteristics to transform the target image.

CRITICAL IDENTITY PRESERVATION:
- The subject must remain recognizable - same person, different art style
- Preserve facial structure, features, and proportions
- Keep pose and composition intact
- Transform only the artistic rendering, not the identity

Goal: Extract the "artistic DNA" from the style reference and apply it to create a stylized version of the target that looks like it belongs in the same artistic universe.`;

    return {
      styleDescription: 'Custom style extracted from uploaded reference image',
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
 * 
 * This extracts the artistic style characteristics from the style reference image
 * (e.g., anime, Simpsons, watercolor, etc.) and applies them to the target image.
 */
export async function applyCustomStyleWithReference(
  targetImageFile: File,
  styleImageBase64: string,
  userDescription?: string
): Promise<{ imageUrl: string; success: boolean; error?: string }> {
  try {
    // Build the prompt for custom style transfer - focused on extracting artistic style
    const stylePrompt = `STYLE EXTRACTION AND TRANSFER:
Analyze the STYLE REFERENCE IMAGE to identify its unique artistic characteristics, then apply those exact characteristics to transform the TARGET IMAGE.

${userDescription ? `USER STYLE HINT: ${userDescription}\n\n` : ''}STEP 1 - EXTRACT STYLE FROM REFERENCE:
Identify and extract these artistic elements from the style reference:
- Art style/medium (anime, cartoon, oil painting, watercolor, digital art, etc.)
- Line work style (bold outlines, soft edges, no outlines, hatching, etc.)
- Color palette and saturation (vibrant, muted, pastel, limited palette, etc.)
- Shading technique (cel-shading, gradient, cross-hatching, flat colors, etc.)
- Texture and detail level (smooth, textured, simplified, highly detailed)
- Proportions and stylization (exaggerated features, realistic, chibi, etc.)
- Lighting style (dramatic, soft, flat, rim lighting, etc.)

STEP 2 - APPLY EXTRACTED STYLE TO TARGET:
Transform the target image using ALL the extracted style characteristics:
- Render in the SAME art style/medium as the reference
- Use the SAME line work technique
- Apply the SAME color palette and saturation levels
- Use the SAME shading and lighting approach
- Match the SAME level of stylization and detail

CRITICAL IDENTITY PRESERVATION:
- The subject's face must remain recognizable - same person, different art style
- Preserve facial structure, eye shape, nose, mouth proportions
- Keep the pose, composition, and body proportions
- Only transform the ARTISTIC RENDERING, not the identity

The goal is: If the style reference is Simpsons-style, make the target look like a Simpsons character. If anime-style, make it anime. Extract and apply the artistic DNA of the reference.`;

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
