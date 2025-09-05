import React from 'react';
import { Filter } from '../types';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

interface FilterSelectorProps {
  categories: FilterCategory[];
  onSelectFilter: (filter: Filter) => void;
  isLoading: boolean;
  activeFilterId: string | null;
}

const FilterSelector: React.FC<FilterSelectorProps> = ({ categories, onSelectFilter, isLoading, activeFilterId }) => {
  return (
    <div className="w-full flex flex-col space-y-5">
      {categories.map((category) => (
        <div key={category.name}>
          <h3 className="text-lg font-semibold text-gray-200 mb-3 px-1">{category.name}</h3>
          
          {/* Desktop: Grid View */}
          <div className="hidden md:block glass-panel p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {category.filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => onSelectFilter(filter)}
                  disabled={isLoading}
                  className={`px-4 py-2 font-medium ${
                    filter.id === activeFilterId
                      ? 'glass-button-active text-purple-100'
                      : 'glass-button text-gray-300 hover:text-white'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: Horizontal Scroll View */}
          <div className="md:hidden">
            <div className="flex space-x-2 overflow-x-auto pb-3 pr-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {category.filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => onSelectFilter(filter)}
                  disabled={isLoading}
                  className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap
                  ${activeFilterId === filter.id 
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400' 
                      : 'bg-gray-700/80 text-gray-200 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterSelector;
