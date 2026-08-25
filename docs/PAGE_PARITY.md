# Page Parity Matrix — Web POS vs Desktop POS

Source of truth for navigation order: `post_software_web/src/config/navigation.ts` (`NAV_GROUPS`).
Desktop was audited against it directly and now mirrors it exactly, including group labels
(`post_software_app/src/renderer/src/lib/navigation.ts`).

> **Update (UI/UX redesign pass):** Desktop's sidebar width (`w-56`→`w-60`) and icon size
> (`size-4`→`size-4.5`) were themselves found to be a real inconsistency with Web's own sidebar
> during the redesign audit — not just a density choice. Both now match Web exactly. Full detail
> in `DESKTOP_UI_UX_AUDIT.md`; every page row below was re-verified live and required no further
> page-order or navigation-structure changes.

Legend — **Parity Status**: `MATCH` (same functionality, platform-appropriate implementation) ·
`FIXED` (a real gap found in this audit and implemented during it) · `PLATFORM DIFFERENCE`
(intentional, documented, does not reduce functionality) · `DEFERRED` (real, lower-priority gap,
not fixed in this pass — see `QA_BUGS.md`).

| Order | Group | Page | Web Route(s) | Desktop Route | Laravel APIs | Web | Desktop | Parity Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | — | Dashboard | `/dashboard` | `/dashboard` | `GET /dashboard` | ✅ | ✅ | MATCH | Desktop adds an offline device-local fallback view when disconnected — platform difference, additive only. |
| 2 | — | POS | `/pos` | `/pos` | `GET /sync/*` (device) or local SQLite; `POST /sales` / `POST /sync/sales` | ✅ | ✅ | MATCH (after fixes) | See §POS below — 3 real gaps found and fixed. |
| 3 | Sales | Sales History | `/sales`, `/sales/[id]` | `/sales` (list + detail modal) | `GET /sales`, `GET /sales/{id}` | ✅ | ✅ | MATCH | Web uses a dedicated detail page; Desktop uses a modal with identical fields/actions (Print, Return) — platform difference in navigation shape, not function. |
| 4 | Sales | Returns | `/returns`, `/returns/[id]` | `/returns` (list; creation via Sales History → Return Items) | `GET /returns`, `POST /sales/{sale}/returns` | ✅ | ✅ | MATCH | Same as above — list + inline action instead of a detail route. |
| 5 | Catalog | Products | `/products`, `/products/new`, `/products/[id]`, `/products/[id]/edit`, `/products/categories` | `/products` (list + modal CRUD, Categories tab) | `GET/POST/PUT/DELETE /products`, `/categories` | ✅ | ✅ | MATCH (after fix) | Category + status filters were missing on Desktop — **fixed this audit**. Product image upload remains web/admin-only — DEFERRED (see `QA_BUGS.md` #6). |
| 6 | Catalog | Inventory | `/inventory` | `/inventory` | `GET /inventory`, `/inventory/low-stock`, `POST /inventory/adjust` | ✅ | ✅ | MATCH | Desktop reads from the local SQLite cache (offline-capable) instead of a live API call — intentional platform advantage, not a functional gap. |
| 7 | Relationships | Customers | `/customers`, `/customers/new`, `/customers/[id]`, `/customers/[id]/edit` | `/customers` (list + modal CRUD) | `GET/POST/PUT/DELETE /customers` | ✅ | ✅ | MATCH (after fix) | Status filter was missing on Desktop — **fixed this audit**. |
| 8 | Relationships | Suppliers | `/suppliers`, `/suppliers/new`, `/suppliers/[id]`, `/suppliers/[id]/edit` | `/suppliers` (list + modal CRUD) | `GET/POST/PUT/DELETE /suppliers` | ✅ | ✅ | MATCH (after fix) | Status filter was missing on Desktop — **fixed this audit**. |
| 9 | Purchasing | Purchases | `/purchases`, `/purchases/new`, `/purchases/[id]` | `/purchases` (list + multi-line create modal) | `GET/POST /purchases`, `/receive`, `/cancel` | ✅ | ✅ | MATCH | Same fields, same actions (Receive/Cancel), same server-computed totals. |
| 10 | Purchasing | Expenses | `/expenses`, `/expenses/new`, `/expenses/[id]`, `/expenses/[id]/edit` | `/expenses` (list + modal CRUD) | `GET/POST/PUT/DELETE /expenses` | ✅ | ✅ | MATCH (after fix) | Category was a free-text field on Desktop; **fixed this audit** to use the exact same fixed 8-value category list as web's `expense-form.tsx`, plus a category filter. Branch filter intentionally omitted — see Notes below. |
| 11 | Insights | Reports | `/reports` (tabs) | `/reports` (tabs) | `GET /reports/{sales,purchases,inventory,products,customers,profit,expenses}` | ✅ | ✅ | MATCH | All 7 tabs present on both, same summary stats + tables. Web uses preset range tabs (Today/7d/30d/...) + a calendar picker; Desktop uses plain `<input type=date>` — PLATFORM DIFFERENCE (both filter the same way server-side), acceptable. |
| 12 | Business | Employees | `/employees`, `/employees/new`, `/employees/[id]`, `/employees/[id]/edit` | `/employees` (list + modal CRUD) | `GET/POST/PUT /employees`, `/activate`, `/deactivate` | ✅ | ✅ | MATCH | Both explicitly send `business_id` on create (the documented backend bug workaround). |
| 13 | Business | Branches | `/branches` | `/branches` (list + modal CRUD) | `GET/POST/PUT /branches`, `/activate`, `/deactivate` | ✅ | ✅ | MATCH | |
| 14 | Workspace | Settings | `/settings` (Business/Receipt&Tax/Appearance tabs), `/settings/profile` | `/settings/*` (Account/Business/Printer/Sync Status/Connection/About) | `GET/PUT /business`, `/business/settings`, `PUT /user/password`, `/user/profile` | ✅ | ✅ | MATCH + PLATFORM ADDITIONS | Printer, Sync Status, Connection, and About/Updates sections exist only on Desktop — correctly platform-specific (hardware, offline sync, auto-update have no web equivalent). Order in the sidebar was swapped vs web (Subscription before Settings) — **fixed this audit** to match web's Settings-then-Subscription order. |
| 15 | Workspace | Subscription | `/subscription` | `/subscription` | `GET /subscription` | ✅ | ✅ | MATCH (shape bug fixed) | Desktop's initial implementation assumed the wrong (flat) response shape — **fixed earlier this build cycle** after confirming the real nested shape via `curl`. |
| — | Auth | Login | `/login` | in-app login screen | `POST /auth/login` | ✅ | ✅ | MATCH | |
| — | Auth | Forgot/Reset password | `/forgot-password`, `/reset-password` | **not implemented** | `POST /auth/forgot-password`, `/auth/reset-password` | ✅ | ❌ | DEFERRED | Real gap — see `QA_BUGS.md` #7. Password reset via a desktop terminal is a legitimate but lower-priority flow (a locked-out cashier can be reset by an admin via the web app or a "forgot password" email either way). |
| — | Shell | Notifications bell | Topbar | Topbar | `GET /notifications`, `PATCH /notifications/{id}/read`, `/read-all` | ✅ | ✅ (after fix) | FIXED | Desktop had **no notifications UI at all** before this audit — **implemented this audit** (`components/shell/notifications-bell.tsx`), same endpoints, same unread-badge/mark-all-read behavior. |
| — | Shell | Branch switcher | Topbar (only shown to a non-pinned, multi-branch actor) | static branch label only | `GET /branches` | ✅ (conditional) | ⚠️ static only | DEFERRED | See `QA_BUGS.md` #8 — architectural: a Desktop *device* (not just the user) is permanently tied to one branch at registration (by design, for local/offline data scope), so a true "switch active branch" control doesn't fit the same way it does for a stateless web session. Not reachable with the demo account either way (it is branch-pinned). |

## POS-specific parity (page 2 above, expanded)

| Capability | Web | Desktop (before audit) | Desktop (after audit) | Status |
|---|---|---|---|---|
| Product search | ✅ | ✅ | ✅ | MATCH |
| Barcode scan | ✅ (keyboard-emulation) | ✅ | ✅ | MATCH |
| Category browsing (rail/pills) | ✅ `category-rail.tsx` | ❌ search-only | ✅ added | **FIXED** |
| Add/remove/adjust quantity | ✅ | ✅ | ✅ | MATCH |
| Cart-wide discount (percent/fixed) | ✅ `discount-popover.tsx` | ❌ store method existed, **no UI** | ✅ added, identical formula | **FIXED** |
| Per-line discount display | ✅ | ❌ | ✅ added | **FIXED** |
| Clear cart | ✅ | ❌ | ✅ added | **FIXED** |
| Customer selection | ✅ | ✅ | ✅ | MATCH |
| Payment (split, multiple methods) | ✅ | ✅ | ✅ | MATCH |
| Checkout button label | "Charge {total}" | "Checkout (F4)" | "Charge {total} (F4)" | **FIXED** (terminology parity + kept the desktop-specific shortcut hint) |
| Receipt / print | ✅ (browser print) | ✅ (native/ESC-POS) | ✅ | MATCH — platform-appropriate implementation |
| Offline sale | N/A (web is online-only by design) | ✅ | ✅ | PLATFORM DIFFERENCE (Desktop-only, additive, per master spec) |
| Cash drawer | N/A | ✅ | ✅ | PLATFORM DIFFERENCE (Desktop-only hardware) |

Full bug detail for every "FIXED"/"DEFERRED" row above is in `QA_BUGS.md`.
