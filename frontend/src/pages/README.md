# pages/

Routed top-level views — one component per screen. Pages compose components from
`components/`, fetch via `hooks/`, and own layout/routing only (no heavy logic).

## Pages

- `AgentsPage.tsx` — list Agents Under Test + register a new one (phone + description).
- `AgentDetailPage.tsx` — one AUT: its description, its generated suite, run-suite
  button, and recent run history. Editing the description offers "regenerate suite."
- `RunDetailPage.tsx` — one finished run: status, transcript, audio player, scorecard
  with per-criterion justifications.
- `ComparisonPage.tsx` — "test the competitors": provision a competitor, run the suite
  against it, view a side-by-side scorecard vs the user's bot.

Built from scratch with Material UI; use `<Box>` and `sx`, no raw `<div>`.
