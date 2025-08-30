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
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const applyImageFilter = async (imageFile: File, prompt: string): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          imagePart,
          { text: prompt },
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

    // If no image is returned, throw an informative error
    let errorMessage = "API did not return an image. The content may have been blocked.";
    if (candidate?.finishReason) {
        errorMessage += ` Reason: ${candidate.finishReason}.`;
    }
    
    throw new Error(errorMessage);

  } catch (error) {
    console.error("Error applying filter with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to apply filter: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image stylization.");
  }
};