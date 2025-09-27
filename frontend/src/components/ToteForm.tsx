import { useState, useEffect } from 'react'
import { createTote, updateTote, listLocations } from '../api'
import type { Tote, Location } from '../types'
import { Button, Grid, GridItem, Input, Textarea, Box, Combobox, Portal, createListCollection } from '@chakra-ui/react'


interface ToteFormProps {
    onCreated?: (t: Tote) => void
    existing?: Tote | null
    onUpdated?: (t: Tote) => void
}

export default function ToteForm({ onCreated, existing, onUpdated }: ToteFormProps) {
    const [name, setName] = useState(existing?.name || '')
    const [locationId, setLocationId] = useState<string[]>(existing?.location_id ? [existing.location_id] : [])
    const [metadata_json, setMeta] = useState(existing?.metadata_json || '')
    const [description, setDesc] = useState(existing?.description || '')
    const [locations, setLocations] = useState<Location[]>([])
    const [busy, setBusy] = useState(false)
    // TODO: Integrate new toast API (createToaster) after setup. For now use console.
    const toast = (opts: { title: string }) => { console.log(opts.title) }

    // Temporary: alias to relax overly-strict TS props on Combobox subcomponents in this project setup
    const Cbx = Combobox as any

    useEffect(() => {
        async function loadLocations() {
            try {
                const locationsList = await listLocations()
                setLocations(locationsList)
            } catch (error) {
                console.error('Error loading locations:', error)
            }
        }
        loadLocations()
    }, [])

    const isEdit = !!existing

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setBusy(true)
        try {
            const selectedLocationId = locationId.length > 0 ? locationId[0] : null
            if (isEdit && existing) {
                const upd = await updateTote(existing.id, { 
                    name, 
                    location_id: selectedLocationId, 
                    metadata_json, 
                    description 
                })
                onUpdated?.(upd)
                toast({ title: 'Tote updated' })
            } else {
                const created = await createTote({ 
                    name, 
                    location_id: selectedLocationId, 
                    metadata_json, 
                    description 
                })
                onCreated?.(created)
                setName(''); setLocationId([]); setMeta(''); setDesc('')
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
                        <Cbx.Root
                            collection={createListCollection({
                                items: locations.map(location => ({
                                    label: location.name,
                                    value: location.id
                                }))
                            })}
                            value={locationId}
                            onValueChange={(details: any) => setLocationId(details.value)}
                            selectionBehavior="replace"
                        >
                            <Cbx.Control>
                                <Cbx.Input />
                                <Cbx.IndicatorGroup>
                                    <Cbx.ClearTrigger />
                                    <Cbx.Trigger />
                                </Cbx.IndicatorGroup>
                            </Cbx.Control>
                            <Portal>
                                <Cbx.Positioner>
                                    <Cbx.Content>
                                        <Cbx.Empty>No locations found</Cbx.Empty>
                                        {locations.map((location) => (
                                            <Cbx.Item 
                                                key={location.id} 
                                                item={{ label: location.name, value: location.id }}
                                            >
                                                {location.name}
                                                <Cbx.ItemIndicator />
                                            </Cbx.Item>
                                        ))}
                                    </Cbx.Content>
                                </Cbx.Positioner>
                            </Portal>
                        </Cbx.Root>
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