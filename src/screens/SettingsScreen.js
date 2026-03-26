import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useSync } from '../context/SyncContext';
import { useToast } from '../context/ToastContext';
import { useUserProfile } from '../context/UserProfileContext';
import { useTunerSettings } from '../context/TunerSettingsContext';

const INSTRUMENTS = [
  { id: 'guitar', name: 'Guitar' },
  { id: 'ukulele', name: 'Ukulele' },
  { id: 'bass', name: 'Bass' },
];

const TUNING_REFERENCE = [
  { id: 440, name: '440 Hz' },
  { id: 432, name: '432 Hz' },
  { id: 442, name: '442 Hz' },
];

export function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { displayName, updateDisplayName, isLoading: profileLoading } = useUserProfile();
  const {
    isEnabled: syncEnabled,
    isSyncing,
    lastSync,
    autoSync,
    isInitialized,
    toggleSync,
    toggleAutoSync,
    performSync,
    performRestore,
    resetSync,
  } = useSync();

  const {
    defaultInstrument,
    tuningReference,
    autoDetect,
    hapticFeedback,
    setDefaultInstrument,
    setTuningReference,
    setAutoDetect,
    setHapticFeedback,
  } = useTunerSettings();

  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    setNameInput(displayName || '');
  }, [displayName]);

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      showToast('Please enter a name', 'warning');
      return;
    }
    const result = await updateDisplayName(nameInput);
    if (result.success) {
      showToast('Name saved', 'success');
      setIsEditingName(false);
    } else {
      showToast('Failed to save name', 'error');
    }
  };

  const styles = createStyles(theme);

  const handleManualSync = async () => {
    const result = await performSync();
    if (result.success) {
      showToast(`Synced ${result.synced} tabs to cloud`, 'success');
    } else {
      showToast(result.reason || 'Sync failed', 'error');
    }
  };

  const handleRestore = async () => {
    const result = await performRestore();
    if (result.success) {
      showToast(`Restored ${result.restored} tabs from cloud`, 'success');
    } else {
      showToast(result.reason || 'Restore failed', 'error');
    }
  };

  const handleResetSync = async () => {
    await resetSync();
    showToast('Sync settings reset', 'success');
  };

  const formatLastSync = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const ToggleRow = ({ label, description, value, onToggle, disabled }) => (
    <View style={[styles.toggleRow, disabled && styles.rowDisabled]}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.settingLabel, disabled && styles.textDisabled]}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: theme.colors.accent, true: theme.colors.textMuted }}
        thumbColor={theme.colors.text}
        ios_backgroundColor={theme.colors.accent}
      />
    </View>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <SectionHeader title="Profile" />
        <View style={styles.section}>
          {profileLoading ? (
            <View style={styles.initializingRow}>
              <ActivityIndicator size="small" color={theme.colors.text} />
              <Text style={styles.initializingText}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.profileRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                {isEditingName ? (
                  <View style={styles.nameEditContainer}>
                    <TextInput
                      style={styles.nameInput}
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="Enter your name"
                      placeholderTextColor={theme.colors.textMuted}
                      autoFocus
                      maxLength={30}
                    />
                    <View style={styles.nameEditButtons}>
                      <TouchableOpacity
                        style={styles.nameEditButton}
                        onPress={() => {
                          setNameInput(displayName || '');
                          setIsEditingName(false);
                        }}
                      >
                        <Text style={styles.nameEditButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.nameEditButton, styles.nameEditButtonPrimary]}
                        onPress={handleSaveName}
                      >
                        <Text style={[styles.nameEditButtonText, styles.nameEditButtonTextPrimary]}>
                          Save
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setIsEditingName(true)}>
                    <Text style={styles.profileName}>
                      {displayName || 'Tap to set your name'}
                    </Text>
                    <Text style={styles.profileHint}>
                      {displayName ? 'Tap to edit' : 'Your name will appear on voice memos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={styles.section}>
          <ToggleRow
            label="Dark mode"
            value={isDarkMode}
            onToggle={toggleTheme}
          />
        </View>

        {/* Tuner Settings */}
        <SectionHeader title="Tuner" />
        <View style={styles.section}>
          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Default instrument</Text>
            <View style={styles.optionButtons}>
              {INSTRUMENTS.map((inst) => (
                <TouchableOpacity
                  key={inst.id}
                  style={[
                    styles.optionButton,
                    defaultInstrument === inst.id && styles.optionButtonActive,
                  ]}
                  onPress={() => setDefaultInstrument(inst.id)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      defaultInstrument === inst.id && styles.optionButtonTextActive,
                    ]}
                  >
                    {inst.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Reference pitch (A4)</Text>
            <View style={styles.optionButtons}>
              {TUNING_REFERENCE.map((ref) => (
                <TouchableOpacity
                  key={ref.id}
                  style={[
                    styles.optionButton,
                    tuningReference === ref.id && styles.optionButtonActive,
                  ]}
                  onPress={() => setTuningReference(ref.id)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      tuningReference === ref.id && styles.optionButtonTextActive,
                    ]}
                  >
                    {ref.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <ToggleRow
            label="Auto-detect string"
            description="Automatically identify which string is playing"
            value={autoDetect}
            onToggle={setAutoDetect}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Haptic feedback"
            description="Vibrate when note is in tune"
            value={hapticFeedback}
            onToggle={setHapticFeedback}
          />
        </View>

        {/* Cloud Sync */}
        <SectionHeader title="Cloud Sync" />
        <View style={styles.section}>
          {!isInitialized ? (
            <View style={styles.initializingRow}>
              <ActivityIndicator size="small" color={theme.colors.text} />
              <Text style={styles.initializingText}>Initializing...</Text>
            </View>
          ) : (
            <>
              <ToggleRow
                label="Enable cloud sync"
                description="Backup your tabs to cloud storage"
                value={syncEnabled}
                onToggle={toggleSync}
              />
              {syncEnabled && (
                <>
                  <View style={styles.divider} />
                  <ToggleRow
                    label="Auto-sync on open"
                    description="Sync when app starts"
                    value={autoSync}
                    onToggle={toggleAutoSync}
                  />
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.syncNowRow}
                    onPress={handleManualSync}
                    disabled={isSyncing}
                  >
                    <View style={styles.syncNowInfo}>
                      <Text style={styles.settingLabel}>
                        {isSyncing ? 'Syncing...' : 'Sync now'}
                      </Text>
                      <Text style={styles.lastSyncText}>
                        Last sync: {formatLastSync(lastSync)}
                      </Text>
                    </View>
                    {isSyncing && <ActivityIndicator size="small" color={theme.colors.text} />}
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.syncNowRow}
                    onPress={handleRestore}
                    disabled={isSyncing}
                  >
                    <View style={styles.syncNowInfo}>
                      <Text style={styles.settingLabel}>
                        {isSyncing ? 'Restoring...' : 'Restore from cloud'}
                      </Text>
                      <Text style={styles.lastSyncText}>
                        Download tabs from cloud storage
                      </Text>
                    </View>
                    {isSyncing && <ActivityIndicator size="small" color={theme.colors.text} />}
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.divider} />
              <TouchableOpacity style={styles.resetRow} onPress={handleResetSync}>
                <Text style={styles.resetText}>Reset sync settings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.section}>
          <View style={styles.aboutRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValueText}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Orion - Guitar Tabs & Tuner</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  settingLabel: {
    fontSize: 15,
    color: theme.colors.text,
  },
  settingValueText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 16,
  },
  optionGroup: {
    padding: 16,
  },
  optionLabel: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 12,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionButtonActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  optionButtonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: theme.colors.background,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  // Cloud Sync styles
  initializingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  initializingText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  syncNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  syncNowInfo: {
    flex: 1,
  },
  lastSyncText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  resetRow: {
    padding: 16,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  // Profile styles
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.tunerGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  profileHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  nameEditContainer: {
    flex: 1,
  },
  nameInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  nameEditButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  nameEditButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nameEditButtonPrimary: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  nameEditButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  nameEditButtonTextPrimary: {
    color: theme.colors.background,
  },
});
