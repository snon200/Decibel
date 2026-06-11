# components/runs/

UI for a single test run — the evidence page the user reaches from the suite list or the
comparison grid.

- `RunStatusBadge.tsx` — colored status (`dialing` / `in_progress` / `completed` / `failed`).
- `RunTimeline.tsx` — live progress while the call happens (driven by polling `useRun`).
- `TranscriptViewer.tsx` — the call transcript, role-formatted (tester / AUT turns).
- `AudioPlayer.tsx` — `<audio>` wrapper for the call's `audio_url`; lets the user
  actually listen to what their bot said.
- `TargetSummary.tsx` — small header showing which target the run hit (user bot vs.
  competitor X) and the phone number that was dialed.
