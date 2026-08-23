# Backend Extensions — Added for the Web POS

`docs/LARAVEL_API_DISCOVERY.md` is a point-in-time read-only audit (2026-08-23) of `post_software`.
Per the master spec's rule ("if something required by the spec does not exist in Laravel, implement it
in the existing project if clearly required and architecturally safe"), the following was added to
`E:\sv26\htdocs\post_software` — additive only, no existing endpoint/table/behavior was changed except
`GET /api/v1/reports/expenses` (previously a hardcoded `501`, now real data since Expenses now exist).
Every addition follows the exact conventions already in the codebase (`ApiResponse` envelope,
policy-based tenant scoping, `permission:` middleware, FormRequest re-verification of foreign ids).
Full backend test suite: **312 passed** (848 assertions) after these changes, including 19 new tests
covering the endpoints below (`tests/Feature/Api/V1/ExpensesTest.php`, `SaasVisibilityTest.php`).

## New database table
- `expenses` (business_id, branch_id nullable, user_id, title, category, amount, expense_date, notes,
  soft-deletes) — `App\Models\Expense`, `ExpensePolicy`, `Store/UpdateExpenseRequest`, `ExpenseController`.
- New permissions: `expenses.view|create|update|delete`, granted to super-admin/client-owner/
  business-admin (full), manager (view/create/update), cashier (none) — mirrors the purchases/suppliers
  permission shape.

## New/changed `/api/v1/*` endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/v1/expenses`, `/expenses/{id}` (+PUT/PATCH/DELETE) | Full Expense CRUD, branch-scoped like Purchase |
| GET | `/api/v1/reports/expenses` | **Changed**: now real aggregated data (was `501`) |
| GET | `/api/v1/stock-movements` | Cross-product stock ledger feed (`InventoryController::globalMovements`) |
| GET | `/api/v1/payment-methods` | Valid payment methods for POS checkout (global + business) |
| GET | `/api/v1/subscription` | Own client's plan/status/usage (users, branches, devices vs. limits) |
| GET/POST | `/api/v1/branches`, `/branches/{id}` (+PATCH activate/deactivate, PUT update) | Token-authed Branch management (was Admin-Blade-only); enforces `max_branches` |
| GET/PUT | `/api/v1/business`, PUT `/business/settings` | "My business" profile + registry settings (tax_rate, invoice_prefix, receipt_footer, language, date_format) |
| GET | `/api/v1/dashboard` | Real today's-sales/orders/low-stock/customers/expenses/profit + recent sales + top products + open cash session |
| PUT | `/api/v1/user/password`, `/user/profile` | Self-service account actions |
| POST | `/api/v1/auth/forgot-password`, `/auth/reset-password` | JSON wrapper around Laravel's existing Password broker |
| GET | `/api/v1/notifications`, PATCH `/notifications/{id}/read`, `/notifications/read-all` | Reads back existing `database`-channel notifications (subscription/device alerts) |

## Still genuinely absent (not implemented — out of scope for this pass)
Packages catalog (`/packages` — upgrade/pricing page), full Device management JSON (list/activate/
deactivate/block — Admin Blade only), standalone `/payments` list, Business Types JSON, Discounts/Tax
rules engines, Units/UoM. None of these block the core POS flows (sell, stock, customers, suppliers,
purchases, expenses, reports, branches, business settings, subscription visibility) — see
`docs/DEVELOPMENT_PROGRESS.md` for how the frontend handles each gap.
