import React from 'react';
import { ArrowCounterClockwise } from '@phosphor-icons/react';
import { ImageFilters } from './ImageEditor';

interface FiltersPanelProps {
  filters: ImageFilters;
  onUpdateFilters: (filters: ImageFilters) => void;
}

const FILTER_PRESETS = [
  { name: 'Original', filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, sepia: 0, grayscale: 0, hueRotate: 0 } },
  { name: 'Vintage', filters: { brightness: 110, contrast: 90, saturation: 80, blur: 0, sepia: 40, grayscale: 0, hueRotate: 0 } },
  { name: 'B&W', filters: { brightness: 100, contrast: 110, saturation: 0, blur: 0, sepia: 0, grayscale: 100, hueRotate: 0 } },
  { name: 'Warm', filters: { brightness: 105, contrast: 100, saturation: 110, blur: 0, sepia: 0, grayscale: 0, hueRotate: 10 } },
  { name: 'Cool', filters: { brightness: 100, contrast: 105, saturation: 110, blur: 0, sepia: 0, grayscale: 0, hueRotate: 180 } },
  { name: 'Dramatic', filters: { brightness: 90, contrast: 140, saturation: 120, blur: 0, sepia: 0, grayscale: 0, hueRotate: 0 } },
  { name: 'Soft', filters: { brightness: 110, contrast: 85, saturation: 90, blur: 1, sepia: 10, grayscale: 0, hueRotate: 0 } },
  { name: 'Vibrant', filters: { brightness: 105, contrast: 110, saturation: 150, blur: 0, sepia: 0, grayscale: 0, hueRotate: 0 } },
];

const FiltersPanel: React.FC<FiltersPanelProps> = ({ filters, onUpdateFilters }) => {
  const updateFilter = (key: keyof ImageFilters, value: number) => {
    onUpdateFilters({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onUpdateFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sepia: 0,
      grayscale: 0,
      hueRotate: 0,
    });
  };

  // Check if current filters match a preset
  const isPresetActive = (presetFilters: typeof filters) => {
    return (
      filters.brightness === presetFilters.brightness &&
      filters.contrast === presetFilters.contrast &&
      filters.saturation === presetFilters.saturation &&
      filters.blur === presetFilters.blur &&
      filters.sepia === presetFilters.sepia &&
      filters.grayscale === presetFilters.grayscale &&
      filters.hueRotate === presetFilters.hueRotate
    );
  };

  return (
    <div className="space-y-4">
      {/* Reset Button */}
      <button
        onClick={resetFilters}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm"
      >
        <ArrowCounterClockwise className="w-4 h-4" />
        Reset All
      </button>

      {/* Presets */}
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-3">Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {FILTER_PRESETS.map(preset => {
            const isActive = isPresetActive(preset.filters);
            return (
              <button
                key={preset.name}
                onClick={() => onUpdateFilters(preset.filters)}
                className={`px-3 py-2 border text-xs rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-blue-500'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual Filters */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-sm font-medium text-white/60">Adjust Filters</h3>

        {/* Brightness */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/60">Brightness</label>
            <span className="text-xs text-white">{filters.brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.brightness}
            onChange={(e) => updateFilter('brightness', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/60">Contrast</label>
            <span className="text-xs text-white">{filters.contrast}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.contrast}
            onChange={(e) => updateFilter('contrast', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/60">Saturation</label>
            <span className="text-xs text-white">{filters.saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.saturation}
            onChange={(e) => updateFilter('saturation', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Blur */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/60">Blur</label>
            <span className="text-xs text-white">{filters.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={filters.blur}
            onChange={(e) => updateFilter('blur', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Sepia */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/60">Sepia</label>
            <span className="text-xs text-white">{filters.sepia}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.sepia}
            onChange={(e) => updateFilter('sepia', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Grayscale */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/60">Grayscale</label>
            <span className="text-xs text-white">{filters.grayscale}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.grayscale}
            onChange={(e) => updateFilter('grayscale', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Hue Rotate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/60">Hue</label>
            <span className="text-xs text-white">{filters.hueRotate}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={filters.hueRotate}
            onChange={(e) => updateFilter('hueRotate', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
