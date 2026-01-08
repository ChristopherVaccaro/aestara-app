import React, { useState, useRef, useEffect } from 'react';
import { MagicWand } from '@phosphor-icons/react';
import CustomPromptEditor from './CustomPromptEditor';
import { manipulateImage } from '../services/imageManipulationService';

interface ImageComparisonProps {
  originalImageUrl: string;
  generatedImageUrl: string;
  activeFilterName: string;
  onOpenPreview: (url?: string) => void;
  onDownload: (imageUrl?: string) => void;
  onShare?: () => void;
  onEdit?: (imageUrl?: string) => void;
  onSaveAIEdit?: (editedImageUrl: string) => void;
  previousImageUrl?: string;
  onRemoveImage?: () => void;
}

const TooltipButton: React.FC<{ label: string; position?: 'left' | 'right'; children: React.ReactNode }> = ({
  label,
  position = 'left',
  children,
}) => (
  <div className="relative group">
    {children}
    <div
      className={`pointer-events-none absolute ${
        position === 'left' ? 'right-[calc(100%+0.5rem)]' : 'left-[calc(100%+0.5rem)]'
      } top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity`}
    >
      {label}
    </div>
  </div>
);

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalImageUrl,
  generatedImageUrl,
  activeFilterName,
  onOpenPreview,
  onDownload,
  onShare,
  onEdit,
  onSaveAIEdit,
  previousImageUrl,
  onRemoveImage,
}) => {
  const [sliderPosition, setSliderPosition] = useState(25);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom prompt editor state
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDisplayImage, setCurrentDisplayImage] = useState(generatedImageUrl);
  const [originalGeneratedImage] = useState(generatedImageUrl);
  const [manipulationHistory, setManipulationHistory] = useState<string[]>([]);
  const [compareBaseline, setCompareBaseline] = useState<'original' | 'previous'>('original');
  const [showAIComparison, setShowAIComparison] = useState(false);
  const [aiEditError, setAIEditError] = useState<string | null>(null);
  const [beforeAIEditImage, setBeforeAIEditImage] = useState<string | null>(null);
  const [hasAcceptedAIEdit, setHasAcceptedAIEdit] = useState(false); // Track if user has kept an AI edit

  // Update display image when generated image changes
  useEffect(() => {
    setCurrentDisplayImage(generatedImageUrl);
    setManipulationHistory([]);
    setShowAIComparison(false);
    setHasAcceptedAIEdit(false); // Reset when new style is applied
  }, [generatedImageUrl]);

  // Slider interaction handlers
  const getPositionFromEvent = (clientX: number): number => {
    if (!containerRef.current) return sliderPosition;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (clientX !== undefined) {
      setSliderPosition(getPositionFromEvent(clientX));
    }
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e 
      ? (e as unknown as TouchEvent).touches[0]?.clientX 
      : (e as unknown as MouseEvent).clientX;
    if (clientX !== undefined) {
      setSliderPosition(getPositionFromEvent(clientX));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Attach global listeners for mouse/touch up (for when pointer leaves container)
  useEffect(() => {
    if (isDragging) {
      const handleGlobalUp = () => setIsDragging(false);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchend', handleGlobalUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalUp);
        window.removeEventListener('touchend', handleGlobalUp);
      };
    }
  }, [isDragging]);

  // Custom prompt editor handlers
  const handleCustomPromptSubmit = async (prompt: string) => {
    setIsProcessing(true);
    setAIEditError(null);
    try {
      const result = await manipulateImage(currentDisplayImage, prompt);
      
      if (result.success && result.imageUrl) {
        // Save the before image for comparison BEFORE updating anything
        setBeforeAIEditImage(currentDisplayImage);
        // Save current image to history before updating
        setManipulationHistory(prev => [...prev, currentDisplayImage]);
        setCurrentDisplayImage(result.imageUrl);
        // Close the modal and show comparison slider
        // NOTE: Don't call onSaveAIEdit here - wait until user clicks "Keep"
        setIsPromptEditorOpen(false);
        setShowAIComparison(true);
        setSliderPosition(25); // Reset to same initial position as normal slider
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

  const handleUndo = () => {
    if (manipulationHistory.length > 0) {
      const previousImage = manipulationHistory[manipulationHistory.length - 1];
      setCurrentDisplayImage(previousImage);
      setManipulationHistory(prev => prev.slice(0, -1));
      setShowAIComparison(false);
      // Update parent with the reverted image
      if (onSaveAIEdit) {
        onSaveAIEdit(previousImage);
      }
    }
  };
  
  // Get the before image for AI comparison - use the stored before image
  const beforeAIImage = beforeAIEditImage || generatedImageUrl;

  // Handle keeping the AI enhancement
  const handleKeepAIEdit = () => {
    setShowAIComparison(false);
    setBeforeAIEditImage(null);
    setHasAcceptedAIEdit(true); // Mark that user has accepted, hide slider
    // Now save the AI edit to parent
    if (onSaveAIEdit) {
      onSaveAIEdit(currentDisplayImage);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full h-full">
        {/* Gradient Border Wrapper - Matches upload button style */}
        <div className="relative rounded-2xl overflow-hidden p-[2px] bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 hover:from-blue-500/70 hover:via-purple-500/70 hover:to-pink-500/70 transition-all duration-300 h-full">
          <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden rounded-2xl bg-gray-900/95 backdrop-blur-xl select-none ${hasAcceptedAIEdit ? 'cursor-default' : 'cursor-ew-resize'}`}
            style={{ touchAction: 'none' }}
            onMouseDown={hasAcceptedAIEdit ? undefined : handlePointerDown}
            onTouchStart={hasAcceptedAIEdit ? undefined : handlePointerDown}
            onMouseMove={hasAcceptedAIEdit ? undefined : handlePointerMove}
            onTouchMove={hasAcceptedAIEdit ? undefined : handlePointerMove}
            onMouseUp={hasAcceptedAIEdit ? undefined : handlePointerUp}
            onTouchEnd={hasAcceptedAIEdit ? undefined : handlePointerUp}
          >
            {hasAcceptedAIEdit ? (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPromptEditorOpen(true);
                    }}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    title="AI Custom Edit"
                  >
                    <MagicWand className="h-5 w-5" weight="bold" />
                  </button>

                  {/* Edit Button */}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(currentDisplayImage);
                      }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(currentDisplayImage);
                    }}
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
                      className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                      title="Share Image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                      </svg>
                    </button>
                  )}

                  {/* Enlarge/Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPreview(currentDisplayImage);
                    }}
                    className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    title="Enlarge Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                </div>
              </>
            ) : showAIComparison && beforeAIEditImage ? (
              <>
                {/* AI Enhancement Comparison View */}
                {/* After AI Image (Full - shown on right) */}
                <div className="absolute inset-0">
                  <img
                    src={currentDisplayImage}
                    alt="After AI Enhancement"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                
                {/* Before AI Image (Clipped - shown on left) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={beforeAIImage}
                    alt="Before AI Enhancement"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                
                {/* Labels - Same position and styling as normal slider */}
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium z-30 pointer-events-none">
                  Before
                </div>
                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium z-30 pointer-events-none">
                  AI Enhanced
                </div>
                
                {/* AI Comparison Slider - Matches main slider styling */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] z-10"
                  style={{ 
                    left: `${sliderPosition}%`,
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Handle - Same as main slider */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl bg-white/10 border border-white/30 shadow-2xl hover:bg-white/20 transition-all duration-200">
                    {/* Left Arrow */}
                    <svg
                      className="w-4 h-4 text-white absolute left-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    {/* Right Arrow */}
                    <svg
                      className="w-4 h-4 text-white absolute right-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Action buttons - positioned above the labels */}
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
                {/* Normal Original vs Styled Comparison View */}
                {/* Generated Image (Behind) - Use currentDisplayImage to show manipulated version */}
                <div className="absolute inset-0">
                  <img
                    src={currentDisplayImage}
                    alt="Stylized"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>

                {/* Baseline Image (Overlay with clip) - Original or Previous */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={compareBaseline === 'previous' && previousImageUrl ? previousImageUrl : originalImageUrl}
                    alt={compareBaseline === 'previous' ? 'Previous' : 'Original'}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>

                {/* Labels - Always visible, outside clipped areas */}
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium z-30 pointer-events-none">
                  {compareBaseline === 'previous' ? 'Previous' : 'Original'}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium z-30 pointer-events-none">
                  {activeFilterName}
                </div>

                {/* Slider Line and Handle */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] z-10"
                  style={{ 
                    left: `${sliderPosition}%`,
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Handle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl bg-white/10 border border-white/30 shadow-2xl hover:bg-white/20 transition-all duration-200">
                    {/* Left Arrow */}
                    <svg
                      className="w-4 h-4 text-white absolute left-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    
                  
                    {/* Right Arrow */}
                    <svg
                      className="w-4 h-4 text-white absolute right-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </>
            )}

            {/* Compare Baseline Toggle (shows only if previous exists and not in AI comparison mode) */}
            {previousImageUrl && !showAIComparison && (
              <div className="absolute bottom-16 left-3 z-30">
                <div className="flex items-center gap-1 bg-black/60 border border-white/20 backdrop-blur-sm rounded-full p-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setCompareBaseline('original'); }}
                    className={`text-[11px] px-2 py-0.5 rounded-full transition ${compareBaseline === 'original' ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                    Original
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCompareBaseline('previous'); }}
                    className={`text-[11px] px-2 py-0.5 rounded-full transition ${compareBaseline === 'previous' ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                    Previous
                  </button>
                </div>
              </div>
            )}

            {/* Circular Action Buttons - Top Right */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
              {/* Remove Image Button */}
              {onRemoveImage && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="w-12 h-12 rounded-full bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Remove image
                  </div>
                </div>
              )}

              {/* Custom AI Edit Button */}
              <div className="relative group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPromptEditorOpen(true);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  aria-label="AI Custom Edit"
                >
                  <MagicWand className="h-5 w-5" weight="bold" />
                </button>
                <div className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  AI Custom Edit
                </div>
              </div>

              {/* Edit Button */}
              {onEdit && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(currentDisplayImage);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    aria-label="Edit Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <div className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Edit Image
                  </div>
                </div>
              )}

              {/* Download Button */}
              <div className="relative group">
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
                  aria-label="Download Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  Download Image
                </div>
              </div>

              {/* Share Button */}
              {onShare && (
                <div className="relative group">
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
                    aria-label="Share Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                  </button>
                  <div className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Share Image
                  </div>
                </div>
              )}

              {/* Enlarge/Preview Button */}
              <div className="relative group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPreview(currentDisplayImage);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  aria-label="Enlarge Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                <div className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  Enlarge Image
                </div>
              </div>
            </div>
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

export default ImageComparison;
