import React, { useState } from 'react';
import { CaretDown, CaretUp, Trash } from '@phosphor-icons/react';

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
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/8 rounded-lg border border-white/10 transition-colors"
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

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-32 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin">
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
  );
};

export default StyleHistory;
