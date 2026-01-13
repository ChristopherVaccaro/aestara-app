import React, { useState } from 'react';
import { CaretDown, CaretUp, Trash } from '@phosphor-icons/react';

export interface HistoryItem {
  id: string;
  imageUrl: string;
  filterName: string;
  filterId: string;
  timestamp: number;
  galleryId?: string;
}

interface StyleHistoryProps {
  history: HistoryItem[];
  currentIndex: number;
  onSelectHistory: (index: number) => void;
  onClearHistory: () => void;
  containerClassName?: string;
  /** If true, always show expanded without accordion toggle (for mobile) */
  alwaysExpanded?: boolean;
}

const StyleHistory: React.FC<StyleHistoryProps> = ({
  history,
  currentIndex,
  onSelectHistory,
  onClearHistory,
  containerClassName,
  alwaysExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded);

  if (history.length === 0) return null;

  const wrapperClasses = containerClassName ?? '';
  const effectivelyExpanded = alwaysExpanded || isExpanded;

  return (
    <div className={wrapperClasses}>
      {/* Single container with border that wraps both header and content */}
      <div className={`bg-white/5 border border-white/10 rounded-lg overflow-hidden transition-all duration-300 ${
        effectivelyExpanded ? 'pb-2' : ''
      }`}>
        {/* Accordion Header - simplified on mobile (no toggle) */}
        {alwaysExpanded ? (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/80">Style History</span>
              <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                {history.length}
              </span>
            </div>
            {history.length > 1 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                title="Clear history"
              >
                <Trash size={14} />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/80">Style History</span>
              <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                {history.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isExpanded && history.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearHistory();
                  }}
                  className="p-1 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                  title="Clear history"
                >
                  <Trash size={14} />
                </button>
              )}
              {isExpanded ? (
                <CaretUp size={16} className="text-white/50" />
              ) : (
                <CaretDown size={16} className="text-white/50" />
              )}
            </div>
          </button>
        )}

        {/* Collapsible Content - inside the same bordered container */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            effectivelyExpanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex gap-2 overflow-x-auto pb-1 pt-1 px-3 scrollbar-thin">
            {history.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onSelectHistory(index)}
                className={`flex-shrink-0 relative group ${
                  index === currentIndex
                    ? 'ring-2 ring-blue-500'
                    : 'ring-1 ring-white/10 hover:ring-blue-400/50'
                } rounded-lg overflow-hidden transition-all duration-200`}
                title={`${item.filterName} - ${new Date(item.timestamp).toLocaleTimeString()}`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.filterName}
                  className="w-14 h-14 object-cover"
                />
                {/* Overlay with filter name on hover */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] text-white font-medium text-center px-0.5 leading-tight">
                    {item.filterName}
                  </span>
                </div>
                {/* Current indicator */}
                {index === currentIndex && (
                  <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleHistory;
