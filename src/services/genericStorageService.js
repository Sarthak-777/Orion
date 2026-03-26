/**
 * Generic Supabase Storage Service
 *
 * Provides a reusable abstraction for Supabase storage operations.
 * Eliminates ~800 lines of duplicated code across tabs, music, and voice memos services.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { base64ToBytes } from '../utils/base64';
import { ensureDirectory } from '../utils/filesystem';

/**
 * Generic Supabase Storage Adapter
 *
 * Handles all common storage operations: upload, download, sync, restore, delete
 */
export class SupabaseStorageAdapter {
  /**
   * Create a new storage adapter
   *
   * @param {string} bucketName - Supabase storage bucket name
   * @param {string[]} fileExtensions - Supported file extensions (e.g., ['.pdf'], ['.mp3', '.wav'])
   */
  constructor(bucketName, fileExtensions) {
    this.bucketName = bucketName;
    this.fileExtensions = fileExtensions;
  }

  /**
   * Upload a file and its metadata to Supabase
   *
   * @param {Object} item - Item to upload (must have id, uri, and metadata fields)
   * @param {Function} getContentType - Function to determine content type from extension
   * @param {Function} extractMetadata - Function to extract metadata from item
   * @returns {Promise<{success: boolean, path?: string}>}
   */
  async uploadFile(item, getContentType, extractMetadata) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      // Determine file extension
      const extension = this._getExtensionFromUri(item.uri);
      if (!extension) {
        throw new Error('Could not determine file extension');
      }

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(item.uri, {
        encoding: 'base64',
      });

      // Convert base64 to bytes
      const bytes = base64ToBytes(base64Data);

      // Upload file to Supabase Storage
      const filePath = `${item.id}${extension}`;
      const contentType = getContentType(extension);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, bytes, {
          contentType,
          upsert: true, // Overwrite if exists
        });

      if (error) {
        throw error;
      }

      // Store metadata as a JSON file
      const metadata = extractMetadata(item);
      const metadataPath = `${item.id}.json`;

      const { error: metaError } = await supabase.storage
        .from(this.bucketName)
        .upload(metadataPath, JSON.stringify(metadata), {
          contentType: 'application/json',
          upsert: true,
        });

      if (metaError) {
        console.warn('Error uploading metadata:', metaError);
      }

      return { success: true, path: data?.path };
    } catch (error) {
      console.error(`Error uploading to ${this.bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in Supabase Storage
   *
   * @param {string} itemId - Item ID
   * @param {string} extension - File extension (e.g., '.pdf', '.mp3')
   * @returns {Promise<boolean>}
   */
  async fileExists(itemId, extension) {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const filePath = `${itemId}${extension}`;
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list('', {
          search: filePath,
        });

      if (error) {
        // Handle "Bucket not found" gracefully
        if (error.message?.includes('Bucket not found')) {
          console.warn(`Bucket '${this.bucketName}' not found in Supabase`);
          return false;
        }
        return false;
      }

      return data?.some(file => file.name === filePath) || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sync a single item to Supabase (checks if already synced)
   *
   * @param {Object} item - Item to sync
   * @param {Function} getContentType - Function to determine content type
   * @param {Function} extractMetadata - Function to extract metadata
   * @returns {Promise<{success: boolean, skipped: boolean, error?: string}>}
   */
  async syncSingle(item, getContentType, extractMetadata) {
    try {
      const extension = this._getExtensionFromUri(item.uri);
      if (!extension) {
        return { success: false, error: 'Unknown file extension' };
      }

      const exists = await this.fileExists(item.id, extension);
      if (exists) {
        return { success: true, skipped: true };
      }

      await this.uploadFile(item, getContentType, extractMetadata);
      return { success: true, skipped: false };
    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync all items to Supabase
   *
   * @param {Array} items - Items to sync
   * @param {Function} getContentType - Function to determine content type
   * @param {Function} extractMetadata - Function to extract metadata
   * @returns {Promise<{success: boolean, synced: number, skipped: number, failed: number, total: number}>}
   */
  async syncAll(items, getContentType, extractMetadata) {
    if (!isSupabaseConfigured()) {
      return { success: false, reason: 'Supabase not configured' };
    }

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const result = await this.syncSingle(item, getContentType, extractMetadata);
        if (result.success) {
          if (result.skipped) {
            skipped++;
          } else {
            synced++;
          }
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }

    return {
      success: failed === 0,
      synced,
      skipped,
      failed,
      total: items.length,
    };
  }

  /**
   * Delete a file and its metadata from Supabase
   *
   * @param {string} itemId - Item ID
   * @param {string} extension - File extension
   * @returns {Promise<{success: boolean}>}
   */
  async deleteFile(itemId, extension) {
    if (!isSupabaseConfigured()) {
      return { success: false, reason: 'Supabase not configured' };
    }

    try {
      // Delete the main file
      const filePath = `${itemId}${extension}`;
      await supabase.storage.from(this.bucketName).remove([filePath]);

      // Delete metadata JSON
      const metadataPath = `${itemId}.json`;
      await supabase.storage.from(this.bucketName).remove([metadataPath]);

      return { success: true };
    } catch (error) {
      console.error(`Error deleting from ${this.bucketName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List all files in the bucket
   *
   * @returns {Promise<Array>}
   */
  async listFiles() {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase.storage.from(this.bucketName).list('');

      if (error) {
        if (error.message?.includes('Bucket not found')) {
          console.warn(`Bucket '${this.bucketName}' not found`);
          return [];
        }
        throw error;
      }

      // Filter out .json metadata files and .emptyFolderPlaceholder
      return (data || []).filter(
        file => !file.name.endsWith('.json') && file.name !== '.emptyFolderPlaceholder'
      );
    } catch (error) {
      console.error(`Error listing files in ${this.bucketName}:`, error);
      return [];
    }
  }

  /**
   * Download metadata for an item
   *
   * @param {string} itemId - Item ID
   * @returns {Promise<Object|null>}
   */
  async downloadMetadata(itemId) {
    try {
      // Create a signed URL for the metadata file
      const { data: urlData, error: urlError } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(`${itemId}.json`, 3600);

      if (urlError || !urlData?.signedUrl) {
        console.warn('Could not create signed URL for metadata:', urlError);
        return null;
      }

      // Fetch the JSON using the signed URL
      const response = await fetch(urlData.signedUrl);
      if (!response.ok) {
        console.warn('Failed to fetch metadata:', response.status);
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        return null;
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Error downloading metadata:', error);
      return null;
    }
  }

  /**
   * Download a file from Supabase and save locally
   *
   * @param {string} itemId - Item ID
   * @param {string} extension - File extension
   * @param {string} localDir - Local directory to save to
   * @returns {Promise<string|null>} Local file path or null on failure
   */
  async downloadFile(itemId, extension, localDir) {
    try {
      // Create a signed URL for downloading (valid for 1 hour)
      const { data: urlData, error: urlError } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(`${itemId}${extension}`, 3600);

      if (urlError) {
        throw urlError;
      }

      if (!urlData?.signedUrl) {
        throw new Error('Failed to create signed URL');
      }

      // Ensure directory exists
      await ensureDirectory(localDir);

      const localPath = `${localDir}${itemId}${extension}`;

      // Download file using expo-file-system
      const downloadResult = await FileSystem.downloadAsync(
        urlData.signedUrl,
        localPath
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        throw new Error('Downloaded file not found');
      }

      return localPath;
    } catch (error) {
      console.error(`Error downloading file ${itemId}:`, error);
      return null;
    }
  }

  /**
   * Restore a single item from Supabase
   *
   * @param {string} itemId - Item ID
   * @param {string} extension - File extension
   * @param {string} localDir - Local directory
   * @param {Function} checkLocalExists - Function to check if item already exists locally
   * @param {Function} createLocalItem - Function to create local item from metadata and file path
   * @returns {Promise<{success: boolean, skipped?: boolean, error?: string}>}
   */
  async restoreSingle(itemId, extension, localDir, checkLocalExists, createLocalItem) {
    try {
      // Check if already exists locally
      const exists = await checkLocalExists(itemId);
      if (exists) {
        return { success: true, skipped: true };
      }

      // Download metadata
      const metadata = await this.downloadMetadata(itemId);
      if (!metadata) {
        return { success: false, error: 'Failed to download metadata' };
      }

      // Download file
      const localPath = await this.downloadFile(itemId, extension, localDir);
      if (!localPath) {
        return { success: false, error: 'Failed to download file' };
      }

      // Create local item
      await createLocalItem(metadata, localPath);

      return { success: true, skipped: false };
    } catch (error) {
      console.error(`Error restoring item ${itemId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore all items from Supabase
   *
   * @param {string} localDir - Local directory
   * @param {Function} checkLocalExists - Function to check if item exists locally
   * @param {Function} createLocalItem - Function to create local item
   * @returns {Promise<{success: boolean, restored: number, skipped: number, failed: number, total: number}>}
   */
  async restoreAll(localDir, checkLocalExists, createLocalItem) {
    if (!isSupabaseConfigured()) {
      return { success: false, reason: 'Supabase not configured' };
    }

    const files = await this.listFiles();
    if (files.length === 0) {
      return { success: true, restored: 0, skipped: 0, failed: 0, total: 0 };
    }

    let restored = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of files) {
      try {
        // Extract ID and extension from filename
        const { id, extension } = this._parseFilename(file.name);
        if (!id || !extension) {
          console.warn(`Skipping invalid filename: ${file.name}`);
          continue;
        }

        const result = await this.restoreSingle(
          id,
          extension,
          localDir,
          checkLocalExists,
          createLocalItem
        );

        if (result.success) {
          if (result.skipped) {
            skipped++;
          } else {
            restored++;
          }
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.error(`Error restoring file ${file.name}:`, error);
      }
    }

    return {
      success: failed === 0,
      restored,
      skipped,
      failed,
      total: files.length,
    };
  }

  /**
   * Get file extension from URI
   * @private
   */
  _getExtensionFromUri(uri) {
    const match = uri.match(/\.([a-zA-Z0-9]+)$/);
    return match ? `.${match[1]}` : null;
  }

  /**
   * Parse filename into ID and extension
   * @private
   */
  _parseFilename(filename) {
    const match = filename.match(/^(.+)(\.[a-zA-Z0-9]+)$/);
    if (!match) {
      return { id: null, extension: null };
    }
    return { id: match[1], extension: match[2] };
  }
}
