import React, { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import FilterSelector from './FilterSelector';
import CategorySelector from './CategorySelector';
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
  onApplySelectedFilter: () => void;
  onClearFilter: () => void;
  isLoading: boolean;
  activeFilterId: string | null;
  selectedFilter: Filter | null;
  onReset: () => void;
  history: HistoryItem[];
  currentHistoryIndex: number;
  onSelectHistory: (index: number) => void;
  onClearHistory: () => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  categories,
  onSelectFilter,
  onApplySelectedFilter,
  onClearFilter,
  isLoading,
  activeFilterId,
  selectedFilter,
  onReset,
  history,
  currentHistoryIndex,
  onSelectHistory,
  onClearHistory,
  activeCategory,
  onCategoryChange,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
      // Disable transition during drag for immediate feedback
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    
    if (sheetRef.current) {
      // Re-enable transition for smooth animation
      sheetRef.current.style.transition = '';
      
      if (diff > 100) {
        onClose();
      } else {
        // Snap back to original position with animation
        sheetRef.current.style.transform = '';
      }
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Reset transform and prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset any lingering transform from drag gestures
      if (sheetRef.current) {
        sheetRef.current.style.transform = '';
        sheetRef.current.style.transition = '';
      }
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset scroll position when category changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeCategory]);

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop - Click to dismiss */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-gray-900/60 rounded-t-3xl shadow-2xl transition-all duration-300 landscape-compact-sheet ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '92vh',
          transitionTimingFunction: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
          backdropFilter: isOpen ? 'blur(40px)' : 'blur(0px)',
          WebkitBackdropFilter: isOpen ? 'blur(40px)' : 'blur(0px)',
          willChange: 'transform, backdrop-filter',
        }}
      >
        {/* Drag Handle Area - ONLY draggable part */}
        <div 
          className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-9 h-1 bg-white/40 rounded-full" />
        </div>

        {/* Header - iOS style - Also draggable */}
        <div 
          className="px-4 py-3 border-b border-white/10 cursor-grab active:cursor-grabbing flex items-center justify-between"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-8" />
          <h3 className="text-lg font-semibold text-white text-center tracking-tight">Styles</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable Content Area - Category, Filters and History */}
        <div ref={scrollContainerRef} className="overflow-y-auto flex-1 landscape-compact-filters" style={{ maxHeight: 'calc(92vh - 180px)' }}>
          {/* Category Selector - First */}
          <div className="py-4 border-b border-white/10">
            <CategorySelector
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />
          </div>

          {/* Filter Selector - Second */}
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
                activeCategory={activeCategory}
                onCategoryChange={onCategoryChange}
              />
            </div>
          </div>

          {/* Style History removed from mobile - only shown on desktop */}
        </div>

        {/* Upload New Image Button - Fixed at Bottom */}
        <div className="border-t border-white/10 bg-gray-900/80 backdrop-blur-xl">
          <div className="px-4 py-3 landscape-compact-actions">
            <button
              onClick={() => {
                onApplySelectedFilter();
                onClose();
              }}
              disabled={!selectedFilter || isLoading}
              className="w-full mb-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              Apply Style
            </button>
            <button
              onClick={onReset}
              className="w-full px-4 py-2.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/15 active:bg-white/20 transition-colors duration-150 flex items-center justify-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload New Image
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MobileBottomSheet;
