# Frontpage Project Digest

## 1. Product Vision

Frontpage is a customizable RSS/Atom feed aggregator for tech professionals. It provides a calm, organized, and beautifully designed home for blogs, newsletters, and changelogs, prioritizing reading comfort and information density.

## 2. Target User & Core Use Case

**Target:** Developers, designers, and tech leads managing high volumes of content.
**Use Case:** A daily "what did I miss?" dashboard to triage, read, and save tech content across dozens of sources in one unified, scannable interface.

## 3. Feature List & Acceptance Criteria

### Core (MVP)

- **Feed Management:** Add by URL, edit title/category, remove, and track health (Active/Stale/Error).
- **Robust Parsing:** Support RSS 2.0/1.0 and Atom 1.0; handle encoding (UTF-8/ISO-8859-1), date variations, and malformed XML.
- **Content Browsing:** Reverse-chronological list with source icons, excerpts, and category/feed filtering.
- **Category Org:** Custom categories with unread counts; support for drag-and-drop ordering and "Uncategorized" default.
- **Read Tracking:** Visual read/unread distinction; bulk "Mark all as read" (feed, category, global) with persistence.
- **Article Reader:** Clean, sanitized in-app reader for full-content feeds (headings, code blocks, images) with nav controls.
- **Guest Experience:** One-click entry to a dashboard pre-loaded with 19 curated feeds (5 categories); session-scoped data.
- **Auth & Persistence:** Email/Password auth via Better Auth; persistent storage for all user data in PostgreSQL.

### Stretch

- **Bookmarks:** Dedicated "Saved" section for later reading.
- **Full-Text Search:** Fast search across titles/descriptions with highlighted terms.
- **OPML Import/Export:** Support standard subscription files with duplicate detection and error reporting.
- **Keyboard Navigation:** Vim-style shortcuts (`j`/`k`, `o`, `s`, `m`, `g` prefix) and Command Palette (Cmd+K).

## 4. Technical Constraints & Non-negotiables

- **Parsing Logic:** Must happen entirely on the server; use `AbortController` with a strict **10s timeout**.
- **Sanitization:** Mandatory `DOMPurify` + `jsdom` pipeline for all HTML content before DB/Client.
- **Performance:** "Mark all as read" must use the **Cascading Watermark Pattern** (O(1) operations).
- **Data Integrity:** **Sparse State pattern** for `user_item_states` to prevent junction table bloat.
- **Errors:** Partial success only—one failing feed must not break the dashboard. Never expose raw DB/stack traces.

## 5. Design Principles & UX Decisions

- **Typography:** `Inter` (UI/Headings), `Georgia` (Reader View), `JetBrains Mono` (Code).
- **Aesthetic:** "Reading comfort of Instapaper meets information density of Linear." Clean, calm, content-focused.
- **Visuals:** Relative timestamps ("2h ago"), subtle unread dots, 16-20px source favicons.
- **Feedback:** Skeleton screens for loading; specific error states (e.g., "404 - Feed Moved"); optimistic UI for read states.
- **Mobile:** Single-column layout with touch-friendly targets (min 44x44px); sidebar collapses to overlay/bottom-nav.

## 6. Differentiators

- **Instant Value:** The Guest Experience is a high-fidelity demo using real live content, not a "login wall."
- **Scale-Ready State:** Engineered for high item counts via Watermark/Sparse patterns and indexed feed retrieval.
- **Pro Reader View:** High-quality serif typography and clean code block rendering for professional content.

## 7. Data Considerations

- **Normalization:** Decode HTML entities in titles; generate deterministic GUID hashes if missing.
- **Caching:** Use ETags/Last-Modified headers; avoid re-fetching feeds that haven't changed.
- **Schema:** Use `BIGSERIAL` for IDs and `JSONB` for raw payloads to allow future-proofing.
- **Seed Data:** 19 feeds across Frontend, Design, Backend/DevOps, General Tech, and AI (see `data/sample-feeds.json`).
