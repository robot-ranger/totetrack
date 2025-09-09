import { useState } from 'react'
import { createTote } from '../api'
import type { Tote } from '../types'
import { Button, Grid, GridItem, Input, Textarea, Box } from '@chakra-ui/react'


export default function ToteForm({ onCreated }: { onCreated: (t: Tote) => void }) {
    const [name, setName] = useState('')
    const [location, setLocation] = useState('')
    const [metadata_json, setMeta] = useState('')
    const [description, setDesc] = useState('')
    const [busy, setBusy] = useState(false)
    // TODO: Integrate new toast API (createToaster) after setup. For now use console.
    const toast = (opts: { title: string }) => { console.log(opts.title) }


    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setBusy(true)
        try {
            const created = await createTote({ name, location, metadata_json, description })
            onCreated(created)
            setName(''); setLocation(''); setMeta(''); setDesc('')
            toast({ title: 'Tote added' })
        } finally {
            setBusy(false)
        }
    }


    return (
        <form onSubmit={submit}>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <GridItem>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Human‑readable name</Box>
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
                        <Box as="label" fontSize="sm" fontWeight="medium">Metadata (JSON or notes)</Box>
                        <Textarea value={metadata_json} onChange={e => setMeta(e.target.value)} />
                    </Box>
                </GridItem>
                <GridItem colSpan={2}>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Physical description / size / brand</Box>
                        <Textarea value={description} onChange={e => setDesc(e.target.value)} />
                    </Box>
                </GridItem>
                <GridItem colSpan={2}>
                    <Button type="submit" loading={busy} colorPalette="blue">Add Tote</Button>
                </GridItem>
            </Grid>
        </form>
    )
}