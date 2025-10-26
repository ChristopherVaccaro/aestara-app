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
  onEdit?: () => void;
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
        ) : (
          <>
            <img
              src={imageUrlToShow}
              alt={isPeeking ? 'Original' : 'Stylized'}
              className="w-full h-full object-contain transition-all duration-300 rounded-lg"
            />
            {/* Edit Button - Available when only original image is present */}
            {onEdit && !generatedImageUrl && (
              <div className="absolute top-3 right-3 z-20">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
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
              </div>
            )}
            
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
      
    </div>
  );
};

export default ImageDisplay;

