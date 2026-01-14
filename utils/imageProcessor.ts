// Image processing utilities for Android compatibility
import heic2any from 'heic2any';

export interface ProcessedImage {
  file: File;
  dataUrl: string;
  mimeType: string;
  originalFormat?: string;
}

export class ImageProcessor {
  // Supported formats that we can process
  private static readonly SUPPORTED_FORMATS = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif'
  ];

  // Maximum file size for upload (10MB)
  private static readonly MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

  // Target max size for API payload safety (3.5MB to be safe under 4.5MB limit after base64)
  private static readonly TARGET_MAX_SIZE = 3.5 * 1024 * 1024;

  // Maximum dimensions
  private static readonly MAX_DIMENSION = 4096;

  /**
   * Process and validate an uploaded image file
   */
  static async processImage(file: File): Promise<ProcessedImage> {
    // Validate file size
    if (file.size > this.MAX_UPLOAD_SIZE) {
      throw new Error('Image file is too large. Please use an image smaller than 10MB.');
    }

    // Detect actual file format
    const actualMimeType = await this.detectMimeType(file);
    
    // Check if format is supported
    if (!this.SUPPORTED_FORMATS.includes(actualMimeType)) {
      throw new Error(`Unsupported image format: ${actualMimeType}. Please use JPEG, PNG, WebP, or HEIC images.`);
    }

    // Convert HEIC/HEIF/AVIF to JPEG if needed
    let processedFile = file;
    let finalMimeType = actualMimeType;

    if (actualMimeType === 'image/heic' || actualMimeType === 'image/heif' || actualMimeType === 'image/avif') {
      try {
        console.log('Converting HEIC/HEIF image to JPEG...');
        const converted = await this.convertToJpeg(file);
        processedFile = converted.file;
        finalMimeType = converted.mimeType;
      } catch (conversionError) {
        console.error('HEIC conversion failed:', conversionError);
        // Provide helpful instructions for HEIC/HEIF conversion
        throw new Error('Unable to convert HEIC/HEIF image. Please convert to JPEG using your device\'s photo app or an online converter like heictojpg.com');
      }
    }

    // Handle EXIF orientation and resize if needed
    const canvas = await this.loadImageToCanvas(processedFile);
    
    // Initial optimization
    let quality = 0.9;
    let optimizedFile = await this.canvasToFile(canvas, finalMimeType, quality, file.name);

    // Aggressive compression if still too large for API
    // We need the final base64 payload to be under ~4.5MB (Vercel limit)
    // Base64 adds ~33%, so file size must be under ~3.3MB
    while (optimizedFile.size > this.TARGET_MAX_SIZE && quality > 0.5) {
      quality -= 0.1;
      optimizedFile = await this.canvasToFile(canvas, finalMimeType, quality, file.name);
    }

    // If still too large after quality reduction, scale down dimensions
    if (optimizedFile.size > this.TARGET_MAX_SIZE) {
      let scale = 0.9;
      while (optimizedFile.size > this.TARGET_MAX_SIZE && scale > 0.4) {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = Math.round(canvas.width * scale);
        scaledCanvas.height = Math.round(canvas.height * scale);
        const ctx = scaledCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
          optimizedFile = await this.canvasToFile(scaledCanvas, finalMimeType, 0.8, file.name); // Use 0.8 quality with scaled image
        }
        scale -= 0.1;
      }
    }

    const dataUrl = await this.fileToDataUrl(optimizedFile);

    return {
      file: optimizedFile,
      dataUrl,
      mimeType: finalMimeType,
      originalFormat: actualMimeType !== finalMimeType ? actualMimeType : undefined
    };
  }

  /**
   * Detect actual MIME type by reading file headers
   */
  private static async detectMimeType(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // Check file signatures
        if (this.isJPEG(arr)) {
          resolve('image/jpeg');
        } else if (this.isPNG(arr)) {
          resolve('image/png');
        } else if (this.isWebP(arr)) {
          resolve('image/webp');
        } else if (this.isHEIC(arr)) {
          resolve('image/heic');
        } else if (this.isHEIF(arr)) {
          resolve('image/heif');
        } else if (this.isAVIF(arr)) {
          resolve('image/avif');
        } else {
          // Fallback to file.type if we can't detect
          resolve(file.type || 'image/jpeg');
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file for format detection'));
      reader.readAsArrayBuffer(file.slice(0, 32));
    });
  }

  /**
   * File format detection helpers
   */
  private static isJPEG(arr: Uint8Array): boolean {
    return arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF;
  }

  private static isPNG(arr: Uint8Array): boolean {
    return arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47;
  }

  private static isWebP(arr: Uint8Array): boolean {
    return arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50;
  }

  private static isHEIC(arr: Uint8Array): boolean {
    // Check for ftyp box with heic brand
    const str = String.fromCharCode(...arr.slice(4, 12));
    return str.includes('ftyp') && (str.includes('heic') || str.includes('heix'));
  }

  private static isHEIF(arr: Uint8Array): boolean {
    // Check for ftyp box with heif brand
    const str = String.fromCharCode(...arr.slice(4, 12));
    return str.includes('ftyp') && str.includes('heif');
  }

  private static isAVIF(arr: Uint8Array): boolean {
    // Check for ftyp box with avif brand
    const str = String.fromCharCode(...arr.slice(4, 12));
    return str.includes('ftyp') && str.includes('avif');
  }

  /**
   * Convert HEIC/HEIF/AVIF to JPEG using heic2any library
   */
  private static async convertToJpeg(file: File): Promise<{ file: File; mimeType: string }> {
    try {
      // Use heic2any library for proper HEIC/HEIF conversion
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });
      
      // heic2any can return a single blob or array of blobs
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      // Create a new File from the converted blob
      const convertedFile = new File(
        [blob], 
        file.name.replace(/\.(heic|heif|avif)$/i, '.jpg'), 
        { type: 'image/jpeg', lastModified: file.lastModified }
      );
      
      console.log('Successfully converted HEIC/HEIF to JPEG');
      
      return {
        file: convertedFile,
        mimeType: 'image/jpeg'
      };
    } catch (error) {
      console.error('HEIC conversion error:', error);
      
      // Try native browser support as fallback
      try {
        const canvas = await this.loadImageToCanvas(file);
        const convertedFile = await this.canvasToFile(canvas, 'image/jpeg', 0.9, file.name);
        
        return {
          file: convertedFile,
          mimeType: 'image/jpeg'
        };
      } catch {
        throw new Error('Unable to convert HEIC/HEIF image. Please convert to JPEG using your device\'s photo app or an online converter.');
      }
    }
  }

  /**
   * Load image to canvas with EXIF orientation correction
   */
  private static async loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Get EXIF orientation
          this.getImageOrientation(file).then(orientation => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }

            // Calculate dimensions with max size constraint
            let { width, height } = this.calculateDimensions(img.width, img.height);
            
            // Apply orientation
            const { canvasWidth, canvasHeight, transform } = this.getOrientationTransform(width, height, orientation);
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // Apply transformation
            ctx.save();
            ctx.setTransform(...transform);
            ctx.drawImage(img, 0, 0, width, height);
            ctx.restore();
            
            resolve(canvas);
          }).catch(reject);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(width: number, height: number): { width: number; height: number } {
    if (width <= this.MAX_DIMENSION && height <= this.MAX_DIMENSION) {
      return { width, height };
    }

    const ratio = Math.min(this.MAX_DIMENSION / width, this.MAX_DIMENSION / height);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    };
  }

  /**
   * Get EXIF orientation from image file
   */
  private static async getImageOrientation(file: File): Promise<number> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const view = new DataView(e.target?.result as ArrayBuffer);
        
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(1); // Not JPEG, assume no rotation needed
          return;
        }

        const length = view.byteLength;
        let offset = 2;

        while (offset < length) {
          if (view.getUint16(offset + 2, false) <= 8) break;
          const marker = view.getUint16(offset, false);
          offset += 2;

          if (marker === 0xFFE1) {
            if (view.getUint32(offset += 2, false) !== 0x45786966) break;
            
            const little = view.getUint16(offset += 6, false) === 0x4949;
            offset += view.getUint32(offset + 4, little);
            const tags = view.getUint16(offset, little);
            offset += 2;

            for (let i = 0; i < tags; i++) {
              if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                resolve(view.getUint16(offset + (i * 12) + 8, little));
                return;
              }
            }
          } else if ((marker & 0xFF00) !== 0xFF00) {
            break;
          } else {
            offset += view.getUint16(offset, false);
          }
        }
        resolve(1);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get canvas transformation for EXIF orientation
   */
  private static getOrientationTransform(width: number, height: number, orientation: number): {
    canvasWidth: number;
    canvasHeight: number;
    transform: [number, number, number, number, number, number];
  } {
    switch (orientation) {
      case 2:
        return { canvasWidth: width, canvasHeight: height, transform: [-1, 0, 0, 1, width, 0] };
      case 3:
        return { canvasWidth: width, canvasHeight: height, transform: [-1, 0, 0, -1, width, height] };
      case 4:
        return { canvasWidth: width, canvasHeight: height, transform: [1, 0, 0, -1, 0, height] };
      case 5:
        return { canvasWidth: height, canvasHeight: width, transform: [0, 1, 1, 0, 0, 0] };
      case 6:
        return { canvasWidth: height, canvasHeight: width, transform: [0, 1, -1, 0, height, 0] };
      case 7:
        return { canvasWidth: height, canvasHeight: width, transform: [0, -1, -1, 0, height, width] };
      case 8:
        return { canvasWidth: height, canvasHeight: width, transform: [0, -1, 1, 0, 0, width] };
      default:
        return { canvasWidth: width, canvasHeight: height, transform: [1, 0, 0, 1, 0, 0] };
    }
  }

  /**
   * Convert canvas to file
   */
  private static async canvasToFile(canvas: HTMLCanvasElement, mimeType: string, quality: number = 0.9, originalName?: string): Promise<File> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          // Preserve original filename or use default
          const fileName = originalName || 'processed-image.jpg';
          const file = new File([blob], fileName, { type: mimeType });
          resolve(file);
        }
      }, mimeType, quality);
    });
  }

  /**
   * Convert file to data URL
   */
  private static async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate if file appears to be an image
   */
  static isValidImageFile(file: File): boolean {
    // Check file extension
    const validExtensions = /\.(jpg|jpeg|png|webp|heic|heif|avif)$/i;
    if (!validExtensions.test(file.name)) {
      return false;
    }

    // Check MIME type (though this can be unreliable on Android)
    const validMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/webp',
      'image/heic',
      'image/heif',
      'image/avif',
      'application/octet-stream' // Android sometimes reports this
    ];
    
    return validMimeTypes.includes(file.type) || file.type === '';
  }
}
