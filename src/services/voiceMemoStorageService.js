import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { isSupabaseConfigured } from '../config/supabase';
import { ensureDirectory } from '../utils/filesystem';
import { SupabaseStorageAdapter } from './genericStorageService';

const VOICE_MEMOS_STORAGE_KEY = '@voice_memos';
const BUCKET_NAME = 'voice_memos';
export const VOICE_MEMOS_DIR = FileSystem.documentDirectory + 'voice_memos/';

// Create storage adapter for voice memos
const memoAdapter = new SupabaseStorageAdapter(BUCKET_NAME, ['.wav', '.m4a', '.mp3']);

// Helper functions for the adapter
const getContentType = (extension) => {
  const ext = extension.replace('.', '');
  return ext === 'wav' ? 'audio/wav' : 'audio/mp4';
};

const extractMetadata = (memo) => ({
  id: memo.id,
  name: memo.name,
  userName: memo.userName,
  duration: memo.duration,
  addedDate: memo.addedDate,
  extension: memo.extension,
  isPublic: memo.isPublic,
  likes: memo.likes,
  userId: memo.userId,
  reaction: memo.reaction,
  syncedAt: new Date().toISOString(),
});

// Ensure voice memos directory exists
export async function ensureVoiceMemosDir() {
  await ensureDirectory(VOICE_MEMOS_DIR);
}

// Get all voice memos from local storage
export async function getVoiceMemos() {
  try {
    const data = await AsyncStorage.getItem(VOICE_MEMOS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting voice memos:', error);
    return [];
  }
}

// Save voice memos to local storage
async function saveVoiceMemos(memos) {
  try {
    await AsyncStorage.setItem(VOICE_MEMOS_STORAGE_KEY, JSON.stringify(memos));
  } catch (error) {
    console.error('Error saving voice memos:', error);
    throw error;
  }
}

// Add a new voice memo
export async function addVoiceMemo(sourceUri, name, duration = 0, userName = 'Anonymous') {
  try {
    await ensureVoiceMemosDir();

    const id = Date.now().toString();
    const extension = sourceUri.split('.').pop()?.toLowerCase() || 'wav';
    const fileName = `${id}.${extension}`;
    const destUri = `${VOICE_MEMOS_DIR}${fileName}`;

    // Copy file to app directory
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });

    const newMemo = {
      id,
      name: name.trim(),
      userName: userName || 'Anonymous',
      uri: destUri,
      duration,
      addedDate: new Date().toISOString(),
      extension,
      // Social features
      isPublic: false,
      likes: 0,
      liked: false,
      comments: [],
      userId: null,
    };

    const memos = await getVoiceMemos();
    memos.unshift(newMemo);
    await saveVoiceMemos(memos);

    return newMemo;
  } catch (error) {
    console.error('Error adding voice memo:', error);
    throw error;
  }
}

// Delete a voice memo
export async function deleteVoiceMemo(id) {
  try {
    const memos = await getVoiceMemos();
    const memo = memos.find(m => m.id === id);

    if (memo) {
      try {
        await FileSystem.deleteAsync(memo.uri, { idempotent: true });
      } catch (err) {
        console.warn('Could not delete voice memo file:', err);
      }
    }

    const updated = memos.filter(m => m.id !== id);
    await saveVoiceMemos(updated);
  } catch (error) {
    console.error('Error deleting voice memo:', error);
    throw error;
  }
}

// Rename a voice memo
export async function renameVoiceMemo(id, newName) {
  try {
    const memos = await getVoiceMemos();
    const index = memos.findIndex(m => m.id === id);

    if (index !== -1) {
      memos[index].name = newName.trim();
      await saveVoiceMemos(memos);
    }
  } catch (error) {
    console.error('Error renaming voice memo:', error);
    throw error;
  }
}

// Toggle like on a voice memo
export async function toggleLikeVoiceMemo(id) {
  try {
    const memos = await getVoiceMemos();
    const index = memos.findIndex(m => m.id === id);

    if (index !== -1) {
      const memo = memos[index];
      memo.liked = !memo.liked;
      memo.likes = memo.liked ? memo.likes + 1 : Math.max(0, memo.likes - 1);
      await saveVoiceMemos(memos);
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

// Add reaction to a voice memo
export async function addReaction(id, emoji) {
  try {
    const memos = await getVoiceMemos();
    const index = memos.findIndex(m => m.id === id);

    if (index !== -1) {
      memos[index].reaction = emoji;
      await saveVoiceMemos(memos);
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

// Add restored voice memo (from cloud sync)
export async function addRestoredVoiceMemo(memo) {
  try {
    const memos = await getVoiceMemos();
    memos.unshift(memo);
    await saveVoiceMemos(memos);
  } catch (error) {
    console.error('Error adding restored voice memo:', error);
    throw error;
  }
}

// ========== SUPABASE CLOUD SYNC FUNCTIONS ==========

// Upload a voice memo to Supabase Storage
export async function uploadVoiceMemoToSupabase(memo) {
  return memoAdapter.uploadFile(memo, getContentType, extractMetadata);
}

// Check if a voice memo exists in Supabase
export async function voiceMemoExistsInSupabase(memoId, extension) {
  return memoAdapter.fileExists(memoId, `.${extension}`);
}

// Sync a single voice memo to Supabase
export async function syncVoiceMemoToSupabase(memo) {
  return memoAdapter.syncSingle(memo, getContentType, extractMetadata);
}

// Sync all voice memos to Supabase
export async function syncAllVoiceMemosToSupabase(memos) {
  return memoAdapter.syncAll(memos, getContentType, extractMetadata);
}

// Delete a voice memo from Supabase
export async function deleteVoiceMemoFromSupabase(memoId, extension) {
  return memoAdapter.deleteFile(memoId, `.${extension}`);
}

// List all synced voice memos from Supabase
export async function listSyncedVoiceMemos() {
  return memoAdapter.listFiles();
}

// Restore a single voice memo from Supabase
export async function restoreVoiceMemoFromSupabase(memoId, extension) {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'Supabase not configured' };
  }

  const checkLocalExists = async (id) => {
    const localMemos = await getVoiceMemos();
    return localMemos.some(m => m.id === id);
  };

  const createLocalItem = async (metadata, localPath) => {
    const memo = {
      id: memoId,
      name: metadata?.name || `Memo ${memoId}`,
      userName: metadata?.userName || 'Anonymous',
      uri: localPath,
      duration: metadata?.duration || 0,
      addedDate: metadata?.addedDate || new Date().toISOString(),
      extension: metadata?.extension || extension.replace('.', ''),
      isPublic: metadata?.isPublic || false,
      likes: metadata?.likes || 0,
      liked: false,
      comments: [],
      userId: metadata?.userId || null,
      reaction: metadata?.reaction || null,
    };
    await addRestoredVoiceMemo(memo);
  };

  return memoAdapter.restoreSingle(
    memoId,
    `.${extension}`,
    VOICE_MEMOS_DIR,
    checkLocalExists,
    createLocalItem
  );
}

// Restore all voice memos from Supabase
export async function restoreAllVoiceMemosFromSupabase() {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'Supabase not configured' };
  }

  const checkLocalExists = async (id) => {
    const localMemos = await getVoiceMemos();
    return localMemos.some(m => m.id === id);
  };

  const createLocalItem = async (metadata, localPath) => {
    const memo = {
      id: metadata.id,
      name: metadata?.name || `Memo ${metadata.id}`,
      userName: metadata?.userName || 'Anonymous',
      uri: localPath,
      duration: metadata?.duration || 0,
      addedDate: metadata?.addedDate || new Date().toISOString(),
      extension: metadata?.extension || 'wav',
      isPublic: metadata?.isPublic || false,
      likes: metadata?.likes || 0,
      liked: false,
      comments: [],
      userId: metadata?.userId || null,
      reaction: metadata?.reaction || null,
    };
    await addRestoredVoiceMemo(memo);
  };

  return memoAdapter.restoreAll(VOICE_MEMOS_DIR, checkLocalExists, createLocalItem);
}
