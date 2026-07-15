# Architecture

## Components

- Default to Server Component with Suspense-driven Client Components, using the server-prefetch + streaming pattern.
- Every route segment **must** include `page.tsx`, `error.tsx`, and `loading.tsx`.
- Interactive components must **not** depend on static data passed from Server Components. They must be Client Components that use TanStack Query to fetch and sync their data.

## State Management

| State type | Tool |
| ---------- | ---- |
| Server data, async fetching | TanStack Query |
| URL / shareable / filter state | nuqs |
| Client-only ephemeral state | useState |
| Cross-component global state | Zustand |
| Form state | React Hook Form + Zod |

- Never use TanStack Query for client-only state.
- Never use Zustand for server data.
- Never use useState for URL state.

## Backend-for-frontend

Our BFF is build with Server Actions and Route Handlers. They are responsible for:

- Input validation (Zod)
- Authentication (`getCurrentSession`)
- Authorization (ownership checks)
- Delegating to services
- Catching at the boundary and mapping typed errors to response shapes
- Logging

They contain **no business logic**. If an action/handler does more than coordinate the above, the logic belongs in a service.

## Error Handling

- All custom error classes live in `lib/errors.ts`.
- Throw typed errors from services and fetcher functions; catch and map them to response shapes in actions/handler layer only.
- Never use string comparison on `error.message` to identify error types — always use `instanceof`.
- Never swallow errors in services or lib functions.
- Never return `null` to signal failure — throw instead.
- Never block a user flow on a non-critical failure (e.g. an email delivery failure must not block sign-up).
