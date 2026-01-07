import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 mt-auto flex-shrink-0 bg-slate-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        {/* Mobile: stacked layout */}
        <div className="flex flex-col items-center gap-3 sm:hidden">
          <p className="text-xs text-slate-500">
            © {currentYear} Aestara. All rights reserved.
          </p>
          <nav className="flex items-center gap-4">
            <Link to="/terms" className="text-xs text-slate-500 hover:text-white transition-colors">
              Terms
            </Link>
            <span className="text-slate-600">·</span>
            <Link to="/privacy" className="text-xs text-slate-500 hover:text-white transition-colors">
              Privacy
            </Link>
            <span className="text-slate-600">·</span>
            <Link to="/contact" className="text-xs text-slate-500 hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>
        
        {/* Desktop: single row layout */}
        <div className="hidden sm:flex items-center justify-between">
          <p className="text-sm text-slate-500">
            © {currentYear} Aestara. All rights reserved.
          </p>
          <nav className="flex items-center gap-6">
            <Link to="/terms" className="text-sm text-slate-500 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-sm text-slate-500 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-sm text-slate-500 hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
