# Frontpage Development Roadmap

## Phase 1 — Feed Management

*Dependency Reasoning: This is the foundation of the application—we must be able to add feeds before we can browse or organize them.*

- Step 1: Build the primary dashboard layout with a placeholder sidebar and an "Add Feed" dialog.
- Step 2: Implement the "Add Feed" server action that validates a URL, fetches basic metadata, and persists the subscription to the database.
- Step 3: Create a "Manage Feeds" view where users can see their current subscriptions with health status indicators and last fetch timestamps.
- Step 4: Add the ability to edit a subscription's title, remove it with a confirmation step and refresh it.

## Phase 2 — Feed Parsing

*Dependency Reasoning: This phase ensures that the app can handle real-world feed inconsistencies, building on the basic CRUD from Phase 1.*

- Step 1: Implement a robust parser that supports RSS 2.0, RSS 1.0 (RDF), and Atom 1.0.
- Step 2: Add normalization logic to handle HTML entity decoding and inconsistent date formats across diverse sources.
- Step 3: Enhance the ingestion pipeline with a 10s timeout, sanitization, and deterministic ID generation for items missing GUIDs.

## Phase 3 — Content Browsing

*Dependency Reasoning: Now that we have reliable ingestion, we can build the primary reading surface for the feed items.*

- Step 1: Implement the main feed list view displaying a reverse-chronological list of items with source identification (favicons) and relative timestamps.
- Step 2: Implement infinite scroll to handle large lists of items while maintaining smooth performance.
- Step 3: Enable filtering the list by individual feed to view specific content sources.

## Phase 4 — Category Organization

*Dependency Reasoning: With content flowing, users now need a way to group and manage their subscriptions.*

- Step 1: Update the sidebar to support the creation and display of user-defined categories.
- Step 2: Implement the logic to assign subscriptions to categories and filter the main feed list by category.
- Step 3: Add management capabilities to rename or delete categories, including reassigning orphaned feeds to an "Uncategorized" group.

## Phase 5 — Read/Unread Tracking

*Dependency Reasoning: To support triage, users need to track their progress through the aggregated content.*

- Step 1: Implement visual indicators for read/unread items and update state when an item is clicked.
- Step 2: Add unread counts to the sidebar for each category and individual feed subscription.
- Step 3: Implement the "Mark all as read" functionality for feeds and categories using the cascading watermark pattern.

## Phase 6 — Article View

*Dependency Reasoning: This completes the consumption loop by providing a deep-reading experience within the app.*

- Step 1: Create the reader view layout for displaying full article content with consistent typography and clean formatting.
- Step 2: Implement navigation controls (Next/Previous) to move between items directly within the reader view.
- Step 3: Add article metadata and a clear link to the original source at the top of the reading experience.

## Phase 7 — User Authentication

*Dependency Reasoning: Now that the core app is functional, we add personal account infrastructure to persist data across sessions.*

- Step 1: Implement the sign-up and sign-in pages using Better Auth.
- Step 2: Secure all dashboard routes with middleware to redirect unauthenticated users.
- Step 3: Update the persistence layer to ensure all feeds, categories, and item states are scoped strictly to the authenticated user.

## Phase 8 — "Try as Guest" Experience

*Dependency Reasoning: This provides an entry point for exploration without account creation, using pre-loaded curated content.*

- Step 1: Implement a guest session handler that bypasses the database and serves items from a local JSON fixture.
- Step 2: Add a persistent "Guest Banner" that encourages signing up while allowing full access to the reader features.

## Phase 9 — Landing Page

- *Dependency Reasoning: The final step is building the public-facing entry point to market and transition users into the app.*

- Step 1: Create the landing page shell with a professional hero section and feature highlights.
- Step 2: Implement prominent "Sign Up" and "Try as Guest" call-to-action buttons that route users correctly.
