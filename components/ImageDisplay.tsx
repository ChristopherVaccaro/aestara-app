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
  onShare?: () => void;
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
            className={`w-full h-full bg-gray-900/95 backdrop-blur-xl overflow-hidden flex items-center justify-center relative group rounded-2xl ${isClickable && !hasError ? 'cursor-pointer' : ''}`}
            onClick={isClickable && !hasError ? onOpenPreview : undefined}
          >
        {isLoading ? (
          <Spinner message={activeFilterName ? `Applying ${activeFilterName} style...` : "Applying style..."} />
        ) : (
          <>
            <img
              src={imageUrlToShow}
              alt={isPeeking ? 'Original' : 'Stylized'}
              className="w-full h-full object-contain transition-all duration-300 rounded-lg"
            />
            
            {/* Style Badge - Bottom Right */}
            {generatedImageUrl && activeFilterName && !isPeeking && (
              <div className="absolute bottom-3 right-3 flex gap-2">
                <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium">
                  {activeFilterName}
                </div>
                {isDevMode && (
                  <div className="bg-yellow-500/90 backdrop-blur-md text-black text-xs px-3 py-2 rounded-full border border-yellow-400 font-bold flex items-center gap-1.5 shadow-lg">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    DEV
                  </div>
                )}
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
            {/* Circular Action Buttons - Top Right - Always Visible */}
            {!isLoading && (
              <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                {/* Download Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  disabled={!generatedImageUrl}
                  className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={!generatedImageUrl}
                    className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Share Image"
                  >
                    {/* Android Share Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                  </button>
                )}

                {/* Enlarge/Preview Button */}
                {isClickable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPreview();
                    }}
                    className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    title="Enlarge Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>
      
      {/* Fixed height container for controls to prevent layout shift */}
      <div className="mt-1.5 md:mt-2 text-center flex items-center justify-center" style={{ minHeight: '48px' }}>
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
            className="relative overflow-hidden rounded-xl select-none focus:outline-none touch-manipulation"
            style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            {/* Gradient Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] rounded-xl">
              <div className="h-full w-full rounded-xl bg-gradient-to-br from-blue-600/90 to-purple-600/90" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 px-4 md:px-5 py-1.5 md:py-2 flex items-center justify-center gap-2">
              <svg className="w-4 md:w-5 h-4 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-white font-semibold text-sm md:text-base">Hold to Compare</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;

