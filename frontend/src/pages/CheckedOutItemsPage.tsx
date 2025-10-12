import { useEffect, useState } from 'react'
import { fetchCheckedOutItems, checkinItem } from '../api'
import type { CheckedOutItem } from '../types'
import { 
    Box, 
    Button, 
    Table, 
    Text, 
    VStack, 
    HStack,
    Badge,
    Alert,
    Heading,
    IconButton,
    Menu,
    Portal
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiMoreVertical, FiLogIn, FiTrash } from 'react-icons/fi'
import { deleteItem } from '../api'


export default function CheckedOutItemsPage() {
    const [checkedOutItems, setCheckedOutItems] = useState<CheckedOutItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadCheckedOutItems = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await fetchCheckedOutItems()
            setCheckedOutItems(data)
        } catch (err) {
            console.error('Failed to load checked out items:', err)
            setError('Failed to load checked out items')
        } finally {
            setLoading(false)
        }
    }

    const handleCheckin = async (itemId: string) => {
        try {
            await checkinItem(itemId)
            console.log('Item checked in successfully')
            // Refresh the list
            loadCheckedOutItems()
        } catch (err) {
            console.error('Failed to check in item:', err)
            setError('Failed to check in item')
        }
    }

    const handleDeleteLost = async (itemId: string) => {
        const confirmed = window.confirm('Delete this item as lost? This action cannot be undone.')
        if (!confirmed) return
        try {
            await deleteItem(itemId)
            console.log('Item deleted as lost')
            loadCheckedOutItems()
        } catch (err) {
            console.error('Failed to delete item:', err)
            setError('Failed to delete item')
        }
    }

    useEffect(() => {
        loadCheckedOutItems()
    }, [])

    if (loading) {
        return (
            <Box p={6}>
                <Text>Loading checked out items...</Text>
            </Box>
        )
    }

    return (
        <VStack align="stretch" gap={6}>
            <HStack justify="space-between">
                <Heading fontSize="xl" fontWeight="bold">
                    Checked Out Items
                </Heading>
                <Button onClick={loadCheckedOutItems} variant="outline">
                    Refresh
                </Button>
            </HStack>

            {error && (
                <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Title>Error</Alert.Title>
                    <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
            )}

            {checkedOutItems.length === 0 ? (
                <Box textAlign="center" py={8} color="fg.subtle">
                    No items are currently checked out
                </Box>
            ) : (
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Item Name</Table.ColumnHeader>
                            <Table.ColumnHeader>Tote</Table.ColumnHeader>
                            <Table.ColumnHeader>Checked Out By</Table.ColumnHeader>
                            <Table.ColumnHeader>Checked Out At</Table.ColumnHeader>
                            <Table.ColumnHeader>Actions</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {checkedOutItems.map((checkout) => (
                            <Table.Row key={checkout.id}>
                                <Table.Cell>
                                    <VStack align="start" gap={1}>
                                        <Text fontWeight="medium">{checkout.item.name}</Text>
                                        {checkout.item.description && (
                                            <Text fontSize="sm" color="gray.600">
                                                {checkout.item.description}
                                            </Text>
                                        )}
                                    </VStack>
                                </Table.Cell>
                                <Table.Cell>
                                    {checkout.item.tote_id ? (
                                        <RouterLink to={`/totes/${checkout.item.tote_id}`}>
                                            <Text color="teal.500" textDecoration="underline">
                                                {checkout.item.tote_id.slice(-6)}
                                            </Text>
                                        </RouterLink>
                                    ) : (
                                        <Text color="gray.500">—</Text>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <VStack align="start" gap={1}>
                                        <Text>{checkout.user.full_name || checkout.user.email}</Text>
                                        <Text fontSize="sm" color="gray.600">
                                            {checkout.user.email}
                                        </Text>
                                    </VStack>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontSize="sm">
                                        {new Date(checkout.checked_out_at).toLocaleString()}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell>
                                    {/* Actions menu */}
                                    {(() => {
                                        const M = Menu as any
                                        return (
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
                                                            <M.Item value="checkin" onClick={() => handleCheckin(checkout.item_id)}>
                                                                <FiLogIn />
                                                                Check In
                                                            </M.Item>
                                                            <M.Item value="delete" onClick={() => handleDeleteLost(checkout.item_id)}>
                                                                <FiTrash />
                                                                Delete (Lost)
                                                            </M.Item>
                                                        </M.Content>
                                                    </M.Positioner>
                                                </Portal>
                                            </M.Root>
                                        )
                                    })()}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}
        </VStack>
    )
}