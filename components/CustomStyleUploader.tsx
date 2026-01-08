import React, { useState, useRef } from 'react';
import { Upload, X, Sparkle, Image as ImageIcon, ArrowRight } from '@phosphor-icons/react';

interface CustomStyleUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCustomStyle: (styleImageUrl: string, styleDescription: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const CustomStyleUploader: React.FC<CustomStyleUploaderProps> = ({
  isOpen,
  onClose,
  onApplyCustomStyle,
  isLoading = false,
  disabled = false,
}) => {
  const [styleImageUrl, setStyleImageUrl] = useState<string | null>(null);
  const [styleDescription, setStyleDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const url = URL.createObjectURL(file);
    setStyleImageUrl(url);
    setIsAnalyzing(true);

    // Simulate AI analysis of the style image
    // In production, this would call Gemini to analyze and describe the style
    try {
      // The actual implementation would send the image to Gemini for analysis
      // For now, we'll set a placeholder that will be replaced with real analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStyleDescription('Analyzing style characteristics...');
    } catch (error) {
      console.error('Error analyzing style:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleApply = () => {
    if (styleImageUrl) {
      onApplyCustomStyle(styleImageUrl, styleDescription || '');
    }
  };

  const handleRemoveStyle = () => {
    if (styleImageUrl) {
      URL.revokeObjectURL(styleImageUrl);
    }
    setStyleImageUrl(null);
    setStyleDescription('');
  };

  const handleClose = () => {
    handleRemoveStyle();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkle size={20} className="text-white" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Custom Style Transfer</h2>
              <p className="text-sm text-white/60">Upload an image to match its style</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Style Image Upload */}
          {!styleImageUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-all duration-200
                ${dragOver 
                  ? 'border-purple-400 bg-purple-500/10' 
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Upload size={24} className="text-white/60" />
                </div>
                <div>
                  <p className="text-white font-medium">Upload a style reference</p>
                  <p className="text-sm text-white/50 mt-1">
                    Drop an image or click to browse
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Style Preview */}
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img
                  src={styleImageUrl}
                  alt="Style reference"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={handleRemoveStyle}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-sm">Analyzing style...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Style Description */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Style Description (optional)
                </label>
                <textarea
                  value={styleDescription}
                  onChange={(e) => setStyleDescription(e.target.value)}
                  placeholder="Describe the style you want to apply, or let AI analyze it automatically..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  rows={3}
                />
              </div>

              {/* How it works */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <ImageIcon size={20} className="text-purple-400 flex-shrink-0" />
                <p className="text-xs text-white/60">
                  AI will analyze the colors, textures, lighting, and artistic techniques from your reference image and apply them to your photo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-black/20">
          <button
            onClick={handleApply}
            disabled={!styleImageUrl || isLoading || disabled || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Applying Style...</span>
              </>
            ) : (
              <>
                <span>Apply Custom Style</span>
                <ArrowRight size={18} weight="bold" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomStyleUploader;
