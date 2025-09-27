import React from 'react'
import { Table, Text, Badge, IconButton, Menu, Portal, Link, Box } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiMoreVertical, FiEdit, FiLogIn, FiLogOut, FiExternalLink } from 'react-icons/fi'
import type { ItemWithCheckoutStatus, Tote } from '../types'

interface ItemsTableProps {
  items: ItemWithCheckoutStatus[]
  totes?: Tote[]
  onEdit?: (item: ItemWithCheckoutStatus) => void
  onCheckout?: (itemId: string) => void
  onCheckin?: (itemId: string) => void
  showToteColumn?: boolean
  showLocationColumn?: boolean
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
  showLocationColumn = true 
}: ItemsTableProps) {
  
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
                  <Text fontWeight="semibold">{item.name}</Text>
                  {item.description && (
                    <Text color="fg.subtle" lineClamp={1} textWrap="wrap" fontSize="sm">
                      {item.description}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell textAlign="end">{item.quantity}</Table.Cell>
                <Table.Cell>
                  {item.is_checked_out ? (
                    <Badge colorPalette="orange" variant="subtle">
                      Checked Out
                    </Badge>
                  ) : (
                    <Badge colorPalette="green" variant="subtle">
                      In Tote
                    </Badge>
                  )}
                </Table.Cell>
                {showToteColumn && (
                  <Table.Cell>
                    {tote ? (
                        <Box>{`${tote.name} (`}
                      <Link asChild variant="underline" color="teal.500">
                        <RouterLink to={`/totes/${tote.id}`}>
                           
                          {tote.id.slice(-6)}
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
                    {tote?.location_obj?.name || tote?.location || '—'}
                  </Table.Cell>
                )}
                <Table.Cell>
                  <M.Root>
                    <M.Trigger asChild>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label="Item actions"
                      >
                        <FiMoreVertical />
                      </IconButton>
                    </M.Trigger>
                    <Portal>
                      <M.Positioner>
                        <M.Content>
                          {onEdit && (
                            <M.Item 
                              value="edit"
                              onClick={() => onEdit(item)}
                            >
                              <FiEdit />
                              Edit
                            </M.Item>
                          )}
                          {item.is_checked_out ? (
                            onCheckin && (
                              <M.Item 
                                value="checkin"
                                onClick={() => onCheckin(item.id)}
                              >
                                <FiLogIn />
                                Check In
                              </M.Item>
                            )
                          ) : (
                            onCheckout && (
                              <M.Item 
                                value="checkout"
                                onClick={() => onCheckout(item.id)}
                              >
                                <FiLogOut />
                                Check Out
                              </M.Item>
                            )
                          )}
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
    </Table.ScrollArea>
  )
}