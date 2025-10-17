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

  // Update active category when activeFilterId changes
  React.useEffect(() => {
    if (activeFilterId) {
      // Find which category contains the active filter
      const categoryWithActiveFilter = categories.find(cat => 
        cat.filters.some(filter => filter.id === activeFilterId)
      );
      if (categoryWithActiveFilter) {
        setActiveCategory(categoryWithActiveFilter.name);
      }
    }
  }, [activeFilterId, categories]);

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
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-white">Choose Your Style</h2>
      </div>

      {/* Category Selection */}
      <div className="relative">
        {/* Desktop: Modern Dropdown */}
        <div className="hidden lg:block">
          <div className="relative" ref={dropdownRef}>
            {/* Dropdown Trigger */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group relative w-full overflow-hidden rounded-xl transition-all duration-300"
            >
              {/* Gradient Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 group-hover:from-blue-500/70 group-hover:via-purple-500/70 group-hover:to-pink-500/70 p-[1px] rounded-xl transition-all">
                <div className="h-full w-full rounded-xl bg-gray-900/95 backdrop-blur-xl" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-semibold text-white text-lg">{activeCategory}</span>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-gray-800 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="max-h-[320px] overflow-y-auto p-2">
                  {categories.map((category, index) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        setActiveCategory(category.name);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                        activeCategory === category.name
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile & Tablet: Horizontal Scroll Tabs */}
        <div className="lg:hidden">
          <div className="flex overflow-x-auto gap-2 pb-2 px-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeCategory === category.name
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Display */}
      
      {/* Mobile & Tablet: Single horizontal row for selected category */}
      <div className="block lg:hidden w-full overflow-x-auto transition-opacity duration-150" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <div className="inline-flex gap-3 pb-2 px-4" style={{whiteSpace: 'nowrap'}}>
          {categories
            .find(category => category.name === activeCategory)
            ?.filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onSelectFilter(filter)}
                disabled={isLoading}
                className="group relative inline-block min-w-[130px] h-[75px] rounded-2xl transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden align-top"
                style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
                title={filter.name}
              >
                {/* Background with gradient border effect */}
                <div className={`absolute inset-0 rounded-2xl p-[1px] transition-all ${
                  filter.id === activeFilterId
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                    : 'bg-white/10 group-hover:bg-white/20'
                }`}>
                  <div className={`h-full w-full rounded-2xl transition-all ${
                    filter.id === activeFilterId
                      ? 'bg-gradient-to-br from-blue-600/90 to-purple-600/90'
                      : 'bg-gray-800/90 group-hover:bg-gray-700/90'
                  }`} />
                </div>
                
                {/* Content */}
                <span className={`relative z-10 text-sm text-center px-3 leading-tight font-semibold ${
                  filter.id === activeFilterId ? 'text-white' : 'text-gray-200'
                }`}>
                  {filter.name}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Desktop: Show filters by selected category */}
      {categories
        .filter(category => category.name === activeCategory)
        .map((category) => {
          return (
            <div key={category.name} className="hidden lg:block">
              {/* Desktop Grid - Show All Filters */}
              <div className="hidden lg:grid grid-cols-3 gap-3">
                {category.filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => onSelectFilter(filter)}
                    disabled={isLoading}
                    className="group relative h-[60px] rounded-xl transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center px-4 overflow-hidden"
                    title={filter.name}
                  >
                    {/* Background with gradient border effect */}
                    <div className={`absolute inset-0 rounded-xl p-[1px] transition-all ${
                      filter.id === activeFilterId
                        ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                        : 'bg-white/10 group-hover:bg-gradient-to-r group-hover:from-blue-500/50 group-hover:via-purple-500/50 group-hover:to-pink-500/50'
                    }`}>
                      <div className={`h-full w-full rounded-xl transition-all ${
                        filter.id === activeFilterId
                          ? 'bg-gradient-to-br from-blue-600/90 to-purple-600/90'
                          : 'bg-gray-800/90 group-hover:bg-gray-700/90'
                      }`} />
                    </div>
                    
                    {/* Content */}
                    <span className={`relative z-10 text-center text-sm leading-tight font-semibold ${
                      filter.id === activeFilterId ? 'text-white' : 'text-gray-200'
                    }`}>
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
