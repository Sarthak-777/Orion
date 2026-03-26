import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getSyncSettings,
  saveSyncSettings,
  clearSyncSettings,
  syncAllTabsToSupabase,
  syncTabToSupabase,
  restoreAllTabsFromSupabase,
} from '../services/supabaseStorageService';
import {
  syncAllMusicToSupabase,
  restoreAllMusicFromSupabase,
  getMusicFiles,
} from '../services/musicStorageService';
import {
  syncAllVoiceMemosToSupabase,
  restoreAllVoiceMemosFromSupabase,
  getVoiceMemos,
} from '../services/voiceMemoStorageService';
import { initializeSupabase } from '../config/supabase';
import { getTabs } from '../services/tabsStorage';

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Initialize Supabase
      const supabaseReady = await initializeSupabase();
      setIsInitialized(supabaseReady);

      // Load sync settings
      const settings = await getSyncSettings();
      setIsEnabled(settings.enabled || false);
      setLastSync(settings.lastSync || null);
      setAutoSync(settings.autoSync !== false);
    } catch (error) {
      console.error('Error loading sync settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSync = useCallback(async (enabled) => {
    await saveSyncSettings({ enabled });
    setIsEnabled(enabled);

    // If enabling, restore from cloud first, then sync
    if (enabled && isInitialized) {
      await performRestore();
      await performSync();
    }
  }, [isInitialized]);

  const toggleAutoSync = useCallback(async (enabled) => {
    await saveSyncSettings({ autoSync: enabled });
    setAutoSync(enabled);
  }, []);

  const performSync = useCallback(async () => {
    if (!isInitialized || !isEnabled || isSyncing) {
      return { success: false, reason: 'Not ready' };
    }

    setIsSyncing(true);
    try {
      // Sync tabs
      const tabs = await getTabs();
      const tabsResult = await syncAllTabsToSupabase(tabs);

      // Sync music
      const music = await getMusicFiles();
      const musicResult = await syncAllMusicToSupabase(music);

      // Sync voice memos
      const memos = await getVoiceMemos();
      const memosResult = await syncAllVoiceMemosToSupabase(memos);

      const totalSynced = (tabsResult.synced || 0) + (musicResult.synced || 0) + (memosResult.synced || 0);
      const allSuccess = tabsResult.success && musicResult.success && memosResult.success;

      if (allSuccess || totalSynced > 0) {
        const now = new Date().toISOString();
        await saveSyncSettings({ lastSync: now });
        setLastSync(now);
      }

      return {
        success: allSuccess,
        synced: totalSynced,
        tabs: tabsResult,
        music: musicResult,
        memos: memosResult,
      };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, reason: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isInitialized, isEnabled, isSyncing]);

  const syncSingleTab = useCallback(async (tab) => {
    if (!isInitialized || !isEnabled) {
      return { success: false, reason: 'Sync not enabled' };
    }

    try {
      return await syncTabToSupabase(tab);
    } catch (error) {
      console.error('Error syncing tab:', error);
      return { success: false, reason: error.message };
    }
  }, [isInitialized, isEnabled]);

  const resetSync = useCallback(async () => {
    await clearSyncSettings();
    setIsEnabled(false);
    setLastSync(null);
    setAutoSync(true);
  }, []);

  const performRestore = useCallback(async () => {
    if (!isInitialized || isSyncing) {
      return { success: false, reason: 'Not ready' };
    }

    setIsSyncing(true);
    try {
      // Restore tabs
      const tabsResult = await restoreAllTabsFromSupabase();

      // Restore music
      const musicResult = await restoreAllMusicFromSupabase();

      // Restore voice memos
      const memosResult = await restoreAllVoiceMemosFromSupabase();

      const totalRestored = (tabsResult.restored || 0) + (musicResult.restored || 0) + (memosResult.restored || 0);
      const allSuccess = tabsResult.success && musicResult.success && memosResult.success;

      return {
        success: allSuccess,
        restored: totalRestored,
        tabs: tabsResult,
        music: musicResult,
        memos: memosResult,
      };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, reason: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isInitialized, isSyncing]);

  // Auto-sync on app load if enabled (restore from cloud first, then sync)
  useEffect(() => {
    const autoSyncOnLoad = async () => {
      if (!isLoading && isEnabled && isInitialized && autoSync) {
        await performRestore();
        await performSync();
      }
    };
    autoSyncOnLoad();
  }, [isLoading, isEnabled, isInitialized, autoSync]);

  const value = {
    // State
    isEnabled,
    isSyncing,
    lastSync,
    autoSync,
    isLoading,
    isInitialized,

    // Actions
    toggleSync,
    toggleAutoSync,
    performSync,
    performRestore,
    syncSingleTab,
    resetSync,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
