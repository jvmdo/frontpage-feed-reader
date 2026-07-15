# Testing Guide

## Philosophy

Follow the **Test Trophy** philosophy (Kent C. Dodds): prefer integration tests over unit tests for both UI and server layers.

**Test your logic, not the libraries.** Before writing any test, apply this filter: "If I deleted my code and kept only the libraries, would this test still pass?" If yes, the test has no value — discard it.

**Test decisions, not operations.** Test only what YOUR code decides — never what the libraries already battle-test:

- Auth guards: who is allowed to perform this action?
- Ownership: can this user affect this resource?
- Business rules: what is explicitly enforced in this codebase?
- Input validation: what does the Zod schema reject?
- Branching logic: what happens on each code path?
- Component logic: how to I get React to render what I want to?
- Edge cases.

**Assert on outcomes.** Assert on the final state of the system, not just the "success" property of a function call.

**Never patch a test to make it pass.** When a test fails, fix the implementation. If the test itself is wrong, explain why before changing it. A passing suite with weakened assertions is a broken suite.

Always use Playwright for testing Server Components and routing — RTL cannot render them.

## Test Boundaries

| Layer | Tools | Scope |
| ----- | ----- | ----- |
| Unit | Vitest | Isolated business logic |
| UI Integration | RTL + MSW (or explicit Actions mock) | Component behavior, state transitions, data fetching/mutations |
| Server Integration | Vitest + PGLite | Function behavior, code branches, DB queries/mutations |
| E2E | Playwright | Full user flows |

## File Organization

- Colocate every test file next to its implementation (e.g. `Button.test.tsx` beside `Button.tsx`).
- E2E test are placed in `e2e/` directory.

## Basic Rules

- **Services integration**: use database fixtures (`src/tests/test-extend.ts`) — do not mock the database.
- **UI integration**: use `src/tests/rtl-utils.tsx` by default.
- **E2E**: use `e2e/fixtures/test-extend.ts` by default.
- Mocks are allowed only when they would not degrade test confidence.
- Reuse "seeding" and "factories" for mock data.
- The test configuration may be extended as needed (MSW handlers, factories, seeding, custom wrappers, etc.).

## Playwright — Hydration

Wait for full hydration before asserting on rendered output:

```ts
await page.waitForSelector('body[data-hydrated="true"]');
```

## Playwright MCP — Isolated Sessions

For E2E tests run via the Playwright MCP tool, follow this workflow to maintain full isolation:

### 1. Build and Start

```bash
bun run build
```

```bash
bun run start
```

```bash
bun run serve -p 3432 ./e2e/fixtures
```

### 2. Create an Isolated Session

Inject a unique `userId` into the request headers. The development server detects this and creates a temporary, isolated user automatically.

### 3. Add Tenant-Scoped Feeds

Add feeds using the local fixture server. Always append the `tenant` query parameter so the cleanup script can identify them later:

```bash
http://localhost:3432/rss-2.xml?tenant=unique-id-123
```

You may use real feed providers if local fixtures are insufficient.

### 4. Teardown

Run the cleanup script with your unique ID:

```bash
bun test:cleanup unique-id-123
```
