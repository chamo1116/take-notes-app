---
name: nextjs-expert
description: Use when building, reviewing, or debugging the Next.js frontend for this project (App Router, React, TypeScript). Applies Next.js best practices for project structure, Server/Client Components, data fetching, pnpm workflows, responsive Tailwind design, performance, and high-coverage testing with Vitest/RTL/Playwright.
---

# Next.js Expert (App Router)

Apply these practices whenever writing or reviewing Next.js code in this repo. Assume the **App Router** (`app/`), **TypeScript**, and **Tailwind CSS**. Prefer the framework's built-in mechanisms (Server Components, `next/image`, `next/font`, route caching, etc.) over hand-rolled alternatives — most manual solutions duplicate something Next.js already optimizes.

## Package management: pnpm only

- Use `pnpm` for every dependency operation — `pnpm add`, `pnpm add -D`, `pnpm remove`, `pnpm install`. Never use `npm install`/`yarn add`; a `package-lock.json` or `yarn.lock` appearing in the repo is a bug, delete it and reinstall with pnpm.
- Commit `pnpm-lock.yaml`. Never hand-edit it.
- Use `pnpm dlx` instead of `npx` for one-off package execution (codegen, scaffolding).
- Pin exact versions for framework-critical packages (`next`, `react`, `react-dom`) so patch upgrades are deliberate, not silent.
- Run `pnpm exec <tool>` (or a `package.json` script) rather than assuming a global install of lint/test/build tools.

## Project structure (App Router)

- Route structure lives under `app/`; colocate a route's own components/hooks/tests in the same segment folder, and put cross-route shared code in `components/`, `lib/`, `hooks/`.
- Use route groups `(group)` to organize routes without affecting the URL, and parallel/intercepting routes only when the UI genuinely needs them (modals over a route, dashboards with independent panels) — don't reach for them by default.
- Every route segment that can fail or load slowly gets its own `error.tsx` and `loading.tsx`, not just a top-level catch-all.
- Centralize environment variable access (and validation, e.g. with `zod`) in one `env.ts` rather than reading `process.env.X` scattered across files — fail fast at boot if a required var is missing.

## Server vs Client Components

- Default every component to a Server Component. Add `"use client"` only at the leaf components that actually need interactivity (state, effects, browser APIs, event handlers) — push the boundary as far down the tree as possible so most of the page still renders/streams from the server.
- Never fetch data in a Client Component with `useEffect` when a Server Component can fetch it directly (`async function Page()`), or via a Server Action — client-side fetching means a loading spinner and a slower TTI for data the server already had at request time.
- Don't import server-only code (DB clients, secrets, `fs`) into a file that a Client Component tree can pull in; use the `server-only` package to make that a build-time error instead of a runtime leak.
- Pass only serializable props from Server to Client Components.

## Data fetching & mutations

- Use `fetch` with Next's caching options (`cache`, `next: { revalidate, tags }`) deliberately for every request — don't leave the default uncached-vs-cached behavior implicit; state the intent (`force-cache`, `no-store`, or a `revalidate` window) at the call site.
- Use Server Actions for mutations from forms wherever possible instead of hand-rolled `fetch` to a Route Handler from client code; call `revalidatePath`/`revalidateTag` after a mutation so stale cached data doesn't linger.
- Use Route Handlers (`route.ts`) only for endpoints that must be hit by non-Next clients (webhooks, external integrations, a mobile app) — internal data needs go through Server Components/Server Actions instead.
- Validate all external input (form data, search params, Route Handler bodies) with `zod` (or similar) at the boundary, not deep inside business logic.

## Responsive design (Tailwind, mobile-first)

- Design and write styles mobile-first: unprefixed Tailwind utilities target the smallest viewport, add `sm:`/`md:`/`lg:`/`xl:`/`2xl:` prefixes to layer on larger-viewport overrides — never the reverse (don't design desktop-first then bolt on a mobile override).
- Every new component/page must be checked at minimum at 375px (mobile), 768px (tablet), and 1440px (desktop) before it's considered done.
- Use fluid, relative units (`%`, `rem`, `min()`/`max()`/`clamp()`, Tailwind's `container` + responsive padding) over fixed pixel widths for layout containers.
- Use CSS Grid/Flexbox utilities (`grid-cols-*`, `flex-col md:flex-row`) to reflow layout across breakpoints rather than hiding/showing duplicate markup with `hidden`/`block` per breakpoint.
- Verify touch targets (≥44×44px) and tap-friendly spacing on interactive elements for mobile, and that hover-only interactions have a non-hover fallback (mobile has no hover).
- Test with real device widths (Playwright's device presets or browser devtools), not just by shrinking a desktop window.

## Logging

- Use a single small logging helper (e.g. `lib/logger.ts`) instead of scattering raw `console.log` — route through it consistently so log format/level is uniform and stray debug statements are easy to grep out before merging.
- Log meaningful, useful events, not noise: in Server Actions/Route Handlers, log auth failures, unexpected backend/API errors, and other business-relevant outcomes at an appropriate level — don't log every successful request.
- Server-side code (Server Components, Server Actions, Route Handlers) logs to the server terminal/process logs; client-side (`"use client"`) code logs to the browser console. Be deliberate about which side a log runs on, and never ship debug `console.log`s left over from client-side development.
- On failed external calls (`fetch` to the backend, third-party APIs), log the failure server-side with enough context to debug (status code, endpoint, a request id if available) before returning a generic message to the user — don't let a fetch failure disappear silently into a bare `if (!response.ok)`.
- Never log secrets or sensitive data — passwords, tokens, full request/response bodies containing user credentials. Log identifiers (email, user id), not the credential itself.
- Surface unexpected render/data errors through `error.tsx` boundaries, and log them there too, rather than letting them fail silently to a blank section of the page.

## Performance

- Images: always `next/image`, never a raw `<img>`, with explicit `width`/`height` (or `fill` + a sized parent) to avoid layout shift, and `priority` only on the actual above-the-fold LCP image.
- Fonts: always `next/font` (`next/font/google` or `next/font/local`) so fonts self-host and avoid render-blocking requests/layout shift — never a manual `<link>` to a font CDN.
- Code-split non-critical, below-the-fold, or interaction-gated UI with `next/dynamic` (`ssr: false` only when the component truly can't render server-side, e.g. it touches `window`).
- Track Core Web Vitals (LCP, CLS, INP) as the definition of "fast" — use `next build`'s output + Lighthouse/`@next/bundle-analyzer` to catch regressions before merging, not after a user complains.
- Avoid client-side waterfalls: parallelize independent Server Component data fetches (`Promise.all`), and use `<Suspense>` boundaries to stream slow parts of a page instead of blocking the whole route on the slowest fetch.
- Keep the Client Component bundle lean: audit `pnpm dlx @next/bundle-analyzer` output when adding a heavy client dependency, and prefer a server-rendered alternative when one exists.

## TypeScript

- TypeScript is mandatory, always — every file is `.ts`/`.tsx`, never plain `.js`/`.jsx`. This is non-negotiable regardless of how small or throwaway a script or component seems (config files, scripts, one-off components included).
- `strict: true` in `tsconfig.json`, no new `any` — type unknown external data (API responses, form input) at the boundary with `zod` and infer types from the schema (`z.infer<typeof schema>`) rather than hand-writing a parallel interface.
- Type component props explicitly (`type Props = {...}`), including children when accepted; don't rely on implicit `any` from untyped props.
- Enforce this in tooling, not just convention: `tsc --noEmit` runs in CI/pre-commit alongside lint/tests, and ESLint's `no-restricted-syntax`/a plain `find` check for stray `.js`/`.jsx` files under `app/`, `components/`, `lib/`, `hooks/` should fail the build if one appears.

## Testing & coverage

- Unit/component tests: **Vitest + React Testing Library**. Test components through user-observable behavior (rendered text, roles, interactions via `@testing-library/user-event`) — not implementation details like internal state or class names.
- E2E, responsive, and cross-browser/device checks: **Playwright**, using its built-in device emulation (`playwright.config.ts` `devices['iPhone 13']`, `devices['iPad Pro']`, desktop viewports) to cover the same breakpoints called out above. Every user-facing flow (create/edit/delete a note, navigation, auth if present) needs at least one Playwright test exercising it end-to-end.
- Test Server Components/Server Actions by testing the underlying functions directly (import and call them) plus a Playwright test for the rendered/mutated result — don't try to unit-render a Server Component with RTL, it can't execute server-only code.
- Maintain high coverage as a hard bar: run `vitest run --coverage` and treat a coverage drop on touched files as a sign a case was missed, not just a metric. Configure a coverage threshold (`test.coverage.thresholds` in `vitest.config.ts`) so CI fails the build if coverage regresses.
- Mock network/data boundaries (MSW for `fetch`, or dependency-inject the data layer) rather than hitting real external services in unit/component tests; Playwright e2e tests can run against a seeded test environment.
- Wire `vitest run --coverage` and `pnpm exec playwright test` into pre-commit/CI alongside lint/typecheck so nothing merges untested.

## Containerization

- The app is always containerized. There must be a `Dockerfile` for the Next.js app and a `docker-compose.yml` (or equivalent) for local dev/CI — no "run it locally with a bare Node install" fallback path as the primary workflow.
- **Every command runs inside the container**, never on the host: `docker compose exec web pnpm dev`, `docker compose exec web pnpm test -- --coverage`, `docker compose exec web pnpm exec playwright test`, `docker compose exec web pnpm lint`, `docker compose exec web pnpm build`. Use `docker compose run --rm web <cmd>` for one-off commands when the service isn't already running.
- Never `pnpm install` or run the dev server on the host — install dependencies inside the image (rebuild via `docker compose build` after touching `package.json`/`pnpm-lock.yaml`) and exec into the container for everything else, including Playwright (browsers get installed inside the image too, e.g. `pnpm exec playwright install --with-deps` as a Dockerfile step).
- Keep `pnpm-lock.yaml` committed and rebuild the image whenever it changes, rather than installing ad hoc inside a running container and letting the image drift from the lockfile.
- `docker compose up` should be the one host-level command needed to get the stack running; everything else (dev server, tests, lint, typecheck, build) goes through `docker compose exec`/`run`.

## Accessibility (ties directly to responsive/UX quality)

- Semantic HTML first (`button`, `nav`, `main`, headings in order) before reaching for ARIA attributes.
- Every interactive element must be keyboard-operable and have a visible focus state — don't remove Tailwind's focus ring without providing an equivalent.
- Run `eslint-plugin-jsx-a11y` (via `next lint`) and fix findings; don't suppress without a documented reason.

## When reviewing existing code

Flag, in priority order: (1) unnecessary `"use client"` on components that don't need interactivity, (2) client-side data fetching that should be a Server Component/Server Action, (3) raw `<img>`/manual font `<link>` instead of `next/image`/`next/font`, (4) layout that only works at one breakpoint or hides/duplicates markup per breakpoint instead of reflowing, (5) missing or implementation-detail-focused tests, (6) `npm`/`yarn` usage instead of `pnpm`, (7) commands documented/run on the host instead of `docker compose exec`/`run`.
