import { useEffect, useMemo, useState } from 'react'
import { listLocations, deleteLocation, listTotes } from '../api'
import type { Location, Tote } from '../types'
import LocationForm from '../components/LocationForm'
import LocationTable from '../components/LocationTable'
import { Box, Heading, Stack, Button, useDisclosure, HStack, Input, IconButton } from '@chakra-ui/react'
import { FiX, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([])
    const [totes, setTotes] = useState<Tote[]>([])
    const { open, onOpen, onClose } = useDisclosure()
    const [q, setQ] = useState('')
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
    const [editMode, setEditMode] = useState(false)
    const navigate = useNavigate()

    async function refresh() {
        try {
            const [locations, totes] = await Promise.all([
                listLocations(),
                listTotes()
            ])
            setLocations(locations)
            setTotes(totes)
        } catch (error) {
            console.error('Error loading data:', error)
        }
    }

    useEffect(() => { refresh() }, [])

    async function handleCreated(_location: Location) { 
        await refresh()
    }

    async function handleUpdated(_location: Location) {
        await refresh()
        setEditMode(false)
        setSelectedLocation(null)
    }

    async function handleDelete(location: Location) {
        if (window.confirm(`Are you sure you want to delete "${location.name}"? This will remove the location association from any totes using it, but won't delete the totes themselves.`)) {
            try {
                await deleteLocation(location.id)
                await refresh()
            } catch (error) {
                console.error('Error deleting location:', error)
            }
        }
    }

    function handleToteClick(toteId: string) {
        navigate(`/totes/${toteId}`)
    }

    function openEditModal(location: Location) {
        setSelectedLocation(location)
        setEditMode(true)
        onOpen()
    }

    function closeModal() {
        onClose()
        setEditMode(false)
        setSelectedLocation(null)
    }

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase()
        if (!query) return locations
        
        return locations.filter(location => {
            // Check if location matches the search query
            const locationMatches = 
                location.id.toLowerCase().includes(query) ||
                location.name.toLowerCase().includes(query) ||
                (location.description?.toLowerCase().includes(query) ?? false)
            
            if (locationMatches) return true
            
            // Check if any totes in this location match the search query
            const locationTotes = totes.filter(tote => tote.location_id === location.id)
            const toteMatches = locationTotes.some(tote =>
                tote.id.toLowerCase().includes(query) ||
                (tote.name?.toLowerCase().includes(query) ?? false)
            )
            
            return toteMatches
        })
    }, [locations, totes, q])

    return (
        <Stack gap={6}>
            {open && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Heading size="md">
                                {editMode ? 'Edit Location' : 'Add a new location'}
                            </Heading>
                            <HStack>
                                {editMode && selectedLocation && (
                                    <IconButton
                                        size="sm"
                                        variant="ghost"
                                        colorPalette="red"
                                        onClick={() => handleDelete(selectedLocation)}
                                        aria-label="Delete location"
                                    >
                                        <FiTrash2 />
                                    </IconButton>
                                )}
                                <Button size="sm" variant="ghost" onClick={closeModal}>
                                    <FiX />
                                </Button>
                            </HStack>
                        </Box>
                        <LocationForm 
                            existing={editMode ? selectedLocation : null}
                            onCreated={(location) => { handleCreated(location); closeModal(); }} 
                            onUpdated={(location) => { handleUpdated(location); closeModal(); }}
                        />
                    </Box>
                </Box>
            )}
            
            <HStack>
                <Input 
                    placeholder="Search locations and totes by name or ID…" 
                    value={q} 
                    onChange={e => setQ(e.target.value)}
                />
                <Button colorPalette="blue" onClick={onOpen}>Add Location</Button>
            </HStack>
            
            <LocationTable 
                locations={filtered} 
                totes={totes}
                onToteClick={handleToteClick}
                onEditLocation={openEditModal}
            />
        </Stack>
    )
}