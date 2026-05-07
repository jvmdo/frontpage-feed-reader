# Phase 8 - Step 2: Low-Friction Guest Conversion

## Context

* **Goal:** Allow guests to upgrade to a permanent account without leaving the dashboard or filling out long forms.
* **Flow:**
    1. A "save your progress" banner appears for anonymous users on the dashboard.
    2. Clicking it opens a `Dialog` with a single "Email" field and descriptive texts.
      - Or clicking "profile" in `UserMenu`.
      - The texts explain the current session isn't permanent
      - The texts shows case the disadvantages of not having an account
      - The texts says the current progress won't be lost
    3. On submission, the app auto-generates a secure random password in the background.
    4. The conversion happens in-place using the "Reversed Linking" pattern.
    5. The UI updates reactively via Better Auth's `useSession`.
* **Security:** Since the password is auto-generated, the user is notified that they can change it or set a "real" one in their account settings later.

## Use Cases

* ✅ Anonymous users see a "Save your progress" banner/button.
* ✅ Conversion happens via a single-field email form in a dialog.
* ✅ Identity upgrade is seamless (no full page reload).
* ✅ User ID and data are preserved (already handled by Phase 8 Step 1).

## Subtasks

### Subtask 1: UI - Guest Conversion Components

**Deliverable:** Components to trigger the conversion flow.

* [x] Create `GuestBanner` in `src/components/auth/guest-banner.tsx`.
  * Only visible if `user.isAnonymous === true`.
* [x] Create `GuestDialog` in `src/components/auth/guest-dialog.tsx`.
  * Contains a simple React Hook Form with Zod validation for the `email` field.
* [x] Integrate the banner into `src/app/(dashboard)/layout.tsx`.
* [x] Integrate the conversion trigger into `UserMenu` in `src/components/layout/components/user-menu.tsx`.
  * For anonymous users, the "Profile" item should open the `GuestDialog`.

### Subtask 2: Business Logic - Background Conversion

**Deliverable:** Background password generation and silent upgrade.

* [x] Implement `handleConversion` logic:
    1. Call `authClient.signUp.email({ email, password, name: "Guest User", callbackURL: "/dashboard" })`.
    2. Generate a secure random string for the password.
    3. Generate a random name in `generateName` callback using `unique-names-generator` package.
    4. Ensure `convertGuestToMember` service hold the generation logic.
* [x] Add a success toast with a call-to-action to "Set a password in settings".

### Subtask 3: Reactivity - UI Synchronization

**Deliverable:** Ensure all components reflect the "Member" status immediately.

* [x] Verify that `useSession()` in `TopNav` and other client components updates automatically after `signUp.email` returns.
* [x] Ensure the `GuestBanner` disappears immediately on success.

### Subtask 4: Refactoring & Cleanup

**Deliverable:** Remove obsolete logic from the previous context-switch flow.

* [x] Refactor `src/proxy.ts`: Remove the anonymous user exception. All logged-in users (including guests) should be redirected away from `/sign-in` and `/sign-up` since conversion is now in-place.
* [x] Clean up any remaining "conversion" references in auth forms that point to navigation.

### Subtask 5: Tests

* [x] **UI Integration:** Test `GuestBanner` internal behavior and dismissal without session mocks.
* [x] **UI Integration:** Test `GuestDialog` validation and submission.
* [x] **E2E:** Create `e2e/session-features.spec.ts` to verify layout-level session features (`GuestBanner` visibility).
* [x] **E2E:** Adapt `e2e/guest-lifecycle.spec.ts` to use the banner/dialog flow.
  1. Verify clicking the banner opens the dialog.
  2. Verify entering an email successfully converts the user.
  3. Verify the banner disappears without a page reload via UI verification.
  4. Verify data preservation.
  5. Refactor to use centralized `seedCuratedFeeds` and robust `afterEach` cleanup.
