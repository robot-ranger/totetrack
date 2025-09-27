import { useState } from 'react'
import { createLocation, updateLocation } from '../api'
import type { Location } from '../types'
import { Button, Grid, GridItem, Input, Textarea, Box } from '@chakra-ui/react'

interface LocationFormProps {
    onCreated?: (location: Location) => void
    existing?: Location | null
    onUpdated?: (location: Location) => void
}

export default function LocationForm({ onCreated, existing, onUpdated }: LocationFormProps) {
    const [name, setName] = useState(existing?.name || '')
    const [description, setDescription] = useState(existing?.description || '')
    const [busy, setBusy] = useState(false)
    // TODO: Integrate new toast API (createToaster) after setup. For now use console.
    const toast = (opts: { title: string }) => { console.log(opts.title) }

    const isEdit = !!existing

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) {
            toast({ title: 'Location name is required' })
            return
        }
        
        setBusy(true)
        try {
            if (isEdit && existing) {
                const updated = await updateLocation(existing.id, { name, description })
                onUpdated?.(updated)
                toast({ title: 'Location updated' })
            } else {
                const created = await createLocation({ name, description })
                onCreated?.(created)
                setName('')
                setDescription('')
                toast({ title: 'Location added' })
            }
        } catch (error) {
            console.error('Error saving location:', error)
            toast({ title: 'Error saving location' })
        } finally {
            setBusy(false)
        }
    }

    return (
        <form onSubmit={submit}>
            <Grid templateColumns="1fr" gap={4}>
                <GridItem>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Location Name*</Box>
                        <Input 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Basement Shelf A"
                            required
                        />
                    </Box>
                </GridItem>
                <GridItem>
                    <Box display="grid" gap={1}>
                        <Box as="label" fontSize="sm" fontWeight="medium">Description</Box>
                        <Textarea 
                            value={description} 
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description of this location"
                            rows={3}
                        />
                    </Box>
                </GridItem>
                <GridItem>
                    <Button type="submit" loading={busy} colorPalette="blue">
                        {isEdit ? 'Save Changes' : 'Add Location'}
                    </Button>
                </GridItem>
            </Grid>
        </form>
    )
}