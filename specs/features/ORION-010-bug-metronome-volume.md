# ORION-010: Metronome Sound Too Quiet

| Field         | Value                                  |
|---------------|----------------------------------------|
| **ID**        | ORION-010                              |
| **Type**      | Bug                                    |
| **Priority**  | Medium                                 |
| **Status**    | Open                                   |
| **Epic**      | Practice Tools                         |
| **Created**   | 2026-03-26                             |
| **Reporter**  | Sarthak                                |
| **Assignee**  | Unassigned                             |
| **Labels**    | `bug`, `metronome`, `audio`            |
| **Severity**  | Medium                                 |

---

## Summary

Metronome click and accent sounds are too quiet, making them hard to hear during practice — especially when playing an instrument alongside it.

## Steps to Reproduce

1. Open the Practice screen
2. Start the metronome at any BPM
3. Play guitar or another instrument alongside it
4. Observe: metronome clicks are barely audible over the instrument

## Expected Behavior

Metronome clicks should be loud and punchy enough to be heard clearly while playing an instrument at moderate volume, even without headphones.

## Actual Behavior

Metronome click and accent sounds are too quiet. They get drowned out by even light strumming.

## Environment

- Expo SDK 54, React Native 0.81.5
- expo-av for audio playback
- Tested on: _[to be filled — iOS simulator / physical device / Android]_

## Root Cause Analysis

_To be investigated. Possible causes:_

1. **Sound file volume**: The click/accent audio assets may be recorded at low volume levels.
2. **expo-av volume setting**: Sound objects may not have volume set to max (1.0).
3. **Audio mode config**: `expo-av` Audio mode settings (e.g., `playsInSilentModeIOS`, `staysActiveInBackground`) may affect perceived volume.
4. **Audio ducking**: If volume ducking is enabled, the system may lower metronome volume when other audio (tuner mic input) is active.
5. **Sound file format**: Compressed formats may lose dynamic range.

## Proposed Fix

_To be determined after investigation. Possible approaches:_

- [ ] Check and normalize click/accent sound file levels (re-export louder)
- [ ] Ensure `volume: 1.0` is explicitly set on Sound objects
- [ ] Review Audio mode configuration for volume-affecting settings
- [ ] Add user-facing volume control for the metronome
- [ ] Test if audio ducking from tuner mic input is reducing volume

## Acceptance Criteria

- [ ] Metronome clicks are clearly audible while playing an acoustic guitar at moderate volume
- [ ] Accent (beat 1) is noticeably louder than regular clicks
- [ ] Volume is consistent across iOS and Android
- [ ] No audio clipping or distortion at max volume
- [ ] No regression to tuner pitch detection or other audio features

## Related Files

- `src/screens/TunerScreen.js` (metronome logic)
- `src/services/audioService.js` (sound loading/playback)
- Audio assets (click + accent sound files)

## Related Tickets

- ORION-003 (Metronome feature)
