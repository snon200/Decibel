# Bond ATM

Bond ATM is a full-stack ATM simulation app.
Architecture:

- React + TypeScript frontend
- Node.js + Express + TypeScript backend
- PostgreSQL database accessed through Drizzle ORM

The app lets you create customers and accounts, perform deposits and withdrawals, and view all records in data tables.

Main capabilities:

- Create a person and account in one flow
- Deposit and withdraw funds
- Enforce account active/inactive state
- Enforce daily withdrawal limits
- Track and display transaction history

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop

## 1) Start PostgreSQL

```bash
docker run --name bond-atm-db \
	-e POSTGRES_PASSWORD=postgres \
	-e POSTGRES_DB=bond_atm \
	-p 5432:5432 \
	-d postgres:16
```

## 2) Run backend

```bash
cd backend
```

Create a `.env` file in the `backend/` directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bond_atm
DB_USER=postgres
DB_PASSWORD=postgres
```

Install dependencies, migrations and start:

```bash
npm install
npm run db:migrate
npm run dev
```

## 3) Run frontend

```bash
cd frontend
npm install
npm run dev
```

## Running Tests

```bash
cd backend
npm test
```
