# components/

Reusable UI, grouped by domain. Keep components small and focused; hooks at the top, logic
in handlers/utils, JSX clean. Material UI + `sx`/styled-components, no raw `<div>`.

## Subfolders

- `agents/` — agent list, agent card, agent form.
- `tests/` — criteria editor, tester-prompt editor.
- `runs/` — run status badge, live run timeline, transcript viewer.
- `scorecard/` — per-criterion verdict list + overall score.
- `benchmark/` — side-by-side platform comparison table/cards.

Remove the `Counter` demo once real components exist.
