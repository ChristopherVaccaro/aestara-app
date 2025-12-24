import React, { useMemo, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Filter } from '../types';
import { getStyleExampleThumbSources } from '../utils/styleExamples';

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

  const after = selected ? getStyleExampleThumbSources(selected.id, selected.name, 'after') : null;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between px-2 md:px-0 mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
        >
          Back
        </button>

        <div className="text-center">
          <div className="text-white font-semibold text-lg">Style Gallery</div>
          <div className="text-white/60 text-xs">Browse larger previews and pick a style</div>
        </div>

        <button
          onClick={onApplySelectedFilter}
          disabled={!selected || isApplying}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Use Style
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="glass-panel p-4">
          <div className="text-sm font-semibold text-white mb-3">Preview</div>

          {selected ? (
            <>
              <div className="text-white/80 text-sm font-medium truncate mb-3">{selected.name}</div>

              {after && (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  <img
                    src={after.primary}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-52 object-cover"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.src !== after.fallback) el.src = after.fallback;
                    }}
                  />
                  <div className="absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full bg-black/40 text-white/90 border border-white/10">
                    Preview
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-white/60">
                Tip: generate real previews via <span className="text-white/80 font-medium">npm run generate:style-examples</span> to replace placeholders.
              </div>
            </>
          ) : (
            <div className="text-white/60 text-sm">Select a style to preview.</div>
          )}
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

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(({ category, filter }) => {
                const img = getStyleExampleThumbSources(filter.id, filter.name, 'after');
                const isSelected = selectedFilterId === filter.id;

                return (
                  <button
                    key={filter.id}
                    onClick={() => onSelectFilter(filter)}
                    className={`group text-left rounded-xl overflow-hidden border transition-all ${
                      isSelected
                        ? 'border-purple-400/70 ring-2 ring-purple-500/30'
                        : 'border-white/10 hover:border-white/20'
                    } bg-white/[0.03] hover:bg-white/[0.06]`}
                    title={`${category} • ${filter.name}`}
                  >
                    <div className="relative">
                      <img
                        src={img.primary}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.src !== img.fallback) el.src = img.fallback;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-white font-semibold text-sm truncate">{filter.name}</div>
                        <div className="text-white/60 text-[11px] truncate">{category}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleGallery;
