# pages/

Routed top-level views — one component per screen. Pages compose components from
`components/`, fetch via `hooks/`, and own layout/routing only (no heavy logic).

## Pages

- `AgentsPage.tsx` — list Agents Under Test + create a new one.
- `AgentDetailPage.tsx` — one AUT: its prompt, its tests, and a button to author/run a test.
- `TestRunPage.tsx` — author a test (intent + criteria), generate/edit the tester prompt,
  run it, and watch live status → transcript → scorecard.
- `BenchmarkPage.tsx` — configure + view "Us vs competitors": same test across
  Dial/VAPI/ElevenLabs with a side-by-side scorecard.

Built from scratch with Material UI; use `<Box>` and `sx`, no raw `<div>`.
