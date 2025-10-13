import { Badge, Box, HStack, IconButton, Menu, Portal, Table, Text } from '@chakra-ui/react'
import { FiEdit2, FiMoreVertical, FiTrash2, FiMail } from 'react-icons/fi'
import type { User } from '../types'

export type UsersTableProps = {
  users: User[]
  currentUserId?: string
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  onSendVerification?: (user: User) => void
}

function MoreMenu({ user, canDelete, onEdit, onDelete, onSendVerification }: { user: User; canDelete: boolean; onEdit?: (u: User) => void; onDelete?: (u: User) => void; onSendVerification?: (u: User) => void }) {
  const M = Menu as any
  return (
    <M.Root>
      <M.Trigger asChild>
        <IconButton aria-label="More actions" size="sm" variant="ghost">
          <FiMoreVertical />
        </IconButton>
      </M.Trigger>
      <Portal>
        <M.Positioner>
          <M.Content>
            <M.Item value="edit" color="fg.info" onClick={() => onEdit?.(user)}>
              <FiEdit2 style={{ marginRight: 8 }} /> Edit User
            </M.Item>
            {!user.is_verified && (
              <M.Item value="send-verification" onClick={() => onSendVerification?.(user)}>
                <FiMail style={{ marginRight: 8 }} /> Send Verification Email
              </M.Item>
            )}
            {canDelete && (
              <M.Item value="delete" color="fg.error" onClick={() => onDelete?.(user)}>
                <FiTrash2 style={{ marginRight: 8 }} /> Delete User
              </M.Item>
            )}
          </M.Content>
        </M.Positioner>
      </Portal>
    </M.Root>
  )
}

export default function UsersTable({ users, currentUserId, onEdit, onDelete, onSendVerification }: UsersTableProps) {
  return (
    <Box overflowX="auto">
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Email</Table.ColumnHeader>
            <Table.ColumnHeader>Full Name</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Role</Table.ColumnHeader>
            <Table.ColumnHeader>Created</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user) => {
            const canDelete = user.id !== currentUserId
            return (
              <Table.Row key={user.id}>
                <Table.Cell>
                  <Text fontWeight="medium">{user.email}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>{user.full_name || '-'}</Text>
                </Table.Cell>
                <Table.Cell>
                    <HStack gap={2}>
                  <Badge colorPalette={user.is_active ? 'green' : 'red'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge colorPalette={user.is_verified ? 'green' : 'orange'}>
                      {user.is_verified ? 'Verified' : 'Unverified'}
                    </Badge></HStack>
                </Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={user.is_superuser ? 'purple' : 'gray'}>
                    {user.is_superuser ? 'Superuser' : 'User'}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="sm" color="gray.600">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <MoreMenu user={user} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} onSendVerification={onSendVerification} />
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}
