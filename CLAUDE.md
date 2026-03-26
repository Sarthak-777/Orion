# CLAUDE.md

## Project Overview

**Orion** — React Native/Expo guitar practice app. Tuner, metronome, PDF tab library, music player with slow-down, voice memos with reactions. Optional Supabase cloud sync.

**Stack**: Expo SDK 54, React 19.1.0, React Native 0.81.5, pure JavaScript (no TypeScript). Managed Expo workflow, New Architecture enabled.

## Commands

```bash
npm start          # Expo dev server (i=iOS, a=Android, w=Web)
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
npx expo install <pkg>  # Install Expo-compatible packages
npx expo prebuild       # Generate native dirs (gitignored)
```

No test framework, linter, or formatter configured.

## Architecture

```
index.js → registerRootComponent(App)
App.js → SafeAreaProvider → ThemeProvider → ToastProvider → UserProfileProvider
       → TunerSettingsProvider → AuthProvider → SyncProvider → NavigationContainer
       → BottomTabNavigator (4 tabs: Practice, Library, Memos, Settings)
```

### Directory Layout

```
src/
├── screens/          # TunerScreen, TabsScreen, PdfViewerScreen, MusicPlayerScreen,
│                     # VoiceMemosScreen, SettingsScreen
├── components/       # Toast, TunerMeter, StringSelector, InstrumentSelector,
│                     # TuningSelector, MusicItem, AlertModal, CloudStorageIndicator
├── context/          # ThemeContext, ToastContext, AuthContext, SyncContext,
│                     # UserProfileContext, TunerSettingsContext
├── hooks/            # useTuner (pitch detection, platform-specific)
├── services/         # audioService, audioPlaybackService, pitchDetection,
│                     # tabsStorage, musicStorageService, voiceMemoStorageService,
│                     # supabaseStorageService, genericStorageService
├── utils/            # pitchUtils, base64, filesystem, formatters
├── config/           # supabase.js
├── constants/        # tunings.js (instruments, tunings, note frequencies)
└── navigation/       # BottomTabNavigator.js
```

## Key Conventions

- **Language**: JavaScript only — no TypeScript
- **Styling**: `StyleSheet.create()` per component, theme-aware via `useTheme()`
- **State**: React Context for app-wide state, AsyncStorage for persistence. No Redux/Zustand.
- **Naming**: PascalCase screens/components/contexts, camelCase hooks/utils/services, UPPER_SNAKE_CASE constants
- **Components**: Dumb — no business logic in components; logic lives in hooks/services/contexts
- **Package manager**: npm (package-lock.json)
- **Expo config**: All native config via `app.json` — no manual native edits

## Critical Patterns (Do Not Break)

### Supabase / Cloud Sync
- Upload bytes via `base64ToBytes()` directly — **never use `.buffer`** (causes corruption in RN)
- Download via signed URLs + `FileSystem.downloadAsync()` — **Blob.arrayBuffer doesn't work in RN**
- Custom `base64.js` decoder required — `atob`/`btoa` don't exist in React Native
- Each upload stores file + `.json` metadata sidecar
- `genericStorageService.js` (`SupabaseStorageAdapter`) is the shared abstraction — tabs, music, memos all use it
- App works fully offline; sync is optional. Graceful degradation if Supabase unconfigured.

### Audio / Pitch Detection
- **Native**: `react-native-pitchy` (ACF2+ algorithm)
- **Web**: Custom autocorrelation via Web Audio API (`pitchDetection.js`)
- Pitch smoothing: 5-reading median + 3-reading stability threshold
- Harmonic filtering: detects octaves, returns fundamental
- Playback speed: `sound.setRateAsync(speed, true)` for pitch-corrected 0.5x–1.0x

### Theme
- Dark (#0a0a0a) / Light (#f5f5f5) — persisted to `@app_theme`
- Toast: inverted colors (black bg on light, white bg on dark), bottom-aligned, 3s auto-dismiss

### Voice Memo Reactions
- Single emoji per memo stored as string (`memo.reaction`), not object
- Long press: own memos → delete/rename; others → reaction picker

## AsyncStorage Keys

| Key | Purpose |
|-----|---------|
| `@app_theme` | Dark/light mode |
| `@auth_user` | Auth session |
| `@supabase_sync_settings` | Sync enabled/auto/lastSync |
| `@user_profile` | Display name |
| `@tuner_settings` | Instrument, reference Hz, haptic, autoDetect |
| `@saved_tabs` | PDF tabs metadata |
| `@saved_music` | Music files metadata |
| `@voice_memos` | Voice memo metadata |

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=<supabase project url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
```

See `.env.example`. Never commit `.env`.

## Navigation

Library tab uses nested stack nav (`LibraryStack`):
- `TabsList` → `PdfViewer` (view PDF)
- `TabsList` → `MusicPlayer` (audio with speed control)

Other tabs are single screens.

## Gitignored

`/ios`, `/android`, `.expo/`, `node_modules/`, `.env*.local`, signing creds (`.jks`, `.p8`, `.p12`, `.key`, `.mobileprovision`)
