## Project Overview

Read `plans/project-digest.md` if you need to understand what we're building.

### Tech Stack

| Category | Library |
| --- | --- |
| Framework | Next.js 16 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth |
| Design System | shadcn/ui |
| Styling | TailwindCSS v4 |
| Feed parsing | rss-parser |
| Content sanitization | DOMPurify + jsdom |
| Forms | React Hook Form |
| Validation | Zod |
| Async/server state | TanStack Query v5 |
| URL state | nuqs |
| Dates | date-fns |
| Icons | Lucide |

### Project conventions

#### Components

- Default to Server Component with Suspense-driven Client Components.
- A segment MUST ALWAYS include `page.tsx`, `error.tsx` and `loading.tsx` files.
- Interactive components MUST NOT depend on static data passed from Server Components. They MUST BE Client Components that use TanStack Query to fetch and sync their data, using server-prefetch initial data with streaming pattern.

#### State management

| State type | Tool |
| ---- | ---- |
| Server data, async fetching | TanStack Query |
| URL / shareable / filter state | nuqs |
| Client-only ephemeral state | useState |
| Cross-component client state | Context API |
| Form state | React Hook Form + Zod |

- Never use TanStack Query for client-only state.
- Never use Context API for server data.
- Never use useState for URL state.

#### Actions

Server actions are responsible for:

- Input validation (Zod)
- Authentication (getCurrentSession)
- Authorization (ownership checks)
- Delegating to services
- Cache revalidation (revalidatePath, revalidateTag)
- Catch at the boundary, mapping typed errors to response shapes
- Logging

Actions contain no business logic. If an action is doing more than coordinating the above, the logic belongs in a service.

#### Error handling

- All custom error classes live in `lib/errors.ts`.
- Throw typed errors from services and fetcher functions.
  - Catch and map them to response shapes in actions only.
  - Never use string comparison on `error.message` to identify error types — always use `instanceof`.
- Never swallow errors in services or lib functions.
- Never return null to signal failure — throw instead.
- Never block a user flow on a non-critical failure (e.g. email delivery failure should not block sign-up)

#### Testing

You're allowed to extend the configuration if needed. For instance, include MSW handlers, factories, seeding, custom wrappers, etc.

**Stack:**

- Vitest
- React Testing Library
- Mock Service Worker
- PGLite
- Playwright Test

**Rules:**

1. Colocate every test file next to its implementation (e.g. `Button.test.tsx` beside `Button.tsx`).
2. Always use Playwright for testing Server Components and routing.
3. Use custom NPM scripts.
    - Vitest: `bun run test`
    - Playwright: `bun run test:e2e`
4. Wait for hydration with `await page.waitForSelector('body[data-hydrated="true"]');`
