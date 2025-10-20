import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
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
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p className="text-sm leading-relaxed">
              At AI Image Stylizer, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              and protect your information when you use our Service. By using the Service, you agree to the collection 
              and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">2.1 Images You Upload</h3>
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

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">2.2 Usage Data</h3>
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
            <p className="text-sm leading-relaxed mt-2">
              This data is collected anonymously and cannot be used to identify you personally.
            </p>

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">2.3 Cookies and Local Storage</h3>
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
            
            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">4.1 Google Gemini AI</h3>
            <p className="text-sm leading-relaxed">
              Our Service uses Google's Gemini AI API for image processing. Your images are sent to Google's servers 
              for processing and are subject to Google's privacy policies. Google does not use your images for training 
              their models when using the API.
            </p>

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">4.2 No Sale of Data</h3>
            <p className="text-sm leading-relaxed">
              We do NOT sell, rent, or trade your images or personal information to third parties for marketing purposes.
            </p>

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">4.3 Legal Requirements</h3>
            <p className="text-sm leading-relaxed">
              We may disclose information if required by law or in response to valid legal requests from authorities.
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
            <p className="text-sm leading-relaxed mt-2">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your 
              information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights and Choices</h2>
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
            <h2 className="text-xl font-semibold text-white mb-3">7. Children's Privacy</h2>
            <p className="text-sm leading-relaxed">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If you are a parent or guardian and believe your child has provided 
              us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. International Users</h2>
            <p className="text-sm leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. By using the Service, 
              you consent to such transfers. We ensure appropriate safeguards are in place to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to Privacy Policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated 
              "Last Updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact Us</h2>
            <p className="text-sm leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our data practices, please use our 
              Feedback form to contact us.
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
