# Subtask: Password Recovery Flow

## Context

* **What can the user do?** Users who have forgotten their password can request a password reset link via email and securely create a new password.
* **Why are we building this?** To prevent account lockout and provide a standard, secure way for users to regain access to their accounts.

## Prerequisites

* **Auth:** None (unauthenticated users will use this)
* **Data:** User table configured in Better Auth
* **APIs / Services:** Better Auth configured with `emailAndPassword` enabled, Resend account for email delivery.
* **UI:** Auth layout and components must be available.
* **Config:** Environment variables for Better Auth, plus `RESEND_API_KEY` and a verified sender domain.

## Tech stack decisions

* **Resend**: Used for transactional email delivery (specifically for sending the password reset tokens).

## Use cases

* ✅ Request a reset link for an existing email.
* ✅ Receive an email via Resend with the secure token link.
* ✅ Navigate to the reset password page using the token.
* ✅ Successfully update the password and sign in.
* ✅ Request reset for a non-existent email (should fail silently or predictably according to Better Auth defaults).
* ✅ Use an invalid or expired reset token.

---

## Subtasks

### Subtask 1: Configure Resend and Email Service

**Deliverable:** A functional email service using Resend that can send password reset links.
**Touches:** `package.json`, `.env`, `src/lib/resend.ts`

**Todos:**

1. [x] Install the `resend` package (`bun add resend`).
2. [x] Add `RESEND_API_KEY` to `.env`.
3. [x] Create `src/lib/resend.ts` that initializes the Resend client.
4. [x] Implement `sendResetPasswordEmail({ to, url })` functionality (integrated directly into Better Auth `sendResetPassword`).

**Done when:** The `sendResetPasswordEmail` functionality successfully sends a basic HTML email to a target address using the Resend API.

---

### Subtask 2: Configure Better Auth for Password Reset

**Deliverable:** Better Auth configuration includes `sendResetPassword` callback integrated with Resend.
**Touches:** `src/lib/auth.ts`, `src/emails/password-reset.tsx`

**Todos:**

1. [x] Create a React Email template for the password reset email in `src/emails/password-reset.tsx` (e.g. `PasswordResetEmail({ resetUrl })`).
2. [x] Update `src/lib/auth.ts` to add `sendResetPassword` in the `emailAndPassword` configuration.
3. [x] Inside `sendResetPassword`, call the `resend.emails.send` method directly.
4. [x] **Crucial Security Rule:** Use `void resend.emails.send(...)` and do not `await` the call. This prevents timing attacks that could reveal if an email address exists.

**Done when:** Better Auth is configured to handle password reset requests and dispatches the Resend email asynchronously without awaiting the result.

---

### Subtask 3: Create "Forgot Password" Request UI

**Deliverable:** A functional page for users to enter their email and request a reset link.
**Touches:** `src/app/(auth)/forgot-password/page.tsx`, `src/components/auth/forgot-password-form.tsx`, `src/components/auth/signin-form.tsx`

**Todos:**

1. [x] Create `src/components/auth/forgot-password-form.tsx` using `react-hook-form` and `zod` for email validation.
2. [x] Integrate `authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })` on form submission.
3. [x] Display a success state (e.g., "If an account exists, an email was sent") after submission to prevent email enumeration.
4. [x] Create `src/app/(auth)/forgot-password/page.tsx` using the auth layout and the new form component.
5. [x] Add a link to the "Forgot Password" page from the existing Sign In form (`src/components/auth/signin-form.tsx`).

**Done when:** A user can submit their email on the `/forgot-password` page and trigger the Better Auth reset process.

---

### Subtask 4: Create "Reset Password" UI

**Deliverable:** A functional page for users to enter a new password using the token from the email.
**Touches:** `src/app/(auth)/reset-password/page.tsx`, `src/components/auth/reset-password-form.tsx`, `src/lib/validations/auth.ts`

**Todos:**

1. [x] Create `src/components/auth/reset-password-form.tsx` using `react-hook-form` and `zod` for password validation (e.g., minimum length matching Better Auth config, password confirmation).
2. [x] The form should use `authClient.resetPassword({ newPassword })` on submission. Better Auth will automatically read the token from the URL.
3. [x] Handle success (redirect to sign-in or dashboard) and error states (e.g., token expired or invalid).
4. [x] Create `src/app/(auth)/reset-password/page.tsx` to host the form.

**Done when:** A user can navigate to `/reset-password` with a valid token, submit a new password, and have their credentials updated.

---

### Subtask 5: Tests

**Deliverable:** all tests pass and every test would fail if the logic it targets were deleted.
**Touches:** `src/components/auth/forgot-password-form.test.tsx`, `src/components/auth/reset-password-form.test.tsx`, `e2e/auth-recovery.spec.ts`

**Todos:**

1. [x] UI Integration (RTL + MSW): Test `forgot-password-form` submission, error display, and success state.
2. [x] UI Integration (RTL + MSW): Test `reset-password-form` validation, error handling, and submission logic.
3. [x] E2E (Playwright): Create `e2e/auth-recovery.spec.ts` to test the full flow: request reset, intercept the email/token (using a mock or a test inbox if applicable), and reset password successfully.

**Done when:** all tests pass and every test would fail if the logic it targets were deleted

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
