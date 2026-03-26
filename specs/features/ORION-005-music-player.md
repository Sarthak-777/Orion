# ORION-005: Music Player with Speed Control

| Field         | Value                                          |
|---------------|-------------------------------------------------|
| **ID**        | ORION-005                                       |
| **Type**      | Feature                                         |
| **Priority**  | High                                            |
| **Status**    | Done                                            |
| **Epic**      | Library                                         |
| **Created**   | 2026-03-26                                      |
| **Author**    | Sarthak                                         |
| **Assignee**  | Sarthak                                         |
| **Labels**    | `library`, `music`, `audio`, `playback`, `mvp`  |
| **Estimate**  | 8 story points                                  |

---

## Summary

Audio player for imported music files with pitch-corrected slow-down (0.25x–1.0x), waveform visualization, A/B looping, and seek controls — designed for learning songs by ear.

## Motivation / Why

Slowing down a song without changing pitch is the #1 way guitarists learn by ear. Most music players don't support this. A dedicated player with speed control, looping, and waveform scrubbing turns the app into a serious practice tool.

## User Stories

1. **As a guitarist**, I want to import audio files so I can practice along.
2. **As a learner**, I want to slow down playback (pitch-corrected) to learn difficult passages.
3. **As a player**, I want to loop a section (A/B loop) to practice a specific part repeatedly.
4. **As a player**, I want to scrub through a waveform to jump to any part of the song.

## Detailed Description

### Music File Management

- Import audio files: MP3, WAV, M4A, AAC, OGG, FLAC, 3GP, WebM, WMA, OPUS
- Files copied to `DocumentDirectory/music/`
- Metadata: name, duration, extension, URI, addedDate
- Search, rename, delete from library list

### Player Controls

- Play/pause toggle
- Skip forward/backward ±10 seconds
- Interactive waveform with drag-to-seek
- Current position and total duration display

### Speed Control

- Slider: 0.25x to 1.0x (pitch-corrected via `setRateAsync`)
- Preset buttons: 0.25x, 0.5x, 0.75x, 1.0x
- Pitch correction enabled (`shouldCorrectPitch: true`)

### A/B Loop

- Drag loop markers on waveform to set A and B points
- Loop toggle button to enable/disable
- Playback automatically loops between A and B points

## Acceptance Criteria

- [x] Import audio files from device (multiple formats supported)
- [x] Files stored locally in `DocumentDirectory/music/`
- [x] Music list with search, rename, delete
- [x] Play/pause controls
- [x] Skip forward/backward ±10 seconds
- [x] Interactive waveform visualization with drag-to-seek
- [x] Speed control slider (0.25x–1.0x)
- [x] Speed preset buttons (0.25x, 0.5x, 0.75x, 1.0x)
- [x] Pitch-corrected playback at all speeds
- [x] A/B loop with draggable markers on waveform
- [x] Loop toggle button
- [x] Duration and current position display
- [x] Cloud sync support (optional)

## Technical Notes

- `expo-av` Sound object with `setRateAsync(speed, true)` for pitch-corrected playback
- Waveform is custom-drawn, not from actual audio data (visual representation)
- A/B loop implemented via `onPlaybackStatusUpdate` callback checking position vs markers
- Music player is a separate screen in nested stack navigator

## Files

- `src/screens/MusicPlayerScreen.js`
- `src/services/musicStorageService.js`
- `src/services/audioPlaybackService.js`
- `src/components/MusicItem.js`

## Subtasks

- [x] **ORION-005a**: Implement music file import and local storage
- [x] **ORION-005b**: Build music list with search/rename/delete
- [x] **ORION-005c**: Build player UI with play/pause, skip, position display
- [x] **ORION-005d**: Implement waveform visualization with drag-to-seek
- [x] **ORION-005e**: Add speed control slider + presets with pitch correction
- [x] **ORION-005f**: Implement A/B loop with draggable waveform markers
- [x] **ORION-005g**: Integrate with genericStorageService for cloud sync
