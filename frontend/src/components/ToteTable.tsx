import { Tote } from '../types'
import QRLabel from './QRLabel'
import ToteDetail from './ToteDetail'
import { Accordion as CAccordion, Badge, Box, HStack, Span, Text, Spacer, Flex } from '@chakra-ui/react'

// Temporary typing shim: Chakra's slot components can trip TS JSX children typing in some setups.
const Accordion: any = CAccordion as any

export default function ToteTable({ totes, onSelect }: { totes: Tote[]; onSelect?: (id: string) => void }) {
  return (
    <Accordion.Root variant="outline" size="md" collapsible>
      {totes.map((t) => (
        <Accordion.Item key={t.id} value={t.id}>
          <Accordion.ItemTrigger onClick={() => onSelect?.(t.id)}>
            <HStack flex="1" gap="3" align="center">
              <Span fontWeight="semibold">{t.name || 'Untitled Tote'}</Span>
              <Text color="fg.muted">#{t.id.slice(-6)}</Text>
              {t.location && (
                <Badge variant="subtle" colorPalette="blue">{t.location}</Badge>
              )}
              <Text>{t.metadata_json}</Text>
              <Spacer />
              <Badge variant="surface" colorPalette="gray">{t.items?.length ?? 0} items</Badge>
              <Flex maxW="20ch">
              <Text color="fg.muted" fontSize="sm" lineClamp={1}>
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
                <Box py={2}>
                  <ToteDetail toteId={t.id} inList />
                </Box>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}