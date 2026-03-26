# Audio System

## Overview

Orion has four audio subsystems: pitch detection (tuner), metronome, music playback with speed control, and voice memo recording. Each uses different underlying APIs.

## Pitch Detection (Tuner)

### Platform Implementations

| Platform | Library | Algorithm |
|----------|---------|-----------|
| iOS/Android | `react-native-pitchy` | ACF2+ (autocorrelation) |
| Web | Custom `pitchDetection.js` | Autocorrelation via Web Audio API |

### Hook: `useTuner`

**File**: `src/hooks/useTuner.js`

The primary interface for tuner functionality. Abstracts platform differences.

**Returns**:
- `isListening` — whether mic is active
- `hasPermission` — mic permission status
- `currentFrequency` — detected frequency in Hz
- `currentNote` — note name (e.g., "E4")
- `cents` — deviation from nearest note (-50 to +50)
- `tuningStatus` — `'in_tune'` | `'flat'` | `'sharp'`
- `closestString` — nearest string for current instrument/tuning
- `volume` — input signal level

**Methods**:
- `toggleListening()` — start/stop pitch detection
- `stopListening()` — stop only
- `requestPermission()` — request mic access

### Signal Processing Pipeline

```
Raw Audio Buffer
  -> Pitch Detection (ACF2+ or autocorrelation)
    -> Harmonic Filtering (detect octaves at 2x, 3x, 0.5x; return fundamental)
      -> Median Filter (5-reading window)
        -> Stability Check (3 consecutive readings within threshold)
          -> Note Calculation (frequency -> note + cents)
```

### Harmonic Filtering

Guitar strings produce harmonics at integer multiples of the fundamental. The tuner detects when the reported frequency is likely an overtone and corrects:

- If detected frequency is ~2x a target → return half (octave down)
- If detected frequency is ~3x a target → return third
- If detected frequency is ~0.5x a target → return double (subharmonic)

### Pitch Smoothing

Two stages reduce jitter from noisy audio:

1. **Median filter**: Keeps a 5-reading buffer, returns the median. Eliminates outlier spikes.
2. **Stability threshold**: Only updates the displayed note when 3 consecutive readings agree within a tolerance. Prevents rapid flickering between notes.

### Tuning Reference

Default A4 = 440 Hz. Configurable in TunerSettingsContext (e.g., 432 Hz or 442 Hz for orchestral tuning).

## Pitch Utilities

**File**: `src/utils/pitchUtils.js`

- `frequencyToNote(freq)` — converts Hz to `{ note, octave, fullNote, exactFrequency, cents }`
- `calculateCentsDeviation(detected, target)` — returns cents offset (100 cents = 1 semitone)
- `getTuningStatus(cents, threshold)` — `'in_tune'` if |cents| <= threshold (default 5)
- `findClosestString(freq, targetStrings)` — matches frequency to nearest string by cents distance

## Metronome

Built into TunerScreen via mode toggle (Tuner | Metronome).

### Implementation
- Uses `expo-av` to play click sounds
- Sound assets: `assets/sounds/click.wav` (normal beat), `assets/sounds/accent.wav` (downbeat)
- BPM range: 40–240
- Controls: +/-1, +/-5, preset buttons (60, 80, 100, 120, 140)
- Visual beat indicators highlight on each beat

### Timing
Uses `setInterval` with BPM-derived interval: `60000 / bpm` ms.

## Music Playback

**File**: `src/services/audioPlaybackService.js`

### Features
- Play/pause/stop audio files
- Speed control: 0.5x to 1.0x (pitch-corrected)
- Progress tracking with callbacks

### Speed Control

```js
sound.setRateAsync(speed, true);
//                  ^rate  ^shouldCorrectPitch
```

The second parameter (`true`) enables pitch correction — slowing down audio doesn't lower its pitch. Essential for practice: you can slow a song to 50% speed while keeping it in the correct key.

### API

```js
playMusic(uri, musicId, statusCallback)
stopMusic()
setPlaybackSpeed(speed)  // 0.5 to 1.0
```

The `statusCallback` receives playback position updates for progress bar rendering.

## Voice Memo Recording

**File**: `src/services/audioService.js`

### Audio Mode Setup
```js
Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
});
```

### Recording Flow
1. Request microphone permission
2. Configure audio mode (recording enabled)
3. Create recording instance via `Audio.Recording`
4. Start recording → user presses stop
5. Save to `documents/voice_memos/` via `FileSystem`
6. Store metadata in AsyncStorage (`@voice_memos`)

### Playback
Voice memo playback uses the same `expo-av` Audio API. No speed control for memos (only for music).

## Instruments & Tunings

**File**: `src/constants/tunings.js`

### Supported Instruments

| Instrument | Strings | Default Tuning |
|-----------|---------|---------------|
| Guitar | 6 | E2 A2 D3 G3 B3 E4 (Standard) |
| Ukulele | 4 | G4 C4 E4 A4 (Standard GCEA) |
| Bass | 4 | E1 A1 D2 G2 (Standard) |

### Tuning Presets

**Guitar**: Standard, Drop D, Half Step Down, Open G, DADGAD
**Ukulele**: Standard (GCEA), Low G, Baritone
**Bass**: Standard, Drop D, 5-String

Each tuning defines `notes[]` (display names) and `frequencies[]` (target Hz values).

### Note Frequency Table

`NOTE_FREQUENCIES` maps every chromatic note from C0 to B5 to its exact frequency in Hz. Used by `frequencyToNote()` for general pitch-to-note conversion.

## Permissions

| Platform | Permission | Usage |
|----------|-----------|-------|
| iOS | Microphone | Tuner pitch detection, voice memo recording |
| Android | `RECORD_AUDIO` | Same |
| Web | `getUserMedia` | Same |

Permission is requested on first use (when user taps "Start" on tuner or "Record" on memos).
