# controllers/runs/

Express router for runs. Thin — delegates to `bl/runs`.

- `GET /runs/:id` — run status + transcript + `audio_url` + scorecard. The dashboard
  polls this until the run is terminal.

(Starting runs lives in `controllers/suite/`: `POST /tests/:id/run` and
`POST /agents/:id/run-suite`.)
