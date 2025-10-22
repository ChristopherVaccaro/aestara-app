import React from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, Crop } from 'lucide-react';
import { ImageAdjustments } from './ImageEditor';

interface AdjustmentsPanelProps {
  adjustments: ImageAdjustments;
  onUpdateAdjustments: (adjustments: ImageAdjustments) => void;
}

const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({ adjustments, onUpdateAdjustments }) => {
  const rotate = (degrees: number) => {
    onUpdateAdjustments({
      ...adjustments,
      rotation: (adjustments.rotation + degrees) % 360,
    });
  };

  const flipHorizontal = () => {
    onUpdateAdjustments({
      ...adjustments,
      flipHorizontal: !adjustments.flipHorizontal,
    });
  };

  const flipVertical = () => {
    onUpdateAdjustments({
      ...adjustments,
      flipVertical: !adjustments.flipVertical,
    });
  };

  const resetAdjustments = () => {
    onUpdateAdjustments({
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      crop: null,
    });
  };

  return (
    <div className="space-y-4">
      {/* Rotation */}
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-3">Rotation</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => rotate(-90)}
            className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 hover:border-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4 transform scale-x-[-1]" />
            <span className="text-sm">90° Left</span>
          </button>
          <button
            onClick={() => rotate(90)}
            className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 hover:border-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-sm">90° Right</span>
          </button>
        </div>
        
        {/* Fine Rotation */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/60">Fine Adjust</label>
            <span className="text-xs text-white">{adjustments.rotation}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={adjustments.rotation}
            onChange={(e) => onUpdateAdjustments({ ...adjustments, rotation: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Flip */}
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-medium text-white/60 mb-3">Flip</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={flipHorizontal}
            className={`px-4 py-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
              adjustments.flipHorizontal
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-blue-500'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="text-sm">Horizontal</span>
          </button>
          <button
            onClick={flipVertical}
            className={`px-4 py-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
              adjustments.flipVertical
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-blue-500'
            }`}
          >
            <FlipVertical className="w-4 h-4" />
            <span className="text-sm">Vertical</span>
          </button>
        </div>
      </div>

      {/* Crop (Coming Soon) */}
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-medium text-white/60 mb-3">Crop</h3>
        <button
          disabled
          className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white/40 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Crop className="w-4 h-4" />
          <span className="text-sm">Coming Soon</span>
        </button>
      </div>

      {/* Reset */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={resetAdjustments}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all text-sm"
        >
          Reset Adjustments
        </button>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          💡 <strong>Tip:</strong> Use rotation and flip to adjust your image orientation before adding text or stickers.
        </p>
      </div>
    </div>
  );
};

export default AdjustmentsPanel;
