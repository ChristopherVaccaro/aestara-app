/**
 * User Settings Service
 * Handles persistence of user preferences like FAB position
 * Uses localStorage for unauthenticated users, Supabase profiles table for authenticated users
 */

import { supabase } from '../utils/supabaseClient';

export type FabPosition = 'left' | 'right';

export interface UserSettings {
  fabPositionMobile: FabPosition;
}

const DEFAULT_SETTINGS: UserSettings = {
  fabPositionMobile: 'right',
};

const LOCAL_STORAGE_KEY = 'aestara_user_settings';

/**
 * Get settings from localStorage (for unauthenticated users or initial load)
 */
export const getLocalSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading local settings:', error);
  }
  return DEFAULT_SETTINGS;
};

/**
 * Save settings to localStorage
 */
export const saveLocalSettings = (settings: Partial<UserSettings>): void => {
  try {
    const current = getLocalSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving local settings:', error);
  }
};

/**
 * Get settings for authenticated user from Supabase
 */
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      return getLocalSettings();
    }

    const dbSettings = data?.settings || {};
    return { ...DEFAULT_SETTINGS, ...dbSettings };
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    return getLocalSettings();
  }
};

/**
 * Save settings for authenticated user to Supabase
 */
export const saveUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> => {
  try {
    // First get current settings
    const { data: currentData } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    const currentSettings = currentData?.settings || {};
    const updatedSettings = { ...currentSettings, ...settings };

    const { error } = await supabase
      .from('profiles')
      .update({ 
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error saving user settings:', error);
      return false;
    }

    // Also save to localStorage for immediate access
    saveLocalSettings(settings);
    return true;
  } catch (error) {
    console.error('Error in saveUserSettings:', error);
    return false;
  }
};

/**
 * Sync local settings to user account on login
 */
export const syncSettingsOnLogin = async (userId: string): Promise<UserSettings> => {
  const localSettings = getLocalSettings();
  const userSettings = await getUserSettings(userId);

  // If user has no settings stored, use local settings
  if (!userSettings || Object.keys(userSettings).length === 0) {
    await saveUserSettings(userId, localSettings);
    return localSettings;
  }

  // User settings take precedence, update local storage
  saveLocalSettings(userSettings);
  return userSettings;
};
