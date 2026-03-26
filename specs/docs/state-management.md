# State Management

## Overview

Orion uses React Context for all app-wide state. No external state libraries (Redux, Zustand, MobX). Local component state uses `useState`/`useReducer`. Persistence is via AsyncStorage.

## Provider Hierarchy

Order matters — inner providers can consume outer contexts.

```
SafeAreaProvider
  ThemeProvider          ← persists to @app_theme
    ToastProvider        ← ephemeral (no persistence)
      UserProfileProvider ← persists to @user_profile
        TunerSettingsProvider ← persists to @tuner_settings
          AuthProvider    ← persists to @auth_user
            SyncProvider  ← persists to @supabase_sync_settings
              NavigationContainer
```

## Context Providers

### ThemeContext

**File**: `src/context/ThemeContext.js`
**Storage Key**: `@app_theme`

| State | Type | Description |
|-------|------|-------------|
| `isDarkMode` | boolean | Current mode |
| `theme` | object | Color palette |

**Colors**:
- Dark: background `#0a0a0a`, surface `#1a1a1a`
- Light: background `#f5f5f5`, surface `#ffffff`
- Shared: `tunerGreen`, `tunerOrange`, `primary`

**Hook**: `useTheme()` — returns `{ isDarkMode, theme, toggleTheme }`

### ToastContext

**File**: `src/context/ToastContext.js`
**Storage Key**: None (ephemeral)

| State | Type | Description |
|-------|------|-------------|
| `visible` | boolean | Toast visibility |
| `message` | string | Toast text |
| `type` | string | `'success'` \| `'error'` \| `'warning'` |

**Hook**: `useToast()` — returns `{ showToast(msg, type), hideToast }`

Toast renders at bottom of screen, inverted colors (black bg in light mode, white bg in dark), auto-dismisses after 3 seconds.

### UserProfileContext

**File**: `src/context/UserProfileContext.js`
**Storage Key**: `@user_profile`

| State | Type | Description |
|-------|------|-------------|
| `displayName` | string | User's display name |
| `createdAt` | string | Profile creation date |

**Hook**: `useUserProfile()` — returns `{ displayName, updateDisplayName, clearProfile }`

### TunerSettingsContext

**File**: `src/context/TunerSettingsContext.js`
**Storage Key**: `@tuner_settings`

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultInstrument` | string | `'guitar'` | Selected instrument |
| `tuningReference` | number | `440` | A4 reference frequency (Hz) |
| `autoDetect` | boolean | `true` | Auto-detect string |
| `hapticFeedback` | boolean | `true` | Vibrate when in tune |

**Hook**: `useTunerSettings()` — returns state + setters + `triggerInTuneHaptic()`, `triggerSelectionHaptic()`

### AuthContext

**File**: `src/context/AuthContext.js`
**Storage Key**: `@auth_user`

| State | Type | Description |
|-------|------|-------------|
| `user` | object \| null | `{ id, email, username, avatar, createdAt }` |
| `isLoading` | boolean | Auth state loading |
| `isAuthenticated` | boolean | Derived from `user !== null` |

**Methods**: `signUp()`, `signIn()`, `signOut()`, `updateProfile()`

Currently stub — auth UI not yet implemented. Prepared for future social features.

### SyncContext

**File**: `src/context/SyncContext.js`
**Storage Key**: `@supabase_sync_settings`

| State | Type | Description |
|-------|------|-------------|
| `isEnabled` | boolean | Master sync toggle |
| `isSyncing` | boolean | Sync in progress |
| `lastSync` | string \| null | Last sync timestamp |
| `autoSync` | boolean | Auto-sync on launch |
| `isInitialized` | boolean | Supabase connection verified |

**Methods**: `toggleSync()`, `performSync()`, `performRestore()`, `syncSingleTab()`, `resetSync()`

See [supabase.md](./supabase.md) for sync details.

## AsyncStorage Keys

| Key | Context | Data Shape |
|-----|---------|-----------|
| `@app_theme` | ThemeContext | `"dark"` \| `"light"` |
| `@auth_user` | AuthContext | `{ id, email, username, ... }` |
| `@supabase_sync_settings` | SyncContext | `{ isEnabled, autoSync, lastSync }` |
| `@user_profile` | UserProfileContext | `{ displayName, createdAt }` |
| `@tuner_settings` | TunerSettingsContext | `{ defaultInstrument, tuningReference, ... }` |
| `@saved_tabs` | tabsStorage service | `[{ id, name, uri, ... }]` |
| `@saved_music` | musicStorageService | `[{ id, name, uri, duration, ... }]` |
| `@voice_memos` | voiceMemoStorageService | `[{ id, name, uri, reaction, ... }]` |

## Data Flow Pattern

```
User Interaction
  -> Screen calls context method or hook
    -> Context/hook calls service (if I/O needed)
      -> Service reads/writes AsyncStorage + FileSystem
    -> Context updates state
      -> React re-renders consuming components
```

## Local Component State

Screens use local `useState` for:
- Search queries
- Modal visibility
- Form inputs
- Loading spinners
- Scroll position

These do not need to be shared app-wide, so they stay local.

## Initialization

On app mount, each context provider:
1. Reads its AsyncStorage key
2. Hydrates state with persisted values (or defaults if none found)
3. Sets `isLoading` to false
4. Renders children

This happens top-down through the provider hierarchy.
