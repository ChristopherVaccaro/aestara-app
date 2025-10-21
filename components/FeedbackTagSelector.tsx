import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Sparkles, Eye, Zap } from 'lucide-react';
import { FeedbackTag, getAllFeedbackTags } from '../services/feedbackTagService';

interface FeedbackTagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedTagIds: string[]) => void;
  filterName: string;
  onShowToast?: (message: string, type: 'success' | 'info') => void;
}

const CATEGORY_ICONS = {
  quality: AlertCircle,
  style: Sparkles,
  preservation: Eye,
  technical: Zap,
};

const CATEGORY_LABELS = {
  quality: 'Quality Issues',
  style: 'Style Issues',
  preservation: 'Preservation Issues',
  technical: 'Technical Issues',
};

const CATEGORY_COLORS = {
  quality: 'text-red-600 bg-red-50 border-red-200',
  style: 'text-purple-600 bg-purple-50 border-purple-200',
  preservation: 'text-blue-600 bg-blue-50 border-blue-200',
  technical: 'text-orange-600 bg-orange-50 border-orange-200',
};

export const FeedbackTagSelector: React.FC<FeedbackTagSelectorProps> = ({
  isOpen,
  onClose,
  onSubmit,
  filterName,
  onShowToast,
}) => {
  const [tags, setTags] = useState<FeedbackTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const touchStartY = React.useRef<number>(0);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTags();
      setSelectedTagIds(new Set()); // Reset selection
      setShowError(false); // Reset error
      // Dispatch event to close any open dropdowns
      window.dispatchEvent(new Event('modal-open'));
    }
  }, [isOpen]);

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchEndY - touchStartY.current;
    
    // If swiped down more than 100px, close drawer
    if (swipeDistance > 100) {
      onClose();
    }
  };

  const loadTags = async () => {
    setIsLoading(true);
    const fetchedTags = await getAllFeedbackTags();
    setTags(fetchedTags);
    setIsLoading(false);
  };

  const toggleTag = (tagId: string) => {
    setShowError(false); // Clear error when user selects something
    setSelectedTagIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    const tagArray = Array.from(selectedTagIds);
    if (selectedTagIds.size === 0) {
      // Show inline error if no tags selected
      setShowError(true);
      return;
    }
    
    onSubmit(tagArray);
    onShowToast?.(`Feedback submitted with ${tagArray.length} issue${tagArray.length !== 1 ? 's' : ''}. Thank you!`, 'success');
    window.dispatchEvent(new Event('modal-close'));
    onClose();
  };

  const handleSkip = () => {
    onSubmit([]); // Submit with no tags
    onShowToast?.('Feedback recorded. Thank you!', 'success');
    window.dispatchEvent(new Event('modal-close'));
    onClose();
  };
  
  const handleClose = () => {
    window.dispatchEvent(new Event('modal-close'));
    onClose();
  };

  if (!isOpen) return null;

  // Group tags by category (exclude technical)
  const tagsByCategory = tags
    .filter(tag => tag.category !== 'technical')
    .reduce((acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    }, {} as Record<string, FeedbackTag[]>);

  return (
    <>
      {/* Mobile: Bottom Drawer */}
      <div className="lg:hidden fixed inset-0 z-[10000] glass-modal">
        <div 
          ref={drawerRef}
          className="fixed bottom-0 left-0 right-0 glass-panel rounded-t-3xl flex flex-col max-h-[90vh] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Fixed Header */}
        <div 
          className="flex-shrink-0 p-6 pb-4 border-b border-white/10"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing"></div>
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">
                Help us improve "{filterName}"
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors ml-4 flex-shrink-0"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pb-4 overscroll-contain">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="space-y-5">
              {(Object.entries(tagsByCategory) as [string, FeedbackTag[]][]).map(([category, categoryTags]) => {
                const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon size={16} className={`${colorClass.split(' ')[0]}`} />
                      <h4 className="font-semibold text-white text-sm">
                        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                      </h4>
                    </div>
                    
                    {/* Stacked Tags (no grid, full width) */}
                    <div className="space-y-2">
                      {categoryTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={`
                            w-full text-left px-4 py-3 rounded-lg border-2 transition-all
                            ${selectedTagIds.has(tag.id)
                              ? `${colorClass} border-current font-medium`
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300 hover:text-white active:scale-[0.98]'
                            }
                          `}
                          title={tag.tag_description || undefined}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{tag.tag_label}</span>
                                {selectedTagIds.has(tag.id) && (
                                  <span className="text-xs">✓</span>
                                )}
                              </div>
                              {tag.tag_description && (
                                <p className="text-xs opacity-60 mt-0.5">
                                  {tag.tag_description}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/30 backdrop-blur-xl">
          {/* Error Message */}
          {showError && (
            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-300 text-center font-medium">
                Please select at least one issue or click Skip
              </p>
            </div>
          )}
          
          {/* Selection Count */}
          <div className="text-center mb-3">
            {selectedTagIds.size > 0 ? (
              <span className="text-sm font-medium text-purple-400">
                {selectedTagIds.size} issue{selectedTagIds.size !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span className="text-sm text-gray-500">No issues selected</span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 text-gray-300 hover:text-white transition-colors border border-white/10 rounded-xl hover:border-white/20 font-medium"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
            >
              Submit
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            Your feedback helps our AI improve this style
          </p>
        </div>
        </div>
      </div>

      {/* Desktop: Side Drawer */}
      <div className="hidden lg:block fixed inset-0 z-[10000]" onClick={handleClose}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Side Drawer */}
        <div 
          className="fixed right-0 top-0 h-full w-[480px] glass-panel flex flex-col shadow-2xl animate-slide-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="flex-shrink-0 p-6 pb-4 border-b border-white/10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">
                  Help us improve "{filterName}"
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Select issues you noticed (optional)
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors ml-4 flex-shrink-0"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Scrollable Content Area - Two Columns */}
          <div className="flex-1 overflow-y-auto p-6 pb-4 overscroll-contain">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {(Object.entries(tagsByCategory) as [string, FeedbackTag[]][]).map(([category, categoryTags]) => {
                  const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                  const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
                  
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={18} className={`${colorClass.split(' ')[0]}`} />
                        <h4 className="font-semibold text-white text-base">
                          {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                        </h4>
                      </div>
                      
                      {/* Two-column grid for desktop */}
                      <div className="grid grid-cols-2 gap-3">
                        {categoryTags.map(tag => (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`
                              text-left px-4 py-3 rounded-lg border-2 transition-all
                              ${selectedTagIds.has(tag.id)
                                ? `${colorClass} border-current font-medium`
                                : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300 hover:text-white active:scale-[0.98]'
                              }
                            `}
                            title={tag.tag_description || undefined}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{tag.tag_label}</span>
                              {selectedTagIds.has(tag.id) && (
                                <span className="text-xs">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 p-6 border-t border-white/10 bg-black/30 backdrop-blur-xl">
            {/* Error Message */}
            {showError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-300 text-center font-medium">
                  Please select at least one issue or click Skip
                </p>
              </div>
            )}
            
            {/* Selection Count */}
            <div className="text-center mb-4">
              {selectedTagIds.size > 0 ? (
                <span className="text-sm font-medium text-purple-400">
                  {selectedTagIds.size} issue{selectedTagIds.size !== 1 ? 's' : ''} selected
                </span>
              ) : (
                <span className="text-sm text-gray-500">No issues selected</span>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-5 py-3.5 text-gray-300 hover:text-white transition-colors border border-white/10 rounded-xl hover:border-white/20 font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
              >
                Submit Feedback
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              Your feedback helps our AI improve this style
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
