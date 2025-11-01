import React, { useState } from 'react';
import { Pencil, Eraser, Trash } from '@phosphor-icons/react';
import { DrawingPath } from './ImageEditor';

interface DrawingPanelProps {
  drawingPaths: DrawingPath[];
  onUpdatePaths: (paths: DrawingPath[]) => void;
  isDrawingMode: boolean;
  onToggleDrawingMode: (enabled: boolean) => void;
  drawingColor: string;
  onColorChange: (color: string) => void;
  drawingWidth: number;
  onWidthChange: (width: number) => void;
  isEraserMode?: boolean;
  onToggleEraserMode?: (enabled: boolean) => void;
}

const DRAWING_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
];

const DrawingPanel: React.FC<DrawingPanelProps> = ({ 
  drawingPaths, 
  onUpdatePaths,
  isDrawingMode,
  onToggleDrawingMode,
  drawingColor,
  onColorChange,
  drawingWidth,
  onWidthChange,
  isEraserMode,
  onToggleEraserMode
}) => {
  // Controlled eraser mode when provided; fallback to local state
  const [localEraser, setLocalEraser] = useState(false);
  const eraser = isEraserMode ?? localEraser;
  const setEraser = onToggleEraserMode ?? setLocalEraser;

  const clearAllDrawings = () => {
    if (confirm('Clear all drawings?')) {
      onUpdatePaths([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drawing Tools */}
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-3">Drawing Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onToggleDrawingMode(true);
              setEraser(false);
            }}
            className={`px-4 py-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
              isDrawingMode && !eraser
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-blue-500'
            }`}
          >
            <Pencil className="w-4 h-4" />
            <span className="text-sm">Draw</span>
          </button>
          <button
            onClick={() => {
              onToggleDrawingMode(true);
              setEraser(true);
            }}
            className={`px-4 py-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${
              isDrawingMode && eraser
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-blue-500'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="text-sm">Erase</span>
          </button>
        </div>
      </div>

      {/* Color Picker - Only show when not in eraser mode */}
      {!eraser && (
        <div>
          <h3 className="text-sm font-medium text-white/60 mb-3">Color</h3>
          <div className="flex gap-2 flex-wrap mb-2">
            {DRAWING_COLORS.map(color => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  drawingColor === color ? 'border-blue-500 scale-110' : 'border-white/20'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="color"
            value={drawingColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer"
          />
        </div>
      )}

      {/* Brush Size */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-white/60">Brush Size</label>
          <span className="text-xs text-white">{drawingWidth}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={drawingWidth}
          onChange={(e) => onWidthChange(parseInt(e.target.value))}
          className="w-full"
        />
        
        {/* Preview */}
        <div className="mt-3 flex items-center justify-center p-4 bg-white/5 rounded-lg">
          <div
            className="rounded-full"
            style={{
              width: `${drawingWidth * 2}px`,
              height: `${drawingWidth * 2}px`,
              backgroundColor: drawingColor,
            }}
          />
        </div>
      </div>

      {/* Clear Button */}
      {drawingPaths.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={clearAllDrawings}
            className="w-full px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Trash className="w-4 h-4" />
            Clear All Drawings
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300 mb-2">
          <strong>How to draw:</strong>
        </p>
        <ul className="text-xs text-blue-300 space-y-1 list-disc list-inside">
          <li>Click and drag on the image to draw</li>
          <li>Switch to Erase mode to remove parts of drawings</li>
          <li>Adjust brush size and color</li>
          <li>Clear all to start over</li>
        </ul>
      </div>

      {/* Coming Soon Features */}
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-medium text-white/60 mb-3">Coming Soon</h3>
        <div className="space-y-2">
          <button
            disabled
            className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white/40 rounded-lg cursor-not-allowed text-sm"
          >
            Shapes (Rectangle, Circle, Arrow)
          </button>
          <button
            disabled
            className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white/40 rounded-lg cursor-not-allowed text-sm"
          >
            Highlighter Tool
          </button>
          <button
            disabled
            className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white/40 rounded-lg cursor-not-allowed text-sm"
          >
            Undo/Redo Individual Strokes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingPanel;
