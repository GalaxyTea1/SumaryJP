# SumaryJP

SumaryJP is a Japanese learning web app focused on vocabulary review, flashcards, test practice, and personal learning progress. The app uses a vanilla JavaScript frontend with an Express/PostgreSQL backend, JWT authentication, admin-only vocabulary management, spaced repetition progress, test history, and automated backend CI.

![SumaryJP preview](frontend/images/og-preview.png)

## Features

- JWT authentication with protected user routes.
- Admin-only vocabulary create, update, and delete operations.
- User-specific vocabulary progress and SRS scheduling.
- Flashcard, review, and test practice flows.
- Test result submission and test history.
- Learning history and weekly goal tracking.
- PWA-ready frontend with offline-aware request queueing.
- Backend unit tests, PostgreSQL integration tests, and GitHub Actions CI.

## Tech Stack

**Frontend**

- HTML, CSS, and vanilla JavaScript modules.
- Tailwind CSS build output.
- Chart.js for statistics.
- Service worker and web manifest for PWA support.

**Backend**

- Node.js and Express.
- PostgreSQL via `pg`.
- JWT authentication.
- SQL migrations with a lightweight migration runner.
- Node.js built-in test runner.

## Project Structure

```text
.
├── backend/
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Auth and admin guards
│   ├── migrations/       # SQL migrations
│   ├── models/           # PostgreSQL queries
│   ├── routes/           # Express routes
│   ├── scripts/          # Migration runner
│   ├── test/             # Unit and integration tests
│   └── server.js         # Express app entry point
├── frontend/
│   ├── components/       # Frontend modules
│   ├── partials/         # HTML partials
│   ├── workers/          # Web worker scripts
│   └── index.html        # Main app shell
├── frontend-v2/          # Legacy/experimental frontend
└── frontend-v3/          # Legacy/experimental frontend
```

## Getting Started

### Prerequisites

- Node.js 20 or newer.
- PostgreSQL 16 or compatible PostgreSQL database.
- npm.

### Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run migrate
npm start
```

The backend runs on `http://localhost:3000` by default.

For Supabase or another hosted PostgreSQL provider, set `DATABASE_URL` in `backend/.env`. For local PostgreSQL, use the `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_PORT` variables.

### Frontend Setup

The main frontend is a static app in `frontend/`.

```bash
cd frontend
npm install
npm run build:css
```

Serve `frontend/index.html` with a static server such as VS Code Live Server. Local frontend requests use `http://localhost:3000/api`.

## Environment Variables

See [backend/.env.example](backend/.env.example).

Important backend variables:

- `JWT_SECRET`: secret used to sign authentication tokens.
- `DATABASE_URL`: full PostgreSQL connection string, useful for Supabase/hosted DB.
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`: local PostgreSQL settings.
- `DB_SSL`: set to `true` for hosted databases that require SSL, `false` for local/CI Postgres.
- `FRONTEND_URL`: allowed frontend origin for CORS.

## Database Migrations

Run migrations from the backend directory:

```bash
npm run migrate
```

The migration runner initializes the base schema and applies `backend/migrations/*.sql` in filename order. Applied migrations are recorded in `schema_migrations`.

## Tests

Run fast unit tests:

```bash
cd backend
npm test
```

Run the full CI test command after configuring a test PostgreSQL database:

```bash
npm run migrate
npm run test:ci
```

GitHub Actions runs backend CI automatically for backend changes. The CI workflow starts a temporary PostgreSQL service, runs migrations, then runs unit and integration tests.

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/vocab`
- `GET /api/vocab/:id`
- `PUT /api/vocab/:id`
- `POST /api/test/submit`
- `GET /api/test/history`
- `GET /api/history`
- `GET /api/history/weekly-goal`

## Notes

- The primary frontend for this repository is `frontend/`.
- `frontend-v2/` and `frontend-v3/` are kept as legacy or experimental versions.
