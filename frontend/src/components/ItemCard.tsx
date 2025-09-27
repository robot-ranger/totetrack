import { ItemWithCheckoutStatus } from '../types'
import { checkoutItem, checkinItem } from '../api'
import { Card, Heading, HStack, Image, Text, Button, Badge, VStack } from '@chakra-ui/react'
import { useState } from 'react'


export default function ItemCard({ 
    item, 
    onItemUpdated 
}: { 
    item: ItemWithCheckoutStatus
    onItemUpdated?: () => void
}) {
    const [loading, setLoading] = useState(false)

    const handleCheckout = async () => {
        try {
            setLoading(true)
            await checkoutItem(item.id)
            console.log('Item checked out successfully')
            onItemUpdated?.()
        } catch (err) {
            console.error('Failed to checkout item:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCheckin = async () => {
        try {
            setLoading(true)
            await checkinItem(item.id)
            console.log('Item checked in successfully')
            onItemUpdated?.()
        } catch (err) {
            console.error('Failed to checkin item:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card.Root variant="outline">
            <Card.Body>
                <VStack align="stretch" gap={4}>
                    <HStack align="start" gap={4}>
                        {item.image_url && (
                            <Image src={item.image_url} alt={item.name} boxSize="120px" objectFit="cover" borderRadius="md" />
                        )}
                        <VStack align="start" flex={1} gap={2}>
                            <HStack justify="space-between" w="full">
                                <Heading size="sm">{item.name}</Heading>
                                {item.is_checked_out && (
                                    <Badge colorScheme="orange">Checked Out</Badge>
                                )}
                            </HStack>
                            <Text fontSize="sm" color="gray.600">Qty: {item.quantity}</Text>
                            {item.description && <Text whiteSpace="pre-wrap">{item.description}</Text>}
                            {item.is_checked_out && item.checked_out_by && (
                                <Text fontSize="sm" color="gray.500">
                                    Checked out by: {item.checked_out_by.full_name || item.checked_out_by.email}
                                    {item.checked_out_at && (
                                        <> on {new Date(item.checked_out_at).toLocaleDateString()}</>
                                    )}
                                </Text>
                            )}
                        </VStack>
                    </HStack>
                    
                    <HStack justify="end">
                        {item.is_checked_out ? (
                            <Button 
                                size="sm" 
                                colorScheme="green" 
                                onClick={handleCheckin}
                                loading={loading}
                            >
                                Check In
                            </Button>
                        ) : (
                            <Button 
                                size="sm" 
                                colorScheme="blue" 
                                onClick={handleCheckout}
                                loading={loading}
                            >
                                Check Out
                            </Button>
                        )}
                    </HStack>
                </VStack>
            </Card.Body>
        </Card.Root>
    )
}