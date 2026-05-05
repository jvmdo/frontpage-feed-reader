# Phase 7 - Step 1: Implement Sign-Up and Sign-In Pages

## Context

* **What can the user do?** The user can create a new account or sign in to an existing one using their email and password, or use social login (GitHub).
* **Why are we building this?** This is the first step towards personalizing the experience and securing user data across sessions.

## Prerequisites

* **Auth:** Better Auth is configured in `src/lib/auth.ts` and `src/lib/auth-client.ts`.
* **Data:** Drizzle schema with `user`, `account`, `session`, and `verification` tables exists.
* **APIs / Services:** `src/app/api/auth/[...all]/route.ts` is ready to handle requests.
* **UI:** shadcn/ui components (Button, Input, Field, Label, Avatar, DropdownMenu, etc.) are available in `src/components/ui`.
* **Config:** `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` must be set in `.env`.

## Tech stack decisions

* `react-hook-form` + `zod` for form management and validation.
* `@hookform/resolvers` for Zod integration.
* `better-auth/react` (`authClient`) for auth operations.
* `next/image` with specialized CSS filters for monochromatic brand styling.

## Use cases

* ✅ Successful sign-up (email/password) redirects to dashboard.
* ✅ Successful sign-in (email/password) redirects to dashboard.
* ✅ Social sign-in (GitHub) redirects to dashboard.
* ✅ Successful sign-out redirects to sign-in page.
* ✅ Form validation errors are handled by Zod (e.g. invalid email, password mismatch).
* ✅ Auth errors from Better Auth (e.g. invalid credentials) are displayed via toast.
* ✅ Responsive two-column layout with professional "feed" branding.

---

## Subtasks

### Subtask 1: Auth Validation Schemas

**Deliverable:** Zod schemas for sign-up and sign-in.
**Touches:** `src/lib/validations/auth.ts`

**Todos:**

1. [x] Define `signUpSchema` with:
    * `name`: min 2 chars.
    * `email`: valid email format.
    * `password`: min 6, max 32 chars.
    * `confirmPassword`: must match `password` via `.refine`.
2. [x] Define `signInSchema` with `email` and `password`.

**Done when:** Schemas are exported and correctly handle password confirmation.

---

### Subtask 2: Auth Shared Layout

**Deliverable:** Shared layout for all auth-related pages.
**Touches:** `src/app/(auth)/layout.tsx`, `public/auth-layout-cover.jpg`

**Todos:**

1. [x] Create a responsive two-column grid layout.
2. [x] Implement a subtle SVG background pattern (abstract feed lines) in the content column.
3. [x] Add a high-quality cover image in the second column (hidden on mobile).
4. [x] Apply CSS filters (`sepia`, `hue-rotate`) to the cover image to match the brand blue monochromatic style.
5. [x] Optimize image loading with `fill`, `priority`, and correct `sizes` attribute.

**Done when:** `/sign-up` and `/sign-in` share a consistent, branded layout.

---

### Subtask 3: Sign Up Flow

**Deliverable:** Functional sign-up page with email and social options.
**Touches:** `src/components/auth/signup-form.tsx`, `src/app/(auth)/sign-up/page.tsx`

**Todos:**

1. [x] Implement `SignupForm` component using `react-hook-form` and `zodResolver`.
2. [x] Use `noValidate` on the form to let Zod handle all validation logic.
3. [x] Implement `isSubmitting` from `useForm` for loading states.
4. [x] Integrate `authClient.signUp.email`.
5. [x] Add GitHub social login button via `authClient.signIn.social`.
6. [x] Display success/error toasts using `sonner`.

**Done when:** Users can create accounts via email or GitHub.

---

### Subtask 4: Sign In Flow

**Deliverable:** Functional sign-in page.
**Touches:** `src/components/auth/signin-form.tsx`, `src/app/(auth)/sign-in/page.tsx`

**Todos:**

1. [x] Implement `SigninForm` component using shared patterns.
2. [x] Integrate `authClient.signIn.email`.
3. [x] Add GitHub social login support.
4. [x] Ensure redirect to `/dashboard` upon successful session creation.

**Done when:** Users can access their account via email or social provider.

---

### Subtask 5: User Menu and Logout

**Deliverable:** Functional user profile menu in the dashboard navigation with hydration-safe session passing.
**Touches:** `src/components/layout/components/user-menu.tsx`, `src/components/layout/components/top-nav-actions.tsx`, `src/components/layout/mobile-bottom-nav.tsx`, `src/app/(dashboard)/layout.tsx`, `src/lib/auth-client.ts`

**Todos:**

1. [x] Export `User` and `Session` types from `src/lib/auth-client.ts` using `$Infer`.
2. [x] Refactor `UserMenu` to accept `user` as a prop to prevent hydration mismatch (server vs client state).
3. [x] Update `DashboardLayout` to fetch session on server and pass `session.user` down through navigation components.
4. [x] Implement logout using `authClient.signOut()` with a redirect to `/sign-in`.
5. [x] Display user initials as a fallback in the avatar.

**Done when:** Logged-in users can view their profile and securely sign out without hydration errors.

---

### Subtask 6: Tests

**Deliverable:** all tests pass and every test would fail if the logic it targets were deleted.
**Touches:** `src/app/(auth)/sign-up/sign-up.test.tsx`, `src/app/(auth)/sign-in/sign-in.test.tsx`, `e2e/auth.spec.ts`, `src/components/layout/mobile-bottom-nav.test.tsx`, `src/components/layout/top-nav.test.tsx`, `e2e/mobile-navigation.spec.ts`

**Todos:**

1. [x] UI Integration (RTL + MSW): Test `SignupForm` and `SigninForm` interactions and state transitions.
2. [x] UI Integration: Update `MobileBottomNav` and `TopNav` tests to support the new `user` prop.
3. [x] E2E (Playwright): Test full journey: Sign-up -> Dashboard -> Logout -> Sign-in.
4. [x] E2E (Playwright): Fix `mobile-navigation.spec.ts` to handle dynamic user data and dev overlay interception.

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
