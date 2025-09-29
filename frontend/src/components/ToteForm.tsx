import { useState, useEffect, useMemo } from 'react'
import { createTote, updateTote, listLocations } from '../api'
import type { Tote, Location } from '../types'
import { Button, Grid, GridItem, Input, Textarea, Box, Select, Portal, createListCollection } from '@chakra-ui/react'
import { transform } from 'framer-motion'
import { useColorMode } from './ui/color-mode'
import { useSidebarRefresh } from '../SidebarRefreshContext'


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
    const { colorMode, toggleColorMode } = useColorMode()
    const { triggerRefresh } = useSidebarRefresh()
    // TODO: Integrate new toast API (createToaster) after setup. For now use console.
    const toast = (opts: { title: string }) => { console.log(opts.title) }

    // Temporary: alias to relax overly-strict TS props on Select subcomponents in this project setup
    const Sel = Select as any

    // Create proper collection using createListCollection - only when locations are available
    const collection = useMemo(() => {
        if (locations.length === 0) {
            return null
        }
        const collectionItems = locations.map(location => ({
            label: location.name,
            value: location.id
        }))

        return createListCollection({
            items: collectionItems
        })
    }, [locations])

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

    // Update form fields when existing tote changes
    useEffect(() => {
        if (existing) {
            setName(existing.name || '')
            setMeta(existing.metadata_json || '')
            setDesc(existing.description || '')
            // Only set locationId if we have locations loaded and the location exists
            if (existing.location_id && locations.length > 0) {
                const locationExists = locations.some(loc => loc.id === existing.location_id)

                setLocationId(locationExists ? [existing.location_id] : [])
            } else if (existing.location_id) {
                // If we have a location_id but no locations loaded yet, set it anyway

                setLocationId([existing.location_id])
            } else {
                setLocationId([])
            }
        }
    }, [existing, locations])

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
                triggerRefresh() // Refresh sidebar counts after creating tote
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
                        {collection ? (
                        <Sel.Root
                            key={`select-${existing?.id || 'new'}-${locations.length}`}
                            collection={collection}
                            value={locationId}
                            onValueChange={(details: any) => setLocationId(details.value)}
                        >
                            <Sel.HiddenSelect />
                            <Sel.Control>
                                <Sel.Trigger>
                                    <Sel.ValueText placeholder="Select a location" />
                                </Sel.Trigger>
                                <Sel.IndicatorGroup>
                                    <Sel.Indicator />
                                </Sel.IndicatorGroup>
                            </Sel.Control>
                            <Portal>
                                <Sel.Positioner>
                                    <Sel.Content style={{ zIndex: 9999, backgroundColor: colorMode === 'dark' ? 'black' : 'white'}}>
                                        {collection.items.map((item: any) => (
                                            <Sel.Item key={item.value} item={item}>
                                                <Sel.ItemText>{item.label}</Sel.ItemText>
                                                <Sel.ItemIndicator />
                                            </Sel.Item>
                                        ))}
                                    </Sel.Content>
                                </Sel.Positioner>
                            </Portal>
                        </Sel.Root>
                        ) : (
                            <Input value="Loading locations..." disabled />
                        )}
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