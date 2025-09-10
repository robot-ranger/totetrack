import { useState } from 'react'
import { createTote, updateTote } from '../api'
import type { Tote } from '../types'
import { Button, Grid, GridItem, Input, Textarea, Box } from '@chakra-ui/react'


interface ToteFormProps {
    onCreated?: (t: Tote) => void
    existing?: Tote | null
    onUpdated?: (t: Tote) => void
}

export default function ToteForm({ onCreated, existing, onUpdated }: ToteFormProps) {
    const [name, setName] = useState(existing?.name || '')
    const [location, setLocation] = useState(existing?.location || '')
    const [metadata_json, setMeta] = useState(existing?.metadata_json || '')
    const [description, setDesc] = useState(existing?.description || '')
    const [busy, setBusy] = useState(false)
    // TODO: Integrate new toast API (createToaster) after setup. For now use console.
    const toast = (opts: { title: string }) => { console.log(opts.title) }


    const isEdit = !!existing

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setBusy(true)
        try {
            if (isEdit && existing) {
                const upd = await updateTote(existing.id, { name, location, metadata_json, description })
                onUpdated?.(upd)
                toast({ title: 'Tote updated' })
            } else {
                const created = await createTote({ name, location, metadata_json, description })
                onCreated?.(created)
                setName(''); setLocation(''); setMeta(''); setDesc('')
                toast({ title: 'Tote added' })
            }
        } finally {
            setBusy(false)
        }
    }


    return (
        <form onSubmit={submit}>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <GridItem>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Name</Box>
                        <Input value={name} onChange={e => setName(e.target.value)} />
                    </Box>
                </GridItem>
                <GridItem>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Storage location</Box>
                        <Input value={location} onChange={e => setLocation(e.target.value)} />
                    </Box>
                </GridItem>
                <GridItem colSpan={2}>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Contents</Box>
                        <Textarea value={metadata_json} onChange={e => setMeta(e.target.value)} />
                    </Box>
                </GridItem>
                <GridItem colSpan={2}>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Visual description</Box>
                        <Textarea value={description} onChange={e => setDesc(e.target.value)} />
                    </Box>
                </GridItem>
                <GridItem colSpan={2}>
                    <Button type="submit" loading={busy} colorPalette="blue">{isEdit ? 'Save Changes' : 'Add Tote'}</Button>
                </GridItem>
            </Grid>
        </form>
    )
}