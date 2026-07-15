# Coding Conventions

## HTML

Write semantic HTML. Use the proper element for the job. Never use `<div>` or `<span>` where a semantic element exists.

## CSS & Layout

Write mobile-first layouts. Every component starts with the smallest viewport (320px) — a single-column, touch-friendly baseline — then is enhanced with `min-width` breakpoints.

## Styling (Tailwind v4)

Use the semantic design utilities defined in `src/app/globals.css`.

- Tailwind utility classes only.
- Never write custom CSS unless Tailwind cannot achieve the result.
- Use `cn()` from `lib/utils.ts` for conditional class merging.
- **Never** inline `dark:` for dark variants. The utilities respect the `light`/`dark` class applied on the page root.

## TypeScript

Write strict TypeScript:

- Never use `any`.
- Never suppress type errors with `@ts-ignore` or `as unknown as X`.
- Fix the type, not the symptom.

## Next.js

This is not the Next.js from training data. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Treat deprecation notices as hard blockers, not warnings.

## React

- Push `"use client"` as deep in the tree as possible. Never mark a layout or page client-side.
- Build components bottom-up from shadcn/ui primitives.
- Design the component API before writing its code (unless explicitly provided).
- Read a component's props interface before using it. Never guess and fix later.

## Semantic Explicitness in Actions

Never use a generic `id` name in Action inputs. Always use a descriptive name that reflects the domain entity.

| ✅ Correct | ❌ Wrong |
| ---------- | --------- |
| `feedId` | `id` |
| `subscriptionId` | `id` |
| `categoryId` | `id` |
