// frontend/src/types.ts

export interface Item {
    id: string
    name: string
    description?: string | null
    quantity: number
    image_url?: string | null
    tote_id?: string | null
}

export interface Location {
    id: string
    name: string
    description?: string | null
    user_id: string
}

export interface Tote {
    id: string
    name?: string | null
    location?: string | null  // Keep for backward compatibility
    location_id?: string | null
    location_obj?: Location | null
    metadata_json?: string | null
    description?: string | null
    items: Item[]
}

export interface User {
    id: string
    email: string
    full_name?: string | null
    is_active: boolean
    is_superuser: boolean
    created_at?: string | null
    updated_at?: string | null
}

export interface CheckedOutItem {
    id: string
    item_id: string
    user_id: string
    checked_out_at: string
    item: Item
    user: User
}

export interface ItemWithCheckoutStatus extends Item {
    is_checked_out: boolean
    checked_out_by?: User | null
    checked_out_at?: string | null
}