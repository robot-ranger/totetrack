// frontend/src/types.ts

export interface Item {
    id: number
    name: string
    description?: string | null
    quantity: number
    image_url?: string | null
    tote_id?: string | null
}

export interface Tote {
    id: string
    name?: string | null
    location?: string | null
    metadata_json?: string | null
    description?: string | null
    items: Item[]
}