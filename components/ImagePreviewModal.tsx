import React, { useEffect } from 'react';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'stylized-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-80"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="h-full overflow-y-auto overscroll-contain flex items-start justify-center py-8">
        <div
          className="relative max-w-4xl p-4"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
        >
          <img 
            src={imageUrl} 
            alt="Stylized preview" 
            className="w-auto h-auto max-w-full object-contain rounded-lg shadow-2xl" 
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={handleDownload}
              className="text-white bg-blue-600/80 rounded-full p-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Download image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-white bg-gray-800 bg-opacity-70 rounded-full p-2 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
