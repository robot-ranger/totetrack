import { Item } from '../types'
import { Card, Heading, HStack, Image, Text } from '@chakra-ui/react'


export default function ItemCard({ item }: { item: Item }) {
    return (
        <Card.Root variant="outline">
            <Card.Body>
                <HStack align="start" gap={4}>
                    {item.image_url && (
                        <Image src={item.image_url} alt={item.name} boxSize="120px" objectFit="cover" borderRadius="md" />
                    )}
                    <div>
                        <Heading size="sm" mb={1}>{item.name}</Heading>
                        <Text fontSize="sm" color="gray.600">Qty: {item.quantity}</Text>
                        {item.description && <Text mt={2} whiteSpace="pre-wrap">{item.description}</Text>}
                    </div>
                </HStack>
            </Card.Body>
        </Card.Root>
    )
}