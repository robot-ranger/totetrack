import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, Button, Heading, Stack, Text, Separator, useDisclosure, Link, Table, Image, VStack, Flex } from '@chakra-ui/react'
import { getTote, itemsInTote, deleteTote } from '../api'
import type { Tote, Item } from '../types'
import ItemForm from '../components/ItemForm'
import ItemCard from '../components/ItemCard'
import QRLabel from '../components/QRLabel'

export default function ToteDetailPage() {
  const { toteId } = useParams<{ toteId: string }>()
  const navigate = useNavigate()
  const [tote, setTote] = useState<Tote | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const addModal = useDisclosure()
  const [editing, setEditing] = useState<Item | null>(null)
  const delDialog = useDisclosure()

  async function load() {
    if (!toteId) return
    const t = await getTote(toteId)
    setTote(t)
    const its = await itemsInTote(toteId)
    setItems(its)
  }

  useEffect(() => { load() }, [toteId])

  if (!toteId) return <Text>Missing tote id.</Text>

  return (
    <Stack gap={6}>
      <Box display="flex" alignItems="center" justifyContent="end" gap={4}>
        <Link href="/">Back to all totes</Link>
      </Box>
      {tote && (
        <Box p={4} borderWidth="1px" borderRadius="md">
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <VStack alignItems="start" >
              <Heading size="2xl" mb={2}>{tote.name || tote.id}</Heading>
              {tote.location && <Text><b>Location:</b> {tote.location}</Text>}
              {tote.description && <Text mt={2} whiteSpace="pre-wrap">{tote.description}</Text>}
            </VStack>
            <VStack>
              <QRLabel uuid={tote.id} compact />
              <Button size="xs" colorPalette="red" variant="outline" onClick={delDialog.onOpen}>Delete Tote</Button>
            </VStack>
          </Flex>
          <Separator my={4} />
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Heading size="sm">Items</Heading>
            <Button size="sm" colorPalette="blue" onClick={() => { setEditing(null); addModal.onOpen(); }}>Add Item</Button>
          </Box>
          {/* Items Table */}
          {items.length === 0 ? (
            <Text mt={2}>No items yet.</Text>
          ) : (
            <Table.Root size="sm" variant="line" mt={2}>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader w="110px">Photo</Table.ColumnHeader>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader w="80px">Qty</Table.ColumnHeader>
                  <Table.ColumnHeader>Description</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {items.map(it => (
                  <Table.Row key={it.id} _hover={{ bg: 'bg.muted', cursor: 'pointer' }} onClick={() => { setEditing(it); addModal.onOpen(); }}>
                    <Table.Cell>{it.image_url && <Image src={it.image_url} alt={it.name} boxSize="60px" objectFit="cover" borderRadius="md" />}</Table.Cell>
                    <Table.Cell>{it.name}</Table.Cell>
                    <Table.Cell>{it.quantity}</Table.Cell>
                    <Table.Cell>{it.description ? <Text>{it.description}</Text> : '—'}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      )}

      {addModal.open && (
        <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
          <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Heading size="md">{editing ? 'Edit Item' : 'Add Item'}</Heading>
              <Button size="sm" variant="ghost" onClick={addModal.onClose}>Close</Button>
            </Box>
            {tote && (
              <ItemForm
                toteId={tote.id}
                existing={editing}
                onCreated={(i) => { setItems(prev => [i, ...prev]); addModal.onClose(); }}
                onUpdated={(i) => {
                  setItems(prev => prev.map(p => p.id === i.id ? i : p));
                  addModal.onClose();
                  setEditing(null);
                }}
                onDeleted={(id) => {
                  setItems(prev => prev.filter(p => p.id !== id));
                  addModal.onClose();
                  setEditing(null);
                }}
              />
            )}
          </Box>
        </Box>
      )}
      {/* Delete confirmation dialog */}
      {delDialog.open && (
        <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={2000}>
          <Box bg="bg.canvas" borderWidth="1px" borderRadius="md" p={4} minW={{ base: '90%', md: '400px' }}>
            <Heading size="sm" mb={2}>Delete Tote?</Heading>
            <Text mb={4}>This will permanently delete this tote and all its items. This action cannot be undone.</Text>
            <Flex justifyContent="flex-end" gap={2}>
              <Button variant="ghost" onClick={delDialog.onClose}>Cancel</Button>
              <Button colorPalette="red" onClick={async () => {
                if (!toteId) return
                try {
                  await deleteTote(toteId)
                  navigate('/')
                } catch (e) {
                  console.error('Failed to delete tote', e)
                  delDialog.onClose()
                }
              }}>Delete</Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Stack>
  )
}
