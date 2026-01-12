/**
 * Supabase Storage Service
 * Handles image uploads to the gallery-images bucket
 */

import { supabase } from '../utils/supabaseClient';
import { logDbCall, isDebugMode, logHistory } from '../utils/supabaseDebug';

const BUCKET_NAME = 'gallery-images';

/**
 * Upload an image to Supabase Storage
 * @param userId - The user's ID (used for folder organization)
 * @param imageData - Base64 data URL or blob URL
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
    // Convert base64 data URL to blob
    let blob: Blob;
    let mimeType = 'image/png';
    
    if (imageData.startsWith('data:')) {
      // Parse data URL
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        logHistory('error', { step: 'INVALID_DATA_URL', imageDataPrefix: imageData.substring(0, 50) });
        return null;
      }
      mimeType = matches[1];
      const base64Data = matches[2];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mimeType });
      logHistory('upload', { step: 'BLOB_CREATED_FROM_DATA_URL', size: blob.size, mimeType });
    } else if (imageData.startsWith('blob:')) {
      // Fetch blob URL
      const response = await fetch(imageData);
      blob = await response.blob();
      mimeType = blob.type || 'image/png';
      logHistory('upload', { step: 'BLOB_FETCHED_FROM_URL', size: blob.size, mimeType });
    } else {
      // Already a URL, return as-is
      logHistory('upload', { step: 'ALREADY_URL_RETURNING_AS_IS', url: imageData.substring(0, 80) });
      return imageData;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = mimeType.split('/')[1] || 'png';
    const objectPath = `${userId}/${type}_${timestamp}_${randomId}.${extension}`;

    logHistory('upload', {
      step: 'UPLOADING_TO_STORAGE',
      bucket: BUCKET_NAME,
      objectPath,
      blobSize: blob.size,
    });

    logDbCall('storage', 'upload');

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(objectPath, blob, {
        contentType: mimeType,
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
