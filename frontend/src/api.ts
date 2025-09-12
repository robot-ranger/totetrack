// frontend/src/api.ts
import axios from 'axios'
import type { Tote, Item, User } from './types'

// Allow overriding via Vite env; falls back to Vite dev proxy ("/api")
const baseURL = import.meta.env.VITE_API_BASE ?? '/api'
export const http = axios.create({ baseURL })

// Attach token helper
export function setAuthToken(token: string | null) {
    if (token) {
        http.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
        delete http.defaults.headers.common['Authorization']
    }
}

// ——— Auth ———
export type TokenResponse = { access_token: string; token_type: string }

export async function login(email: string, password: string): Promise<TokenResponse> {
    const body = new URLSearchParams()
    body.set('username', email)
    body.set('password', password)
    const { data } = await http.post<TokenResponse>('/auth/token', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
}

export async function getMe(): Promise<User> {
    const { data } = await http.get<User>('/users/me')
    return data
}

export async function requestPasswordRecovery(email: string): Promise<{ message?: string; recovery_token?: string }> {
    const { data } = await http.post('/password-recovery', { email })
    return data
}

export async function confirmPasswordRecovery(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await http.post('/password-recovery/confirm', { token, new_password: newPassword })
    return data
}

// ——— Totes ———
export async function listTotes(): Promise<Tote[]> {
    const { data } = await http.get<Tote[]>('/totes')
    return data
}

export async function getTote(id: string): Promise<Tote> {
    const { data } = await http.get<Tote>(`/totes/${id}`)
    return data
}

export async function createTote(payload: Partial<Tote>): Promise<Tote> {
    // Backend expects: { name?, location?, metadata_json?, description? }
    const body = {
        name: payload.name ?? null,
        location: payload.location ?? null,
        metadata_json: payload.metadata_json ?? null,
        description: payload.description ?? null,
    }
    const { data } = await http.post<Tote>('/totes', body)
    return data
}

export async function deleteTote(id: string): Promise<void> {
    await http.delete(`/totes/${id}`)
}

export async function updateTote(id: string, payload: Partial<Tote>): Promise<Tote> {
    const body = {
        name: payload.name ?? null,
        location: payload.location ?? null,
        metadata_json: payload.metadata_json ?? null,
        description: payload.description ?? null,
    }
    const { data } = await http.put<Tote>(`/totes/${id}`, body)
    return data
}

// ——— Items ———
export type AddItemForm = {
    name: string
    quantity?: number
    description?: string
    imageFile?: File | null
}

export async function addItem(toteId: string, form: AddItemForm): Promise<Item> {
    const fd = new FormData()
    fd.set('name', form.name)
    fd.set('quantity', String(form.quantity ?? 1))
    if (form.description) fd.set('description', form.description)
    if (form.imageFile) fd.set('image', form.imageFile)
    const { data } = await http.post<Item>(`/totes/${toteId}/items`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
}

export async function listItems(): Promise<Item[]> {
    const { data } = await http.get<Item[]>('/items')
    return data
}

export async function itemsInTote(toteId: string): Promise<Item[]> {
    const { data } = await http.get<Item[]>(`/totes/${toteId}/items`)
    return data
}

export type UpdateItemForm = {
    name?: string
    quantity?: number
    description?: string | null
    imageFile?: File | null
}

export async function updateItem(itemId: string, form: UpdateItemForm): Promise<Item> {
    const fd = new FormData()
    if (form.name !== undefined) fd.set('name', form.name)
    if (form.quantity !== undefined) fd.set('quantity', String(form.quantity))
    if (form.description !== undefined && form.description !== null) fd.set('description', form.description)
    if (form.imageFile) fd.set('image', form.imageFile)
    const { data } = await http.put<Item>(`/items/${itemId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
}

export async function deleteItem(itemId: string): Promise<void> {
    await http.delete(`/items/${itemId}`)
}

export async function removeItemPhoto(itemId: string): Promise<Item> {
    const { data } = await http.delete<Item>(`/items/${itemId}/image`)
    return data
}