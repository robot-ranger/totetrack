import { useEffect, useState } from 'react'
import { Box, Button, Heading, Separator, Text, Table, Image, VStack, Flex, IconButton, Menu, Portal, Spacer } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { getTote, itemsInTote, deleteTote } from '../api'
import type { Tote, Item } from '../types'
import ItemForm from './ItemForm'
import ToteForm from './ToteForm'
import QRLabel from './QRLabel'
import { FiEdit3, FiExternalLink, FiMenu, FiMoreVertical, FiPrinter, FiTrash, FiX } from 'react-icons/fi'

// Local disclosure util (simple) to avoid pulling useDisclosure externally here.
function useSimpleDisclosure(initial = false) {
    const [open, setOpen] = useState(initial)
    return { open, onOpen: () => setOpen(true), onClose: () => setOpen(false) }
}

export default function ToteDetail({ toteId, inList = false }: { toteId: string, inList?: boolean }) {
    // Temporary alias to relax Menu subcomponent typings in this project setup
    const M = Menu as any
    const [tote, setTote] = useState<Tote | null>(null)
    const [items, setItems] = useState<Item[]>([])
    const addModal = useSimpleDisclosure()
    const editToteModal = useSimpleDisclosure()
    const delDialog = useSimpleDisclosure()
    const [editing, setEditing] = useState<Item | null>(null)

    async function load() {
        if (!toteId) return
        const t = await getTote(toteId)
        setTote(t)
        const its = await itemsInTote(toteId)
        setItems(its)
    }

    useEffect(() => { load() }, [toteId])

    if (!toteId) return <Text>Missing tote id.</Text>

    return (
        <Box p={4} borderWidth="1px" borderRadius="md">
            {tote && (
                <>
                    <Flex justifyContent="space-between" alignItems="start" mb={2}>
                        <VStack alignItems="start">
                            {!inList && <Heading size="2xl" mb={2}>{tote.name || tote.id}</Heading>}
                            {tote.location && <Text><b>Location:</b> {tote.location}</Text>}
                            {tote.description && <Text mt={2} whiteSpace="pre-wrap">{tote.description}</Text>}
                            <Flex gap={2} mt={2}>
                                <Button size="xs" colorPalette={'blue'} variant="outline" onClick={editToteModal.onOpen}>Edit Tote</Button>
                                <Button size="xs" colorPalette="red" variant="outline" onClick={delDialog.onOpen}>Delete Tote</Button>
                            </Flex>
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
                        <Table.Root size="sm" variant="line" mt={2}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader w="110px">Photo</Table.ColumnHeader>
                                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                                    <Table.ColumnHeader w="80px">Qty</Table.ColumnHeader>
                                    <Table.ColumnHeader>Description</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {items.map(it => (
                                    <Table.Row key={it.id} _hover={{ bg: 'bg.muted', cursor: 'pointer' }} onClick={() => { setEditing(it); addModal.onOpen(); }}>
                                        <Table.Cell>{it.image_url && <Image src={it.image_url} alt={it.name} boxSize="60px" objectFit="cover" borderRadius="md" />}</Table.Cell>
                                        <Table.Cell>{it.name}</Table.Cell>
                                        <Table.Cell>{it.quantity}</Table.Cell>
                                        <Table.Cell>{it.description ? <Text lineClamp={2}>{it.description}</Text> : '—'}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
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
                                onCreated={(i) => { setItems(prev => [i, ...prev]); addModal.onClose(); }}
                                onUpdated={(i) => {
                                    setItems(prev => prev.map(p => p.id === i.id ? i : p));
                                    setEditing(i);
                                }}
                                onDeleted={(id) => {
                                    setItems(prev => prev.filter(p => p.id !== id));
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
