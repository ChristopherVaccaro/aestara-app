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
  const [aiComparePosition, setAIComparePosition] = useState(25); // Match ImageComparison initial position
  const [isAIDragging, setIsAIDragging] = useState(false);
  const aiCompareContainerRef = React.useRef<HTMLDivElement>(null);
  const [aiEditError, setAIEditError] = useState<string | null>(null);
  const [beforeAIEditImage, setBeforeAIEditImage] = useState<string | null>(null);
  const [hasAcceptedAIEdit, setHasAcceptedAIEdit] = useState(false); // Track if user has kept an AI edit

  // Reset when original image changes
  useEffect(() => {
    setCurrentDisplayImage(originalImageUrl);
    setManipulationHistory([]);
    setShowAIComparison(false);
    setHasAcceptedAIEdit(false);
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
        setAIComparePosition(25); // Match ImageComparison initial position
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
  
  // AI Comparison slider handlers - same pattern as ImageComparison
  const getPositionFromEvent = (clientX: number): number => {
    if (!aiCompareContainerRef.current) return aiComparePosition;
    const rect = aiCompareContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  };

  const handleAIPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (clientX !== undefined) {
      setAIComparePosition(getPositionFromEvent(clientX));
    }
    setIsAIDragging(true);
  };

  const handleAIPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAIDragging) return;
    const clientX = 'touches' in e 
      ? (e as unknown as TouchEvent).touches[0]?.clientX 
      : (e as unknown as MouseEvent).clientX;
    if (clientX !== undefined) {
      setAIComparePosition(getPositionFromEvent(clientX));
    }
  };

  const handleAIPointerUp = () => {
    setIsAIDragging(false);
  };
  
  // Global event listeners for mouse/touch up when dragging
  useEffect(() => {
    if (isAIDragging) {
      const handleGlobalUp = () => setIsAIDragging(false);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchend', handleGlobalUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalUp);
        window.removeEventListener('touchend', handleGlobalUp);
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
  
  // Handle keeping the AI enhancement
  const handleKeepAIEdit = () => {
    setShowAIComparison(false);
    setBeforeAIEditImage(null);
    setHasAcceptedAIEdit(true); // Mark that user has accepted, hide slider
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
        ) : hasAcceptedAIEdit ? (
          <>
            {/* Final image view - no slider, just the accepted AI enhanced image */}
            <img
              src={currentDisplayImage}
              alt="AI Enhanced"
              className="w-full h-full object-contain"
              draggable={false}
            />
            
            {/* Label showing this is AI Enhanced */}
            <div className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-medium z-30 pointer-events-none">
              AI Enhanced
            </div>
            
            {/* Circular Action Buttons - Top Right */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
              {/* Custom AI Edit Button - Can edit more */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsPromptEditorOpen(true); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                title="AI Custom Edit"
              >
                <MagicWand className="h-5 w-5" weight="bold" />
              </button>

              {/* Manual Edit Button */}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(currentDisplayImage); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  title="Edit Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}

              {/* Download Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDownloadAIEnhanced(); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                title="Download AI Enhanced Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </>
        ) : showAIComparison && beforeAIEditImage ? (
          <>
            {/* AI Enhancement Comparison Slider - Matches ImageComparison styling */}
            <div 
              ref={aiCompareContainerRef}
              className="relative w-full h-full select-none cursor-ew-resize"
              onMouseDown={handleAIPointerDown}
              onTouchStart={handleAIPointerDown}
              onMouseMove={handleAIPointerMove}
              onTouchMove={handleAIPointerMove}
              onMouseUp={handleAIPointerUp}
              onTouchEnd={handleAIPointerUp}
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
              
              {/* Slider Line and Handle - Matches ImageComparison styling */}
              <div
                className="absolute top-0 bottom-0 w-[2px] z-10"
                style={{ left: `${aiComparePosition}%`, backgroundColor: '#ffffff' }}
              >
                {/* Handle - Same as ImageComparison */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl bg-white/10 border border-white/30 shadow-2xl hover:bg-white/20 transition-all duration-200">
                  {/* Left Arrow */}
                  <svg className="w-4 h-4 text-white absolute left-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  {/* Right Arrow */}
                  <svg className="w-4 h-4 text-white absolute right-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {/* Labels - Same position and styling as ImageComparison */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium z-30 pointer-events-none">
                Before
              </div>
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium z-30 pointer-events-none">
                AI Enhanced
              </div>
            </div>
            
            {/* Action buttons for comparison mode - positioned above labels */}
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 z-30">
              <button
                onClick={(e) => { e.stopPropagation(); handleKeepAIEdit(); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-full shadow-lg transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Keep
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full shadow-lg transition-all flex items-center gap-2 border border-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Undo
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsPromptEditorOpen(true); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
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
        isProcessing={isProcessing}
        error={aiEditError}
        onClearError={() => setAIEditError(null)}
      />
    </div>
  );
};

export default ImageDisplay;
