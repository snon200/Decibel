# controllers/runs/

Express router for runs. Thin — delegates to `bl/runs`.

- `POST /tests/:id/run` — start a run (places the outbound call), returns the run id +
  initial status.
- `GET /runs/:id` — run status + transcript + scorecard. The dashboard polls this until
  the run is terminal.
