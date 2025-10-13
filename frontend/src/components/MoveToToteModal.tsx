import { useEffect, useMemo, useState } from 'react'
import { Box, Button, HStack, Heading, Input, Table, Text, VStack, Tabs } from '@chakra-ui/react'
import type { ItemWithCheckoutStatus, Tote } from '../types'
import { listTotes, updateItem } from '../api'
import ToteForm from './ToteForm'
import { FiArchive, FiPlus, FiUpload } from 'react-icons/fi'

// Temporary alias to relax Tabs typings similar to other components in this project
const T = Tabs as any

interface MoveToToteModalProps {
  item: ItemWithCheckoutStatus
  isOpen: boolean
  onClose: () => void
  onMoved?: (updatedItemId: string, newToteId: string) => void
}

export default function MoveToToteModal({ item, isOpen, onClose, onMoved }: MoveToToteModalProps) {
  const [totes, setTotes] = useState<Tote[]>([])
  const [q, setQ] = useState('')
  const [selectedToteId, setSelectedToteId] = useState<string | null>(null)
  const [tab, setTab] = useState<'existing' | 'new' | 'remove'>('existing')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedToteId(null)
      setTab('existing')
      loadTotes()
    }
  }, [isOpen])

  async function loadTotes() {
    try {
      const ts = await listTotes()
      setTotes(ts)
    } catch (e) {
      console.error('Failed to load totes', e)
    }
  }

  const filtered = useMemo(() => {
    const lower = q.toLowerCase()
    return totes.filter(t =>
      (t.name?.toLowerCase().includes(lower) || t.id.toLowerCase().includes(lower))
    )
  }, [totes, q])

  const selectedTote = selectedToteId ? totes.find(t => t.id === selectedToteId) : null

  async function handleMove() {
    if (!selectedToteId) return
    setBusy(true)
    try {
      await updateItem(item.id, { tote_id: selectedToteId })
      onMoved?.(item.id, selectedToteId)
      onClose()
    } catch (e) {
      console.error('Failed to move item', e)
    } finally {
      setBusy(false)
    }
  }

  async function handleCreatedTote(t: Tote) {
    // After creating a tote via ToteForm, move the item into it and close
    setBusy(true)
    try {
      await updateItem(item.id, { tote_id: t.id })
      onMoved?.(item.id, t.id)
      onClose()
    } catch (e) {
      console.error('Failed to move item to newly created tote', e)
    } finally {
      setBusy(false)
    }
  }

  if (!isOpen) return null

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1600}>
      <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '720px' }} p={4} boxShadow="lg">
        <HStack justifyContent="space-between" mb={3}>
          <Heading size="md">{`${tab === 'existing' || tab === 'new'
            ? `Move "${item.name}" to :`
            : `Remove "${item.name}" from Tote`}`}</Heading>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </HStack>

        <T.Root value={tab} onValueChange={(d: any) => setTab(d.value)}>
          <T.List>
            <T.Trigger value="existing"><FiArchive /> Existing Tote</T.Trigger>
            <T.Trigger value="new"><FiPlus /> New Tote</T.Trigger>
            <T.Trigger value="remove" disabled={!item.tote_id}><FiUpload /> Remove From Tote</T.Trigger>
          </T.List>

          <T.Content value="existing">
            <VStack alignItems="stretch" gap={3} mt={3}>
            <Text color={'fg.subtle'}>{`Move "${item.name}" to :`}</Text>
            <Input mb={4} placeholder="Search totes…" value={q} onChange={e => setQ(e.target.value)} />
            <Table.ScrollArea maxH="360px">
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                    <Table.ColumnHeader w="160px">Location</Table.ColumnHeader>
                    <Table.ColumnHeader w="120px" textAlign="end">Items</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filtered.map(t => {
                    const selected = selectedToteId === t.id
                    return (
                      <Table.Row
                        key={t.id}
                        onClick={() => setSelectedToteId(selected ? null : t.id)}
                        _hover={{ bg: 'bg.subtle' }}
                        bg={selected ? 'blue.50/10' : undefined}
                        cursor="pointer"
                      >
                        <Table.Cell>
                          <VStack alignItems="start" gap={0}>
                            <Text fontWeight="medium">{t.name || 'Untitled'}</Text>
                            <Text color="fg.subtle" fontSize="sm">{t.id.slice(-6)}</Text>
                          </VStack>
                        </Table.Cell>
                        <Table.Cell>{t.location_obj?.name || '—'}</Table.Cell>
                        <Table.Cell textAlign="end">{t.items?.length ?? 0}</Table.Cell>
                      </Table.Row>
                    )
                  })}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>

            <HStack justifyContent="flex-end" mt={4}>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button colorPalette="blue" disabled={!selectedTote} loading={busy} onClick={handleMove}>
                {selectedTote ? `Move to ${selectedTote.name || selectedTote.id.slice(-6)}` : 'Move to Tote'}
              </Button>
            </HStack>
            </VStack>
          </T.Content>

          <T.Content value="new">
            <VStack alignItems="stretch" gap={3} mt={3}>
              <Text color={'fg.subtle'}>{`Create a new tote and move "${item.name}" into it`}</Text>
              <ToteForm onCreated={handleCreatedTote} />
            </VStack>
          </T.Content>

          <T.Content value="remove">
            <VStack alignItems="stretch" gap={3} mt={3}>
              <Text color={'fg.subtle'}>
                {item.tote_id && `Remove "${item.name}" from its current tote. `}
                 It will no longer be associated with a tote.
              </Text>
              <HStack justifyContent="flex-end" gap={2}>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button colorPalette="red" onClick={async () => {
                  if (!item.tote_id) return
                  setBusy(true)
                  try {
                    await updateItem(item.id, { tote_id: null })
                    onMoved?.(item.id, '')
                    onClose()
                  } catch (e) {
                    console.error('Failed to remove item from tote', e)
                  } finally {
                    setBusy(false)
                  }
                }} disabled={!item.tote_id} loading={busy}>
                  Remove from Tote
                </Button>
              </HStack>
            </VStack>
          </T.Content>
        </T.Root>
      </Box>
    </Box>
  )
}
