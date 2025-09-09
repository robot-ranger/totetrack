import { Tote } from '../types'
import QRLabel from './QRLabel'
import { Table, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export default function ToteTable({ totes, onSelect }: { totes: Tote[]; onSelect?: (id: string) => void }) {
  const navigate = useNavigate()
  function handleClick(id: string) {
    if (onSelect) onSelect(id)
    navigate(`/totes/${id}`)
  }
  return (
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>UUID</Table.ColumnHeader>
            <Table.ColumnHeader>Location</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Items</Table.ColumnHeader>
            <Table.ColumnHeader>Label</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {totes.map(t => (
            <Table.Row
              key={t.id}
              _hover={{ bg: 'bg.subtle', cursor: 'pointer' }}
              onClick={() => handleClick(t.id)}
            >
              <Table.Cell>{t.name ?? '—'}</Table.Cell>
              <Table.Cell><Text>{'...' + t.id.slice(-6)}</Text></Table.Cell>
              <Table.Cell>{t.location ?? '—'}</Table.Cell>
              <Table.Cell textAlign="end">{t.items?.length ?? 0}</Table.Cell>
              <Table.Cell><QRLabel uuid={t.id} compact /></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
  )
}