# GymOS Backend

White-label, multi-tenant gym management REST API. Node.js + Express + Supabase (PostgreSQL).

Every tenant is a **gym**; all data (except the `gyms` table) is scoped by `gym_id`, which is always read from the authenticated JWT — never from the request body.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** JWT (`{ member_id, gym_id, role }`)
- **Push:** OneSignal (server-side dispatch)
- **Payments:** Wawa Tickets (placeholder until API docs arrive)
- **Scheduled jobs:** node-cron

## Project Layout

```
src/
  routes/        Express route definitions (/api/v1/*)
  controllers/   Request handlers (HTTP in/out only)
  services/      Business logic (no Express objects)
  middleware/    auth, gym scoping, role checks, validation, error handling
  cron/          Scheduled jobs (renewals, no-shows, streaks, churn)
  utils/         Helpers (barcode, QR, dates)
supabase/migrations/   Numbered SQL migrations
config/gym-config.js   Per-gym white-label feature flags
docs/api.md            Full API contract (frontend builds against this)
tests/                 Unit + integration + load tests
```

## Setup

```bash
npm install
cp .env.example .env   # fill in secrets
npm run dev
```

### Migrations

Migrations live in `supabase/migrations/`, numbered and applied in order. Apply with the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

CI applies migrations to staging automatically on push to `staging`.

## Multi-Tenancy

- `gym_id` comes from the JWT, set by `authenticate` middleware → `req.user.gym_id`.
- Every query filters by `gym_id`; `withGym(gymId)` sets the per-request RLS context.
- RLS policies on every table backstop isolation for non-service-role connections.

## Roles

`member` < `front_desk` / `trainer` < `manager` < `owner`. Enforced via `requireRole(...roles)`.

## API

See [`docs/api.md`](docs/api.md) for the full endpoint contract. All routes are prefixed `/api/v1/`.

## Environment Variables

See [`.env.example`](.env.example).
