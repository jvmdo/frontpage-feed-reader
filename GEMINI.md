## Tech Stack

All libraries are already installed. Do not install anything not listed here without being explicitly asked.

| Category | Library |
| --- | --- |
| Framework | Next.js 16 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth |

### Where to find libraries setup files

- Drizzle
  - Configuration: drizzle.config.ts
  - Migrations: drizzle/*
  - Client and schemas: src/db/*

- Better Auth
  - API: src/app/api/auth/[...all]/route.ts
  - Configuration: src/lib/auth.ts
  - Client: src/lib/auth-client.ts

## Installed Documentation

When working with these technologies, read the corresponding skill for detailed reference:

- Drizzle ORM: .agents/skills/drizzle-orm-patterns/SKILL.md

<!-- BEGIN:nextjs-agent-rules -->
### This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
