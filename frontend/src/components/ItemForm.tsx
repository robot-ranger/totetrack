import { useRef, useState } from 'react'
import { addItem, updateItem, deleteItem, removeItemPhoto } from '../api'
import type { Item } from '../types'
import { Button, Grid, GridItem, Input, Textarea, Box, Flex, Heading, Text, FileUpload, IconButton } from '@chakra-ui/react'
import type React from 'react'
import { FiUpload } from 'react-icons/fi'


interface ItemFormProps {
    toteId: string
    onCreated?: (i: Item) => void
    existing?: Item | null
    onUpdated?: (i: Item) => void
    onDeleted?: (id: string) => void
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
    const [removingPhoto, setRemovingPhoto] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    type FileChangeDetails = Parameters<NonNullable<React.ComponentProps<typeof FileUpload.Root>["onFileChange"]>>[0]
    const handleFileChange = (details: FileChangeDetails) => {
        setFile(details.acceptedFiles[0] ?? null)
    }

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

    async function handleRemovePhoto() {
        if (!existing) return
        setRemovingPhoto(true)
        try {
            const updated = await removeItemPhoto(existing.id)
            onUpdated?.(updated)
        } finally {
            setRemovingPhoto(false)
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
                        <FileUpload.Root
                            accept="image/*"
                            maxFiles={1}
                            onFileChange={handleFileChange}
                        >
                            <FileUpload.HiddenInput ref={fileInputRef} />
                            <IconButton variant="outline" size="sm" px={2} onClick={() => fileInputRef.current?.click()}>
                                <FiUpload />
                                Select image
                            </IconButton>
                            <FileUpload.List />
                        </FileUpload.Root>
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
                        {isEdit && existing?.image_url && (
                            <Button type="button" variant="outline" onClick={handleRemovePhoto} disabled={removingPhoto}>
                                {removingPhoto ? 'Removing…' : 'Remove Photo'}
                            </Button>
                        )}
                        {isEdit && <Button type="button" variant="outline" colorPalette="red" onClick={() => setConfirmOpen(true)}>Delete Item</Button>}
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