import React from 'react';
import { Filter } from '../types';
import { getStyleExampleThumbSources } from '../utils/styleExamples';

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
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}


const FilterSelector: React.FC<FilterSelectorProps> = ({ 
  categories, 
  onSelectFilter, 
  onClearFilter, 
  isLoading, 
  activeFilterId,
  activeCategory,
  onCategoryChange 
}) => {
  return (
    <div className="w-full flex flex-col">
      {/* Filters Display */}
      
      {/* Mobile & Tablet: Two horizontal rows that scroll together */}
      <div className="block lg:hidden w-full overflow-x-auto transition-opacity duration-150" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <div className="grid grid-rows-2 grid-flow-col gap-2 pb-2 px-4 auto-cols-[110px]">
          {categories
            .find(category => category.name === activeCategory)
            ?.filters.map((filter) => (
              (() => {
                const thumb = getStyleExampleThumbSources(filter.id, filter.name, 'after');
                return (
                  <button
                    key={filter.id}
                    onClick={() => {
                      onSelectFilter(filter);
                    }}
                    disabled={isLoading}
                    className="group relative h-[72px] rounded-xl transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                    title={filter.name}
                  >
                    <img
                      src={thumb.primary}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.src !== thumb.fallback) {
                          el.src = thumb.fallback;
                        }
                      }}
                    />
                    <div className={`absolute inset-0 rounded-xl p-[1px] transition-all ${
                      filter.id === activeFilterId
                        ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                        : 'bg-white/10 group-hover:bg-white/20'
                    }`}>
                      <div className={`h-full w-full rounded-xl transition-all ${
                        filter.id === activeFilterId
                          ? 'bg-gradient-to-br from-blue-600/90 to-purple-600/90'
                          : 'bg-gray-800/90 group-hover:bg-gray-700/90'
                      }`} />
                    </div>
                    <div className={`relative z-10 px-2 h-full w-full flex items-center justify-start gap-2 ${
                      filter.id === activeFilterId ? 'text-white' : 'text-gray-200'
                    }`}>
                      <span className="text-xs font-semibold truncate">
                        {filter.name}
                      </span>
                    </div>
                  </button>
                );
              })()
            ))}
        </div>
      </div>

      {/* Desktop: Show filters by selected category */}
      {categories
        .filter(category => category.name === activeCategory)
        .map((category) => {
          return (
            <div key={category.name} className="hidden lg:block">
              {/* Desktop Grid - Optimized 2-column layout for better readability */}
              <div className="hidden lg:grid grid-cols-2 gap-2.5">
                {category.filters.map((filter) => {
                  const thumb = getStyleExampleThumbSources(filter.id, filter.name, 'after');
                  return (
                  <button
                    key={filter.id}
                    onClick={() => {
                      onSelectFilter(filter);
                    }}
                    disabled={isLoading}
                    className="group relative h-[48px] rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-start px-3 overflow-hidden"
                    title={filter.name}
                  >
                    <div className="relative z-10 mr-2 flex-shrink-0">
                      <img
                        src={thumb.primary}
                        alt=""
                        aria-hidden="true"
                        className="w-9 h-9 rounded-md object-cover opacity-90"
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.src !== thumb.fallback) {
                            el.src = thumb.fallback;
                          }
                        }}
                      />
                    </div>
                    <div className={`absolute inset-0 rounded-lg p-[1px] transition-all ${
                      filter.id === activeFilterId
                        ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                        : 'bg-white/10 group-hover:bg-gradient-to-r group-hover:from-blue-500/50 group-hover:via-purple-500/50 group-hover:to-pink-500/50'
                    }`}>
                      <div className={`h-full w-full rounded-lg transition-all ${
                        filter.id === activeFilterId
                          ? 'bg-gradient-to-br from-blue-600/90 to-purple-600/90'
                          : 'bg-gray-800/90 group-hover:bg-gray-700/90'
                      }`} />
                    </div>
                    <div className={`relative z-10 w-full flex items-center justify-start gap-2 ${
                      filter.id === activeFilterId ? 'text-white' : 'text-gray-200'
                    }`}>
                      <span className="text-sm font-semibold truncate">
                        {filter.name}
                      </span>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default FilterSelector;
