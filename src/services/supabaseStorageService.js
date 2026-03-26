import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured } from '../config/supabase';
import { TABS_DIR, ensureTabsDir, addRestoredTab, getTabs } from './tabsStorage';
import { SupabaseStorageAdapter } from './genericStorageService';

const SYNC_SETTINGS_KEY = '@supabase_sync_settings';
const BUCKET_NAME = 'tabs';

// Create storage adapter for tabs
const tabsAdapter = new SupabaseStorageAdapter(BUCKET_NAME, ['.pdf']);

// Helper functions for the adapter
const getContentType = () => 'application/pdf';

const extractMetadata = (tab) => ({
  id: tab.id,
  name: tab.name,
  instrument: tab.instrument,
  addedDate: tab.addedDate,
  syncedAt: new Date().toISOString(),
});

// Get sync settings from local storage
export async function getSyncSettings() {
  try {
    const data = await AsyncStorage.getItem(SYNC_SETTINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting sync settings:', error);
    return {};
  }
}

// Save sync settings to local storage
export async function saveSyncSettings(settings) {
  try {
    const current = await getSyncSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving sync settings:', error);
    throw error;
  }
}

// Clear sync settings
export async function clearSyncSettings() {
  try {
    await AsyncStorage.removeItem(SYNC_SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing sync settings:', error);
  }
}

// Upload a tab PDF to Supabase Storage
export async function uploadTabToSupabase(tab) {
  return tabsAdapter.uploadFile(tab, getContentType, extractMetadata);
}

// Check if a file exists in Supabase Storage
export async function fileExistsInSupabase(tabId) {
  return tabsAdapter.fileExists(tabId, '.pdf');
}

// Sync a single tab to Supabase (checks if already synced)
export async function syncTabToSupabase(tab) {
  return tabsAdapter.syncSingle(tab, getContentType, extractMetadata);
}

// Sync all tabs to Supabase
export async function syncAllTabsToSupabase(tabs) {
  return tabsAdapter.syncAll(tabs, getContentType, extractMetadata);
}

// Delete a tab from Supabase Storage
export async function deleteTabFromSupabase(tabId) {
  return tabsAdapter.deleteFile(tabId, '.pdf');
}

// List all synced tabs from Supabase
export async function listSyncedTabs() {
  return tabsAdapter.listFiles();
}

// Restore a single tab from Supabase
export async function restoreTabFromSupabase(tabId) {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'Supabase not configured' };
  }

  const checkLocalExists = async (id) => {
    const localTabs = await getTabs();
    return localTabs.some(t => t.id === id);
  };

  const createLocalItem = async (metadata, localPath) => {
    const tab = {
      id: tabId,
      name: metadata?.name || `Tab ${tabId}`,
      instrument: metadata?.instrument || 'Guitar',
      uri: localPath,
      addedDate: metadata?.addedDate || new Date().toISOString().split('T')[0],
    };
    await addRestoredTab(tab);
  };

  return tabsAdapter.restoreSingle(
    tabId,
    '.pdf',
    TABS_DIR,
    checkLocalExists,
    createLocalItem
  );
}

// Restore all tabs from Supabase
export async function restoreAllTabsFromSupabase() {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'Supabase not configured' };
  }

  const checkLocalExists = async (id) => {
    const localTabs = await getTabs();
    return localTabs.some(t => t.id === id);
  };

  const createLocalItem = async (metadata, localPath) => {
    const tab = {
      id: metadata.id,
      name: metadata?.name || `Tab ${metadata.id}`,
      instrument: metadata?.instrument || 'Guitar',
      uri: localPath,
      addedDate: metadata?.addedDate || new Date().toISOString().split('T')[0],
    };
    await addRestoredTab(tab);
  };

  return tabsAdapter.restoreAll(TABS_DIR, checkLocalExists, createLocalItem);
}
