import React, { useState, useRef, useEffect } from 'react';
import { X, Type, Sliders, Crop, Rotate3D, Sticker, Pencil, Download, Image as ImageIcon, RefreshCw, MoreVertical, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [fitMode, setFitMode] = useState<'fit' | 'fill'>('fit');
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
  
  // Drag and resize state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragType, setDragType] = useState<'text' | 'sticker' | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [resizeCorner, setResizeCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ff0000');
  const [drawingWidth, setDrawingWidth] = useState(3);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [isEraserMode, setIsEraserMode] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetDragStartY = useRef<number | null>(null);
  const moveListenerRef = useRef<(e: MouseEvent | TouchEvent) => void>();
  const upListenerRef = useRef<(e: MouseEvent | TouchEvent) => void>();
  
  // Track displayed image dimensions for proper scaling
  const [displayedImageSize, setDisplayedImageSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ left: 0, top: 0 });

  // Load image and track dimensions
  useEffect(() => {
    // detect mobile
    const mq = window.matchMedia('(max-width: 1023px)');
    const handleMq = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    handleMq(mq);
    mq.addEventListener?.('change', handleMq as any);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current.src = imageUrl;
      }
    };
    return () => {
      mq.removeEventListener?.('change', handleMq as any);
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
      text: 'Placeholder',
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
    
    const rect = imageRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    if (isEraserMode) {
      // For eraser, start continuous erase and run first hit
      setIsDrawingActive(true);
      handleEraserAction(x, y);
    } else {
      setIsDrawingActive(true);
      setCurrentPath([{ x, y }]);
    }
  };

  const handleDrawingMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !imageRef.current) return;
    if (!isDrawingActive) return;
    
    e.preventDefault();
    
    const rect = imageRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    if (isEraserMode) {
      // For eraser, continuously check for intersections
      handleEraserAction(x, y);
    } else {
      // Add point to current path
      setCurrentPath(prev => [...prev, { x, y }]);
    }
  };

  const handleDrawingEnd = () => {
    if (isEraserMode) {
      setIsDrawingActive(false);
      return;
    }
    
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
  
  // Eraser functionality
  const handleEraserAction = (x: number, y: number) => {
    // Calculate the eraser radius in percentage of image dimensions
    const eraserRadius = drawingWidth;
    
    // Filter out paths that intersect with the eraser
    const remainingPaths = drawingPaths.filter(path => {
      // Check if any point in the path is within the eraser radius
      return !path.points.some(point => {
        const distance = Math.sqrt(
          Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
        );
        return distance <= eraserRadius;
      });
    });
    
    // Update paths if any were erased
    if (remainingPaths.length < drawingPaths.length) {
      setDrawingPaths(remainingPaths);
    }
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

    // Attach global listeners to ensure smooth dragging on mobile
    moveListenerRef.current = (ev: MouseEvent | TouchEvent) => {
      // @ts-ignore
      handleDragMove(ev as any);
    };
    upListenerRef.current = (ev: MouseEvent | TouchEvent) => {
      handleDragEnd();
    };
    window.addEventListener('mousemove', moveListenerRef.current as any);
    window.addEventListener('mouseup', upListenerRef.current as any);
    window.addEventListener('touchmove', moveListenerRef.current as any, { passive: false } as any);
    window.addEventListener('touchend', upListenerRef.current as any);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDrawingMode) {
      handleDrawingMove(e);
      return;
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Handle resizing
    if (isResizing && dragId && dragType && resizeCorner) {
      e.preventDefault();
      
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      
      // Calculate size change based on corner and movement
      let sizeDelta = 0;
      switch (resizeCorner) {
        case 'br': // Bottom right - positive in both directions
          sizeDelta = Math.max(deltaX, deltaY) / 2;
          break;
        case 'bl': // Bottom left - negative X, positive Y
          sizeDelta = Math.max(-deltaX, deltaY) / 2;
          break;
        case 'tr': // Top right - positive X, negative Y
          sizeDelta = Math.max(deltaX, -deltaY) / 2;
          break;
        case 'tl': // Top left - negative in both directions
          sizeDelta = Math.max(-deltaX, -deltaY) / 2;
          break;
      }
      
      // Scale the size delta based on the image size
      const scaledSizeDelta = (sizeDelta / displayedImageSize.width) * 100;
      
      if (dragType === 'text') {
        const text = textOverlays.find(t => t.id === dragId);
        if (text) {
          // Calculate new font size, with minimum of 4 and maximum of 120
          const newSize = Math.max(4, Math.min(120, initialSize.width + scaledSizeDelta));
          updateTextOverlay(dragId, { fontSize: newSize });
        }
      } else if (dragType === 'sticker') {
        const sticker = stickers.find(s => s.id === dragId);
        if (sticker) {
          // Calculate new sticker size, with minimum of 8 and maximum of 200
          const newSize = Math.max(8, Math.min(200, initialSize.width + scaledSizeDelta));
          updateSticker(dragId, { size: newSize });
        }
      }
      
      return;
    }
    
    // Handle dragging
    if (isDragging && dragId && dragType) {
      e.preventDefault();
      
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      
      // Convert pixel movement to percentage of image size
      const deltaXPercent = (deltaX / displayedImageSize.width) * 100;
      const deltaYPercent = (deltaY / displayedImageSize.height) * 100;
      
      if (dragType === 'text') {
        const text = textOverlays.find(t => t.id === dragId);
        if (text) {
          updateTextOverlay(dragId, {
            x: text.x + deltaXPercent,
            y: text.y + deltaYPercent,
          });
        }
      } else {
        const sticker = stickers.find(s => s.id === dragId);
        if (sticker) {
          updateSticker(dragId, {
            x: sticker.x + deltaXPercent,
            y: sticker.y + deltaYPercent,
          });
        }
      }
      
      setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleDragEnd = () => {
    if (isDrawingMode) {
      handleDrawingEnd();
      return;
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setDragType(null);
    setDragId(null);
    setResizeCorner(null);

    // Cleanup global listeners
    if (moveListenerRef.current) {
      window.removeEventListener('mousemove', moveListenerRef.current as any);
      window.removeEventListener('touchmove', moveListenerRef.current as any);
      moveListenerRef.current = undefined;
    }
    if (upListenerRef.current) {
      window.removeEventListener('mouseup', upListenerRef.current as any);
      window.removeEventListener('touchend', upListenerRef.current as any);
      upListenerRef.current = undefined;
    }
  };

  // Bottom sheet gesture: pull down to close from header area when scrolled to top
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    const scrollTop = sheetRef.current?.scrollTop ?? 0;
    if (scrollTop <= 0) sheetDragStartY.current = y;
  };
  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    if (sheetDragStartY.current !== null) {
      const y = e.changedTouches[0].clientY;
      if (y - sheetDragStartY.current > 60) {
        setIsSheetOpen(false);
      }
      sheetDragStartY.current = null;
    }
  };

  // Generate filter CSS
  const getFilterStyle = () => {
    const style: React.CSSProperties = {
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
      objectFit: fitMode === 'fit' ? 'contain' : 'cover',
    };
    return style;
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
        
        // Save current global alpha before drawing background
        const currentAlpha = ctx.globalAlpha;
        
        // Parse the background color to extract alpha if it's in rgba format
        let bgColor = text.backgroundColor;
        let bgAlpha = currentAlpha;
        
        if (bgColor.startsWith('rgba')) {
          const parts = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (parts && parts.length === 5) {
            const [_, r, g, b, a] = parts;
            bgColor = `rgb(${r}, ${g}, ${b})`;
            bgAlpha = parseFloat(a) * currentAlpha;
          }
        }
        
        // Set alpha for background only
        ctx.globalAlpha = bgAlpha;
        ctx.fillStyle = bgColor;
        ctx.fillRect(
          -padding,
          -fontSize - padding,
          metrics.width + padding * 2,
          fontSize + padding * 2
        );
        
        // Restore original alpha for text
        ctx.globalAlpha = currentAlpha;
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
      <div className={`flex items-center justify-between border-b border-white/10 ${isMobile ? 'px-3 py-2' : 'p-4'}`}>
        <h2 className={`font-bold text-white flex items-center gap-2 ${isMobile ? 'text-base' : 'text-xl'}`}>
          <ImageIcon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
          {!isMobile && 'Edit'}
        </h2>
        <div className="flex items-center gap-2 relative">
          {isMobile ? (
            <>
              <button
                onClick={() => setFitMode(fitMode === 'fit' ? 'fill' : 'fit')}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                aria-label="Toggle Fit/Fill"
              >
                {fitMode === 'fit' ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={handleExport}
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
                aria-label="Save"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowOverflow(v => !v)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                aria-label="More"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showOverflow && (
                <div className="absolute right-0 top-full mt-2 bg-gray-900/95 border border-white/10 rounded-lg shadow-lg p-1 z-50">
                  <button
                    onClick={() => {
                      // Reset
                      setTextOverlays([]);
                      setStickers([]);
                      setDrawingPaths([]);
                      setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0, sepia: 0, grayscale: 0, hueRotate: 0 });
                      setAdjustments({ rotation: 0, flipHorizontal: false, flipVertical: false, crop: null });
                      setSelectedTextId(null);
                      setSelectedStickerId(null);
                      setIsDrawingMode(false);
                      setIsEraserMode(false);
                      setShowOverflow(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-white text-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-white text-sm"
                  >
                    <X className="w-4 h-4" /> Close
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setTextOverlays([]);
                  setStickers([]);
                  setDrawingPaths([]);
                  setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0, sepia: 0, grayscale: 0, hueRotate: 0 });
                  setAdjustments({ rotation: 0, flipHorizontal: false, flipVertical: false, crop: null });
                  setSelectedTextId(null);
                  setSelectedStickerId(null);
                  setIsDrawingMode(false);
                  setIsEraserMode(false);
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Save
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Canvas Area */}
        <div 
          className={`flex-1 flex items-center justify-center ${isMobile ? 'px-2' : 'p-2 lg:p-4'} overflow-hidden`} 
          ref={containerRef}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', height: isMobile ? 'calc(100svh - 96px)' : undefined }}
        >
          <div 
            className="relative" 
            ref={previewContainerRef} 
            style={{ touchAction: 'none' }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (imageRef.current && !isDrawingMode) {
                const emoji = e.dataTransfer.getData('text/plain');
                if (emoji && emoji.length > 0) {
                  const rect = imageRef.current.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  
                  const newSticker: Sticker = {
                    id: `sticker-${Date.now()}`,
                    emoji,
                    x: Math.max(0, Math.min(100, x)),
                    y: Math.max(0, Math.min(100, y)),
                    size: 64,
                    rotation: 0,
                  };
                  setStickers([...stickers, newSticker]);
                  setSelectedStickerId(newSticker.id);
                  setActiveTab('stickers');
                }
              }
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit"
              className={`max-w-full ${isMobile ? 'max-h-full' : 'lg:max-h-[calc(100vh-150px)]'} ${isDrawingMode ? 'cursor-crosshair' : ''}`}
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
                    position: 'relative',
                  }}
                  onMouseDown={(e) => handleDragStart(e, 'text', text.id)}
                  onTouchStart={(e) => handleDragStart(e, 'text', text.id)}
                  onClick={() => setSelectedTextId(text.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    // Create an editable input element
                    const input = document.createElement('textarea');
                    input.value = text.text;
                    input.style.position = 'absolute';
                    input.style.left = '0';
                    input.style.top = '0';
                    input.style.width = '100%';
                    input.style.height = '100%';
                    input.style.fontSize = `${scaledFontSize}px`;
                    input.style.fontFamily = text.fontFamily;
                    input.style.color = text.color;
                    input.style.backgroundColor = text.backgroundColor;
                    input.style.padding = `${scaledPadding}px`;
                    input.style.fontWeight = text.fontWeight;
                    input.style.fontStyle = text.fontStyle;
                    input.style.textDecoration = text.textDecoration;
                    input.style.textAlign = text.textAlign;
                    input.style.border = 'none';
                    input.style.outline = 'none';
                    input.style.resize = 'none';
                    input.style.overflow = 'hidden';
                    input.style.zIndex = '1000';
                    
                    // Add the input to the text element
                    const textElement = e.currentTarget;
                    textElement.appendChild(input);
                    input.focus();
                    input.select();
                    
                    // Handle input blur (when user clicks away)
                    const handleBlur = () => {
                      if (input.value !== text.text) {
                        updateTextOverlay(text.id, { text: input.value });
                      }
                      textElement.removeChild(input);
                      input.removeEventListener('blur', handleBlur);
                      input.removeEventListener('keydown', handleKeyDown);
                    };
                    
                    // Handle Enter key press
                    const handleKeyDown = (e: KeyboardEvent) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        input.blur();
                      }
                    };
                    
                    input.addEventListener('blur', handleBlur);
                    input.addEventListener('keydown', handleKeyDown);
                  }}
                >
                  {text.text}
                  
                  {/* Resize handles */}
                  {selectedTextId === text.id && (
                    <>
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize -top-1.5 -left-1.5 z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('text');
                          setDragId(text.id);
                          setDragStart({ x: e.clientX, y: e.clientY });
                          setInitialSize({ width: text.fontSize, height: 0 });
                          setResizeCorner('tl');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('text');
                          setDragId(text.id);
                          setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          setInitialSize({ width: text.fontSize, height: 0 });
                          setResizeCorner('tl');
                        }}
                      />
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize -top-1.5 -right-1.5 z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('text');
                          setDragId(text.id);
                          setDragStart({ x: e.clientX, y: e.clientY });
                          setInitialSize({ width: text.fontSize, height: 0 });
                          setResizeCorner('tr');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('text');
                          setDragId(text.id);
                          setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          setInitialSize({ width: text.fontSize, height: 0 });
                          setResizeCorner('tr');
                        }}
                      />
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize -bottom-1.5 -left-1.5 z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('text');
                          setDragId(text.id);
                          setDragStart({ x: e.clientX, y: e.clientY });
                          setInitialSize({ width: text.fontSize, height: 0 });
                          setResizeCorner('bl');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('text');
                          setDragId(text.id);
                          setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          setInitialSize({ width: text.fontSize, height: 0 });
                          setResizeCorner('bl');
                        }}
                      />
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize -bottom-1.5 -right-1.5 z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('text');
                          setDragId(text.id);
                          setDragStart({ x: e.clientX, y: e.clientY });
                          setInitialSize({ width: text.fontSize, height: 0 });
                          setResizeCorner('br');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('text');
                          setDragId(text.id);
                          setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          setInitialSize({ width: text.fontSize, height: 0 });
                          setResizeCorner('br');
                        }}
                      />
                    </>
                  )}
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
                  
                  {/* Resize handles */}
                  {selectedStickerId === sticker.id && (
                    <>
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize -top-1.5 -left-1.5 z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('sticker');
                          setDragId(sticker.id);
                          setDragStart({ x: e.clientX, y: e.clientY });
                          setInitialSize({ width: sticker.size, height: 0 });
                          setResizeCorner('tl');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('sticker');
                          setDragId(sticker.id);
                          setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          setInitialSize({ width: sticker.size, height: 0 });
                          setResizeCorner('tl');
                        }}
                      />
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize -top-1.5 -right-1.5 z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('sticker');
                          setDragId(sticker.id);
                          setDragStart({ x: e.clientX, y: e.clientY });
                          setInitialSize({ width: sticker.size, height: 0 });
                          setResizeCorner('tr');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('sticker');
                          setDragId(sticker.id);
                          setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          setInitialSize({ width: sticker.size, height: 0 });
                          setResizeCorner('tr');
                        }}
                      />
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize -bottom-1.5 -left-1.5 z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('sticker');
                          setDragId(sticker.id);
                          setDragStart({ x: e.clientX, y: e.clientY });
                          setInitialSize({ width: sticker.size, height: 0 });
                          setResizeCorner('bl');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('sticker');
                          setDragId(sticker.id);
                          setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          setInitialSize({ width: sticker.size, height: 0 });
                          setResizeCorner('bl');
                        }}
                      />
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize -bottom-1.5 -right-1.5 z-10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('sticker');
                          setDragId(sticker.id);
                          setDragStart({ x: e.clientX, y: e.clientY });
                          setInitialSize({ width: sticker.size, height: 0 });
                          setResizeCorner('br');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          setDragType('sticker');
                          setDragId(sticker.id);
                          setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          setInitialSize({ width: sticker.size, height: 0 });
                          setResizeCorner('br');
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Hidden canvas for export */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls: Desktop side panel, Mobile dock + sheet */}
        {/* Desktop side panel */}
        <div className="hidden lg:flex w-80 bg-gray-900/50 backdrop-blur-xl border-l border-white/10 flex-col">
          <div className="flex border-b border-white/10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[60px] p-3 flex flex-col items-center gap-1 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white border-b-2 border-blue-500'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
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
              <FiltersPanel filters={filters} onUpdateFilters={setFilters} />
            )}
            {activeTab === 'adjustments' && (
              <AdjustmentsPanel adjustments={adjustments} onUpdateAdjustments={setAdjustments} />
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
                isEraserMode={isEraserMode}
                onToggleEraserMode={setIsEraserMode}
              />
            )}
          </div>
        </div>

        {/* Mobile bottom dock */}
        {isMobile && (
          <div className="absolute bottom-0 left-0 right-0 z-40">
            <div className="flex items-stretch justify-between bg-gray-900/70 backdrop-blur-xl border-t border-white/10 px-2 py-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSheetOpen(true);
                  }}
                  className={`flex-1 mx-1 py-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile bottom sheet overlay */}
        {isMobile && isSheetOpen && (
          <div className="absolute inset-0 z-50">
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            <div ref={sheetRef} className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl max-h-[75svh] overflow-hidden pointer-events-auto">
              <div
                className="sticky top-0 z-10 bg-gray-900/95 border-b border-white/10 px-4 pt-3 pb-2"
                onTouchStart={handleSheetTouchStart}
                onTouchEnd={handleSheetTouchEnd}
              >
                <div className="flex items-center justify-between">
                  <div className="relative w-full flex items-center justify-center">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-2 h-1.5 w-10 rounded-full bg-white/20" />
                    <span className="text-white/90 text-sm font-semibold">Edit</span>
                  </div>
                  <button
                    onClick={() => setIsSheetOpen(false)}
                    className="ml-2 p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black' : 'bg-white/10 text-white/80'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-y-auto p-3">
                {activeTab === 'text' && (
                  <TextEditorPanel
                    textOverlays={textOverlays}
                    selectedTextId={selectedTextId}
                    onAddText={() => { setIsSheetOpen(false); addTextOverlay(); }}
                    onUpdateText={updateTextOverlay}
                    onDeleteText={deleteTextOverlay}
                    onSelectText={setSelectedTextId}
                  />
                )}
                {activeTab === 'filters' && (
                  <FiltersPanel filters={filters} onUpdateFilters={setFilters} />
                )}
                {activeTab === 'adjustments' && (
                  <AdjustmentsPanel adjustments={adjustments} onUpdateAdjustments={setAdjustments} />
                )}
                {activeTab === 'stickers' && (
                  <StickersPanel
                    stickers={stickers}
                    selectedStickerId={selectedStickerId}
                    onAddSticker={(e) => { addSticker(e); setIsSheetOpen(false); }}
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
                    isEraserMode={isEraserMode}
                    onToggleEraserMode={setIsEraserMode}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
