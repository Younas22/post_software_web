# Feature Parity Matrix — Laravel / Web / Desktop

Covers every module listed in the audit brief. "Laravel" = does a real, verified backend API exist
(read from actual route files/controllers, not assumed). "Same Behavior" = do Web and Desktop send
the same fields, honor the same permissions, and produce the same result for the same input.

> **Update (UI/UX redesign pass):** A follow-up pass re-audited Desktop's *visual/UX density*
> (control sizing, spacing, table/sidebar/topbar proportions — see `DESKTOP_UI_UX_AUDIT.md`) and
> found **no additional functional parity gaps** beyond what's already listed below — every row's
> status here was re-confirmed live (see `CROSS_PLATFORM_QA.md`), not just left as previously
> written. The redesign pass changed layout/spacing/sizing only, never business behavior.

| # | Feature | Laravel | Web | Desktop | Same Behavior | Status | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Authentication (login/logout/session restore) | ✅ Sanctum | ✅ | ✅ | ✅ | MATCH | Desktop additionally supports a 72h offline session-restore grace window — additive, documented. |
| 2 | Dashboard | ✅ `GET /dashboard` | ✅ | ✅ | ✅ | MATCH | |
| 3 | POS (sell/cart/checkout) | ✅ `POST /sales`, `/sync/sales` | ✅ | ✅ | ✅ (after fixes) | MATCH | See `PAGE_PARITY.md` POS table — 4 gaps fixed this audit. |
| 4 | Products | ✅ full CRUD | ✅ | ✅ | ✅ (after fixes) | MATCH | Category/status filters added this audit. Image upload remains web-only. |
| 5 | Categories | ✅ full CRUD | ✅ | ✅ | ✅ | MATCH | |
| 6 | Inventory (stock balance) | ✅ | ✅ | ✅ | ✅ | MATCH | Desktop reads local cache; same numbers once synced. |
| 7 | Stock Adjustments | ✅ `POST /inventory/adjust` | ✅ | ✅ | ✅ | MATCH | |
| 8 | Stock Movements | ✅ `GET /products/{id}/movements`, `GET /stock-movements` (global) | ✅ (per-product, on product detail) | ❌ not surfaced | — | DEFERRED | Neither app exposes the *global* cross-product feed prominently; low priority (see `QA_BUGS.md` #9). |
| 9 | Customers | ✅ full CRUD | ✅ | ✅ | ✅ (after fix) | MATCH | Status filter added this audit. |
| 10 | Suppliers | ✅ full CRUD | ✅ | ✅ | ✅ (after fix) | MATCH | Status filter added this audit. |
| 11 | Purchases | ✅ create/receive/cancel (no destroy) | ✅ | ✅ | ✅ | MATCH | |
| 12 | Purchase Items | ✅ (embedded in Purchase) | ✅ | ✅ | ✅ | MATCH | No standalone endpoint on either side — matches backend, not a gap. |
| 13 | Expenses | ✅ full CRUD | ✅ | ✅ (after fix) | ✅ | MATCH | Category was free-text on Desktop; now uses the same fixed 8-category list as Web. |
| 14 | Sales | ✅ | ✅ | ✅ | ✅ | MATCH | |
| 15 | Sale Details | ✅ `GET /sales/{id}` | ✅ dedicated page | ✅ modal | ✅ | MATCH | Platform-appropriate navigation shape, same data/actions. |
| 16 | Returns | ✅ `POST /sales/{sale}/returns` | ✅ | ✅ | ✅ | MATCH | |
| 17 | Payments | ✅ (embedded in Sale) | ✅ | ✅ | ✅ | MATCH | No standalone `/payments` list endpoint on the backend — neither app can offer one; not a gap. |
| 18 | Receipts | ✅ `GET /sales/{id}/receipt` (structured) | ✅ (browser print) | ✅ (system dialog or ESC/POS) | ✅ same fields | MATCH | Business/branch/invoice/date/cashier/customer/items/qty/price/discount/tax/total/payment all present on both. |
| 19 | Reports (7 types) | ✅ all 7 | ✅ all 7 | ✅ all 7 | ✅ | MATCH | `expenses` report now real data (previously `501`) per `BACKEND_EXTENSIONS.md`. |
| 20 | Employees | ✅ | ✅ | ✅ | ✅ | MATCH | Both apply the `business_id`-on-create workaround for the known backend bug. |
| 21 | Roles | ✅ read-only via `GET /user`/`role_permission` seed | ✅ (role select on Employee form) | ✅ | ✅ | MATCH | Real slugs used on both: `business-admin`, `manager`, `cashier` (super-admin/client-owner excluded from the employee form on both, per backend rule). |
| 22 | Permissions | ✅ real DB-driven | ✅ nav+action gated | ✅ nav+action gated | ✅ | MATCH | Neither app hard-codes role→permission assumptions; both read `GET /user`'s live `permissions[]`. |
| 23 | Branches | ✅ full CRUD (added for web, reused as-is) | ✅ | ✅ | ✅ | MATCH | |
| 24 | Business Settings | ✅ `GET/PUT /business`, `/business/settings` | ✅ | ✅ | ✅ | MATCH | |
| 25 | User Profile | ✅ `PUT /user/profile`, `/user/password` | ✅ `/settings/profile` | ✅ Settings > Account | ✅ | MATCH | |
| 26 | Subscription | ✅ `GET /subscription` | ✅ | ✅ (shape bug fixed) | ✅ | MATCH | |
| 27 | Packages (catalog/pricing) | ❌ not implemented (Admin Blade only) | ❌ | ❌ | — | MATCH (both absent) | Confirmed absent in `LARAVEL_API_DISCOVERY.md` §21 — correctly not built on either frontend. |
| 28 | Features (flags) | ✅ read via `GET /config`/`sync/bootstrap` | ✅ gates POS/Reports nav | ✅ gates POS/Reports nav | ✅ | MATCH | Only `pos` and `reports` are feature-gated in the real backend — both apps gate exactly those two, nothing invented. |
| 29 | Devices | ✅ register/current (JSON); list/activate/block = Admin Blade only | N/A (browser has no device concept) | ✅ register/current/forget | ✅ | MATCH (by design) | Device management UI intentionally desktop-only — it's the Electron/offline terminal identity mechanism, not applicable to a browser tab. |
| 30 | Notifications | ✅ `GET/PATCH /notifications` | ✅ bell icon | ❌ → ✅ **fixed this audit** | ✅ | **FIXED** | Real, concrete gap found and implemented — see `QA_BUGS.md` #1. |
| 31 | Activity Logs | ❌ Admin Blade only, no JSON API | ❌ | ❌ | — | MATCH (both absent) | Correctly absent from both — no token-authed endpoint exists for a client-side user to read their own audit trail. |

## Additional cross-cutting features checked

| Feature | Web | Desktop | Status | Notes |
|---|---|---|---|---|
| Branch switcher (multi-branch, non-pinned actor) | ✅ | ⚠️ static label only | DEFERRED | See `PAGE_PARITY.md` notes — architectural (device is branch-pinned by design). |
| Password reset (forgot password) | ✅ | ❌ | DEFERRED | See `QA_BUGS.md` #7. |
| Offline POS | N/A (not in scope for web, by the master spec) | ✅ live-verified | PLATFORM DIFFERENCE | Desktop-exclusive, as intended. |
| Sync Center / conflict handling | N/A | ✅ live-verified | PLATFORM DIFFERENCE | Desktop-exclusive, as intended. |
| Printer / cash drawer | N/A | ✅ | PLATFORM DIFFERENCE | Desktop-exclusive, as intended. |
| Auto-update | N/A | ✅ (architecture; no live feed) | PLATFORM DIFFERENCE | Desktop-exclusive, as intended. |
| Dark mode | ✅ | ✅ | MATCH | Same CSS tokens, both platforms. |
| Light mode | ✅ | ✅ | MATCH | |

**Summary: 27 of 31 numbered modules are full MATCH, 1 was a real gap fixed during this audit
(Notifications), 1 is a low-priority deferred gap (global Stock Movements feed), 2 are correctly
absent from both apps because the backend itself doesn't support them (Packages catalog, Activity
Logs). Two additional cross-cutting gaps (Password reset, Branch switcher) are tracked as deferred
in `QA_BUGS.md`, neither blocking core sellability.**
