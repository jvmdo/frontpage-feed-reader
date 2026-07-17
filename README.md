# Frontpage

A customizable RSS/Atom feed aggregator. Subscribe to any RSS or Atom feed, organize them into categories, and read articles in a clean, distraction-free reader.

## Getting Started

### Prerequisites

| Tool | Version | Notes |
| ---- | ------- | ----- |
| [Bun](https://bun.sh) | Latest | Package manager and runtime |
| [Docker](https://www.docker.com) | Latest | For the local PostgreSQL instance |

---

### 1. Install dependencies

```bash
bun install
```

---

### 2. Set up environment variables

`.env` is gitignored. Copy the example file:

```bash
cp .env.test .env
```

Then open `.env` and fill in the required values:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (default points to local Docker instance) |
| `BETTER_AUTH_SECRET` | ✅ | A random secret string for Better Auth. Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | The base URL of the app locally. Keep it as `http://localhost:3000` |
| `GITHUB_CLIENT_ID` | ☑️ Optional | GitHub OAuth app client ID (for GitHub sign-in) |
| `GITHUB_CLIENT_SECRET` | ☑️ Optional | GitHub OAuth app client secret |
| `RESEND_API_KEY` | ☑️ Optional | Resend API key (for password reset emails) |
| `TRIGGER_SECRET_KEY` | ☑️ Optional | Trigger.dev secret key (for background feed refresh tasks) |

> [!NOTE]
> The mock values in `.env.test` are safe to use for local development if you don't need GitHub OAuth, email, or background tasks.

---

### 3. Start the local database

The default `DATABASE_URL` in `.env.test` expects a PostgreSQL instance at `localhost:5432`. Start one with Docker:

```bash
docker run -d \
  --name frontpage-db \
  -e POSTGRES_USER=frontpage \
  -e POSTGRES_PASSWORD=frontpage \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  postgres
```

---

### 4. Run database migrations

```bash
bun run db:migrate
```

This applies all pending SQL migrations from the `drizzle/` folder to the local database.

---

### 5. Seed the database

```bash
bun run db:seed
```

This populates the `feeds` table with the curated set of sample feeds used by the **Try as Guest** experience. It also pre-warms those feeds by fetching their latest articles.

> [!IMPORTANT]
> Seeding is required for the "Try as Guest" flow to work. Without it, anonymous sign-in will fail with a `CuratedFeedsMissingError`.

---

### 6. Start the development server

```bash
bun run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Running Tests

### Unit & Integration tests (Vitest)

Uses PGLite — no real database required.

```bash
bun run test
```

### E2E tests (Playwright)

Requires a running production build and a seeded database (steps 3–5 above).

```bash
# Build the app first
bun run build

# Then run E2E tests
bun run test:e2e
```

> [!NOTE]
> The Playwright config starts the app on port `3321` and spins up a local fixture server automatically. A running database is still required.

---

## Background Tasks (Trigger.dev)

Feed refresh runs on a background worker via [Trigger.dev](https://trigger.dev). For local development you can skip this — feeds are refreshed on-demand when you add them.

To run the Trigger.dev dev server locally, set `TRIGGER_SECRET_KEY` in `.env` to your Trigger.dev dev environment secret key, then run:

```bash
bun x trigger.dev dev
```
