/**
 * File system utilities for React Native/Expo
 */

import * as FileSystem from 'expo-file-system/legacy';

/**
 * Ensure a directory exists, creating it if necessary
 *
 * @param {string} path - Directory path to ensure
 * @returns {Promise<void>}
 */
export async function ensureDirectory(path) {
  try {
    const dirInfo = await FileSystem.getInfoAsync(path);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(path, { intermediates: true });
    }
  } catch (error) {
    // Directory may already exist due to race condition, ignore
    console.log('ensureDirectory: Directory creation skipped or already exists');
  }
}

/**
 * Check if a file or directory exists
 *
 * @param {string} path - Path to check
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
export async function fileExists(path) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch (error) {
    return false;
  }
}

/**
 * Get file information
 *
 * @param {string} path - Path to file or directory
 * @returns {Promise<Object|null>} File info object or null if not found
 */
export async function getFileInfo(path) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists ? info : null;
  } catch (error) {
    console.error('getFileInfo error:', error);
    return null;
  }
}

/**
 * Delete a file or directory
 *
 * @param {string} path - Path to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteFile(path) {
  try {
    const exists = await fileExists(path);
    if (exists) {
      await FileSystem.deleteAsync(path);
      return true;
    }
    return false;
  } catch (error) {
    console.error('deleteFile error:', error);
    return false;
  }
}

/**
 * Copy a file from source to destination
 *
 * @param {string} from - Source path
 * @param {string} to - Destination path
 * @returns {Promise<boolean>} True if copied successfully
 */
export async function copyFile(from, to) {
  try {
    await FileSystem.copyAsync({ from, to });
    return true;
  } catch (error) {
    console.error('copyFile error:', error);
    return false;
  }
}
