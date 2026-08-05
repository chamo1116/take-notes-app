# take-notes-app

A full-stack notes application: a Django REST Framework API backend and a Next.js frontend, backed by PostgreSQL.

**Live app:** https://take-notes-app-rmfz-nine.vercel.app/login

## Stack

- **Backend:** Django 5.2 + Django REST Framework, JWT auth via `djangorestframework-simplejwt`, PostgreSQL (via `psycopg`), managed with `uv`.
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS, managed with `pnpm`.
- **Database:** PostgreSQL 16.
- **Deployment:** Vercel, as two bound services (frontend + backend) behind a single domain.

## Additional Features

- **Notes CRUD**, scoped per-user, with autosave (fires 1s after the last keystroke, via `PATCH`/`POST` in [`frontend/app/dashboard/NoteEditor.tsx`](frontend/app/dashboard/NoteEditor.tsx)) and delete (two-click confirm in the same editor).
- **Categories** — four fixed categories with a color-coded filter sidebar and live per-category counts (`GET /api/v1/notes/category-counts`), computed with a single `Count()` aggregation ([`backend/notes/views.py`](backend/notes/views.py)) rather than one query per category.
- **Search** — case-insensitive search across title and body (`?search=`, DRF's `SearchFilter`), debounced 400ms client-side so it doesn't fire a request per keystroke.
- **Infinite scroll** — paginated at 6 notes/page, with an `IntersectionObserver` sentinel that fetches the next page as it scrolls into view.
- **Grid/list view toggle** for the notes list.
- **Loading and failure states** — a visible indicator while a filter/search/scroll fetch is in flight, and an error banner if it fails, instead of failing silently.
- **Query optimization:** a composite index on `Note(user, -updated_at)` ([`backend/notes/models.py`](backend/notes/models.py)) matches the list endpoint's filter (`user=`) and sort (`-updated_at`) exactly, so Postgres can satisfy both in a single index scan instead of a filter-then-sort.

## How this repo was built

Development started from two Claude Code skills — [`django-expert`](.claude/skills/django-expert/SKILL.md) and [`nextjs-expert`](.claude/skills/nextjs-expert/SKILL.md) — checked into `.claude/skills/`, which encode this project's conventions for DRF API design and Next.js App Router structure. Every feature was implemented against those conventions rather than against ad hoc choices per feature, which is why the backend and frontend each look internally consistent (settings split by environment, server actions for all API calls, etc).

Structurally identical flows share one component rather than being duplicated per page: [`AuthForm`](frontend/components/AuthForm.tsx) and [`AuthLayout`](frontend/components/AuthLayout.tsx) back both the login and signup pages (each page just supplies its action, labels, and hero image), and [`CategorySwatch`](frontend/app/dashboard/CategorySwatch.tsx) is the single source for the category dot-plus-name pairing used by both the category dropdown and the sidebar filter list.

On top of that baseline, the project applies a set of good practices enforced in CI (`.github/workflows/ci.yml`) rather than left to convention:

- **Backend:** `ruff` (lint + format), `mypy --strict` (with `django-stubs`), `pytest` with **90% coverage enforced** (`--cov-fail-under=90`), and `pip-audit` for dependency vulnerabilities.
- **Frontend:** ESLint (including `eslint-plugin-jsx-a11y` for accessibility), `tsc --noEmit`, Vitest + React Testing Library for unit/component tests, Playwright for e2e, and `pnpm audit` for dependency vulnerabilities.

Both suites run on every push and pull request to `main`.

## Security decisions

- **JWT auth, never exposed to client JS.** The API issues short-lived access tokens (15 min) and rotating refresh tokens (7 days, `ROTATE_REFRESH_TOKENS`). The frontend never stores them in `localStorage` or hands them to the browser — Next.js Server Actions call the Django API and store the tokens as `httpOnly`, `sameSite=lax` cookies ([`frontend/lib/session.ts`](frontend/lib/session.ts)), so they're inaccessible to XSS.
- **Rate limiting on auth endpoints.** Login and signup are throttled to 5 requests/minute per client (`ScopedRateThrottle`) to blunt credential-stuffing and account-enumeration attempts.
- **CORS scoped to the API surface only.** The frontend talks to the backend server-to-server (Server Actions), not from the browser, so `CORS_URLS_REGEX` restricts CORS handling to `/api/*` rather than the whole app, keeping the admin and browsable API out of it.
- **Environment-split Django settings** (`config/settings/{base,dev,prod}.py`): production forces `DEBUG = False`, `SECURE_SSL_REDIRECT`, and secure cookies (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`), none of which are relaxed in dev by accident since they simply don't exist in `base.py`.
- **Trusted-proxy handling for Vercel's internal network.** A custom [`TrustInternalServiceMiddleware`](backend/config/middleware.py) marks requests arriving over Vercel's private service-binding hostname as secure before `SecurityMiddleware` runs, since that internal path never carries the `X-Forwarded-Proto` header Django normally relies on (see [Challenges](#challenges-along-the-way) below).
- **Dependency scanning in CI** for both `uv`/pip packages (`pip-audit`) and npm packages (`pnpm audit --audit-level=high`), so vulnerable dependencies fail the build rather than ship silently.

## Setup

### Prerequisites

- Docker and Docker Compose (recommended path — see below), **or**
- Python 3.12+ with [`uv`](https://docs.astral.sh/uv/), Node.js 22+ with `pnpm` (via corepack), and a local PostgreSQL 16 instance, if you'd rather run things natively.

### Environment variables

Both services read from a local `.env` file; example files are provided:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend (`backend/.env`): `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_HOST`, `DB_PORT`, `CORS_ALLOWED_ORIGINS`.

Frontend (`frontend/.env`): `API_BASE_URL` (points at the backend; under Docker Compose this is `http://backend:8000`, since containers reach each other by service name, not `localhost`).

## Run commands

### With Docker (recommended)

```bash
docker compose up --build
```

This starts three services: `db` (Postgres, with a healthcheck gating startup), `backend` (Django on `:8000`, running `entrypoint.sh` which waits for the database and applies migrations before serving), and `frontend` (Next.js dev server on `:3000`). Source is bind-mounted into both app containers, so edits on the host are picked up live.

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

Useful variants:

```bash
docker compose up --build -d      # detached
docker compose logs -f backend    # tail one service's logs
docker compose exec backend python manage.py createsuperuser
docker compose down                # stop (add -v to also drop the pgdata volume)
```

### Without Docker

Backend:

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

### Tests and checks

Backend:

```bash
cd backend
uv run ruff check . && uv run ruff format --check .
uv run mypy .
uv run pytest --cov=accounts --cov=notes --cov-report=term-missing
```

Frontend:

```bash
cd frontend
pnpm lint
pnpm typecheck
pnpm test           # Vitest unit/component tests
pnpm e2e             # Playwright end-to-end tests
```

## Deployment

The app is deployed on Vercel at **https://take-notes-app-rmfz-nine.vercel.app/login**, configured via [`vercel.json`](vercel.json) as two bound services under one domain: the `frontend` (Next.js) and `backend` (Django, served through its WSGI entrypoint) projects, with `frontend` given a runtime binding to `backend` that injects `API_BASE_URL` automatically, plus a rewrite so `/static/*` is served by the backend.

Database migrations are not run on every deploy: [`backend/build.py`](backend/build.py) (wired up as `[tool.vercel.scripts].build`) only runs `migrate` when `VERCEL_ENV == "production"`, so preview deployments — which don't have and shouldn't need production database credentials — skip it rather than risk repeated `migrate` runs against a shared database from every preview branch.

## Challenges along the way

- **TLS termination on Vercel's internal network.** Vercel terminates TLS at the edge and forwards to the backend function over plain HTTP, so Django's `request.is_secure()` needs `SECURE_PROXY_SSL_HEADER` pointed at `X-Forwarded-Proto` to know a request was actually HTTPS. That header is set by the public edge — but the frontend-to-backend service binding is a private, internal-only path that never passes through it, so `SECURE_SSL_REDIRECT` saw those calls as insecure and redirect-looped them forever. Fixed with `TrustInternalServiceMiddleware` (see above), which trusts the internal `*.services.vercel-infra.com` hostname specifically and forges the header before `SecurityMiddleware` runs.
- **Env vars resolved at runtime, not build time.** `API_BASE_URL` comes from Vercel's service binding, which only resolves once the function is actually invoked — not while Next.js is building. Validating it eagerly at module load broke the entire build, because Next.js evaluates every page's module graph during "Collecting page data." The fix ([`frontend/env.ts`](frontend/env.ts)) validates lazily on first use inside a request instead.
- **Double slashes in constructed API URLs.** Vercel's service-binding URL is an absolute base that may already end in `/`; naively concatenating a leading-slash path produced `https://host//api/...`, which Django's router silently failed to match. `apiUrl()` normalizes to exactly one slash regardless of either side.
- **CORS wildcard vs. Django's system checks.** `django-cors-headers` validates every `CORS_ALLOWED_ORIGINS` entry as a full scheme+netloc origin, so a bare `"*"` fails Django's checks outright — wildcarding is a separate setting (`CORS_ALLOW_ALL_ORIGINS`). Settings translate a `"*"` env value into that flag rather than relying on whoever sets the env var to know the distinction.
- **Keeping coverage honest under `mypy --strict`.** `factory-boy` ships no type stubs, so anything using its DSL is unavoidably untyped. Rather than loosen `mypy --strict` project-wide, the override is scoped to just the test modules that use factories.
