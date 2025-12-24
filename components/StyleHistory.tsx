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

  const wrapperClasses =
    containerClassName ?? 'w-full glass-panel p-4 mb-4';

  return (
    <div className={wrapperClasses}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-white/[0.02] rounded-lg p-2 -m-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-300">Style History</h3>
          <span className="text-xs text-gray-500">({history.length})</span>
          {!isExpanded && currentIndex >= 0 && (
            <span className="text-xs text-blue-400 font-medium">
              • {history[currentIndex].filterName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearHistory();
              }}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2"
              title="Clear history"
            >
              Clear
            </button>
          )}
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin mt-3">
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
                  className="w-16 h-16 object-cover"
                />
                {/* Overlay with filter name on hover */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs text-white font-medium text-center px-1">
                    {item.filterName}
                  </span>
                </div>
                {/* Current indicator */}
                {index === currentIndex && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StyleHistory;
