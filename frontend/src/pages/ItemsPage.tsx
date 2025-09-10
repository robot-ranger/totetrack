import { useEffect, useMemo, useState } from 'react'
import { listItems, listTotes } from '../api'
import type { Item, Tote } from '../types'
import { Box, HStack, Input, Button, Table, Text, Field, VStack, Combobox, Portal, createListCollection } from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'


export default function ItemsPage() {
    const [items, setItems] = useState<Item[]>([])
    const [totes, setTotes] = useState<Tote[]>([])
    const [q, setQ] = useState('')
    const [sortKey, setSortKey] = useState<keyof Item>('name')
    const [asc, setAsc] = useState(true)
    const navigate = useNavigate()

    // Combobox collection for sort options
    const sortItems = useMemo(() => (
        [
            { label: 'Name', value: 'name' },
            { label: 'Quantity', value: 'quantity' },
            { label: 'ID', value: 'id' },
        ] as const
    ), [])
    const sortCollection = useMemo(() => createListCollection({ items: sortItems }), [sortItems])

    // Temporary: alias to relax overly-strict TS props on Combobox subcomponents in this project setup
    const Cbx = Combobox as any


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
            <HStack align={'end'}>
                <VStack alignItems="start" w='full'>
                    <Text textStyle='sm'>Search:</Text>
                    <Input placeholder="Search items…" value={q} onChange={e => setQ(e.target.value)} />
                </VStack>
                
                <VStack alignItems="start" >
                    <Text textStyle='sm'>Sort:</Text>
                    <Cbx.Root
                        collection={sortCollection}
                        value={[sortKey as string]}
                        onValueChange={(details: { value: string[] }) => {
                            if (details.value?.[0]) setSortKey(details.value[0] as keyof Item)
                        }}
                        width="48"
                        selectionBehavior="replace"
                        inputBehavior="autohighlight"
                    >
                        <Cbx.Control>
                            <Cbx.Input placeholder="Sort by" />
                            <Cbx.IndicatorGroup>
                                <Cbx.ClearTrigger />
                                <Cbx.Trigger />
                            </Cbx.IndicatorGroup>
                        </Cbx.Control>
                        <Portal>
                            <Cbx.Positioner>
                                <Cbx.Content>
                                    {sortItems.map((item) => (
                                        <Cbx.Item key={item.value} item={item}>
                                            {item.label}
                                            <Cbx.ItemIndicator />
                                        </Cbx.Item>
                                    ))}
                                </Cbx.Content>
                            </Cbx.Positioner>
                        </Portal>
                    </Cbx.Root>
                </VStack>
            </HStack>


            <Table.ScrollArea>
                <Table.Root size="sm" variant="line">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Item</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="end">Qty</Table.ColumnHeader>
                            <Table.ColumnHeader>Tote UUID</Table.ColumnHeader>
                            <Table.ColumnHeader>Tote Name</Table.ColumnHeader>
                            <Table.ColumnHeader>Tote Location</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {filtered.map(i => {
                            const tote = getToteForItem(i)
                            return (
                                <Table.Row
                                    key={i.id}
                                    _hover={{ bg: tote ? 'bg.muted' : undefined, cursor: tote ? 'pointer' : 'default' }}
                                    onClick={() => { if (tote) navigate(`/totes/${tote.id}`) }}
                                >
                                    <Table.Cell>
                                        <Text fontWeight="semibold">{i.name}</Text>
                                        {i.description && <Text color="gray.600" lineClamp={1} textWrap="wrap">{i.description}</Text>}
                                    </Table.Cell>
                                    <Table.Cell textAlign="end">{i.quantity}</Table.Cell>
                                    <Table.Cell>
                                        {tote ? (
                                            <Text color={'cyan.500'}>{tote.id.slice(-6)}</Text>
                                        ) : '—'}
                                    </Table.Cell>
                                    <Table.Cell>{tote?.name ?? '—'}</Table.Cell>
                                    <Table.Cell>{tote?.location}</Table.Cell>
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