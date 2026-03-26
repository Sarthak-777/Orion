import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';

import { TunerMeter, StringSelector, InstrumentSelector, TuningSelector } from '../components';
import { useTuner } from '../hooks/useTuner';
import { useTheme } from '../context/ThemeContext';
import { useTunerSettings } from '../context/TunerSettingsContext';
import { INSTRUMENTS, TUNINGS } from '../constants/tunings';

// Metronome Component - Full Screen
function Metronome({ theme, isFocused }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatsPerMeasure] = useState(4);
  const intervalRef = useRef(null);
  const clickSoundRef = useRef(null);
  const accentSoundRef = useRef(null);

  // Load click sounds on mount
  useEffect(() => {
    loadSounds();
    return () => {
      cleanup();
    };
  }, []);

  const loadSounds = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: clickSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/click.wav'),
        { shouldPlay: false, volume: 0.8 }
      );
      clickSoundRef.current = clickSound;

      const { sound: accentSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/accent.wav'),
        { shouldPlay: false, volume: 1.0 }
      );
      accentSoundRef.current = accentSound;
    } catch (error) {
      console.error('Error loading metronome sounds:', error);
    }
  };

  const cleanup = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    try {
      if (clickSoundRef.current) {
        await clickSoundRef.current.unloadAsync();
      }
      if (accentSoundRef.current) {
        await accentSoundRef.current.unloadAsync();
      }
    } catch (error) {
      console.error('Error cleaning up sounds:', error);
    }
  };

  const playClick = useCallback(async (isAccent) => {
    try {
      const sound = isAccent ? accentSoundRef.current : clickSoundRef.current;
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing click:', error);
    }
  }, []);

  const startMetronome = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const intervalMs = (60 / bpm) * 1000;
    let beat = 0;

    // Play first beat immediately
    setCurrentBeat(1);
    playClick(true);

    intervalRef.current = setInterval(() => {
      beat = (beat % beatsPerMeasure) + 1;
      setCurrentBeat(beat);
      playClick(beat === 1);
    }, intervalMs);

    setIsPlaying(true);
  }, [bpm, beatsPerMeasure, playClick]);

  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
  }, []);

  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  // Restart metronome when BPM changes while playing
  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm]);

  // Stop metronome when leaving tab
  useEffect(() => {
    if (!isFocused && isPlaying) {
      stopMetronome();
    }
  }, [isFocused]);

  const adjustBpm = (delta) => {
    setBpm(prev => Math.max(40, Math.min(240, prev + delta)));
  };

  const styles = createMetronomeStyles(theme);

  return (
    <View style={styles.container}>
      {/* Large BPM Display */}
      <View style={styles.bpmSection}>
        <Text style={styles.bpmValue}>{bpm}</Text>
        <Text style={styles.bpmLabel}>BPM</Text>
      </View>

      {/* Beat Indicators */}
      <View style={styles.beatSection}>
        {Array.from({ length: beatsPerMeasure }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.beatDot,
              currentBeat === index + 1 && styles.beatDotActive,
              index === 0 && currentBeat === 1 && styles.beatDotAccent,
            ]}
          />
        ))}
      </View>

      {/* Play/Stop Button */}
      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playButtonActive]}
        onPress={toggleMetronome}
        activeOpacity={0.8}
      >
        {isPlaying ? (
          <View style={styles.stopIcon}>
            <View style={styles.stopBar} />
            <View style={styles.stopBar} />
          </View>
        ) : (
          <View style={styles.playIcon} />
        )}
      </TouchableOpacity>

      {/* BPM Controls */}
      <View style={styles.controlsSection}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => adjustBpm(-5)}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>-5</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => adjustBpm(-1)}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>-1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => adjustBpm(1)}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>+1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => adjustBpm(5)}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>+5</Text>
        </TouchableOpacity>
      </View>

      {/* Preset BPM buttons */}
      <View style={styles.presetsSection}>
        {[60, 80, 100, 120, 140].map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.presetButton, bpm === preset && styles.presetButtonActive]}
            onPress={() => setBpm(preset)}
            activeOpacity={0.7}
          >
            <Text style={[styles.presetText, bpm === preset && styles.presetTextActive]}>
              {preset}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createMetronomeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bpmSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  bpmValue: {
    fontSize: 96,
    fontWeight: '200',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -4,
  },
  bpmLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
    marginTop: -8,
    letterSpacing: 2,
  },
  beatSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  beatDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  beatDotActive: {
    backgroundColor: theme.colors.text,
    transform: [{ scale: 1.3 }],
  },
  beatDotAccent: {
    backgroundColor: theme.colors.text,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  playButtonActive: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 18,
    borderBottomWidth: 18,
    borderLeftWidth: 28,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: theme.colors.background,
    marginLeft: 6,
  },
  stopIcon: {
    flexDirection: 'row',
    gap: 10,
  },
  stopBar: {
    width: 10,
    height: 32,
    backgroundColor: theme.colors.text,
    borderRadius: 2,
  },
  controlsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  presetsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetButtonActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  presetTextActive: {
    color: theme.colors.background,
  },
});

export function TunerScreen() {
  const { theme, isDarkMode } = useTheme();
  const isFocused = useIsFocused();
  const {
    defaultInstrument,
    autoDetect,
    triggerInTuneHaptic,
    triggerSelectionHaptic,
  } = useTunerSettings();

  const [selectedInstrument, setSelectedInstrument] = useState(defaultInstrument);
  const [selectedTuning, setSelectedTuning] = useState('standard');
  const [selectedString, setSelectedString] = useState(null);
  const [activeMode, setActiveMode] = useState('tuner'); // 'tuner' or 'metronome'
  const lastHapticTime = useRef(0);
  const wasInTune = useRef(false);

  const styles = createStyles(theme);

  // Sync with default instrument when settings change
  useEffect(() => {
    setSelectedInstrument(defaultInstrument);
    setSelectedTuning('standard');
    setSelectedString(null);
  }, [defaultInstrument]);

  // Get current tuning configuration
  const currentTunings = TUNINGS[selectedInstrument] || [];
  const currentTuning = useMemo(
    () => currentTunings.find(t => t.id === selectedTuning) || currentTunings[0],
    [currentTunings, selectedTuning]
  );

  // Get target frequencies for the tuner
  const targetFrequencies = useMemo(
    () => currentTuning?.frequencies || [],
    [currentTuning]
  );

  // Initialize tuner hook
  const {
    isListening,
    hasPermission,
    currentFrequency,
    currentNote,
    cents,
    tuningStatus,
    closestString,
    volume,
    toggleListening,
    stopListening,
    requestPermission,
  } = useTuner(targetFrequencies);

  // Haptic feedback when note becomes in tune
  useEffect(() => {
    if (tuningStatus === 'in-tune' && isListening && currentFrequency) {
      const now = Date.now();
      // Only trigger haptic if we just became in-tune (not already in-tune)
      // and at least 500ms have passed since last haptic
      if (!wasInTune.current && now - lastHapticTime.current > 500) {
        triggerInTuneHaptic();
        lastHapticTime.current = now;
      }
      wasInTune.current = true;
    } else {
      wasInTune.current = false;
    }
  }, [tuningStatus, isListening, currentFrequency, triggerInTuneHaptic]);

  // Stop tuner when leaving tab
  useEffect(() => {
    if (!isFocused && isListening) {
      stopListening();
    }
  }, [isFocused]);

  // Handle instrument change
  const handleInstrumentChange = (instrumentId) => {
    triggerSelectionHaptic();
    setSelectedInstrument(instrumentId);
    setSelectedTuning('standard');
    setSelectedString(null);
  };

  // Handle tuning change
  const handleTuningChange = (tuningId) => {
    triggerSelectionHaptic();
    setSelectedTuning(tuningId);
    setSelectedString(null);
  };

  // Handle string selection
  const handleStringSelect = (stringIndex) => {
    triggerSelectionHaptic();
    setSelectedString(stringIndex);
  };

  // Get the active string (detected or selected based on autoDetect setting)
  const activeString = autoDetect
    ? (closestString?.stringIndex ?? selectedString)
    : selectedString;

  // Get display note and frequency
  const displayNote = currentNote?.fullNote || '--';
  const displayFrequency = currentFrequency ? `${currentFrequency.toFixed(1)} Hz` : '-- Hz';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Practice</Text>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, activeMode === 'tuner' && styles.modeButtonActive]}
          onPress={() => setActiveMode('tuner')}
        >
          <Text style={[styles.modeText, activeMode === 'tuner' && styles.modeTextActive]}>
            Tuner
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, activeMode === 'metronome' && styles.modeButtonActive]}
          onPress={() => setActiveMode('metronome')}
        >
          <Text style={[styles.modeText, activeMode === 'metronome' && styles.modeTextActive]}>
            Metronome
          </Text>
        </TouchableOpacity>
      </View>

      {activeMode === 'tuner' ? (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Instrument Selection */}
          <InstrumentSelector
            instruments={INSTRUMENTS}
            selectedId={selectedInstrument}
            onSelect={handleInstrumentChange}
            theme={theme}
          />

          {/* Tuning Selection */}
          <TuningSelector
            tunings={currentTunings}
            selectedId={selectedTuning}
            onSelect={handleTuningChange}
            theme={theme}
          />

          {/* Tuner Display */}
          <View style={styles.tunerDisplay}>
            {/* Volume indicator */}
            {isListening && (
              <View style={styles.volumeContainer}>
                <View style={[styles.volumeBar, { width: `${volume * 100}%` }]} />
              </View>
            )}

            {/* Meter */}
            <TunerMeter
              cents={cents}
              tuningStatus={tuningStatus}
              isActive={isListening && currentFrequency !== null}
              theme={theme}
            />

            {/* Note Display */}
            <Text style={[
              styles.currentNote,
              isListening && currentFrequency && styles.activeNote
            ]}>
              {displayNote}
            </Text>
            <Text style={styles.frequency}>{displayFrequency}</Text>
          </View>

          {/* String Selection */}
          <StringSelector
            notes={currentTuning?.notes || []}
            selectedString={selectedString}
            onSelectString={handleStringSelect}
            activeString={activeString}
            isListening={isListening}
            theme={theme}
          />

          {/* Permission message */}
          {hasPermission === false && (
            <View style={styles.permissionMessage}>
              <Text style={styles.permissionText}>
                Microphone access required
              </Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Start/Stop Button */}
          <TouchableOpacity
            style={[
              styles.startButton,
              isListening && styles.stopButton
            ]}
            onPress={toggleListening}
            activeOpacity={0.8}
          >
            <Text style={[styles.startButtonText, isListening && styles.stopButtonText]}>
              {isListening ? 'Stop' : 'Start Tuner'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <Metronome theme={theme} isFocused={isFocused} />
      )}
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: theme.colors.text,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  modeTextActive: {
    color: theme.colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  tunerDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  volumeContainer: {
    width: 180,
    height: 3,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  volumeBar: {
    height: '100%',
    backgroundColor: theme.colors.textMuted,
    borderRadius: 2,
  },
  currentNote: {
    fontSize: 64,
    fontWeight: '200',
    color: theme.colors.textMuted,
    marginTop: 8,
    letterSpacing: -2,
  },
  activeNote: {
    color: theme.colors.text,
    fontWeight: '300',
  },
  frequency: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontWeight: '400',
  },
  permissionMessage: {
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: theme.colors.warning,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  permissionButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: theme.colors.text,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  startButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  stopButtonText: {
    color: theme.colors.text,
  },
});
