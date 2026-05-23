# Stretch 16: Auto-Refresh and Polling (Trigger.dev Edition)

## Context

* **What can the user do?** Configure an auto-refresh interval (15m, 30m, 1h, or manual) and see a "New items available" notification when fresh content is fetched in the background.

* **Why are we building this?** To keep content fresh without manual reloads while staying strictly within the free tier limits of our services (DB, Trigger.dev, and Vercel).

## Prerequisites

* **Auth:** Authenticated user (required to save interval preferences).
* **Data:** `feeds` table (needs `http_etag` and `http_last_modified`), `user_preferences` table (needs `refresh_interval`).
* **APIs / Services:** Trigger.dev v4 account and API keys.
* **UI:** Dashboard feed list and navigation sidebar.
* **Config:** `TRIGGER_SECRET_KEY`, `DATABASE_URL`, and `NEXT_PUBLIC_DEFAULT_REFRESH_INTERVAL` set in environment.

## Tech stack decisions

* **Trigger.dev v4:** For consumption-based background tasks (better free tier than Vercel Cron).
* **Adaptive Polling:** Global feed aggregation to fetch each unique URL only once per required interval.
* **Conditional GET:** Mandatory use of `ETag` and `Last-Modified` to skip redundant processing.
* **Sticky Toolbar Notification:** The "New Items" banner is rendered in the fixed `FeedToolbar` to prevent Virtuoso scroll jitters and provide a true sticky header.
* **Better Auth Hooks:** Centralized initialization of preferences using database hooks to ensure data consistency for all signup methods.

## Use cases

* ✅ Feed content updates in the background every 15, 30, or 60 minutes.
* ✅ UI shows a non-disruptive banner when new items are available.
* ✅ User can change refresh frequency in a dedicated Settings page.
* ✅ App uses minimal bandwidth by skipping unchanged feeds (304 Not Modified).
* ✅ Background refresh should NOT happen for feeds with only "Manual Only" subscribers.

---

## Subtasks

### Subtask 1: ETag & Last-Modified Optimization

**Deliverable:** Conditional fetching implemented to save bandwidth and processing power.
**Touches:** `src/services/ingestion/fetch-feed-xml.ts`, `src/services/ingestion/feed-ingestion.ts`

**Todos:**

1. [x] Update `fetchFeedXml` to support `If-None-Match` and `If-Modified-Since` headers.
2. [x] Catch `304 Not Modified` in `fetchFeedXml` and return a specialized `not_modified` status result.
3. [x] Update `ingestItems` to retrieve caching headers from the `feeds` table and pass them to the fetcher.
4. [x] Handle the `304` response in `ingestItems` by only updating `lastFetchedAt` and `lastSuccessAt`.
5. [x] Ensure `200` responses correctly save new `ETag` and `Last-Modified` values to the database.

**Done when:** Running `ingestItems` twice for an unchanged feed results in a 304 response and no new items are parsed.

---

### Subtask 2: Global Refresh Service & Trigger.dev Setup

**Deliverable:** A background worker that intelligently refreshes overdue feeds.
**Touches:** `src/services/feed/refresh-stale-feeds.ts`, `src/trigger/refresh-task.ts`, `trigger.config.ts`, `src/lib/feed/sanitizer.ts`

**Todos:**

1. [x] Install `@trigger.dev/sdk@v4` and initialize the configuration.
2. [x] Implement `getOverdueFeeds(batchSize)`: Find unique feeds using `HAVING` and `EXTRACT(EPOCH)` aggregates.
3. [x] Create a Trigger.dev scheduled task using `REFRESH_CRON_SCHEDULE` with `concurrencyLimit: 10`.
4. [x] Extract the task handler to an independent function for unit testing.
5. [x] Migrated to `isomorphic-dompurify` and implemented lazy initialization in the sanitizer to fix `jsdom` build errors in bundled environments.

**Done when:** The Trigger.dev dashboard shows successful runs that trigger ingestion for overdue feeds with detailed success/failure reporting.

---

### Subtask 3: User Preferences & Authentication Hooks

**Deliverable:** Unified initialization and configuration for user refresh settings.
**Touches:** `src/lib/auth.ts`, `src/services/auth/onboard-guest.ts`, `src/app/(dashboard)/settings/page.tsx`, `src/lib/constants.ts`

**Todos:**

1. [x] Centralize defaults in `src/lib/constants.ts` (EnvVar support).
2. [x] Add `databaseHooks` to Better Auth to initialize `user_preferences` for every new account.
3. [x] Update `onboardGuest` to use `onConflictDoUpdate` to augment preferences with guest-specific watermarks.
4. [x] Implement `updatePreferencesAction` and `updateUserPreferences` service.
5. [x] Build the Settings page with a `Select` component and robust error boundaries.

**Done when:** Every user has a preferences row upon signup, and settings are persistent and configurable.

---

### Subtask 4: "New Items" UI Notification (Sticky Header)

**Deliverable:** A non-intrusive banner that alerts users to new content via the toolbar.
**Touches:** `src/actions/feed/check-new-items-action.ts`, `src/hooks/feed/use-new-items-polling.ts`, `src/components/layout/feed-toolbar.tsx`, `src/components/feed/new-items-banner.tsx`

**Todos:**

1. [x] Create `checkNewItemsAction` to count items published after the current view's top item.
2. [x] Build `NewItemsBanner` with ARIA live region (`sr-only` mirror) for bulletproof accessibility.
3. [x] Implement `useNewItemsPolling` custom hook to encapsulate polling logic and item lookup.
4. [x] Integrate the banner into `FeedToolbar` to create a fixed sticky notification row.
5. [x] Implement smooth scroll-to-top on the `feed-container` when content is loaded.

**Done when:** Background updates trigger a persistent banner in the toolbar that loads new content and scrolls to top upon click.

---

### Tests: Full Verification Suite

**Deliverable:** 100% verified auto-refresh flow from database to UI.
**Touches:** `src/services/ingestion/*.test.ts`, `src/services/feed/*.test.ts`, `src/services/user/*.test.ts`, `src/actions/**/*.test.ts`, `src/components/**/*.test.tsx`, `src/trigger/*.test.ts`

**Todos:**

1. [x] **Unit (Vitest):**
   * `fetch-feed-xml.test.ts`: Conditional headers and 304 handling.
   * `new-items-banner.test.tsx`: Component rendering and singular/plural logic.
   * `refresh-task.test.ts`: Extracted Trigger.dev v4 handler logic.
   * `update-preferences-action.test.ts`: Auth guards and validation codes.
   * `check-new-items-action.test.ts`: Service integration for polling.

2. [x] **Server Integration (Vitest + PGLite):**
   * `refresh-stale-feeds.test.ts`: HAVING/EPOCH logic and subscriber deduplication.
   * `count-new-items.test.ts`: Global/Category/Feed scopes and watermark respect.
   * `update-user-preferences.test.ts` & `get-user-preferences.test.ts`: CRUD logic and user isolation.
   * `create-subscription.test.ts`: Early return logic for unexpected fetch results.

3. [x] **UI Integration (RTL + MSW):**
   * `settings-form.test.tsx`: Form submission and feedback loop.
   * `feed-toolbar.test.tsx`: Banner visibility and interaction in the toolbar.

4. [x] **E2E (Playwright):**
   * `refresh-flow.spec.ts`: Verify the full loop in a production-like environment.

**Done when:** All test tiers pass and confirm the "Safe-Tier" constraints and modern accessibility patterns.

---

## Final checklist

* [x] Background refresh respects user intervals.
* [x] ETags successfully reduce redundant work.
* [x] UI notification is truly sticky and doesn't jitter.
* [x] Preference initialization is automated and consistent.
* [x] Live announcements work for screen readers.
* [x] `bun tsc --noEmit` passes after all refactors.
