import React, { useState } from 'react';

export interface HistoryItem {
  id: string;
  imageUrl: string;
  filterName: string;
  filterId: string;
  timestamp: number;
}

interface StyleHistoryProps {
  history: HistoryItem[];
  currentIndex: number;
  onSelectHistory: (index: number) => void;
  onClearHistory: () => void;
  containerClassName?: string;
}

const StyleHistory: React.FC<StyleHistoryProps> = ({
  history,
  currentIndex,
  onSelectHistory,
  onClearHistory,
  containerClassName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) return null;

  const wrapperClasses = containerClassName ?? '';

  return (
    <div className={wrapperClasses}>
      {/* Horizontal scrollable thumbnails - always visible */}
      <div className="flex items-center gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
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
                className="w-12 h-12 object-cover"
              />
              {/* Overlay with filter name on hover */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] text-white font-medium text-center px-0.5 leading-tight">
                  {item.filterName}
                </span>
              </div>
              {/* Current indicator */}
              {index === currentIndex && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white"></div>
              )}
            </button>
          ))}
        </div>
        
        {/* Clear button */}
        {history.length > 1 && (
          <button
            onClick={onClearHistory}
            className="flex-shrink-0 p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Clear history"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default StyleHistory;
