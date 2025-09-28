import { useEffect, useState } from 'react'
import { Box, Button, Heading, Separator, Text, VStack, Flex, Badge, HStack, Spacer } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { getLocation, getLocationTotes, deleteLocation } from '../api'
import type { Location, Tote } from '../types'
import LocationForm from './LocationForm'
import { FiExternalLink, FiX } from 'react-icons/fi'
import ToteTable from './ToteTable'

// Local disclosure util (simple) to avoid pulling useDisclosure externally here.
function useSimpleDisclosure(initial = false) {
    const [open, setOpen] = useState(initial)
    return { open, onOpen: () => setOpen(true), onClose: () => setOpen(false) }
}

const colorPalettes = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink']

const getRandomColorPalette = (seed: string) => {
  // Use the location ID as a seed to ensure consistent colors for the same location
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return colorPalettes[Math.abs(hash) % colorPalettes.length]
}

export default function LocationDetails({ locationId, inList = false }: { locationId: string, inList?: boolean }) {
    const [location, setLocation] = useState<Location | null>(null)
    const [totes, setTotes] = useState<Tote[]>([])
    const [loading, setLoading] = useState(true)
    const editModal = useSimpleDisclosure()
    const delDialog = useSimpleDisclosure()

    async function load() {
        if (!locationId) return
        try {
            setLoading(true)
            const [loc, locationTotes] = await Promise.all([
                getLocation(locationId),
                getLocationTotes(locationId)
            ])
            setLocation(loc)
            setTotes(locationTotes)
        } catch (err) {
            console.error('Failed to load location data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleToteClick = (toteId: string) => {
        // This will be handled by RouterLink, so no action needed here
    }

    useEffect(() => { load() }, [locationId])

    if (!locationId) return <Text>Missing location id.</Text>

    if (loading) return <Text>Loading location details...</Text>

    return (
        <Box p={4} borderWidth="1px" borderRadius="md" borderColor="blue.focusRing">
            {location && (
                <>
                    <Flex justifyContent="space-between" alignItems="start" mb={2}>
                        <VStack alignItems="start">
                            {!inList && <Heading size="2xl" mb={2}>{location.name}</Heading>}
                            <HStack gap={2}>
                                <Badge variant={"subtle"} colorPalette={getRandomColorPalette(location.id)}>
                                    #{location.id.slice(-6)}
                                </Badge>
                                <Badge variant="surface" colorPalette="gray">
                                    {totes.length} totes
                                </Badge>
                            </HStack>
                            {location.description && <Text mt={2} whiteSpace="pre-wrap">{location.description}</Text>}
                            <Flex gap={2} mt={2}>
                                <Button size="xs" colorPalette={'blue'} variant="outline" onClick={editModal.onOpen}>Edit Location</Button>
                                <Button size="xs" colorPalette="red" variant="outline" onClick={delDialog.onOpen}>Delete Location</Button>
                            </Flex>
                        </VStack>
                        <VStack align={'end'}>
                            {inList && (
                                <RouterLink
                                    to={`/locations/${location.id}`}
                                    aria-label={`Open details for location ${location.name}`}
                                    title={location.name}
                                >
                                    <FiExternalLink />
                                </RouterLink>
                            )}
                        </VStack>
                    </Flex>
                    <Separator my={4} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Heading size="sm">Totes at this location</Heading>
                    </Box>
                    {totes.length === 0 ? (
                        <Text mt={2} color="fg.muted">No totes in this location</Text>
                    ) : (
                        <ToteTable totes={totes} onSelect={handleToteClick} inList />
                    )}
                </>
            )}

            {/* Edit Location Modal */}
            {editModal.open && location && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1500}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Heading size="md">Edit Location</Heading>
                            <Button size="sm" variant="ghost" onClick={editModal.onClose}><FiX /></Button>
                        </Box>
                        <LocationForm existing={location} onUpdated={(upd) => { setLocation(upd); editModal.onClose(); }} />
                    </Box>
                </Box>
            )}

            {/* Delete confirmation dialog */}
            {delDialog.open && location && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={2000}>
                    <Box bg="bg.canvas" borderWidth="1px" borderRadius="md" p={4} minW={{ base: '90%', md: '400px' }}>
                        <Heading size="sm" mb={2}>Delete Location?</Heading>
                        <Text mb={4}>This will permanently delete this location. Totes in this location will become unassigned. This action cannot be undone.</Text>
                        <Flex justifyContent="flex-end" gap={2}>
                            <Button variant="ghost" onClick={delDialog.onClose}>Cancel</Button>
                            <Button colorPalette="red" onClick={async () => {
                                try {
                                    await deleteLocation(location.id)
                                    delDialog.onClose()
                                    // After deletion, clear local state.
                                    setLocation(null)
                                    setTotes([])
                                } catch (e) {
                                    console.error('Failed to delete location', e)
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