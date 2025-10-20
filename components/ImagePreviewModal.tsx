import React, { useEffect, useRef } from 'react';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
  filterName?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose, filterName }) => {
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  
  useEffect(() => {
    // Dispatch event to close any open dropdowns
    window.dispatchEvent(new Event('modal-open'));
    
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscKey);

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Lock background scroll while modal is open
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default scrolling behavior during swipe
    const currentY = e.touches[0].clientY;
    const swipeDistance = currentY - touchStartY.current;
    
    // Only prevent default if swiping down
    if (swipeDistance > 0) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    touchEndY.current = e.changedTouches[0].clientY;
    const swipeDistance = touchEndY.current - touchStartY.current;
    const minSwipeDistance = 80; // Reduced threshold for easier triggering
    
    // Close modal if swiped down significantly
    if (swipeDistance > minSwipeDistance) {
      onClose();
    }
  };

  const handleDownloadClick = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filterName ? `stylized-${filterName.toLowerCase().replace(/\s+/g, '-')}.png` : 'stylized-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 glass-modal"
      style={{ zIndex: 10000 }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="h-full overflow-y-auto overscroll-contain flex items-start justify-center py-8">
        <div
          className="relative max-w-4xl p-4"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
          onTouchStart={(e) => e.stopPropagation()} // Prevent swipe detection on image
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <img 
            src={imageUrl} 
            alt="Stylized preview" 
            className="w-auto h-auto max-w-full object-contain rounded-lg shadow-2xl" 
          />
          <div className="absolute top-3 right-3">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
