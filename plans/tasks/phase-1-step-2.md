# Phase 1 - Step 2: Add Feed Server Action & UI Integration

## Context

* **What can the user do?** The user can enter a URL in the "Add Feed" dialog and have it saved to their subscriptions.

* **Why are we building this?** This is the first data mutation in the app and the foundation for managing personal content sources.

## Prerequisites

* **Auth:** Dev session (`getDevSession()`)
* **Data:** Auth tables (User, Session) already exist.
* **APIs / Services:** External RSS/Atom feeds must be reachable.
* **UI:** "Add Feed" dialog shell (Step 1)
* **Config:** Drizzle and database connection.

## Tech stack decisions

* `fetch` API: for fetching
* `rss-parser`: for parsing feed metadata.
* `zod`: for URL validation.
* `react-hook-form`: for form state.
* `sonner`: for success/error toasts.

## Use cases

* ✅ Valid RSS/Atom URL is fetched, parsed for metadata, and saved.
* ✅ Duplicate subscriptions for the same user are handled (idempotent).
* ✅ Invalid URLs or non-feed URLs are rejected with a clear error message.
* ✅ Timeouts (10s) are handled gracefully.

---

## Subtasks

### Subtask 1: Infrastructure - Schema Update

**Deliverable:** `feeds`, `subscriptions`, and `categories` tables added to the schema and database.
**Touches:** `src/db/schema.ts`

**Todos:**

1. [x] Add `feeds` table to `src/db/schema.ts` following the design in `docs/db-design.md`.
2. [x] Add `subscriptions` table to `src/db/schema.ts` following the design in `docs/db-design.md`.
3. [x] Add `categories` table (minimal version) to `src/db/schema.ts` as it's referenced by subscriptions.
4. [x] Run `bun x drizzle-kit push` to synchronize the database schema.

**Done when:** The database contains the `feeds`, `subscriptions`, and `categories` tables with correct relations.

---

### Subtask 2: Business Logic - Feed Validation and Parsing

**Deliverable:** A Zod schema for input validation and a parser function that fetches basic feed metadata.
**Touches:** `src/lib/validations/feed.ts`, `src/lib/feed/parser.ts`

**Todos:**

1. [x] Create `src/lib/validations/feed.ts` with `addFeedSchema` (validates `url`).
2. [x] Create `src/lib/feed/parser.ts` with `fetchFeedMetadata` using `rss-parser`.
3. [x] Implement a 10s timeout using `AbortController` in `fetchFeedMetadata`.
4. [x] Ensure HTML entities in titles are decoded (as per `GEMINI.md` constraints).

**Done when:** `fetchFeedMetadata` correctly returns title and icon/link for a valid RSS/Atom URL and fails on timeouts or invalid feeds.

---

### Subtask 3: Business Logic - Add Feed Server Action

**Deliverable:** A server action that handles the end-to-end flow of adding a feed.
**Touches:** `src/actions/feed.ts`

**Todos:**

1. [x] Create `src/actions/feed.ts` and implement `addFeedAction`.
    * Use `getDevSession()` to get the current user.
    * Validate input with `addFeedSchema`.
    * Return standardized response `{ success: true, data }` or `{ success: false, error, code }`.
2. [x] Implement logic to check if the feed exists, fetch metadata if not, and then create/ensure a subscription.

**Done when:** Calling `addFeedAction` with a valid URL persists it in the database and returns success.

---

### Subtask 4: UI - Add Feed Dialog Integration

**Deliverable:** Functional "Add Feed" dialog with form handling and feedback.
**Touches:** `src/components/feed/add-feed-dialog.tsx`

**Todos:**

1. [x] Setup `react-hook-form` and `zodResolver` in `AddFeedDialog` and replace the placeholder form with a managed form.
2. [x] Create a custom Tanstack Query hook, use its mutation feature to call `addFeedAction` on submit.
3. [x] Implement loading states (button `disabled` and loading indicator) and reset form and close dialog on success.
4. [x] Integrate `sonner` for success and error notifications.

**Done when:** The user can add a feed through the UI and sees appropriate success/error feedback.

---

### Subtask 5: Tests

**Deliverable:** All tests pass and cover the new functionality.
**Touches:** `src/actions/feed.test.ts`, `e2e/add-feed.spec.ts`

**Todos:**

1. [x] Unit: Test `addFeedAction` branches.
2. [x] Integration: Test behavior, API call and database persistence for `addFeedToUser` service.
3. [x] Integration: Test UI behavior for `add-feed-dialog`.
4. [x] E2E: Playwright test for the full "Add Feed" flow (Sidebar -> Dialog -> Input -> Action -> Success toast).

**Done when:** All tests pass and every test would fail if the logic it targets were deleted.

---

## Final checklist

* [ ] Happy path works end-to-end
* [ ] Errors are handled and displayed appropriately
* [ ] No existing functionality is broken
* [ ] Each subtask produces a standalone commit
* [ ] Env variables / configs documented
* [ ] No sensitive data exposed
* [ ] `bun tsc --noEmit` passes after each subtask before moving to the next
