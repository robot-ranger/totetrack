import { Tote } from '../types'
import QRLabel from './QRLabel'
import ToteDetail from './ToteDetail'
import { Accordion as CAccordion, Badge, Box, HStack, Span, Text, Spacer, Flex } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

// Temporary typing shim: Chakra's slot components can trip TS JSX children typing in some setups.
const Accordion: any = CAccordion as any

const colorPalettes = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink']

const getRandomColorPalette = (seed: string) => {
  // Use the tote ID as a seed to ensure consistent colors for the same tote
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return colorPalettes[Math.abs(hash) % colorPalettes.length]
}

export default function ToteTable({ totes, onSelect, inList = false }: { totes: Tote[]; onSelect?: (id: string) => void; inList?: boolean }) {
  const navigate = useNavigate()
  
  return (
    <Accordion.Root variant="outline" size="md" collapsible>
      {totes.map((t) => (
        <Accordion.Item key={t.id} value={t.id}>
          <Accordion.ItemTrigger 
            onClick={() => inList ? navigate(`/totes/${t.id}`) : onSelect?.(t.id)}
            _hover={{ bg: 'bg.muted' }}
          >
            <HStack flex="1" gap="3" align="center">
              <Span fontWeight="semibold">{t.name || 'Untitled Tote'}</Span>
              <Badge variant={"subtle"} colorPalette={getRandomColorPalette(t.id)}>#{t.id.slice(-6)}</Badge>
              {t.location && (
                <Badge variant="subtle" colorPalette={getRandomColorPalette(t.location + t.id)}>{t.location}</Badge>
              )}
              <Text lineClamp={1}>{t.metadata_json}</Text>
              <Spacer />
              <Badge variant="surface" colorPalette="gray">{t.items?.length ?? 0} items</Badge>
              <Flex maxW="20ch">
              <Text color="fg.muted" fontSize="sm" lineClamp={1} display={{ base: 'none', md: 'flex' }}>
                {t.items?.length > 0 ? 
                  t.items.map(i => i.name).join(', ') : 'No items'}</Text></Flex>
              
              {/* <Box display={{ base: 'none', md: 'block' }}>
                <QRLabel uuid={t.id} compact />
              </Box> */}
            </HStack>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <ToteDetail toteId={t.id} inList />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}