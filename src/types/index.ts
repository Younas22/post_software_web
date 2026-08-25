/**
 * Domain types mirroring the actual Laravel models/payloads documented in
 * docs/LARAVEL_API_DISCOVERY.md and docs/BACKEND_EXTENSIONS.md — field
 * names match the backend exactly. Nothing here is invented.
 */

export type Status = "active" | "inactive";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
  status: Status;
  client_id: number | null;
  business_id: number | null;
  branch_id: number | null;
  roles: string[];
  permissions: string[];
}

export interface Business {
  id: number;
  client_id?: number;
  business_type_id?: number | null;
  name: string;
  slug?: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo: string | null;
  currency: string;
  timezone: string;
  status?: Status;
  business_type?: { id: number; name: string } | null;
}

export interface Branch {
  id: number;
  business_id: number;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  is_main: boolean;
  status: Status;
}

export interface ConfigBootstrap {
  business: { id: number; name: string; currency: string; timezone: string } | null;
  /** The caller's own branch, resolved permission-free — null for an actor with no fixed branch_id (or no business). */
  branch: { id: number; name: string; is_main: boolean } | null;
  settings: Record<string, unknown>;
  features: string[];
}

export interface SubscriptionPackage {
  id: number;
  name: string;
  slug: string;
  price: string | number;
  billing_cycle: "monthly" | "yearly";
  max_businesses: number | null;
  max_branches: number | null;
  max_users: number | null;
  max_devices: number | null;
  features: string[];
}

export type SubscriptionStatus = "trial" | "active" | "expired" | "suspended" | "cancelled";

export interface SubscriptionInfo {
  client: { id: number; name: string; status: string };
  subscription: {
    id: number;
    status: SubscriptionStatus;
    effective_status: SubscriptionStatus;
    trial_ends_at: string | null;
    starts_at: string | null;
    ends_at: string | null;
    cancelled_at: string | null;
  } | null;
  package: SubscriptionPackage | null;
  usage: {
    users: { used: number; limit: number | null };
    branches: { used: number; limit: number | null };
    devices: { used: number; limit: number | null };
  };
}

export interface Category {
  id: number;
  business_id: number;
  name: string;
  slug: string;
  status: Status;
}

export interface Brand {
  id: number;
  business_id: number;
  name: string;
  slug: string;
  status: Status;
}

export type ProductType = "product" | "service";

export interface Product {
  id: number;
  business_id: number;
  category_id: number | null;
  brand_id: number | null;
  name: string;
  sku: string;
  barcode: string | null;
  /** "service" = sellable, non-inventory item (consulting, labor, delivery fee, ...) — see ProductController/SaleService. Defaults to "product" server-side. */
  type: ProductType;
  purchase_price: string | number;
  sale_price: string | number;
  tax_rate: string | number | null;
  unit: string;
  minimum_stock: number;
  status: Status;
  description: string | null;
  image: string | null;
  category?: Category | null;
  brand?: Brand | null;
  /** Stock summed across branches (or just the actor's own branch if pinned) — see ProductController. */
  stock?: number | null;
}

export interface Inventory {
  id: number;
  business_id: number;
  branch_id: number;
  product_id: number;
  quantity: number;
  product?: Pick<Product, "id" | "name" | "sku" | "minimum_stock">;
  branch?: Pick<Branch, "id" | "name">;
}

export type StockMovementType = "purchase" | "sale" | "return" | "adjustment" | "transfer_in" | "transfer_out";

export interface StockMovement {
  id: number;
  business_id: number;
  branch_id: number;
  product_id: number;
  type: StockMovementType;
  quantity: number;
  balance_after: number;
  user_id: number | null;
  notes: string | null;
  created_at: string;
  product?: Pick<Product, "id" | "name" | "sku">;
  branch?: Pick<Branch, "id" | "name">;
  user?: { id: number; name: string } | null;
}

export interface Customer {
  id: number;
  business_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: Status;
}

export interface Supplier {
  id: number;
  business_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: Status;
}

export type PurchaseStatus = "pending" | "received" | "cancelled";

export interface PurchaseItem {
  id: number;
  product_id: number;
  quantity: number;
  purchase_price: string | number;
  discount: string | number;
  tax: string | number;
  line_total: string | number;
  product?: Product;
}

export interface Purchase {
  id: number;
  business_id: number;
  branch_id: number;
  supplier_id: number;
  user_id: number;
  invoice_reference: string | null;
  purchase_date: string;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  total: string | number;
  status: PurchaseStatus;
  notes: string | null;
  items?: PurchaseItem[];
  supplier?: Pick<Supplier, "id" | "name">;
  branch?: Pick<Branch, "id" | "name">;
  user?: { id: number; name: string };
}

export interface Expense {
  id: number;
  business_id: number;
  branch_id: number | null;
  user_id: number | null;
  title: string;
  category: string;
  amount: string | number;
  expense_date: string;
  notes: string | null;
  branch?: Pick<Branch, "id" | "name"> | null;
  user?: { id: number; name: string } | null;
}

export type SaleStatus = "completed" | "void";

export interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  discount: string | number;
  tax: string | number;
  line_total: string | number;
  product?: Product;
}

export interface Payment {
  id: number;
  sale_id: number;
  payment_method_id: number;
  amount: string | number;
  reference: string | null;
  payment_method?: PaymentMethod;
}

export interface Sale {
  id: number;
  business_id: number;
  branch_id: number;
  customer_id: number | null;
  user_id: number;
  invoice_number: string;
  client_transaction_id: string;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  total: string | number;
  status: SaleStatus;
  sale_date: string;
  items?: SaleItem[];
  payments?: Payment[];
  customer?: Pick<Customer, "id" | "name"> | null;
  user?: { id: number; name: string };
  branch?: Pick<Branch, "id" | "name">;
}

export interface SaleReturnItem {
  id: number;
  sale_item_id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  tax: string | number;
  refund_amount: string | number;
  product?: Product;
}

export interface SaleReturn {
  id: number;
  sale_id: number;
  business_id: number;
  branch_id: number;
  customer_id: number | null;
  user_id: number;
  reference: string;
  reason: string | null;
  subtotal: string | number;
  tax: string | number;
  refund_amount: string | number;
  status: string;
  created_at: string;
  items?: SaleReturnItem[];
  sale?: Pick<Sale, "id" | "invoice_number">;
}

export interface PaymentMethod {
  id: number;
  business_id: number | null;
  name: string;
  slug: string;
  status?: Status;
}

export type CashSessionStatus = "open" | "closed";

export interface CashMovement {
  id: number;
  cash_session_id: number;
  type: "cash_in" | "cash_out";
  amount: string | number;
  reason: string | null;
  user_id: number;
}

export interface CashSession {
  id: number;
  business_id: number;
  branch_id: number;
  user_id: number;
  opening_cash: string | number;
  closing_cash: string | number | null;
  expected_cash: string | number | null;
  actual_cash: string | number | null;
  difference: string | number | null;
  status: CashSessionStatus;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  user?: { id: number; name: string };
  branch?: Pick<Branch, "id" | "name">;
  movements?: CashMovement[];
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  status: Status;
  client_id: number;
  business_id: number | null;
  branch_id: number | null;
  business?: { id: number; name: string } | null;
  branch?: { id: number; name: string } | null;
  roles: string[];
  created_at: string;
}

export interface DashboardData {
  today: {
    sales_total: number;
    orders_count: number;
    expenses_total: number;
    estimated_profit: number;
  };
  low_stock_count: number;
  customers_count: number;
  open_cash_session: { id: number; opening_cash: string | number; opened_at: string } | null;
  recent_sales: (Pick<Sale, "id" | "invoice_number" | "customer_id" | "user_id" | "branch_id" | "total" | "status" | "sale_date" | "customer" | "user" | "branch"> & {
    payments?: Payment[];
  })[];
  top_products: { product_id: number; units_sold: number; revenue: string | number; product?: Pick<Product, "id" | "name" | "sku"> }[];
}

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}
