# Storage

## Overview

Orion uses a two-tier storage strategy: local-first with optional cloud sync. All data is stored locally using AsyncStorage (metadata) and expo-file-system (files). Cloud sync via Supabase is opt-in.

## Local Storage

### AsyncStorage (Metadata)

Lightweight key-value store for JSON-serializable data. Used for settings, preferences, and file metadata arrays.

| Key | Service | Content |
|-----|---------|---------|
| `@saved_tabs` | tabsStorage | Array of tab objects (id, name, uri, dates) |
| `@saved_music` | musicStorageService | Array of music objects (id, name, uri, duration, extension) |
| `@voice_memos` | voiceMemoStorageService | Array of memo objects (id, name, uri, reaction, isPublic) |
| `@app_theme` | ThemeContext | `"dark"` or `"light"` |
| `@tuner_settings` | TunerSettingsContext | Settings object |
| `@user_profile` | UserProfileContext | Profile object |
| `@auth_user` | AuthContext | User session object |
| `@supabase_sync_settings` | SyncContext | Sync preferences |

### FileSystem (Files)

Binary files stored via `expo-file-system` in the app's documents directory:

```
documents/
├── tabs/           # PDF files
├── music/          # Audio files (mp3, wav, m4a, etc.)
└── voice_memos/    # Voice recordings
```

Helper: `ensureDirectory(path)` in `src/utils/filesystem.js` creates directories if they don't exist.

## Storage Services

### tabsStorage.js

Manages PDF guitar tabs.

| Method | Description |
|--------|-------------|
| `getTabs()` | Read all tabs from AsyncStorage |
| `addTab(tab)` | Save tab metadata + copy file to documents/tabs/ |
| `renameTab(id, name)` | Update tab name |
| `deleteTab(id)` | Remove metadata + delete file |

### musicStorageService.js

Manages audio files for the music player.

| Method | Description |
|--------|-------------|
| `getMusic()` | Read all music from AsyncStorage |
| `addMusic(music)` | Save metadata + copy file to documents/music/ |
| `renameMusic(id, name)` | Update music name |
| `deleteMusic(id)` | Remove metadata + delete file |

Tracks `duration` and `extension` in metadata.

### voiceMemoStorageService.js

Manages voice memo recordings.

| Method | Description |
|--------|-------------|
| `getMemos()` | Read all memos from AsyncStorage |
| `addMemo(memo)` | Save metadata + copy file to documents/voice_memos/ |
| `renameMemo(id, name)` | Update memo name |
| `deleteMemo(id)` | Remove metadata + delete file |
| `setReaction(id, emoji)` | Set single emoji reaction on memo |
| `removeReaction(id)` | Clear reaction |

Reactions are stored as a single string (`memo.reaction`), not an object/array.

## Cloud Storage (Supabase)

See [supabase.md](./supabase.md) for full details.

### SupabaseStorageAdapter

**File**: `src/services/genericStorageService.js`

Reusable adapter that all three file types use. Configured per-type:

```js
new SupabaseStorageAdapter({
  bucketName: 'tabs',        // Supabase bucket name
  fileExtensions: ['.pdf'],  // Accepted extensions
  storageKey: '@saved_tabs', // AsyncStorage key
  localDirectory: 'tabs/',   // Local FileSystem subdirectory
})
```

### Sync Operations

| Operation | Direction | Description |
|-----------|-----------|-------------|
| `syncToCloud()` | Local -> Cloud | Uploads all local items |
| `restoreFromCloud()` | Cloud -> Local | Downloads all cloud items |
| `uploadFile(item)` | Local -> Cloud | Uploads single file + metadata |
| `downloadFile(path)` | Cloud -> Local | Downloads single file via signed URL |
| `deleteFromCloud(item)` | Cloud only | Removes file + metadata from cloud |
| `listCloudFiles()` | Cloud only | Lists files in bucket |

### File Format on Cloud

Each item has two files in the Supabase bucket:
- `filename.ext` — the actual file
- `filename.ext.json` — metadata sidecar

## File Import Flow

When a user adds a file (PDF or music):

```
1. User picks file via expo-document-picker
2. File copied from picker URI to documents/<type>/
3. Metadata object created (id, name, uri, dates, etc.)
4. Metadata array updated in AsyncStorage
5. If sync enabled: upload to Supabase in background
```

## File Deletion Flow

```
1. User long-presses item -> selects Delete
2. File removed from FileSystem
3. Metadata removed from AsyncStorage array
4. If sync enabled: delete from Supabase bucket
```

## Supported File Types

| Category | Extensions |
|----------|-----------|
| PDF Tabs | `.pdf` |
| Music | `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`, `.3gp`, `.webm`, `.wma`, `.opus` |
| Voice Memos | `.wav`, `.m4a`, `.mp3` |

## React Native Caveats

1. **No `atob`/`btoa`**: React Native lacks these. Use custom `base64ToBytes()` from `src/utils/base64.js`.
2. **No `Blob.arrayBuffer()`**: Doesn't work in RN. Use `FileSystem.downloadAsync()` instead.
3. **`Uint8Array.buffer` corruption**: Never pass `.buffer` to Supabase upload. Pass the `Uint8Array` directly.
4. **File URI schemes**: iOS uses `file://`, Android may use `content://`. Services normalize paths internally.
