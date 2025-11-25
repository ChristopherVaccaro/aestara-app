import React, { useEffect, useState } from 'react';
import Spinner from './Spinner';
import { MagicWand } from '@phosphor-icons/react';
import CustomPromptEditor from './CustomPromptEditor';
import { manipulateImage } from '../services/imageManipulationService';

interface ImageDisplayProps {
  originalImageUrl: string;
  generatedImageUrl: string | null;
  isLoading: boolean;
  isPeeking: boolean;
  onPeekStart: () => void;
  onPeekEnd: () => void;
  onOpenPreview: () => void;
  onDownload: (imageUrl?: string) => void;
  onShare?: () => void;
  onEdit?: (imageUrl?: string) => void;
  onSaveAIEdit?: (editedImageUrl: string) => void;
  error?: string | null;
  activeFilterName?: string | null;
  isDevMode?: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  originalImageUrl,
  generatedImageUrl,
  isLoading,
  isPeeking,
  onPeekStart,
  onPeekEnd,
  onOpenPreview,
  onDownload,
  onShare,
  onEdit,
  onSaveAIEdit,
  error,
  activeFilterName,
  isDevMode = false,
}) => {
  const imageUrlToShow = isPeeking
    ? originalImageUrl
    : generatedImageUrl || originalImageUrl;

  const showPeekButton = !!generatedImageUrl && !isLoading;
  const isClickable = !!generatedImageUrl && !isLoading;
  const hasError = !!error;

  // AI Custom Edit (pre-generation) state
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string>(originalImageUrl);
  const [manipulationHistory, setManipulationHistory] = useState<string[]>([]);
  const [showAIComparison, setShowAIComparison] = useState(false);
  const [aiComparePosition, setAIComparePosition] = useState(50);
  const [isAIDragging, setIsAIDragging] = useState(false);
  const aiCompareContainerRef = React.useRef<HTMLDivElement>(null);
  const [aiEditError, setAIEditError] = useState<string | null>(null);
  const [beforeAIEditImage, setBeforeAIEditImage] = useState<string | null>(null);

  // Reset when original image changes
  useEffect(() => {
    setCurrentDisplayImage(originalImageUrl);
    setManipulationHistory([]);
    setShowAIComparison(false);
  }, [originalImageUrl]);

  const handleCustomPromptSubmit = async (prompt: string) => {
    setIsProcessing(true);
    setAIEditError(null);
    try {
      const result = await manipulateImage(currentDisplayImage, prompt);
      if (result.success && result.imageUrl) {
        // Save the before image for comparison BEFORE updating anything
        setBeforeAIEditImage(currentDisplayImage);
        setManipulationHistory(prev => [...prev, currentDisplayImage]);
        setCurrentDisplayImage(result.imageUrl);
        setIsPromptEditorOpen(false);
        setShowAIComparison(true); // Show comparison after AI enhancement
        setAIComparePosition(50);
        setAIEditError(null);
      } else {
        const errorMsg = result.error || 'Failed to apply AI edit. Please try again with a different prompt.';
        console.error(errorMsg);
        setAIEditError(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to apply AI edit. Please try again.';
      console.error(errorMsg);
      setAIEditError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // AI Comparison slider handlers
  const handleAICompareMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAIDragging(true);
  };
  
  const handleAICompareTouchStart = (e: React.TouchEvent) => {
    setIsAIDragging(true);
  };
  
  const handleAICompareMove = (clientX: number) => {
    if (!isAIDragging || !aiCompareContainerRef.current) return;
    const rect = aiCompareContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setAIComparePosition(percentage);
  };
  
  const handleAICompareMouseMove = (e: React.MouseEvent) => {
    handleAICompareMove(e.clientX);
  };
  
  const handleAICompareTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleAICompareMove(e.touches[0].clientX);
    }
  };
  
  const handleAICompareEnd = () => {
    setIsAIDragging(false);
  };
  
  // Global event listeners for AI comparison slider to prevent getting stuck
  useEffect(() => {
    if (isAIDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (aiCompareContainerRef.current) {
          const rect = aiCompareContainerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setAIComparePosition(percentage);
        }
      };
      const handleGlobalTouchMove = (e: TouchEvent) => {
        if (aiCompareContainerRef.current && e.touches.length > 0) {
          const rect = aiCompareContainerRef.current.getBoundingClientRect();
          const x = e.touches[0].clientX - rect.left;
          const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setAIComparePosition(percentage);
        }
      };
      const handleGlobalEnd = () => setIsAIDragging(false);
      
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalTouchMove);
      window.addEventListener('touchend', handleGlobalEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalEnd);
        window.removeEventListener('touchmove', handleGlobalTouchMove);
        window.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isAIDragging]);
  
  // Download handler for AI enhanced image
  const handleDownloadAIEnhanced = () => {
    if (!currentDisplayImage) return;
    const link = document.createElement('a');
    link.href = currentDisplayImage;
    link.download = 'ai-enhanced-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Get the before image for comparison - use the stored before image
  const beforeAIImage = beforeAIEditImage || originalImageUrl;

  const handleUndo = () => {
    if (manipulationHistory.length > 0) {
      const previousImage = manipulationHistory[manipulationHistory.length - 1];
      setCurrentDisplayImage(previousImage);
      setManipulationHistory(prev => prev.slice(0, -1));
      setShowAIComparison(false);
      setBeforeAIEditImage(null);
    }
  };

  const handleSaveChanges = () => {
    if (onSaveAIEdit && currentDisplayImage !== originalImageUrl) {
      onSaveAIEdit(currentDisplayImage);
    }
    setManipulationHistory([]);
    setIsPromptEditorOpen(false);
  };
  
  // Handle keeping the AI enhancement
  const handleKeepAIEdit = () => {
    setShowAIComparison(false);
    setBeforeAIEditImage(null);
    // Save the AI edit to parent so future style applications use this version
    if (onSaveAIEdit && currentDisplayImage !== originalImageUrl) {
      onSaveAIEdit(currentDisplayImage);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Image Container with Modern Design */}
      <div className="relative w-full responsive-image-container">
        {/* Gradient Border Wrapper - Matches upload button style */}
        <div className={`relative rounded-2xl overflow-hidden p-[2px] transition-all duration-300 h-full ${
          hasError 
            ? 'bg-gradient-to-r from-red-500/50 to-pink-500/50' 
            : 'bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 hover:from-blue-500/70 hover:via-purple-500/70 hover:to-pink-500/70'
        }`}>
          <div
            className="w-full h-full bg-gray-900/95 backdrop-blur-xl overflow-hidden flex items-center justify-center relative group rounded-2xl"
            onMouseDown={showPeekButton ? onPeekStart : undefined}
            onMouseUp={showPeekButton ? onPeekEnd : undefined}
            onMouseLeave={showPeekButton ? onPeekEnd : undefined}
            onTouchStart={showPeekButton ? (e) => {
              e.preventDefault();
              onPeekStart();
            } : undefined}
            onTouchEnd={showPeekButton ? (e) => {
              e.preventDefault();
              onPeekEnd();
            } : undefined}
            onTouchCancel={showPeekButton ? (e) => {
              e.preventDefault();
              onPeekEnd();
            } : undefined}
            onContextMenu={(e) => e.preventDefault()}
            style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
        {isLoading ? (
          <Spinner message={activeFilterName ? `Applying ${activeFilterName} style...` : "Applying style..."} />
        ) : showAIComparison && beforeAIEditImage ? (
          <>
            {/* AI Enhancement Comparison Slider */}
            <div 
              ref={aiCompareContainerRef}
              className="relative w-full h-full select-none"
              onMouseMove={handleAICompareMouseMove}
              onMouseUp={handleAICompareEnd}
              onMouseLeave={handleAICompareEnd}
              onTouchMove={handleAICompareTouchMove}
              onTouchEnd={handleAICompareEnd}
              style={{ touchAction: 'none' }}
            >
              {/* After Image (Full - shown on right) */}
              <img
                src={currentDisplayImage}
                alt="After AI Enhancement"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
              
              {/* Before Image (Clipped - shown on left) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - aiComparePosition}% 0 0)` }}
              >
                <img
                  src={beforeAIImage}
                  alt="Before AI Enhancement"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
              
              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
                style={{ left: `${aiComparePosition}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleAICompareMouseDown}
                onTouchStart={handleAICompareTouchStart}
              >
                {/* Handle Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8L22 12L18 16" />
                    <path d="M6 8L2 12L6 16" />
                  </svg>
                </div>
              </div>
              
              {/* Labels */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                Before
              </div>
              <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                AI Enhanced
              </div>
            </div>
            
            {/* Action buttons for comparison mode */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              <button
                onClick={(e) => { e.stopPropagation(); handleKeepAIEdit(); }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-full shadow-lg transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Keep
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full shadow-lg transition-all flex items-center gap-2 border border-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Undo
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsPromptEditorOpen(true); }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm rounded-full shadow-lg transition-all flex items-center gap-2"
              >
                <MagicWand className="w-4 h-4" weight="bold" />
                Edit More
              </button>
            </div>
          </>
        ) : (
          <>
            <img
              src={currentDisplayImage}
              alt={isPeeking ? 'Original' : 'Stylized'}
              className="w-full h-full object-contain transition-all duration-300 rounded-lg"
            />
            {/* Top-right action buttons (stacked) */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
              {/* AI Custom Edit Button - Always available after upload */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsPromptEditorOpen(true); }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                title="AI Custom Edit"
              >
                <MagicWand className="h-5 w-5" weight="bold" />
              </button>

              {/* Download Button - Show when AI enhancement has been applied */}
              {currentDisplayImage !== originalImageUrl && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadAIEnhanced(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  title="Download AI Enhanced Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {/* Manual Edit Button - Only when no generated image yet */}
              {onEdit && !generatedImageUrl && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(currentDisplayImage); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  title="Edit Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Hold to Compare Label - Bottom Left */}
            {showPeekButton && (
              <div className="absolute bottom-3 left-3">
                <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium">
                  {isPeeking ? 'Original' : 'Hold to Compare'}
                </div>
              </div>
            )}

            {/* Style Badge - Bottom Right */}
            {generatedImageUrl && activeFilterName && !isPeeking && (
              <div className="absolute bottom-3 right-3">
                <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium">
                  {activeFilterName}
                </div>
              </div>
            )}
            
            {hasError && (
              <div className="absolute inset-0 bg-red-500/[0.08] backdrop-blur-2xl flex flex-col items-center justify-center gap-2 p-4 text-center border border-red-400/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.335-.213 3.01-1.742 3.01H3.48c-1.53 0-2.492-1.675-1.743-3.01l6.52-11.59zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a.75.75 0 01-.75-.75v-3.5a.75.75 0 011.5 0v3.5A.75.75 0 0110 11z" clipRule="evenodd" />
                </svg>
                <p className="text-red-200 font-semibold">Styling blocked</p>
                <p className="text-red-300 text-xs sm:text-sm max-w-xs">
                  {error || 'This content cannot be edited or stylized.'}
                </p>
              </div>
            )}
            {/* Circular Action Buttons - Top Right - Only show when image is generated */}
            {!isLoading && generatedImageUrl && (
              <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                {/* Download Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(currentDisplayImage);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  title="Download Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Share Button */}
                {onShare && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    title="Share Image"
                  >
                    {/* Android Share Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                  </button>
                )}

                {/* Enlarge/Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPreview();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  title="Enlarge Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>

      {/* Custom Prompt Editor Overlay */}
      <CustomPromptEditor
        isOpen={isPromptEditorOpen}
        onClose={() => setIsPromptEditorOpen(false)}
        onSubmit={handleCustomPromptSubmit}
        onUndo={handleUndo}
        onSave={handleSaveChanges}
        canUndo={manipulationHistory.length > 0}
        isProcessing={isProcessing}
        error={aiEditError}
        onClearError={() => setAIEditError(null)}
      />
    </div>
  );
};

export default ImageDisplay;
