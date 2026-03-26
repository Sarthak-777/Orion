# Navigation

## Overview

Orion uses React Navigation 7 with a bottom tab navigator as the root. The Library tab contains a nested stack navigator for detail screens.

## Dependencies

- `@react-navigation/native` — core
- `@react-navigation/bottom-tabs` — tab navigator
- `@react-navigation/native-stack` — stack navigator (native performance)
- `react-native-screens` — native screen containers
- `react-native-safe-area-context` — safe area insets

## Tab Structure

**File**: `src/navigation/BottomTabNavigator.js`

```
BottomTabNavigator
├── Practice (TunerScreen)          — icon: "P"
├── Library  (LibraryStack)         — icon: "L"
│   ├── TabsList (TabsScreen)
│   ├── PdfViewer (PdfViewerScreen)
│   └── MusicPlayer (MusicPlayerScreen)
├── Memos    (VoiceMemosScreen)     — icon: "M"
└── Settings (SettingsScreen)       — icon: "S"
```

### Tab Icons

Custom letter-based icons rendered as `Text` components inside circles. No icon library dependency.

### Tab Bar Styling

- Theme-aware background and border colors via `useTheme()`
- Active tab: primary color highlight
- Inactive tab: muted text color
- `tabBarShowLabel: false` — icons only, no text labels

## Library Stack (Nested Navigation)

The Library tab uses `createNativeStackNavigator` for drill-down navigation:

### Routes

| Route | Screen | Params |
|-------|--------|--------|
| `TabsList` | TabsScreen | — |
| `PdfViewer` | PdfViewerScreen | `{ tab }` — the tab object to display |
| `MusicPlayer` | MusicPlayerScreen | `{ music }` — the music item to play |

### Navigation Flow

```
TabsScreen
  ├── [Tap PDF item]  -> navigate('PdfViewer', { tab })
  └── [Tap Music item] -> navigate('MusicPlayer', { music })

PdfViewerScreen
  └── [Back button] -> goBack() to TabsList

MusicPlayerScreen
  └── [Back button] -> goBack() to TabsList
```

### Header Configuration

- LibraryStack screens use the navigation header
- `TabsList` has a custom header title ("Library")
- `PdfViewer` shows the tab name as title
- `MusicPlayer` shows the song name as title
- All headers are theme-aware

## Screen Descriptions

### Practice (TunerScreen)
Mode toggle between Tuner and Metronome. Single screen, no sub-navigation.

### Library (TabsScreen)
Segmented control toggles between PDF Tabs and Music views. Both share the same screen with conditional rendering. Each list item navigates to its detail screen.

### PdfViewer (PdfViewerScreen)
Full-screen PDF viewer using `react-native-pdf`. Receives tab data via route params.

### MusicPlayer (MusicPlayerScreen)
Audio player with play/pause, progress bar, and speed control slider (0.5x–1.0x). Receives music item via route params.

### Memos (VoiceMemosScreen)
Chat-style voice memo list with recording button. No sub-navigation.

### Settings (SettingsScreen)
Profile, theme toggle, tuner defaults, sync settings. No sub-navigation.

## Navigation Theme

App.js applies a dynamic navigation theme that merges React Navigation's built-in `DarkTheme`/`DefaultTheme` with Orion's custom colors:

```js
{
  colors: {
    background: theme.background,
    card: theme.surface,
    text: theme.text,
    border: theme.border,
    primary: theme.primary,
  }
}
```

This ensures navigation elements (headers, tab bars, back buttons) match the app's dark/light theme.

## Deep Linking

Not currently configured. All navigation is internal via tab switches and stack pushes.
