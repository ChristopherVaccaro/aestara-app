/**
 * User Settings Context
 * Provides user settings state and persistence across the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  UserSettings,
  FabPosition,
  getLocalSettings,
  saveLocalSettings,
  getUserSettings,
  saveUserSettings,
  syncSettingsOnLogin,
} from '../services/userSettingsService';

interface UserSettingsContextType {
  settings: UserSettings;
  fabPosition: FabPosition;
  setFabPosition: (position: FabPosition) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  fabPositionMobile: 'right',
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};

interface UserSettingsProviderProps {
  children: React.ReactNode;
}

export const UserSettingsProvider: React.FC<UserSettingsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => getLocalSettings());
  const [isLoading, setIsLoading] = useState(false);

  // Load settings on mount and when user changes
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        if (user?.id) {
          // User is logged in - sync and load from Supabase
          const userSettings = await syncSettingsOnLogin(user.id);
          setSettings(userSettings);
        } else {
          // User is logged out - use local settings
          setSettings(getLocalSettings());
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(getLocalSettings());
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  const setFabPosition = useCallback(async (position: FabPosition) => {
    const newSettings = { ...settings, fabPositionMobile: position };
    setSettings(newSettings);

    // Save to localStorage immediately for instant feedback
    saveLocalSettings({ fabPositionMobile: position });

    // If user is logged in, also save to Supabase
    if (user?.id) {
      await saveUserSettings(user.id, { fabPositionMobile: position });
    }
  }, [settings, user?.id]);

  const value = {
    settings,
    fabPosition: settings.fabPositionMobile,
    setFabPosition,
    isLoading,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};
