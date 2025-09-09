import { useState } from 'react'
import { addItem, updateItem, deleteItem } from '../api'
import type { Item } from '../types'
import { Button, Grid, GridItem, Input, Textarea, Box, Flex, Heading, Text } from '@chakra-ui/react'


interface ItemFormProps {
    toteId: string
    onCreated?: (i: Item) => void
    existing?: Item | null
    onUpdated?: (i: Item) => void
    onDeleted?: (id: number) => void
}

export default function ItemForm({ toteId, onCreated, existing, onUpdated, onDeleted }: ItemFormProps) {
    const [name, setName] = useState(existing?.name || '')
    const [quantity, setQty] = useState(existing?.quantity || 1)
    const [description, setDesc] = useState(existing?.description || '')
    const [file, setFile] = useState<File | null>(null)
    const isEdit = !!existing
    const [submitting, setSubmitting] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)
        try {
            if (isEdit && existing) {
                const updated = await updateItem(existing.id, { name, quantity, description, imageFile: file })
                onUpdated?.(updated)
            } else {
                const created = await addItem(toteId, { name, quantity, description, imageFile: file })
                onCreated?.(created)
                setName(''); setQty(1); setDesc(''); setFile(null)
            }
        } finally {
            setSubmitting(false)
        }
    }

    async function confirmDelete() {
        if (!existing) return
        setDeleting(true)
        try {
            await deleteItem(existing.id)
            onDeleted?.(existing.id)
        } finally {
            setDeleting(false)
            setConfirmOpen(false)
        }
    }

    return (
        <form onSubmit={submit}>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <GridItem>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Item name</Box>
                        <Input value={name} onChange={e => setName(e.target.value)} required />
                    </Box>
                </GridItem>
                <GridItem>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Quantity</Box>
                        <Input type="number" min={1} value={quantity} onChange={e => setQty(Math.max(1, Number(e.target.value)))} required />
                    </Box>
                </GridItem>
                <GridItem>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Photo {isEdit && '(upload to replace)'}</Box>
                        <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </Box>
                </GridItem>
                <GridItem colSpan={2}>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Description</Box>
                        <Textarea value={description} onChange={e => setDesc(e.target.value)} />
                    </Box>
                </GridItem>
                <GridItem colSpan={2}>
                    <Flex gap={3}>
                        <Button type="submit" colorPalette="blue" disabled={submitting}>{isEdit ? 'Save Changes' : 'Add Item'}</Button>
                        {isEdit && <Button type="button" variant="outline" colorPalette="red" onClick={() => setConfirmOpen(true)}>Delete</Button>}
                    </Flex>
                </GridItem>
            </Grid>
            {confirmOpen && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={3000}>
                    <Box bg="bg.canvas" borderWidth="1px" borderRadius="md" p={4} minW={{ base: '90%', md: '400px' }}>
                        <Heading size="sm" mb={2}>Delete Item?</Heading>
                        <Text mb={4}>This will permanently remove this item from the tote.</Text>
                        <Flex justifyContent="flex-end" gap={2}>
                            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</Button>
                            <Button colorPalette="red" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</Button>
                        </Flex>
                    </Box>
                </Box>
            )}
        </form>
    )
}