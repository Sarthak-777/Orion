# Architecture

## Overview

Orion is a React Native/Expo guitar practice app. It runs on iOS, Android, and Web via Expo SDK 54 with New Architecture enabled. The app is written entirely in JavaScript (no TypeScript) using the managed Expo workflow.

## High-Level Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54, React Native 0.81.5, React 19.1.0 |
| Navigation | React Navigation 7 (bottom tabs + native stack) |
| State | React Context + AsyncStorage |
| Audio | expo-av, react-native-pitchy (native), Web Audio API (web) |
| Storage | expo-file-system + AsyncStorage (local), Supabase Storage (cloud) |
| Haptics | expo-haptics |
| PDF | react-native-pdf |

## App Entry Point

```
index.js
  -> registerRootComponent(App)

App.js
  -> SafeAreaProvider
    -> ThemeProvider
      -> ToastProvider
        -> UserProfileProvider
          -> TunerSettingsProvider
            -> AuthProvider
              -> SyncProvider
                -> NavigationContainer
                  -> BottomTabNavigator
```

Provider order matters: inner providers may depend on outer ones (e.g., SyncProvider uses AuthContext).

## Directory Layout

```
src/
├── screens/           # Full-screen views, one per route
├── components/        # Reusable, stateless UI components
├── context/           # React Context providers (app-wide state)
├── hooks/             # Custom hooks (business logic)
├── services/          # Data layer: storage, audio, sync
├── utils/             # Pure helper functions
├── config/            # External service config (Supabase)
├── constants/         # Static data (tunings, instruments)
└── navigation/        # Navigator definitions
```

## Design Principles

### Dumb Components
Components contain zero business logic. They receive props and render UI. All logic lives in hooks, services, or contexts.

### Context Over Redux
App-wide state is managed via React Context. No external state libraries. Each context owns a single domain:
- **ThemeContext** — dark/light mode
- **ToastContext** — notification system
- **AuthContext** — user session
- **SyncContext** — cloud sync orchestration
- **TunerSettingsContext** — tuner preferences
- **UserProfileContext** — display name

### Services as Data Layer
Services handle all I/O: file system reads/writes, AsyncStorage persistence, Supabase uploads/downloads, audio playback. Screens and hooks call services; services never import from screens or components.

### Offline-First
The app works fully without internet. Cloud sync is optional and gracefully degrades when Supabase is unconfigured. All data persists locally via AsyncStorage + expo-file-system.

### Platform-Specific Audio
Pitch detection uses different implementations per platform:
- **Native (iOS/Android)**: `react-native-pitchy` (ACF2+ algorithm)
- **Web**: Custom autocorrelation via Web Audio API

The `useTuner` hook abstracts this — consumers don't need to know which platform they're on.

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Screens | PascalCase | `TunerScreen.js` |
| Components | PascalCase | `TunerMeter.js` |
| Contexts | PascalCase | `ThemeContext.js` |
| Hooks | camelCase, `use` prefix | `useTuner.js` |
| Services | camelCase | `audioPlaybackService.js` |
| Utils | camelCase | `pitchUtils.js` |
| Constants | UPPER_SNAKE_CASE (exports) | `NOTE_FREQUENCIES` |

## Styling

All styling uses `StyleSheet.create()` per component. Theme colors come from `useTheme()`. No external CSS-in-JS libraries.

## Data Flow

```
User Action
  -> Screen (dispatches to context/hook)
    -> Context/Hook (calls service)
      -> Service (reads/writes AsyncStorage, FileSystem, Supabase)
        -> State update via context
          -> Re-render
```

## Feature Modules

| Feature | Screen | Key Services | Contexts |
|---------|--------|-------------|----------|
| Tuner | TunerScreen | pitchDetection, audioService | TunerSettingsContext |
| Metronome | TunerScreen | expo-av (sound playback) | — |
| PDF Tabs | TabsScreen, PdfViewerScreen | tabsStorage, supabaseStorageService | SyncContext |
| Music Player | TabsScreen, MusicPlayerScreen | musicStorageService, audioPlaybackService | SyncContext |
| Voice Memos | VoiceMemosScreen | voiceMemoStorageService, audioService | SyncContext |
| Settings | SettingsScreen | — | All contexts |
