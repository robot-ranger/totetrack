import { Location, Tote } from '../types'
import ToteDetail from './ToteDetail'
import { Accordion as CAccordion, Badge, Box, HStack, Span, Text, Spacer, Flex, Button, Heading } from '@chakra-ui/react'
import { getLocationTotes } from '../api'
import { useState, useEffect } from 'react'
import { Header } from '@chakra-ui/react/dist/types/components/card/namespace'

// Temporary typing shim: Chakra's slot components can trip TS JSX children typing in some setups.
const Accordion: any = CAccordion as any

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

interface LocationTableProps {
  locations: Location[]
  totes: Tote[]
  onSelect?: (id: string) => void
  onToteClick?: (toteId: string) => void
  onEditLocation?: (location: Location) => void
}

export default function LocationTable({ locations, totes, onSelect, onToteClick, onEditLocation }: LocationTableProps) {
  const [locationTotes, setLocationTotes] = useState<Record<string, Tote[]>>({})
  const [loadingTotes, setLoadingTotes] = useState<Record<string, boolean>>({})

  const loadTotesForLocation = async (locationId: string) => {
    if (locationTotes[locationId] || loadingTotes[locationId]) return
    
    setLoadingTotes(prev => ({ ...prev, [locationId]: true }))
    try {
      const totes = await getLocationTotes(locationId)
      setLocationTotes(prev => ({ ...prev, [locationId]: totes }))
    } catch (error) {
      console.error('Error loading totes for location:', error)
      setLocationTotes(prev => ({ ...prev, [locationId]: [] }))
    } finally {
      setLoadingTotes(prev => ({ ...prev, [locationId]: false }))
    }
  }

  const getToteCountForLocation = (locationId: string) => {
    return totes.filter(tote => tote.location_id === locationId).length
  }

  const handleLocationSelect = (locationId: string) => {
    loadTotesForLocation(locationId)
  }

  return (
    <Accordion.Root variant="outline" size="md" collapsible>
      {locations.map((location) => (
        <Accordion.Item key={location.id} value={location.id}>
          <Accordion.ItemTrigger onClick={() => handleLocationSelect(location.id)}>
            <HStack flex="1" gap="3" align="center">
              <Span fontWeight="semibold">{location.name}</Span>
              <Badge variant={"subtle"} colorPalette={getRandomColorPalette(location.id)}>#{location.id.slice(-6)}</Badge>
              {location.description && (
                <Text color="fg.muted" fontSize="sm" lineClamp={1}>{location.description}</Text>
              )}
              <Spacer />
              <Badge variant="surface" colorPalette="gray">
                {getToteCountForLocation(location.id)} totes
              </Badge>
            </HStack>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <Box py={2}>
                {onEditLocation && (
                  <Box mb={4}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      colorPalette="blue"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditLocation(location)
                      }}
                    >
                      Edit Location
                    </Button>
                  </Box>
                )}
                {loadingTotes[location.id] ? (
                  <Text color="fg.muted">Loading totes...</Text>
                ) : locationTotes[location.id]?.length > 0 ? (
                  <Box>
                    <Heading size="md" mb={4}>Totes at this location</Heading>
                    {locationTotes[location.id].map((tote) => (
                      <Box 
                        key={tote.id}
                        p={3}
                        mb={3}
                        borderWidth="1px"
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => onToteClick?.(tote.id)}
                        _hover={{ bg: 'bg.subtle' }}
                      >
                        <HStack justify="space-between" align="center">
                          <HStack gap={2}>
                            <Text fontWeight="medium">{tote.name || 'Untitled Tote'}</Text>
                            <Badge variant="subtle" colorPalette={getRandomColorPalette(tote.id)}>
                              #{tote.id.slice(-6)}
                            </Badge>
                          </HStack>
                          <Badge variant="outline" colorPalette="gray">
                            {tote.items?.length ?? 0} items
                          </Badge>
                        </HStack>
                        {tote.description && (
                          <Text color="fg.muted" fontSize="sm" mt={1}>{tote.description}</Text>
                        )}
                        {tote.items?.length > 0 && (
                          <Text color="fg.muted" fontSize="sm" mt={1} lineClamp={1}>
                            Items: {tote.items.map(i => i.name).join(', ')}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Text color="fg.muted">No totes in this location</Text>
                )}
              </Box>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}