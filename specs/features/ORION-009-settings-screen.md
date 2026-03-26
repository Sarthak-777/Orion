# ORION-009: Settings Screen

| Field         | Value                                  |
|---------------|----------------------------------------|
| **ID**        | ORION-009                              |
| **Type**      | Feature                                |
| **Priority**  | Medium                                 |
| **Status**    | Done                                   |
| **Epic**      | UI & Design                            |
| **Created**   | 2026-03-26                             |
| **Author**    | Sarthak                                |
| **Assignee**  | Sarthak                                |
| **Labels**    | `settings`, `ui`, `config`             |
| **Estimate**  | 3 story points                         |

---

## Summary

Centralized settings screen with profile management, appearance toggle, tuner preferences, cloud sync controls, and app info.

## Motivation / Why

Users need a single place to configure the app — profile, theme, tuner defaults, and sync. Without it, settings would be scattered or hidden.

## User Stories

1. **As a user**, I want to set my display name so memos show my name.
2. **As a user**, I want to configure tuner defaults (instrument, reference Hz, haptics).
3. **As a user**, I want to manage cloud sync from one place.
4. **As a user**, I want to switch themes.

## Detailed Description

### Sections

1. **Profile** — set/edit display name, avatar with initial
2. **Appearance** — dark/light mode toggle
3. **Tuner Settings** — default instrument, reference pitch (440/432/442), auto-detect toggle, haptic feedback toggle
4. **Cloud Sync** — enable/disable, auto-sync toggle, manual sync, restore, reset, last sync timestamp
5. **About** — version display (1.0.0), app branding

## Acceptance Criteria

- [x] Display name input with persistence (UserProfileContext)
- [x] Avatar showing user initial
- [x] Dark/light mode toggle
- [x] Default instrument selector (Guitar, Ukulele, Bass)
- [x] Reference pitch selector (440, 432, 442 Hz)
- [x] Auto-detect string toggle
- [x] Haptic feedback toggle
- [x] Cloud sync enable/disable
- [x] Auto-sync on launch toggle
- [x] Manual sync button with last sync timestamp
- [x] Restore from cloud button
- [x] Reset sync settings button
- [x] Version display
- [x] All settings persist across sessions

## Files

- `src/screens/SettingsScreen.js`
- `src/context/UserProfileContext.js`
- `src/context/TunerSettingsContext.js`
- `src/context/ThemeContext.js`
- `src/context/SyncContext.js`

## Subtasks

- [x] **ORION-009a**: Build settings screen layout with sections
- [x] **ORION-009b**: Implement profile section (name, avatar)
- [x] **ORION-009c**: Add appearance toggle
- [x] **ORION-009d**: Add tuner settings section
- [x] **ORION-009e**: Add cloud sync settings section
- [x] **ORION-009f**: Add about section with version
