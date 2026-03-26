# ORION-001: Practice Session Logging

| Field         | Value                          |
|---------------|--------------------------------|
| **ID**        | ORION-001                      |
| **Type**      | Feature                        |
| **Priority**  | High                           |
| **Status**    | Backlog                        |
| **Epic**      | Practice Tracking              |
| **Created**   | 2026-03-26                     |
| **Author**    | Sarthak                        |
| **Assignee**  | Unassigned                     |
| **Labels**    | `practice`, `analytics`, `mvp` |
| **Estimate**  | 5 story points                 |

---

## Summary

Track and persist practice sessions so users can review what they practiced, how long, and see progress over time.

## Motivation / Why

The app has a tuner, metronome, tabs, and music player — but no way to tie a practice session together or track progress. Users have no visibility into how much they practice or whether they're improving. This is the single biggest gap between "tool" and "practice companion."

## User Stories

1. **As a guitarist**, I want to start/stop a practice session so my time is tracked automatically.
2. **As a guitarist**, I want to see a summary after each session (duration, what I practiced).
3. **As a guitarist**, I want to view my practice history so I can see trends over days/weeks.
4. **As a guitarist**, I want to set a daily practice goal so I stay motivated.

## Detailed Description

### Session Lifecycle

- User taps "Start Practice" on the Practice screen (or session auto-starts when tuner/metronome is used).
- A timer runs in the background, tracking total duration.
- Activities are logged automatically based on what the user does:
  - Tuner usage (instrument, tuning, duration)
  - Metronome usage (BPM, duration)
  - Tab viewed (which PDF, duration)
  - Music played (which track, speed used, duration)
- User taps "End Practice" → summary screen shown.
- Session saved to AsyncStorage (and synced to Supabase if enabled).

### Data Model

```js
{
  id: "uuid",
  startedAt: "2026-03-26T10:00:00Z",
  endedAt: "2026-03-26T10:45:00Z",
  durationMs: 2700000,
  activities: [
    { type: "tuner", instrument: "guitar", tuning: "standard", durationMs: 300000 },
    { type: "metronome", bpm: 120, durationMs: 600000 },
    { type: "tab", title: "Wonderwall.pdf", durationMs: 900000 },
    { type: "music", title: "Back In Black.mp3", speed: 0.75, durationMs: 900000 }
  ],
  notes: "Worked on barre chords",  // optional user note
  goalMet: true
}
```

### AsyncStorage Key

| Key | Purpose |
|-----|---------|
| `@practice_sessions` | Array of session objects |
| `@practice_goal` | Daily goal in minutes (number) |

### UI Components

1. **Session Timer Bar** — persistent bar at top of Practice screen showing elapsed time + stop button.
2. **Session Summary Modal** — shown after ending session: duration, activity breakdown, optional note input.
3. **Practice History Screen** — accessible from Settings or Practice tab. Shows:
   - Calendar heat map (days practiced)
   - Weekly total vs goal
   - List of past sessions (tap to expand details)
4. **Goal Setting** — simple input in Settings: "Daily practice goal: __ minutes"

### Supabase Sync

- New storage bucket or table: `practice_sessions`
- Follows existing sync pattern via `genericStorageService.js`
- Each session stored as JSON file + metadata sidecar

## Acceptance Criteria

- [ ] Tapping "Start Practice" begins a session timer visible on the Practice screen
- [ ] Activities (tuner, metronome, tab, music) are auto-logged while session is active
- [ ] Tapping "End Practice" shows a summary with total duration and activity breakdown
- [ ] User can add an optional text note to the session summary
- [ ] Sessions persist across app restarts via AsyncStorage
- [ ] Practice History screen shows past sessions with date, duration, and activities
- [ ] User can set a daily practice goal in Settings
- [ ] Practice History shows weekly progress vs goal
- [ ] Sessions sync to Supabase when cloud sync is enabled
- [ ] App works fully offline — sessions queue for sync when reconnected
- [ ] No regressions to existing tuner, metronome, tabs, or music functionality

## Technical Notes

- Use React Context (`PracticeSessionContext`) for active session state
- Activity tracking via event listeners / hooks in existing screens — avoid coupling screens to session logic
- Timer should survive background/foreground transitions (use `AppState` listener)
- Keep session data lightweight — don't store audio/file content, just references

## Out of Scope

- Social/sharing features (share practice streaks)
- Detailed analytics (e.g., pitch accuracy over time)
- Integration with external practice plans or curricula
- Gamification (badges, achievements) — may be a follow-up

## Dependencies

- None — builds on existing screens and services

## Risks / Open Questions

- **Timer accuracy in background**: Expo's background task support is limited. May need to store timestamps and compute duration on resume rather than running a live timer.
- **Auto-start vs manual start**: Should sessions start automatically when the user opens the Practice tab, or require explicit start? (Recommend: manual start for v1.)
- **Activity granularity**: How detailed should activity logs be? (Recommend: one entry per tool-use, not per-second tracking.)

## Design Mockups

_None yet — to be added._

---

## Subtasks

- [ ] **ORION-001a**: Create `PracticeSessionContext` with start/stop/activity-log API
- [ ] **ORION-001b**: Add session timer bar UI to Practice screen
- [ ] **ORION-001c**: Integrate activity tracking into Tuner, Metronome, Tabs, Music screens
- [ ] **ORION-001d**: Build session summary modal
- [ ] **ORION-001e**: Build Practice History screen
- [ ] **ORION-001f**: Add daily goal setting to Settings screen
- [ ] **ORION-001g**: Add Supabase sync for practice sessions
- [ ] **ORION-001h**: Write tests for session context and storage logic
