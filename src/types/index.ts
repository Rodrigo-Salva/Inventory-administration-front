export interface Product {
    id: number
    tenant_id: number
    name: string
    sku: string
    description?: string
    category_id?: number
    supplier_id?: number
    price: number
    cost?: number
    stock: number
    min_stock: number
    max_stock?: number
    barcode?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Category {
    id: number
    tenant_id: number
    name: string
    code: string
    description?: string
    parent_id?: number
    display_order: number
    is_active: boolean
    created_at: string
    updated_at: string
    children?: Category[]
}

export interface Supplier {
    id: number
    tenant_id: number
    name: string
    code: string
    tax_id?: string
    contact_name?: string
    email?: string
    phone?: string
    mobile?: string
    address?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    website?: string
    notes?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface InventoryMovement {
    id: number
    tenant_id: number
    product_id: number
    movement_type: 'purchase' | 'sale' | 'adjustment' | 'return'
    quantity: number
    reference?: string
    notes?: string
    created_at: string
}

export interface PaginatedResponse<T> {
    items: T[]
    metadata: {
        total: number
        page: number
        size: number
        pages: number
    }
}
