import React, { useMemo, useState } from 'react';
import {
  Sparkle,
  MagicWand,
  Camera,
  Browsers,
  Palette,
  Sun,
  Smiley,
  Star,
  X,
  Check,
} from '@phosphor-icons/react';
import { Filter } from '../types';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

interface GlamatronStyleSidebarProps {
  categories: FilterCategory[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  selectedFilterId: string | null;
  onSelectFilter: (filter: Filter) => void;
  isLoading: boolean;
  onApplySelectedFilter: () => void;
  canApply: boolean;
  onUploadNewImage: () => void;
  onRemoveImage?: () => void;
  hasImage?: boolean;
  disabled?: boolean;
}

const getCategoryIcon = (name: string) => {
  const key = name.toLowerCase();
  if (key.includes('artistic')) return Palette;
  if (key.includes('photo')) return Camera;
  if (key.includes('trendy') || key.includes('social')) return Browsers;
  if (key.includes('seasonal') || key.includes('holiday')) return Sun;
  if (key.includes('classic')) return Star;
  if (key.includes('fun') || key.includes('transform')) return MagicWand;
  if (key.includes('aesthetic')) return Sparkle;
  return Smiley;
};

const GlamatronStyleSidebar: React.FC<GlamatronStyleSidebarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  selectedFilterId,
  onSelectFilter,
  isLoading,
  onApplySelectedFilter,
  canApply,
  onUploadNewImage,
  onRemoveImage,
  hasImage = true,
  disabled = false,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const active = useMemo(() => {
    return categories.find((c) => c.name === activeCategory) || categories[0];
  }, [categories, activeCategory]);

  return (
    <>
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#05060a]/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      <div className="relative flex items-start z-50">
        <div className={`flex flex-col gap-2 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 p-2 ${disabled ? 'opacity-50' : ''}`}>
          {/* X button to remove uploaded image */}
          {hasImage && onRemoveImage && (
            <div className="relative group">
              <button
                onClick={onRemoveImage}
                disabled={isLoading}
                className="h-11 w-11 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent"
                aria-label="Remove image"
              >
                <X className="w-5 h-5" weight="bold" />
              </button>
              <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Remove image
              </div>
            </div>
          )}
          
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.name);
            const isActive = isPanelOpen && c.name === activeCategory;
            const isDisabled = isLoading || disabled;
            return (
              <div key={c.name} className="relative group">
                <button
                  onClick={() => {
                    if (!disabled) {
                      onCategoryChange(c.name);
                      setIsPanelOpen(true);
                    }
                  }}
                  disabled={isDisabled}
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/30 shadow-lg shadow-blue-500/25'
                      : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                  aria-label={c.name}
                >
                  <Icon className="w-5 h-5" weight={isActive ? 'fill' : 'regular'} />
                </button>
                <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.name}
                </div>
              </div>
            );
          })}
          <div className="pt-5 mt-3 border-t border-white/10">
            <div className="relative group flex items-center justify-center">
              <button
                onClick={onUploadNewImage}
                disabled={isLoading}
                className="h-12 w-full rounded-2xl flex items-center justify-center border border-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                style={{
                  background: 'linear-gradient(135deg, #4c63ff 0%, #5f5dff 50%, #8a4dff 100%)'
                }}
                aria-label="Upload new image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Upload new image
              </div>
            </div>
          </div>
        </div>

        {active && (
          <div
            className={`absolute left-14 top-0 z-50 transition-all duration-300 ease-out ${
              isPanelOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-6 pointer-events-none'
            }`}
          >
            <div className="w-72 rounded-3xl bg-[#07090f]/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/60 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="text-sm font-semibold text-white truncate">{active.name}</div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[520px] overflow-y-auto px-1 pb-1">
                {active.filters.map((f) => {
                  const isSelected = selectedFilterId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onSelectFilter(f)}
                      disabled={isLoading}
                      className={`w-full px-4 py-4 text-left text-base rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500/30 via-purple-500/35 to-pink-500/35 text-white border border-white/15 shadow-inner shadow-blue-500/10'
                          : 'text-white/80 hover:bg-white/6 hover:text-white border border-transparent'
                      }`}
                      title={f.name}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-medium">{f.name}</span>
                        <span
                          className={`flex items-center justify-center transition-all duration-200 ${
                            isSelected ? 'text-white opacity-100' : 'opacity-0'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" weight="bold" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-3 pb-4 pt-3 border-t border-white/10 bg-black/20">
                <button
                  onClick={() => {
                    setIsPanelOpen(false);
                    onApplySelectedFilter();
                  }}
                  disabled={!canApply || isLoading}
                  className="w-full px-4 py-3 text-sm font-semibold rounded-2xl text-white shadow-lg shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #5a63ff 0%, #7a52ff 50%, #c14bff 100%)'
                  }}
                >
                  Apply Style
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GlamatronStyleSidebar;
