# components/

Reusable UI, grouped by domain. Keep components small and focused; hooks at the top, logic
in handlers/utils, JSX clean. Material UI + `sx`/styled-components, no raw `<div>`.

## Subfolders

- `agents/` — agent list, agent registration form (phone + description), agent card.
- `suite/` — generated test suite list, test card, test editor, run-suite button.
- `runs/` — run status badge, live timeline, transcript viewer, audio player.
- `scorecard/` — per-criterion verdict list + overall score.
- `comparison/` — user-bot vs competitor side-by-side scorecard; provision-competitor dialog.

Remove the `Counter` demo once real components exist.
