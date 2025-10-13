// Centralized import/export utilities for data backup and restore
// Uses existing API client functions and JSZip for packaging.

import type { ItemWithCheckoutStatus, Tote, User, Location } from './types'
import {
  listItems,
  listLocations,
  listTotes,
  listUsers,
  createLocation,
  createTote,
  addItem,
  createItem,
  createUser,
} from './api'

// Lazy import jszip to keep initial bundle small
async function getJSZip() {
  const { default: JSZip } = await import('jszip')
  return JSZip
}

// ——— CSV helpers ———
function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return ''
  const v = typeof val === 'object' ? JSON.stringify(val) : String(val)
  if (/[",\n\r]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"'
  }
  return v
}

function toCsvFromRows(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const lines: string[] = []
  lines.push(headers.join(','))
  for (const r of rows) {
    const row = headers.map(h => escapeCsv((r as any)[h]))
    lines.push(row.join(','))
  }
  return lines.join('\r\n')
}

// Basic CSV parser supporting quoted fields with escaped quotes
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const rows: string[][] = []
  let i = 0
  const s = text.replace(/\r\n?/g, '\n') // normalize newlines
  while (i < s.length) {
    const row: string[] = []
    let field = ''
    let inQuotes = false
    for (; i < s.length; i++) {
      const ch = s[i]
      if (inQuotes) {
        if (ch === '"') {
          if (s[i + 1] === '"') { // escaped quote
            field += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          field += ch
        }
      } else {
        if (ch === '"') {
          inQuotes = true
        } else if (ch === ',') {
          row.push(field)
          field = ''
        } else if (ch === '\n') {
          row.push(field)
          rows.push(row)
          field = ''
          break
        } else {
          field += ch
        }
      }
    }
    // end of string
    if (i >= s.length) {
      row.push(field)
      rows.push(row)
    }
    i++
  }

  const headers = (rows.shift() ?? []).map(h => h.trim())
  const outRows = rows
    .filter(r => r.length && r.some(v => v !== ''))
    .map(r => {
      const obj: Record<string, string> = {}
      headers.forEach((h, idx) => {
        obj[h] = r[idx] ?? ''
      })
      return obj
    })
  return { headers, rows: outRows }
}

// ——— Export ———
export async function exportDataZip(): Promise<Blob> {
  const [locations, totes, items, users] = await Promise.all([
    listLocations(),
    listTotes(),
    listItems(),
    listUsers(), // superuser-only endpoint; caller should gate accordingly
  ])

  // Build CSVs
  const locationHeaders = ['id', 'name', 'description']
  const locationRows = locations.map(l => ({ id: l.id, name: l.name, description: l.description ?? '' }))
  const locationsCsv = toCsvFromRows(locationRows, locationHeaders)

  const toteHeaders = ['id', 'name', 'description', 'location', 'location_id', 'metadata_json', 'items_count']
  const toteRows = totes.map(t => ({
    id: t.id,
    name: t.name ?? '',
    description: t.description ?? '',
    location: t.location ?? t.location_obj?.name ?? '',
    location_id: t.location_id ?? t.location_obj?.id ?? '',
    metadata_json: t.metadata_json ?? '',
    items_count: Array.isArray(t.items) ? t.items.length : 0,
  }))
  const totesCsv = toCsvFromRows(toteRows, toteHeaders)

  const itemHeaders = [
    'id', 'name', 'description', 'quantity', 'tote_id', 'image_url',
    'is_checked_out', 'checked_out_at', 'checked_out_by_id', 'checked_out_by_email', 'checked_out_by_name',
  ]
  const itemsCsv = toCsvFromRows(
    (items as ItemWithCheckoutStatus[]).map(it => ({
      id: it.id,
      name: it.name,
      description: it.description ?? '',
      quantity: it.quantity,
      tote_id: it.tote_id ?? '',
      image_url: it.image_url ?? '',
      is_checked_out: !!it.is_checked_out,
      checked_out_at: it.checked_out_at ?? '',
      checked_out_by_id: it.checked_out_by?.id ?? '',
      checked_out_by_email: it.checked_out_by?.email ?? '',
      checked_out_by_name: it.checked_out_by?.full_name ?? '',
    })),
    itemHeaders
  )

  const userHeaders = ['id', 'email', 'full_name', 'is_active', 'is_superuser', 'account_id', 'created_at', 'updated_at']
  const usersCsv = toCsvFromRows(
    (users as User[]).map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name ?? '',
      is_active: u.is_active,
      is_superuser: u.is_superuser,
      account_id: u.account_id,
      created_at: u.created_at ?? '',
      updated_at: u.updated_at ?? '',
    })),
    userHeaders
  )

  const JSZip = await getJSZip()
  const zip = new JSZip()
  zip.file('locations.csv', locationsCsv)
  zip.file('totes.csv', totesCsv)
  zip.file('items.csv', itemsCsv)
  zip.file('users.csv', usersCsv)
  const blob = await zip.generateAsync({ type: 'blob' })
  return blob
}

// ——— Import ———
export type ImportOptions = {
  // If true, attempt to create missing users from users.csv (passwords will be random placeholders)
  includeUsers?: boolean
}

export type ImportReport = {
  locationsCreated: number
  totesCreated: number
  itemsCreated: number
  usersCreated: number
  notes: string[]
}

export async function importDataZip(file: File, opts: ImportOptions = {}): Promise<ImportReport> {
  const JSZip = await getJSZip()
  const zip = await JSZip.loadAsync(file)
  const notes: string[] = []

  // Read CSV files if present
  const readCsv = async (name: string) => {
    const entry = zip.file(name)
    if (!entry) return null
    const text = await entry.async('text')
    return parseCsv(text)
  }

  const [locCsv, toteCsv, itemCsv, userCsv] = await Promise.all([
    readCsv('locations.csv'),
    readCsv('totes.csv'),
    readCsv('items.csv'),
    readCsv('users.csv'),
  ])

  // Build lookup of existing entities to avoid dupes
  const existingLocations = await listLocations()
  const existingLocationByName = new Map(existingLocations.map(l => [l.name, l]))

  const existingTotes = await listTotes()
  const existingToteByName = new Map(existingTotes.map(t => [t.name ?? '', t]))

  let usersCreated = 0
  if (opts.includeUsers && userCsv) {
    try {
      const existingUsers = await listUsers()
      const byEmail = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]))
      for (const r of userCsv.rows) {
        const email = (r['email'] || '').toLowerCase()
        if (!email) continue
        if (byEmail.has(email)) continue
        // Create with a temporary password
        const tempPassword = Math.random().toString(36).slice(2) + 'A1!'
        await createUser({ email, full_name: r['full_name'] || undefined, password: tempPassword })
        usersCreated++
      }
    } catch (e) {
      notes.push(`Users import skipped due to error: ${String(e)}`)
    }
  }

  // Import locations
  let locationsCreated = 0
  const locationNameToId = new Map<string, string>()
  // Seed with existing
  for (const l of existingLocations) locationNameToId.set(l.name, l.id)
  if (locCsv) {
    for (const r of locCsv.rows) {
      const name = r['name']?.trim()
      if (!name) continue
      if (!existingLocationByName.has(name)) {
        const created = await createLocation({ name, description: r['description'] || undefined })
        existingLocationByName.set(name, created)
        locationNameToId.set(name, created.id)
        locationsCreated++
      } else {
        // map id even if existing
        const l = existingLocationByName.get(name) as Location
        locationNameToId.set(name, l.id)
      }
    }
  }

  // Import totes (track old->new id mapping)
  let totesCreated = 0
  const oldToteIdToNewId = new Map<string, string>()
  if (toteCsv) {
    for (const r of toteCsv.rows) {
      const name = (r['name'] || '').trim()
      const oldId = r['id']
      const locationName = (r['location'] || '').trim()
      const locationId = locationName ? (locationNameToId.get(locationName) ?? null) : null

      if (!name) {
        // Allow unnamed totes; create if not existing by empty key is awkward; always create
        const created = await createTote({ name: null, description: r['description'] || null, location_id: locationId })
        if (oldId) oldToteIdToNewId.set(oldId, created.id)
        totesCreated++
        continue
      }

      const existing = existingToteByName.get(name)
      if (existing) {
        oldToteIdToNewId.set(oldId, existing.id)
        continue
      }
      const created = await createTote({ name, description: r['description'] || null, location_id: locationId })
      oldToteIdToNewId.set(oldId, created.id)
      totesCreated++
    }
  }

  // Import items
  let itemsCreated = 0
  if (itemCsv) {
    for (const r of itemCsv.rows) {
      const name = (r['name'] || '').trim()
      if (!name) continue
      const qty = parseInt(r['quantity'] || '1', 10)
      const description = r['description'] || undefined
      const oldToteId = r['tote_id']?.trim()
      const newToteId = oldToteId ? oldToteIdToNewId.get(oldToteId) : undefined
      if (newToteId) {
        await addItem(newToteId, { name, quantity: isNaN(qty) ? 1 : qty, description })
      } else {
        await createItem({ name, quantity: isNaN(qty) ? 1 : qty, description })
      }
      itemsCreated++
    }
  }

  return { locationsCreated, totesCreated, itemsCreated, usersCreated, notes }
}
