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
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Main Upload Area */}
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`w-full h-80 border-2 border-dashed rounded-3xl flex flex-col justify-center items-center cursor-pointer transition-all duration-300 ${
            isProcessing 
              ? 'border-blue-500 bg-blue-500/10' 
              : isDragging 
                ? 'border-purple-500 bg-purple-500/10 scale-105' 
                : 'border-gray-600 hover:border-purple-400 hover:bg-gray-800/50'
          }`}
        >
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
              <div className="w-16 h-16 mb-4 relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-blue-400 text-lg font-semibold">Processing image...</p>
              <p className="text-sm text-blue-300 mt-2">Optimizing for compatibility</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p className="text-gray-300 text-xl font-semibold mb-2">Upload Your Image</p>
              <p className="text-gray-400 text-base mb-1">
                <span className="font-semibold text-purple-400">Click to browse</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">Supports PNG, JPG, WebP, HEIC • Max 10MB</p>
            </>
          )}
        </label>
        
        {error && (
          <div className="mt-4 p-4 bg-red-500/[0.08] backdrop-blur-xl border border-red-400/30 rounded-2xl w-full">
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

        {/* Use Cases Section */}
        <div className="mt-12 w-full">
          <h3 className="text-lg font-semibold text-gray-300 text-center mb-6">Perfect for</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-300 mb-1">Portraits</p>
              <p className="text-xs text-gray-500">Transform into anime, cartoon, or artistic styles</p>
            </div>

            <div className="glass-panel p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-300 mb-1">Group Photos</p>
              <p className="text-xs text-gray-500">Style entire groups consistently</p>
            </div>

            <div className="glass-panel p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-300 mb-1">Landscapes</p>
              <p className="text-xs text-gray-500">Apply artistic filters to any scene</p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ImageUploader;
