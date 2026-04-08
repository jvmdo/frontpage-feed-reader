# Phase 2 - Step 1: Robust Feed Parsing and Ingestion

## Context

* **What can the user do?** The user's feeds are now fully parsed, including all articles/items, which are stored in the database for browsing.

* **Why are we building this?** To move from just tracking feed metadata to actually aggregating and storing the content (articles) from those feeds.

## Prerequisites

* **Auth:** Dev session (`getCurrentSession()`)
* **Data:** `feeds` and `subscriptions` tables must exist.
* **APIs / Services:** External RSS/Atom feeds must be reachable.
* **UI:** `Manage Feeds` view (Phase 1 - Step 3/4) to trigger refreshes.
* **Config:** Drizzle client initialized.

## Tech stack decisions

* `rss-parser`: already in use, but now utilized for full item extraction.

## Use cases

* ✅ Parse RSS 2.0, RSS 1.0 (RDF), and Atom 1.0.
* ✅ Extract title, link, content/description, author, and publication date for each item.
* ✅ Handle missing fields (e.g., fallback to fetch time if `pubDate` is missing).
* ✅ Upsert items into the database (avoid duplicates using `guid` or `link`).
* ✅ Update feed health and timestamps after a successful ingestion.

---

## Subtasks

### Subtask 1: Infrastructure - Feed Items Schema

**Deliverable:** `feed_items` table added to the schema and database.
**Touches:** `src/db/schema.ts`

**Todos:**

1. [x] Add `feed_items` table to `src/db/schema.ts` following `docs/db-design.md`.
2. [x] Add `idx_feed_items_feed_published` index to `src/db/schema.ts` for optimized feed list queries.
3. [x] Run `bun x drizzle-kit push` to synchronize the database schema.

**Done when:** The database contains the `feed_items` table with the correct fields and indices.

---

### Subtask 2: Business Logic - Enhanced Feed Parser

**Deliverable:** An updated parser that extracts full item data from RSS and Atom feeds.
**Touches:** `src/lib/feed/parser.ts`

**Todos:**

1. [x] Implement `parseFeed` in `src/lib/feed/parser.ts` to return a list of items.
    * Split the fetch and basic parsing logic into a reusable function. This will prevent duplication between this and fetchFeedMetadata function.
    * Place the helper function in `src/services/.
2. [x] Implement mapping for RSS `<item>` (guid, title, link, description, content:encoded, dc:creator, pubDate).
3. [x] Implement mapping for Atom `<entry>` (id, title, link, summary, content, author, published/updated).
4. [x] Ensure HTML entities in item titles and descriptions are decoded.

**Done when:** The parser correctly extracts and normalizes items from RSS 2.0, 1.0, and Atom 1.0 samples.

---

### Subtask 3: Business Logic - Feed Ingestion Service

**Deliverable:** A service function that orchestrates fetching, parsing, and storing feed items.
**Touches:** `src/services/feed-ingestion.ts`

**Todos:**

1. [x] Create `src/services/feed-ingestion.ts`.
2. [x] Implement `ingestFeedItems(db, feedId)`:
    * Fetch feed URL from DB.
    * Call helper fetch XML function.
    * Parse feed using the enhanced parser.
    * Upsert items into `feed_items` table using `onConflictDoUpdate` on `(feed_id, guid)`.
    * Update `feeds` table status (`health_status`, `last_fetched_at`, `last_success_at`).
3. [x] Implement error handling within the service to update `health_status` to 'error' and set `last_failure_at`.

**Done when:** Calling `ingestFeedItems` successfully populates the `feed_items` table and updates feed metadata.

---

### Subtask 4: Business Logic - Integration with Refresh Action

**Deliverable:** The existing `refreshFeedAction` now triggers a full ingestion.
**Touches:** `src/actions/feed.ts`

**Todos:**

1. [x] Update `refreshFeedAction` in `src/actions/feed.ts` to call `ingestFeedItems`.
2. [x] Ensure the action still returns the updated feed metadata for UI synchronization.

**Done when:** Clicking "Refresh" in the Manage Feeds UI triggers a full article ingestion into the database.

---

### Subtask 5: Tests

**Deliverable:** All tests pass and verify the fetching, parsing, and ingestion logic independently.
**Touches:** `src/services/fetch-feed-xml.test.ts`, `src/lib/feed/parser.test.ts`, `src/services/feed-ingestion.test.ts`, `src/actions/feed/refresh-feed-action.test.ts`

**Todos:**

1. [x] Unit: Test `fetchFeedXml` in `src/services/fetch-feed-xml.test.ts` for timeouts, User-Agent headers, and error mapping (404, 500, network).
2. [x] Unit: Test `parseFeedXml` in `src/lib/feed/parser.test.ts` with RSS 2.0, RSS 1.0, and Atom 1.0 static XML strings (verify mapping and GUID generation).
3. [x] Integration: Test `ingestFeedItems` in `src/services/feed-ingestion.test.ts` with MSW to verify the orchestration of fetch -> parse -> DB upsert -> status update.
4. [x] Fix: Update `src/actions/feed/refresh-feed-action.test.ts` to mock `ingestFeedItems` instead of the removed `fetchFeedMetadata` function.
5. [x] E2E: Verify that clicking "Refresh" in the Manage Feeds UI triggers a success toast and updates the "Last Fetched" relative time.

**Done when:** All tests pass and every test would fail if the logic it targets were deleted.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
