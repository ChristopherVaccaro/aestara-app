import React from 'react';
import Spinner from './Spinner';

interface ImageDisplayProps {
  originalImageUrl: string;
  generatedImageUrl: string | null;
  isLoading: boolean;
  isPeeking: boolean;
  onPeekStart: () => void;
  onPeekEnd: () => void;
  onOpenPreview: () => void;
  onDownload: () => void;
  error?: string | null;
  activeFilterName?: string | null;
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
  error,
  activeFilterName,
}) => {
  const imageUrlToShow = isPeeking
    ? originalImageUrl
    : generatedImageUrl || originalImageUrl;

  const showPeekButton = !!generatedImageUrl && !isLoading;
  const isClickable = !!generatedImageUrl && !isLoading;
  const hasError = !!error;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div
        className={`w-full aspect-square glass-image-container overflow-hidden ring-1 ${hasError ? 'ring-red-400/50' : 'ring-white/[0.08]'} flex items-center justify-center relative group ${isClickable && !hasError ? 'cursor-pointer' : ''}`}
        onClick={isClickable && !hasError ? onOpenPreview : undefined}
      >
        {isLoading ? (
          <Spinner message={activeFilterName ? `Applying ${activeFilterName} style...` : "Applying style..."} />
        ) : (
          <>
            <img
              src={imageUrlToShow}
              alt={isPeeking ? 'Original' : 'Stylized'}
              className="w-full h-full object-cover transition-all duration-300 rounded-3xl"
            />
            
            {/* Style Badge - Bottom Right */}
            {generatedImageUrl && activeFilterName && !isPeeking && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/20">
                {activeFilterName}
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
            {isClickable && !isPeeking && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                {/* Download Button - Top Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="absolute top-4 right-4 text-white glass-button rounded-full p-2 focus:outline-none z-10"
                  title="Download Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Zoom Icon - Center */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
      {/* Fixed height container for controls to prevent layout shift */}
      <div className="mt-6 text-center h-12 flex items-center justify-center">
        {showPeekButton && (
          <button
            onMouseDown={onPeekStart}
            onMouseUp={onPeekEnd}
            onMouseLeave={onPeekEnd}
            onTouchStart={(e) => {
              e.preventDefault();
              onPeekStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onPeekEnd();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              onPeekEnd();
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="px-8 py-3 glass-button-active text-purple-100 font-semibold shadow-lg select-none focus:outline-none touch-manipulation rounded-2xl"
            style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            Hold to see Original
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;
