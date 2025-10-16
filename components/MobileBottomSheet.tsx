import React, { useEffect, useRef } from 'react';
import FilterSelector from './FilterSelector';
import ShareButton from './ShareButton';
import StyleHistory, { HistoryItem } from './StyleHistory';
import { Filter } from '../types';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FilterCategory[];
  onSelectFilter: (filter: Filter) => void;
  onClearFilter: () => void;
  isLoading: boolean;
  activeFilterId: string | null;
  onDownload: () => void;
  onReset: () => void;
  generatedImageUrl: string | null;
  styleName?: string | null;
  history: HistoryItem[];
  currentHistoryIndex: number;
  onSelectHistory: (index: number) => void;
  onClearHistory: () => void;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  categories,
  onSelectFilter,
  onClearFilter,
  isLoading,
  activeFilterId,
  onDownload,
  onReset,
  generatedImageUrl,
  styleName,
  history,
  currentHistoryIndex,
  onSelectHistory,
  onClearHistory,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  // Handle touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    
    if (diff > 100) {
      onClose();
    }
    
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-gray-900/60 rounded-t-3xl shadow-2xl transition-all duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '85vh',
          transitionTimingFunction: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
          backdropFilter: isOpen ? 'blur(40px)' : 'blur(0px)',
          WebkitBackdropFilter: isOpen ? 'blur(40px)' : 'blur(0px)',
          transform: 'translateZ(0)',
          willChange: 'transform, backdrop-filter',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle - iOS style */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-9 h-1 bg-white/40 rounded-full" />
        </div>

        {/* Header - iOS style */}
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white text-center tracking-tight">Styles</h3>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {/* Filter Selector - First */}
          <div className="py-4 border-b border-white/10">
            <div className="overflow-x-visible">
              <FilterSelector
                categories={categories}
                onSelectFilter={(filter) => {
                  onSelectFilter(filter);
                  // Optional: close sheet after selection
                  // setTimeout(() => onClose(), 300);
                }}
                onClearFilter={onClearFilter}
                isLoading={isLoading}
                activeFilterId={activeFilterId}
              />
            </div>
          </div>

          {/* Style History - Below Filter Selector */}
          {history.length > 0 && (
            <div className="px-4 py-4 border-b border-white/10">
              <StyleHistory
                history={history}
                currentIndex={currentHistoryIndex}
                onSelectHistory={onSelectHistory}
                onClearHistory={onClearHistory}
              />
            </div>
          )}

          {/* Action Buttons - Below */}
          <div className="px-4 py-4 space-y-2">
            <button
              onClick={onDownload}
              disabled={!generatedImageUrl || isLoading}
              className="w-full px-6 py-3 bg-green-500/20 backdrop-blur-xl border border-green-400/30 text-green-100 font-semibold rounded-lg hover:bg-green-500/30 hover:border-green-400/50 transition-all duration-300 disabled:bg-gray-500/20 disabled:border-gray-400/20 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Image
            </button>
            
            <ShareButton 
              imageUrl={generatedImageUrl}
              styleName={styleName}
            />
            
            <button
              onClick={onReset}
              className="w-full px-4 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/15 active:bg-white/20 transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload New Image
            </button>
          </div>
        </div>

        {/* Close Button - iOS X style */}
        <div className="absolute top-3 right-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors duration-150 flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomSheet;
