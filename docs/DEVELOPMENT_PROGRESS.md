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

## PHASE 03 — Business Dashboard ✅ COMPLETE

- `/dashboard`: 6 stat cards (Today's Sales/Orders, Low Stock, Customers, Expenses, Est. Profit) from
  `GET /dashboard`; date-range "Sales overview" (Today/Yesterday/7/30 Days/This/Last Month/Custom) from
  `GET /reports/sales`; Recent Sales + Top Products (30d) tables; Low Stock table via `GET /inventory/low-stock`.
  Real empty states ("No sales yet") when a business has no data — never fake numbers. A business-less account
  (Super Admin) gets one clear explanation instead of six broken widgets, instead of an infinite loading state.
- **Verified live** (Playwright, both `admin@possaas.test` and `demo.owner@possaas.test` seed accounts): correct
  403→friendly-message handling for the Super Admin edge case; real trial-subscription banner ("Your trial ends
  Sep 6, 2026") for the Demo Client Owner; light/dark/mobile all render correctly; zero console errors.

## PHASE 04 — Products + Categories ✅ COMPLETE

- `/products`: search (debounced) + category/status filters + pagination, columns Product/SKU/Barcode/Category/
  Price/**Stock**/Status/Actions. `Product.stock` is a new backend aggregate (`ProductController` `withSum`/
  `loadSum` over a new `Product::inventories()` relation) — summed across the business for an unpinned actor,
  scoped to just their own branch for a pinned one (Manager/Cashier), matching every other branch-scoped query.
  2 new backend tests cover both cases; 312→314 backend tests still passing.
- `/products/new`, `/products/[id]/edit`: shared `ProductForm` (name, SKU, barcode, category, brand, purchase/
  sale price, tax rate, unit, minimum stock, status, image upload with preview) — react-hook-form + zod,
  server-side 422 errors mapped back to fields.
- `/products/[id]`: basic info, pricing + margin, stock (current vs minimum), recent stock-movement ledger
  (`GET /products/{id}/movements`) as the "activity" section — real data, not a fabricated summary.
- `/products/categories`: tabbed Categories/Brands manager (`NameStatusManager`, reused for both) — list/create/
  edit/delete with a confirm dialog.
- **Fixed during build**: `Field` now auto-generates a matching `id`/`htmlFor` pair (was previously unlabeled
  for screen readers unless a call site remembered to wire it manually); irregular-plural labels ("Category" →
  "Categories") no longer naively appended with "s".
- **Verified live** (Playwright): category creation, product creation (multipart image field present, real
  validation), product list/view with real stock figures, all render correctly with zero console errors.

## PHASE 05 — Inventory Management ✅ COMPLETE

- `/inventory`: 4 stat cards (Total Products, Stock Value, Low Stock, Out of Stock) sourced from
  `GET /reports/inventory` (extended with new `out_of_stock_count`/`product_count` aggregates — additive,
  16/16 report tests still passing) + product catalog count. Tabs: **Stock Levels** (`GET /inventory`, Product/
  SKU/Branch/Stock/Minimum/Status) and **Stock Movements** (new `GET /stock-movements` global feed — Product/
  Type/Quantity/Branch/User/Date). Branch filter for unpinned actors (Owner/Admin); a pinned actor
  (Manager/Cashier) only ever sees their own branch, matching backend scoping.
- Stock Adjustment modal (`POST /inventory/adjust`): searchable `ProductCombobox` (new shared component, reused
  later by Purchases/POS), direction (+/−) + quantity + a reason picker (frontend-only convenience, folded into
  the single backend `notes` field — no schema invented). Deep-linkable via `/inventory?product_id=`, wired from
  the Product view page's "Adjust" action.

## PHASE 06 — Customers + Suppliers ✅ COMPLETE

- `/customers`, `/suppliers`: search + status filter + pagination lists; shared `PartyForm` (name/phone/email/
  address/notes/status) for both create and edit, since the two resources are field-identical.
  `/customers/[id]`, `/suppliers/[id]`: profile pages with real Total Sales/Orders (`GET /reports/sales`
  scoped by `customer_id`) or Total Purchases/Orders (`GET /reports/purchases` scoped by `supplier_id`) +
  recent-transactions table + contact card. **Outstanding Balance intentionally omitted** — no AR/AP ledger
  exists in the backend (confirmed in the discovery report), and the spec only asks for it "if supported."

## Remaining phases (07–12)

Not yet started: Purchases+Expenses, Core POS, Sales History+Returns+Receipts, Reports, Business Management,
Final QA/PWA. This document will be updated as each completes.

---

### How to run

- Frontend: `cd post_software_web && npm run dev` → http://localhost:3000 (proxies to the Laravel API at
  `NEXT_PUBLIC_API_BASE_URL`, see `.env.local`).
- Backend: existing XAMPP/Apache serving `post_software` at `http://localhost/post_software` (unchanged).
- Backend tests: `cd post_software && php artisan test`.
