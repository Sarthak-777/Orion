# ORION-008: Theme System (Dark / Light)

| Field         | Value                                  |
|---------------|----------------------------------------|
| **ID**        | ORION-008                              |
| **Type**      | Feature                                |
| **Priority**  | Medium                                 |
| **Status**    | Done                                   |
| **Epic**      | UI & Design                            |
| **Created**   | 2026-03-26                             |
| **Author**    | Sarthak                                |
| **Assignee**  | Sarthak                                |
| **Labels**    | `theme`, `ui`, `design`                |
| **Estimate**  | 3 story points                         |

---

## Summary

App-wide dark/light theme system with persistent preference, theme-aware components, and inverted toast styling.

## Motivation / Why

Musicians often practice in dim environments (stage, bedroom at night). Dark mode is essential. A proper theme system ensures every component respects the user's preference without ad-hoc color overrides.

## User Stories

1. **As a user**, I want to toggle between dark and light mode.
2. **As a user**, I want my theme preference to persist across sessions.
3. **As a user**, I want all screens and components to respect the theme.

## Detailed Description

### Theme Colors

| Token | Dark | Light |
|---|---|---|
| background | #0a0a0a | #f5f5f5 |
| surface | (dark surface) | (light surface) |
| text | light text | dark text |
| border, accent, success, warning, error | theme-appropriate variants | theme-appropriate variants |

### ThemeContext

- Provides `theme` object with full color palette
- `toggleTheme()` method
- `isDark` boolean
- Persisted to AsyncStorage (`@app_theme`)
- All components use `useTheme()` hook

### Toast Styling

- Inverted from theme: black bg on light mode, white bg on dark mode
- Bottom-aligned, 3-second auto-dismiss

## Acceptance Criteria

- [x] Dark mode (#0a0a0a background) and light mode (#f5f5f5 background)
- [x] Toggle in Settings screen
- [x] Theme persists to AsyncStorage across app restarts
- [x] All screens and components use `useTheme()` for colors
- [x] Toast uses inverted colors (black/white only)
- [x] Toast bottom-aligned with 3s auto-dismiss
- [x] Navigation bar respects theme
- [x] Status bar adapts to theme

## Files

- `src/context/ThemeContext.js`
- `src/components/Toast.js`
- `src/context/ToastContext.js`

## Subtasks

- [x] **ORION-008a**: Create ThemeContext with dark/light color palettes
- [x] **ORION-008b**: Implement toggle + AsyncStorage persistence
- [x] **ORION-008c**: Update all screens/components to use `useTheme()`
- [x] **ORION-008d**: Build Toast component with inverted theme colors
