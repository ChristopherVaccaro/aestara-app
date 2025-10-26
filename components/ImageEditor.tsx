import React, { useState, useRef, useEffect } from 'react';
import { X, Type, Sliders, Crop, Rotate3D, Sticker, Pencil, Download, Undo, Redo, Image as ImageIcon } from 'lucide-react';
import TextEditorPanel from './TextEditorPanel';
import FiltersPanel from './FiltersPanel';
import AdjustmentsPanel from './AdjustmentsPanel';
import StickersPanel from './StickersPanel';
import DrawingPanel from './DrawingPanel';

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  padding: number;
  rotation: number;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  opacity: number;
  width: number | null; // null = auto-width, number = fixed width in percentage
}

export interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sepia: number;
  grayscale: number;
  hueRotate: number;
}

export interface ImageAdjustments {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  crop: { x: number; y: number; width: number; height: number } | null;
}

interface ImageEditorProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
}

type EditorTab = 'text' | 'filters' | 'adjustments' | 'stickers' | 'drawing';

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('text');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
  });
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    crop: null,
  });
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'text' | 'sticker' | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ff0000');
  const [drawingWidth, setDrawingWidth] = useState(3);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  // Track displayed image dimensions for proper scaling
  const [displayedImageSize, setDisplayedImageSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ left: 0, top: 0 });

  // Load image and track dimensions
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current.src = imageUrl;
      }
    };
  }, [imageUrl]);
  
  // Update displayed image size and position for proper scaling and dragging
  useEffect(() => {
    const updateSize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setDisplayedImageSize({ width: rect.width, height: rect.height });
        setImagePosition({ left: rect.left, top: rect.top });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('scroll', updateSize);
    
    // Use ResizeObserver for more accurate tracking
    const observer = new ResizeObserver(updateSize);
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('scroll', updateSize);
      observer.disconnect();
    };
  }, []);

  // Add text overlay
  const addTextOverlay = () => {
    const newText: TextOverlay = {
      id: `text-${Date.now()}`,
      text: 'Double click to edit',
      x: 50,
      y: 50,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 10,
      rotation: 0,
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textDecoration: 'none',
      opacity: 1,
      width: null, // Auto-width initially
    };
    setTextOverlays([...textOverlays, newText]);
    setSelectedTextId(newText.id);
  };

  // Update text overlay
  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(textOverlays.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Delete text overlay
  const deleteTextOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  // Add sticker
  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      emoji,
      x: 50,
      y: 50,
      size: 64,
      rotation: 0,
    };
    setStickers([...stickers, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  // Update sticker
  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setStickers(stickers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Delete sticker
  const deleteSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // Drawing handlers
  const handleDrawingStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !imageRef.current) return;
    
    e.preventDefault();
    setIsDrawingActive(true);
    
    const rect = imageRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setCurrentPath([{ x, y }]);
  };

  const handleDrawingMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingActive || !isDrawingMode || !imageRef.current) return;
    
    e.preventDefault();
    const rect = imageRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleDrawingEnd = () => {
    if (!isDrawingActive || currentPath.length < 2) {
      setIsDrawingActive(false);
      setCurrentPath([]);
      return;
    }
    
    const newPath: DrawingPath = {
      id: `path-${Date.now()}`,
      points: currentPath,
      color: drawingColor,
      width: drawingWidth,
    };
    
    setDrawingPaths([...drawingPaths, newPath]);
    setIsDrawingActive(false);
    setCurrentPath([]);
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, type: 'text' | 'sticker', id: string) => {
    if (isDrawingMode) return; // Don't drag in drawing mode
    
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragId(id);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({ x: clientX, y: clientY });
    
    if (type === 'text') {
      setSelectedTextId(id);
    } else {
      setSelectedStickerId(id);
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDrawingMode) {
      handleDrawingMove(e);
      return;
    }
    
    if (!isDragging || !dragId || !dragType) return;
    
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Convert pixel movement to percentage of image size
    const deltaXPercent = (deltaX / displayedImageSize.width) * 100;
    const deltaYPercent = (deltaY / displayedImageSize.height) * 100;
    
    if (dragType === 'text') {
      const text = textOverlays.find(t => t.id === dragId);
      if (text) {
        updateTextOverlay(dragId, {
          x: Math.max(0, Math.min(100, text.x + deltaXPercent)),
          y: Math.max(0, Math.min(100, text.y + deltaYPercent)),
        });
      }
    } else {
      const sticker = stickers.find(s => s.id === dragId);
      if (sticker) {
        updateSticker(dragId, {
          x: Math.max(0, Math.min(100, sticker.x + deltaXPercent)),
          y: Math.max(0, Math.min(100, sticker.y + deltaYPercent)),
        });
      }
    }
    
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragEnd = () => {
    if (isDrawingMode) {
      handleDrawingEnd();
      return;
    }
    
    setIsDragging(false);
    setDragType(null);
    setDragId(null);
  };

  // Generate filter CSS
  const getFilterStyle = () => {
    return {
      filter: `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        blur(${filters.blur}px)
        sepia(${filters.sepia}%)
        grayscale(${filters.grayscale}%)
        hue-rotate(${filters.hueRotate}deg)
      `,
      transform: `
        rotate(${adjustments.rotation}deg)
        scaleX(${adjustments.flipHorizontal ? -1 : 1})
        scaleY(${adjustments.flipVertical ? -1 : 1})
      `,
    };
  };

  // Export edited image
  const handleExport = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Apply filters and transformations
    ctx.save();
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      blur(${filters.blur}px)
      sepia(${filters.sepia}%)
      grayscale(${filters.grayscale}%)
      hue-rotate(${filters.hueRotate}deg)
    `;

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.scale(
      adjustments.flipHorizontal ? -1 : 1,
      adjustments.flipVertical ? -1 : 1
    );
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw text overlays
    textOverlays.forEach(text => {
      ctx.save();
      const x = (text.x / 100) * canvas.width;
      const y = (text.y / 100) * canvas.height;
      const fontSize = (text.fontSize / 100) * canvas.width;

      ctx.translate(x, y);
      ctx.rotate((text.rotation * Math.PI) / 180);

      ctx.font = `${text.fontStyle} ${text.fontWeight} ${fontSize}px ${text.fontFamily}`;
      ctx.textAlign = text.textAlign;
      ctx.globalAlpha = text.opacity;

      // Draw background
      if (text.backgroundColor !== 'transparent') {
        const metrics = ctx.measureText(text.text);
        const padding = (text.padding / 100) * canvas.width;
        ctx.fillStyle = text.backgroundColor;
        ctx.fillRect(
          -padding,
          -fontSize - padding,
          metrics.width + padding * 2,
          fontSize + padding * 2
        );
      }

      // Draw text
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, 0, 0);

      if (text.textDecoration === 'underline') {
        const metrics = ctx.measureText(text.text);
        ctx.strokeStyle = text.color;
        ctx.lineWidth = fontSize * 0.05;
        ctx.beginPath();
        ctx.moveTo(0, fontSize * 0.1);
        ctx.lineTo(metrics.width, fontSize * 0.1);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Draw stickers
    stickers.forEach(sticker => {
      ctx.save();
      const x = (sticker.x / 100) * canvas.width;
      const y = (sticker.y / 100) * canvas.height;
      const size = (sticker.size / 100) * canvas.width;

      ctx.translate(x, y);
      ctx.rotate((sticker.rotation * Math.PI) / 180);
      ctx.font = `${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker.emoji, 0, 0);
      ctx.restore();
    });

    // Draw drawing paths
    drawingPaths.forEach(path => {
      if (path.points.length < 2) return;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = (path.width / 100) * canvas.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const startPoint = path.points[0];
      ctx.moveTo(
        (startPoint.x / 100) * canvas.width,
        (startPoint.y / 100) * canvas.height
      );
      path.points.slice(1).forEach(point => {
        ctx.lineTo(
          (point.x / 100) * canvas.width,
          (point.y / 100) * canvas.height
        );
      });
      ctx.stroke();
    });

    // Convert to blob and save
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        onSave(url);
      }
    }, 'image/png', 1.0);
  };

  const tabs = [
    { id: 'text' as EditorTab, icon: Type, label: 'Text' },
    { id: 'filters' as EditorTab, icon: Sliders, label: 'Filters' },
    { id: 'adjustments' as EditorTab, icon: Rotate3D, label: 'Adjust' },
    { id: 'stickers' as EditorTab, icon: Sticker, label: 'Stickers' },
    { id: 'drawing' as EditorTab, icon: Pencil, label: 'Draw' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6" />
          Edit Image
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas Area */}
        <div 
          className="flex-1 flex items-center justify-center p-2 lg:p-4 overflow-hidden" 
          ref={containerRef}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <div className="relative" ref={previewContainerRef} style={{ touchAction: 'none' }}>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit"
              className={`max-w-full max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-150px)] object-contain ${isDrawingMode ? 'cursor-crosshair' : ''}`}
              style={getFilterStyle()}
              onMouseDown={isDrawingMode ? handleDrawingStart : undefined}
              onTouchStart={isDrawingMode ? handleDrawingStart : undefined}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
            
            {/* Drawing overlay - SVG for paths */}
            {(isDrawingMode || drawingPaths.length > 0 || currentPath.length > 0) && displayedImageSize.width > 0 && (
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: `${displayedImageSize.width}px`,
                  height: `${displayedImageSize.height}px`,
                }}
              >
                {/* Existing paths */}
                {drawingPaths.map(path => {
                  if (path.points.length < 2) return null;
                  const pathData = path.points.map((point, i) => {
                    const x = (point.x / 100) * displayedImageSize.width;
                    const y = (point.y / 100) * displayedImageSize.height;
                    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                  }).join(' ');
                  
                  return (
                    <path
                      key={path.id}
                      d={pathData}
                      stroke={path.color}
                      strokeWidth={(path.width / 100) * displayedImageSize.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  );
                })}
                
                {/* Current drawing path */}
                {currentPath.length > 1 && (
                  <path
                    d={currentPath.map((point, i) => {
                      const x = (point.x / 100) * displayedImageSize.width;
                      const y = (point.y / 100) * displayedImageSize.height;
                      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                    }).join(' ')}
                    stroke={drawingColor}
                    strokeWidth={(drawingWidth / 100) * displayedImageSize.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </svg>
            )}
            
            {/* Text overlays - scaled to match export */}
            {displayedImageSize.width > 0 && textOverlays.map(text => {
              const scaledFontSize = (text.fontSize / 100) * displayedImageSize.width;
              const scaledPadding = (text.padding / 100) * displayedImageSize.width;
              
              return (
                <div
                  key={text.id}
                  className={`absolute cursor-move ${selectedTextId === text.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: `${text.x}%`,
                    top: `${text.y}%`,
                    transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
                    fontSize: `${scaledFontSize}px`,
                    fontFamily: text.fontFamily,
                    color: text.color,
                    backgroundColor: text.backgroundColor,
                    padding: `${scaledPadding}px`,
                    fontWeight: text.fontWeight,
                    fontStyle: text.fontStyle,
                    textDecoration: text.textDecoration,
                    textAlign: text.textAlign,
                    opacity: text.opacity,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                  onMouseDown={(e) => handleDragStart(e, 'text', text.id)}
                  onTouchStart={(e) => handleDragStart(e, 'text', text.id)}
                  onClick={() => setSelectedTextId(text.id)}
                  onDoubleClick={() => {
                    const newText = prompt('Edit text:', text.text);
                    if (newText !== null) {
                      updateTextOverlay(text.id, { text: newText });
                    }
                  }}
                >
                  {text.text}
                </div>
              );
            })}

            {/* Stickers - scaled to match export */}
            {displayedImageSize.width > 0 && stickers.map(sticker => {
              const scaledSize = (sticker.size / 100) * displayedImageSize.width;
              
              return (
                <div
                  key={sticker.id}
                  className={`absolute cursor-move ${selectedStickerId === sticker.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                    fontSize: `${scaledSize}px`,
                    lineHeight: 1,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                  onMouseDown={(e) => handleDragStart(e, 'sticker', sticker.id)}
                  onTouchStart={(e) => handleDragStart(e, 'sticker', sticker.id)}
                  onClick={() => setSelectedStickerId(sticker.id)}
                >
                  {sticker.emoji}
                </div>
              );
            })}
          </div>
          
          {/* Hidden canvas for export */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Side Panel - Responsive */}
        <div className="w-full lg:w-80 h-[50vh] lg:h-auto bg-gray-900/50 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
          {/* Tabs - Scrollable on mobile */}
          <div className="flex border-b border-white/10 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[60px] p-2 lg:p-3 flex flex-col items-center gap-1 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white border-b-2 border-blue-500'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="text-[10px] lg:text-xs">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Panel Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-4">
            {activeTab === 'text' && (
              <TextEditorPanel
                textOverlays={textOverlays}
                selectedTextId={selectedTextId}
                onAddText={addTextOverlay}
                onUpdateText={updateTextOverlay}
                onDeleteText={deleteTextOverlay}
                onSelectText={setSelectedTextId}
              />
            )}
            {activeTab === 'filters' && (
              <FiltersPanel
                filters={filters}
                onUpdateFilters={setFilters}
              />
            )}
            {activeTab === 'adjustments' && (
              <AdjustmentsPanel
                adjustments={adjustments}
                onUpdateAdjustments={setAdjustments}
              />
            )}
            {activeTab === 'stickers' && (
              <StickersPanel
                stickers={stickers}
                selectedStickerId={selectedStickerId}
                onAddSticker={addSticker}
                onUpdateSticker={updateSticker}
                onDeleteSticker={deleteSticker}
                onSelectSticker={setSelectedStickerId}
              />
            )}
            {activeTab === 'drawing' && (
              <DrawingPanel
                drawingPaths={drawingPaths}
                onUpdatePaths={setDrawingPaths}
                isDrawingMode={isDrawingMode}
                onToggleDrawingMode={setIsDrawingMode}
                drawingColor={drawingColor}
                onColorChange={setDrawingColor}
                drawingWidth={drawingWidth}
                onWidthChange={setDrawingWidth}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
