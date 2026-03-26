import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { ensureDirectory } from '../utils/filesystem';

const TABS_KEY = '@saved_tabs';
export const TABS_DIR = FileSystem.documentDirectory + 'tabs/';

// Ensure tabs directory exists
export async function ensureTabsDir() {
  await ensureDirectory(TABS_DIR);
}

// Get all saved tabs
export async function getTabs() {
  try {
    const data = await AsyncStorage.getItem(TABS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting tabs:', error);
    return [];
  }
}

// Save tabs list
async function saveTabs(tabs) {
  try {
    await AsyncStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  } catch (error) {
    console.error('Error saving tabs:', error);
  }
}

// Copy file using base64 (replacement for deprecated copyAsync)
async function copyFile(sourceUri, destUri) {
  const base64Content = await FileSystem.readAsStringAsync(sourceUri, {
    encoding: 'base64',
  });
  await FileSystem.writeAsStringAsync(destUri, base64Content, {
    encoding: 'base64',
  });
}

// Add a new tab (copy PDF to app storage)
export async function addTab(sourceUri, name, instrument = 'Guitar') {
  try {
    await ensureTabsDir();

    const id = Date.now().toString();
    const fileName = `${id}.pdf`;
    const destUri = TABS_DIR + fileName;

    // Copy file to app storage using base64
    await copyFile(sourceUri, destUri);

    const newTab = {
      id,
      name,
      instrument,
      uri: destUri,
      addedDate: new Date().toISOString().split('T')[0],
    };

    const tabs = await getTabs();
    tabs.unshift(newTab);
    await saveTabs(tabs);

    return newTab;
  } catch (error) {
    console.error('Error adding tab:', error);
    throw error;
  }
}

// Rename a tab
export async function renameTab(id, newName) {
  try {
    const tabs = await getTabs();
    const index = tabs.findIndex(t => t.id === id);
    if (index !== -1) {
      tabs[index].name = newName;
      await saveTabs(tabs);
      return tabs[index];
    }
    return null;
  } catch (error) {
    console.error('Error renaming tab:', error);
    throw error;
  }
}

// Delete a tab
export async function deleteTab(id) {
  try {
    const tabs = await getTabs();
    const tab = tabs.find(t => t.id === id);

    if (tab) {
      // Delete the file (idempotent: true won't throw if file doesn't exist)
      try {
        await FileSystem.deleteAsync(tab.uri, { idempotent: true });
      } catch (error) {
        // Ignore file deletion errors
      }

      // Remove from list
      const newTabs = tabs.filter(t => t.id !== id);
      await saveTabs(newTabs);
    }

    return true;
  } catch (error) {
    console.error('Error deleting tab:', error);
    throw error;
  }
}

// Update tab instrument
export async function updateTabInstrument(id, instrument) {
  try {
    const tabs = await getTabs();
    const index = tabs.findIndex(t => t.id === id);
    if (index !== -1) {
      tabs[index].instrument = instrument;
      await saveTabs(tabs);
      return tabs[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating tab:', error);
    throw error;
  }
}

// Add a restored tab from cloud (preserves original ID and metadata)
export async function addRestoredTab(tab) {
  try {
    await ensureTabsDir();

    const tabs = await getTabs();

    // Check if tab already exists
    const exists = tabs.some(t => t.id === tab.id);
    if (exists) {
      return { success: true, skipped: true };
    }

    tabs.unshift(tab);
    await saveTabs(tabs);

    return { success: true, skipped: false };
  } catch (error) {
    console.error('Error adding restored tab:', error);
    throw error;
  }
}
