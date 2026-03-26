import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { Audio } from 'expo-av';
import { detectPitch } from '../services/pitchDetection';
import { frequencyToNote, calculateCentsDeviation, getTuningStatus, findClosestString } from '../utils/pitchUtils';
import { getSampleRate } from '../services/audioService';

// Only import Pitchy on native platforms
let Pitchy = null;
if (Platform.OS !== 'web') {
  Pitchy = require('react-native-pitchy').default;
}

const BUFFER_SIZE = 4096;
const UPDATE_INTERVAL = 50; // ms between pitch updates
const SMOOTHING_WINDOW = 5; // Number of readings to average
const STABILITY_THRESHOLD = 3; // Consecutive similar readings needed

// Helper to check if two frequencies are within a semitone
const areFrequenciesClose = (f1, f2, cents = 100) => {
  if (!f1 || !f2) return false;
  const ratio = f1 / f2;
  const centsDiff = Math.abs(1200 * Math.log2(ratio));
  return centsDiff <= cents;
};

// Find the best matching frequency considering harmonics
const findBestMatch = (detectedFreq, targetFrequencies) => {
  if (!detectedFreq || targetFrequencies.length === 0) return detectedFreq;

  // Check if detected frequency is close to any target
  for (const target of targetFrequencies) {
    if (areFrequenciesClose(detectedFreq, target, 200)) {
      return detectedFreq; // Already close to a target
    }
  }

  // Check if it might be a harmonic (2x or 3x) of a target
  for (const target of targetFrequencies) {
    // Check if detected is ~2x target (first harmonic)
    if (areFrequenciesClose(detectedFreq, target * 2, 100)) {
      return target; // Return fundamental instead of harmonic
    }
    // Check if detected is ~3x target (second harmonic)
    if (areFrequenciesClose(detectedFreq, target * 3, 100)) {
      return target;
    }
    // Check if detected is ~0.5x target (subharmonic/octave down)
    if (areFrequenciesClose(detectedFreq, target / 2, 100)) {
      return target;
    }
  }

  return detectedFreq;
};

export function useTuner(targetFrequencies = []) {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [currentFrequency, setCurrentFrequency] = useState(null);
  const [currentNote, setCurrentNote] = useState(null);
  const [cents, setCents] = useState(0);
  const [tuningStatus, setTuningStatus] = useState('flat');
  const [closestString, setClosestString] = useState(null);
  const [volume, setVolume] = useState(0);

  const recordingRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const pitchySubscriptionRef = useRef(null);

  // Smoothing refs
  const frequencyHistoryRef = useRef([]);
  const lastStableFrequencyRef = useRef(null);
  const stabilityCountRef = useRef(0);

  // Request permissions
  const requestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // Web uses getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        return true;
      } else if (Platform.OS === 'android') {
        // Android needs explicit RECORD_AUDIO permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for tuning.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(isGranted);
        return isGranted;
      } else {
        // iOS uses expo-av for permission request
        const { status } = await Audio.requestPermissionsAsync();
        const granted = status === 'granted';
        setHasPermission(granted);
        return granted;
      }
    } catch (error) {
      console.error('Permission error:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Start listening for web platform
  const startWebListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = BUFFER_SIZE * 2;

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const buffer = new Float32Array(BUFFER_SIZE);
      const sampleRate = audioContextRef.current.sampleRate;

      intervalRef.current = setInterval(() => {
        analyserRef.current.getFloatTimeDomainData(buffer);

        // Calculate volume (RMS)
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sum / buffer.length);
        setVolume(Math.min(rms * 5, 1)); // Normalize to 0-1

        // Detect pitch
        const rawFrequency = detectPitch(buffer, sampleRate);

        if (rawFrequency) {
          // Process with smoothing and harmonic correction
          const frequency = processFrequency(rawFrequency, targetFrequencies);

          if (frequency) {
            setCurrentFrequency(Math.round(frequency * 10) / 10);

            const noteInfo = frequencyToNote(frequency);
            if (noteInfo) {
              setCurrentNote(noteInfo);
            }

            // If we have target frequencies, find closest string
            if (targetFrequencies.length > 0) {
              const closest = findClosestString(frequency, targetFrequencies);
              if (closest) {
                setClosestString(closest);
                setCents(closest.cents);
                setTuningStatus(closest.status);
              }
            } else if (noteInfo) {
              setCents(noteInfo.cents);
              setTuningStatus(getTuningStatus(noteInfo.cents));
            }
          }
        }
      }, UPDATE_INTERVAL);

      setIsListening(true);
      return true;
    } catch (error) {
      console.error('Error starting web audio:', error);
      return false;
    }
  }, [targetFrequencies, processFrequency]);

  // Stop listening for web platform
  const stopWebListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
    setCurrentFrequency(null);
    setCurrentNote(null);
    setCents(0);
    setVolume(0);

    // Reset smoothing state
    frequencyHistoryRef.current = [];
    lastStableFrequencyRef.current = null;
    stabilityCountRef.current = 0;
  }, []);

  // Store target frequencies in a ref so Pitchy callback can access latest values
  const targetFrequenciesRef = useRef(targetFrequencies);
  useEffect(() => {
    targetFrequenciesRef.current = targetFrequencies;
  }, [targetFrequencies]);

  // Process detected frequency with smoothing and harmonic filtering
  const processFrequency = useCallback((rawFrequency, targets) => {
    if (!rawFrequency || rawFrequency <= 0) return null;

    // Apply harmonic correction if we have target frequencies
    const correctedFreq = targets.length > 0
      ? findBestMatch(rawFrequency, targets)
      : rawFrequency;

    // Add to history for smoothing
    frequencyHistoryRef.current.push(correctedFreq);
    if (frequencyHistoryRef.current.length > SMOOTHING_WINDOW) {
      frequencyHistoryRef.current.shift();
    }

    // Calculate median (more robust than mean for pitch)
    const sorted = [...frequencyHistoryRef.current].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Check stability - is this reading consistent with recent readings?
    if (areFrequenciesClose(median, lastStableFrequencyRef.current, 50)) {
      stabilityCountRef.current++;
    } else {
      stabilityCountRef.current = 1;
      lastStableFrequencyRef.current = median;
    }

    // Only return frequency if we have stable readings
    if (stabilityCountRef.current >= STABILITY_THRESHOLD || frequencyHistoryRef.current.length < STABILITY_THRESHOLD) {
      return median;
    }

    // Return last stable frequency while waiting for new stability
    return lastStableFrequencyRef.current || median;
  }, []);

  // Start listening for native platforms using Pitchy
  const startNativeListening = useCallback(async () => {
    try {
      if (!Pitchy) {
        console.error('Pitchy not available');
        return false;
      }

      // Initialize Pitchy with configuration
      Pitchy.init({
        bufferSize: BUFFER_SIZE,
        minVolume: -60, // Volume threshold in dB
        algorithm: 'ACF2+', // Autocorrelation algorithm
      });

      // Add listener for pitch detection events
      pitchySubscriptionRef.current = Pitchy.addListener((data) => {
        const rawFrequency = data.pitch;

        if (rawFrequency && rawFrequency > 0) {
          setVolume(Math.min(Math.abs(data.volume || -60) / 60, 1)); // Normalize volume

          // Process with smoothing and harmonic correction
          const targets = targetFrequenciesRef.current;
          const frequency = processFrequency(rawFrequency, targets);

          if (frequency) {
            setCurrentFrequency(Math.round(frequency * 10) / 10);

            const noteInfo = frequencyToNote(frequency);
            if (noteInfo) {
              setCurrentNote(noteInfo);
            }

            // If we have target frequencies, find closest string
            if (targets.length > 0) {
              const closest = findClosestString(frequency, targets);
              if (closest) {
                setClosestString(closest);
                setCents(closest.cents);
                setTuningStatus(closest.status);
              }
            } else if (noteInfo) {
              setCents(noteInfo.cents);
              setTuningStatus(getTuningStatus(noteInfo.cents));
            }
          }
        }
      });

      // Start pitch detection
      await Pitchy.start();
      setIsListening(true);
      return true;
    } catch (error) {
      console.error('Error starting native pitch detection:', error);
      return false;
    }
  }, [processFrequency]);

  // Stop listening for native platforms
  const stopNativeListening = useCallback(async () => {
    const hadSubscription = pitchySubscriptionRef.current !== null;

    try {
      if (pitchySubscriptionRef.current) {
        pitchySubscriptionRef.current.remove();
        pitchySubscriptionRef.current = null;
      }

      // Only call Pitchy.stop() if we had an active subscription
      if (Pitchy && hadSubscription) {
        try {
          await Pitchy.stop();
        } catch {
          // Ignore "Not recording" errors
        }
      }
    } catch {
      // Silently handle errors
    }

    setIsListening(false);
    setCurrentFrequency(null);
    setCurrentNote(null);
    setCents(0);
    setVolume(0);

    // Reset smoothing state
    frequencyHistoryRef.current = [];
    lastStableFrequencyRef.current = null;
    stabilityCountRef.current = 0;
  }, []);

  // Start listening (main entry point)
  const startListening = useCallback(async () => {
    if (isListening) return;

    const permitted = hasPermission ?? await requestPermission();
    if (!permitted) {
      console.log('Microphone permission denied');
      return false;
    }

    if (Platform.OS === 'web') {
      return startWebListening();
    } else {
      return startNativeListening();
    }
  }, [isListening, hasPermission, requestPermission, startWebListening, startNativeListening]);

  // Stop listening
  const stopListening = useCallback(async () => {
    if (Platform.OS === 'web') {
      stopWebListening();
    } else {
      await stopNativeListening();
    }
  }, [stopWebListening, stopNativeListening]);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web') {
        stopWebListening();
      } else {
        stopNativeListening();
      }
    };
  }, [stopWebListening, stopNativeListening]);

  // Update when target frequencies change
  useEffect(() => {
    if (currentFrequency && targetFrequencies.length > 0) {
      const closest = findClosestString(currentFrequency, targetFrequencies);
      if (closest) {
        setClosestString(closest);
        setCents(closest.cents);
        setTuningStatus(closest.status);
      }
    }
  }, [targetFrequencies, currentFrequency]);

  return {
    isListening,
    hasPermission,
    currentFrequency,
    currentNote,
    cents,
    tuningStatus,
    closestString,
    volume,
    requestPermission,
    startListening,
    stopListening,
    toggleListening,
  };
}
