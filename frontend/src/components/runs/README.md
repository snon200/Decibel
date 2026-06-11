# components/runs/

UI for a test run.

- `RunStatusBadge.tsx` — colored status (`dialing` / `in_progress` / `completed` / `failed`).
- `RunTimeline.tsx` — live progress while the call happens (driven by polling `useRun`).
- `TranscriptViewer.tsx` — the call transcript, role-formatted.
