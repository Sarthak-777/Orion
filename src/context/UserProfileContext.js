import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PROFILE_KEY = '@user_profile';

const UserProfileContext = createContext(null);

const DEFAULT_PROFILE = {
  displayName: '',
  createdAt: null,
};

export function UserProfileProvider({ children }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayName = useCallback(async (name) => {
    try {
      const updatedProfile = {
        ...profile,
        displayName: name.trim(),
        createdAt: profile.createdAt || new Date().toISOString(),
      };
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      return { success: true };
    } catch (error) {
      console.error('Error updating display name:', error);
      return { success: false, error: error.message };
    }
  }, [profile]);

  const clearProfile = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      setProfile(DEFAULT_PROFILE);
      return { success: true };
    } catch (error) {
      console.error('Error clearing profile:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const value = {
    displayName: profile.displayName,
    hasProfile: !!profile.displayName,
    isLoading,
    updateDisplayName,
    clearProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
