import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, EnvelopeSimple } from '@phosphor-icons/react';

const ContactPage: React.FC = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const currentYear = new Date().getFullYear();

  const handleEmailClick = () => {
    window.location.href = 'mailto:therise03@hotmail.com?subject=Aestara - Contact';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/95 border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Aestara</span>
            </Link>
            <Link to="/">
              <span 
                className="text-xl tracking-[0.3em] text-white font-light"
              >
                AESTARA
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
            <EnvelopeSimple size={40} className="text-blue-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-3">Get in Touch</h1>
          <p className="text-slate-400 mb-8">
            Have questions, feedback, or suggestions? We'd love to hear from you.
          </p>
          
          <button
            onClick={handleEmailClick}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25"
          >
            <EnvelopeSimple size={24} />
            <span>therise03@hotmail.com</span>
          </button>
          
          <p className="text-slate-500 text-sm mt-6">
            Click to open your email client
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {currentYear} Aestara. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors font-medium text-slate-300">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
