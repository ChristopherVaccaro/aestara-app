import React, { useState, useCallback } from 'react';
import { ImageProcessor } from '../utils/imageProcessor';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAndUploadFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate file first
      if (!ImageProcessor.isValidImageFile(file)) {
        throw new Error('Please select a valid image file (JPEG, PNG, WebP, or HEIC).');
      }

      // Process the image (handles Android compatibility issues)
      const processed = await ImageProcessor.processImage(file);
      
      // Show conversion message if format was changed
      if (processed.originalFormat && processed.originalFormat !== processed.mimeType) {
        console.log(`Converted ${processed.originalFormat} to ${processed.mimeType} for compatibility`);
      }

      onImageUpload(processed.file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      console.error('Image processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndUploadFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback(<T,>(e: React.DragEvent<T>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndUploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback(<T,>(e: React.DragEvent<T>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(<T,>(e: React.DragEvent<T>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(<T,>(e: React.DragEvent<T>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
        {/* Main Upload Area - Dark Theme with Glamatron Layout */}
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`group relative w-full h-full rounded-lg overflow-hidden cursor-pointer transition-all duration-300`}
        >
          {/* Dashed Border Container - Dark Theme */}
          <div className={`absolute inset-0 rounded-lg border-2 border-dashed transition-all duration-300 ${
            isDragging 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'border-white/20 bg-white/[0.02]'
          }`} />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 md:px-8">
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, image/avif, .png, .jpg, .jpeg, .webp, .heic, .heif, .avif"
              disabled={isProcessing}
              aria-label="Upload image file"
            />
            
            {isProcessing ? (
              <>
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 animate-pulse"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-white text-xl md:text-2xl font-semibold mb-2">Processing your image</p>
                <p className="text-gray-400 text-sm md:text-base">Optimizing for the best results...</p>
              </>
            ) : (
              <>
                {/* Upload Icon */}
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/5">
                    <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-white text-lg md:text-xl font-semibold mb-2">
                  {isDragging ? 'Drop your image here' : 'Upload a photo'}
                </h3>
                <p className="text-gray-400 text-sm md:text-base text-center mb-2">
                  <span className="text-blue-400">Drag</span> and drop or <span className="text-blue-400">click</span> to select a photo.
                </p>
                <p className="text-gray-500 text-xs md:text-sm">
                  JPG, PNG, WebP, HEIC • Max 10MB
                </p>
              </>
            )}
          </div>
        </label>
        
        {error && (
          <div className="mt-4 p-4 bg-red-500/[0.08] backdrop-blur-xl border border-red-400/30 rounded-lg w-full max-w-3xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-red-200 text-sm">Upload Error</p>
                <p className="mt-1 text-xs text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ImageUploader;
