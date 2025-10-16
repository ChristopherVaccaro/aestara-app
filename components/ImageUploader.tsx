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
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-8 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Transform Photos
            </span>
            <br />
            <span className="text-white">into Art with AI</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-6 font-light">
            Apply 60+ artistic filters instantly — 100% free, no sign-up required.
          </p>
        </div>

        {/* Main Upload Area - Modern Glass Design */}
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`group relative w-full max-w-3xl rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
            isProcessing 
              ? 'scale-[0.98]' 
              : isDragging 
                ? 'scale-[1.02]' 
                : 'hover:scale-[1.01]'
          }`}
        >
          {/* Gradient Border Effect */}
          <div className={`absolute inset-0 rounded-2xl p-[2px] transition-all duration-300 ${
            isDragging 
              ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' 
              : 'bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 group-hover:from-blue-500/70 group-hover:via-purple-500/70 group-hover:to-pink-500/70'
          }`}>
            <div className="h-full w-full rounded-2xl bg-gray-900/95 backdrop-blur-xl" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center py-20 px-8">
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
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 animate-pulse"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-white text-2xl font-semibold mb-2">Processing your image</p>
                <p className="text-gray-400">Optimizing for the best results...</p>
              </>
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-white text-2xl font-semibold mb-3">
                  {isDragging ? 'Drop your image here' : 'Upload Your Photo'}
                </h3>
                <p className="text-gray-300 text-lg mb-4">
                  <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Click to browse</span>
                  <span className="text-gray-400"> or drag and drop</span>
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    PNG, JPG, WebP, HEIC
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Max 10MB
                  </span>
                </div>
              </>
            )}
          </div>
        </label>
        
        {error && (
          <div className="mt-4 p-4 bg-red-500/[0.08] backdrop-blur-xl border border-red-400/30 rounded-lg w-full">
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

        {/* Value Propositions */}
        <div className="mt-16 w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group text-center p-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-400/30">
                  <svg className="w-7 h-7 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">60+ Art Styles</h3>
              <p className="text-gray-400 text-sm">Anime, oil painting, cyberpunk, vintage & more</p>
            </div>

            <div className="group text-center p-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-400/30">
                  <svg className="w-7 h-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">AI-powered transformations in seconds</p>
            </div>

            <div className="group text-center p-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-400/30">
                  <svg className="w-7 h-7 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
              <p className="text-gray-400 text-sm">Images never stored, completely secure</p>
            </div>
          </div>
        </div>

    </div>
  );
};

export default ImageUploader;
