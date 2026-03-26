# ORION-002: Guitar Tuner

| Field         | Value                                    |
|---------------|------------------------------------------|
| **ID**        | ORION-002                                |
| **Type**      | Feature                                  |
| **Priority**  | Critical                                 |
| **Status**    | Done                                     |
| **Epic**      | Practice Tools                           |
| **Created**   | 2026-03-26                               |
| **Author**    | Sarthak                                  |
| **Assignee**  | Sarthak                                  |
| **Labels**    | `tuner`, `audio`, `pitch`, `core`, `mvp` |
| **Estimate**  | 8 story points                           |

---

## Summary

Real-time chromatic tuner with multi-instrument support, auto-detect, and visual feedback for tuning accuracy.

## Motivation / Why

A tuner is the most essential tool for any guitarist. Without it, the app is just a file viewer. This is the core value proposition — a reliable, fast tuner that works across instruments and tunings.

## User Stories

1. **As a guitarist**, I want to see how in-tune my string is in real-time so I can adjust accurately.
2. **As a multi-instrumentalist**, I want to switch between guitar, bass, and ukulele tunings.
3. **As a player**, I want auto-detect so I don't have to manually select which string I'm tuning.
4. **As a player**, I want haptic feedback when I hit the right pitch so I can feel it without staring at the screen.

## Detailed Description

### Pitch Detection

- **Native**: Use `react-native-pitchy` (ACF2+ algorithm) for real-time pitch detection via microphone.
- **Web**: Custom autocorrelation implementation via Web Audio API (`pitchDetection.js`).
- Smoothing: 5-reading median filter to reduce jitter.
- Stability: require 3 consecutive similar readings before confirming note.
- Harmonic filtering: detect 2x/3x/0.5x overtones and return fundamental frequency.

### Instrument & Tuning Support

| Instrument | Tunings |
|---|---|
| Guitar | Standard, Drop D, Half Step Down, Open G, DADGAD |
| Ukulele | Standard (GCEA), Low G, Baritone (DGBE) |
| Bass | Standard, Drop D, Half Step Down |

### Reference Frequency

- Options: 440 Hz (standard), 432 Hz, 442 Hz
- Configurable in Settings, persisted via TunerSettingsContext

### UI Components

1. **TunerMeter** — visual gauge showing cents deviation. Color-coded: green (in-tune), orange/red (flat/sharp).
2. **StringSelector** — buttons for each string showing note names. Highlights active/detected string.
3. **InstrumentSelector** — grid to switch instruments.
4. **TuningSelector** — segmented control for available tunings per instrument.

### Permissions

- Request microphone permission on first use.
- Show explanation if denied.
- Handle permission state gracefully.

## Acceptance Criteria

- [x] Real-time pitch detection from microphone input
- [x] Visual meter showing flat/in-tune/sharp with cents deviation
- [x] Support for Guitar, Ukulele, Bass instruments
- [x] Multiple tunings per instrument (Standard, Drop D, etc.)
- [x] Auto-detect string mode (identifies which string is being played)
- [x] Manual string selection via tap
- [x] Reference frequency options (440/432/442 Hz)
- [x] Haptic feedback when string is in tune
- [x] Pitch smoothing (median filter) to reduce jitter
- [x] Harmonic filtering to avoid octave errors
- [x] Works on both native (iOS/Android) and web
- [x] Microphone permission handling with graceful fallback
- [x] Volume visualization
- [x] Settings persist across sessions (instrument, tuning, reference Hz)

## Technical Notes

- Platform-specific pitch detection abstracted via `useTuner` hook
- `pitchUtils.js` handles frequency-to-note conversion, cents calculation
- `tunings.js` constants define all instruments, tunings, and note frequencies
- `TunerSettingsContext` manages persistent tuner preferences

## Files

- `src/screens/TunerScreen.js`
- `src/hooks/useTuner.js`
- `src/services/pitchDetection.js`
- `src/utils/pitchUtils.js`
- `src/constants/tunings.js`
- `src/context/TunerSettingsContext.js`
- `src/components/TunerMeter.js`
- `src/components/StringSelector.js`
- `src/components/InstrumentSelector.js`
- `src/components/TuningSelector.js`

## Subtasks

- [x] **ORION-002a**: Implement pitch detection (native + web)
- [x] **ORION-002b**: Build TunerMeter visual component
- [x] **ORION-002c**: Build StringSelector with auto-detect
- [x] **ORION-002d**: Build InstrumentSelector and TuningSelector
- [x] **ORION-002e**: Add harmonic filtering and pitch smoothing
- [x] **ORION-002f**: Add haptic feedback on in-tune
- [x] **ORION-002g**: Create TunerSettingsContext for persistence
- [x] **ORION-002h**: Handle microphone permissions
