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
  error?: string | null;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  originalImageUrl,
  generatedImageUrl,
  isLoading,
  isPeeking,
  onPeekStart,
  onPeekEnd,
  onOpenPreview,
  error,
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
        className={`w-full aspect-square rounded-2xl overflow-hidden bg-black/30 ring-1 ${hasError ? 'ring-red-500' : 'ring-white/10'} shadow-2xl shadow-purple-500/10 flex items-center justify-center relative group ${isClickable && !hasError ? 'cursor-pointer' : ''}`}
        onClick={isClickable && !hasError ? onOpenPreview : undefined}
      >
        {isLoading ? (
          <Spinner message="Applying style..." />
        ) : (
          <>
            <img
              src={imageUrlToShow}
              alt={isPeeking ? 'Original' : 'Stylized'}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {hasError && (
              <div className="absolute inset-0 bg-red-900/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.335-.213 3.01-1.742 3.01H3.48c-1.53 0-2.492-1.675-1.743-3.01l6.52-11.59zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a.75.75 0 01-.75-.75v-3.5a.75.75 0 011.5 0v3.5A.75.75 0 0110 11z" clipRule="evenodd" />
                </svg>
                <p className="text-red-100 font-semibold">Styling blocked</p>
                <p className="text-red-200 text-xs sm:text-sm max-w-xs">
                  {error || 'This content cannot be edited or stylized.'}
                </p>
              </div>
            )}
            {isClickable && !isPeeking && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
      {showPeekButton && (
        <div className="mt-6 text-center">
          <button
            onMouseDown={onPeekStart}
            onMouseUp={onPeekEnd}
            onMouseLeave={onPeekEnd}
            onTouchStart={onPeekStart}
            onTouchEnd={onPeekEnd}
            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-lg select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
          >
            Hold to see Original
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
