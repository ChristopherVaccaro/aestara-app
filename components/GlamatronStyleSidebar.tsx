import React, { useMemo, useState } from 'react';
import {
  Sparkle,
  MagicWand,
  Camera,
  TrendUp,
  Palette,
  Sun,
  Smiley,
  UserCircle,
  X,
  Check,
  Confetti,
  Heart,
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
  if (key.includes('trendy') || key.includes('social')) return TrendUp;
  if (key.includes('seasonal') || key.includes('holiday')) return Sun;
  if (key.includes('classic')) return UserCircle;
  if (key.includes('fun') || key.includes('transform')) return Confetti;
  if (key.includes('aesthetic')) return Heart;
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
  
  // Close panel when disabled state changes (e.g., during auth changes)
  React.useEffect(() => {
    if (disabled) {
      setIsPanelOpen(false);
    }
  }, [disabled]);

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
        <div className={`flex flex-col gap-2 rounded-lg bg-white/[0.04] backdrop-blur-xl border border-white/10 p-2 ${disabled ? 'opacity-50' : ''}`}>
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
                  className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
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
        </div>

        {active && (
          <div
            className={`absolute left-14 top-0 z-50 transition-all duration-300 ease-out ${
              isPanelOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-6 pointer-events-none'
            }`}
          >
            <div className="w-72 rounded-lg bg-[#07090f]/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/60 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="text-base font-semibold text-white truncate">{active.name}</div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[520px] overflow-y-auto p-3">
                {active.filters.map((f) => {
                  const isSelected = selectedFilterId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onSelectFilter(f)}
                      disabled={isLoading}
                      className={`w-full p-2 text-left text-base rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
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

              <div className="p-3 border-t border-white/10 bg-black/20">
                <button
                  onClick={() => {
                    setIsPanelOpen(false);
                    onApplySelectedFilter();
                  }}
                  disabled={!canApply || isLoading}
                  className="w-full px-6 py-3 glass-button-active text-blue-100 font-semibold rounded-lg hover:bg-blue-500/40 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-600"
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
