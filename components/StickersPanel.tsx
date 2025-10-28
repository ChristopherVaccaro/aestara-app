import React, { useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import { Sticker } from './ImageEditor';

interface StickersPanelProps {
  stickers: Sticker[];
  selectedStickerId: string | null;
  onAddSticker: (emoji: string) => void;
  onUpdateSticker: (id: string, updates: Partial<Sticker>) => void;
  onDeleteSticker: (id: string) => void;
  onSelectSticker: (id: string | null) => void;
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄', '🐝'],
  'Food': ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🍝'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🏹', '🎣', '🥊'],
  'Travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '✈️', '🚁', '🚂'],
  'Objects': ['⭐', '🌟', '✨', '💫', '💥', '💢', '💦', '💨', '🔥', '⚡', '☀️', '🌙', '⭐', '🌈', '☁️', '⛅', '🌤️', '⛈️', '🌩️', '🌨️'],
  'Symbols': ['❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✅', '❌', '⭕'],
};

const StickersPanel: React.FC<StickersPanelProps> = ({
  stickers,
  selectedStickerId,
  onAddSticker,
  onUpdateSticker,
  onDeleteSticker,
  onSelectSticker,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Smileys');
  
  const selectedSticker = stickers.find(s => s.id === selectedStickerId);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin -mx-3 px-3">
        <div className="flex gap-1 min-w-max">
          {Object.keys(EMOJI_CATEGORIES).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Grid */}
      <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto -mx-3 px-3">
        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
          <button
            key={index}
            onClick={() => onAddSticker(emoji)}
            className="aspect-square flex items-center justify-center text-3xl hover:bg-white/10 rounded-lg transition-all hover:scale-110"
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', emoji);
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Sticker List */}
      {stickers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/60">Stickers on Image</h3>
          {stickers.map(sticker => (
            <div
              key={sticker.id}
              onClick={() => onSelectSticker(sticker.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedStickerId === sticker.id
                  ? 'bg-blue-500/20 border border-blue-500'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{sticker.emoji}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSticker(sticker.id);
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

      {/* Sticker Editor */}
      {selectedSticker && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-medium text-white/60">Edit Sticker</h3>

          {/* Size */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-white/60">Size</label>
              <span className="text-xs text-white">{selectedSticker.size} ({(selectedSticker.size / 10).toFixed(1)}% of image)</span>
            </div>
            <input
              type="range"
              min="8"
              max="200"
              value={selectedSticker.size}
              onChange={(e) => onUpdateSticker(selectedSticker.id, { size: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-white/60">Rotation</label>
              <span className="text-xs text-white">{selectedSticker.rotation}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={selectedSticker.rotation}
              onChange={(e) => onUpdateSticker(selectedSticker.id, { rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          💡 <strong>Tip:</strong> Click on an emoji to add it to your image. Drag it to reposition, and use the controls to adjust size and rotation.
        </p>
      </div>
    </div>
  );
};

export default StickersPanel;
