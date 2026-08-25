# Handoff Notes — for the Electron/React Desktop POS project

Purpose: paste the relevant sections below into your desktop app's prompt file (alongside your own
prompts) so its AI doesn't have to rediscover things this web project already worked out. Everything here
is copy-paste-ready and confirmed against the real `post_software` Laravel backend and the finished
`post_software_web` Next.js app — nothing here is guessed.

Full detail lives in this project at:
- `docs/LARAVEL_API_DISCOVERY.md` — full backend API audit (routes, models, permissions, response shapes)
- `docs/BACKEND_EXTENSIONS.md` — every endpoint added to Laravel while building the web app
- `docs/FINAL_DEVELOPMENT_REPORT.md` — what the web app actually ships
- `src/app/globals.css` — the literal design tokens (source of truth, copy from here if this doc drifts)

---

## 1. Tell the desktop AI this up front

> An existing Laravel backend (`E:\sv26\htdocs\post_software`, database `post_software`) and an existing
> Next.js web POS (`E:\sv26\htdocs\post_software_web`) already exist and are finished. Do NOT recreate the
> backend, do NOT change the database name, and match the web app's design system exactly (see below) so
> the desktop app feels like the same product. Inspect the web app's `src/` for real, working API
> integration patterns before inventing your own.

## 2. Design system — use these exact tokens

Brand primary is **`#00BF63`** — final, do not replace with blue/purple. Full palette (from
`src/app/globals.css`):

```css
/* Brand */
--color-brand: #00bf63;
--color-brand-hover: #00a856;
--color-brand-active: #009149;
--color-brand-foreground: #ffffff;
--color-brand-soft: #e6f9ef;      /* dark mode: #062b18 */

/* Light mode */
--background: #ffffff;   --foreground: #171717;
--card: #ffffff;         --card-foreground: #171717;
--muted: #f5f5f5;        --muted-foreground: #737373;
--border: #e5e5e5;       --input: #e5e5e5;

/* Dark mode */
--background: #0a0a0a;   --foreground: #f5f5f5;
--card: #171717;         --card-foreground: #f5f5f5;
--muted: #262626;        --muted-foreground: #a3a3a3;
--border: #333333;       --input: #404040;

/* Status (never the brand color) */
--success: #16a34a (dark: #22c55e)
--warning: #d97706 (dark: #f59e0b)
--error:   #dc2626 (dark: #ef4444)
--info:    #2563eb (dark: #3b82f6)

/* Shape */
--radius-sm: 0.375rem;  --radius-md: 0.5rem;  --radius-lg: 0.75rem;  --radius-xl: 1rem;

/* Font */
Inter, everywhere.
```

Component library conceptually reused (rebuild in Electron/React, but same shape/behavior/naming):
Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Card, Badge, Modal, Drawer, Dropdown, Tabs,
Tooltip, Toast, Alert, DataTable, Pagination, Search (debounced), Filter, DatePicker, ConfirmDialog,
EmptyState, LoadingState/Skeleton. The web app built these on Radix UI primitives for accessibility — same
approach recommended if the desktop stack can use them (Electron + React can).

## 3. Backend API contract — don't rediscover this

**Base URL:** `http://localhost/post_software/api/v1` in dev (adjust per environment).

**Auth:** Laravel Sanctum bearer tokens. `POST /auth/login` with `{email, password, device_name}` → token
(no expiry unless revoked). `GET /user` returns the current user including `roles`/`permissions` arrays —
use these for nav/action gating, never hard-code role names.

**Every response** uses this exact envelope (never assume a different shape):
```json
// success (single):     {"success": true,  "message": "...", "data": {...}}
// success (collection):  {"success": true,  "message": "...", "data": [...], "meta": {...pagination...}}
// error:                 {"success": false, "message": "...", "errors": {"field": ["msg"]}}
```
422 = validation (`errors` populated), 401 = bad/missing token, 403 = authorization/permission/subscription/
feature failure, 409 = a state conflict (insufficient stock, already-returned, etc. — show this differently
from 422, it's not a validation problem), 500 = always a generic message, real error never exposed.

**Multi-tenancy — critical:** never send `client_id`/`business_id`/`branch_id` as something you trust for
authorization; the backend always re-derives/re-verifies these from the authenticated user's own account.
Sending a `branch_id` that isn't yours gets rejected, it never grants access.

## 4. POS/Sales-specific rules (the desktop app's core screen)

- **`POST /sales` is server-authoritative on price/tax/total.** The client sends only
  `{branch_id, customer_id?, items: [{product_id, quantity, discount?}], payments: [{payment_method_id,
  amount, reference?}], client_transaction_id}` — never a price or tax figure. The response is a full
  **Receipt** object (invoice number, items, totals, payments), not a raw Sale.
- **`client_transaction_id`** (a UUID you generate) is the idempotency key — generate ONE per checkout
  attempt and **reuse the identical value on retry** (network blip, etc.). This is what makes offline
  sync safe: the Electron app's whole "queue a sale while offline, upload later" story depends on this.
- **Offline/local storage is entirely the desktop app's job** — the web app deliberately does NOT do this
  (per its own spec). The backend already has a `Device` identity + `/api/v1/sync/*` endpoints
  (`bootstrap`, `categories`, `brands`, `products`, `customers`, `inventory` pull; `sales` push) built
  specifically for an offline Electron terminal — register via `POST /api/v1/devices/register`
  (different Sanctum token type from the user's own), then use `device.active`-gated `/sync/*` routes.
  This is real, working backend infrastructure — use it rather than inventing a different sync design.
- Payment methods list: `GET /payment-methods` (no special permission needed).

## 5. Two real bugs found while building the web app — the desktop app will hit the same ones

1. **Creating a staff/employee user:** `POST /api/v1/employees` does **not** default `business_id` to the
   creating user's own business if omitted (every other resource controller does this, this one doesn't).
   Always send `business_id` explicitly (the current user's own `business_id`) when creating/editing staff,
   or the new user ends up with no business and every business-scoped feature silently breaks for them.
2. **Resolving "my own branch" for a Cashier/Manager (a branch-pinned user):** `GET /branches` requires the
   `businesses.view` permission, which a Cashier role does not have — that call 403s for them. Use
   `GET /config` instead: it now returns a permission-free `branch: {id, name, is_main}` field for the
   caller's own branch (added to the backend specifically for this — see `docs/BACKEND_EXTENSIONS.md`).
   Only call `GET /branches` (the full list) when the user is *not* pinned to one branch.

## 6. Roles & permissions (real, from the database — don't invent names)

Roles: `super-admin`, `client-owner`, `business-admin`, `manager`, `cashier`. ~50 permission slugs in
`resource.action` form (e.g. `sales.create`, `inventory.adjust`, `expenses.delete`) — fetch the current
user's own list from `GET /user`'s `permissions` array rather than hard-coding what each role can do; the
mapping is DB-editable and can change without a deploy.

## 7. Password policy (for any password field you build)

Backend enforces: minimum 10 characters, upper + lower case, a number, and a symbol
(`Password::min(10)->mixedCase()->numbers()->symbols()`). Validate this client-side too or users hit a
confusing 422 after already passing your form's checks.

## 8. Subscription/feature gating

`GET /subscription` returns plan, effective status (`trial`/`active`/`expired`/`suspended`/`cancelled`),
dates, features, and Users/Branches/Devices usage vs. limits. `GET /config`'s `features` array lists what's
actually enabled for the business — gate POS/Reports screens on this (only `pos` and `reports` are
feature-flag-gated in the backend today; everything else is permission-only). Frontend gating is UX only —
Laravel remains the real enforcement layer on every request either way.
