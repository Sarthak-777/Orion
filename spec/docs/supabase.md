# Supabase Integration

## Overview

Orion uses Supabase Storage for optional cloud sync of PDF tabs, music files, and voice memos. The app works fully offline; Supabase is an opt-in enhancement.

## Configuration

### Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=<supabase project url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
```

Set in `.env` (gitignored). See `.env.example` for the template.

### Client Initialization

**File**: `src/config/supabase.js`

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);
```

Exports:
- `supabase` — the client instance
- `isSupabaseConfigured()` — returns `false` if env vars are missing
- `initializeSupabase()` — tests connection by checking the `tabs` bucket

## Storage Buckets

| Bucket | Content | File Types |
|--------|---------|-----------|
| `tabs` | PDF guitar tabs | `.pdf` |
| `music` | Audio files | `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`, `.3gp`, `.webm`, `.wma`, `.opus` |
| `voice_memos` | Voice recordings | `.wav`, `.m4a`, `.mp3` |

Each bucket stores:
- The actual file (e.g., `song.pdf`)
- A metadata sidecar (e.g., `song.pdf.json`) with id, name, dates, duration, etc.

## Upload Pattern

```
1. Read local file as base64
   FileSystem.readAsStringAsync(uri, { encoding: 'base64' })

2. Convert to Uint8Array
   base64ToBytes(base64String)  // custom decoder in src/utils/base64.js

3. Upload bytes to Supabase
   supabase.storage.from(bucket).upload(path, bytes, {
     contentType: mimeType,
     upsert: true
   })

4. Upload metadata sidecar
   supabase.storage.from(bucket).upload(path + '.json', metadataBytes, {
     contentType: 'application/json',
     upsert: true
   })
```

### Critical: base64ToBytes() Usage

**ALWAYS** pass the `Uint8Array` directly to Supabase upload. **NEVER** use `.buffer`:

```js
// CORRECT
const bytes = base64ToBytes(base64String);
supabase.storage.from(bucket).upload(path, bytes, ...);

// WRONG — causes file corruption in React Native
const bytes = base64ToBytes(base64String);
supabase.storage.from(bucket).upload(path, bytes.buffer, ...);
```

React Native's `Uint8Array.buffer` may reference a larger backing `ArrayBuffer`, causing silent data corruption.

## Download Pattern

```
1. Get signed URL
   supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

2. Download via FileSystem
   FileSystem.downloadAsync(signedUrl, localPath)
```

### Critical: No Blob.arrayBuffer

`Blob.arrayBuffer()` does not work in React Native. Always use `FileSystem.downloadAsync()` with signed URLs.

## The Generic Storage Adapter

**File**: `src/services/genericStorageService.js`

`SupabaseStorageAdapter` is a reusable class that all three file types (tabs, music, memos) use for cloud operations:

```js
const adapter = new SupabaseStorageAdapter({
  bucketName: 'music',
  fileExtensions: ['.mp3', '.wav', '.m4a'],
  storageKey: '@saved_music',
  localDirectory: 'music/',
});
```

Methods:
- `uploadFile(item)` — uploads file + metadata sidecar
- `downloadFile(cloudPath, localPath)` — downloads via signed URL
- `syncToCloud(localItems)` — uploads all local items
- `restoreFromCloud()` — downloads all cloud items
- `deleteFromCloud(item)` — removes file + sidecar
- `listCloudFiles()` — lists files in the bucket

## Sync Orchestration

**File**: `src/context/SyncContext.js`

The SyncContext coordinates sync across all three file types:

### Settings (persisted to `@supabase_sync_settings`)
- `isEnabled` — master toggle
- `autoSync` — auto-sync on app launch
- `lastSync` — timestamp of last sync

### Operations
- **performSync()** — uploads all local items to cloud (tabs, music, memos)
- **performRestore()** — downloads all cloud items to local
- **syncSingleTab(tab)** — uploads a single tab immediately
- **toggleSync()** — enable/disable sync
- **resetSync()** — clears sync settings

### Auto-Sync Flow
```
App Launch
  -> SyncProvider mounts
    -> If isEnabled && autoSync:
      -> restoreFromCloud() (download new cloud items)
      -> syncToCloud() (upload new local items)
```

## Graceful Degradation

- `isSupabaseConfigured()` checked before any cloud operation
- If `false`, sync UI is hidden or disabled
- All data persists locally regardless of sync state
- Network errors are caught and surfaced via Toast notifications
- No data is lost if sync fails mid-operation

## Metadata Sidecar Format

Each uploaded file has a companion `.json` file:

```json
{
  "id": "uuid",
  "name": "Song Name",
  "extension": ".pdf",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z",
  "duration": 180000,
  "reaction": null,
  "isPublic": false
}
```

Fields vary by file type (e.g., `duration` only for audio, `reaction` only for memos).

## Conflict Resolution

Currently uses `upsert: true` on upload — last write wins. No merge logic. This is acceptable for a single-user app but would need revision for multi-user scenarios.
