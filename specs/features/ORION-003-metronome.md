# ORION-003: Metronome

| Field         | Value                                 |
|---------------|---------------------------------------|
| **ID**        | ORION-003                             |
| **Type**      | Feature                               |
| **Priority**  | High                                  |
| **Status**    | Done                                  |
| **Epic**      | Practice Tools                        |
| **Created**   | 2026-03-26                            |
| **Author**    | Sarthak                               |
| **Assignee**  | Sarthak                               |
| **Labels**    | `metronome`, `audio`, `core`, `mvp`   |
| **Estimate**  | 5 story points                        |

---

## Summary

Built-in metronome with adjustable BPM, visual beat indicators, accent sounds, and preset tempos — embedded in the Practice screen alongside the tuner.

## Motivation / Why

Practicing with a metronome is fundamental to building timing and rhythm. Having it built into the practice screen means users don't need a separate app — they can tune up and start practicing with a click track in one place.

## User Stories

1. **As a guitarist**, I want a metronome so I can practice timing.
2. **As a player**, I want to adjust BPM precisely (±1) and quickly (±5) so I can dial in any tempo.
3. **As a player**, I want visual beat indicators so I can see the beat even with headphones off.
4. **As a player**, I want preset tempos so I can jump to common practice speeds.

## Detailed Description

### Tempo Controls

- BPM range: 40–240
- Fine adjustment: ±1 BPM buttons
- Coarse adjustment: ±5 BPM buttons
- Preset buttons: 60, 80, 100, 120, 140 BPM
- Display current BPM prominently

### Beat System

- 4/4 time signature
- Visual beat indicators (4 dots/circles) that light up on each beat
- Beat 1 plays accent sound, beats 2-3-4 play click sound
- Animated play/stop button

### Audio

- Click sound + accent sound (beat 1)
- Background audio support (plays when app is backgrounded)
- Auto-stop when navigating away from Practice tab

## Acceptance Criteria

- [x] Play/stop toggle with animated button
- [x] BPM adjustable from 40 to 240
- [x] ±1 and ±5 BPM adjustment buttons
- [x] Preset BPM buttons (60, 80, 100, 120, 140)
- [x] Visual beat indicators (4 beats, highlight on current beat)
- [x] Accent on beat 1, regular click on beats 2-4
- [x] Audio continues in background
- [x] Auto-stops when leaving Practice tab
- [x] BPM display is large and readable

## Technical Notes

- Uses `expo-av` for sound playback
- Metronome logic lives in `TunerScreen.js` (co-located with tuner)
- Interval-based timing with `setInterval`
- Sound objects preloaded for low-latency playback

## Files

- `src/screens/TunerScreen.js` (metronome section)
- `src/services/audioService.js` (sound loading/playback)

## Subtasks

- [x] **ORION-003a**: Implement metronome timing engine with interval
- [x] **ORION-003b**: Add click + accent sound playback
- [x] **ORION-003c**: Build BPM controls (±1, ±5, presets)
- [x] **ORION-003d**: Build visual beat indicators
- [x] **ORION-003e**: Add play/stop animated button
- [x] **ORION-003f**: Handle background audio and tab-switch cleanup
