import React from 'react';
import { X, EnvelopeSimple } from '@phosphor-icons/react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleEmailClick = () => {
    window.location.href = 'mailto:support@cognitav.com?subject=Aestara Support';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col glass-panel overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Contact Us</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-300 mb-6">
            Have a question, feedback, or need help? We'd love to hear from you! Email us directly and we'll get back to you as soon as possible.
          </p>
          
          {/* Email Card */}
          <button
            onClick={handleEmailClick}
            className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <EnvelopeSimple size={24} className="text-white/80" />
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-400">Email us directly</p>
              <p className="text-white font-medium">support@cognitav.com</p>
            </div>
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            We typically respond within 24-48 hours.
          </p>
        </div>
        
        {/* Fixed Close Button at Bottom */}
        <div className="flex-shrink-0 p-6 border-t border-white/10 bg-slate-900/95">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 glass-button-active text-blue-100 font-semibold rounded-lg hover:bg-blue-500/40 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
