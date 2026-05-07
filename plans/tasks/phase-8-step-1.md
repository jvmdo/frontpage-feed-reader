# Phase 8 - Step 1: Guest Foundation and Identity Upgrade

## Context

* **What can the user do?** The user can click "Try as Guest" to explore the app with pre-loaded content. When they later sign up/in, their identity is seamlessly "upgraded" to a member.
* **Architecture:** Based on the community consensus in [Better Auth Issue #4180](https://github.com/better-auth/better-auth/issues/4180), we use **Reversed Linking**. We retain the Guest's User ID and attach the permanent authentication record to it, avoiding the complexity of multi-table data migration and TanStack Query cache invalidation issues.

## Use Cases

* ✅ "Try as Guest" creates an anonymous session and triggers onboarding.
* ✅ Anonymous users see a fully populated dashboard.
* ✅ Conversion (Account Linking) upgrades the guest identity in-place.
* ✅ Data (Categories, Subscriptions, Read States) remains valid without migration.
* ✅ User ID is preserved across the entire lifecycle.

## Subtasks

### Subtask 1: Infrastructure - Guest Onboarding

**Deliverable:** Populate guest accounts with curated content.

* [x] Implement `onboardGuest` in `src/services/auth/onboard-guest.ts`.
* [x] Initialize `user_preferences` with a 7-day historical watermark.

### Subtask 2: Business Logic - Better Auth Hook

**Deliverable:** Trigger onboarding on guest entry.

* [x] Configure `after` hook in `src/lib/auth.ts` to call `onboardGuest`.
* [x] Ensure robust path matching for `/api/auth/sign-in/anonymous`.

### Subtask 3: Business Logic - Identity Upgrade (Reversed Linking)

**Deliverable:** Implement the in-place identity upgrade logic.
**Touches:** `src/lib/auth.ts`, `src/services/auth/convert-guest-account.ts`

* [x] Refactor `onLinkAccount` in `src/lib/auth.ts` to call `convertGuestToMember`.
* [x] Implement `convertGuestToMember` in `src/services/auth/convert-guest-account.ts`:
    1. Update the `Account` table: set `userId = anonymousUser.id`.
    2. Update the `User` table: set `email = newUser.email` and `isAnonymous = false` for the guest ID.
    3. Delete the redundant `newUser` record.

### Subtask 4: UI - Guest Access

**Deliverable:** Entry points for guest mode.

* [x] Create and integrate `GuestButton`.
* [x] Update auth forms to perform full page reload on success for cache hygiene.

### Subtask 5: Tests

**Touches:** `e2e/guest-lifecycle.spec.ts`, `src/services/auth/convert-guest-account.test.ts`

* [x] **Integration:** Verify database state transitions in `convert-guest-account.test.ts`.
* [x] **E2E:** Guest lifecycle
  1. Verify guest onboarding and article interaction.
  2. Verify data preservation after sign-up.
  3. Verify User ID remains constant across conversion.
