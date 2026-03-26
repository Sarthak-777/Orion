import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { isSupabaseConfigured } from '../config/supabase';
import { ensureDirectory } from '../utils/filesystem';
import { SupabaseStorageAdapter } from './genericStorageService';

const MUSIC_STORAGE_KEY = '@saved_music';
const BUCKET_NAME = 'music';
export const MUSIC_DIR = FileSystem.documentDirectory + 'music/';

// Create storage adapter for music
const musicAdapter = new SupabaseStorageAdapter(BUCKET_NAME, [
  '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.3gp', '.webm', '.wma', '.opus'
]);

// Content type mapping for audio files
const CONTENT_TYPE_MAP = {
  'wav': 'audio/wav',
  'm4a': 'audio/mp4',
  'mp3': 'audio/mpeg',
  'aac': 'audio/aac',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  '3gp': 'audio/3gpp',
  'webm': 'audio/webm',
  'wma': 'audio/x-ms-wma',
  'opus': 'audio/opus',
};

// Helper functions for the adapter
const getContentType = (extension) => {
  const ext = extension.replace('.', '');
  return CONTENT_TYPE_MAP[ext] || 'audio/mpeg';
};

const extractMetadata = (music) => ({
  id: music.id,
  name: music.name,
  duration: music.duration,
  addedDate: music.addedDate,
  extension: music.extension,
  syncedAt: new Date().toISOString(),
});

// Ensure music directory exists
export async function ensureMusicDir() {
  await ensureDirectory(MUSIC_DIR);
}

// Get all music files from local storage
export async function getMusicFiles() {
  try {
    const data = await AsyncStorage.getItem(MUSIC_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting music files:', error);
    return [];
  }
}

// Save music files to local storage
async function saveMusicFiles(files) {
  try {
    await AsyncStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving music files:', error);
    throw error;
  }
}

// Add a new music file
export async function addMusicFile(sourceUri, name, duration = 0) {
  try {
    await ensureMusicDir();

    const id = Date.now().toString();
    const extension = sourceUri.split('.').pop()?.toLowerCase() || 'mp3';
    const fileName = `${id}.${extension}`;
    const destUri = `${MUSIC_DIR}${fileName}`;

    // Copy file to app directory
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });

    const newMusic = {
      id,
      name: name.trim(),
      uri: destUri,
      duration,
      addedDate: new Date().toISOString().split('T')[0],
      extension,
    };

    const musicFiles = await getMusicFiles();
    musicFiles.unshift(newMusic);
    await saveMusicFiles(musicFiles);

    return newMusic;
  } catch (error) {
    console.error('Error adding music file:', error);
    throw error;
  }
}

// Delete a music file
export async function deleteMusicFile(id) {
  try {
    const musicFiles = await getMusicFiles();
    const file = musicFiles.find(m => m.id === id);

    if (file) {
      // Delete the actual file
      try {
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
      } catch (err) {
        console.warn('Could not delete music file:', err);
      }
    }

    const updated = musicFiles.filter(m => m.id !== id);
    await saveMusicFiles(updated);
  } catch (error) {
    console.error('Error deleting music file:', error);
    throw error;
  }
}

// Rename a music file
export async function renameMusicFile(id, newName) {
  try {
    const musicFiles = await getMusicFiles();
    const index = musicFiles.findIndex(m => m.id === id);

    if (index !== -1) {
      musicFiles[index].name = newName.trim();
      await saveMusicFiles(musicFiles);
    }
  } catch (error) {
    console.error('Error renaming music file:', error);
    throw error;
  }
}

// Add restored music file (from cloud sync)
export async function addRestoredMusicFile(music) {
  try {
    const musicFiles = await getMusicFiles();
    musicFiles.unshift(music);
    await saveMusicFiles(musicFiles);
  } catch (error) {
    console.error('Error adding restored music:', error);
    throw error;
  }
}

// ========== SUPABASE CLOUD SYNC FUNCTIONS ==========

// Upload a music file to Supabase Storage
export async function uploadMusicToSupabase(music) {
  return musicAdapter.uploadFile(music, getContentType, extractMetadata);
}

// Check if a music file exists in Supabase
export async function musicExistsInSupabase(musicId, extension) {
  return musicAdapter.fileExists(musicId, `.${extension}`);
}

// Sync a single music file to Supabase
export async function syncMusicToSupabase(music) {
  return musicAdapter.syncSingle(music, getContentType, extractMetadata);
}

// Sync all music files to Supabase
export async function syncAllMusicToSupabase(musicFiles) {
  return musicAdapter.syncAll(musicFiles, getContentType, extractMetadata);
}

// Delete a music file from Supabase
export async function deleteMusicFromSupabase(musicId, extension) {
  return musicAdapter.deleteFile(musicId, `.${extension}`);
}

// List all synced music from Supabase
export async function listSyncedMusic() {
  return musicAdapter.listFiles();
}

// Restore a single music file from Supabase
export async function restoreMusicFromSupabase(musicId, extension) {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'Supabase not configured' };
  }

  const checkLocalExists = async (id) => {
    const localMusic = await getMusicFiles();
    return localMusic.some(m => m.id === id);
  };

  const createLocalItem = async (metadata, localPath) => {
    const music = {
      id: musicId,
      name: metadata?.name || `Music ${musicId}`,
      uri: localPath,
      duration: metadata?.duration || 0,
      addedDate: metadata?.addedDate || new Date().toISOString().split('T')[0],
      extension: metadata?.extension || extension.replace('.', ''),
    };
    await addRestoredMusicFile(music);
  };

  return musicAdapter.restoreSingle(
    musicId,
    `.${extension}`,
    MUSIC_DIR,
    checkLocalExists,
    createLocalItem
  );
}

// Restore all music files from Supabase
export async function restoreAllMusicFromSupabase() {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'Supabase not configured' };
  }

  const checkLocalExists = async (id) => {
    const localMusic = await getMusicFiles();
    return localMusic.some(m => m.id === id);
  };

  const createLocalItem = async (metadata, localPath) => {
    const music = {
      id: metadata.id,
      name: metadata?.name || `Music ${metadata.id}`,
      uri: localPath,
      duration: metadata?.duration || 0,
      addedDate: metadata?.addedDate || new Date().toISOString().split('T')[0],
      extension: metadata?.extension || 'mp3',
    };
    await addRestoredMusicFile(music);
  };

  return musicAdapter.restoreAll(MUSIC_DIR, checkLocalExists, createLocalItem);
}
