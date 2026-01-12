import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GalleryItem } from '../types';
import { supabase } from '../utils/supabaseClient';
import { logDbCall, isDebugMode } from '../utils/supabaseDebug';

interface GalleryContextType {
  items: GalleryItem[];
  isLoading: boolean;
  addItem: (item: Omit<GalleryItem, 'id' | 'createdAt'>) => Promise<GalleryItem | null>;
  removeItem: (id: string) => Promise<void>;
  removeItems: (ids: string[]) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clearUserGallery: (userId: string) => Promise<void>;
  loadUserGallery: (userId: string) => Promise<void>;
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
  const loadUserGallery = useCallback(async (userId: string) => {
    // Don't reload if already loaded for this user
    if (loadedUserRef.current === userId) {
      return;
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
        console.error('Error loading gallery from Supabase:', error);
        return;
      }

      const galleryItems = (data || []).map(dbRowToGalleryItem);
      setItems(galleryItems);
      loadedUserRef.current = userId;
      
      if (isDebugMode()) {
        console.log(`✅ Loaded ${galleryItems.length} gallery items for user`);
      }
    } catch (error) {
      console.error('Error in loadUserGallery:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new gallery item
  const addItem = useCallback(async (itemData: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<GalleryItem | null> => {
    try {
      logDbCall('gallery', 'insert');
      
      const { data, error } = await supabase
        .from('gallery')
        .insert({
          user_id: itemData.userId,
          original_image: itemData.originalImage,
          result_image: itemData.resultImage,
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

  // Remove an item by ID
  const removeItem = useCallback(async (id: string) => {
    try {
      logDbCall('gallery', 'delete');
      
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing gallery item:', error);
        return;
      }

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error in removeItem:', error);
    }
  }, []);

  // Remove multiple items by IDs
  const removeItems = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      logDbCall('gallery', 'delete');
      
      const { error } = await supabase
        .from('gallery')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error removing gallery items:', error);
        return;
      }

      setItems(prev => prev.filter(item => !ids.includes(item.id)));
    } catch (error) {
      console.error('Error in removeItems:', error);
    }
  }, []);

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

  const value: GalleryContextType = {
    items,
    isLoading,
    addItem,
    removeItem,
    removeItems,
    toggleFavorite,
    clearUserGallery,
    loadUserGallery,
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
