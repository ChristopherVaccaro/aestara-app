// Image hosting service for social sharing
export interface UploadResponse {
  url: string;
  deleteUrl?: string;
  success: boolean;
  error?: string;
}

class ImageHostingService {
  // Using Imgur API for temporary image hosting
  private readonly IMGUR_CLIENT_ID = 'your_imgur_client_id'; // You'll need to get this from Imgur
  private readonly IMGUR_UPLOAD_URL = 'https://api.imgur.com/3/image';

  async uploadImage(base64Data: string): Promise<UploadResponse> {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

      const formData = new FormData();
      formData.append('image', cleanBase64);
      formData.append('type', 'base64');

      const response = await fetch(this.IMGUR_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Client-ID ${this.IMGUR_CLIENT_ID}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return {
          url: result.data.link,
          deleteUrl: result.data.deletehash,
          success: true,
        };
      } else {
        throw new Error(result.data?.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      
      // Fallback to alternative hosting service
      return this.uploadToFallbackService(base64Data);
    }
  }

  private async uploadToFallbackService(base64Data: string): Promise<UploadResponse> {
    try {
      // Using 0x0.st as fallback (no API key required)
      const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      const binaryData = atob(cleanBase64);
      const bytes = new Uint8Array(binaryData.length);
      
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', blob, 'styled-image.png');

      const response = await fetch('https://0x0.st', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const url = await response.text();
        return {
          url: url.trim(),
          success: true,
        };
      } else {
        throw new Error('Fallback upload failed');
      }
    } catch (error) {
      console.error('Fallback upload failed:', error);
      return {
        url: '',
        success: false,
        error: 'Failed to upload image for sharing. Please try again.',
      };
    }
  }

  // Convert data URL to blob for easier handling
  dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }
}

export const imageHostingService = new ImageHostingService();
