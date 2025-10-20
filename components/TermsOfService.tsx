import React from 'react';

interface TermsOfServiceProps {
  onClose: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onClose }) => {
  // Dispatch event to close any open dropdowns
  React.useEffect(() => {
    window.dispatchEvent(new Event('modal-open'));
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 glass-modal" onClick={onClose}>
      <div 
        className="glass-panel max-w-3xl w-full max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 pb-4">
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing and using AI Image Stylizer ("the Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Use of Service</h2>
            <p className="text-sm leading-relaxed mb-2">
              The Service allows you to upload images and apply AI-powered artistic style transformations. You agree to:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Only upload images you own or have permission to use</li>
              <li>Not upload images containing illegal, harmful, or offensive content</li>
              <li>Not use the Service for any unlawful purpose</li>
              <li>Not attempt to reverse engineer or exploit the Service</li>
              <li>Not upload images containing personal information of others without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Intellectual Property</h2>
            <p className="text-sm leading-relaxed mb-2">
              You retain all rights to the images you upload. By using the Service, you grant us a temporary, 
              non-exclusive license to process your images for the sole purpose of applying the requested style transformations.
            </p>
            <p className="text-sm leading-relaxed">
              The styled output images are yours to use as you wish. However, you acknowledge that similar outputs 
              may be generated for other users using similar inputs and styles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Privacy and Data</h2>
            <p className="text-sm leading-relaxed mb-2">
              We are committed to protecting your privacy:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Images are processed in real-time and not permanently stored on our servers</li>
              <li>We do not sell, share, or distribute your images to third parties</li>
              <li>Temporary processing data is automatically deleted after processing</li>
              <li>We may collect anonymous usage statistics to improve the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Service Availability</h2>
            <p className="text-sm leading-relaxed">
              We strive to provide reliable service but do not guarantee uninterrupted access. The Service is provided 
              "as is" without warranties of any kind. We reserve the right to modify, suspend, or discontinue the Service 
              at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use or inability to use the Service. This includes 
              any loss of data, revenue, or profits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Content Moderation</h2>
            <p className="text-sm leading-relaxed">
              We use automated content filtering to prevent processing of inappropriate content. Images that violate 
              our content policies may be rejected. We reserve the right to refuse service for any content we deem inappropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Third-Party Services</h2>
            <p className="text-sm leading-relaxed">
              The Service uses Google's Gemini AI for image processing. Your use of the Service is also subject to 
              Google's terms of service and privacy policies. We are not responsible for third-party service availability 
              or performance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Age Restrictions</h2>
            <p className="text-sm leading-relaxed">
              You must be at least 13 years old to use this Service. If you are under 18, you must have parental 
              or guardian consent to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
            <p className="text-sm leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
              Your continued use of the Service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
            <p className="text-sm leading-relaxed">
              These terms shall be governed by and construed in accordance with applicable laws, without regard to 
              conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
            <p className="text-sm leading-relaxed">
              If you have questions about these Terms of Service, please use our Feedback form to contact us.
            </p>
          </section>
          </div>
        </div>

        {/* Fixed Close Button at Bottom */}
        <div className="flex-shrink-0 p-6 border-t border-gray-600 bg-gray-900/95">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 glass-button-active text-blue-100 font-semibold rounded-lg hover:bg-blue-500/40 transition-all duration-300"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
