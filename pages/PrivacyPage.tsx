import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

const PrivacyPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
              <p className="text-sm leading-relaxed">
                At Aestara, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
                and protect your information when you use our Service. By using the Service, you agree to the collection 
                and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-slate-200 mb-2 mt-4">2.1 Images You Upload</h3>
              <p className="text-sm leading-relaxed mb-2">
                When you use our Service, you upload images for style transformation. These images:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Are processed in real-time using AI technology</li>
                <li>Are temporarily stored in memory during processing only</li>
                <li>Are automatically deleted after processing is complete</li>
                <li>Are NOT permanently saved to our servers or databases</li>
                <li>Are NOT used to train AI models or for any other purpose</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-2 mt-4">2.2 Usage Data</h3>
              <p className="text-sm leading-relaxed mb-2">
                We may collect anonymous usage statistics, including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Browser type and version</li>
                <li>Device type and operating system</li>
                <li>Pages visited and features used</li>
                <li>Time and date of visits</li>
                <li>Style filters applied (without image data)</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-2 mt-4">2.3 Cookies and Local Storage</h3>
              <p className="text-sm leading-relaxed">
                We may use browser local storage to save your preferences and improve your experience. 
                This data stays on your device and is not transmitted to our servers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
              <p className="text-sm leading-relaxed mb-2">
                We use the collected information for:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Processing your images with the requested style transformations</li>
                <li>Improving and optimizing the Service</li>
                <li>Analyzing usage patterns to enhance user experience</li>
                <li>Detecting and preventing technical issues</li>
                <li>Ensuring compliance with our Terms of Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing and Third Parties</h2>
              
              <h3 className="text-lg font-medium text-slate-200 mb-2 mt-4">4.1 Google Gemini AI</h3>
              <p className="text-sm leading-relaxed">
                Our Service uses Google's Gemini AI API for image processing. Your images are sent to Google's servers 
                for processing and are subject to Google's privacy policies.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-2 mt-4">4.2 No Sale of Data</h3>
              <p className="text-sm leading-relaxed">
                We do NOT sell, rent, or trade your images or personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
              <p className="text-sm leading-relaxed mb-2">
                We implement security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure API connections to third-party services</li>
                <li>Automatic deletion of temporary processing data</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
              <p className="text-sm leading-relaxed mb-2">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Access and control what images you upload</li>
                <li>Stop using the Service at any time</li>
                <li>Clear your browser's local storage and cookies</li>
                <li>Request information about data we may have collected</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
              <p className="text-sm leading-relaxed">
                If you have questions or concerns about this Privacy Policy, please visit our Contact page.
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
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors font-medium text-slate-300">
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

export default PrivacyPage;
