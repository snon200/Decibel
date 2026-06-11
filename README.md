# Dial

Management system for AI voice agents, built for the Dial Hackathon.

Architecture:

- React + TypeScript frontend (Vite)
- Node.js + Express + TypeScript backend
- PostgreSQL database accessed through Drizzle ORM

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop

## 1) Start PostgreSQL

```bash
docker run --name dial-db \
	-e POSTGRES_PASSWORD=postgres \
	-e POSTGRES_DB=dial_hackathon \
	-p 5432:5432 \
	-d postgres:16
```

A `.env` file is already checked into `backend/` with defaults that match this container (host `localhost`, port `5432`, user/password `postgres`, db `dial_hackathon`). Override any of those values if your setup differs.

## 2) Run backend

```bash
cd backend
npm install
npm run db:migrate
npm run dev
```

Server listens on http://localhost:3000. Verify with:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Notes:

- `npm run db:migrate` is a no-op until you add Drizzle schemas under `src/database/schemas/` and generate migrations.
- `npm run db:generate` — generate a new migration after editing schemas.

## Tests

Backend tests use Node's built-in test runner (`node:test` + `node:assert`) executed through `tsx`.

```bash
cd backend
npm test
```

Conventions:

- Test files are colocated next to the code they cover and named `*.test.ts`.
- The script picks up anything matching `src/**/*.test.ts`.

A sample lives at `backend/src/bl/example.test.ts` — use it as a template, then delete it once you have real tests. Minimal shape:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("my feature", () => {
	it("does the thing", () => {
		assert.equal(1 + 1, 2);
	});
});
```

## 3) Run frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves at http://localhost:5173.

## Project structure

```
backend/
  src/
    bl/           # Business logic
    controllers/  # Express route handlers
    dal/          # Data access layer
    database/
      schemas/    # Drizzle table schemas (add new tables here)
      data-source.ts
      migrate.ts
    index.ts      # App entrypoint (Express)
  drizzle.config.ts
frontend/
  src/
    components/   # React components
    App.tsx       # Root component
    api.ts        # HTTP client (apiGet / apiPost)
    main.tsx      # Entrypoint
    types.ts      # Shared types
  index.html
  vite.config.ts
```

## Adding a feature

A typical feature lands in four places:

1. **`backend/src/database/schemas/<name>.ts`** — define the Drizzle table, re-export from `schemas/index.ts`, then `npm run db:generate && npm run db:migrate`.
2. **`backend/src/dal/<name>.ts`** — query helpers over the Drizzle table.
3. **`backend/src/bl/<name>.ts`** — business logic that the controllers call.
4. **`backend/src/controllers/<name>/index.ts`** — Express router; mount it in `src/index.ts` with `app.use("/<name>", router)`.

On the frontend, add a component under `frontend/src/components/`, wire calls through `api.ts`, and render it from `App.tsx`.
