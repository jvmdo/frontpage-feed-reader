# Frontpage

A customizable RSS/Atom feed aggregator built with Next.js 16.

For a deep understanding of what we're building, read `docs/agents/project-digest.md`.

## Tech Stack

| Category | Library |
| -------- | ------- |
| Framework | Next.js 16 |
| Backend | Next.js Routes + Actions |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth |
| UI library | React.js 19 |
| Design System | shadcn/ui |
| Styling | TailwindCSS v4 |
| Feed parsing | rss-parser |
| Content sanitization | DOMPurify + jsdom |
| Forms | React Hook Form 7 |
| Validation | Zod 4 |
| Global client state | Zustand 5 |
| Async/server state | TanStack Query 5.4 |
| URL state | nuqs 2 |
| Dates | date-fns |
| Icons | Lucide |
| Scheduled Tasks | Trigger.dev |
| Emails | Resend |
| Type-safe env | t3-oss |

## Environment

| | |
| --- | --- |
| Package manager | `bun` — never `npm` or `yarn` |
| Dev server | `bun run dev` |
| Build | `bun run build` |
| Tests (Unit/Integration) | `bun run test` (Vitest) |
| Tests (E2E) | `bun run test:e2e` (Playwright) |
| Type check | `bun run type-check` |
| Format | `bun run format` |

## Agent Guidelines

Read these when the task requires it:

- [Agent Mindset](docs/agents/agent-mindset.md) — planning, reading before writing, fixing at source
- [Coding Conventions](docs/agents/coding-conventions.md) — HTML, CSS, Tailwind, TypeScript, React, Next.js
- [Architecture](docs/agents/architecture.md) — components, state management, Actions, error handling
- [Testing Guide](docs/agents/testing-guide.md) — philosophy, boundaries, RTL, and Playwright MCP sessions
