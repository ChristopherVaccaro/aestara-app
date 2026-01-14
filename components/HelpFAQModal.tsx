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
    question: "What is Aestara?",
    answer: "Aestara is an AI-powered photo styling app that transforms your photos with artistic styles. Upload any photo, browse our curated style categories, and apply stunning transformations in seconds."
  },
  {
    question: "How do I use Aestara?",
    answer: "Simply upload a photo, browse the style categories (like Artistic, Cinematic, Vintage, etc.), select a style you like, and tap 'Apply Style'. Your transformed image will be ready in moments."
  },
  {
    question: "What is AI Custom Edit?",
    answer: "AI Custom Edit lets you describe any changes you want to make to your image using natural language. Just type what you want (e.g., 'make the background a sunset beach') and our AI will apply your custom edits."
  },
  {
    question: "How do I save my styled images?",
    answer: "After styling, use the download button to save images to your device. You can also share directly to social media, or find all your creations in the Gallery accessible from your profile."
  },
  {
    question: "What makes a good source photo?",
    answer: "For best results, use clear, well-lit photos. Higher resolution images produce better transformations. Avoid heavily filtered or very dark images."
  },
  {
    question: "Can I favorite and organize my images?",
    answer: "Yes! Tap the heart icon on any generated image to favorite it. Access your Gallery to view all your creations, filter by favorites, and sort by date."
  },
  {
    question: "Where can I adjust app settings?",
    answer: "Tap your profile icon to access Account Settings. Here you can customize preferences like the Style Button position on mobile devices."
  }
];

const HelpFAQModal: React.FC<HelpFAQModalProps> = ({ isOpen, onClose }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-panel w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
          <div>
            <h2 className="text-xl font-semibold text-white">Help & FAQ</h2>
            <p className="text-sm text-slate-400 mt-1">Tips for the best transformations</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 pt-4">
          {/* Quick Tips Section */}
          <div className="bg-slate-800/50 rounded-xl p-5 mb-6 border border-white/5">
            <h3 className="font-semibold text-white mb-3">Quick Tips for Best Results</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Use high-quality, well-lit photos for the best transformations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Browse different style categories to discover new looks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Use AI Custom Edit to make specific changes with natural language</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Favorite your best creations to easily find them later in your Gallery</span>
              </li>
            </ul>
          </div>
          
          {/* FAQ Section */}
          <h3 className="font-semibold text-white mb-3">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-white/10 rounded-xl overflow-hidden bg-slate-800/30"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800 transition-colors"
                >
                  <span className="font-medium text-slate-200 pr-4">{faq.question}</span>
                  <CaretDown 
                    size={20} 
                    className={`text-slate-400 flex-shrink-0 transition-transform ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedIndex === index && (
                  <div className="px-4 pb-4 text-slate-400 text-sm border-t border-white/5 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-white/10 flex-shrink-0">
          <p className="text-center text-slate-400 text-sm">
            Still have questions? Reach out to us at{' '}
            <a href="mailto:support@cognitav.com" className="font-medium text-blue-400 hover:text-blue-300 underline">
              support@cognitav.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQModal;
