import React, { useMemo, useState } from 'react';
import { MagnifyingGlass, Check } from '@phosphor-icons/react';
import { Filter } from '../types';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

interface StyleGalleryProps {
  categories: FilterCategory[];
  selectedFilterId: string | null;
  onSelectFilter: (filter: Filter) => void;
  onApplySelectedFilter: () => void;
  onBack: () => void;
  isApplying: boolean;
}

const StyleGallery: React.FC<StyleGalleryProps> = ({
  categories,
  selectedFilterId,
  onSelectFilter,
  onApplySelectedFilter,
  onBack,
  isApplying,
}) => {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || '');
  const [query, setQuery] = useState('');

  const flat = useMemo(() => categories.flatMap((c) => c.filters.map((f) => ({ category: c.name, filter: f }))), [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = activeCategory ? flat.filter((x) => x.category === activeCategory) : flat;
    if (!q) return scoped;
    return scoped.filter((x) => x.filter.name.toLowerCase().includes(q) || x.filter.id.toLowerCase().includes(q));
  }, [flat, activeCategory, query]);

  const selected = useMemo(() => {
    if (!selectedFilterId) return null;
    return flat.find((x) => x.filter.id === selectedFilterId)?.filter || null;
  }, [flat, selectedFilterId]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between px-2 md:px-0 mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
        >
          Back
        </button>

        <div className="text-center">
          <div className="text-white font-semibold text-lg">Style Gallery</div>
          <div className="text-white/60 text-xs">Browse and pick a style</div>
        </div>

        <button
          onClick={onApplySelectedFilter}
          disabled={!selected || isApplying}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Use Style
        </button>
      </div>

      <div className="glass-panel p-4 overflow-hidden flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => setActiveCategory(c.name)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === c.name
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="relative md:ml-auto">
            <MagnifyingGlass className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search styles"
              className="w-full md:w-64 pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>
        </div>

        {selected && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-xs mb-1">Selected Style</div>
                <div className="text-white font-semibold">{selected.name}</div>
              </div>
              <Check className="w-5 h-5 text-purple-400" weight="bold" />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filtered.map(({ category, filter }) => {
              const isSelected = selectedFilterId === filter.id;

              return (
                <button
                  key={filter.id}
                  onClick={() => onSelectFilter(filter)}
                  className={`group text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-purple-400/70 bg-gradient-to-r from-blue-500/20 via-purple-500/25 to-pink-500/25'
                      : 'border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                  title={`${category} • ${filter.name}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {filter.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" weight="bold" />}
                  </div>
                  <div className="text-white/50 text-[11px] truncate mt-1">{category}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleGallery;
