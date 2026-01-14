import React from 'react';

interface FooterProps {
  onOpenContact?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenContact, onOpenTerms, onOpenPrivacy }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto flex-shrink-0 py-4">
      {/* Desktop: horizontal layout */}
      <div className="hidden sm:flex max-w-6xl mx-auto px-4 sm:px-6 items-center justify-between">
        <p className="text-sm text-slate-500">
          © {currentYear} Aestara by Cognitav. All rights reserved.
        </p>
        <nav className="flex items-center gap-4">
          <button 
            onClick={onOpenTerms}
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            Terms of Service
          </button>
          <button 
            onClick={onOpenPrivacy}
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
          <button 
            onClick={onOpenContact}
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            Contact Us
          </button>
        </nav>
      </div>
      
      {/* Mobile: stacked layout - copyright above, links below */}
      <div className="sm:hidden flex flex-col items-center gap-2 px-4">
        <p className="text-xs text-slate-500">
          © {currentYear} Aestara by Cognitav. All rights reserved.
        </p>
        <nav className="flex items-center gap-4">
          <button 
            onClick={onOpenTerms}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Terms
          </button>
          <button 
            onClick={onOpenPrivacy}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Privacy
          </button>
          <button 
            onClick={onOpenContact}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Contact Us
          </button>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
