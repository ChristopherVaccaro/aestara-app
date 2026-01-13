/**
 * Supabase Storage Service
 * Handles image uploads to the gallery-images bucket
 * 
 * CRITICAL: This service ensures images are uploaded as proper binary data
 * with correct Content-Type (image/png or image/jpeg), NOT as JSON.
 */

import { supabase } from '../utils/supabaseClient';
import { logDbCall, isDebugMode, logHistory } from '../utils/supabaseDebug';

const BUCKET_NAME = 'gallery-images';

/**
 * Normalized image result from normalizeImageToBlob
 */
interface NormalizedImage {
  blob: Blob;
  extension: string;
  contentType: string;
}

/**
 * Normalize any image input to a proper Blob with correct MIME type
 * 
 * Supported inputs:
 * - Base64 string with data:image/* prefix (data URL)
 * - Base64 string without prefix (raw base64)
 * - Blob URL (blob:...)
 * - ArrayBuffer or Uint8Array
 * - Existing Blob
 * - HTTP/HTTPS URL to an image
 * 
 * @returns Object with blob, extension, and contentType
 */
export async function normalizeImageToBlob(input: string | Blob | ArrayBuffer | Uint8Array): Promise<NormalizedImage> {
  logHistory('upload', { step: 'NORMALIZE_START', inputType: typeof input });
  
  // Already a Blob
  if (input instanceof Blob) {
    const contentType = input.type || 'image/png';
    const extension = contentType.split('/')[1] || 'png';
    logHistory('upload', { step: 'NORMALIZE_BLOB', size: input.size, contentType });
    return { blob: input, extension, contentType };
  }
  
  // ArrayBuffer or Uint8Array
  if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
    const uint8 = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    // Detect image type from magic bytes
    const contentType = detectImageType(uint8);
    const extension = contentType.split('/')[1] || 'png';
    // Create new ArrayBuffer to avoid SharedArrayBuffer type issues
    const arrayBuffer = new ArrayBuffer(uint8.byteLength);
    new Uint8Array(arrayBuffer).set(uint8);
    const blob = new Blob([arrayBuffer], { type: contentType });
    logHistory('upload', { step: 'NORMALIZE_BUFFER', size: blob.size, contentType });
    return { blob, extension, contentType };
  }
  
  // String inputs
  if (typeof input === 'string') {
    // Data URL (base64 with prefix)
    if (input.startsWith('data:')) {
      const matches = input.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid data URL format');
      }
      const contentType = matches[1];
      const base64Data = matches[2];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: contentType });
      const extension = contentType.split('/')[1] || 'png';
      logHistory('upload', { step: 'NORMALIZE_DATA_URL', size: blob.size, contentType });
      return { blob, extension, contentType };
    }
    
    // Blob URL
    if (input.startsWith('blob:')) {
      const response = await fetch(input);
      const blob = await response.blob();
      const contentType = blob.type || 'image/png';
      const extension = contentType.split('/')[1] || 'png';
      logHistory('upload', { step: 'NORMALIZE_BLOB_URL', size: blob.size, contentType });
      return { blob, extension, contentType };
    }
    
    // HTTP/HTTPS URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const response = await fetch(input);
      const blob = await response.blob();
      const contentType = blob.type || 'image/png';
      const extension = contentType.split('/')[1] || 'png';
      logHistory('upload', { step: 'NORMALIZE_HTTP_URL', size: blob.size, contentType });
      return { blob, extension, contentType };
    }
    
    // Raw base64 (no prefix) - assume PNG
    try {
      const binaryString = atob(input);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // Detect actual type from magic bytes
      const contentType = detectImageType(bytes);
      const blob = new Blob([bytes], { type: contentType });
      const extension = contentType.split('/')[1] || 'png';
      logHistory('upload', { step: 'NORMALIZE_RAW_BASE64', size: blob.size, contentType });
      return { blob, extension, contentType };
    } catch {
      throw new Error('Invalid base64 string');
    }
  }
  
  throw new Error('Unsupported input type for image normalization');
}

/**
 * Detect image type from magic bytes
 */
function detectImageType(bytes: Uint8Array): string {
  if (bytes.length < 4) return 'image/png';
  
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif';
  }
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    if (bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'image/webp';
    }
  }
  
  // Default to PNG
  return 'image/png';
}

/**
 * Upload an image to Supabase Storage
 * Uses normalizeImageToBlob to ensure proper binary upload with correct Content-Type
 * 
 * @param userId - The user's ID (used for folder organization)
 * @param imageData - Base64 data URL, blob URL, or any supported image input
 * @param type - 'original' or 'result' to differentiate image types
 * @returns Public URL of the uploaded image, or null on failure
 */
export async function uploadImage(
  userId: string,
  imageData: string,
  type: 'original' | 'result'
): Promise<string | null> {
  logHistory('upload', {
    step: 'STORAGE_UPLOAD_START',
    userId: userId.substring(0, 8) + '...',
    type,
    imageDataPrefix: imageData.substring(0, 40),
  });

  try {
    // Skip upload if already a storage URL
    if (isStorageUrl(imageData)) {
      logHistory('upload', { step: 'ALREADY_STORAGE_URL', url: imageData.substring(0, 80) });
      return imageData;
    }

    // Use normalizeImageToBlob to convert any input to proper binary Blob
    const { blob, extension, contentType } = await normalizeImageToBlob(imageData);
    
    // Validate blob is actual image data (not JSON)
    if (blob.size < 100) {
      logHistory('error', { 
        step: 'BLOB_TOO_SMALL', 
        size: blob.size, 
        contentType,
        hint: 'Blob size suggests invalid image data'
      });
      return null;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const objectPath = `${userId}/${type}_${timestamp}_${randomId}.${extension}`;

    logHistory('upload', {
      step: 'UPLOADING_TO_STORAGE',
      bucket: BUCKET_NAME,
      objectPath,
      blobSize: blob.size,
      blobType: blob.type,
      contentType,
    });

    logDbCall('storage', 'upload');

    // CRITICAL: Upload with explicit contentType to ensure correct MIME type in Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(objectPath, blob, {
        contentType: contentType,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (error) {
      logHistory('error', {
        step: 'STORAGE_UPLOAD_FAILED',
        error: error.message,
        objectPath,
        isPolicyError: error.message?.includes('policy') || error.message?.includes('403'),
      });
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    logHistory('upload', {
      step: 'STORAGE_UPLOAD_SUCCESS',
      objectPath: data.path,
      publicUrl: urlData.publicUrl.substring(0, 100) + '...',
      contentType,
    });

    return urlData.publicUrl;
  } catch (error) {
    logHistory('error', {
      step: 'STORAGE_UPLOAD_EXCEPTION',
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract path from URL
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
    if (pathParts.length < 2) {
      console.error('Invalid storage URL format');
      return false;
    }
    
    const filePath = decodeURIComponent(pathParts[1]);

    if (isDebugMode()) {
      console.log('🗑️ Deleting image from Storage:', filePath);
    }

    logDbCall('storage', 'delete');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting from storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
}

/**
 * Delete multiple images from Supabase Storage
 * @param imageUrls - Array of public URLs to delete
 */
export async function deleteImages(imageUrls: string[]): Promise<boolean> {
  try {
    const filePaths: string[] = [];
    
    for (const imageUrl of imageUrls) {
      try {
        const urlObj = new URL(imageUrl);
        const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
        if (pathParts.length >= 2) {
          filePaths.push(decodeURIComponent(pathParts[1]));
        }
      } catch {
        // Skip invalid URLs
      }
    }

    if (filePaths.length === 0) {
      return true;
    }

    if (isDebugMode()) {
      console.log('🗑️ Deleting images from Storage:', filePaths.length);
    }

    logDbCall('storage', 'delete');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (error) {
      console.error('Error deleting from storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImages:', error);
    return false;
  }
}

/**
 * Check if a URL is a Supabase Storage URL
 */
export function isStorageUrl(url: string): boolean {
  return url.includes('/storage/v1/object/public/') && url.includes(BUCKET_NAME);
}
