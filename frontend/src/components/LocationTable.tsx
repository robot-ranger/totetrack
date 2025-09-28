import { Location, Tote } from '../types'
import { Accordion as CAccordion, Badge, Box, HStack, Span, Text, Spacer, Flex, Button } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiExternalLink } from 'react-icons/fi'
import LocationDetails from './LocationDetails'

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
  const getToteCountForLocation = (locationId: string) => {
    return totes.filter(tote => tote.location_id === locationId).length
  }

  return (
    <Accordion.Root variant="outline" size="md" collapsible>
      {locations.map((location) => (
        <Accordion.Item key={location.id} value={location.id}>
          <Accordion.ItemTrigger 
            onClick={() => onSelect?.(location.id)}
            _hover={{ bg: 'bg.muted' }}>
            <HStack flex="1" gap="3" align="center">
              <Span fontWeight="semibold">{location.name}</Span>
              <Badge variant={"subtle"} colorPalette={getRandomColorPalette(location.id)}>#{location.id.slice(-6)}</Badge>
              {location.description && (
                <Flex maxW="40ch">
                  <Text color="fg.muted" fontSize="sm" lineClamp={1}>{location.description}</Text>
                </Flex>
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
              <LocationDetails locationId={location.id} inList />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}