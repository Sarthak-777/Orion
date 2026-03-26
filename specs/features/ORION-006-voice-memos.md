# ORION-006: Voice Memos with Reactions

| Field         | Value                                          |
|---------------|-------------------------------------------------|
| **ID**        | ORION-006                                       |
| **Type**      | Feature                                         |
| **Priority**  | Medium                                          |
| **Status**    | Done                                            |
| **Epic**      | Voice Memos                                     |
| **Created**   | 2026-03-26                                      |
| **Author**    | Sarthak                                         |
| **Assignee**  | Sarthak                                         |
| **Labels**    | `memos`, `audio`, `recording`, `social`         |
| **Estimate**  | 8 story points                                  |

---

## Summary

Record voice memos (practice ideas, riffs, song snippets) in a chat-style interface with playback, waveform visualization, emoji reactions, and cloud sync.

## Motivation / Why

Musicians constantly have ideas they need to capture quickly — a riff, a chord progression, a melody. Voice memos with a chat-like UI make it fast to record and review. Reactions add a lightweight social layer for future sharing features.

## User Stories

1. **As a musician**, I want to quickly record a musical idea before I forget it.
2. **As a player**, I want to review my recordings with playback and waveform visualization.
3. **As a user**, I want to organize my memos (search, rename, delete).
4. **As a user**, I want to react to memos with emojis.

## Detailed Description

### Recording

- Floating record button with pulsing animation while recording
- Recording timer display
- M4A format, mono, 22050 Hz, 64 kbps (compressed for space)
- Auto-naming: "Memo 1", "Memo 2", etc.
- Name dialog after recording to customize

### Chat-Style UI

- Message bubbles: own memos right-aligned, others left-aligned
- Avatar with first letter of user's display name
- Inline waveform visualizer per memo
- Play/pause button per memo
- Duration display
- Like button with count

### Reactions

- 6 emoji options: ❤️, 🔥, 👏, 😂, 😮, 😢
- Long press on own memo → rename/delete options
- Long press on others' memo → reaction picker
- Single reaction per memo (stored as `memo.reaction` string)
- Floating reaction badge displayed below memo bubble

### Management

- Search by memo name or user name
- Rename own memos
- Delete own memos with confirmation
- Scroll to bottom on new memo

### Data Model

```js
{
  id: "uuid",
  name: "Riff idea",
  userName: "Sarthak",
  userId: "user-id",
  uri: "file:///path/to/memo.m4a",
  duration: 15000,
  addedDate: "2026-03-26T10:00:00Z",
  isPublic: false,
  likes: 0,
  liked: false,
  reaction: "🔥",  // single emoji string
  extension: "m4a"
}
```

## Acceptance Criteria

- [x] Floating record button with pulsing animation
- [x] Recording timer visible during recording
- [x] M4A compressed format (mono, 22050 Hz, 64 kbps)
- [x] Auto-naming with post-record name dialog
- [x] Chat-style message bubbles (own = right, others = left)
- [x] Avatar with user initial
- [x] Inline waveform visualization per memo
- [x] Play/pause per memo with progress tracking
- [x] Duration display
- [x] Like button with count
- [x] 6 emoji reactions via long press
- [x] Long press own memo → rename/delete
- [x] Long press others' memo → reaction picker
- [x] Single reaction per memo (string, not object)
- [x] Search by memo name or user name
- [x] Delete with confirmation
- [x] Cloud sync support (optional)
- [x] Microphone permission handling

## Technical Notes

- `voiceMemoStorageService.js` handles CRUD + file operations
- `expo-av` Recording API for capture, Sound API for playback
- Reaction is stored as a plain string on the memo object — NOT an object/map
- Social features (isPublic, likes, comments) infrastructure in place but UI not yet built

## Files

- `src/screens/VoiceMemosScreen.js`
- `src/services/voiceMemoStorageService.js`

## Subtasks

- [x] **ORION-006a**: Implement audio recording with M4A compression
- [x] **ORION-006b**: Build chat-style memo list UI
- [x] **ORION-006c**: Add inline waveform + playback per memo
- [x] **ORION-006d**: Implement emoji reaction system (long press)
- [x] **ORION-006e**: Add search, rename, delete functionality
- [x] **ORION-006f**: Integrate with genericStorageService for cloud sync
