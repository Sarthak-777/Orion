import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase, isSupabaseConfigured } from '../config/supabase';

// Supabase free tier has 1GB storage
const FREE_TIER_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1GB

export function CloudStorageIndicator({ theme, isEnabled }) {
  const [usedBytes, setUsedBytes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isEnabled && isSupabaseConfigured()) {
      fetchStorageUsage();
    }
  }, [isEnabled]);

  const fetchStorageUsage = async () => {
    setIsLoading(true);
    try {
      // Get all files from tabs bucket
      const { data: tabsData } = await supabase.storage
        .from('tabs')
        .list('');

      // Get all files from music bucket
      const { data: musicData } = await supabase.storage
        .from('music')
        .list('').catch(() => ({ data: [] }));

      // Get all files from voice_memos bucket
      const { data: memosData } = await supabase.storage
        .from('voice_memos')
        .list('').catch(() => ({ data: [] }));

      // Calculate total size
      let totalSize = 0;

      if (tabsData) {
        totalSize += tabsData.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      }
      if (musicData) {
        totalSize += musicData.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      }
      if (memosData) {
        totalSize += memosData.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      }

      setUsedBytes(totalSize);
    } catch (error) {
      console.error('Error fetching storage usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = (usedBytes / FREE_TIER_STORAGE_BYTES) * 100;
  const remaining = FREE_TIER_STORAGE_BYTES - usedBytes;

  if (!isEnabled) {
    return null;
  }

  const styles = createStyles(theme, usagePercent);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Cloud Storage</Text>
        <Text style={styles.usage}>
          {isLoading ? 'Loading...' : `${formatBytes(remaining)} free`}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(usagePercent, 100)}%` }]} />
      </View>
      <Text style={styles.details}>
        {formatBytes(usedBytes)} / {formatBytes(FREE_TIER_STORAGE_BYTES)} used
      </Text>
    </View>
  );
}

const createStyles = (theme, usagePercent) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  usage: {
    fontSize: 12,
    color: usagePercent > 80 ? theme.colors.tunerOrange : theme.colors.tunerGreen,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: usagePercent > 80 ? theme.colors.tunerOrange : theme.colors.tunerGreen,
    borderRadius: 3,
  },
  details: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

export default CloudStorageIndicator;
