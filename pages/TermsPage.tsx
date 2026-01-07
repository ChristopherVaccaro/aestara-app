import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

const TermsPage: React.FC = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-900">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed">
                By accessing or using Aestara ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to all terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p className="text-sm leading-relaxed">
                Aestara provides AI-powered image style transformation services. Users can upload images 
                and apply various artistic filters and styles using artificial intelligence technology.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
              <p className="text-sm leading-relaxed mb-2">
                When using our Service, you agree to:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Only upload images you own or have permission to use</li>
                <li>Not upload content that violates laws or third-party rights</li>
                <li>Not use the Service for illegal, harmful, or offensive purposes</li>
                <li>Not attempt to reverse engineer or compromise the Service</li>
                <li>Not use the Service to create deceptive or misleading content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
              
              <h3 className="text-lg font-medium text-slate-200 mb-2 mt-4">4.1 Your Content</h3>
              <p className="text-sm leading-relaxed">
                You retain ownership of images you upload. By using the Service, you grant us a temporary, 
                limited license to process your images solely for providing the Service.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-2 mt-4">4.2 Generated Content</h3>
              <p className="text-sm leading-relaxed">
                You own the stylized images created through our Service. We do not claim ownership 
                of your generated content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Prohibited Uses</h2>
              <p className="text-sm leading-relaxed mb-2">
                You may NOT use the Service to:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Create non-consensual intimate imagery</li>
                <li>Generate content depicting minors inappropriately</li>
                <li>Produce content promoting violence or hate</li>
                <li>Create fraudulent or deceptive materials</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Disclaimer of Warranties</h2>
              <p className="text-sm leading-relaxed">
                The Service is provided "as is" without warranties of any kind. We do not guarantee 
                uninterrupted access, specific results, or accuracy of AI-generated content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
              <p className="text-sm leading-relaxed">
                To the maximum extent permitted by law, we shall not be liable for any indirect, 
                incidental, or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Changes to Terms</h2>
              <p className="text-sm leading-relaxed">
                We reserve the right to modify these Terms at any time. Continued use of the Service 
                after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
              <p className="text-sm leading-relaxed">
                For questions about these Terms, please visit our Contact page.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {currentYear} Aestara. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="hover:text-white transition-colors font-medium text-slate-300">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
