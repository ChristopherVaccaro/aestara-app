import React, { useState } from 'react';
import { Filter } from '../types';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

interface FilterSelectorProps {
  categories: FilterCategory[];
  onSelectFilter: (filter: Filter) => void;
  onClearFilter: () => void;
  isLoading: boolean;
  activeFilterId: string | null;
}


const FilterSelector: React.FC<FilterSelectorProps> = ({ categories, onSelectFilter, onClearFilter, isLoading, activeFilterId }) => {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.name || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Category Selection */}
      <div className="relative">
        {/* Desktop: Click Dropdown */}
        <div className="hidden md:block">
          <div className="relative" ref={dropdownRef}>
            {/* Dropdown Trigger */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white hover:bg-white/[0.12] hover:border-white/20 rounded-lg transition-all duration-300 flex items-center justify-between"
            >
              <span className="font-medium">{activeCategory}</span>
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-lg shadow-2xl z-50 overflow-hidden">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => {
                      setActiveCategory(category.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left transition-all duration-200 ${
                      activeCategory === category.name
                        ? 'bg-blue-600/80 text-blue-100'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Horizontal Scroll Tabs */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto gap-2 pb-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeCategory === category.name
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Grid - Responsive */}
      {categories
        .filter(category => category.name === activeCategory)
        .map((category) => {
          return (
            <div key={category.name}>
              {/* Horizontal Scroll for Mobile - Show All Filters */}
              <div className="block md:hidden">
                <div className="flex gap-3 overflow-x-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {category.filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => onSelectFilter(filter)}
                      disabled={isLoading}
                      className={`flex-shrink-0 min-w-[120px] h-[80px] rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                        filter.id === activeFilterId
                          ? 'glass-button-active text-blue-100 shadow-lg border-blue-400/50'
                          : 'glass-button text-gray-300 hover:text-white hover:bg-white/[0.08] hover:backdrop-blur-xl hover:border-white/20'
                      }`}
                      title={filter.name}
                    >
                      <span className="text-sm font-medium text-center px-2 leading-tight">
                        {filter.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Grid - Show All Filters */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-3">
                {category.filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => onSelectFilter(filter)}
                    disabled={isLoading}
                    className={`h-[60px] rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center px-4 ${
                      filter.id === activeFilterId
                        ? 'glass-button-active text-blue-100 shadow-lg border-blue-400/50'
                        : 'glass-button text-gray-300 hover:text-white hover:bg-white/[0.08] hover:backdrop-blur-xl hover:border-white/20'
                    }`}
                    title={filter.name}
                  >
                    <span className="font-medium text-center text-sm leading-tight">
                      {filter.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default FilterSelector;
