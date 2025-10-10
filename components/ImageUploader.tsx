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
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-8 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 mb-4">
            Transform Your Images with AI
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-2">
            Turn any photo into stunning artwork with 30+ artistic styles
          </p>
          <p className="text-sm text-gray-400">
            Powered by advanced AI • No signup required • Free to use
          </p>
        </div>

        {/* Main Upload Area */}
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`w-full h-80 border-2 border-dashed rounded-lg flex flex-col justify-center items-center cursor-pointer transition-all duration-300 ${
            isProcessing 
              ? 'border-blue-500 bg-blue-500/10' 
              : isDragging 
                ? 'border-blue-500 bg-blue-500/10 scale-105' 
                : 'border-gray-600 hover:border-blue-400 hover:bg-gray-800/50'
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
              <div className="w-20 h-20 mb-4 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p className="text-gray-300 text-xl font-semibold mb-2">Upload Your Image</p>
              <p className="text-gray-400 text-base mb-1">
                <span className="font-semibold text-blue-400">Click to browse</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">Supports PNG, JPG, WebP, HEIC • Max 10MB</p>
            </>
          )}
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

        {/* Features Grid */}
        <div className="mt-16 w-full">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Why Choose Our AI Stylizer?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 text-center hover:bg-white/[0.12] transition-all duration-300">
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center border border-blue-400/40">
                <svg className="w-7 h-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-200 mb-2">30+ Art Styles</p>
              <p className="text-sm text-gray-400">From anime to oil painting, explore diverse artistic transformations</p>
            </div>

            <div className="glass-panel p-6 text-center hover:bg-white/[0.12] transition-all duration-300">
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-pink-500/30 to-pink-600/30 flex items-center justify-center border border-pink-400/40">
                <svg className="w-7 h-7 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-200 mb-2">Lightning Fast</p>
              <p className="text-sm text-gray-400">Get your styled images in seconds with powerful AI processing</p>
            </div>

            <div className="glass-panel p-6 text-center hover:bg-white/[0.12] transition-all duration-300">
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center border border-blue-400/40">
                <svg className="w-7 h-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-200 mb-2">Privacy First</p>
              <p className="text-sm text-gray-400">Your images are processed securely and never stored permanently</p>
            </div>

            <div className="glass-panel p-6 text-center hover:bg-white/[0.12] transition-all duration-300">
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-green-500/30 to-green-600/30 flex items-center justify-center border border-green-400/40">
                <svg className="w-7 h-7 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-200 mb-2">100% Free</p>
              <p className="text-sm text-gray-400">No hidden costs, no subscriptions, no watermarks on your images</p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ImageUploader;
