import React from 'react';

interface FooterProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenFeedback: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenPrivacy, onOpenFeedback }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center py-8 mt-12 border-t border-gray-700/50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="mb-6">
         
          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <button
              onClick={onOpenTerms}
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              Terms of Service
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={onOpenPrivacy}
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={onOpenFeedback}
              className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Feedback
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-xs text-gray-500">
          <p>© {currentYear} AI Image Stylizer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
