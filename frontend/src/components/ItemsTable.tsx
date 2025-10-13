import React, { useState } from 'react'
import { Table, Text, Badge, IconButton, Menu, Portal, Link, Box, HStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiMoreVertical, FiEdit, FiLogIn, FiLogOut, FiExternalLink, FiArrowRight } from 'react-icons/fi'
import type { ItemWithCheckoutStatus, Tote } from '../types'
import MoveToToteModal from './MoveToToteModal'

interface ItemsTableProps {
  items: ItemWithCheckoutStatus[]
  totes?: Tote[]
  onEdit?: (item: ItemWithCheckoutStatus) => void
  onCheckout?: (itemId: string) => void
  onCheckin?: (itemId: string) => void
  showToteColumn?: boolean
  showLocationColumn?: boolean
  onMoved?: () => void
}

// Temporary alias to relax Menu subcomponent typings
const M = Menu as any

export default function ItemsTable({ 
  items, 
  totes = [], 
  onEdit, 
  onCheckout, 
  onCheckin, 
  showToteColumn = true,
  showLocationColumn = true,
  onMoved,
}: ItemsTableProps) {
  const [moveItem, setMoveItem] = useState<ItemWithCheckoutStatus | null>(null)
  
  function getToteForItem(item: ItemWithCheckoutStatus) {
    if (item.tote_id) return totes.find(t => t.id === item.tote_id)
    // fallback to previous (slower) method if tote_id absent
    return totes.find(t => t.items?.some(x => x.id === item.id))
  }

  const formatToteDisplay = (tote: Tote | undefined) => {
    if (!tote) return '—'
    const shortId = tote.id.slice(-6)
    return `${tote.name || 'Untitled'} (${shortId})`
  }

  return (
    <Table.ScrollArea>
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Item</Table.ColumnHeader>
            <Table.ColumnHeader w="80px" textAlign="end">Qty</Table.ColumnHeader>
            <Table.ColumnHeader w="120px">Status</Table.ColumnHeader>
            {showToteColumn && <Table.ColumnHeader>Tote</Table.ColumnHeader>}
            {showLocationColumn && <Table.ColumnHeader>Location</Table.ColumnHeader>}
            <Table.ColumnHeader w="60px">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map(item => {
            const tote = getToteForItem(item)
            return (
              <Table.Row key={item.id} _hover={{ bg: 'bg.muted' }}>
                <Table.Cell>
                  <HStack alignItems="center" gap={3}>
                  <Box>
                  <Text fontWeight="semibold">{item.name}</Text>
                  {item.description && (
                    <Text color="fg.subtle" lineClamp={1} textWrap="wrap" fontSize="sm">
                      {item.description}
                    </Text>
                  )}</Box>
                  {!item.tote_id && <Badge colorPalette="pink" variant="surface">Orphaned</Badge>}
                  </HStack>
                </Table.Cell>
                <Table.Cell textAlign="end">{item.quantity}</Table.Cell>
                <Table.Cell>
                  {item.is_checked_out ? (
                    <Badge colorPalette="orange" variant="surface">Checked Out</Badge>
                  ) : item.tote_id ? (
                    <Badge colorPalette="green" variant="surface">In Tote</Badge>
                  ) : (
                    '—'
                  )}
                </Table.Cell>
                {showToteColumn && (
                  <Table.Cell>
                    {tote ? (
                      <Box>
                        {`${tote.name} (`}
                        <Link asChild variant="underline" color="teal.fg">
                          <RouterLink to={`/totes/${tote.id}`}>
                            {tote.id.slice(-6)} <FiExternalLink style={{ display: 'inline', verticalAlign: 'middle' }} />
                          </RouterLink>
                        </Link>
                        {`)`}
                      </Box>
                    ) : (
                      '—'
                    )}
                  </Table.Cell>
                )}
                {showLocationColumn && (
                  <Table.Cell>
                    {tote && tote.location_obj ? (
                      <Box>
                        {`${tote.location_obj.name} (`}
                        <Link asChild variant="underline" color="teal.fg">
                          <RouterLink to={`/locations/${tote.location_obj.id}`}>
                            {tote.location_obj.id.slice(-6)} <FiExternalLink style={{ display: 'inline', verticalAlign: 'middle' }} />
                          </RouterLink>
                        </Link>
                        {`)`}
                      </Box>
                    ) : (
                      '—'
                    )}
                  </Table.Cell>
                )}
                <Table.Cell>
                  <M.Root>
                    <M.Trigger asChild>
                      <IconButton size="xs" variant="ghost" aria-label="Item actions">
                        <FiMoreVertical />
                      </IconButton>
                    </M.Trigger>
                    <Portal>
                      <M.Positioner>
                        <M.Content>
                          {onEdit && (
                            <M.Item value="edit" onClick={() => onEdit?.(item)}>
                              <FiEdit />
                              Edit
                            </M.Item>
                          )}
                          {item.is_checked_out ? (
                            onCheckin && (
                              <M.Item value="checkin" onClick={() => onCheckin?.(item.id)}>
                                <FiLogIn />
                                Check In
                              </M.Item>
                            )
                          ) : (
                            onCheckout && (
                              <M.Item value="checkout" onClick={() => onCheckout?.(item.id)}>
                                <FiLogOut />
                                Check Out
                              </M.Item>
                            )
                          )}
                          <M.Item value="move" onClick={() => setMoveItem(item)}>
                            <FiArrowRight />
                            Move to ...
                          </M.Item>
                        </M.Content>
                      </M.Positioner>
                    </Portal>
                  </M.Root>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>
      {moveItem && (
        <MoveToToteModal
          item={moveItem}
          isOpen={!!moveItem}
          onClose={() => setMoveItem(null)}
          onMoved={() => { setMoveItem(null); onMoved?.() }}
        />
      )}
    </Table.ScrollArea>
  )
}