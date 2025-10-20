import React, { useState, useRef, useEffect } from 'react';

interface FilterCategory {
  name: string;
}

interface CategorySelectorProps {
  categories: FilterCategory[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or when modals open
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleModalOpen = () => {
      setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    // Listen for modal open events (custom event or focus trap)
    window.addEventListener('modal-open', handleModalOpen);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('modal-open', handleModalOpen);
    };
  }, []);

  return (
    <div className="w-full">
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
            <div className="absolute top-full left-0 right-0 mt-3 bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden p-2 z-[100]">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => {
                    onCategoryChange(category.name);
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
          )}
        </div>
      </div>

      {/* Mobile & Tablet: Horizontal Scroll Tabs */}
      <div className="lg:hidden">
        <div className="flex overflow-x-auto gap-2 pb-2 px-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => onCategoryChange(category.name)}
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
  );
};

export default CategorySelector;
