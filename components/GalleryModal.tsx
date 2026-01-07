import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Trash, Heart, DownloadSimple, Calendar, CaretLeft, CaretRight, Image, Clock, ShareNetwork, CheckSquare, Square } from '@phosphor-icons/react';
import { useGallery } from '../contexts/GalleryContext';
import { GalleryItem } from '../types';

type TimePeriod = 'all' | 'today' | 'week' | 'month';
type SortOption = 'newest' | 'oldest' | 'favorites';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const GallerySkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="aspect-[3/4] rounded-xl bg-slate-700 animate-pulse" />
    ))}
  </div>
);

const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose, userId }) => {
  const { getUserItems, removeItem, removeItems, toggleFavorite, isLoading } = useGallery();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const allItems = getUserItems(userId);
  
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return allItems.find(item => item.id === selectedItemId) || null;
  }, [selectedItemId, allItems]);

  const items = useMemo(() => {
    let filtered = [...allItems];
    
    if (timePeriod !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt);
        switch (timePeriod) {
          case 'today':
            return itemDate >= startOfToday;
          case 'week':
            const weekAgo = new Date(startOfToday);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(startOfToday);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'favorites':
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return filtered;
  }, [allItems, timePeriod, sortBy]);

  const favoritesCount = useMemo(() => 
    allItems.filter(item => item.isFavorite).length, 
  [allItems]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItemId) {
        const currentIndex = items.findIndex(i => i.id === selectedItemId);
        if (currentIndex !== -1) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const newIndex = (currentIndex - 1 + items.length) % items.length;
            setSelectedItemId(items[newIndex].id);
            return;
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const newIndex = (currentIndex + 1) % items.length;
            setSelectedItemId(items[newIndex].id);
            return;
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemId(null);
            return;
          }
        }
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedItemId, items, onClose]);

  if (!isOpen) return null;

  const handleDownload = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.resultImage);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aestara-${item.filterName}-${item.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      window.open(item.resultImage, '_blank');
    }
  };

  const handleDelete = (id: string) => {
    removeItem(id);
    setShowDeleteConfirm(null);
    if (selectedItem?.id === id) {
      setSelectedItemId(null);
    }
  };

  const handleShare = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.resultImage);
      const blob = await response.blob();
      const file = new File([blob], `aestara-${item.id}.png`, { 
        type: 'image/png',
        lastModified: Date.now()
      });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Aestara Transformation',
          text: `Check out my ${item.filterName} style transformation!`,
          files: [file],
        });
      } else {
        handleDownload(item);
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const navigateItem = (direction: 'prev' | 'next') => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex(i => i.id === selectedItem.id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'prev'
      ? (currentIndex - 1 + items.length) % items.length
      : (currentIndex + 1) % items.length;
    setSelectedItemId(items[newIndex].id);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      removeItems(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setShowBulkDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        ref={modalRef}
        className="relative bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-white/10"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white">My Gallery</h2>
              <span className="text-sm text-slate-400">
                {items.length} {items.length === 1 ? 'image' : 'images'}
                {favoritesCount > 0 && ` · ${favoritesCount} favorites`}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {isSelectMode ? (
                <>
                  <span className="text-sm text-slate-400">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={selectedIds.size === 0}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={exitSelectMode}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {items.length > 0 && (
                    <button
                      onClick={() => setIsSelectMode(true)}
                      className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Select
                    </button>
                  )}
                  
                  {/* Time filter */}
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded-lg border-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded-lg border-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="favorites">Favorites First</option>
                  </select>
                </>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <GallerySkeleton />
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Image size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No images yet</h3>
              <p className="text-sm text-slate-500">
                Your generated images will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isSelectMode) {
                        toggleSelectItem(item.id);
                      } else {
                        setSelectedItemId(item.id);
                      }
                    }}
                    className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all ${
                      isSelectMode && isSelected 
                        ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' 
                        : 'hover:ring-2 hover:ring-white/30'
                    }`}
                  >
                    <img
                      src={item.resultImage}
                      alt={item.filterName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Style label */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-white text-sm font-medium truncate">{item.filterName}</p>
                      <p className="text-white/60 text-xs">{formatDate(item.createdAt)}</p>
                    </div>
                    
                    {/* Select checkbox */}
                    {isSelectMode && (
                      <div className="absolute top-2 left-2">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white/90 text-slate-400 border border-slate-300'
                        }`}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                      </div>
                    )}
                    
                    {/* Favorite badge */}
                    {item.isFavorite && !isSelectMode && (
                      <div className="absolute top-2 right-2">
                        <Heart size={16} weight="fill" className="text-red-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedItemId(null)}
          />
          
          <div className="relative bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/10">
            {/* Navigation arrows */}
            {items.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateItem('prev'); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <CaretLeft size={20} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateItem('next'); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <CaretRight size={20} className="text-white" />
                </button>
              </>
            )}
            
            {/* Close button */}
            <button
              onClick={() => setSelectedItemId(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
            
            {/* Image comparison */}
            <div className="grid grid-cols-2 gap-1 bg-slate-900">
              <div className="relative aspect-[3/4] bg-slate-800">
                <img
                  src={selectedItem.originalImage}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white font-medium">
                  Original
                </div>
              </div>
              <div className="relative aspect-[3/4] bg-slate-800">
                <img
                  src={selectedItem.resultImage}
                  alt="Transformed"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2 py-1 bg-blue-500/80 backdrop-blur-sm rounded text-xs text-white font-medium">
                  {selectedItem.filterName}
                </div>
              </div>
            </div>
            
            {/* Actions bar */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar size={14} />
                <span>{formatDate(selectedItem.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(selectedItem.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedItem.isFavorite 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <Heart size={18} weight={selectedItem.isFavorite ? 'fill' : 'regular'} />
                </button>
                
                <button
                  onClick={() => handleShare(selectedItem)}
                  className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
                  title="Share"
                >
                  <ShareNetwork size={18} />
                </button>
                
                <button
                  onClick={() => handleDownload(selectedItem)}
                  className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
                  title="Download"
                >
                  <DownloadSimple size={18} />
                </button>
                
                {showDeleteConfirm === selectedItem.id ? (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-slate-400">Delete?</span>
                    <button
                      onClick={() => handleDelete(selectedItem.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-500"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(selectedItem.id)}
                    className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <Trash size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => !isDeleting && setShowBulkDeleteConfirm(false)}
          />
          <div className="relative bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/10">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash size={28} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Delete {selectedIds.size} {selectedIds.size === 1 ? 'Image' : 'Images'}?
              </h3>
              <p className="text-slate-400 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryModal;
