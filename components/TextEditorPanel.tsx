import React from 'react';
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import { TextOverlay } from './ImageEditor';

interface TextEditorPanelProps {
  textOverlays: TextOverlay[];
  selectedTextId: string | null;
  onAddText: () => void;
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
  onDeleteText: (id: string) => void;
  onSelectText: (id: string | null) => void;
}

const FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black',
  'Palatino',
  'Garamond',
];

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
];

const TextEditorPanel: React.FC<TextEditorPanelProps> = ({
  textOverlays,
  selectedTextId,
  onAddText,
  onUpdateText,
  onDeleteText,
  onSelectText,
}) => {
  const selectedText = textOverlays.find(t => t.id === selectedTextId);

  return (
    <div className="space-y-4">
      {/* Add Text Button */}
      <button
        onClick={onAddText}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Text
      </button>

      {/* Text List */}
      {textOverlays.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/60">Text Layers</h3>
          {textOverlays.map(text => (
            <div
              key={text.id}
              onClick={() => onSelectText(text.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedTextId === text.id
                  ? 'bg-blue-500/20 border border-blue-500'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm truncate flex-1">{text.text}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteText(text.id);
                  }}
                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Text Editor */}
      {selectedText && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-medium text-white/60">Edit Text</h3>

          {/* Text Content */}
          <div>
            <label className="block text-xs text-white/60 mb-2">Text</label>
            <textarea
              value={selectedText.text}
              onChange={(e) => onUpdateText(selectedText.id, { text: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-xs text-white/60 mb-2">Font</label>
            <select
              value={selectedText.fontFamily}
              onChange={(e) => onUpdateText(selectedText.id, { fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {FONTS.map(font => (
                <option key={font} value={font} style={{ fontFamily: font }} className="text-white bg-gray-800">
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs text-white/60 mb-2">
              Size: {selectedText.fontSize} ({(selectedText.fontSize / 10).toFixed(1)}% of image width)
            </label>
            <input
              type="range"
              min="4"
              max="120"
              value={selectedText.fontSize}
              onChange={(e) => onUpdateText(selectedText.id, { fontSize: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Text Style Buttons */}
          <div>
            <label className="block text-xs text-white/60 mb-2">Style</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateText(selectedText.id, {
                  fontWeight: selectedText.fontWeight === 'bold' ? 'normal' : 'bold'
                })}
                className={`flex-1 p-2 rounded-lg transition-all ${
                  selectedText.fontWeight === 'bold'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Bold className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => onUpdateText(selectedText.id, {
                  fontStyle: selectedText.fontStyle === 'italic' ? 'normal' : 'italic'
                })}
                className={`flex-1 p-2 rounded-lg transition-all ${
                  selectedText.fontStyle === 'italic'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Italic className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => onUpdateText(selectedText.id, {
                  textDecoration: selectedText.textDecoration === 'underline' ? 'none' : 'underline'
                })}
                className={`flex-1 p-2 rounded-lg transition-all ${
                  selectedText.textDecoration === 'underline'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Underline className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="block text-xs text-white/60 mb-2">Alignment</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateText(selectedText.id, { textAlign: 'left' })}
                className={`flex-1 p-2 rounded-lg transition-all ${
                  selectedText.textAlign === 'left'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <AlignLeft className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => onUpdateText(selectedText.id, { textAlign: 'center' })}
                className={`flex-1 p-2 rounded-lg transition-all ${
                  selectedText.textAlign === 'center'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <AlignCenter className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => onUpdateText(selectedText.id, { textAlign: 'right' })}
                className={`flex-1 p-2 rounded-lg transition-all ${
                  selectedText.textAlign === 'right'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <AlignRight className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-xs text-white/60 mb-2">Text Color</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => onUpdateText(selectedText.id, { color })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    selectedText.color === color ? 'border-blue-500 scale-110' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={selectedText.color}
              onChange={(e) => onUpdateText(selectedText.id, { color: e.target.value })}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-xs text-white/60 mb-2">Background</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => onUpdateText(selectedText.id, { backgroundColor: 'transparent' })}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  selectedText.backgroundColor === 'transparent'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                None
              </button>
              <button
                onClick={() => onUpdateText(selectedText.id, { backgroundColor: 'rgba(0, 0, 0, 0.5)' })}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  selectedText.backgroundColor === 'rgba(0, 0, 0, 0.5)'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Black
              </button>
              <button
                onClick={() => onUpdateText(selectedText.id, { backgroundColor: 'rgba(255, 255, 255, 0.5)' })}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  selectedText.backgroundColor === 'rgba(255, 255, 255, 0.5)'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                White
              </button>
            </div>
          </div>

          {/* Padding */}
          <div>
            <label className="block text-xs text-white/60 mb-2">
              Padding: {selectedText.padding}px
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={selectedText.padding}
              onChange={(e) => onUpdateText(selectedText.id, { padding: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-xs text-white/60 mb-2">
              Rotation: {selectedText.rotation}°
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              value={selectedText.rotation}
              onChange={(e) => onUpdateText(selectedText.id, { rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-xs text-white/60 mb-2">
              Opacity: {Math.round(selectedText.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedText.opacity}
              onChange={(e) => onUpdateText(selectedText.id, { opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditorPanel;
