import React, { useState, useRef } from 'react';
import { Upload, X, Sparkle, ArrowRight, Plus, Lightning, Palette, Eye } from '@phosphor-icons/react';

interface CustomStyleUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCustomStyle: (styleImageUrl: string, styleDescription: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  originalImageUrl?: string | null;
}

const CustomStyleUploader: React.FC<CustomStyleUploaderProps> = ({
  isOpen,
  onClose,
  onApplyCustomStyle,
  isLoading = false,
  disabled = false,
  originalImageUrl = null,
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
      <div className="relative w-full max-w-3xl bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkle size={20} className="text-white" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Custom Style Transfer</h2>
              <p className="text-sm text-white/60">Copy any visual style to your photo</p>
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
        <div className="p-5">
          {/* Visual Flow: Your Photo + Style = Result */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch mb-6">
            {/* Your Photo (Left) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Your Photo</span>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 aspect-[4/3]">
                {originalImageUrl ? (
                  <img
                    src={originalImageUrl}
                    alt="Your photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    <span className="text-sm">No image uploaded</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white/80 text-xs">
                  Target
                </div>
              </div>
            </div>

            {/* Plus Sign / Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                <Plus size={20} className="text-purple-400" weight="bold" />
              </div>
            </div>

            {/* Style Reference (Right) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Style Source</span>
              </div>
              {!styleImageUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    relative rounded-xl overflow-hidden border-2 border-dashed aspect-[4/3] cursor-pointer
                    transition-all duration-200 flex flex-col items-center justify-center
                    ${dragOver 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-white/20 hover:border-purple-400/60 hover:bg-purple-500/10'
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
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                    <Upload size={22} className="text-purple-400" />
                  </div>
                  <p className="text-white font-medium text-sm">Upload style image</p>
                  <p className="text-white/50 text-xs mt-1">Click or drop image</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/3]">
                  <img
                    src={styleImageUrl}
                    alt="Style reference"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveStyle}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
                  >
                    <X size={16} className="text-white" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-purple-500/80 text-white text-xs">
                    Style Source
                  </div>
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-sm">Analyzing...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* What AI extracts from style image */}
          <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-xl p-4 border border-purple-500/20 mb-4">
            <div className="flex items-start gap-3">
              <Lightning size={20} className="text-purple-400 flex-shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="text-white font-medium text-sm mb-2">What AI will extract from your style image:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Palette size={14} className="text-pink-400" />
                    <span>Color palette</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Eye size={14} className="text-blue-400" />
                    <span>Lighting mood</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Sparkle size={14} className="text-yellow-400" />
                    <span>Textures</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Palette size={14} className="text-green-400" />
                    <span>Art style</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips for best results */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white/80 text-sm font-medium mb-2">💡 Tips for best results:</p>
            <ul className="text-white/60 text-xs space-y-1">
              <li>• Use images with distinct visual styles (paintings, filters, cinematic shots)</li>
              <li>• Artwork, movie stills, and stylized photos work great</li>
              <li>• The AI copies the <span className="text-purple-400">look and feel</span>, not the content</li>
            </ul>
          </div>

          {/* Optional description */}
          {styleImageUrl && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Style notes (optional)
              </label>
              <input
                type="text"
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                placeholder="e.g., 'Focus on the warm golden tones' or 'Match the dreamy soft focus'"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-black/20">
          <button
            onClick={handleApply}
            disabled={!styleImageUrl || !originalImageUrl || isLoading || disabled || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Applying Style...</span>
              </>
            ) : (
              <>
                <Sparkle size={18} weight="fill" />
                <span>Transform My Photo</span>
                <ArrowRight size={18} weight="bold" />
              </>
            )}
          </button>
          {!originalImageUrl && (
            <p className="text-center text-yellow-400/80 text-xs mt-2">
              ⚠️ Please upload a photo first before using custom styles
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomStyleUploader;
