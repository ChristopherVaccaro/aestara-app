import React, { useState, useRef, useEffect } from 'react';

interface ImageComparisonProps {
  originalImageUrl: string;
  generatedImageUrl: string;
  activeFilterName: string;
  onOpenPreview: () => void;
  onDownload: () => void;
  onShare?: () => void;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalImageUrl,
  generatedImageUrl,
  activeFilterName,
  onOpenPreview,
  onDownload,
  onShare,
}) => {
  const [sliderPosition, setSliderPosition] = useState(25);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleStart = () => setIsDragging(true);
  const handleEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full responsive-image-container">
        {/* Gradient Border Wrapper - Matches upload button style */}
        <div className="relative rounded-2xl overflow-hidden p-[2px] bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 hover:from-blue-500/70 hover:via-purple-500/70 hover:to-pink-500/70 transition-all duration-300 h-full">
          <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden rounded-2xl bg-gray-900/95 backdrop-blur-xl cursor-ew-resize select-none"
            style={{ touchAction: 'none' }}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
          >
            {/* Generated Image (Behind) */}
            <div className="absolute inset-0">
              <img
                src={generatedImageUrl}
                alt="Stylized"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>

            {/* Original Image (Overlay with clip) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={originalImageUrl}
                alt="Original"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>

            {/* Labels - Always visible, outside clipped areas */}
            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium z-30 pointer-events-none">
              Original
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

            {/* Circular Action Buttons - Top Right */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
              {/* Download Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageComparison;
