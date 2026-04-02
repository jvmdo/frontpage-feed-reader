# Subtask: short, descriptive name

## Context

* **What can the user do?** one sentence

* **Why are we building this?** one sentence

## Prerequisites

* **Auth:** required auth state — e.g. none, authenticated user
* **Data:** tables, schemas, or seed data that must exist
* **APIs / Services:** internal endpoints or external services that must be reachable
* **UI:** pages, layouts, or components that must already exist
* **Config:** environment variables, connections, or test setup

## Tech stack decisions

Only add entries here if this subtask introduces a library or pattern not already in the project stack. Otherwise leave blank.

## Use cases

* ✅ what should work

* ❌ what should be rejected/handled

---

## Subtasks

### Subtask 1: name

**Deliverable:** one sentence — what works when this is done
**Touches:** files or layers affected

**Todos:**

1. [ ] concrete action 1
2. [ ] concrete action 2
...
N. [ ] concrete action N

**Done when:** specific, verifiable condition that closes this subtask

---

### Subtask N: name

**Deliverable:** one sentence — what works when this is done
**Touches:** files or layers affected

**Todos:**

1. [ ] concrete action 1
2. [ ] concrete action 2
...
N. [ ] concrete action N

**Done when:** specific, verifiable condition that closes this subtask

---

### Tests: Brief description

**Deliverable:** all tests pass and every test would fail if the logic it targets were deleted.
**Touches:** `*.test.ts`, `*.test.tsx`, `/e2e/`

**Todos:**

1. [ ] Unit: isolated business logic (auth guards, ownership, business rules, Zod schema decisions).
2. [ ] UI Integration (RTL + MSW): correctly renders and work together, form submission, error display, state transitions, reactivity — only for logic you wrote.
3. [ ] Server Integration (Vitest + PGLite): functions behavior, code branches for logic you wrote, db queries and mutations. — only for logic you wrote.
4. [ ] E2E (Playwright): full user flows and server component output.

**Done when:** all tests pass and every test would fail if the logic it targets were deleted

---

## Final checklist

* [ ] Happy path works end-to-end
* [ ] Errors are handled and displayed appropriately
* [ ] No existing functionality is broken
* [ ] Each subtask produces a standalone commit
* [ ] Env variables / configs documented
* [ ] No sensitive data exposed
* [ ] `bun tsc --noEmit` passes after each subtask before moving to the next
