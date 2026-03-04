# Bookmark Vault (TypeScript + PostgreSQL + OAuth)

## What changed
- TypeScript backend (`server/*.ts`)
- PostgreSQL persistence
- Docker Compose for app + Postgres
- OAuth login with Google or GitHub (no password storage)

## Quick start with Docker Compose

1. Copy `.env.example` to `.env` and set OAuth variables if you want social login.
2. Start stack:

```bash
docker compose up --build -d
```

3. Open:
- Dashboard: `http://localhost:3001/`
- Login page: `http://localhost:3001/register`
- Public server login page: `http://66.179.137.126:3001/register`

To stop:

```bash
docker compose down
```

## OAuth setup

Set these in `.env` (or deployment env vars):

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
```

For deployment at `http://66.179.137.126:3001`, callbacks should be:
- `http://66.179.137.126:3001/auth/google/callback`
- `http://66.179.137.126:3001/auth/github/callback`

## Local non-OAuth fallback

`ALLOW_LOCAL_FALLBACK=true` allows local testing even if OAuth keys are not set.
Set `ALLOW_LOCAL_FALLBACK=false` in production to require login.

## API auth endpoints

- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/github`
- `GET /auth/github/callback`
- `GET /api/me`
- `POST /api/logout`

## Notes

- The API binds to `0.0.0.0` by default.
- Database schema is auto-created/migrated at startup.
