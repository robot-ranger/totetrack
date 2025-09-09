import { useEffect, useMemo, useState } from 'react'
import { listItems, listTotes } from '../api'
import type { Item, Tote } from '../types'
import { Box, HStack, Input, NativeSelect, Button, Table, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'


export default function SearchPage() {
    const [items, setItems] = useState<Item[]>([])
    const [totes, setTotes] = useState<Tote[]>([])
    const [q, setQ] = useState('')
    const [sortKey, setSortKey] = useState<keyof Item>('name')
    const [asc, setAsc] = useState(true)


    useEffect(() => {
        listItems().then(d => {
            if (!Array.isArray(d)) {
                console.warn('Expected items array, got', d)
                return
            }
            setItems(d)
        })
        listTotes().then(setTotes)
    }, [])


    const filtered = useMemo(() => {
        const source: Item[] = Array.isArray(items) ? items : []
        const lower = q.toLowerCase()
        const arr = source.filter(i => (
            i.name.toLowerCase().includes(lower) ||
            (i.description?.toLowerCase().includes(lower) ?? false)
        ))
        return arr.sort((a, b) => {
            const A = (a[sortKey] ?? '') as any, B = (b[sortKey] ?? '') as any
            if (A < B) return asc ? -1 : 1
            if (A > B) return asc ? 1 : -1
            return 0
        })
    }, [items, q, sortKey, asc])


    function getToteForItem(it: Item) {
        if (it.tote_id) return totes.find(t => t.id === it.tote_id)
        // fallback to previous (slower) method if tote_id absent
        return totes.find(t => t.items.some(x => x.id === it.id))
    }


    return (
        <Box display="grid" gap={4}>
            <HStack>
                <Input placeholder="Search items…" value={q} onChange={e => setQ(e.target.value)} />
                <NativeSelect.Root size="sm" maxW="48">
                    <NativeSelect.Field value={sortKey} onChange={e => setSortKey(e.target.value as keyof Item)}>
                        <option value="name">Name</option>
                        <option value="quantity">Quantity</option>
                        <option value="id">ID</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Button onClick={() => setAsc(a => !a)}>{asc ? 'Asc' : 'Desc'}</Button>
            </HStack>


            <Table.ScrollArea>
                <Table.Root size="sm" variant="line">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Item</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="end">Qty</Table.ColumnHeader>
                            <Table.ColumnHeader>Tote UUID</Table.ColumnHeader>
                            <Table.ColumnHeader>Tote Name</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {filtered.map(i => {
                            const tote = getToteForItem(i)
                            return (
                                <Table.Row key={i.id}>
                                    <Table.Cell>
                                        <Text fontWeight="semibold">{i.name}</Text>
                                        {i.description && <Text color="gray.600">{i.description}</Text>}
                                    </Table.Cell>
                                    <Table.Cell textAlign="end">{i.quantity}</Table.Cell>
                                    <Table.Cell>
                                        {tote ? (
                                            <RouterLink to={`/totes/${tote.id}`}>
                                                <code>{tote.id}</code>
                                            </RouterLink>
                                        ) : '—'}
                                    </Table.Cell>
                                    <Table.Cell>{tote?.name ?? '—'}</Table.Cell>
                                </Table.Row>
                            )
                        })}
                    </Table.Body>
                </Table.Root>
            </Table.ScrollArea>
            {filtered.length === 0 && <Text>No items found.</Text>}
        </Box>
    )
}