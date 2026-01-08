import React, { useState } from 'react';
import { X, CaretDown } from '@phosphor-icons/react';

interface HelpFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does the AI transformation work?",
    answer: "Our AI analyzes your uploaded photo and applies the selected style transformation while preserving your facial features and identity. The process takes just a few seconds."
  },
  {
    question: "What image quality works best?",
    answer: "For best results, use a clear, well-lit photo where your face is clearly visible. Front-facing photos with good lighting work best. Avoid blurry or heavily filtered images."
  },
  {
    question: "Can I combine multiple styles?",
    answer: "Currently, you can apply one style at a time. However, you can apply additional transformations to already-generated images using the AI Custom Edit feature."
  },
  {
    question: "Why did my transformation fail?",
    answer: "Transformations may fail if the image quality is too low, the face isn't clearly visible, or if the content violates our guidelines. Try using a clearer photo with better lighting."
  },
  {
    question: "What content is not allowed?",
    answer: "We don't allow inappropriate, offensive, or illegal content. Photos must contain real human faces and comply with our Terms of Service."
  },
  {
    question: "How do I save my transformed images?",
    answer: "After a transformation is complete, click the download button to save the image to your device. You can also share directly to social media."
  }
];

const HelpFAQModal: React.FC<HelpFAQModalProps> = ({ isOpen, onClose }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Help & FAQ</h2>
            <p className="text-sm text-gray-500 mt-1">Tips for the best transformations</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 pb-6">
          {/* Quick Tips Section */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Tips for Best Results</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Use natural lighting for clearer facial features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Face the camera directly for best style application</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Remove glasses if you want to try eyewear styles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Tie back hair if you want to see dramatic hair transformations</span>
              </li>
            </ul>
          </div>
          
          {/* FAQ Section */}
          <h3 className="font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <CaretDown 
                    size={20} 
                    className={`text-gray-400 flex-shrink-0 transition-transform ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedIndex === index && (
                  <div className="px-4 pb-4 text-gray-600 text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800 flex-shrink-0">
          <p className="text-center text-white text-sm">
            Still have questions? Reach out to us at{' '}
            <a href="mailto:support@aestara.app" className="font-medium underline">
              support@aestara.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQModal;
