# Web POS — Development Progress

Tracks phase-by-phase completion per `docs/POS-Mobile.md`. Updated as each phase completes.

---

## PHASE 00.5 — Laravel API Discovery ✅ COMPLETE

- **Deliverable:** `docs/LARAVEL_API_DISCOVERY.md` (776 lines, full route/model/policy/permission audit of `post_software`).
- **Backend extensions** (documented in `docs/BACKEND_EXTENSIONS.md`): added Expenses module (table/model/policy/
  controller/routes), `GET /dashboard`, `GET /subscription`, `GET /payment-methods`, `GET/POST /branches` (+activate/
  deactivate), `GET/PUT /business` (+settings), `PUT /user/password`, `PUT /user/profile`, `POST /auth/forgot-password`,
  `POST /auth/reset-password` (+ frontend-URL override for the reset email link), `GET /notifications` (+read/read-all),
  `GET /stock-movements` (global feed), and real data for the previously-stubbed `GET /reports/expenses`.
  `AuthController::userPayload()` now also returns `roles`/`permissions` so the frontend can gate navigation.
  All additive — no existing endpoint/behavior removed. **312/312 backend tests passing** after changes (19 new tests
  in `ExpensesTest.php` + `SaasVisibilityTest.php`).

## PHASE 01 — Next.js Foundation + Design System ✅ COMPLETE

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict) + Tailwind CSS v4, scaffolded fresh (project
  directory was empty except this spec file).
- Design tokens in `src/app/globals.css`: brand `#00BF63` (light/dark variants), full neutral/status palette, radius/
  shadow/transition scale — all as CSS variables mapped through Tailwind v4's `@theme inline`, per the spec's "no
  hard-coded colors" rule.
- Theme: `next-themes`, persisted, `ThemeToggle` (Light/Dark/System segmented control) — verified working in a real
  browser (see Phase 02 verification below).
- Font: Inter via `next/font/google`.
- Component library (`src/components/ui/*`): Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Card,
  Badge (+StatusBadge), Modal, Drawer, Dropdown, Tabs, Tooltip, Toast (custom, portal-based), Alert, Table, DataTable
  (composite: loading/empty/pagination), Pagination, Search (debounced), Filter, DatePicker/DateRangePicker
  (react-day-picker), ConfirmDialog (+`useConfirm()`), EmptyState, LoadingState/Skeleton, Breadcrumb, Avatar, Label,
  Field, Popover. Radix UI primitives underneath for accessibility (keyboard nav, ARIA, focus trap) with full custom
  styling — no off-the-shelf component framework.
- Stack additions beyond the spec's minimum, each justified: `@tanstack/react-query` (caching/loading/error state per
  module without duplicated boilerplate), `zustand` (small persisted client state — active branch), `react-hook-form`
  + `zod` (form validation), `axios` (typed API client + interceptors), `lucide-react` (single icon set), `class-
  variance-authority` (typed component variants), `recharts` (Phase 03/10 charts), `react-day-picker`.

## PHASE 02 — Authentication + Application Shell ✅ COMPLETE

- **Auth**: `src/lib/auth/auth-context.tsx` — login/logout/session-bootstrap against the real Laravel Sanctum API,
  bearer token in `localStorage` (the only viable mode — backend's CORS is `credentials:false`, no SPA cookie mode
  configured; documented in the discovery report). 401 responses globally clear the session and hard-redirect to
  `/login`. Pages: `/login`, `/forgot-password`, `/reset-password` (reads `?token&email` from the emailed link).
- **Route protection**: `(app)/layout.tsx` client-guards every app route (redirects to `/login` if unauthenticated,
  shows a loading state while the session resolves); `(auth)/layout.tsx` redirects an already-authenticated user away
  from the login/forgot/reset pages.
- **User context**: on login/session-restore, fetches `/user` (id, roles, permissions, client/business/branch ids),
  `/config` (business + resolved settings + enabled features), `/subscription` (best-effort — 404s gracefully for a
  Super Admin, who has no client). Exposed via `useAuth()`: `hasPermission(slug)`, `hasFeature(slug)`.
- **Shell**: `AppShell` = Sidebar (desktop, permission/feature-filtered nav) + Topbar (branch switcher, online/offline
  indicator, notifications bell, profile menu) + BottomNav (mobile: Dashboard/POS/Products + a "More" drawer) +
  MobileNav (drawer, replaces sidebar under `lg`) + `SubscriptionBanner` (trial/expired/suspended strip).
  Navigation config (`src/config/navigation.ts`) matches the spec's exact nav list and is driven entirely by real
  backend permission slugs (§12 of the discovery report) — nothing invented.
- **Branch context**: `useActiveBranch()` — a branch-pinned user (Manager/Cashier) always uses their own `branch_id`;
  anyone else picks via the Topbar switcher (persisted, defaults to the business's main branch).
- **Verified live** (Playwright against the real `npm run dev` + real Laravel API, screenshots inspected): login page
  renders correctly light/dark, invalid credentials show the real Laravel message ("These credentials do not match
  our records.") with field-level highlighting, valid login (Super Admin seed account) redirects to `/dashboard` and
  persists the session — zero console errors other than the expected 422 (bad credentials) and 404s (the dashboard
  page itself doesn't exist yet, built in Phase 03).
- **Checks**: `tsc --noEmit` clean, `eslint` clean (0 errors/warnings), `next build` succeeds.

## PHASE 03 — Business Dashboard 🚧 IN PROGRESS

## Remaining phases (04–12)

Not yet started: Products+Categories, Inventory, Customers+Suppliers, Purchases+Expenses, Core POS, Sales
History+Returns+Receipts, Reports, Business Management, Final QA/PWA. This document will be updated as each
completes.

---

### How to run

- Frontend: `cd post_software_web && npm run dev` → http://localhost:3000 (proxies to the Laravel API at
  `NEXT_PUBLIC_API_BASE_URL`, see `.env.local`).
- Backend: existing XAMPP/Apache serving `post_software` at `http://localhost/post_software` (unchanged).
- Backend tests: `cd post_software && php artisan test`.
