import React from 'react';

interface FeedbackFormProps {
  onClose: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const handleEmailClick = () => {
    window.location.href = 'mailto:therise03@hotmail.com?subject=AI Image Stylizer - Feedback';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal" onClick={onClose}>
      <div 
        className="glass-panel max-w-lg w-full max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 pb-4">
          {/* Header */}
          <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Feedback & Suggestions</h1>
          <p className="text-sm text-gray-400">
            We'd love to hear from you! Share your thoughts, report issues, or suggest new features.
          </p>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div className="glass-panel p-4">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">How to Contact Us</h3>
            <p className="text-sm text-gray-300 mb-3">
              Send us an email with your feedback, bug reports, feature requests, or questions.
            </p>
            <button
              onClick={handleEmailClick}
              className="w-full px-4 py-3 glass-button-active text-blue-100 font-medium rounded-lg hover:bg-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email: therise03@hotmail.com
            </button>
          </div>

          <div className="glass-panel p-4">
            <h3 className="text-sm font-semibold text-green-300 mb-2">What We'd Love to Hear</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Feature suggestions and improvements</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Bug reports and technical issues</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>New art style requests</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>General feedback and questions</span>
              </li>
            </ul>
          </div>
          </div>
        </div>

        {/* Fixed Close Button at Bottom */}
        <div className="flex-shrink-0 p-6 border-t border-gray-600 bg-gray-900/95">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 glass-button text-gray-300 font-medium rounded-lg hover:bg-white/[0.12] transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
