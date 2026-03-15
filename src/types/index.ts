export interface Product {
  id: number;
  tenant_id: number;
  name: string;
  sku: string;
  description?: string;
  category_id?: number;
  category?: Category;
  supplier_id?: number;
  supplier?: Supplier;
  price: number;
  cost?: number;
  stock: number;
  min_stock: number;
  max_stock?: number;
  barcode?: string;
  is_active: boolean;
  batches?: ProductBatch[];
  created_at: string;
  updated_at: string;
}

export interface ProductBatch {
  id: number;
  product_id: number;
  tenant_id: number;
  batch_number: string;
  expiration_date: string;
  initial_quantity: number;
  current_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  tenant_id: number;
  name: string;
  code: string;
  description?: string;
  parent_id?: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface Supplier {
  id: number;
  tenant_id: number;
  name: string;
  code: string;
  tax_id?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  tenant_id: number;
  name: string;
  document_type?: string;
  document_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  credit_limit: number;
  current_balance: number;
  loyalty_points: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: number;
  tenant_id: number;
  product_id: number;
  movement_type: "entry" | "exit" | "adjustment" | "transfer" | "initial";
  quantity: number;
  stock_before: number;
  stock_after: number;
  unit_cost?: number;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  subdomain?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo_url?: string;
  plan: string;
  created_at: string;
}

export type UserRole = "SUPERADMIN" | "ADMIN" | "MANAGER" | "SELLER";

export interface Permission {
  id: number;
  name: string;
  codename: string;
  module: string;
  description?: string;
}

export interface Role {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  is_system: boolean;
  permissions: Permission[];
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  is_admin: boolean;
  role: UserRole;
  role_id?: number;
  role_obj?: Role;
  is_active: boolean;
  tenant_id: number;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product?: Product;
  batch_id?: number;
  batch_number?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  tenant_id: number;
  user_id?: number;
  user?: User;
  total_amount: number;
  payment_method: string;
  status: "completed" | "annulled";
  customer_id?: number;
  customer?: Customer;
  notes?: string;
  created_at: string;
  items: SaleItem[];
}

export interface PurchaseItem {
    id: number;
    purchase_id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    unit_cost: number;
    subtotal: number;
}

export interface Purchase {
    id: number;
    tenant_id: number;
    supplier_id: number;
    supplier?: Supplier;
    user_id?: number;
    user?: User;
    reference_number?: string;
    total_amount: number;
    status: 'draft' | 'received' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at: string;
    items: PurchaseItem[];
}

export type AdjustmentReason = "DAMAGE" | "LOSS" | "CORRECTION" | "INTERNAL_USE";

export interface Adjustment {
  id: number;
  tenant_id: number;
  product_id: number;
  user_id: number;
  adjustment_type: "IN" | "OUT";
  quantity: number;
  reason: AdjustmentReason;
  notes?: string;
  created_at: string;
}

export interface StockTransferItem {
    id: number;
    transfer_id: number;
    product_id: number;
    product?: Product;
    batch_id?: number;
    quantity: number;
}

export type StockTransferStatus = 'pending' | 'completed' | 'cancelled';

export interface StockTransfer {
    id: number;
    tenant_id: number;
    from_branch_id: number;
    from_branch?: Branch;
    to_branch_id: number;
    to_branch?: Branch;
    user_id: number;
    user?: User;
    status: StockTransferStatus;
    notes?: string;
    reference?: string;
    completed_at?: string;
    cancelled_at?: string;
    created_at: string;
    updated_at: string;
    items: StockTransferItem[];
}

export interface Branch {
    id: number;
    tenant_id: number;
    name: string;
    address?: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  metadata?: {
    total: number;
    page: number;
    size: number;
    pages: number;
  };
}

export type CashSessionStatus = "open" | "closed";

export interface CashSession {
  id: number;
  tenant_id: number;
  user_id: number;
  status: CashSessionStatus;
  opening_balance: number;
  expected_balance?: number;
  closing_balance?: number;
  opened_at: string;
  closed_at?: string;
  notes?: string;
}

export interface ExpenseCategory {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: number;
  tenant_id: number;
  user_id?: number;
  category_id?: number;
  category?: ExpenseCategory;
  cash_session_id?: number;
  amount: number | string;
  description: string;
  expense_date: string;
  created_at: string;
}

export interface ExpenseSummary {
  items: Expense[];
  total: number;
  page: number;
  size: number;
}

export interface LoyaltyConfig {
  id: number;
  tenant_id: number;
  points_per_amount: number;
  amount_per_point: number;
  is_active: boolean;
  min_redemption_points: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: number;
  tenant_id: number;
  customer_id: number;
  sale_id?: number;
  points: number;
  description?: string;
  transaction_type: "earn" | "redeem" | "adjust";
  created_at: string;
}

export interface InventoryAuditItem {
  id: number;
  audit_id: number;
  product_id: number;
  product?: Product;
  expected_stock: number;
  counted_stock: number;
  discrepancy: number;
  notes?: string;
  created_at: string;
}

export type AuditStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface InventoryAudit {
  id: number;
  tenant_id: number;
  branch_id: number;
  branch?: Branch;
  user_id: number;
  user?: User;
  status: AuditStatus;
  notes?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  items?: InventoryAuditItem[];
}
