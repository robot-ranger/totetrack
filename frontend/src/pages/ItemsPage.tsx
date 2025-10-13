import { useEffect, useMemo, useState } from 'react'
import { listItems, listTotes, checkoutItem, checkinItem } from '../api'
import type { ItemWithCheckoutStatus, Tote } from '../types'
import { Box, HStack, Input, Text, VStack, Combobox, Portal, createListCollection, Flex, Heading, Link, Button, Image, Stack, Menu, IconButton, Checkbox } from '@chakra-ui/react'
import ItemsTable from '../components/ItemsTable'
import ItemForm from '../components/ItemForm'
import { FiX, FiFilter, FiChevronDown } from 'react-icons/fi'
import { useColorMode } from '../components/ui/color-mode'


export default function ItemsPage() {
    const [items, setItems] = useState<ItemWithCheckoutStatus[]>([])
    const [totes, setTotes] = useState<Tote[]>([])
    const [q, setQ] = useState('')
    const [sortKey, setSortKey] = useState<keyof ItemWithCheckoutStatus>('name')
    const [asc, setAsc] = useState(true)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<ItemWithCheckoutStatus | null>(null)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [checkedOutOnly, setCheckedOutOnly] = useState(false)
    const [orphanOnly, setOrphanOnly] = useState(false)

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
    const M = Menu as any
    const Chx = Checkbox as any

    const loadData = async () => {
        try {
            const [itemsData, totesData] = await Promise.all([listItems(), listTotes()])
            if (!Array.isArray(itemsData)) {
                console.warn('Expected items array, got', itemsData)
                return
            }
            setItems(itemsData)
            setTotes(totesData)
        } catch (err) {
            console.error('Failed to load data:', err)
        }
    }

    const handleCheckout = async (itemId: string) => {
        try {
            await checkoutItem(itemId)
            console.log('Item checked out successfully')
            loadData() // Refresh data
        } catch (err) {
            console.error('Failed to checkout item:', err)
        }
    }

    const handleCheckin = async (itemId: string) => {
        try {
            await checkinItem(itemId)
            console.log('Item checked in successfully')
            loadData() // Refresh data
        } catch (err) {
            console.error('Failed to checkin item:', err)
        }
    }

    const handleEdit = (item: ItemWithCheckoutStatus) => {
        setEditingItem(item)
        setEditModalOpen(true)
    }

    useEffect(() => {
        loadData()
    }, [])


    const filtered = useMemo(() => {
        const source: ItemWithCheckoutStatus[] = Array.isArray(items) ? items : []
        const lower = q.toLowerCase()
        let arr = source.filter(i => (
            i.name.toLowerCase().includes(lower) ||
            (i.description?.toLowerCase().includes(lower) ?? false)
        ))
        if (checkedOutOnly) arr = arr.filter(i => i.is_checked_out)
        if (orphanOnly) arr = arr.filter(i => !i.tote_id)
        return arr.sort((a, b) => {
            const A = (a[sortKey] ?? '') as any, B = (b[sortKey] ?? '') as any
            if (A < B) return asc ? -1 : 1
            if (A > B) return asc ? 1 : -1
            return 0
        })
    }, [items, q, sortKey, asc, checkedOutOnly, orphanOnly])





    return (
        <Stack display="grid" gap={6}>
            <Heading fontSize="xl" fontWeight="bold">
                Items
            </Heading>
            <HStack align={'end'}>
                <VStack alignItems="start" w='full'>
                    <Text textStyle='sm'>Search:</Text>
                    <Input placeholder="Search items…" value={q} onChange={e => setQ(e.target.value)} /> 
                </VStack>

                
                <VStack alignItems="start">
                    <Text textStyle='sm' display={{base: 'none',md:'block'}}>Filter:</Text>
                    <M.Root>
                        <M.Trigger asChild>
                            <IconButton variant="outline" px={2}><FiFilter /> | <FiChevronDown /></IconButton>
                        </M.Trigger>
                        <Portal>
                            <M.Positioner>
                                <M.Content>
                                    <M.Item closeOnSelect={false}>
                                        <Chx.Root checked={checkedOutOnly} onCheckedChange={(e: any) => setCheckedOutOnly(!!e.checked)}>
                                            <Chx.Control />
                                            <Chx.HiddenInput />
                                            <Chx.Label>Checked Out Only</Chx.Label>
                                        </Chx.Root>
                                    </M.Item>
                                    <M.Item closeOnSelect={false}>
                                        <Chx.Root checked={orphanOnly} onCheckedChange={(e: any) => setOrphanOnly(!!e.checked)}>
                                            <Chx.Control />
                                            <Chx.HiddenInput />
                                            <Chx.Label>Orphaned Only</Chx.Label>
                                        </Chx.Root>
                                    </M.Item>
                                    <M.Item closeOnSelect={false} >
                                        <VStack alignItems="start" >
                                            <Text textStyle='sm'>Sort:</Text>
                                            <Cbx.Root
                                                collection={sortCollection}
                                                value={[sortKey as string]}
                                                onValueChange={(details: { value: string[] }) => {
                                                    if (details.value?.[0]) setSortKey(details.value[0] as keyof ItemWithCheckoutStatus)
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
                                    </M.Item>
                                </M.Content>
                            </M.Positioner>
                        </Portal>
                    </M.Root>
                </VStack>
                <Button onClick={() => { setEditingItem(null); setCreateModalOpen(true) }}>Add Item</Button>
            </HStack>

            {filtered.length === 0 ? (
                <Flex align="center" justify="center" p={4}>
                    <Box textAlign="center">
                        <Heading>No items found.</Heading>
                        {items.length === 0 && <Box color={"fg.subtle"} colorPalette={'teal'}>Add items to get started.</Box>}
                    </Box>
                </Flex>
            ) : (
                <ItemsTable
                    items={filtered}
                    totes={totes}
                    onEdit={handleEdit}
                    onCheckout={handleCheckout}
                    onCheckin={handleCheckin}
                    showToteColumn={true}
                    showLocationColumn={true}
                    onMoved={loadData}
                />
            )}

            {/* Edit Item Modal */}
            {editModalOpen && editingItem && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Heading size="md">Edit Item</Heading>
                            <IconButton size="sm" variant="ghost" onClick={() => setEditModalOpen(false)}><FiX /></IconButton>
                        </Box>
                        {editingItem.image_url && (
                            <Box mb={4} display="flex" justifyContent="center">
                                <Image
                                    src={editingItem.image_url}
                                    alt={editingItem.name}
                                    maxH="240px"
                                    objectFit="contain"
                                    borderRadius="md"
                                    boxShadow="md"
                                />
                            </Box>
                        )}
                        <ItemForm
                            toteId={editingItem.tote_id || undefined}
                            existing={editingItem}
                            onCreated={() => {
                                loadData()
                                setEditModalOpen(false)
                            }}
                            onUpdated={() => {
                                loadData()
                                setEditingItem(null)
                                setEditModalOpen(false)
                            }}
                            onDeleted={() => {
                                loadData()
                                setEditModalOpen(false)
                                setEditingItem(null)
                            }}
                        />
                    </Box>
                </Box>
            )}

            {/* Create Item Modal */}
            {createModalOpen && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Heading size="md">Add Item</Heading>
                            <Button size="sm" variant="ghost" onClick={() => setCreateModalOpen(false)}><FiX /></Button>
                        </Box>
                        <ItemForm
                            onCreated={() => {
                                loadData()
                                setCreateModalOpen(false)
                            }}
                        />
                    </Box>
                </Box>
            )}
        </Stack>
    )
}