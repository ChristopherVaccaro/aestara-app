import React from 'react';

interface FooterProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenFeedback: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenPrivacy, onOpenFeedback }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center py-2 flex-shrink-0">
      <div className="max-w-6xl mx-auto px-4">
        {/* Single line footer with all content */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs text-gray-500">
          <span className="hidden md:inline">© {currentYear} AI Image Stylizer</span>
          <span className="md:hidden">© {currentYear}</span>
          <span className="text-gray-600">•</span>
          <button
            onClick={onOpenTerms}
            className="text-gray-400 hover:text-blue-400 transition-colors"
          >
            Terms
          </button>
          <span className="text-gray-600">•</span>
          <button
            onClick={onOpenPrivacy}
            className="text-gray-400 hover:text-blue-400 transition-colors"
          >
            Privacy
          </button>
          <span className="text-gray-600">•</span>
          <button
            onClick={onOpenFeedback}
            className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Feedback
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
