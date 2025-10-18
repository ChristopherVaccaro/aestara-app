import React, { useState, useRef, useEffect } from 'react';

interface ImageComparisonProps {
  originalImageUrl: string;
  generatedImageUrl: string;
  activeFilterName: string;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalImageUrl,
  generatedImageUrl,
  activeFilterName,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
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
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium">
                {activeFilterName}
              </div>
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
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium">
                Original
              </div>
            </div>

        {/* Slider Line and Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-gray-900">
            <svg
              className="w-6 h-6 text-gray-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M8 7l-4 5 4 5M16 7l4 5-4 5"
              />
            </svg>
          </div>
        </div>
        </div>
        </div>
      </div>

      {/* Fixed height container for instructions to prevent layout shift */}
      <div className="mt-2 flex items-center justify-center" style={{ minHeight: '48px' }}>
        <p className="text-sm text-gray-400 text-center">
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Drag to compare original and styled images
          </span>
        </p>
      </div>
    </div>
  );
};

export default ImageComparison;
