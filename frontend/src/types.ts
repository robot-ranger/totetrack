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