import { useEffect, useState } from 'react'
import { Box, Button, Heading, Separator, Text, VStack, Flex, Link, Image } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { getTote, deleteTote, checkoutItem, checkinItem, listItems } from '../api'
import type { Tote, Item, ItemWithCheckoutStatus } from '../types'
import ItemForm from './ItemForm'
import ToteForm from './ToteForm'
import QRLabel from './QRLabel'
import ItemsTable from './ItemsTable'
import { FiExternalLink, FiX } from 'react-icons/fi'
import { DeleteButton, EditButton } from './ui/buttons'
import { useSidebarRefresh } from '../SidebarRefreshContext'

// Local disclosure util (simple) to avoid pulling useDisclosure externally here.
function useSimpleDisclosure(initial = false) {
    const [open, setOpen] = useState(initial)
    return { open, onOpen: () => setOpen(true), onClose: () => setOpen(false) }
}

export default function ToteDetail({ toteId, inList = false }: { toteId: string, inList?: boolean }) {
    const [tote, setTote] = useState<Tote | null>(null)
    const [items, setItems] = useState<ItemWithCheckoutStatus[]>([])
    const [editing, setEditing] = useState<Item | null>(null)
    const { triggerRefresh } = useSidebarRefresh()
    const addModal = useSimpleDisclosure(false)
    const editToteModal = useSimpleDisclosure(false)
    const delDialog = useSimpleDisclosure(false)

    async function load() {
        if (!toteId) return
        try {
            const [t, allItems] = await Promise.all([getTote(toteId), listItems()])
            setTote(t)
            // Filter items for this tote from the global items list (which includes checkout status)
            const toteItems = allItems.filter(item => item.tote_id === toteId)
            setItems(toteItems)
        } catch (err) {
            console.error('Failed to load tote data:', err)
        }
    }

    const handleCheckout = async (itemId: string) => {
        try {
            await checkoutItem(itemId)
            console.log('Item checked out successfully')
            load() // Refresh data
        } catch (err) {
            console.error('Failed to checkout item:', err)
        }
    }

    const handleCheckin = async (itemId: string) => {
        try {
            await checkinItem(itemId)
            console.log('Item checked in successfully')
            load() // Refresh data
        } catch (err) {
            console.error('Failed to checkin item:', err)
        }
    }

    useEffect(() => { load() }, [toteId])

    if (!toteId) return <Text>Missing tote id.</Text>

    return (
        <Box p={4} borderWidth="1px" borderRadius="md" borderColor="yellow.focusRing">
            {tote && (
                <>
                    <Flex justifyContent="space-between" alignItems="start" mb={2}>
                        <VStack alignItems="start">
                            {!inList && <Heading size="2xl" mb={2}>{tote.name || tote.id}</Heading>}
                            {tote.location && <Text><b>Location:</b> {tote.location}</Text>}
                            {tote.description && <Text mt={2} whiteSpace="pre-wrap">{tote.description}</Text>}
                            <Flex gap={2} mt={2}>
                                <EditButton onClick={editToteModal.onOpen} topic='Tote' />
                                <DeleteButton onClick={delDialog.onOpen} topic='Tote' />
                            </Flex>
                            <Text color={'fg.subtle'}>Location: {tote.location_obj ? <Link variant="underline" color="teal.500" asChild><RouterLink to={`/locations/${tote.location_obj.id}`}>{tote.location_obj.name} <FiExternalLink/></RouterLink></Link> : 'Unassigned'}</Text>
                        </VStack>
                        <VStack align={'end'}>
                            {inList && (
                                <RouterLink
                                    to={`/totes/${tote.id}`}
                                    aria-label={`Open details for tote ${tote.name || tote.id}`}
                                    title={tote.name || tote.id}
                                >
                                    <FiExternalLink />
                                </RouterLink>
                            )}
                            <QRLabel uuid={tote.id} name={tote.name || tote.id} compact />
                        </VStack>
                    </Flex>
                    <Separator my={4} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Heading size="sm">Items</Heading>
                        <Button size="sm" colorPalette="yellow" onClick={() => { setEditing(null); addModal.onOpen(); }}>Add Item</Button>
                    </Box>
                    {items.length === 0 ? (
                        <Text mt={2}>No items yet.</Text>
                    ) : (
                        <ItemsTable
                            items={items}
                            totes={[]}
                            onEdit={(item) => { setEditing(item); addModal.onOpen(); }}
                            onCheckout={handleCheckout}
                            onCheckin={handleCheckin}
                            showToteColumn={false}
                            showLocationColumn={false}
                            onMoved={load}
                        />
                    )}
                </>
            )}

            {/* Add/Edit Item Modal */}
            {addModal.open && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Heading size="md">{editing ? 'Edit Item' : 'Add Item'}</Heading>
                            <Button size="sm" variant="ghost" onClick={addModal.onClose}><FiX /></Button>
                        </Box>
                        {editing?.image_url && (
                            <Box mb={4} display="flex" justifyContent="center">
                                <Image
                                    src={editing.image_url}
                                    alt={editing.name}
                                    maxH="240px"
                                    objectFit="contain"
                                    borderRadius="md"
                                    boxShadow="md"
                                />
                            </Box>
                        )}
                        {tote && (
                            <ItemForm
                                toteId={tote.id}
                                existing={editing}
                                onCreated={() => { load(); addModal.onClose(); }}
                                onUpdated={() => {
                                    load();
                                    setEditing(null);
                                }}
                                onDeleted={() => {
                                    load();
                                    addModal.onClose();
                                    setEditing(null);
                                }}
                            />
                        )}
                    </Box>
                </Box>
            )}

            {/* Edit Tote Modal */}
            {editToteModal.open && tote && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1500}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Heading size="md">Edit Tote</Heading>
                            <Button size="sm" variant="ghost" onClick={editToteModal.onClose}><FiX /></Button>
                        </Box>
                        <ToteForm existing={tote} onUpdated={(upd) => { setTote(upd); editToteModal.onClose(); }} />
                    </Box>
                </Box>
            )}

            {/* Delete confirmation dialog */}
            {delDialog.open && tote && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={2000}>
                    <Box bg="bg.canvas" borderWidth="1px" borderRadius="md" p={4} minW={{ base: '90%', md: '400px' }}>
                        <Heading size="sm" mb={2}>Delete Tote?</Heading>
                        <Text mb={4}>This will permanently delete this tote and all its items. This action cannot be undone.</Text>
                        <Flex justifyContent="flex-end" gap={2}>
                            <Button variant="ghost" onClick={delDialog.onClose}>Cancel</Button>
                            <Button colorPalette="red" onClick={async () => {
                                try {
                                    await deleteTote(tote.id)
                                    delDialog.onClose()
                                    triggerRefresh() // Refresh sidebar counts after deleting tote
                                    // After deletion, clear local state.
                                    setTote(null)
                                    setItems([])
                                } catch (e) {
                                    console.error('Failed to delete tote', e)
                                    delDialog.onClose()
                                }
                            }}>Delete</Button>
                        </Flex>
                    </Box>
                </Box>
            )}
        </Box>
    )
}
