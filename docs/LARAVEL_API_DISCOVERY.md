# Laravel API Discovery Report — `post_software` backend

Read-only audit of `E:\sv26\htdocs\post_software` for the Next.js frontend team. Nothing in the
source project was modified to produce this report. Ground truth = actual route files, controllers,
form requests, models, migrations, seeders, config, and a live `php artisan route:list` run against
the project. No endpoint, field, permission, or role name below is invented — where something isn't
confirmed in code, it is explicitly marked "not found" / "not confirmed".

The backend team already maintains its own contract at `post_software/docs/API_CONTRACT.md`
(dated 2026-08-23), which covers the `/api/v1/*` surface in detail with example payloads. This report
cross-checks against it, but goes wider — it also covers the session-based Admin/Client Blade panels,
the full DB schema, seed data (roles/permissions/packages), and an explicit MISSING-for-web-POS gap
list, which that document does not attempt.

---

## 1. Laravel project structure overview

- Laravel **12** (`laravel/framework: ^12.0`), PHP `^8.2`.
- Auth package: **`laravel/sanctum: ^4.3`** — token auth for the JSON API, session-cookie auth for the
  Blade Admin/Client panels. No Passport, no `tymon/jwt-auth`.
- **No `spatie/laravel-permission`** — roles/permissions are a fully custom, database-driven
  implementation (`Role`, `Permission`, `role_user`, `role_permission` tables; `User::hasPermission()`).
- API docs: **`dedoc/scramble: ^0.13.42`** — auto-generates an OpenAPI/Swagger spec live at `/docs/api`
  (JSON at `/docs/api.json`) directly from routes/FormRequests/return types. Restricted outside
  local/debug to an authenticated Super Admin (`Gate::define('viewApiDocs', ...)` in
  `AppServiceProvider`). **The frontend team should pull the live OpenAPI JSON for exact field-level
  shapes** rather than relying solely on this document.
- Directory layout is standard Laravel + a deliberate three-way controller split:
  - `app/Http/Controllers/Api/V1/*` — **JSON API**, token-auth (Sanctum), returns `JsonResponse` only.
  - `app/Http/Controllers/Admin/*` — **Blade**, session-auth, Super Admin only (`routes/admin.php`).
  - `app/Http/Controllers/Client/*` — **Blade**, session-auth, client-side roles only (`routes/client.php`).
  - `app/Http/Controllers/Auth/*` — **Blade**, session-auth login/logout/password-reset (`routes/auth.php`).
- `app/Services/*` carries essentially all business logic (sales, purchases, returns, stock, cash
  sessions, idempotency, subscription/feature/package-limit enforcement, settings, activity logging,
  sync). Controllers are thin — they authorize, validate, and delegate.
- **No `app/Http/Resources/*` directory exists at all.** Every response is either a raw Eloquent model
  (with relations eager-loaded) or a hand-built array — never a Laravel API Resource class.
- Composer package name is still the stock `laravel/laravel` — this project has not been renamed.
- `database/database.sqlite` is referenced by the `post-create-project-cmd` composer script but the
  live `.env` (see §17 below) is configured for MySQL, database `post_software`.

## 2. Authentication architecture

Two **independent, non-interoperable** auth mechanisms exist:

### 2.1 API token auth (Sanctum) — what the Next.js frontend uses
- `POST /api/v1/auth/login` — body `{ email, password, device_name }`. Returns a Sanctum
  **personal access token** (`Authorization: Bearer <token>`, no built-in expiry —
  `config/sanctum.php` → `'expiration' => null`) plus a hand-picked `user` payload. Rate-limited
  `throttle:10,1` (10/min per IP).
- `POST /api/v1/auth/logout` (auth:sanctum) — revokes only the token used for the request
  (`currentAccessToken()->delete()`).
- `GET /api/v1/user` (auth:sanctum) — returns `{ "user": {...} }`, same shape as login's `user`.
- **No `/api/v1/auth/register` endpoint** — there is no self-service signup API. New Clients/Businesses
  are created only via the session-authenticated Admin panel (`POST /admin/clients`,
  `POST /admin/businesses`). New staff/employee users are created via `POST /api/v1/employees` (token
  auth, permission `users.create`), not a public register endpoint.
- **No password-reset endpoint under `/api/v1`.** Password reset (`forgot-password`, `reset-password`)
  exists only as session-based Blade routes in `routes/auth.php` — not usable by a token-based SPA
  without either (a) building an equivalent JSON endpoint, or (b) driving the Blade forms directly
  (not recommended for a Next.js app).
- `Device` is a **second, independent Sanctum tokenable** (`HasApiTokens` on `App\Models\Device`,
  not `User`) — used only by the Electron/offline sync flow (`POST /api/v1/devices/register`,
  `device.active` middleware). Irrelevant to a browser-based Next.js POS unless it also wants
  Electron-style offline device identity.

### 2.2 Session/cookie auth (Blade panels) — NOT usable by the Next.js frontend as-is
- `routes/auth.php`, `routes/admin.php`, `routes/client.php` all use Laravel's default `web`
  guard (`config/auth.php`: session driver, `App\Models\User` provider) plus CSRF-protected Blade
  forms. `LoginRequest` rate-limits 5 attempts per `email|ip` key with a lockout event.
  Every route needing `Business`/`Branch`/`Client`/`Package`/`Feature`/`Subscription`/`Device`
  CRUD (beyond what's listed in §13) lives **only** here, session/CSRF-gated, and returns HTML
  (`View`) or `RedirectResponse` — never JSON.
- **This means a large portion of platform administration (client/business/branch/package/
  subscription/device management) has no JSON API today.** A Next.js app would either need Sanctum's
  SPA cookie-auth mode (not currently configured — see §17, `SANCTUM_STATEFUL_DOMAINS` is left at
  Laravel defaults and `supports_credentials` is `false` in the CORS config) or the backend team would
  need to add token-authenticated JSON equivalents of the Admin panel's Client/Business/Branch/
  Package/Subscription/Device CRUD.

### 2.3 Token mechanism summary
- **Sanctum personal access tokens** (`personal_access_tokens` table, polymorphic `tokenable`).
- No refresh-token concept — a token simply doesn't expire unless revoked.
- `hasPermission()` / `is_super_admin` are evaluated per-request from the DB (`User::roles()->permissions()`),
  not baked into the token — a role/permission change takes effect on the very next request.

## 3. Full API route table (JSON API — `/api/v1/*`, prefix name `api.v1.*`)

Confirmed via both `routes/api.php` and a live `php artisan route:list`. All routes are already
wrapped in Laravel's default `api` middleware group (`throttle:api` applies platform-wide).

| Method | Endpoint | Middleware / auth | Permission | Controller@method | Notes |
|---|---|---|---|---|---|
| GET | `/api/v1/health` | none | — | closure | `{status: "ok"}` liveness check |
| POST | `/api/v1/auth/login` | `throttle:10,1` | — | `AuthController@login` | issues token |
| POST | `/api/v1/auth/logout` | `auth:sanctum` | — | `AuthController@logout` | revokes current token |
| GET | `/api/v1/user` | `auth:sanctum` | — | `AuthController@user` | current user |
| GET | `/api/v1/config` | `auth:sanctum` | — | `ConfigController` (invokable) | business/settings/enabled features bootstrap |
| POST | `/api/v1/employees` | `auth:sanctum` | `users.create` | `EmployeeController@store` | package `max_users` enforced |
| GET | `/api/v1/employees` | `auth:sanctum` | `users.view` | `EmployeeController@index` | `?search=`, `?client_id=` (Super Admin only) |
| GET | `/api/v1/employees/{employee}` | `auth:sanctum` | `users.view` | `EmployeeController@show` | |
| PUT/PATCH | `/api/v1/employees/{employee}` | `auth:sanctum` | `users.update` | `EmployeeController@update` | |
| PATCH | `/api/v1/employees/{employee}/activate` | `auth:sanctum` | `users.update` | `EmployeeController@activate` | re-checks user-seat limit |
| PATCH | `/api/v1/employees/{employee}/deactivate` | `auth:sanctum` | `users.update` | `EmployeeController@deactivate` | |
| GET | `/api/v1/categories` | `auth:sanctum` | `products.view` | `CategoryController@index` | `?search=`, `?business_id=`, `?status=` |
| GET | `/api/v1/categories/{category}` | `auth:sanctum` | `products.view` | `CategoryController@show` | |
| POST | `/api/v1/categories` | `auth:sanctum` | `products.create` | `CategoryController@store` | |
| PUT/PATCH | `/api/v1/categories/{category}` | `auth:sanctum` | `products.update` | `CategoryController@update` | |
| DELETE | `/api/v1/categories/{category}` | `auth:sanctum` | `products.delete` | `CategoryController@destroy` | soft delete |
| GET | `/api/v1/brands` | `auth:sanctum` | `products.view` | `BrandController@index` | same filters as categories |
| GET | `/api/v1/brands/{brand}` | `auth:sanctum` | `products.view` | `BrandController@show` | |
| POST | `/api/v1/brands` | `auth:sanctum` | `products.create` | `BrandController@store` | |
| PUT/PATCH | `/api/v1/brands/{brand}` | `auth:sanctum` | `products.update` | `BrandController@update` | |
| DELETE | `/api/v1/brands/{brand}` | `auth:sanctum` | `products.delete` | `BrandController@destroy` | soft delete |
| GET | `/api/v1/products` | `auth:sanctum` | `products.view` | `ProductController@index` | `?search=,category_id,brand_id,status,sku,barcode,sort,direction` |
| GET | `/api/v1/products/{product}` | `auth:sanctum` | `products.view` | `ProductController@show` | |
| POST | `/api/v1/products` | `auth:sanctum` | `products.create` | `ProductController@store` | multipart, optional `image` |
| PUT/PATCH | `/api/v1/products/{product}` | `auth:sanctum` | `products.update` | `ProductController@update` | |
| DELETE | `/api/v1/products/{product}` | `auth:sanctum` | `products.delete` | `ProductController@destroy` | soft delete |
| GET | `/api/v1/inventory` | `auth:sanctum` | `inventory.view` | `InventoryController@index` | `?branch_id=`, `?product_id=` — **no single `/inventory/{id}` show route** |
| GET | `/api/v1/inventory/low-stock` | `auth:sanctum` | `inventory.view` | `InventoryController@lowStock` | `quantity <= minimum_stock` |
| GET | `/api/v1/products/{product}/movements` | `auth:sanctum` | `inventory.view` | `InventoryController@movements` | full stock ledger for one product |
| POST | `/api/v1/inventory/adjust` | `auth:sanctum` | `inventory.adjust` | `InventoryController@adjust` | signed `quantity`, never 0 |
| GET | `/api/v1/customers` | `auth:sanctum` | `customers.view` | `CustomerController@index` | `?search=`, `?status=` |
| GET | `/api/v1/customers/{customer}` | `auth:sanctum` | `customers.view` | `CustomerController@show` | |
| POST | `/api/v1/customers` | `auth:sanctum` | `customers.create` | `CustomerController@store` | |
| PUT/PATCH | `/api/v1/customers/{customer}` | `auth:sanctum` | `customers.update` | `CustomerController@update` | |
| DELETE | `/api/v1/customers/{customer}` | `auth:sanctum` | `customers.delete` | `CustomerController@destroy` | soft delete |
| GET | `/api/v1/suppliers` | `auth:sanctum` | `suppliers.view` | `SupplierController@index` | |
| GET | `/api/v1/suppliers/{supplier}` | `auth:sanctum` | `suppliers.view` | `SupplierController@show` | |
| POST | `/api/v1/suppliers` | `auth:sanctum` | `suppliers.create` | `SupplierController@store` | |
| PUT/PATCH | `/api/v1/suppliers/{supplier}` | `auth:sanctum` | `suppliers.update` | `SupplierController@update` | |
| DELETE | `/api/v1/suppliers/{supplier}` | `auth:sanctum` | `suppliers.delete` | `SupplierController@destroy` | soft delete |
| GET | `/api/v1/purchases` | `auth:sanctum` | `purchases.view` | `PurchaseController@index` | `?branch_id,supplier_id,status,date_from,date_to` |
| GET | `/api/v1/purchases/{purchase}` | `auth:sanctum` | `purchases.view` | `PurchaseController@show` | |
| POST | `/api/v1/purchases` | `auth:sanctum` | `purchases.create` | `PurchaseController@store` | totals server-computed from `items[]` |
| PUT/PATCH | `/api/v1/purchases/{purchase}` | `auth:sanctum` | `purchases.update` | `PurchaseController@update` | only while `status=pending`; header fields only |
| PATCH | `/api/v1/purchases/{purchase}/receive` | `auth:sanctum` | `purchases.update` | `PurchaseController@receive` | applies stock |
| PATCH | `/api/v1/purchases/{purchase}/cancel` | `auth:sanctum` | `purchases.cancel` | `PurchaseController@cancel` | reverses stock if was received; **no DELETE route exists for Purchase** |
| GET | `/api/v1/sales` | `auth:sanctum` | `sales.view` | `SaleController@index` | `?branch_id,cashier_id,customer_id,payment_method_id,status,date_from,date_to` |
| GET | `/api/v1/sales/{sale}` | `auth:sanctum` | `sales.view` | `SaleController@show` | |
| GET | `/api/v1/sales/{sale}/receipt` | `auth:sanctum` | `sales.view` | `SaleController@receipt` | structured receipt payload |
| POST | `/api/v1/sales` | `auth:sanctum` | `sales.create` + subscription active + `pos` feature | `SaleController@store` | authoritative server pricing; requires `client_transaction_id` |
| GET | `/api/v1/returns` | `auth:sanctum` | `returns.view` | `ReturnController@index` | `?sale_id=`, `?branch_id=` |
| GET | `/api/v1/returns/{return}` | `auth:sanctum` | `returns.view` | `ReturnController@show` | |
| POST | `/api/v1/sales/{sale}/returns` | `auth:sanctum` | `returns.process` | `ReturnController@store` | **only ever created nested under a sale — no bare `POST /returns`** |
| GET | `/api/v1/cash-sessions` | `auth:sanctum` | `cash_sessions.view` | `CashSessionController@index` | `?branch_id,user_id,status` |
| GET | `/api/v1/cash-sessions/current` | `auth:sanctum` | policy only (see §19) | `CashSessionController@current` | `?branch_id=` required |
| POST | `/api/v1/cash-sessions/open` | `auth:sanctum` | policy only | `CashSessionController@open` | one open session per (user, branch) — DB-enforced |
| GET | `/api/v1/cash-sessions/{cashSession}` | `auth:sanctum` | policy only | `CashSessionController@show` | |
| POST | `/api/v1/cash-sessions/{cashSession}/cash-in` | `auth:sanctum` | policy only | `CashSessionController@cashIn` | |
| POST | `/api/v1/cash-sessions/{cashSession}/cash-out` | `auth:sanctum` | policy only | `CashSessionController@cashOut` | |
| POST | `/api/v1/cash-sessions/{cashSession}/close` | `auth:sanctum` | policy only | `CashSessionController@close` | server-computes `expected_cash`/`difference` |
| POST | `/api/v1/devices/register` | `auth:sanctum` | `devices.manage` | `DeviceController@register` (Api\V1) | issues a Device Sanctum token; server-generated `device_identifier` |
| GET | `/api/v1/devices/current` | `auth:sanctum` + `device.active` | — | `DeviceController@current` (Api\V1) | device-token only |
| GET | `/api/v1/sync/bootstrap` | `auth:sanctum` + `device.active` | — | `SyncController@bootstrap` | one-shot, not paginated |
| GET | `/api/v1/sync/categories` | `auth:sanctum` + `device.active` | — | `SyncController@categories` | cursor-paginated |
| GET | `/api/v1/sync/brands` | `auth:sanctum` + `device.active` | — | `SyncController@brands` | cursor-paginated |
| GET | `/api/v1/sync/products` | `auth:sanctum` + `device.active` | — | `SyncController@products` | cursor-paginated |
| GET | `/api/v1/sync/customers` | `auth:sanctum` + `device.active` | — | `SyncController@customers` | cursor-paginated |
| GET | `/api/v1/sync/inventory` | `auth:sanctum` + `device.active` | — | `SyncController@inventory` | branch-scoped, no soft-delete tracking |
| POST | `/api/v1/sync/sales` | `auth:sanctum` + `device.active` | — | `SyncController@sales` | offline sale upload, idempotent, adds `error_type` on failure |
| GET | `/api/v1/reports/sales` | `auth:sanctum` | `reports.view` + subscription + `reports` feature (checked in-controller) | `ReportController@sales` | |
| GET | `/api/v1/reports/purchases` | `auth:sanctum` | same | `ReportController@purchases` | |
| GET | `/api/v1/reports/expenses` | `auth:sanctum` | same | `ReportController@expenses` | **always returns `501` — no Expense model/table exists** |
| GET | `/api/v1/reports/inventory` | `auth:sanctum` | same | `ReportController@inventory` | |
| GET | `/api/v1/reports/products` | `auth:sanctum` | same | `ReportController@products` | top-selling by quantity |
| GET | `/api/v1/reports/customers` | `auth:sanctum` | same | `ReportController@customers` | spend per customer |
| GET | `/api/v1/reports/profit` | `auth:sanctum` | same | `ReportController@profit` | estimated COGS from current purchase_price, not historical |

### Web (session/Blade) route table — `/admin/*` (name `admin.*`, middleware `['auth','super-admin']`)

All return `View`/`RedirectResponse`, CSRF-protected, session-cookie only. Full field-level detail is
in §21/§13 where relevant to what a web POS frontend needs; listed here for completeness.

| Method | Endpoint | Permission | Controller@method |
|---|---|---|---|
| GET | `/admin/dashboard` | `dashboard.view` | `DashboardController` (invokable) |
| GET/POST | `/admin/clients`, `/admin/clients/create` | `clients.create`/`clients.view` | `ClientController@index/create/store` |
| GET | `/admin/clients/{client}` | `clients.view` | `ClientController@show` |
| GET/PUT | `/admin/clients/{client}/edit`, `/admin/clients/{client}` | `clients.update` | `ClientController@edit/update` |
| PATCH | `/admin/clients/{client}/suspend`, `/activate` | `clients.update` | `ClientController@suspend/activate` |
| GET/POST | `/admin/businesses`, `/admin/businesses/create` | `businesses.create`/`.view` | `BusinessController@index/create/store` |
| GET | `/admin/businesses/{business}` | `businesses.view` | `BusinessController@show` |
| GET/PUT | `/admin/businesses/{business}/edit`, update | `businesses.update` | `BusinessController@edit/update` |
| PUT | `/admin/businesses/{business}/settings` | `businesses.update` | `BusinessController@updateSettings` |
| GET/POST/PUT/PATCH | `/admin/businesses/{business}/branches/*` | `businesses.update` | `BranchController@create/store/edit/update/activate/deactivate` |
| GET/POST/PUT/PATCH | `/admin/packages*` | `packages.*` | `PackageController@*` |
| GET/POST/PUT | `/admin/features*` | `packages.*` (features share the packages permission set — no dedicated `features.*` slug) | `FeatureController@*` |
| GET/PATCH | `/admin/subscriptions*` | `subscriptions.view`/`.manage` | `SubscriptionController@*` |
| GET/PATCH | `/admin/devices*` | `devices.view`/`.manage` | `DeviceController@*` (Admin) |
| GET/POST/PUT/PATCH | `/admin/business-types*` | `settings.view`/`.update` (no dedicated permission slug) | `BusinessTypeController@*` |
| GET/PUT | `/admin/settings` | `settings.view`/`.update` | `SettingController@index/update` |
| GET | `/admin/activity-logs` | `activity_logs.view` | `ActivityLogController@index` |

### Web (session/Blade) route table — `/client/*` (name `client.*`, middleware `['auth','client-user','subscription.active']`)

| Method | Endpoint | Permission | Controller@method | Notes |
|---|---|---|---|---|
| GET | `/client/dashboard` | `dashboard.view` | `Client\DashboardController` | static view, no data wired up yet |
| GET | `/client/businesses/{business}` | `businesses.view` | `Client\BusinessController@show` | minimal detail page |

### Web auth routes — `/` (name unprefixed, `routes/auth.php`)

`GET/POST /login`, `GET/POST /forgot-password`, `GET/POST /reset-password/{token}`, `POST /logout`.
All session/Blade, all guest- or auth-gated, all rate-limited. No JSON equivalents.

## 4. Controllers

- **`Api/V1`** (14 files): `AuthController`, `BrandController`, `CashSessionController`,
  `CategoryController`, `ConfigController`, `CustomerController`, `DeviceController`,
  `EmployeeController`, `InventoryController`, `ProductController`, `PurchaseController`,
  `ReportController`, `ReturnController`, `SaleController`, `SupplierController`, `SyncController`
  — all thin: authorize (via `$this->authorize()` policy calls or FormRequest `authorize()`), validate
  (FormRequest), delegate to a `Services\*` class, wrap the result in `ApiResponse`.
- **`Admin`** (10 files): `ActivityLogController`, `BranchController`, `BusinessController`,
  `BusinessTypeController`, `ClientController`, `DashboardController`, `DeviceController`,
  `FeatureController`, `PackageController`, `SettingController`, `SubscriptionController`.
- **`Client`** (2 files): `BusinessController` (single `show`), `DashboardController` (static view).
- **`Auth`** (3 files): `AuthenticatedSessionController`, `NewPasswordController`,
  `PasswordResetLinkController` — all session-based, standard Laravel breeze-style flow.
- Base `Controller` (`app/Http/Controllers/Controller.php`) — confirmed empty/abstract base, no
  shared logic beyond what Laravel provides (`AuthorizesRequests` trait access via `$this->authorize()`).

## 5. Models (key fields, from `$fillable`/migrations — casts noted where present)

| Model | Table | Key fields | Relationships |
|---|---|---|---|
| `Client` | `clients` | name, email(unique), phone, status(`active`\|`suspended`\|`cancelled`), notes; soft-deletes | hasMany Business/User/Subscription/Device; hasOne `currentSubscription` (latest) |
| `Business` | `businesses` | client_id, business_type_id, name, slug(unique per client_id), phone, email, address, logo, currency(3), timezone, status(`active`\|`inactive`); soft-deletes | belongsTo Client/BusinessType; hasMany Branch/User/Device; belongsToMany Feature (via `business_feature`, pivot `enabled`); hasMany CustomField |
| `BusinessType` | `business_types` | name, slug(unique), description, icon, is_active(bool) | hasMany Business |
| `Branch` | `branches` | business_id, name, code, address, phone, is_main(bool), status(`active`\|`inactive`); soft-deletes | belongsTo Business; hasMany User/Device |
| `User` | `users` | name, email(unique), password(hashed), status(`active`\|`inactive`), is_super_admin(bool, **not fillable**), client_id/business_id/branch_id (**not fillable** — forceFill only); soft-deletes | belongsTo Client/Business/Branch; belongsToMany Role (`role_user`) |
| `Role` | `roles` | name, slug(unique), description | belongsToMany User/Permission |
| `Permission` | `permissions` | name, slug(unique), description | belongsToMany Role |
| `Package` | `packages` | name, slug(unique), description, price(decimal 10,2), billing_cycle(`monthly`\|`yearly`), max_businesses/max_branches/max_users/max_devices (nullable = unlimited), status; soft-deletes | belongsToMany Feature (`package_feature`); hasMany Subscription |
| `Feature` | `features` | name, slug(unique), description, status; soft-deletes | belongsToMany Package |
| `Subscription` | `subscriptions` | client_id, package_id, status(`trial`\|`active`\|`expired`\|`suspended`\|`cancelled`), trial_ends_at, starts_at, ends_at, cancelled_at | belongsTo Client/Package; `effectiveStatus()` computes real-time state from dates |
| `Device` | `devices` | client_id, business_id, branch_id, name, type(default `pos`), platform(`windows`\|`mac`\|`linux`\|`web`\|`android`\|`ios`), device_identifier(unique, server-generated UUID), status(`active`\|`inactive`\|`blocked`), last_seen_at, activated_at; soft-deletes; `HasApiTokens` (own Sanctum identity) | belongsTo Client/Business/Branch |
| `Setting` | `settings` | client_id, business_id, branch_id (any/all nullable — null=system-wide), key, value, type | belongsTo Client/Business/Branch; static `get()`/`set()` helpers |
| `ActivityLog` | `activity_logs` | client_id, business_id, branch_id, user_id (all nullable, `nullOnDelete`), action, subject (morph), description, properties(json), ip_address, user_agent | belongsTo Client/Business/Branch/User; morphTo subject |
| Notifications | `notifications` | standard Laravel DB-notifications schema (`type`, `notifiable` morph, `data` json, `read_at`) | — no dedicated `Notification` Eloquent model; uses framework's `DatabaseNotification` implicitly via `Notifiable` trait on `User` |
| `Category` | `categories` | business_id, name, slug(unique per business), status; soft-deletes | belongsTo Business; hasMany Product |
| `Brand` | `brands` | business_id, name, slug(unique per business), status; soft-deletes | belongsTo Business; hasMany Product |
| `Product` | `products` | business_id, category_id, brand_id, name, sku(unique per business), barcode(unique per business), purchase_price, sale_price, tax_rate(nullable %), unit(default `pcs`), minimum_stock, status, description, image; soft-deletes; `HasCustomFields` | belongsTo Business/Category/Brand |
| `Inventory` | `inventories` | business_id, branch_id, product_id, quantity(int); **unique(branch_id,product_id)** — one live balance row per branch+product | belongsTo Business/Branch/Product; `isLowStock()` |
| `StockMovement` | `stock_movements` | business_id, branch_id, product_id, type(`purchase`\|`sale`\|`return`\|`adjustment`\|`transfer_in`\|`transfer_out`), quantity(signed), balance_after, reference(morph), user_id, notes | append-only ledger, never updated/deleted |
| `Customer` | `customers` | business_id, name, phone, email, address, notes, status; soft-deletes | belongsTo Business |
| `Supplier` | `suppliers` | business_id, name, phone, email, address, notes, status; soft-deletes | belongsTo Business |
| `Purchase` | `purchases` | business_id, branch_id, supplier_id, user_id, invoice_reference, purchase_date, subtotal/discount/tax/total(decimal), status(`pending`\|`received`\|`cancelled`), notes — **no soft-deletes, no destroy()** | belongsTo Business/Branch/Supplier/User; hasMany PurchaseItem |
| `PurchaseItem` | `purchase_items` | purchase_id, product_id, quantity, purchase_price, discount, tax, line_total | belongsTo Purchase/Product |
| `PaymentMethod` | `payment_methods` | business_id(nullable=global), name, slug(unique per business), status | belongsTo Business |
| `Sale` | `sales` | business_id, branch_id, customer_id(nullable), user_id, invoice_number(unique per business), client_transaction_id(unique per business), subtotal/discount/tax/total, status(`completed`\|`void`), sale_date — **no soft-deletes, no destroy()** | belongsTo Business/Branch/Customer/User; hasMany SaleItem/Payment/SaleReturn |
| `SaleItem` | `sale_items` | sale_id, product_id, quantity, unit_price, discount, tax, line_total | belongsTo Sale/Product; hasMany ReturnItem; `returnedQuantity()` |
| `Payment` | `payments` | sale_id, payment_method_id, amount, reference | belongsTo Sale/PaymentMethod |
| `SaleReturn` | `returns` (table) | sale_id, business_id, branch_id, customer_id(nullable), user_id, reference(unique per business), reason, subtotal, tax, refund_amount, status(only `completed` today) | belongsTo Sale/Business/Branch/Customer/User; hasMany ReturnItem |
| `ReturnItem` | `return_items` | return_id, sale_item_id, product_id, quantity, unit_price, tax, refund_amount | belongsTo SaleReturn/SaleItem/Product |
| `CashSession` | `cash_sessions` | business_id, branch_id, user_id, opening_cash, closing_cash, expected_cash, actual_cash, difference, status(`open`\|`closed`), open_marker(DB-trick for one-open-session-per-cashier-per-branch), notes, opened_at, closed_at | belongsTo Business/Branch/User; hasMany CashMovement |
| `CashMovement` | `cash_movements` | cash_session_id, type(`cash_in`\|`cash_out`), amount, reason, user_id | belongsTo CashSession/User |
| `IdempotencyKey` | `idempotency_keys` | business_id, device_id(nullable), client_transaction_id, request_hash, response_status, response_body(json), subject(morph); **unique(business_id, client_transaction_id)** | belongsTo Business/Device; morphTo subject |
| `CustomField` / `CustomFieldValue` | `custom_fields` / `custom_field_values` | business_id(nullable=platform-wide), entity_type(free string), key, label, type(`text`\|`number`\|`date`\|`select`\|`boolean`), options(json), is_required, status | Foundation only — **nothing currently attaches to it except `Product`'s `HasCustomFields` trait; no live UI/endpoint reads or writes it** |

**Not found as Eloquent models / DB tables**: `Tax` (rate lives inline on `Product.tax_rate` and the
`tax_rate` setting, no dedicated `taxes` table), `Discount` (ad hoc per-line/`decimal` fields only, no
discount rules/codes table), `Unit` (`Product.unit` is a free-text string, no `units` lookup table),
`Expense` (confirmed absent — `ReportController::expenses()` returns `501` explicitly because of this).

## 6. Requests (FormRequest validation classes)

- `Auth/LoginRequest` — session login, `email`+`password`, custom rate-limit/lockout logic.
- `Api/V1/*` (24 files) — one Store+Update pair per resource (Brand, Category, Customer, Product,
  Purchase, Supplier) plus single-purpose requests: `AdjustStockRequest`, `OpenCashSessionRequest`,
  `RegisterDeviceRequest`, `StoreEmployeeRequest`/`UpdateEmployeeRequest`, `StoreReturnRequest`,
  `StoreSaleRequest`, `SyncSaleRequest`. Every one re-verifies tenant ownership of every referenced id
  (`business_id`, `branch_id`, `category_id`, `brand_id`, `supplier_id`, `product_id`,
  `payment_method_id`, `customer_id`, `sale_item_id`) in a `withValidator()` `after()` hook against the
  authenticated actor's own `client_id`/`business_id`/`branch_id` — never trusting the id alone. Exact
  field lists are in §21 and in `post_software/docs/API_CONTRACT.md`.
- `Http/Requests/Concerns/ValidatesBusinessScope` — shared trait: `business_id` is `required` only for
  an actor with no fixed `business_id` of their own (multi-business Client Owner); otherwise
  `sometimes` and ignored in favor of the actor's own, then independently re-verified either way.
- `Admin/*` (14 files) — Client/Business/BusinessType/Branch/Package/Feature Store+Update pairs, plus
  `ExtendSubscriptionRequest` (`ends_at` required/date/after:today) and
  `ChangeSubscriptionPackageRequest` (`package_id` required/exists). Session-only, not usable by a
  token client without an equivalent JSON endpoint.

## 7. Resources (API Resource classes)

**None exist.** `app/Http/Resources/` is not present in the codebase. Every `/api/v1/*` response
returns either a raw Eloquent model/collection (with specific relations eager-loaded, e.g.
`$sale->load(['items.product','payments.paymentMethod','customer','user:id,name','branch'])`) or a
manually hand-built array (`AuthController::userPayload()`, `EmployeeController::payload()`,
`DeviceController::payload()`, `ReceiptService::build()`). This means: (a) the exact JSON shape of a
model is whatever its `$fillable`/`$casts`/`$hidden` currently produce via default Eloquent
serialization, not a curated Resource contract, and (b) adding a column to a table will silently
appear in every response that serializes that model directly (except `User`, `Device`, and `Employee`,
which use explicit whitelists — see §17).

## 8. Services

All in `app/Services/*`, framework-agnostic PHP classes injected via constructor/method DI, not
facades:

| Service | Responsibility |
|---|---|
| `ActivityLogger` | Single write path for `ActivityLog` rows; resolves client/business/branch context from either the affected subject or the acting user |
| `CashSessionService` | Open/cashIn/cashOut/close — all cash math server-computed from recorded movements + actual cash sales, row-locked |
| `DeviceActivationService` | `max_devices` limit check (`limitFor`/`activeCount`/`canActivate`) |
| `FeatureAccessService` | Resolves whether a Business has a feature enabled: per-business override → else package → else false |
| `IdempotencyService` | Generic `client_transaction_id` handling — hash-compare, replay, or 409-conflict, DB-locked |
| `PackageLimitService` | `max_branches`/`max_users` limit checks, same shape as `DeviceActivationService` |
| `PurchaseService` | Only place a Purchase's totals are computed and stock is applied (create/receive/cancel) |
| `ReceiptService` | Builds the structured receipt payload shared by sale-create response and `GET /sales/{id}/receipt` |
| `ReturnService` | Only place a return is created; refunds proportional to the *original* sale item's line_total, not current prices |
| `SaleService` | Only place a Sale is created — authoritative pricing from `Product.sale_price`/`tax_rate`, idempotent, atomic stock deduction |
| `SettingsService` | Registry-driven (`config/settings.php`) cascading settings resolve: branch → business → client → system → registry default |
| `StockService` | **The only** code path allowed to change `inventories.quantity` — row-locked `adjust()`, writes an immutable `StockMovement` |
| `SubscriptionEnforcementService` | Single entry point for "can this client/business use the platform right now" — composes the other services |
| `SyncService` | Generic cursor-based incremental sync pagination (`updated_at > since`, opaque server-clock cursor) |

## 9. Middleware

Registered in `bootstrap/app.php` (`$middleware->alias([...])`) — no `app/Http/Kernel.php` (Laravel 12
uses the new `bootstrap/app.php` middleware config):

| Alias | Class | Purpose |
|---|---|---|
| `super-admin` | `EnsureUserIsSuperAdmin` | Rejects (403) any non-`is_super_admin` user on `/admin/*` |
| `client-user` | `EnsureUserIsClientUser` | Rejects (403) a Super Admin on `/client/*` (strict area separation) |
| `permission` | `EnsurePermission` | `->middleware('permission:slug')` — 403 unless `$user->hasPermission($slug)` (Super Admin always passes) |
| `subscription.active` | `EnsureSubscriptionActive` | Applied to all of `/client/*` — 402 if the client's account/subscription isn't in good standing (Super Admin exempt) |
| `device.active` | `EnsureDeviceIsActive` | Applied to device-scoped API routes — 401 if the Sanctum principal isn't a `Device`, 403 if its `status !== 'active'`; touches `last_seen_at` |

Global: Laravel's default `api` middleware group (includes `throttle:api`) wraps all of `routes/api.php`
automatically via `withRouting(api: ...)`. No custom tenant-scoping middleware exists as global —
tenant isolation is done per-controller/per-policy (see §19), not via middleware.

## 10. Policies

`app/Policies/*` — one per tenant-scoped model, all following the same `viewAny`/`view`/`create`/
`update`/`delete` (plus resource-specific abilities) shape, checked via `$this->authorize()` in
controllers or `$request->user()->can(...)` in FormRequests:

`ActivityLogPolicy`, `BranchPolicy`, `BrandPolicy`, `BusinessPolicy`, `BusinessTypePolicy`,
`CashSessionPolicy` (custom `open`/`operate` abilities — see §19), `CategoryPolicy`, `ClientPolicy`,
`CustomerPolicy`, `DevicePolicy`, `FeaturePolicy`, `InventoryPolicy`, `PackagePolicy`, `ProductPolicy`,
`PurchasePolicy`, `SalePolicy`, `SaleReturnPolicy`, `SettingPolicy`, `SubscriptionPolicy`,
`SupplierPolicy`, `UserPolicy`.

Two shared traits do the actual tenant math (no global Eloquent scope anywhere in the codebase):

- `Policies/Concerns/ScopesToBusiness::actorMayAccessBusiness()` — business's `client_id` must match
  the actor's; if the actor has a fixed `business_id`, it must equal the business's id.
- `Policies/Concerns/ScopesToBranch::actorMayAccessBranch()` — same, one level deeper (also checks a
  fixed `branch_id`).

No policies are registered explicitly in `AppServiceProvider` — Laravel's convention-based
auto-discovery (`XPolicy` ↔ `X` model) is relied on throughout.

## 11. Roles (actual names — seeded in `RoleSeeder`)

Exactly five roles exist, by slug:

| name | slug |
|---|---|
| Super Admin | `super-admin` |
| Client Owner | `client-owner` |
| Business Admin | `business-admin` |
| Manager | `manager` |
| Cashier | `cashier` |

Roles are stored in the DB (`roles` table) and are **editable without a code change** — the above is
only the seeded default. `super-admin`/`client-owner` are explicitly excluded from being assignable via
`POST/PUT /employees` (enforced in `StoreEmployeeRequest`/`UpdateEmployeeRequest` — those two role
slugs can never be granted through that endpoint).

## 12. Permissions (actual permission strings — seeded in `PermissionSeeder`)

47 permission slugs exist, all `resource.action` dot-notation, stored in the `permissions` table and
mapped to roles via `role_permission` (seeded defaults in `RolePermissionSeeder`; editable in DB):

```
dashboard.view
clients.view, clients.create, clients.update, clients.delete
businesses.view, businesses.create, businesses.update
users.view, users.create, users.update
packages.view, packages.create, packages.update, packages.delete
subscriptions.view, subscriptions.manage
devices.view, devices.manage
settings.view, settings.update
activity_logs.view
products.view, products.create, products.update, products.delete
inventory.view, inventory.adjust
customers.view, customers.create, customers.update, customers.delete
suppliers.view, suppliers.create, suppliers.update, suppliers.delete
purchases.view, purchases.create, purchases.update, purchases.cancel
sales.view, sales.create
returns.view, returns.process
cash_sessions.view, cash_sessions.operate, cash_sessions.manage
reports.view
```

Notes confirmed in code/comments:
- `clients.delete` and `packages.delete` are seeded permission strings but **no route anywhere uses
  them** (no delete/destroy route exists for Client or Package — both are soft-deleted models managed
  only by status changes in the Admin panel; `packages.delete` in particular has zero route
  references).
- Features (`/admin/features*`) and Business Types (`/admin/business-types*`) have **no dedicated
  permission slug** — gated by `packages.*` and `settings.*` respectively (see route comments in
  `routes/admin.php`).
- `Super Admin` role's `is_super_admin=true` flag bypasses every permission check in code
  (`User::hasPermission()` short-circuits `true`), independent of — and in addition to — the
  `role_permission` seed row for `super-admin` (belt-and-suspenders, per the seeder's own comment).

## 13. SaaS APIs (Client / Business / Branch / User / Package / Feature / Subscription / Device / BusinessType / Settings / ActivityLog / Notification)

| Entity | Exists? | Fields (from migration) | API routes |
|---|---|---|---|
| **Client** | Yes | name, email(unique), phone, status(active/suspended/cancelled), notes | **Admin Blade only** (`/admin/clients*`) — no `/api/v1/clients*` JSON endpoints at all |
| **Business** | Yes | client_id, business_type_id, name, slug, phone, email, address, logo, currency, timezone, status | **Admin Blade only** (`/admin/businesses*`); `/client/businesses/{business}` is a read-only Blade detail page; `GET /api/v1/config` returns a trimmed subset (`id,name,currency,timezone`) of the caller's own business only |
| **Branch** | Yes | business_id, name, code, address, phone, is_main, status | **Admin Blade only**, nested under Business (`/admin/businesses/{business}/branches/*`) — **confirmed absent from the JSON API** (explicitly documented as a gap in the backend's own `API_CONTRACT.md` §7) |
| **User (employee)** | Yes | see §5 | **JSON API exists**: full CRUD-ish set at `/api/v1/employees*` (index/show/store/update/activate/deactivate) — the one SaaS entity with real token-auth API coverage |
| **Package** | Yes | name, slug, description, price, billing_cycle, max_businesses, max_branches, max_users, max_devices, status | **Admin Blade only** (`/admin/packages*`) — no JSON read even for "show me my current plan's limits" beyond what `SaleController`/`DeviceController` error messages happen to embed as text |
| **Feature** | Yes | name, slug, description, status | **Admin Blade only** (`/admin/features*`) for CRUD; `GET /api/v1/config` and `GET /api/v1/sync/bootstrap` DO expose the caller's own *enabled* feature slugs (read-only, computed) |
| **PackageFeature** (pivot) | Yes (`package_feature`) | package_id, feature_id | managed only via the Admin Package edit form's `features[]` field, no dedicated route |
| **Subscription** | Yes | client_id, package_id, status(trial/active/expired/suspended/cancelled), trial_ends_at, starts_at, ends_at, cancelled_at | **Admin Blade only** (`/admin/subscriptions*` — view/activate/suspend/cancel/extend/change-package). **No JSON endpoint at all** — a logged-in client user has no API to read their own subscription status/plan/renewal date; `EnsureSubscriptionActive` middleware blocks the whole `/client` Blade area on a lapsed subscription but there is nothing equivalent surfaced to the JSON API caller as data (only as a 402/403 side-effect of unrelated calls) |
| **Device** | Yes | see §5 | **Split**: registration/current-device-check are JSON API (`/api/v1/devices/register`, `/api/v1/devices/current`); activate/deactivate/block/list/show are **Admin Blade only** (`/admin/devices*`) |
| **BusinessType** | Yes | name, slug(unique), description, icon, is_active | **Admin Blade only** (`/admin/business-types*`) — no JSON read anywhere, not even for a "pick a business type" dropdown at signup (there is no signup API either) |
| **Settings** | Yes | client_id/business_id/branch_id (nullable, cascading scope), key, value, type — registry defined in `config/settings.php` | **Admin Blade only** for writing (`/admin/settings`, `/admin/businesses/{id}/settings`); `GET /api/v1/config` and `GET /api/v1/sync/bootstrap` expose the caller's own *resolved* business-scope settings read-only |
| **ActivityLog** | Yes | see §5 | **Admin Blade only** (`/admin/activity-logs`) — no JSON API; a client-side user has no way to see their own business's audit trail via the API |
| **Notification** | Table exists (standard Laravel DB-notifications schema) | type, notifiable(morph), data(json), read_at | Three `Notification` classes exist (`SubscriptionExpiring`, `SubscriptionExpired`, `DeviceLimitReached`, `SystemNotification`) sent via `Notification::send()` from the `platform:check-subscriptions-and-devices` scheduled command — **all `database`-channel only, and there is no `/api/v1/notifications*` endpoint to list/read/mark-read them.** A frontend "bell icon" has no data source today. |

## 14. POS APIs (Products / Categories / Brands / Inventory / StockMovements / Customers / Suppliers / Purchases / Expenses / Sales / Payments / Returns / Reports / Taxes / Discounts / Units / CashSessions / PaymentMethods)

| Entity | Exists? | JSON API routes | Notes |
|---|---|---|---|
| Products | Yes | full CRUD `/api/v1/products*` | multipart image upload; no variants/serials |
| Categories | Yes | full CRUD `/api/v1/categories*` | business-scoped, not client-wide |
| Brands | Yes | full CRUD `/api/v1/brands*` | business-scoped |
| Inventory (stock balance) | Yes | `GET /api/v1/inventory`, `/inventory/low-stock`, `POST /inventory/adjust` | no single `/inventory/{id}` show — keyed by (branch,product) |
| StockMovements | Yes (ledger) | `GET /api/v1/products/{product}/movements` only | read-only, per-product; **no global `/stock-movements` list endpoint** |
| Customers | Yes | full CRUD `/api/v1/customers*` | business-scoped |
| Suppliers | Yes | full CRUD `/api/v1/suppliers*` | business-scoped |
| Purchases | Yes | `/api/v1/purchases*` (index/show/store/update/receive/cancel) | **no delete/destroy** — voided via cancel |
| PurchaseItems | Yes (child of Purchase) | embedded in Purchase show/store responses only — no standalone route | |
| Expenses | **No model, no table, no migration** | `GET /api/v1/reports/expenses` exists but **always returns HTTP 501** | confirmed absent — explicitly documented in the backend's own contract as "no data source" |
| Sales | Yes | `/api/v1/sales*` (index/show/store/receipt) | core POS transaction; server-authoritative pricing; requires `client_transaction_id` |
| SaleItems | Yes (child of Sale) | embedded only, no standalone route | |
| Payments | Yes (child of Sale) | embedded only (`payments[]` on sale create; loaded on show); **no standalone `/payments` list/read endpoint** | |
| Returns | Yes | `POST /api/v1/sales/{sale}/returns`, `GET /api/v1/returns`, `GET /api/v1/returns/{return}` | only ever created against a specific sale |
| Receipts | Yes | `GET /api/v1/sales/{sale}/receipt` | structured JSON; no PDF/print rendering server-side |
| Reports | Yes (7 of them) | `/api/v1/reports/{sales,purchases,inventory,products,customers,profit,expenses}` | `expenses` is 501; `profit` is a documented estimate (uses *current* purchase_price, not historical cost) |
| Taxes | **No dedicated model/table** | — | `Product.tax_rate` (nullable %, per-product) and the `tax_rate` setting (business/branch scope via `SettingsService`) are the only tax mechanism; no tax-rules/tax-classes table |
| Discounts | **No dedicated model/table** | — | only ad hoc numeric `discount` columns on `sale_items`/`purchase_items`, no discount codes/rules/promotions engine |
| Units | **No dedicated model/table** | — | `Product.unit` is a free-text string column (default `pcs`), no `units` lookup/conversion table |
| CashSessions | Yes | full lifecycle `/api/v1/cash-sessions*` (index/current/open/show/cash-in/cash-out/close) | server-computed expected/actual/difference; DB-enforced one-open-session-per-cashier-per-branch |
| PaymentMethods | Yes (model+seeded data) | **No dedicated `/api/v1/payment-methods` list endpoint** — only surfaced embedded inside `GET /api/v1/config`? **Not confirmed** — `ConfigController` does NOT actually return payment methods (only `GET /api/v1/sync/bootstrap`, device-authenticated, does). A user-token client has **no way to fetch the list of valid `payment_method_id`s** for building a sale-payment UI. Seeded global defaults: Cash, Card, Bank, Other (`business_id=null`); a business may add its own. |

## 15. Subscription APIs / limit enforcement

**No subscription-reading JSON API exists** for a logged-in client user (see §13). Enforcement,
however, is real and active:

- `SubscriptionEnforcementService::hasPlatformAccess(Client)` = `isClientActive()` (status=active)
  AND `isSubscriptionActive()` (current subscription's `effectiveStatus()` is `trial` or `active`).
  Checked by: `EnsureSubscriptionActive` middleware (`/client/*` Blade), `POST /api/v1/sales`,
  `POST /api/v1/sync/sales`, `POST /api/v1/devices/register`, and every `/api/v1/reports/*` endpoint
  (via `ReportController::authorizedBusiness()`).
- `Subscription::effectiveStatus()` computes real-time state from `trial_ends_at`/`ends_at` even if the
  stored `status` column hasn't caught up yet; a **daily scheduled command**
  (`platform:check-subscriptions-and-devices`, see `app/Console/Commands/CheckSubscriptionsAndDevices.php`)
  persists `expired` and sends `database`-channel notifications for expiring/expired subscriptions and
  clients at their device limit — confirm the actual cron registration in `routes/console.php` if this
  matters for reliability (not fully audited here beyond the command's own existence).
- `max_users` — `PackageLimitService::canCreateUser()` — enforced on `POST /api/v1/employees` and
  `.../activate` (403 with a message stating the limit if exceeded); **inactive users don't count**
  against the seat.
- `max_branches` — `PackageLimitService::canCreateBranch()` — enforced only in the **Admin Blade**
  `BranchController@store` (no JSON branch-create endpoint exists to enforce this against at all).
- `max_devices` — `DeviceActivationService::canActivate()` — enforced on `POST /api/v1/devices/register`
  (403 with a message stating the limit) and in the Admin device-activate action.
- `max_businesses` — **field exists on `Package` and is seeded, but no code path checks it anywhere**
  (grep-confirmed: `max_businesses` is only read/written in the Admin Package form, never compared
  against a live count the way branches/users/devices are). This is a real enforcement gap in the
  backend itself, not just an API-surface gap.
- Feature flags — `FeatureAccessService::isEnabled(Business, slug)`: explicit per-business
  `business_feature` override (either direction) wins; else the client's current subscription's
  package must include the feature; else `false`. Only **`pos`** (on Sales) and **`reports`** (on
  Reports) are actually gated by feature slug in code today; Products/Inventory/Customers/Suppliers/
  Purchases are **not** feature-gated (confirmed by the backend's own contract doc, §1.7) — only
  permission + tenant scope apply to those.

## 16. Device APIs

Real, token-based, and distinct from the SaaS "Device" admin CRUD:

- `POST /api/v1/devices/register` (user token, permission `devices.manage`) — body
  `{ branch_id, name, platform }` (`platform` ∈ `windows|mac|linux|web|android|ios`). Validates
  platform access + device-limit, issues a **second, independent Sanctum token** scoped to the new
  `Device` row (`device_identifier` always server-generated UUID, never client-supplied). Registration
  doubles as activation — no separate "activate new device" step in the API.
- `GET /api/v1/devices/current` (device token, `device.active` middleware) — lets a registered device
  confirm its own token/status.
- Deactivate/block/reactivate an **existing** device, or list all of a client's devices, is
  **Admin Blade only** (`/admin/devices*`) — not part of the JSON API. A blocked/inactive device's
  token still parses fine under Sanctum but every `device.active`-gated route then returns 403 (not
  simply 401), which is a useful signal for a management UI to poll if one is ever built against this
  data via a new JSON endpoint.
- This whole device-identity mechanism is built for the Electron/offline POS terminal use case; a
  browser-based Next.js POS would not normally use it (a browser session is just a normal user token),
  unless the frontend team wants "register this browser as a known terminal" semantics too.

## 17. API response formats (success, error, validation, pagination)

Single, consistent envelope produced by `App\Support\ApiResponse` (quoted directly from the class):

**Single-resource success:**
```json
{ "success": true, "message": "Product retrieved successfully.", "data": { "...": "..." } }
```
(`data` defaults to `(object) []` — i.e. `{}` — when `null` is passed, never a bare `null` literal.)

**Collection/paginated success** (`ApiResponse::collection()` — auto-populates `meta` when given a
`LengthAwarePaginator`):
```json
{
  "success": true,
  "message": "Products retrieved successfully.",
  "data": [ { "...": "..." } ],
  "meta": { "current_page": 1, "per_page": 15, "total": 42, "last_page": 3, "from": 1, "to": 15 }
}
```

**Error** (`ApiResponse::error()`):
```json
{ "success": false, "message": "The given data was invalid.", "errors": { "email": ["..."] } }
```
`errors` defaults to `(object) []` (i.e. `{}`) when `null` — never a bare `null`.

**Login success example (real controller code, `AuthController::login`):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "1|abcdef...",
    "user": { "id": 5, "name": "...", "email": "...", "is_super_admin": false, "status": "active", "client_id": 2, "business_id": 3, "branch_id": null }
  }
}
```

**Pagination**: standard Laravel `LengthAwarePaginator` fields under `meta` as shown above.
`?per_page=` (default 15 on most list endpoints; sync endpoints default 500, capped 1000) and `?page=`
are the query params every list endpoint accepts.

**Employee (User) response is an explicit whitelist**, not a raw model dump — confirmed in
`EmployeeController::payload()`:
```json
{
  "id": 12, "name": "...", "email": "...", "status": "active",
  "client_id": 2, "business_id": 3, "branch_id": 7,
  "business": { "id": 3, "name": "..." }, "branch": { "id": 7, "name": "..." },
  "roles": ["cashier"], "created_at": "..."
}
```
Same pattern for `AuthController::userPayload()` and `DeviceController::payload()`. Every other
resource (Product, Category, Brand, Customer, Supplier, Purchase, Sale, CashSession, Inventory,
Return...) is returned as the **raw Eloquent model's default JSON serialization** (whatever
`$fillable`/`$casts`/`$hidden`/loaded relations currently produce) — since no API Resource layer
exists (§7), a column added to one of these tables will appear in the response automatically, with no
transform step to intercept it.

## 18. Error formats for 401 / 403 / 404 / 409 / 422 / 429 / 500

All produced by `App\Support\ApiExceptionRenderer::render()`, registered in `bootstrap/app.php`'s
`withExceptions()` callback, scoped to any request matching `api/*` (web/Blade routes are untouched —
they keep Laravel's normal session-flash validation behavior). **Every one of these uses the same
envelope shape from §17** — never an HTML error page, stack trace, SQL, file path, or env value,
regardless of `APP_DEBUG`.

| Status | Triggered by | `message` | `errors` |
|---|---|---|---|
| 401 | `AuthenticationException` (missing/invalid Sanctum token) | `"Unauthenticated."` | `{}` |
| 403 | `AuthorizationException` (policy/`$this->authorize()` failure), or an explicit `abort(403, '...')` (permission middleware, subscription/feature gates) | the exception's own message if set, else `"This action is unauthorized."` | `{}` |
| 404 | `NotFoundHttpException` — both "route doesn't exist" and "model id doesn't resolve" (`ModelNotFoundException`) are **indistinguishable by design** | `"The requested resource was not found."` (model) or `"The requested endpoint was not found."` (route) | `{}` |
| 405 | `MethodNotAllowedHttpException` | `"This method is not allowed for the requested endpoint."` | `{}` |
| 409 | `InsufficientStockException`, `IdempotencyConflictException`, `InvalidStateTransitionException`, `ExcessiveReturnException` | the exception's own descriptive message (e.g. `"Insufficient stock: 1 available, 5 requested."`) | `{}` |
| 422 | `ValidationException` (FormRequest/manual `$request->validate()` failure); also a malformed sync cursor (`InvalidArgumentException`) | `"The given data was invalid."` (validation) or the exception's message (bad cursor) | field→messages object for validation, `{}` otherwise |
| 429 | `ThrottleRequestsException` (rate limiting — login is `throttle:10,1`; platform-wide `throttle:api` on every route) | `"Too many requests. Please try again later."` | `{}` |
| 500 | anything unrecognized | **always** the generic `"Server error. Please try again later."` — the real message/trace is logged server-side only, never exposed, regardless of `APP_DEBUG` | `{}` |
| 501 | explicit `ApiResponse::error(..., 501)` — currently only `GET /reports/expenses` | `"Expense tracking is not yet implemented on this platform — this report has no data source."` | `{}` |
| 402 | explicit `abort(402, ...)` from `EnsureSubscriptionActive` — **Blade `/client/*` only**, not currently produced by any `/api/v1/*` route (those use 403 for the equivalent condition) | `"Your subscription is not active. Please contact your administrator to renew access."` | n/a (HTML, not JSON, since this middleware doesn't run on API routes) |

**Sync-specific addition**: on `POST /api/v1/sync/sales` only, the error envelope gains one extra field,
`error_type` ∈ `retryable` \| `non_retryable` \| `conflict` (see `App\Support\SyncErrorResponse`), so
Electron can decide programmatically whether to retry. No other endpoint returns this field.

## 19. Multi-tenant security mechanism

**There is no global Eloquent scope anywhere in this codebase.** Tenant isolation is enforced entirely
through two layers, applied consistently everywhere (confirmed by reading every Api/V1 controller and
every Policy):

1. **Query-level filtering in every `index()` method** — e.g. `ProductController::index()`:
   ```php
   Product::query()->whereHas('business', function ($query) use ($actor) {
       $query->where('client_id', $actor->client_id);
       if ($actor->business_id !== null) {
           $query->where('id', $actor->business_id);
       }
   })
   ```
   Every list endpoint repeats this same pattern (business→client_id match, then narrow further if the
   actor has a fixed `business_id`/`branch_id`).

2. **Policy-level authorization on every single-resource action** — e.g. `ProductPolicy::view()`:
   ```php
   return $user->is_super_admin
       || ($user->hasPermission('products.view') && $this->actorMayAccessBusiness($user, $product->business));
   ```
   via the shared traits:
   - `ScopesToBusiness::actorMayAccessBusiness()` — business's `client_id` must equal the actor's; if
     the actor has a fixed `business_id`, it must also equal the business's id.
   - `ScopesToBranch::actorMayAccessBranch()` — same, one level deeper (adds a fixed-`branch_id` check).

3. **FormRequest-level re-verification on every write** — every Store/Update request that accepts a
   foreign id (`business_id`, `branch_id`, `category_id`, `product_id`, `supplier_id`,
   `payment_method_id`, `customer_id`, `sale_item_id`, `role`...) re-checks that id's ownership inside
   a `withValidator()->after()` hook, independent of the policy check that also runs. **A
   client-supplied `business_id`/`branch_id`/`client_id` is never trusted as authorization anywhere**
   — it is either ignored in favor of the actor's own fixed value, or independently re-verified against
   the actor's own `client_id` before use (this exact rule is stated as a project-wide convention in
   `docs/API_CONTRACT.md` §1.5 and is consistent with every file actually read for this audit).

4. **Super Admin bypass**: `is_super_admin=true` short-circuits every one of the above (both
   `hasPermission()` and every Policy method explicitly check `$user->is_super_admin` first).

5. **Device-scoped isolation** (Sync endpoints): the device's own `business_id`/`branch_id` (fixed at
   registration) is the *only* source of tenant scope — there is no request parameter for it at all,
   so there's nothing for a compromised device token to spoof.

No middleware performs tenant scoping globally — it is 100% per-controller/per-policy/per-FormRequest,
by convention, not framework-enforced. **A new controller that forgets to add the `whereHas`/Policy
check would not be automatically protected** — this is worth the frontend/backend team keeping in mind
as new endpoints are added, though nothing observed in the current codebase exhibits this gap.

## 20. Existing business modules summary

Fully implemented (JSON API + service layer + DB schema, all three layers present and consistent):
**Auth (token), Config bootstrap, Employees, Categories, Brands, Products, Inventory (+ledger),
Customers, Suppliers, Purchases, Sales (POS core), Returns, Cash Sessions, Devices (registration),
Sync (Electron offline: bootstrap/pull/push), Reports (6 of 7; Expenses stubbed 501).**

Implemented as **Admin/Client Blade only** (session auth, no JSON API): **Client management, Business
management, Branch management, Package management, Feature management, Subscription management,
Device activation/deactivation/blocking, Business Type management, Settings (system + business
scope), Activity Log viewing.**

**Not implemented at all** (no model, no table, no route, in either surface): **Expenses** (confirmed —
`501` route exists precisely because the data source doesn't), **Taxes** as a dedicated entity,
**Discounts** as a dedicated entity/rules engine, **Units** as a dedicated lookup table, **Product
variants/serials**, **batch/bulk offline-sale upload** (each offline sale is synced individually),
**self-service registration/signup**, **notifications list/read API**, **dashboard-stats API for the
client side** (`Client\DashboardController` is a static view with zero data wired up — contrast with
`Admin\DashboardController`, which does return real counts, but only to Blade).

## 21. MISSING / REQUIRED FOR WEB POS

Every row below was confirmed absent by reading the actual route files and controllers — not inferred
from naming conventions alone.

| Feature | Required endpoint | Method | Purpose | Required request fields (proposed, matching existing conventions) | Expected response | Backend dependencies |
|---|---|---|---|---|---|---|
| Client-side subscription visibility | `GET /api/v1/subscription` | GET | Show current plan, limits, renewal/trial date for the "Billing" page | — (derived from authenticated user's `client_id`) | `{ status, effective_status, package: {name, price, max_*}, trial_ends_at, ends_at }` | `Client::currentSubscription`, `Subscription::effectiveStatus()` — logic already exists in `Subscription` model, just needs a controller+route |
| Branch management (JSON) | `GET/POST /api/v1/branches`, `PATCH .../activate`, `.../deactivate` | GET/POST/PATCH | Web POS onboarding/settings needs to create/list/toggle branches without the Admin Blade panel | `name, code?, address?, phone?, status` (mirrors `Admin\StoreBranchRequest`) | Branch model JSON, `max_branches` limit error on 403 | `PackageLimitService::canCreateBranch()` already exists — just needs a token-authed controller |
| Business profile (JSON) | `GET/PUT /api/v1/business` (own business) | GET/PUT | Let a Business Admin edit their own business name/logo/currency/timezone/address from a web settings screen | `name, phone?, email?, address?, logo?(file), currency, timezone` | Business model JSON | mirrors `Admin\BusinessController@update`, needs tenant-scoped rewrite |
| Business settings (JSON write) | `PUT /api/v1/business/settings` | PUT | Web equivalent of `Admin\BusinessController::updateSettings` (tax_rate, invoice_prefix, receipt_footer, language, date_format) | one key per registry entry in `config/settings.php` | updated resolved settings | `SettingsService` already exists |
| Package/plan catalog (public or authed) | `GET /api/v1/packages` | GET | Pricing/upgrade page needs to list available packages+features | — | Package[] with features[] | none — read-only wrapper over existing `Package`/`Feature` models |
| Payment methods list | `GET /api/v1/payment-methods` | GET | POS checkout screen needs valid `payment_method_id`s — currently only exposed via device-only `sync/bootstrap` | — | `[{id, name, slug}]` scoped to business + global | none — trivial read endpoint over existing `PaymentMethod` model |
| Dashboard stats (client side) | `GET /api/v1/dashboard` | GET | Web POS landing page (today's sales, low-stock count, open cash session, recent activity) — `Client\DashboardController` currently returns nothing | — | `{ today_sales_total, today_transaction_count, low_stock_count, open_cash_session, ... }` | aggregation logic doesn't exist yet anywhere (not even in Admin) beyond `Admin\DashboardController`'s platform-wide counts; needs new queries |
| Employee/staff self-password-change | `PUT /api/v1/user/password` | PUT | A logged-in cashier/manager needs to change their own password from the web app; only exists as an admin-driven `PUT /employees/{id}` with `password` field today | `current_password, password, password_confirmation` | success message | none blocking — straightforward addition |
| API password reset (token flow) | `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password` | POST | "Forgot password" from a Next.js login screen — today this only exists as session/Blade forms | `email` / `email, token, password, password_confirmation` | success message | Laravel's `Password` broker already used by the Blade version — needs a JSON wrapper |
| Notifications list/read | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{id}/read` | GET/PATCH | Bell-icon UI for subscription-expiring/device-limit alerts — `Notification` rows are already being written by the scheduled command, nothing reads them back via API | — | paginated `DatabaseNotification` rows | none — `Notifiable` trait + standard notifications table already exist on `User` |
| Device management (JSON) | `GET /api/v1/devices`, `PATCH .../activate`, `.../deactivate`, `.../block` | GET/PATCH | Manage registered terminals from a web settings screen instead of the Admin Blade panel | — | Device[] / updated Device | mirrors `Admin\DeviceController`, needs tenant-scoped rewrite (today only Super Admin, via Blade, can do this) |
| Global stock-movements feed | `GET /api/v1/stock-movements` | GET | An inventory-audit screen wanting a cross-product feed — today only `GET /products/{id}/movements` (single-product) exists | `?branch_id=, ?type=, ?date_from=, ?date_to=` | paginated StockMovement[] | none — same `StockMovement` table, just a differently-scoped query |
| Standalone Payments list | `GET /api/v1/payments` | GET | A "payments received" report/reconciliation view — today Payment rows are only reachable embedded inside a Sale | `?payment_method_id=, ?date_from=, ?date_to=` | paginated Payment[] | none — same `Payment` table |
| Business Type read (JSON) | `GET /api/v1/business-types` | GET | Any signup/onboarding UI needing the type dropdown | — | BusinessType[] where is_active | none — trivial |
| Expense tracking (whole module) | `GET/POST /api/v1/expenses`, category CRUD, `GET /api/v1/reports/expenses` (already stubbed) | GET/POST | Full expense entry needed to make the Reports > Expenses page meaningful — currently 501 by design | `category, amount, date, notes, branch_id` (proposed — no existing convention to mirror) | Expense model JSON | **new table + model + migration + service required** — biggest genuine backend gap found |
| Discounts / promotions engine | n/a today | — | Anything beyond a manual per-line numeric discount (coupon codes, percentage rules, buy-x-get-y) | — | — | **no schema exists at all** — would be new tables/models from scratch |
| Tax rules beyond per-product % | n/a today | — | Multi-rate tax classes, tax-inclusive pricing toggle, per-jurisdiction tax | — | — | **no schema exists** — `Product.tax_rate` + `tax_rate` setting is the entire tax mechanism today |
| Units/UoM conversion | n/a today | — | Selling in boxes vs. pieces, unit conversion | — | — | **no schema exists** — `Product.unit` is a free-text string only |
| Self-service signup/onboarding | `POST /api/v1/auth/register` (or a dedicated onboarding flow) | POST | Any "sign up for a trial" marketing-site flow | `client name/email, business name/type, owner name/email/password` | token + user, mirroring login | Client/Business/Branch/Subscription creation logic exists (`Admin` controllers + `DemoClientSeeder` as a worked example) but nothing wraps it as a public, unauthenticated JSON endpoint — this is a deliberate absence, not an oversight (no public registration exists anywhere in the app today) |

## 22. Recommended frontend API service structure

Based strictly on what exists today (token-auth `/api/v1/*` surface) plus the MISSING list above,
organized the way the backend itself is already organized (one service module per controller/resource
family), so each frontend service maps 1:1 to a backend controller and is trivial to extend once a
missing endpoint above is actually built:

```
src/services/
  api-client.ts          # axios/fetch wrapper: base URL /api/v1, Authorization: Bearer <token>,
                          # 401 -> clear token & redirect to login, standard ApiResponse envelope
                          # unwrapping (success/message/data/meta/errors), 422 -> field error mapping
  auth.service.ts         # login, logout, getCurrentUser  [EXISTS]
                          # + forgotPassword/resetPassword, changePassword  [MISSING — §21]
  config.service.ts       # getConfig (business/settings/enabled features)  [EXISTS]
  employees.service.ts    # list/get/create/update/activate/deactivate  [EXISTS]
  categories.service.ts   # full CRUD  [EXISTS]
  brands.service.ts       # full CRUD  [EXISTS]
  products.service.ts     # full CRUD, includes image upload  [EXISTS]
  inventory.service.ts    # list, lowStock, adjust, productMovements  [EXISTS]
                          # + globalMovements  [MISSING — §21]
  customers.service.ts    # full CRUD  [EXISTS]
  suppliers.service.ts    # full CRUD  [EXISTS]
  purchases.service.ts    # list/get/create/update/receive/cancel  [EXISTS]
  sales.service.ts        # list/get/create/receipt  [EXISTS]  — the POS checkout module;
                          # MUST generate & persist a client_transaction_id per transaction (UUID),
                          # reused verbatim across retries — never regenerated
  returns.service.ts      # list/get/createForSale  [EXISTS]
  cashSessions.service.ts # list/current/open/show/cashIn/cashOut/close  [EXISTS]
  devices.service.ts      # register, current  [EXISTS]
                          # + list/activate/deactivate/block  [MISSING — §21, admin-only today]
  reports.service.ts      # sales/purchases/inventory/products/customers/profit/expenses(501)  [EXISTS]
  paymentMethods.service.ts  # [MISSING — §21] — needed for POS checkout payment picker
  subscription.service.ts    # [MISSING — §21] — needed for billing/plan display
  packages.service.ts        # [MISSING — §21] — needed for upgrade/pricing page
  branches.service.ts        # [MISSING — §21] — needed for multi-branch settings
  business.service.ts        # [MISSING — §21] — needed for business profile settings
  businessTypes.service.ts   # [MISSING — §21]
  notifications.service.ts   # [MISSING — §21]
  dashboard.service.ts       # [MISSING — §21] — client-side stats
  expenses.service.ts        # [MISSING — §21, whole module doesn't exist server-side yet]
```

Cross-cutting recommendations informed directly by what was found in the backend:

- **Response unwrapping**: centralize `{success, message, data, meta, errors}` handling in
  `api-client.ts` once — every existing endpoint (and, per §17, every future one built the same way)
  follows this exact envelope, including errors.
- **422 handling**: `errors` is a field→`string[]` map only for validation failures; map it directly to
  form field errors. For every other error status, `errors` is `{}` and only `message` is meaningful.
- **409 handling is a first-class case for the Sales/Purchases/Returns/CashSessions modules** —
  distinct from 422 — the frontend should show these as "this didn't work because of current state"
  (insufficient stock, already received, already returned) rather than a generic validation error.
- **`client_transaction_id`**: any POS checkout implementation must generate this once per sale
  attempt (client-side UUID) and resend the *identical* value on retry — this is the entire safety
  net against duplicate sales on a flaky connection (§ idempotency, confirmed in `IdempotencyService`
  and `SaleService`).
- **No CSRF/cookie concerns** for the token surface: `/api/v1/*` is pure Bearer-token, and the
  project's CORS config is Laravel's unmodified default (`allowed_origins: '*'`,
  `supports_credentials: false` — no `config/cors.php` override exists in the project). A Next.js app
  calling this API cross-origin with `Authorization: Bearer` headers needs no cookie/credentials
  configuration; it does **not** currently qualify for Sanctum's SPA "stateful" cookie mode (that would
  require enabling credentials + adding the frontend's domain to `SANCTUM_STATEFUL_DOMAINS`, which is
  currently left at framework defaults in `.env`).
- Do **not** attempt to call any `/admin/*` or `/client/*` (Blade) route from the Next.js app as if it
  were JSON — those require a CSRF token, a session cookie, and return HTML/redirects, not the
  `ApiResponse` envelope. Every SaaS-management gap in §13/§21 needs a *new* token-authed JSON
  endpoint built by the backend team, not a repurposing of the existing Blade routes.

---

### Sources consulted (all within `E:\sv26\htdocs\post_software`, read-only)
`routes/api.php`, `routes/web.php`, `routes/admin.php`, `routes/client.php`, `routes/auth.php`,
`bootstrap/app.php`, `composer.json`, `.env` (secrets excluded), `config/{auth,sanctum,settings,scramble}.php`,
`config/cors.php` (confirmed absent — checked `vendor/laravel/framework/config/cors.php` for the
effective default instead), all files under `app/Http/Controllers/**`, `app/Http/Requests/**`,
`app/Http/Middleware/**`, `app/Models/**`, `app/Services/**`, `app/Policies/**`, `app/Support/**`,
`app/Exceptions/**`, `app/Notifications/**`, `app/Console/Commands/CheckSubscriptionsAndDevices.php`,
`app/Providers/AppServiceProvider.php`, every file under `database/migrations/**` and
`database/seeders/**`, the project's own `docs/API_CONTRACT.md`, and a live
`php artisan route:list` run for cross-verification against the route files.
