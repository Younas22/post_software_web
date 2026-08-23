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

## PHASE 07 — Purchases + Expenses ✅ COMPLETE

- `/purchases`: status + branch filters, list, `PurchaseForm` (supplier/branch pickers, line items via
  `ProductCombobox`, live client-side subtotal/discount/tax/total preview labeled "calculated by the server on
  save" — the created record's real backend totals are what's actually displayed afterward, never the preview).
  `/purchases/[id]`: items table + totals + Mark Received / Cancel actions (confirм dialogs), wired to
  `PATCH .../receive` and `.../cancel`.
- `/expenses`: date-range + branch + category filters, full CRUD (`ExpenseForm`), view page. Category is a
  fixed frontend list (Rent/Utilities/Salaries/Supplies/Maintenance/Marketing/Transport/Other) since the
  backend stores it as a free string (no lookup table exists, confirmed in the discovery report) — kept
  consistent rather than free-text to keep the Expenses-by-category report meaningful.
- **Critical bug found and fixed by live testing**: `useActiveBranch()` only fetched the branches list for an
  *unpinned* actor, so a branch-pinned user (Manager/Cashier — `branch_id` set on their account, which is the
  common case) got `branch: null` everywhere — blank Topbar branch label, and every branch-defaulting form
  (Purchases, Expenses, and — critically — the upcoming POS) stuck on an empty "Select branch" picker. Fixed to
  always fetch the list and narrow it to just the pinned branch, so `branch` resolves correctly for everyone.
  Caught via Playwright testing against the real seeded Demo Owner account (which is branch-pinned) before
  Phase 08 (POS) could inherit the same bug.
- **Verified live**: supplier → purchase (with a real line item, real computed total) → received end-to-end
  against the real API, zero console errors after the fix.

## PHASE 08 — Core POS Sales Engine ✅ COMPLETE

- `/pos`: desktop layout (category rail · product grid · cart panel), mobile (floating cart button → drawer).
  Debounced product search (name/SKU/barcode) + category filter; Enter-to-add when search narrows to exactly
  one match (barcode-scanner-friendly). Cart (Zustand store, session-only): add/remove/±qty, per-line discount,
  a cart-wide "apply discount to all" quick action (Fixed or %), Walk-in/select/inline-create customer.
  Client-side subtotal/tax/discount preview is clearly a preview — **every real total comes from the backend
  response**, matching `SaleService`'s server-authoritative pricing exactly (client never sends price/tax/total,
  only `product_id`/`quantity`/`discount` per the actual `StoreSaleRequest` contract — verified against the
  real backend code, not assumed).
- Payment: method picker sourced from the new `GET /payment-methods`, Cash shows Received/Change, other
  methods take an optional reference. Checkout generates one `client_transaction_id` (UUID) per attempt and
  **reuses it on retry** — the idempotency contract `SaleService`/`IdempotencyService` require.
- On failure (e.g. insufficient stock → 409): friendly inline error, **cart is never cleared**, cashier can
  fix and retry immediately. On success: invoice number, total, Print Receipt (real `window.print()` via a new
  shared `Receipt` component — also reused by Sales History in Phase 09) / New Sale.
  Keyboard: F2 focuses search, F4 opens payment, Esc closes the open overlay.
  Gates: `sales.create` permission, `pos` feature flag, and an available branch — each with its own explained
  empty state rather than a blank/broken page.
- **Verified live end-to-end against the real backend** (Playwright): browsed real stock-aware product cards →
  built a cart → hit a genuine 409 insufficient-stock rejection with the cart correctly preserved → topped up
  stock via the real `inventory/adjust` API → completed a real sale (`INV-1-260823-…`) → confirmed the product
  grid's stock count live-updated (50 → 49) → mobile viewport confirmed responsive. Zero console errors.

## PHASE 09 — Sales History + Returns + Receipts ✅ COMPLETE

- Added **Sales History** and **Returns** to the sidebar nav (gated on `sales.view`/`returns.view`) — the
  master nav list in the spec didn't explicitly enumerate them, but Phase 09 requires the screens and nothing
  else in the app links to them, so they needed a discoverable entry point.
- `/sales`: date-range + branch + payment-method + status filters. `/sales/[id]`: items/totals/payment/cashier/
  branch/customer, Print Receipt (shared `Receipt` component from Phase 08), Return Items action.
- `/returns`, `/returns/[id]`: list + detail (Original Invoice, Product, Returned Quantity, Reason, Refund
  Amount). `ReturnModal` (opened from a sale) shows each line's already-returned vs. remaining-returnable
  quantity — computed by fetching that sale's existing returns and summing per `sale_item_id` client-side
  (no backend field exposes this directly; verified `SaleItem::returnedQuantity()` is a plain PHP method, not
  a serialized attribute). The refund-amount preview mirrors `ReturnService`'s own math exactly
  (`line_total / quantity × returned qty`) — the real `refund_amount` still comes from the API response.
  Returns never edit/delete the original sale — confirmed against `ReturnService`, which only ever creates a
  new `SaleReturn` row.
- **Verified live end-to-end**: opened a real sale, processed a partial return through the modal, got a real
  `RET-…` reference and refund amount back, "Return processed" toast, zero console errors.

## PHASE 10 — Business Reports ✅ COMPLETE

- `/reports`: 7 tabs (Sales, Purchases, Expenses, Inventory, Products, Customers, Profit), each with its own
  date-range preset (Today/Yesterday/7/30 Days/This/Last Month/Custom) + branch filter, backed 1:1 by the
  corresponding `GET /reports/*` endpoint — no client-computed aggregates. Expenses adds a by-category bar
  breakdown; Profit surfaces the backend's own documented caveat (cost estimated from *current* purchase price,
  not historical) as an inline note rather than hiding the limitation.
  Export (CSV/PDF) is **not implemented** — confirmed no export endpoint exists anywhere in the discovery
  report, and the spec says to add it only "if the Laravel API supports export."
- **Critical bug found and fixed by live testing against the real MySQL database** (not just the SQLite-backed
  test suite): `ReportController::inventory()`'s summary query cloned a builder that already carried
  `select('inventories.*')`, then appended aggregate `selectRaw()` columns onto it — SQLite's lenient GROUP BY
  silently accepted the resulting mixed raw+aggregate SELECT (so all 314 backend tests still passed), but MySQL's
  strict mode correctly rejects it (`Error 1140: Mixing of GROUP columns with no GROUP BY`), so the endpoint
  500'd on real data. This was a **pre-existing bug**, not something my own `out_of_stock_count`/`product_count`
  additions introduced — it only surfaced because those two extra aggregate columns are what I was testing live.
  Fixed by giving the summary and paginated-rows queries their own independent `select()` off a shared unselected
  base. Re-verified: 314/314 backend tests still pass, and the live endpoint now returns correctly against MySQL.
- **Verified live**: all 7 tabs render real figures against the seeded data, correct empty/loading states, zero
  console errors after the fix.

## PHASE 11 — Business Management ✅ COMPLETE

- `/employees`: list (search, seat usage "1/3 used" from `GET /subscription`), create/edit (`EmployeeForm`:
  name/email/password/role/branch — role limited to the 3 slugs the backend actually allows staff to be
  assigned, `business-admin`/`manager`/`cashier`, confirmed against `StoreEmployeeRequest`'s exclusion list),
  activate/deactivate. "New Employee" disables at the plan's user-seat limit with an upgrade prompt.
- `/branches`: list + modal create/edit (name/code/phone/address/active) + activate/deactivate, same
  limit-aware disabling for `max_branches`. Uses the new `GET/POST/PATCH /branches` endpoints.
- `/settings`: **Business** tab (name/phone/email/address/currency/timezone/logo via `PUT /business`),
  **Receipt & Tax** tab (tax_rate/invoice_prefix/receipt_footer via `PUT /business/settings`, the registry-driven
  settings endpoint), **Appearance** tab (theme toggle). `/settings/profile`: name/email + change-password,
  using the new `PUT /user/profile` and `PUT /user/password`.
- `/subscription`: plan name/price/status/dates, usage bars (Users/Branches/Devices, red at 100%), enabled
  features — all from the new `GET /subscription` endpoint.
- **Verified live**: employee list shows real seat usage, branch limit correctly disables creation with an
  "Upgrade your plan" message once at capacity (Starter plan's `max_branches: 1`, already consumed by the
  seeded Main Branch) — confirmed this is correct enforcement-aware UX, not a bug, by checking the actual
  subscription data. Settings/Profile forms render and prefill real data. Zero console errors.

## Remaining phases (12)

Not yet started: Final Integration, Security, Performance & PWA QA. This document will be updated once
complete.

---

### How to run

- Frontend: `cd post_software_web && npm run dev` → http://localhost:3000 (proxies to the Laravel API at
  `NEXT_PUBLIC_API_BASE_URL`, see `.env.local`).
- Backend: existing XAMPP/Apache serving `post_software` at `http://localhost/post_software` (unchanged).
- Backend tests: `cd post_software && php artisan test`.
