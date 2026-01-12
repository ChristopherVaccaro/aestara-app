import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GalleryItem } from '../types';
import { supabase } from '../utils/supabaseClient';
import { logDbCall, isDebugMode } from '../utils/supabaseDebug';
import { uploadImage, deleteImage, deleteImages, isStorageUrl } from '../services/storageService';

interface GalleryContextType {
  items: GalleryItem[];
  isLoading: boolean;
  addItem: (item: Omit<GalleryItem, 'id' | 'createdAt'>) => Promise<GalleryItem | null>;
  removeItem: (id: string) => Promise<void>;
  removeItems: (ids: string[]) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clearUserGallery: (userId: string) => Promise<void>;
  loadUserGallery: (userId: string, forceReload?: boolean) => Promise<void>;
  resetGalleryState: () => void; // Call on logout to reset local state
  getUserItems: (userId: string) => GalleryItem[];
  getItemById: (id: string) => GalleryItem | undefined;
}

const GalleryContext = createContext<GalleryContextType | null>(null);

// Database row type matching Supabase schema
interface DbGalleryRow {
  id: string;
  user_id: string;
  original_image: string;
  result_image: string;
  style_name: string | null;
  style_data: { filterId?: string } | null;
  is_favorite: boolean;
  created_at: string;
}

// Convert DB row to GalleryItem
function dbRowToGalleryItem(row: DbGalleryRow): GalleryItem {
  return {
    id: row.id,
    userId: row.user_id,
    originalImage: row.original_image,
    resultImage: row.result_image,
    filterName: row.style_name || 'Unknown Style',
    filterId: row.style_data?.filterId || '',
    isFavorite: row.is_favorite,
    createdAt: new Date(row.created_at),
  };
}

export const GalleryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadedUserRef = useRef<string | null>(null);

  // Load gallery items from Supabase for a user
  // forceReload: bypass cache and reload from DB (used after login)
  const loadUserGallery = useCallback(async (userId: string, forceReload: boolean = false) => {
    // Check if we need to clear state for a different user
    if (loadedUserRef.current && loadedUserRef.current !== userId) {
      if (isDebugMode()) {
        console.log('🔄 [Gallery] User changed, clearing old items');
      }
      setItems([]);
      loadedUserRef.current = null;
    }

    // Don't reload if already loaded for this user (unless forced)
    if (!forceReload && loadedUserRef.current === userId) {
      if (isDebugMode()) {
        console.log('⏭️ [Gallery] Already loaded for user, skipping');
      }
      return;
    }

    if (isDebugMode()) {
      console.log(`📥 [Gallery] Loading gallery for user: ${userId.substring(0, 8)}...`);
    }

    setIsLoading(true);
    try {
      logDbCall('gallery', 'select');
      
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [Gallery] Error loading from Supabase:', error);
        return;
      }

      const galleryItems = (data || []).map(dbRowToGalleryItem);
      setItems(galleryItems);
      loadedUserRef.current = userId;
      
      if (isDebugMode()) {
        console.log(`✅ [Gallery] Loaded ${galleryItems.length} items`);
        // Debug: show first item's URLs to verify they're storage URLs
        if (galleryItems.length > 0) {
          const first = galleryItems[0];
          console.log(`🔍 [Gallery] First item URLs:`, {
            original: first.originalImage.substring(0, 80) + '...',
            result: first.resultImage.substring(0, 80) + '...',
            isStorageUrl: isStorageUrl(first.resultImage),
          });
        }
      }
    } catch (error) {
      console.error('❌ [Gallery] Error in loadUserGallery:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new gallery item - uploads images to Storage first
  const addItem = useCallback(async (itemData: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<GalleryItem | null> => {
    try {
      if (isDebugMode()) {
        console.log('📤 [Gallery] Adding item, input URLs:', {
          original: itemData.originalImage.substring(0, 50) + '...',
          result: itemData.resultImage.substring(0, 50) + '...',
        });
      }

      // Upload images to Supabase Storage
      let originalImageUrl = itemData.originalImage;
      let resultImageUrl = itemData.resultImage;

      // Only upload if it's a data URL or blob URL (not already a storage URL)
      if (!isStorageUrl(itemData.originalImage)) {
        const uploadedOriginal = await uploadImage(itemData.userId, itemData.originalImage, 'original');
        if (uploadedOriginal) {
          originalImageUrl = uploadedOriginal;
        } else {
          console.error('❌ [Gallery] Failed to upload original image - will store non-storage URL');
        }
      }

      if (!isStorageUrl(itemData.resultImage)) {
        const uploadedResult = await uploadImage(itemData.userId, itemData.resultImage, 'result');
        if (uploadedResult) {
          resultImageUrl = uploadedResult;
        } else {
          console.error('❌ [Gallery] Failed to upload result image - will store non-storage URL');
        }
      }

      if (isDebugMode()) {
        console.log('📥 [Gallery] Final URLs to store:', {
          original: originalImageUrl.substring(0, 80) + '...',
          result: resultImageUrl.substring(0, 80) + '...',
          originalIsStorage: isStorageUrl(originalImageUrl),
          resultIsStorage: isStorageUrl(resultImageUrl),
        });
      }

      logDbCall('gallery', 'insert');
      
      const { data, error } = await supabase
        .from('gallery')
        .insert({
          user_id: itemData.userId,
          original_image: originalImageUrl,
          result_image: resultImageUrl,
          style_name: itemData.filterName,
          style_data: { filterId: itemData.filterId },
          is_favorite: itemData.isFavorite,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding gallery item:', error);
        return null;
      }

      const newItem = dbRowToGalleryItem(data);
      setItems(prev => [newItem, ...prev]);
      
      if (isDebugMode()) {
        console.log('✅ Added gallery item:', newItem.filterName);
      }
      return newItem;
    } catch (error) {
      console.error('Error in addItem:', error);
      return null;
    }
  }, []);

  // Remove an item by ID - also deletes images from Storage
  const removeItem = useCallback(async (id: string) => {
    try {
      // Get the item to delete its images from storage
      const itemToDelete = items.find(item => item.id === id);
      
      logDbCall('gallery', 'delete');
      
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing gallery item:', error);
        return;
      }

      // Delete images from storage (fire and forget - don't block UI)
      if (itemToDelete) {
        const imagesToDelete: string[] = [];
        if (isStorageUrl(itemToDelete.originalImage)) {
          imagesToDelete.push(itemToDelete.originalImage);
        }
        if (isStorageUrl(itemToDelete.resultImage)) {
          imagesToDelete.push(itemToDelete.resultImage);
        }
        if (imagesToDelete.length > 0) {
          deleteImages(imagesToDelete).catch(err => 
            console.error('Error deleting images from storage:', err)
          );
        }
      }

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error in removeItem:', error);
    }
  }, [items]);

  // Remove multiple items by IDs - also deletes images from Storage
  const removeItems = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      // Get items to delete their images from storage
      const itemsToDelete = items.filter(item => ids.includes(item.id));
      
      logDbCall('gallery', 'delete');
      
      const { error } = await supabase
        .from('gallery')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error removing gallery items:', error);
        return;
      }

      // Delete images from storage (fire and forget - don't block UI)
      const imagesToDelete: string[] = [];
      for (const item of itemsToDelete) {
        if (isStorageUrl(item.originalImage)) {
          imagesToDelete.push(item.originalImage);
        }
        if (isStorageUrl(item.resultImage)) {
          imagesToDelete.push(item.resultImage);
        }
      }
      if (imagesToDelete.length > 0) {
        deleteImages(imagesToDelete).catch(err => 
          console.error('Error deleting images from storage:', err)
        );
      }

      setItems(prev => prev.filter(item => !ids.includes(item.id)));
    } catch (error) {
      console.error('Error in removeItems:', error);
    }
  }, [items]);

  // Toggle favorite status - optimistic update for instant feedback
  const toggleFavorite = useCallback(async (id: string) => {
    // Optimistic update
    const currentItem = items.find(item => item.id === id);
    if (!currentItem) return;

    const newFavoriteStatus = !currentItem.isFavorite;
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isFavorite: newFavoriteStatus } : item
    ));

    try {
      logDbCall('gallery', 'update');
      
      const { error } = await supabase
        .from('gallery')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', id);

      if (error) {
        // Revert on failure
        console.error('Error toggling favorite:', error);
        setItems(prev => prev.map(item => 
          item.id === id ? { ...item, isFavorite: !newFavoriteStatus } : item
        ));
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      // Revert on failure
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isFavorite: !newFavoriteStatus } : item
      ));
    }
  }, [items]);

  // Clear all items for a specific user
  const clearUserGallery = useCallback(async (userId: string) => {
    try {
      logDbCall('gallery', 'delete');
      
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing gallery:', error);
        return;
      }

      setItems(prev => prev.filter(item => item.userId !== userId));
      loadedUserRef.current = null;
    } catch (error) {
      console.error('Error in clearUserGallery:', error);
    }
  }, []);

  // Get items for a specific user
  const getUserItems = useCallback((userId: string): GalleryItem[] => {
    return items.filter(item => item.userId === userId);
  }, [items]);

  // Get a single item by ID
  const getItemById = useCallback((id: string): GalleryItem | undefined => {
    return items.find(item => item.id === id);
  }, [items]);

  // Reset gallery state on logout - clears local state without touching DB
  const resetGalleryState = useCallback(() => {
    if (isDebugMode()) {
      console.log('🧹 [Gallery] Resetting gallery state (logout)');
    }
    setItems([]);
    loadedUserRef.current = null;
  }, []);

  const value: GalleryContextType = {
    items,
    isLoading,
    addItem,
    removeItem,
    removeItems,
    toggleFavorite,
    clearUserGallery,
    loadUserGallery,
    resetGalleryState,
    getUserItems,
    getItemById,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = (): GalleryContextType => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};

export default GalleryContext;
