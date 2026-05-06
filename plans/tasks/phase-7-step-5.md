# Phase 7 Step 5: Multi-tenant Hardening

## Context

* **What can the user do?** Users should only be able to interact with their own data (feeds, categories, read states, preferences).
* **Why are we building this?** To ensure data privacy and prevent Insecure Direct Object Reference (IDOR) vulnerabilities in a multi-user environment.

## Prerequisites

* **Auth:** Proxy-based auth guard implemented and verified.
* **Logic:** All core features (Feeds, Categories, Reading) implemented in single-user mode.

## Tech stack decisions

* **Verified Session Identity**: Every Server Action MUST derive the `userId` from `getCurrentSession()`, never from client-provided input.
* **Strict Scoping**: Every database query affecting user-specific tables (`subscriptions`, `categories`, `user_item_states`, `user_preferences`) MUST include a `userId` filter.
* **Zero Trust Actions**: Actions should not trust that a provided `id` (e.g., `categoryId`) belongs to the user without verifying ownership.

## Use cases

* ✅ User A cannot see User B's categories or subscriptions.
* ✅ User A cannot delete or rename User B's categories.
* ✅ User A cannot mark User B's items as read.
* ✅ User A cannot access raw item data for a feed they are not subscribed to (if we decide to enforce subscription-based access to items).

---

## Subtasks

### Subtask 1: Audit and Secure Service Layer

**Deliverable:** A hardened service layer where every user-specific query is strictly scoped.
**Touches:** `src/services/**/*`

**Todos:**

1. [x] Perform a global search for all `db.select`, `db.insert`, `db.update`, and `db.delete` calls.
2. [x] Ensure all queries against `subscriptions`, `categories`, `user_item_states`, and `user_preferences` include `eq(table.userId, userId)`.
3. [x] Refactor `deleteCategory` and similar services to use efficient single-step filtered deletes (checking returned rows) instead of "fetch then delete".
4. [x] Verify that item-level fetches (`getItem`) correctly join with `subscriptions` to ensure the user has access to that feed.

**Done when:** No query in the service layer can affect data belonging to a different user.

---

### Subtask 2: Audit and Secure Action Layer

**Deliverable:** Server Actions that strictly use session identity and handle unauthorized access.
**Touches:** `src/actions/**/*`

**Todos:**

1. [x] Audit all files in `src/actions/` to ensure they call `await getCurrentSession()`.
2. [x] Remove any `userId` parameters from Action input schemas (Zod). All IDs must come from the session.
3. [x] Ensure proper error mapping for `NotFoundError` (which often implies an IDOR attempt where the resource exists but belongs to someone else).

**Done when:** All actions derive user identity from the verified session cookie.

---

### Tests: Data Isolation Verification

**Deliverable:** A dedicated suite of isolation tests that attempt to breach user boundaries.
**Touches:** `e2e/data-isolation.spec.ts`

**Todos:**

1. [x] Create `e2e/data-isolation.spec.ts`.
2. [x] Implement a test scenario:
    * Create User A and User B.
    * User A creates a category "Private A".
    * User B attempts to fetch/update/delete "Private A" using its ID.
    * Verify that User B receives a 404 or Unauthorized error.
3. [x] Implement a test scenario for feed items:
    * Verify User B cannot mark User A's subscription as read.
4. [x] Run all tests in parallel to ensure no leakage occurs under load.

**Done when:** All isolation tests pass, proving that data boundaries are strictly enforced.

---

## Final checklist

* [x] Every user-facing action is secured by session identity.
* [x] No data leakage between users is possible via IDOR.
* [x] Service layer is optimized for multi-tenant queries.
* [x] `bun tsc --noEmit` passes.
* [x] All E2E isolation tests pass.
