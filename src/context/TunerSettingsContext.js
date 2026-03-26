import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const TUNER_SETTINGS_KEY = '@tuner_settings';

const defaultSettings = {
  defaultInstrument: 'guitar',
  tuningReference: 440, // Hz
  autoDetect: true,
  hapticFeedback: true,
};

const TunerSettingsContext = createContext(undefined);

export function TunerSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(TUNER_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading tuner settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(TUNER_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving tuner settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    await saveSettings(newSettings);
  };

  const setDefaultInstrument = (instrument) => updateSetting('defaultInstrument', instrument);
  const setTuningReference = (reference) => updateSetting('tuningReference', reference);
  const setAutoDetect = (enabled) => updateSetting('autoDetect', enabled);
  const setHapticFeedback = (enabled) => updateSetting('hapticFeedback', enabled);

  // Trigger haptic feedback when note is in tune
  const triggerInTuneHaptic = async () => {
    if (settings.hapticFeedback) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics might not be available on all devices
        console.warn('Haptic feedback not available:', error);
      }
    }
  };

  // Light haptic for string selection
  const triggerSelectionHaptic = async () => {
    if (settings.hapticFeedback) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
  };

  return (
    <TunerSettingsContext.Provider
      value={{
        ...settings,
        isLoading,
        setDefaultInstrument,
        setTuningReference,
        setAutoDetect,
        setHapticFeedback,
        triggerInTuneHaptic,
        triggerSelectionHaptic,
      }}
    >
      {children}
    </TunerSettingsContext.Provider>
  );
}

export function useTunerSettings() {
  const context = useContext(TunerSettingsContext);
  if (context === undefined) {
    throw new Error('useTunerSettings must be used within a TunerSettingsProvider');
  }
  return context;
}
