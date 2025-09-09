import { useState } from 'react'
import { QrScanner } from '@yudiel/react-qr-scanner'
import { getTote, itemsInTote } from '../api'
import type { Tote, Item } from '../types'
import ItemCard from '../components/ItemCard'
import { Box, Heading, Input, Text, SimpleGrid } from '@chakra-ui/react'


export default function ScanPage() {
    const [tote, setTote] = useState<Tote | null>(null)
    const [items, setItems] = useState<Item[]>([])
    const [error, setError] = useState<string | null>(null)


    async function load(id: string) {
        try {
            const t = await getTote(id)
            setTote(t)
            const its = await itemsInTote(id)
            setItems(its)
            setError(null)
        } catch (e) {
            setError('Tote not found')
            setTote(null)
            setItems([])
        }
    }


    return (
        <Box display="grid" gap={4}>
            <Heading size="md">Scan a tote QR</Heading>
            <Text>Point your camera at a tote label. You can also paste a UUID and press Enter.</Text>
            <Input placeholder="UUID" onKeyDown={(e) => { if (e.key === 'Enter') load((e.target as HTMLInputElement).value) }} maxW="lg" />


            <Box maxW="480px" borderWidth="1px" borderRadius="md" overflow="hidden">
                <QrScanner onDecode={(res) => load(res)} onError={(err) => setError(String(err))} />
            </Box>


            {error && <Text color="red.500">{error}</Text>}


            {tote && (
                <Box>
                    <Heading size="sm" mb={2}>{tote.name || tote.id}</Heading>
                    <Text><b>UUID:</b> {tote.id}</Text>
                    {tote.location && <Text><b>Location:</b> {tote.location}</Text>}
                    <Heading size="sm" mt={4} mb={2}>Contents</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                        {items.map(i => <ItemCard key={i.id} item={i} />)}
                    </SimpleGrid>
                    {items.length === 0 && <Text mt={2}>Empty tote.</Text>}
                </Box>
            )}
        </Box>
    )
}