# Phase 2 - Step 2: Normalization Logic

## Context

* **What can the user do?** The user sees cleaner feed content with correctly decoded entities, normalized dates, and consistent URLs across different devices and feed sources.

* **Why are we building this?** Real-world feeds are messy. They use various date formats, include HTML entities in plain-text fields, and inconsistent URL schemes. Normalization ensures the data in our database is clean and reliable for sorting and display.

## Prerequisites

* **Auth:** None (Business logic only)
* **Data:** `feed_items` table must exist (Phase 2 - Step 1).
* **APIs / Services:** None.
* **UI:** None.
* **Config:** `date-fns` installed.

## Tech stack decisions

* `entities`: already in use for decoding.
* `date-fns`: for robust date parsing and validation.

## Use cases

* ✅ Decode HTML entities (e.g., `&amp;`, `&#8217;`) in titles, descriptions, and authors.
* ✅ Parse diverse date formats (ISO 8601, RFC 822, etc.) and fallback to current time if invalid/missing.
* ✅ Normalize URLs (ensure absolute links, trim whitespace).
* ✅ Sanitize/Clean basic text fields (remove excessive whitespace, normalize line breaks).

---

## Subtasks

### Subtask 1: Business Logic - Enhanced Entity Decoding

**Deliverable:** A comprehensive entity decoding utility applied to all text metadata.
**Touches:** `src/lib/feed/normalizer.ts`, `src/lib/feed/parser.ts`

**Todos:**

1. [x] Update `decodeEntities` in `src/lib/feed/normalizer.ts` to ensure it's robust and used consistently across all fields.
2. [x] Ensure `decodeEntities` is applied to `feed.title`, `feed.description`, `item.title`, `item.description`, and `item.author` in `src/lib/feed/parser.ts`.
3. [x] Add a `cleanText` helper to `src/lib/feed/normalizer.ts` that trims whitespace and normalizes line breaks.

**Done when:** All text metadata fields in the parsed feed are free of HTML entities and excessive whitespace.

---

### Subtask 2: Business Logic - Robust Date Normalization

**Deliverable:** A utility to parse and normalize publication dates from various feed formats.
**Touches:** `src/lib/feed/normalizer.ts`, `src/lib/feed/parser.ts`

**Todos:**

1. [x] Implement `normalizeDate(dateStr: string | undefined): Date` in `src/lib/feed/normalizer.ts`.
    * Use `date-fns` to attempt parsing common formats if the native `Date` constructor fails.
    * Fallback to `new Date()` (current fetch time) for missing or unparseable dates.
2. [x] Integrate `normalizeDate` into the `parseFeedXml` mapping logic for `publishedAt` and `updatedAt`.

**Done when:** Items from various feed samples have valid `Date` objects, falling back gracefully to the current time when necessary.

---

### Subtask 3: Business Logic - URL Normalization

**Deliverable:** Consistent URL formatting for feed and item links.
**Touches:** `src/lib/feed/normalizer.ts`, `src/lib/feed/parser.ts`

**Todos:**

1. [x] Implement `normalizeUrl(url: string | undefined, base?: string): string | undefined` in `src/lib/feed/normalizer.ts`.
    * Handle relative URLs by resolving them against a base URL if provided.
    * Trim whitespace and ensure consistent protocol (e.g., keep as provided but handle missing leading slashes).
2. [x] Apply `normalizeUrl` to feed links and item links in `src/lib/feed/parser.ts`.

**Done when:** All URLs in the parsed feed are absolute and properly formatted.

---

### Subtask 4: Tests

**Deliverable:** Comprehensive unit tests for all normalization logic.
**Touches:** `src/lib/feed/normalizer.test.ts`, `src/lib/feed/parser.test.ts`

**Todos:**

1. [x] Unit: Test `decodeEntities` with complex entities and nested HTML-like strings.
2. [x] Unit: Test `normalizeDate` with ISO 8601, RFC 822, and invalid strings (verifying fallback).
3. [x] Unit: Test `normalizeUrl` with relative paths, whitespace, and base URL resolution.
4. [x] Integration: Update `parseFeedXml` tests to verify that these normalization functions are being applied correctly during the parsing flow.

**Done when:** All tests pass and cover a wide range of edge cases for dates, entities, and URLs.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
