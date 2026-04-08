# Phase 2 - Step 3: Sanitization and Pipeline Enhancement

## Context

* **What can the user do?** The user can safely read feed content without risk of XSS attacks or broken layouts from malicious/malformed HTML.

* **Why are we building this?** Feed content is untrusted. We must strip dangerous tags (like `<script>`) and ensure the HTML is clean before storing it in our database or rendering it in the UI.

## Prerequisites

* **Auth:** None
* **Data:** `feed_items` table must exist.
* **APIs / Services:** `fetchFeedXml` (with 10s timeout) and `parseFeedXml` must exist.
* **UI:** None.
* **Config:** `DOMPurify` and `jsdom` installed.

## Tech stack decisions

* `DOMPurify` + `jsdom`: for robust server-side HTML sanitization.

## Use cases

* ✅ Strip `<script>`, `<iframe>` (except allowed video embeds), and `on*` handlers.
* ✅ Clean `description` and `content` fields for all items.
* ✅ Ensure the ingestion pipeline remains resilient and non-blocking.

---

## Subtasks

### Subtask 1: Business Logic - HTML Sanitizer Utility

**Deliverable:** A utility that sanitizes HTML strings on the server.
**Touches:** `src/lib/feed/sanitizer.ts`

**Todos:**

1. [x] Create `src/lib/feed/sanitizer.ts`.
   * Initialize `JSDOM` and `DOMPurify`.
   * Implement `sanitizeHtml(html: string): string` with a strict configuration (strip scripts, iframes, etc.).
   * Add a specific exception for allowed video embeds (YouTube, Vimeo) if required by the spec.

**Done when:** The `sanitizeHtml` function correctly removes dangerous content from test HTML strings.

---

### Subtask 2: Business Logic - Pipeline Integration

**Deliverable:** The parsing flow now sanitizes all item content.
**Touches:** `src/lib/feed/parser.ts`

**Todos:**

1. [x] Import `sanitizeHtml` in `src/lib/feed/parser.ts`.
    * Apply `sanitizeHtml` to `item.description` and `item.content` during the mapping flow.

**Done when:** Items returned by `parseFeedXml` contain only sanitized HTML.

---

### Subtask 3: Tests

**Deliverable:** Comprehensive tests for sanitization and the enhanced pipeline.
**Touches:** `src/lib/feed/sanitizer.test.ts`, `src/lib/feed/parser.test.ts`

**Todos:**

1. [x] Unit: Test `sanitizeHtml` with malicious payloads (XSS, scripts, etc.).
2. [x] Integration: Update `parseFeedXml` tests to verify that content is indeed sanitized during the ingestion process.

**Done when:** All tests pass and cover common attack vectors and edge cases.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
