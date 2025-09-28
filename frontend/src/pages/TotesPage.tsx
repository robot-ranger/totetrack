import { useEffect, useMemo, useState } from 'react'
import { listTotes } from '../api'
import type { Tote } from '../types'
import ToteForm from '../components/ToteForm'
import ToteTable from '../components/ToteTable'
import ItemsPage from './ItemsPage'
import { Box, Heading, Stack, Button, Text, useDisclosure, HStack, Input, Spacer, SegmentGroup, VStack, Flex, Link } from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'


export default function TotesPage() {
    const [totes, setTotes] = useState<Tote[]>([])
    const [viewMode, setViewMode] = useState<'totes' | 'items'>('totes')
    const { open, onOpen, onClose } = useDisclosure()
    const [q, setQ] = useState('')


    async function refresh() {
        const t = await listTotes()
        setTotes(t)
    }


    useEffect(() => { refresh() }, [])


    async function handleCreated(_t: Tote) { await refresh() }

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase()
        if (!query) return totes
        return totes.filter(t => (
            t.id.toLowerCase().includes(query) ||
            (t.name?.toLowerCase().includes(query) ?? false)
        ))
    }, [totes, q])


    return (
    <Stack gap={6}>
            <Heading fontSize="xl" fontWeight="bold">
                Totes
            </Heading>
            {open && (
                <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="flex-start" justifyContent="center" pt={24} zIndex={1000}>
                    <Box bg="bg.canvas" borderRadius="md" borderWidth="1px" minW={{ base: '90%', md: '640px' }} p={4} boxShadow="lg">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Heading size="md">Add a new tote</Heading>
                            <Button size="sm" variant="ghost" onClick={onClose}><FiX /></Button>
                        </Box>
                        <ToteForm onCreated={(t) => { handleCreated(t); onClose(); }} />
                    </Box>
                </Box>
            )}
            {/* Add Tote Button + Modal */}
            <VStack alignItems="start" w='full'>
                <Text textStyle='sm'>Search:</Text>
                <HStack w='full'>
                    <Input placeholder="Search by name or UUID…" value={q} onChange={e => setQ(e.target.value)}/>
                    <Button colorPalette="yellow" onClick={onOpen}>Add Tote</Button>
                </HStack>
            </VStack>
            {filtered?.length === 0 ? (
                            <Flex align="center" justify="center" p={4}>
                                <Box textAlign="center">
                                    <Heading>No totes found.</Heading>
                                    {totes.length === 0 && <Box color={"fg.subtle"}>Add your first tote to get started.</Box>}
                                </Box>
                            </Flex>
                        ) : (
            <ToteTable totes={filtered} />)}
        </Stack>
    )
}