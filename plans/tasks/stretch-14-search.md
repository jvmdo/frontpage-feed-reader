# Global Search Implementation (Stretch #14)

## Context

* **What can the user do?** The user can search for articles by keywords across titles, descriptions, and full content using an autocomplete command palette.

* **Why are we building this?** To provide a fast, professional-grade discovery tool that allows users to find specific information within their large collection of feed items.

## Prerequisites

* **Auth:** Authenticated user (search results are personal)
* **Data:** `feed_items`, `feeds`, `subscriptions` tables must exist.
* **APIs / Services:** `/api/items` endpoint (to be extended).
* **UI:** `Command`, `Dialog` UI components must exist.
* **Config:** PostgreSQL support for Full-Text Search.

## Tech stack decisions

* **PostgreSQL Full-Text Search**: Using `to_tsvector`, `websearch_to_tsquery`, and `ts_rank` for efficient, weighted search logic.
* **GIN Index**: For indexing composite text data (`title`, `description`, `textContent`).
* **html-to-text**: For robustly stripping HTML and preserving block spacing during ingestion.
* **cmdk**: The primitive for the Search Palette (already in project).
* **nuqs**: For URL-driven visibility and state management.

## Use cases

* ✅ User types a query and sees relevant articles from all their subscriptions.
* ✅ Search results show snippets with highlighted terms.
* ✅ Results are ranked by relevance (Title > Description > Content).
* ✅ Keyboard shortcuts (`/`, `Cmd+K`) open the search palette.
* ✅ "Load more" allows discovering deeper results via pagination.
* ✅ Search results strictly respect user isolation.

---

## Subtasks

### Subtask 1: Database & Schema Update (Data Layer)

**Deliverable:** Database schema supports a clean plain-text version of content and a high-performance GIN index for full-text search.
**Touches:** `src/db/schema.ts`, migrations.

**Todos:**

1. [x] Add `textContent` column (optional text) to `feedItems` table in `src/db/schema.ts`.
2. [x] Define a composite GIN index on `feedItems` in `src/db/schema.ts` using `setweight` on `title` (A), `description` (B), and `textContent` (C).
3. [x] Generate a new migration using `bun x drizzle-kit generate`.
4. [x] Create a temporary migration script to populate `textContent` for existing items.
5. [x] Apply the migration to the database.

**Done when:** Migration is applied and the GIN index is active on the database.

---

### Subtask 2: Ingestion Logic Update (Business Logic)

**Deliverable:** Every new article fetched automatically populates the `textContent` field with a clean version of the body.
**Touches:** `src/services/ingestion/feed-ingestion.ts`, `src/lib/feed/extractor.ts`.

**Todos:**

1. [x] Integrate `html-to-text` library for robust text extraction.
2. [x] Implement `extractText` utility with block-spacing and casing preservation.
3. [x] Update `parseFeedXml` to populate `textContent` before sanitization.
4. [x] Implement "Exclusive Ingestion": only populate `textContent` if explicit full content exists to avoid ranking noise.
5. [x] Update the `ingestItems` upsert logic to persist the clean text.

**Done when:** New ingested items have clean, non-HTML `textContent` in the database
---

### Subtask 3: Search Service & API Extension (Business Logic)

**Deliverable:** The items service and API can filter and rank results by a search query using Postgres FTS.
**Touches:** `src/services/item/get-items.ts`, `src/lib/validations/feed.ts`, `src/app/api/items/route.ts`.

**Todos:**

1. [x] Update `itemsQuerySchema` to include an optional `search` string (min 2 char).
2. [x] Update `getItems` service to accept a `search` parameter.
3. [x] Implement modular query construction helpers (`buildSearchFragments`, `buildSortClauses`).
4. [x] Implement weighted FTS ranking and `websearch_to_tsquery` filtering.
5. [x] Integrate `ts_headline` for dynamic search snippets.
6. [x] Refactor API route to use idiomatic `Object.fromEntries` for clean parameter parsing.
**Done when:** `/api/items?search=term` returns relevant items ranked by relevance with highlighted snippets.

---

### Subtask 4: Search UI & Palette (UI Layer)

**Deliverable:** A functional, accessible Search Palette with autocomplete behavior and keyboard support.
**Touches:** `src/components/shared/search-palette.tsx`, `src/app/(dashboard)/layout.tsx`, `src/hooks/ui/use-search-palette-state.ts`.

**Todos:**

1. [x] Create `useSearchPaletteState` using `nuqs` for URL-driven visibility (`?searchPalette=true`).
2. [x] Implement `useSearchItems` hook using `useInfiniteQuery` for paginated discovery.
3. [x] Build `SearchPalette` with "Search-as-you-type" and immediate loading feedback.
4. [x] Move `ItemReaderLightbox` to global dashboard layout to support overlays from any segment.
5. [x] Implement `SearchResultItem` to replicate `ItemCard` styling while preserving accessibility.
6. [x] Add keyboard shortcuts (`/`, `Cmd+K`) using `useEventListener`.
7. [x] Wire triggers into Top Navigation and Mobile Bottom Navigation.
**Done when:** Pressing `/` opens the search modal, and typing results in an "Autocomplete" experience with live results.

---

### Tests: Global Search Verification ✅

**Deliverable:** Search functionality is verified across all layers, ensuring relevance, performance, and security.
**Touches:** `src/services/item/get-items.test.ts`, `src/components/shared/search-palette.test.tsx`, `e2e/search.spec.ts`.

**Todos:**

1. [x] **Unit**: Test `extractText` utility for HTML stripping and block spacing.
2. [x] **Integration**: Test `getItems` service for stemming, weighting, and user isolation.
3. [x] **Integration**: Test `SearchPalette` UI states (Loading, Empty, Results, Load More) using MSW and Hanging Promises.
4. [x] **E2E**: Verify full user flow across all browsers: `Open -> Type -> Load More -> Select -> Read`.
**Done when:** All tests pass and cover the happy path and edge cases (empty results, special characters).

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] GIN indexes and FTS logic performant for large datasets
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
