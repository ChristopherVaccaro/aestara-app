import React, { useState } from 'react';
import { Menu, X, FileText, Shield, MessageCircle, BarChart3 } from 'lucide-react';
import FeedbackForm from './FeedbackForm';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import { AuthButton } from './AuthButton';

const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const currentYear = new Date().getFullYear();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleFeedbackClick = () => {
    setShowFeedback(true);
  };

  const handleTermsClick = () => {
    setShowTerms(true);
  };

  const handlePrivacyClick = () => {
    setShowPrivacy(true);
  };

  const handleAnalyticsClick = () => {
    // Build URL to admin dashboard; in dev add dev=true for bypass
    // @ts-ignore - Vite env var
    const isDev = import.meta.env?.DEV || window.location.hostname === 'localhost';
    const params = new URLSearchParams(window.location.search);
    params.set('page', 'admin');
    if (isDev) params.set('dev', 'true');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.open(newUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 md:top-[26px] right-4 md:right-6 z-[70] p-2 hover:opacity-70 transition-opacity duration-200"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 md:w-7 md:h-7 text-gray-400" />
        ) : (
          <Menu className="w-6 h-6 md:w-7 md:h-7 text-gray-400" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          onClick={closeMenu}
        />
      )}

      {/* Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 z-[65] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-24 px-4">
          {/* Auth Button */}
          <div className="mb-4">
            <AuthButton />
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col space-y-2">
            <button
              onClick={handleAnalyticsClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-white text-left"
            >
              <BarChart3 className="w-5 h-5 text-white" />
              <span>Analytics Dashboard</span>
            </button>
            <button
              onClick={handleTermsClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-white text-left"
            >
              <FileText className="w-5 h-5 text-white" />
              <span>Terms of Service</span>
            </button>

            <button
              onClick={handlePrivacyClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-white text-left"
            >
              <Shield className="w-5 h-5 text-white" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={handleFeedbackClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-white text-left"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span>Feedback</span>
            </button>
          </nav>

          {/* Footer Info */}
          <div className="mt-auto pb-6 text-center text-white/60 text-sm">
            <p>© {currentYear} AI Image Stylizer</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {showFeedback && <FeedbackForm onClose={() => setShowFeedback(false)} />}
    </>
  );
};

export default HamburgerMenu;
