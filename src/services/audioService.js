import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let recording = null;
let isRecording = false;

/**
 * Request microphone permissions
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export async function requestMicrophonePermission() {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
}

/**
 * Configure audio session for recording
 */
export async function configureAudioSession() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    return true;
  } catch (error) {
    console.error('Error configuring audio session:', error);
    return false;
  }
}

/**
 * Start recording audio
 * @returns {Promise<Audio.Recording|null>}
 */
export async function startRecording() {
  try {
    if (isRecording) {
      console.log('Already recording');
      return recording;
    }

    await configureAudioSession();

    const { recording: newRecording } = await Audio.Recording.createAsync({
      android: {
        extension: '.wav',
        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav',
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    });

    recording = newRecording;
    isRecording = true;

    return recording;
  } catch (error) {
    console.error('Error starting recording:', error);
    return null;
  }
}

/**
 * Stop recording audio
 * @returns {Promise<string|null>} - URI of the recorded file
 */
export async function stopRecording() {
  try {
    if (!recording || !isRecording) {
      return null;
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    recording = null;
    isRecording = false;

    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    return uri;
  } catch (error) {
    console.error('Error stopping recording:', error);
    recording = null;
    isRecording = false;
    return null;
  }
}

/**
 * Get current recording status
 * @returns {Promise<object|null>}
 */
export async function getRecordingStatus() {
  try {
    if (!recording) return null;
    return await recording.getStatusAsync();
  } catch (error) {
    console.error('Error getting recording status:', error);
    return null;
  }
}

/**
 * Check if currently recording
 * @returns {boolean}
 */
export function getIsRecording() {
  return isRecording;
}

/**
 * Get the sample rate used for recording
 * @returns {number}
 */
export function getSampleRate() {
  return 44100;
}
